import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DeepPartial, EntityManager, Repository } from 'typeorm';
import { Pedido } from './pedido.entity';
import { StatusPagamento, StatusPedido } from './pedido.enums';

export interface FiltrosPedidos {
  busca?: string;
  status?: StatusPedido;
  skip: number;
  take: number;
}

// Nas listagens paginadas, o SQL ordena só pelo pedido. Com skip/take,
// ordenar também pelos itens fazia o TypeORM paginar por linha
// pedido x item: a página contava itens, e pedidos sumiam da lista.
// Por isso os itens de cada pedido são ordenados aqui, depois da consulta.
function ordenarItens(pedidos: Pedido[]): Pedido[] {
  for (const pedido of pedidos) {
    pedido.itens.sort((a, b) => a.id - b.id);
  }
  return pedidos;
}

@Injectable()
export class PedidosRepository {
  constructor(
    @InjectRepository(Pedido)
    private readonly repositorio: Repository<Pedido>,
  ) {}

  private repo(manager?: EntityManager): Repository<Pedido> {
    return manager ? manager.getRepository(Pedido) : this.repositorio;
  }

  // o cascade da entidade grava os itens junto com o pedido
  criar(dados: DeepPartial<Pedido>, manager: EntityManager): Promise<Pedido> {
    const repo = this.repo(manager);
    return repo.save(repo.create(dados));
  }

  buscarPorId(id: number, manager?: EntityManager): Promise<Pedido | null> {
    return this.repo(manager).findOne({
      where: { id },
      relations: { itens: true, usuario: true },
      order: { itens: { id: 'ASC' } },
    });
  }

  async listarDoUsuario(
    usuarioId: number,
    skip: number,
    take: number,
  ): Promise<[Pedido[], number]> {
    const [pedidos, total] = await this.repositorio.findAndCount({
      where: { usuarioId },
      relations: { itens: true },
      order: { id: 'DESC' },
      skip,
      take,
    });
    return [ordenarItens(pedidos), total];
  }

  // Busca por nome, e-mail OU número: precisa de OR entre colunas de
  // tabelas diferentes, por isso aqui usamos o QueryBuilder.
  async listarTodos({
    busca,
    status,
    skip,
    take,
  }: FiltrosPedidos): Promise<[Pedido[], number]> {
    const consulta = this.repositorio
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.usuario', 'usuario')
      .leftJoinAndSelect('pedido.itens', 'item');

    if (status) {
      consulta.andWhere('pedido.status = :status', { status });
    }

    if (busca) {
      consulta.andWhere(
        new Brackets((ou) => {
          ou.where('LOWER(pedido.clienteNome) LIKE :busca')
            .orWhere('LOWER(usuario.email) LIKE :busca')
            .orWhere('CAST(pedido.id AS TEXT) LIKE :busca');
        }),
        { busca: `%${busca.toLowerCase()}%` },
      );
    }

    const [pedidos, total] = await consulta
      .orderBy('pedido.id', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return [ordenarItens(pedidos), total];
  }

  async atualizarStatus(
    id: number,
    status: StatusPedido,
    statusPagamento: StatusPagamento,
    manager: EntityManager,
  ): Promise<void> {
    await this.repo(manager).update(id, { status, statusPagamento });
  }
}
