import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Produto } from '../produtos/produto.entity';
import { Categoria } from './categoria.entity';

@Injectable()
export class CategoriasRepository {
  constructor(
    @InjectRepository(Categoria)
    private readonly repositorio: Repository<Categoria>,
    @InjectRepository(Produto)
    private readonly produtos: Repository<Produto>,
  ) {}

  listar(ativa?: boolean): Promise<Categoria[]> {
    const where: FindOptionsWhere<Categoria> =
      ativa === undefined ? {} : { ativa };
    return this.repositorio.find({ where, order: { nome: 'ASC' } });
  }

  buscarPorId(id: number): Promise<Categoria | null> {
    return this.repositorio.findOneBy({ id });
  }

  // "Eletrônicos" e "eletrônicos" contam como o mesmo nome
  buscarPorNome(nome: string): Promise<Categoria | null> {
    return this.repositorio
      .createQueryBuilder('categoria')
      .where('LOWER(categoria.nome) = LOWER(:nome)', { nome })
      .getOne();
  }

  // Quantos produtos (não excluídos) cada categoria tem.
  // Uma consulta só, com GROUP BY no banco: { categoriaId -> quantidade }
  async contarProdutosPorCategoria(): Promise<Map<number, number>> {
    const linhas = await this.produtos
      .createQueryBuilder('produto')
      .select('produto.categoriaId', 'categoriaId')
      .addSelect('COUNT(produto.id)', 'quantidade')
      .where('produto.categoriaId IS NOT NULL')
      .groupBy('produto.categoriaId')
      .getRawMany<{ categoriaId: number; quantidade: number | string }>();

    return new Map(
      linhas.map((l) => [Number(l.categoriaId), Number(l.quantidade)]),
    );
  }

  contarProdutos(categoriaId: number): Promise<number> {
    // o count do TypeORM já ignora os produtos com soft delete
    return this.produtos.count({ where: { categoriaId } });
  }

  criar(dados: Partial<Categoria>): Promise<Categoria> {
    return this.repositorio.save(this.repositorio.create(dados));
  }

  salvar(categoria: Categoria): Promise<Categoria> {
    return this.repositorio.save(categoria);
  }

  async remover(id: number): Promise<number> {
    const resultado = await this.repositorio.delete(id);
    return resultado.affected ?? 0;
  }
}
