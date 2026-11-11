import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  EntityManager,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Promocao } from './promocao.entity';

@Injectable()
export class PromocoesRepository {
  constructor(
    @InjectRepository(Promocao)
    private readonly repositorio: Repository<Promocao>,
  ) {}

  private repo(manager?: EntityManager): Repository<Promocao> {
    return manager ? manager.getRepository(Promocao) : this.repositorio;
  }

  listar(): Promise<Promocao[]> {
    return this.repositorio.find({
      relations: { categoria: true, produto: true },
      order: { id: 'DESC' },
    });
  }

  // ativas e dentro do período (as datas AAAA-MM-DD comparam como texto)
  listarValendo(hoje: string, manager?: EntityManager): Promise<Promocao[]> {
    return this.repo(manager).find({
      where: {
        ativa: true,
        dataInicio: LessThanOrEqual(hoje),
        dataFim: MoreThanOrEqual(hoje),
      },
      relations: { categoria: true, produto: true },
      order: { id: 'ASC' },
    });
  }

  buscarPorId(id: number, manager?: EntityManager): Promise<Promocao | null> {
    return this.repo(manager).findOne({
      where: { id },
      relations: { categoria: true, produto: true },
    });
  }

  criar(
    dados: DeepPartial<Promocao>,
    manager: EntityManager,
  ): Promise<Promocao> {
    const repo = this.repo(manager);
    return repo.save(repo.create(dados));
  }

  salvar(promocao: Promocao, manager: EntityManager): Promise<Promocao> {
    return this.repo(manager).save(promocao);
  }

  async remover(id: number, manager: EntityManager): Promise<void> {
    await this.repo(manager).delete(id);
  }
}
