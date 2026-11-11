import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { PaginacaoDto } from '../../comum/dto/paginacao.dto';

// nota e comentário valem para avaliação de produto e para feedback do site
export class NotaComentarioDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt({ message: 'nota deve ser um número inteiro' })
  @Min(1, { message: 'nota deve ser de 1 a 5' })
  @Max(5, { message: 'nota deve ser de 1 a 5' })
  nota: number;

  @ApiProperty({
    example: 'Chegou rápido e é bem resistente.',
    minLength: 5,
    maxLength: 1000,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'comentario deve ser um texto' })
  @Length(5, 1000, { message: 'comentario deve ter entre 5 e 1000 caracteres' })
  comentario: string;
}

// O nome do autor não vem no corpo: é o nome de quem está logado.
export class CriarAvaliacaoDto extends NotaComentarioDto {
  @ApiProperty({ example: 3 })
  @IsInt({ message: 'produtoId deve ser um número inteiro' })
  @Min(1)
  produtoId: number;
}

export class ListarAvaliacoesDto extends PaginacaoDto {
  @ApiPropertyOptional({
    description: 'Só as avaliações deste produto',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'produtoId deve ser um número inteiro' })
  @Min(1)
  produtoId?: number;
}

export class AvaliacaoRespostaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 3 })
  produtoId: number;

  @ApiProperty({ example: 'Mens Cotton Jacket', nullable: true, type: String })
  produtoNome: string | null;

  @ApiProperty({ example: 'Pedro Rocha' })
  autorNome: string;

  @ApiPropertyOptional({
    example: 'pedro@email.com',
    nullable: true,
    type: String,
    description: 'Só aparece para ADMIN (moderação)',
  })
  autorEmail?: string | null;

  @ApiProperty({ example: 5 })
  nota: number;

  @ApiProperty({ example: 'Chegou rápido e é bem resistente.' })
  comentario: string;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  criadoEm: Date;
}
