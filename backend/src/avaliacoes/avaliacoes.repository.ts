import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, IsNull, Repository } from 'typeorm';
import { StatusProduto } from '../produtos/status-produto.enum';
import { Avaliacao } from './avaliacao.entity';

@Injectable()
export class AvaliacoesRepository {
  constructor(
    @InjectRepository(Avaliacao)
    private readonly repositorio: Repository<Avaliacao>,
  ) {}

  // Na loja só aparecem avaliações de produtos à venda (ativos e não
  // excluídos), como o próprio produto. O admin vê todas na moderação.
  listar(
    produtoId: number | undefined,
    skip: number,
    take: number,
    incluirIndisponiveis: boolean,
  ): Promise<[Avaliacao[], number]> {
    const doProduto = produtoId ? { produtoId } : {};

    return this.repositorio.findAndCount({
      where: incluirIndisponiveis
        ? doProduto
        : {
            ...doProduto,
            produto: { status: StatusProduto.ATIVO, excluidoEm: IsNull() },
          },
      relations: { produto: true, usuario: true },
      // o admin vê o nome até de produto excluído (o painel mostra "Produto excluído")
      withDeleted: incluirIndisponiveis,
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
