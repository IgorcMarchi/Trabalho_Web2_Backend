import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { Pedido } from '../../pedidos/pedido.entity';
import { Usuario } from '../../usuarios/usuario.entity';

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

export class FiltroRelatorioDto {
  @ApiPropertyOptional({
    description: 'Data inicial (AAAA-MM-DD)',
  })
  @IsOptional()
  @Matches(FORMATO_DATA, { message: 'de deve estar no formato AAAA-MM-DD' })
  @IsDateString({ strict: true }, { message: 'de deve ser uma data válida' })
  de?: string;

  @ApiPropertyOptional({
    description: 'Data final (AAAA-MM-DD)',
  })
  @IsOptional()
  @Matches(FORMATO_DATA, { message: 'ate deve estar no formato AAAA-MM-DD' })
  @IsDateString({ strict: true }, { message: 'ate deve ser uma data válida' })
  ate?: string;

  @ApiPropertyOptional({
    description: 'Só itens vendidos desta categoria',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoriaId deve ser um número inteiro' })
  @Min(1)
  categoriaId?: number;

  @ApiPropertyOptional({
    description: 'Só itens vendidos deste produto',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'produtoId deve ser um número inteiro' })
  @Min(1)
  produtoId?: number;
}

export class PontoGraficoDto {
  @ApiProperty({
    example: '2026-11-11',
    description: 'Dia (AAAA-MM-DD), produto ou categoria',
  })
  rotulo: string;

  @ApiProperty({ example: 350.5 })
  valor: number;
}

export class DashboardDto {
  @ApiProperty({ example: 12, description: 'Pedidos não cancelados' })
  totalVendas: number;

  @ApiProperty({
    example: 2150.4,
    description: 'Soma dos pedidos não cancelados (R$)',
  })
  faturamento: number;

  @ApiProperty({
    example: 14,
    description: 'Todos os pedidos, inclusive cancelados',
  })
  totalPedidos: number;

  @ApiProperty({ example: 8 })
  clientes: number;

  @ApiProperty({ example: 20 })
  produtos: number;

  @ApiProperty({ example: 4 })
  categorias: number;

  @ApiProperty({ example: 19 })
  produtosAtivos: number;

  @ApiProperty({ example: 7 })
  emPromocao: number;

  @ApiProperty({ type: [PontoGraficoDto] })
  faturamentoPorDia: PontoGraficoDto[];

  @ApiProperty({ type: [PontoGraficoDto], description: 'Top 5 por quantidade' })
  maisVendidos: PontoGraficoDto[];

  @ApiProperty({ type: [PontoGraficoDto] })
  vendasPorCategoria: PontoGraficoDto[];

  @ApiProperty({
    type: () => [Pedido],
    description: 'Os 5 pedidos mais recentes',
  })
  pedidosRecentes: Pedido[];
}

export class ResumoClientesDto {
  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({
    type: () => [Usuario],
    description: 'Os 5 cadastros mais recentes',
  })
  recentes: Usuario[];
}

export class RelatorioVendasDto {
  @ApiProperty({
    example: 5,
    description:
      'Pedidos não cancelados no período (com filtro de categoria ou produto, só os que têm esses itens)',
  })
  totalVendas: number;

  @ApiProperty({
    example: 820.3,
    description: 'Soma dos itens que passam nos filtros (R$)',
  })
  faturamento: number;

  @ApiProperty({ example: 11 })
  pecasVendidas: number;

  @ApiProperty({ example: 164.06, description: 'faturamento / totalVendas' })
  ticketMedio: number;

  @ApiProperty({ type: [PontoGraficoDto] })
  faturamentoPorDia: PontoGraficoDto[];

  @ApiProperty({ type: [PontoGraficoDto] })
  pedidosPorDia: PontoGraficoDto[];

  @ApiProperty({ type: [PontoGraficoDto] })
  maisVendidos: PontoGraficoDto[];

  @ApiProperty({ type: [PontoGraficoDto] })
  menosVendidos: PontoGraficoDto[];

  @ApiProperty({ type: [PontoGraficoDto] })
  vendasPorCategoria: PontoGraficoDto[];

  @ApiProperty({ type: ResumoClientesDto })
  clientes: ResumoClientesDto;
}
