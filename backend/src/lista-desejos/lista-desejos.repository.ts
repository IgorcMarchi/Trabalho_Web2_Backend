import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produto } from '../produtos/produto.entity';
import { Usuario } from '../usuarios/usuario.entity';

// A lista de desejos é a relação N:N Usuario <-> Produto
// (tabela intermediária lista_desejos, criada pelo @JoinTable).
@Injectable()
export class ListaDesejosRepository {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Produto)
    private readonly produtos: Repository<Produto>,
  ) {}

  // produtos (não excluídos) da lista de um usuário, paginados no banco
  listar(
    usuarioId: number,
    skip: number,
    take: number,
  ): Promise<[Produto[], number]> {
    return this.produtos
      .createQueryBuilder('produto')
      .leftJoinAndSelect('produto.categoria', 'categoria')
      .innerJoin(
        'lista_desejos',
        'item',
        'item.produto_id = produto.id AND item.usuario_id = :usuarioId',
        { usuarioId },
      )
      .orderBy('produto.id', 'ASC')
      .offset(skip)
      .limit(take)
      .getManyAndCount();
  }

  async contem(usuarioId: number, produtoId: number): Promise<boolean> {
    const total = await this.usuarios
      .createQueryBuilder('usuario')
      .innerJoin('usuario.listaDesejos', 'produto')
      .where('usuario.id = :usuarioId', { usuarioId })
      .andWhere('produto.id = :produtoId', { produtoId })
      .getCount();
    return total > 0;
  }

  // RelationQueryBuilder: insere/remove só a linha da tabela intermediária
  adicionar(usuarioId: number, produtoId: number): Promise<void> {
    return this.usuarios
      .createQueryBuilder()
      .relation(Usuario, 'listaDesejos')
      .of(usuarioId)
      .add(produtoId);
  }

  remover(usuarioId: number, produtoId: number): Promise<void> {
    return this.usuarios
      .createQueryBuilder()
      .relation(Usuario, 'listaDesejos')
      .of(usuarioId)
      .remove(produtoId);
  }
}
