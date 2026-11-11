import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Min,
  ValidateIf,
} from 'class-validator';
import { Promocao } from '../promocao.entity';
import { AlvoPromocao, TipoDesconto } from '../promocao.enums';

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;

export class CriarPromocaoDto {
  @ApiProperty({
    example: 'Semana do consumidor',
    minLength: 3,
    maxLength: 120,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(3, 120, { message: 'nome deve ter entre 3 e 120 caracteres' })
  nome: string;

  @ApiProperty({ enum: TipoDesconto, example: TipoDesconto.PORCENTAGEM })
  @IsEnum(TipoDesconto, { message: 'tipo deve ser PORCENTAGEM ou VALOR' })
  tipo: TipoDesconto;

  @ApiProperty({
    example: 15,
    description: 'Porcentagem (até 100) ou valor fixo em R$',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'valor deve ser um número com até 2 casas' },
  )
  @IsPositive({ message: 'valor deve ser maior que zero' })
  valor: number;

  @ApiProperty({ example: '2026-11-01', description: 'AAAA-MM-DD' })
  @Matches(FORMATO_DATA, {
    message: 'dataInicio deve estar no formato AAAA-MM-DD',
  })
  @IsDateString(
    { strict: true },
    { message: 'dataInicio deve ser uma data válida' },
  )
  dataInicio: string;

  @ApiProperty({
    example: '2026-11-30',
    description: 'AAAA-MM-DD (igual ou depois do início)',
  })
  @Matches(FORMATO_DATA, {
    message: 'dataFim deve estar no formato AAAA-MM-DD',
  })
  @IsDateString(
    { strict: true },
    { message: 'dataFim deve ser uma data válida' },
  )
  dataFim: string;

  @ApiProperty({ enum: AlvoPromocao, example: AlvoPromocao.CATEGORIA })
  @IsEnum(AlvoPromocao, { message: 'alvo deve ser CATEGORIA ou PRODUTO' })
  alvo: AlvoPromocao;

  @ApiPropertyOptional({
    example: 2,
    description: 'Obrigatório quando alvo = CATEGORIA',
  })
  @IsOptional()
  @IsInt({ message: 'categoriaId deve ser um número inteiro' })
  @Min(1, { message: 'categoriaId deve ser no mínimo 1' })
  categoriaId?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Obrigatório quando alvo = PRODUTO',
  })
  @IsOptional()
  @IsInt({ message: 'produtoId deve ser um número inteiro' })
  @Min(1, { message: 'produtoId deve ser no mínimo 1' })
  produtoId?: number;

  @ApiPropertyOptional({ example: true, default: true })
  // pode faltar, mas não pode vir null (o @IsOptional deixaria passar)
  @ValidateIf((_, valor) => valor !== undefined)
  @IsBoolean({ message: 'ativa deve ser true ou false' })
  ativa?: boolean;
}

// PATCH: ativar/desativar = { "ativa": false }.
// skipNullProperties: false = campo ausente pode, campo null não (400).
export class AtualizarPromocaoDto extends PartialType(CriarPromocaoDto, {
  skipNullProperties: false,
}) {}

export enum SituacaoPromocao {
  VALENDO = 'VALENDO',
  TODAS = 'TODAS',
}

export class ListarPromocoesDto {
  @ApiPropertyOptional({
    enum: SituacaoPromocao,
    default: SituacaoPromocao.VALENDO,
    description:
      'VALENDO = ativas e dentro do período (público). TODAS = só ADMIN.',
  })
  @IsOptional()
  @IsEnum(SituacaoPromocao, { message: 'situacao deve ser VALENDO ou TODAS' })
  situacao: SituacaoPromocao = SituacaoPromocao.VALENDO;
}

export class PromocaoRespostaDto extends Promocao {
  @ApiProperty({ example: true, description: 'Ativa e dentro do período hoje' })
  valendo: boolean;

  @ApiProperty({
    example: 6,
    description: 'Quantos produtos a promoção alcança',
  })
  quantidadeProdutos: number;
}
