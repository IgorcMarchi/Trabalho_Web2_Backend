import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Do navegador vem só "qual produto" e "quantos". Preço NUNCA vem do
// navegador: o servidor busca no banco.
export class ItemCarrinhoDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: 'produtoId deve ser um número inteiro' })
  @Min(1)
  produtoId: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 99 })
  @IsInt({ message: 'quantidade deve ser um número inteiro' })
  @Min(1, { message: 'quantidade deve ser no mínimo 1' })
  @Max(99, { message: 'quantidade deve ser no máximo 99' })
  quantidade: number;
}

export class CalcularCarrinhoDto {
  @ApiProperty({
    type: [ItemCarrinhoDto],
    example: [{ produtoId: 1, quantidade: 2 }],
  })
  @IsArray({ message: 'itens deve ser uma lista' })
  @ArrayMaxSize(50, {
    message: 'o carrinho pode ter no máximo 50 produtos diferentes',
  })
  @ValidateNested({ each: true })
  @Type(() => ItemCarrinhoDto)
  itens: ItemCarrinhoDto[];
}

export class ItemCarrinhoCalculadoDto {
  @ApiProperty({ example: 1 })
  produtoId: number;

  @ApiProperty({
    example: 'Mochila Fjallraven Foldsack No. 1',
    nullable: true,
    type: String,
  })
  nome: string | null;

  @ApiProperty({
    example: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png',
    nullable: true,
    type: String,
  })
  imagem: string | null;

  @ApiProperty({ example: 109.95, nullable: true, type: Number })
  preco: number | null;

  @ApiProperty({ example: 87.96, nullable: true, type: Number })
  precoPromocional: number | null;

  @ApiProperty({
    example: 87.96,
    description: 'Preço que será cobrado (do banco)',
  })
  precoUnitario: number;

  @ApiProperty({ example: 2 })
  quantidade: number;

  @ApiProperty({ example: 175.92 })
  subtotal: number;

  @ApiProperty({ example: 30 })
  estoque: number;

  @ApiProperty({ example: true })
  disponivel: boolean;

  @ApiProperty({
    example: null,
    nullable: true,
    type: String,
    description: 'Por que o item não pode ser comprado',
  })
  problema: string | null;
}

export class CarrinhoCalculadoDto {
  @ApiProperty({ type: [ItemCarrinhoCalculadoDto] })
  itens: ItemCarrinhoCalculadoDto[];

  @ApiProperty({ example: 175.92, description: 'Soma dos itens disponíveis' })
  total: number;

  @ApiProperty({ example: 2 })
  quantidadeTotal: number;

  @ApiProperty({
    example: true,
    description: 'false se algum item não pode ser comprado',
  })
  valido: boolean;
}
