import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { arredondar } from '../comum/utils/valores';
import {
  DashboardDto,
  FiltroRelatorioDto,
  RelatorioVendasDto,
} from './dto/relatorio.dto';
import { RelatoriosRepository } from './relatorios.repository';

@Injectable()
export class RelatoriosService {
  constructor(private readonly relatoriosRepository: RelatoriosRepository) {}

  async dashboard(): Promise<DashboardDto> {
    const semFiltro = {};

    const [
      resumo,
      totalPedidos,
      contagens,
      porDia,
      ranking,
      porCategoria,
      recentes,
    ] = await Promise.all([
      this.relatoriosRepository.resumoPedidos(semFiltro),
      this.relatoriosRepository.contarTodosPedidos(),
      this.relatoriosRepository.contagens(),
      this.relatoriosRepository.porDia(semFiltro),
      this.relatoriosRepository.rankingProdutos(semFiltro),
      this.relatoriosRepository.vendasPorCategoria(semFiltro),
      this.relatoriosRepository.pedidosRecentes(5),
    ]);

    return {
      totalVendas: resumo.quantidade,
      faturamento: arredondar(resumo.faturamento),
      totalPedidos,
      ...contagens,
      faturamentoPorDia: porDia.map((d) => ({
        rotulo: d.dia,
        valor: arredondar(d.faturamento),
      })),
      maisVendidos: ranking.slice(0, 5),
      vendasPorCategoria: porCategoria.map((c) => ({
        ...c,
        valor: arredondar(c.valor),
      })),
      pedidosRecentes: recentes,
    };
  }

  async vendas(filtros: FiltroRelatorioDto): Promise<RelatorioVendasDto> {
    if (filtros.de && filtros.ate && filtros.ate < filtros.de) {
      throw new UnprocessableEntityException(
        'A data final precisa ser igual ou depois da inicial.',
      );
    }

    // o período vale para tudo; categoria e produto filtram os itens vendidos
    const periodo = { de: filtros.de, ate: filtros.ate };

    const [
      resumo,
      porDia,
      totaisItens,
      ranking,
      porCategoria,
      contagens,
      clientesRecentes,
    ] = await Promise.all([
      this.relatoriosRepository.resumoPedidos(periodo),
      this.relatoriosRepository.porDia(periodo),
      this.relatoriosRepository.totaisItens(filtros),
      this.relatoriosRepository.rankingProdutos(filtros),
      this.relatoriosRepository.vendasPorCategoria(filtros),
      this.relatoriosRepository.contagens(),
      this.relatoriosRepository.clientesRecentes(5),
    ]);

    const faturamento = arredondar(totaisItens.faturamento);

    return {
      totalVendas: resumo.quantidade,
      faturamento,
      pecasVendidas: totaisItens.pecas,
      ticketMedio:
        resumo.quantidade > 0 ? arredondar(faturamento / resumo.quantidade) : 0,
      faturamentoPorDia: porDia.map((d) => ({
        rotulo: d.dia,
        valor: arredondar(d.faturamento),
      })),
      pedidosPorDia: porDia.map((d) => ({
        rotulo: d.dia,
        valor: d.quantidade,
      })),
      maisVendidos: ranking.slice(0, 5),
      menosVendidos: [...ranking].reverse().slice(0, 5),
      vendasPorCategoria: porCategoria.map((c) => ({
        ...c,
        valor: arredondar(c.valor),
      })),
      clientes: { total: contagens.clientes, recentes: clientesRecentes },
    };
  }
}
