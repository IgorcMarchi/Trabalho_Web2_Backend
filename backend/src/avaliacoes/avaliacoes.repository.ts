import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Avaliacao } from './avaliacao.entity';

@Injectable()
export class AvaliacoesRepository {
  constructor(
    @InjectRepository(Avaliacao)
    private readonly repositorio: Repository<Avaliacao>,
  ) {}

  listar(
    produtoId: number | undefined,
    skip: number,
    take: number,
  ): Promise<[Avaliacao[], number]> {
    return this.repositorio.findAndCount({
      where: produtoId ? { produtoId } : {},
      relations: { produto: true, usuario: true },
      // traz o nome até de produto excluído (o painel mostra "Produto excluído")
      withDeleted: true,
      order: { id: 'DESC' },
      skip,
      take,
    });
  }

  buscarPorId(id: number): Promise<Avaliacao | null> {
    return this.repositorio.findOne({
      where: { id },
      relations: { produto: true, usuario: true },
      withDeleted: true,
    });
  }

  criar(dados: DeepPartial<Avaliacao>): Promise<Avaliacao> {
    return this.repositorio.save(this.repositorio.create(dados));
  }

  async remover(id: number): Promise<number> {
    const resultado = await this.repositorio.delete(id);
    return resultado.affected ?? 0;
  }
}
