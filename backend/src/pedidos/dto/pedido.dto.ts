import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ItemCarrinhoDto } from '../../carrinho/dto/carrinho.dto';
import { PaginacaoDto } from '../../comum/dto/paginacao.dto';
import { FormaPagamento, StatusPedido } from '../pedido.enums';

const limparTexto = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// Repare no que NÃO existe aqui: preço, total e id do cliente.
// O preço vem do banco e o cliente vem do token.
export class CriarPedidoDto {
  @ApiProperty({ example: 'Ana Souza', description: 'Nome de quem recebe' })
  @Transform(limparTexto)
  @IsString()
  @Length(3, 120, { message: 'nome deve ter entre 3 e 120 caracteres' })
  nome: string;

  @ApiProperty({ example: '(45) 99999-0000' })
  @Transform(limparTexto)
  @Matches(/^[\d\s()+-]{10,20}$/, {
    message: 'telefone deve ter DDD e só números, espaços, (), + ou -',
  })
  telefone: string;

  @ApiProperty({ example: '85892-000' })
  @Transform(limparTexto)
  @Matches(/^\d{5}-?\d{3}$/, {
    message: 'cep deve ter 8 números (ex.: 85892-000)',
  })
  cep: string;

  @ApiProperty({ example: 'Rua das Flores, 100' })
  @Transform(limparTexto)
  @IsString()
  @Length(5, 200, { message: 'endereco deve ter entre 5 e 200 caracteres' })
  endereco: string;

  @ApiProperty({ example: 'Santa Helena' })
  @Transform(limparTexto)
  @IsString()
  @Length(3, 100, { message: 'cidade deve ter entre 3 e 100 caracteres' })
  cidade: string;

  @ApiProperty({ enum: FormaPagamento, example: FormaPagamento.PIX })
  @IsEnum(FormaPagamento, {
    message: 'formaPagamento deve ser PIX, BOLETO ou CARTAO',
  })
  formaPagamento: FormaPagamento;

  @ApiProperty({
    type: [ItemCarrinhoDto],
    example: [
      { produtoId: 1, quantidade: 2 },
      { produtoId: 5, quantidade: 1 },
    ],
  })
  @IsArray({ message: 'itens deve ser uma lista' })
  @ArrayMinSize(1, { message: 'o pedido precisa de pelo menos 1 item' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ItemCarrinhoDto)
  itens: ItemCarrinhoDto[];
}

export class AtualizarStatusPedidoDto {
  @ApiProperty({
    enum: StatusPedido,
    example: StatusPedido.PAGAMENTO_APROVADO,
    description:
      'Só é aceito o próximo status da esteira ou CANCELADO (pedido entregue não pode ser cancelado).',
  })
  @IsEnum(StatusPedido, { message: 'status inválido' })
  status: StatusPedido;
}

export class ListarPedidosDto extends PaginacaoDto {
  @ApiPropertyOptional({
    description: 'Nome do cliente, e-mail ou número do pedido',
  })
  @IsOptional()
  @Transform(limparTexto)
  @IsString()
  @MaxLength(100)
  busca?: string;

  @ApiPropertyOptional({ enum: StatusPedido })
  @IsOptional()
  @IsEnum(StatusPedido, { message: 'status inválido' })
  status?: StatusPedido;
}
