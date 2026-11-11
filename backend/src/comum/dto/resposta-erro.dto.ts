import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErroDetalheDto {
  @ApiProperty({ example: 400 })
  status: number;

  @ApiProperty({ example: 'Dados inválidos.' })
  mensagem: string;

  @ApiPropertyOptional({
    example: 'SEM_ESTOQUE',
    description:
      'Código da regra violada, para o front tratar sem depender do texto',
  })
  codigo?: string;

  @ApiPropertyOptional({
    example: ['preco must be a positive number'],
    description: 'Lista de campos inválidos (só nos erros de validação)',
    type: [String],
  })
  detalhes?: string[];
}

// Formato único de erro de toda a API (montado pelo TodosErrosFilter)
export class RespostaErroDto {
  @ApiProperty({ example: false })
  sucesso: boolean;

  @ApiProperty({ type: ErroDetalheDto })
  erro: ErroDetalheDto;

  @ApiProperty({ example: '/produtos' })
  caminho: string;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  timestamp: string;
}
