import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EntityManager,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { Avaliacao } from '../avaliacoes/avaliacao.entity';
import { Produto } from './produto.entity';
import { StatusProduto } from './status-produto.enum';

export interface FiltrosProdutos {
  busca?: string;
  categoriaId?: number;
  status?: StatusProduto;
  emPromocao?: boolean;
  skip: number;
  take: number;
}

@Injectable()
export class ProdutosRepository {
  constructor(
    @InjectRepository(Produto)
    private readonly repositorio: Repository<Produto>,
  ) {}

  // Dentro de uma transação, todo acesso precisa passar pelo manager dela
  private repo(manager?: EntityManager): Repository<Produto> {
    return manager ? manager.getRepository(Produto) : this.repositorio;
  }

  // Filtra, ordena e pagina NO BANCO (nunca busca tudo para filtrar em JS)
  listar(filtros: FiltrosProdutos): Promise<[Produto[], number]> {
    const where: FindOptionsWhere<Produto> = {};

    if (filtros.busca) where.nome = ILike(`%${filtros.busca}%`);
    if (filtros.categoriaId) where.categoriaId = filtros.categoriaId;
    if (filtros.status) where.status = filtros.status;
    if (filtros.emPromocao) where.precoPromocional = Not(IsNull());

    return this.repositorio.findAndCount({
      where,
      relations: { categoria: true },
      order: { id: 'ASC' },
      skip: filtros.skip,
      take: filtros.take,
    });
  }

  buscarPorId(id: number, manager?: EntityManager): Promise<Produto | null> {
    return this.repo(manager).findOne({
      where: { id },
      relations: { categoria: true },
    });
  }

  buscarPorIds(ids: number[], manager?: EntityManager): Promise<Produto[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.repo(manager).find({
      where: { id: In(ids) },
      relations: { categoria: true },
    });
  }

  buscarPorCategoria(
    categoriaId: number,
    manager?: EntityManager,
  ): Promise<Produto[]> {
    return this.repo(manager).find({ where: { categoriaId } });
  }

  criar(dados: Partial<Produto>): Promise<Produto> {
    return this.repositorio.save(this.repositorio.create(dados));
  }

  salvar(produto: Produto, manager?: EntityManager): Promise<Produto> {
    return this.repo(manager).save(produto);
  }

  async atualizarPrecoPromocional(
    id: number,
    precoPromocional: number | null,
    manager?: EntityManager,
  ): Promise<void> {
    await this.repo(manager).update(id, { precoPromocional });
  }

  // soft delete: preenche excluido_em, o registro continua no banco
  async excluir(id: number): Promise<number> {
    const resultado = await this.repositorio.softDelete(id);
    return resultado.affected ?? 0;
  }

  // Baixa o estoque só se ainda houver unidades suficientes.
  // A condição "estoque >= quantidade" no próprio UPDATE impede que duas
  // compras simultâneas vendam a mesma última unidade.
  async baixarEstoque(
    id: number,
    quantidade: number,
    manager: EntityManager,
  ): Promise<boolean> {
    const resultado = await manager
      .createQueryBuilder()
      .update(Produto)
      .set({ estoque: () => 'estoque - :quantidade' })
      .where('id = :id AND estoque >= :quantidade', { id, quantidade })
      .execute();
    return resultado.affected === 1;
  }

  async devolverEstoque(
    id: number,
    quantidade: number,
    manager: EntityManager,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(Produto)
      .set({ estoque: () => 'estoque + :quantidade' })
      .where('id = :id', { id, quantidade })
      .execute();
  }

  // Média e total das avaliações calculados no banco (AVG/COUNT)
  async resumoAvaliacoes(
    produtoId: number,
  ): Promise<{ media: number; total: number }> {
    const linha = await this.repositorio.manager
      .createQueryBuilder(Avaliacao, 'avaliacao')
      .select('AVG(avaliacao.nota)', 'media')
      .addSelect('COUNT(avaliacao.id)', 'total')
      .where('avaliacao.produtoId = :produtoId', { produtoId })
      .getRawOne<{ media: number | null; total: number | string }>();

    const media = linha?.media ? Math.round(Number(linha.media) * 10) / 10 : 0;
    return { media, total: Number(linha?.total ?? 0) };
  }
}
