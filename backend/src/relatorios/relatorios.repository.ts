import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, SelectQueryBuilder } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { Papel } from '../comum/tipos/papel.enum';
import { ItemPedido } from '../pedidos/item-pedido.entity';
import { Pedido } from '../pedidos/pedido.entity';
import { StatusPedido } from '../pedidos/pedido.enums';
import { Produto } from '../produtos/produto.entity';
import { StatusProduto } from '../produtos/status-produto.enum';
import { Usuario } from '../usuarios/usuario.entity';

export interface FiltrosRelatorio {
  de?: string;
  ate?: string;
  categoriaId?: number;
  produtoId?: number;
}

export interface LinhaGrafico {
  rotulo: string;
  valor: number;
}

export interface LinhaPorDia {
  dia: string;
  faturamento: number;
  quantidade: number;
}

// o SQLite devolve SUM/COUNT como texto ou número, conforme o caso
function paraNumeros(linhas: LinhaPorDia[]): LinhaPorDia[] {
  return linhas.map((l) => ({
    dia: l.dia,
    faturamento: Number(l.faturamento),
    quantidade: Number(l.quantidade),
  }));
}

// Consultas especiais (soma, contagem, agrupamento): o QueryBuilder fica
// aqui dentro do repository. Tudo é calculado pelo banco, a partir dos
// pedidos gravados. Pedido cancelado não conta como venda.
@Injectable()
export class RelatoriosRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // pedidos válidos dentro do período. O 'localtime' converte o horário
  // gravado (UTC) para o fuso do servidor antes de pegar o dia.
  private pedidosValidos(
    filtros: FiltrosRelatorio,
  ): SelectQueryBuilder<Pedido> {
    const consulta = this.dataSource
      .createQueryBuilder(Pedido, 'pedido')
      .where('pedido.status != :cancelado', {
        cancelado: StatusPedido.CANCELADO,
      });

    if (filtros.de) {
      consulta.andWhere("date(pedido.criadoEm, 'localtime') >= :de", {
        de: filtros.de,
      });
    }
    if (filtros.ate) {
      consulta.andWhere("date(pedido.criadoEm, 'localtime') <= :ate", {
        ate: filtros.ate,
      });
    }
    return consulta;
  }

  // itens vendidos (de pedidos válidos) que passam nos filtros
  private itensVendidos(
    filtros: FiltrosRelatorio,
  ): SelectQueryBuilder<ItemPedido> {
    const consulta = this.dataSource
      .createQueryBuilder(ItemPedido, 'item')
      .innerJoin('item.pedido', 'pedido')
      .where('pedido.status != :cancelado', {
        cancelado: StatusPedido.CANCELADO,
      });

    if (filtros.de) {
      consulta.andWhere("date(pedido.criadoEm, 'localtime') >= :de", {
        de: filtros.de,
      });
    }
    if (filtros.ate) {
      consulta.andWhere("date(pedido.criadoEm, 'localtime') <= :ate", {
        ate: filtros.ate,
      });
    }
    if (filtros.categoriaId) {
      consulta.andWhere('item.categoriaId = :categoriaId', {
        categoriaId: filtros.categoriaId,
      });
    }
    if (filtros.produtoId) {
      consulta.andWhere('item.produtoId = :produtoId', {
        produtoId: filtros.produtoId,
      });
    }
    return consulta;
  }

  async resumoPedidos(
    filtros: FiltrosRelatorio,
  ): Promise<{ quantidade: number; faturamento: number }> {
    const linha = await this.pedidosValidos(filtros)
      .select('COUNT(pedido.id)', 'quantidade')
      .addSelect('COALESCE(SUM(pedido.total), 0)', 'faturamento')
      .getRawOne<{ quantidade: number; faturamento: number }>();

    return {
      quantidade: Number(linha?.quantidade ?? 0),
      faturamento: Number(linha?.faturamento ?? 0),
    };
  }

  contarTodosPedidos(): Promise<number> {
    return this.dataSource.getRepository(Pedido).count();
  }

  async porDia(filtros: FiltrosRelatorio): Promise<LinhaPorDia[]> {
    const linhas = await this.pedidosValidos(filtros)
      .select("date(pedido.criadoEm, 'localtime')", 'dia')
      .addSelect('SUM(pedido.total)', 'faturamento')
      .addSelect('COUNT(pedido.id)', 'quantidade')
      .groupBy('dia')
      .orderBy('dia', 'ASC')
      .getRawMany<LinhaPorDia>();

    return paraNumeros(linhas);
  }

  // o mesmo que porDia, mas só com os itens que passam nos filtros de
  // categoria/produto (o gráfico acompanha os números do relatório)
  async porDiaDosItens(filtros: FiltrosRelatorio): Promise<LinhaPorDia[]> {
    const linhas = await this.itensVendidos(filtros)
      .select("date(pedido.criadoEm, 'localtime')", 'dia')
      .addSelect('SUM(item.subtotal)', 'faturamento')
      .addSelect('COUNT(DISTINCT pedido.id)', 'quantidade')
      .groupBy('dia')
      .orderBy('dia', 'ASC')
      .getRawMany<LinhaPorDia>();

    return paraNumeros(linhas);
  }

  // pedidos = quantos pedidos diferentes têm esses itens
  async totaisItens(
    filtros: FiltrosRelatorio,
  ): Promise<{ pecas: number; faturamento: number; pedidos: number }> {
    const linha = await this.itensVendidos(filtros)
      .select('COALESCE(SUM(item.quantidade), 0)', 'pecas')
      .addSelect('COALESCE(SUM(item.subtotal), 0)', 'faturamento')
      .addSelect('COUNT(DISTINCT pedido.id)', 'pedidos')
      .getRawOne<{ pecas: number; faturamento: number; pedidos: number }>();

    return {
      pecas: Number(linha?.pecas ?? 0),
      faturamento: Number(linha?.faturamento ?? 0),
      pedidos: Number(linha?.pedidos ?? 0),
    };
  }

  // quantidade vendida por produto, da mais vendida para a menos vendida
  async rankingProdutos(filtros: FiltrosRelatorio): Promise<LinhaGrafico[]> {
    const linhas = await this.itensVendidos(filtros)
      .select('MAX(item.nomeProduto)', 'rotulo')
      .addSelect('SUM(item.quantidade)', 'valor')
      .groupBy('item.produtoId')
      .orderBy('valor', 'DESC')
      .getRawMany<{ rotulo: string; valor: number }>();

    return linhas.map((l) => ({ rotulo: l.rotulo, valor: Number(l.valor) }));
  }

  async vendasPorCategoria(filtros: FiltrosRelatorio): Promise<LinhaGrafico[]> {
    const linhas = await this.itensVendidos(filtros)
      .select("COALESCE(item.categoriaNome, 'Sem categoria')", 'rotulo')
      .addSelect('SUM(item.subtotal)', 'valor')
      .groupBy('rotulo')
      .orderBy('valor', 'DESC')
      .getRawMany<{ rotulo: string; valor: number }>();

    return linhas.map((l) => ({ rotulo: l.rotulo, valor: Number(l.valor) }));
  }

  // os count() abaixo já ignoram produtos com soft delete
  async contagens() {
    const produtos = this.dataSource.getRepository(Produto);

    const [clientes, totalProdutos, produtosAtivos, emPromocao, categorias] =
      await Promise.all([
        this.dataSource
          .getRepository(Usuario)
          .count({ where: { papel: Papel.CLIENTE } }),
        produtos.count(),
        produtos.count({ where: { status: StatusProduto.ATIVO } }),
        produtos.count({ where: { precoPromocional: Not(IsNull()) } }),
        this.dataSource.getRepository(Categoria).count(),
      ]);

    return {
      clientes,
      produtos: totalProdutos,
      produtosAtivos,
      emPromocao,
      categorias,
    };
  }

  pedidosRecentes(quantidade: number): Promise<Pedido[]> {
    return this.dataSource.getRepository(Pedido).find({
      relations: { usuario: true },
      order: { id: 'DESC' },
      take: quantidade,
    });
  }

  clientesRecentes(quantidade: number): Promise<Usuario[]> {
    return this.dataSource.getRepository(Usuario).find({
      where: { papel: Papel.CLIENTE },
      order: { criadoEm: 'DESC', id: 'DESC' },
      take: quantidade,
    });
  }
}
