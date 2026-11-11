import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { agruparItens } from '../carrinho/agrupar-itens';
import {
  calcularSalto,
  montarPagina,
  Pagina,
  PaginacaoDto,
} from '../comum/dto/paginacao.dto';
import { Papel } from '../comum/tipos/papel.enum';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { arredondar } from '../comum/utils/valores';
import { precoFinal, subtotal } from '../produtos/precos';
import { ProdutosService } from '../produtos/produtos.service';
import { StatusProduto } from '../produtos/status-produto.enum';
import { CriarPedidoDto, ListarPedidosDto } from './dto/pedido.dto';
import { Pedido } from './pedido.entity';
import {
  SEQUENCIA_STATUS,
  StatusPagamento,
  StatusPedido,
} from './pedido.enums';
import { PedidosRepository } from './pedidos.repository';
import { SemEstoqueException } from './sem-estoque.exception';

@Injectable()
export class PedidosService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pedidosRepository: PedidosRepository,
    private readonly produtosService: ProdutosService,
  ) {}

  // Pedido + itens + baixa de estoque dependem uns dos outros: ou dá tudo
  // certo, ou nada é gravado. Qualquer exceção dentro da transação faz
  // ROLLBACK (inclusive o estoque que já tinha sido baixado).
  criar(dto: CriarPedidoDto, usuario: UsuarioToken): Promise<Pedido> {
    const itens = agruparItens(dto.itens);

    return this.dataSource.transaction(async (manager) => {
      const produtos = await this.produtosService.buscarVarios(
        itens.map((i) => i.produtoId),
        manager,
      );
      const porId = new Map(produtos.map((p) => [p.id, p]));

      // 1) todos os produtos existem e estão à venda?
      for (const item of itens) {
        const produto = porId.get(item.produtoId);
        if (!produto || produto.status !== StatusProduto.ATIVO) {
          throw new NotFoundException(
            `Produto ${item.produtoId} não encontrado ou indisponível.`,
          );
        }
      }

      // 2) baixa o estoque (o UPDATE só passa se ainda houver unidades)
      for (const item of itens) {
        const produto = porId.get(item.produtoId)!;
        const baixou = await this.produtosService.baixarEstoque(
          produto.id,
          item.quantidade,
          manager,
        );
        if (!baixou) {
          throw new SemEstoqueException(
            produto.nome,
            produto.estoque,
            item.quantidade,
          );
        }
      }

      // 3) preços SEMPRE do banco, nunca do navegador
      const itensDoPedido = itens.map((item) => {
        const produto = porId.get(item.produtoId)!;
        return {
          produto,
          nomeProduto: produto.nome,
          imagem: produto.imagem,
          categoriaId: produto.categoriaId,
          categoriaNome: produto.categoria?.nome ?? null,
          quantidade: item.quantidade,
          precoOriginal: produto.preco,
          precoUnitario: precoFinal(produto),
          subtotal: subtotal(produto, item.quantidade),
        };
      });

      const total = arredondar(
        itensDoPedido.reduce((soma, i) => soma + i.subtotal, 0),
      );

      const pedido = await this.pedidosRepository.criar(
        {
          // o dono do pedido vem do token, não do corpo da requisição
          usuarioId: usuario.sub,
          clienteNome: dto.nome,
          telefone: dto.telefone,
          cep: dto.cep,
          endereco: dto.endereco,
          cidade: dto.cidade,
          formaPagamento: dto.formaPagamento,
          status: StatusPedido.AGUARDANDO_PAGAMENTO,
          statusPagamento: StatusPagamento.PENDENTE,
          total,
          itens: itensDoPedido,
        },
        manager,
      );

      return (await this.pedidosRepository.buscarPorId(pedido.id, manager))!;
    });
  }

  async listarMeus(
    usuario: UsuarioToken,
    paginacao: PaginacaoDto,
  ): Promise<Pagina<Pedido>> {
    const { skip, take } = calcularSalto(paginacao);
    const [itens, total] = await this.pedidosRepository.listarDoUsuario(
      usuario.sub,
      skip,
      take,
    );
    return montarPagina(itens, total, paginacao);
  }

  async listarTodos(filtros: ListarPedidosDto): Promise<Pagina<Pedido>> {
    const [itens, total] = await this.pedidosRepository.listarTodos({
      busca: filtros.busca,
      status: filtros.status,
      ...calcularSalto(filtros),
    });
    return montarPagina(itens, total, filtros);
  }

  // "Este recurso é seu?" — conferido aqui, porque o guard não sabe de
  // quem é o pedido. Pedido de outro cliente responde 404 (e não 403)
  // para nem confirmar que aquele número existe.
  async buscar(id: number, usuario: UsuarioToken): Promise<Pedido> {
    const pedido = await this.pedidosRepository.buscarPorId(id);
    const ehDono = pedido?.usuarioId === usuario.sub;

    if (!pedido || (!ehDono && usuario.papel !== Papel.ADMIN)) {
      throw new NotFoundException(`Pedido ${id} não encontrado.`);
    }

    return pedido;
  }

  atualizarStatus(id: number, novoStatus: StatusPedido): Promise<Pedido> {
    return this.dataSource.transaction(async (manager) => {
      const pedido = await this.pedidosRepository.buscarPorId(id, manager);
      if (!pedido) {
        throw new NotFoundException(`Pedido ${id} não encontrado.`);
      }

      this.validarTransicao(pedido.status, novoStatus);

      // cancelou: as unidades voltam para o estoque
      if (novoStatus === StatusPedido.CANCELADO) {
        for (const item of pedido.itens) {
          if (item.produtoId) {
            await this.produtosService.devolverEstoque(
              item.produtoId,
              item.quantidade,
              manager,
            );
          }
        }
      }

      await this.pedidosRepository.atualizarStatus(
        id,
        novoStatus,
        this.statusPagamentoPara(novoStatus),
        manager,
      );

      return (await this.pedidosRepository.buscarPorId(id, manager))!;
    });
  }

  // A esteira só anda uma casa por vez; cancelar pode a qualquer
  // momento, menos depois de entregue.
  private validarTransicao(atual: StatusPedido, novo: StatusPedido) {
    if (atual === StatusPedido.CANCELADO) {
      throw new UnprocessableEntityException(
        'Pedido cancelado não pode mudar de status.',
      );
    }

    if (novo === StatusPedido.CANCELADO) {
      if (atual === StatusPedido.ENTREGUE) {
        throw new UnprocessableEntityException(
          'Pedido já entregue não pode ser cancelado.',
        );
      }
      return;
    }

    const proximo = SEQUENCIA_STATUS[SEQUENCIA_STATUS.indexOf(atual) + 1];
    if (novo !== proximo) {
      throw new UnprocessableEntityException(
        proximo
          ? `Transição de status inválida: ${atual} -> ${novo}. O próximo status é ${proximo}.`
          : `Pedido já está em ${atual}, o último status.`,
      );
    }
  }

  // o status do pagamento acompanha o do pedido automaticamente
  private statusPagamentoPara(status: StatusPedido): StatusPagamento {
    if (status === StatusPedido.CANCELADO) return StatusPagamento.CANCELADO;
    if (status === StatusPedido.AGUARDANDO_PAGAMENTO)
      return StatusPagamento.PENDENTE;
    return StatusPagamento.APROVADO;
  }
}
