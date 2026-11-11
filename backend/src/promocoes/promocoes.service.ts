import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CategoriasService } from '../categorias/categorias.service';
import { Papel } from '../comum/tipos/papel.enum';
import type { UsuarioToken } from '../comum/tipos/usuario-token.interface';
import { arredondar, hojeLocal } from '../comum/utils/valores';
import { Produto } from '../produtos/produto.entity';
import { ProdutosService } from '../produtos/produtos.service';
import {
  AtualizarPromocaoDto,
  CriarPromocaoDto,
  PromocaoRespostaDto,
  SituacaoPromocao,
} from './dto/promocao.dto';
import { Promocao } from './promocao.entity';
import { AlvoPromocao, TipoDesconto } from './promocao.enums';
import { PromocoesRepository } from './promocoes.repository';

// Mesma ideia da primeira etapa: quando uma promoção passa a valer, ela
// grava o preço promocional nos produtos que alcança; quando deixa de
// valer (desativada ou excluída), devolve o preço normal. Agora isso
// acontece numa transação e, ao tirar uma promoção, as outras que ainda
// valem para os mesmos produtos são aplicadas de novo.
@Injectable()
export class PromocoesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly promocoesRepository: PromocoesRepository,
    private readonly produtosService: ProdutosService,
    private readonly categoriasService: CategoriasService,
  ) {}

  estaValendo(promocao: Promocao, hoje = hojeLocal()): boolean {
    return (
      promocao.ativa && promocao.dataInicio <= hoje && hoje <= promocao.dataFim
    );
  }

  async listar(
    situacao: SituacaoPromocao,
    usuario?: UsuarioToken,
  ): Promise<PromocaoRespostaDto[]> {
    if (situacao === SituacaoPromocao.TODAS && usuario?.papel !== Papel.ADMIN) {
      throw new ForbiddenException(
        'Somente administradores podem ver promoções fora do período.',
      );
    }

    const promocoes =
      situacao === SituacaoPromocao.TODAS
        ? await this.promocoesRepository.listar()
        : await this.promocoesRepository.listarValendo(hojeLocal());

    // uma consulta só para contar os produtos de todas as categorias (sem N+1)
    const categorias = await this.categoriasService.listar();
    const produtosPorCategoria = new Map(
      categorias.map((c) => [c.id, c.quantidadeProdutos]),
    );

    return promocoes.map((promocao) => ({
      ...promocao,
      valendo: this.estaValendo(promocao),
      quantidadeProdutos:
        promocao.alvo === AlvoPromocao.PRODUTO
          ? promocao.produto
            ? 1
            : 0
          : (produtosPorCategoria.get(promocao.categoriaId ?? 0) ?? 0),
    }));
  }

  async buscar(
    id: number,
    usuario?: UsuarioToken,
  ): Promise<PromocaoRespostaDto> {
    const promocao = await this.promocoesRepository.buscarPorId(id);

    // fora do período ela só existe para o admin
    if (
      !promocao ||
      (!this.estaValendo(promocao) && usuario?.papel !== Papel.ADMIN)
    ) {
      throw new NotFoundException(`Promoção ${id} não encontrada.`);
    }

    return this.montarResposta(promocao);
  }

  criar(dto: CriarPromocaoDto): Promise<PromocaoRespostaDto> {
    return this.dataSource.transaction(async (manager) => {
      const promocao = Object.assign(new Promocao(), { ativa: true, ...dto });
      await this.validarEAjustarAlvo(promocao, manager);

      const salva = await this.promocoesRepository.criar(promocao, manager);

      if (this.estaValendo(salva)) {
        await this.aplicar(salva, manager);
      }

      return this.montarResposta(salva, manager);
    });
  }

  atualizar(
    id: number,
    dto: AtualizarPromocaoDto,
  ): Promise<PromocaoRespostaDto> {
    return this.dataSource.transaction(async (manager) => {
      const promocao = await this.buscarEntidade(id, manager);

      // tira o efeito antigo antes de mudar (valor, datas ou alvo podem mudar)
      if (this.estaValendo(promocao)) {
        await this.limpar(promocao, manager);
      }

      Object.assign(promocao, dto);
      await this.validarEAjustarAlvo(promocao, manager);
      const salva = await this.promocoesRepository.salvar(promocao, manager);

      if (this.estaValendo(salva)) {
        await this.aplicar(salva, manager);
      }

      return this.montarResposta(salva, manager);
    });
  }

  remover(id: number): Promise<void> {
    return this.dataSource.transaction(async (manager) => {
      const promocao = await this.buscarEntidade(id, manager);
      await this.promocoesRepository.remover(id, manager);

      // apaga primeiro: assim o limpar já não reaplica esta promoção
      if (this.estaValendo(promocao)) {
        await this.limpar(promocao, manager);
      }
    });
  }

  // quanto fica o preço do produto com esta promoção (nunca negativo)
  calcularPreco(
    produto: Pick<Produto, 'preco'>,
    promocao: Pick<Promocao, 'tipo' | 'valor'>,
  ): number {
    const novoPreco =
      promocao.tipo === TipoDesconto.PORCENTAGEM
        ? produto.preco - (produto.preco * promocao.valor) / 100
        : produto.preco - promocao.valor;

    // R$ 0,00 viraria "sem promoção" na loja, por isso o mínimo é 1 centavo
    return Math.max(0.01, arredondar(novoPreco));
  }

  private async buscarEntidade(
    id: number,
    manager: EntityManager,
  ): Promise<Promocao> {
    const promocao = await this.promocoesRepository.buscarPorId(id, manager);
    if (!promocao) {
      throw new NotFoundException(`Promoção ${id} não encontrada.`);
    }
    return promocao;
  }

  // regras que dependem de mais de um campo (valem para POST e PATCH)
  private async validarEAjustarAlvo(
    promocao: Promocao,
    manager: EntityManager,
  ) {
    if (promocao.tipo === TipoDesconto.PORCENTAGEM && promocao.valor > 100) {
      throw new UnprocessableEntityException(
        'A porcentagem não pode passar de 100.',
      );
    }

    if (promocao.dataFim < promocao.dataInicio) {
      throw new UnprocessableEntityException(
        'A data de término precisa ser igual ou depois da data de início.',
      );
    }

    // a relação carregada tem prioridade sobre a coluna no TypeORM,
    // então ajustamos as duas juntas
    if (promocao.alvo === AlvoPromocao.CATEGORIA) {
      if (!promocao.categoriaId) {
        throw new UnprocessableEntityException(
          'Informe categoriaId para uma promoção de categoria.',
        );
      }
      promocao.categoria = await this.categoriasService.buscarEntidade(
        promocao.categoriaId,
      );
      promocao.produto = null;
      promocao.produtoId = null;
    } else {
      if (!promocao.produtoId) {
        throw new UnprocessableEntityException(
          'Informe produtoId para uma promoção de produto.',
        );
      }
      const [produto] = await this.produtosService.buscarVarios(
        [promocao.produtoId],
        manager,
      );
      if (!produto) {
        throw new NotFoundException(
          `Produto ${promocao.produtoId} não encontrado.`,
        );
      }
      promocao.produto = produto;
      promocao.categoria = null;
      promocao.categoriaId = null;
    }
  }

  private produtosAlcancados(
    promocao: Promocao,
    manager?: EntityManager,
  ): Promise<Produto[]> {
    if (promocao.alvo === AlvoPromocao.PRODUTO) {
      return this.produtosService.buscarVarios(
        promocao.produtoId ? [promocao.produtoId] : [],
        manager,
      );
    }
    return this.produtosService.buscarDaCategoria(
      promocao.categoriaId ?? 0,
      manager,
    );
  }

  private async aplicar(promocao: Promocao, manager: EntityManager) {
    for (const produto of await this.produtosAlcancados(promocao, manager)) {
      await this.produtosService.definirPrecoPromocional(
        produto.id,
        this.calcularPreco(produto, promocao),
        manager,
      );
    }
  }

  private async limpar(promocao: Promocao, manager: EntityManager) {
    for (const produto of await this.produtosAlcancados(promocao, manager)) {
      await this.produtosService.definirPrecoPromocional(
        produto.id,
        null,
        manager,
      );
    }

    // outras promoções que continuam valendo voltam a ser aplicadas
    const outras = await this.promocoesRepository.listarValendo(
      hojeLocal(),
      manager,
    );
    for (const outra of outras) {
      if (outra.id !== promocao.id) {
        await this.aplicar(outra, manager);
      }
    }
  }

  private async montarResposta(
    promocao: Promocao,
    manager?: EntityManager,
  ): Promise<PromocaoRespostaDto> {
    const completa =
      (await this.promocoesRepository.buscarPorId(promocao.id, manager)) ??
      promocao;
    const alcancados = await this.produtosAlcancados(completa, manager);

    return {
      ...completa,
      valendo: this.estaValendo(completa),
      quantidadeProdutos: alcancados.length,
    };
  }
}
