import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Ninguém consegue pedir mais do que isso de uma vez
export const LIMITE_MAXIMO = 50;

// Query de toda listagem paginada (?pagina=1&limite=10).
// Query string chega sempre como texto: o @Type converte para número.
export class PaginacaoDto {
  @ApiPropertyOptional({
    description: 'Página (começa em 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pagina deve ser um número inteiro' })
  @Min(1, { message: 'pagina deve ser no mínimo 1' })
  pagina: number = 1;

  @ApiPropertyOptional({
    description: `Itens por página (máximo ${LIMITE_MAXIMO})`,
    default: 10,
    minimum: 1,
    maximum: LIMITE_MAXIMO,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limite deve ser um número inteiro' })
  @Min(1, { message: 'limite deve ser no mínimo 1' })
  @Max(LIMITE_MAXIMO, { message: `limite deve ser no máximo ${LIMITE_MAXIMO}` })
  limite: number = 10;
}

export class PaginaMetaDto {
  @ApiProperty({ example: 20, description: 'Total de registros encontrados' })
  total: number;

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  limite: number;

  @ApiProperty({ example: 2, description: 'Total de páginas' })
  paginas: number;
}

export interface Pagina<T> {
  itens: T[];
  meta: PaginaMetaDto;
}

// Monta a resposta { itens, meta } a partir do findAndCount
export function montarPagina<T>(
  itens: T[],
  total: number,
  { pagina, limite }: PaginacaoDto,
): Pagina<T> {
  return {
    itens,
    meta: { total, pagina, limite, paginas: Math.ceil(total / limite) },
  };
}

// skip e take do TypeORM a partir da página pedida
export function calcularSalto({ pagina, limite }: PaginacaoDto) {
  return { skip: (pagina - 1) * limite, take: limite };
}
