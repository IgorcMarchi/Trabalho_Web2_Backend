import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CategoriasService } from '../categorias/categorias.service';
import {
  calcularSalto,
  montarPagina,
  Pagina,
} from '../comum/dto/paginacao.dto';
import { Papel } from '../comum/tipos/papel.enum';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import {
  AtualizarProdutoDto,
  CriarProdutoDto,
  FiltroStatusProduto,
  ListarProdutosDto,
  ProdutoDetalheDto,
} from './dto/produto.dto';
import { Produto } from './produto.entity';
import { ProdutosRepository } from './produtos.repository';
import { StatusProduto } from './status-produto.enum';

@Injectable()
export class ProdutosService {
  constructor(
    private readonly produtosRepository: ProdutosRepository,
    private readonly categoriasService: CategoriasService,
  ) {}

  async listar(
    filtros: ListarProdutosDto,
    usuario?: UsuarioToken,
  ): Promise<Pagina<Produto>> {
    // a loja só enxerga produtos ativos; inativos são assunto do painel
    if (
      filtros.status !== FiltroStatusProduto.ATIVO &&
      !this.ehAdmin(usuario)
    ) {
      throw new ForbiddenException(
        'Somente administradores podem listar produtos inativos.',
      );
    }

    const status =
      filtros.status === FiltroStatusProduto.TODOS
        ? undefined
        : (filtros.status as unknown as StatusProduto);

    const [itens, total] = await this.produtosRepository.listar({
      busca: filtros.busca,
      categoriaId: filtros.categoriaId,
      status,
      emPromocao: filtros.emPromocao,
      ...calcularSalto(filtros),
    });

    return montarPagina(itens, total, filtros);
  }

  async buscar(id: number, usuario?: UsuarioToken): Promise<ProdutoDetalheDto> {
    const produto = await this.buscarEntidade(id);

    // produto inativo não existe para quem não é admin
    if (produto.status !== StatusProduto.ATIVO && !this.ehAdmin(usuario)) {
      throw new NotFoundException(`Produto ${id} não encontrado.`);
    }

    const resumo = await this.produtosRepository.resumoAvaliacoes(id);
    return {
      ...produto,
      mediaAvaliacoes: resumo.media,
      totalAvaliacoes: resumo.total,
    };
  }

  // usado por outros services (lista de desejos, avaliações...)
  async buscarEntidade(id: number): Promise<Produto> {
    const produto = await this.produtosRepository.buscarPorId(id);
    if (!produto) {
      throw new NotFoundException(`Produto ${id} não encontrado.`);
    }
    return produto;
  }

  // produto que o cliente pode comprar, favoritar ou avaliar
  async buscarAtivo(id: number): Promise<Produto> {
    const produto = await this.buscarEntidade(id);
    if (produto.status !== StatusProduto.ATIVO) {
      throw new NotFoundException(
        `Produto ${id} não encontrado ou indisponível.`,
      );
    }
    return produto;
  }

  async criar(dto: CriarProdutoDto): Promise<Produto> {
    const categoria = await this.categoriasService.buscarEntidade(
      dto.categoriaId,
    );
    const precoPromocional = this.normalizarPromocao(dto.precoPromocional);
    this.validarPrecos(dto.preco, precoPromocional);

    const criado = await this.produtosRepository.criar({
      ...dto,
      precoPromocional,
      categoria,
      status: dto.status ?? StatusProduto.ATIVO,
      estoque: dto.estoque ?? 0,
    });

    return this.buscarEntidade(criado.id);
  }

  // PATCH seguro: busca antes (garante o 404), aplica só o que veio e salva
  async atualizar(id: number, dto: AtualizarProdutoDto): Promise<Produto> {
    const produto = await this.buscarEntidade(id);

    if (
      dto.categoriaId !== undefined &&
      dto.categoriaId !== produto.categoriaId
    ) {
      produto.categoria = await this.categoriasService.buscarEntidade(
        dto.categoriaId,
      );
    }

    const { precoPromocional, ...resto } = dto;
    Object.assign(produto, resto);

    if (precoPromocional !== undefined) {
      produto.precoPromocional = this.normalizarPromocao(precoPromocional);
    }

    // a regra vale para o resultado final (ex.: baixou o preço abaixo da promoção)
    this.validarPrecos(produto.preco, produto.precoPromocional);

    await this.produtosRepository.salvar(produto);
    return this.buscarEntidade(id);
  }

  async remover(id: number): Promise<void> {
    // confere antes de mudar: produto já excluído não aparece na busca,
    // então o segundo DELETE responde 404 (o softDelete sozinho marcaria de novo)
    await this.buscarEntidade(id);
    await this.produtosRepository.excluir(id);
  }

  // ---- Usados por outros services (pedidos, carrinho, promoções). ----
  // Quando vem um manager, a operação participa da transação de quem chamou.

  buscarVarios(ids: number[], manager?: EntityManager): Promise<Produto[]> {
    return this.produtosRepository.buscarPorIds(ids, manager);
  }

  buscarDaCategoria(
    categoriaId: number,
    manager?: EntityManager,
  ): Promise<Produto[]> {
    return this.produtosRepository.buscarPorCategoria(categoriaId, manager);
  }

  baixarEstoque(
    id: number,
    quantidade: number,
    manager: EntityManager,
  ): Promise<boolean> {
    return this.produtosRepository.baixarEstoque(id, quantidade, manager);
  }

  devolverEstoque(
    id: number,
    quantidade: number,
    manager: EntityManager,
  ): Promise<void> {
    return this.produtosRepository.devolverEstoque(id, quantidade, manager);
  }

  definirPrecoPromocional(
    id: number,
    precoPromocional: number | null,
    manager?: EntityManager,
  ): Promise<void> {
    return this.produtosRepository.atualizarPrecoPromocional(
      id,
      precoPromocional,
      manager,
    );
  }

  private ehAdmin(usuario?: UsuarioToken): boolean {
    return usuario?.papel === Papel.ADMIN;
  }

  // 0 no formulário quer dizer "sem promoção"
  private normalizarPromocao(valor?: number | null): number | null {
    return valor && valor > 0 ? valor : null;
  }

  private validarPrecos(preco: number, precoPromocional: number | null) {
    if (precoPromocional !== null && precoPromocional >= preco) {
      throw new UnprocessableEntityException(
        'O preço promocional precisa ser menor que o preço normal.',
      );
    }
  }
}
