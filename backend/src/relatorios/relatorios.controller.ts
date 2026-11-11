import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AcessoAdmin } from '../comum/decorators/acesso.decorator';
import {
  ApiErros,
  ApiSucesso,
} from '../comum/decorators/api-respostas.decorator';
import {
  DashboardDto,
  FiltroRelatorioDto,
  RelatorioVendasDto,
} from './dto/relatorio.dto';
import { RelatoriosService } from './relatorios.service';

@ApiTags('Relatórios')
@Controller('relatorios')
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  @Get('dashboard')
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Indicadores do dashboard [ADMIN]',
    description:
      'Cartões, gráficos e pedidos recentes, calculados no banco a partir dos pedidos gravados. Cancelados não contam como venda.',
  })
  @ApiSucesso(DashboardDto)
  dashboard() {
    return this.relatoriosService.dashboard();
  }

  @Get('vendas')
  @AcessoAdmin()
  @ApiOperation({
    summary: 'Relatório de vendas [ADMIN]',
    description:
      'Filtros por período, categoria e produto. Cancelados não entram nas contas.',
  })
  @ApiSucesso(RelatorioVendasDto)
  @ApiErros(400, {
    status: 422,
    mensagem: 'A data final precisa ser igual ou depois da inicial.',
  })
  vendas(@Query() filtros: FiltroRelatorioDto) {
    return this.relatoriosService.vendas(filtros);
  }
}
