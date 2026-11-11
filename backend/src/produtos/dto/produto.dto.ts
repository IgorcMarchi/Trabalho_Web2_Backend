import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { textoParaBooleano } from '../../categorias/dto/categoria.dto';
import { PaginacaoDto } from '../../comum/dto/paginacao.dto';
import { Produto } from '../produto.entity';
import { StatusProduto } from '../status-produto.enum';

const limparTexto = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Formato fica no DTO (tipo, tamanho, positivo...).
// Regra de negócio (promoção menor que o preço) fica no service.
export class CriarProdutoDto {
  @ApiProperty({
    example: 'Fone de ouvido Bluetooth',
    minLength: 3,
    maxLength: 200,
  })
  @Transform(limparTexto)
  @IsString({ message: 'nome deve ser um texto' })
  @Length(3, 200, { message: 'nome deve ter entre 3 e 200 caracteres' })
  nome: string;

  @ApiProperty({
    example: 'Fone sem fio com cancelamento de ruído e bateria de 30 horas.',
    minLength: 10,
    maxLength: 2000,
  })
  @Transform(limparTexto)
  @IsString({ message: 'descricao deve ser um texto' })
  @Length(10, 2000, {
    message: 'descricao deve ter entre 10 e 2000 caracteres',
  })
  descricao: string;

  @ApiProperty({
    example: 199.9,
    description: 'Preço em R$ (até 2 casas decimais)',
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'preco deve ser um número com até 2 casas decimais' },
  )
  @IsPositive({ message: 'preco deve ser maior que zero' })
  @Max(1_000_000, { message: 'preco deve ser no máximo 1.000.000' })
  preco: number;

  @ApiPropertyOptional({
    example: 159.9,
    nullable: true,
    type: Number,
    description:
      'Preço com desconto. null ou 0 = sem promoção. Precisa ser menor que o preço.',
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'precoPromocional deve ser um número com até 2 casas decimais' },
  )
  @Min(0, { message: 'precoPromocional não pode ser negativo' })
  precoPromocional?: number | null;

  @ApiProperty({
    example: 'https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_.jpg',
  })
  @IsUrl(
    { require_protocol: true },
    { message: 'imagem deve ser um endereço http(s) válido' },
  )
  @MaxLength(500, { message: 'imagem deve ter no máximo 500 caracteres' })
  imagem: string;

  @ApiProperty({ example: 3, description: 'Id de uma categoria existente' })
  @IsInt({ message: 'categoriaId deve ser um número inteiro' })
  @Min(1, { message: 'categoriaId deve ser no mínimo 1' })
  categoriaId: number;

  @ApiPropertyOptional({ enum: StatusProduto, default: StatusProduto.ATIVO })
  // pode faltar, mas não pode vir null (o @IsOptional deixaria passar)
  @ValidateIf((_, valor) => valor !== undefined)
  @IsEnum(StatusProduto, { message: 'status deve ser ATIVO ou INATIVO' })
  status?: StatusProduto;

  @ApiPropertyOptional({
    example: 25,
    default: 0,
    description: 'Unidades em estoque',
  })
  @ValidateIf((_, valor) => valor !== undefined)
  @IsInt({ message: 'estoque deve ser um número inteiro' })
  @Min(0, { message: 'estoque não pode ser negativo' })
  @Max(100_000, { message: 'estoque deve ser no máximo 100.000' })
  estoque?: number;
}

// PATCH: manda só o que mudou (ex.: { "status": "INATIVO" }).
// skipNullProperties: false = campo ausente pode, campo null não (400).
// Só o precoPromocional aceita null, que quer dizer "sem promoção".
export class AtualizarProdutoDto extends PartialType(CriarProdutoDto, {
  skipNullProperties: false,
}) {}

export enum FiltroStatusProduto {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
  TODOS = 'TODOS',
}

export class ListarProdutosDto extends PaginacaoDto {
  @ApiPropertyOptional({
    description: 'Parte do nome do produto',
  })
  @IsOptional()
  @Transform(limparTexto)
  @IsString()
  @MaxLength(100)
  busca?: string;

  @ApiPropertyOptional({ description: 'Filtra por categoria' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoriaId deve ser um número inteiro' })
  @Min(1)
  categoriaId?: number;

  @ApiPropertyOptional({
    enum: FiltroStatusProduto,
    default: FiltroStatusProduto.ATIVO,
    description: 'INATIVO e TODOS são só para ADMIN (senão 403)',
  })
  @IsOptional()
  @IsEnum(FiltroStatusProduto, {
    message: 'status deve ser ATIVO, INATIVO ou TODOS',
  })
  status: FiltroStatusProduto = FiltroStatusProduto.ATIVO;

  @ApiPropertyOptional({
    description: 'true = só produtos com preço promocional',
  })
  @IsOptional()
  @Transform(textoParaBooleano)
  @IsBoolean({ message: 'emPromocao deve ser true ou false' })
  emPromocao?: boolean;
}

export class ProdutoDetalheDto extends Produto {
  @ApiProperty({
    example: 4.5,
    description: 'Média das notas (0 se não tem avaliação)',
  })
  mediaAvaliacoes: number;

  @ApiProperty({ example: 2 })
  totalAvaliacoes: number;
}
