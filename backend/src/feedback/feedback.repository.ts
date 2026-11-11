import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Feedback } from './feedback.entity';

@Injectable()
export class FeedbackRepository {
  constructor(
    @InjectRepository(Feedback)
    private readonly repositorio: Repository<Feedback>,
  ) {}

  listar(skip: number, take: number): Promise<[Feedback[], number]> {
    return this.repositorio.findAndCount({
      relations: { usuario: true },
      order: { id: 'DESC' },
      skip,
      take,
    });
  }

  buscarPorId(id: number): Promise<Feedback | null> {
    return this.repositorio.findOne({
      where: { id },
      relations: { usuario: true },
    });
  }

  criar(dados: DeepPartial<Feedback>): Promise<Feedback> {
    return this.repositorio.save(this.repositorio.create(dados));
  }

  async remover(id: number): Promise<number> {
    const resultado = await this.repositorio.delete(id);
    return resultado.affected ?? 0;
  }
}
