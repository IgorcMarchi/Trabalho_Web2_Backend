import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
} from 'class-validator';
import { Categoria } from '../categoria.entity';

// "true"/"false" da query string viram boolean de verdade
export const textoParaBooleano = ({ value }: { value: unknown }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

export class CriarCategoriaDto {
  @ApiProperty({ example: 'Livros', minLength: 3, maxLength: 80 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'nome deve ser um texto' })
  @Length(3, 80, { message: 'nome deve ter entre 3 e 80 caracteres' })
  nome: string;

  @ApiPropertyOptional({ example: true, default: true })
  // pode faltar, mas não pode vir null (o @IsOptional deixaria passar)
  @ValidateIf((_, valor) => valor !== undefined)
  @IsBoolean({ message: 'ativa deve ser true ou false' })
  ativa?: boolean;
}

// PATCH: todos os campos do cadastro, mas opcionais.
// skipNullProperties: false = campo ausente pode, campo null não (400).
export class AtualizarCategoriaDto extends PartialType(CriarCategoriaDto, {
  skipNullProperties: false,
}) {}

export class ListarCategoriasDto {
  @ApiPropertyOptional({
    description:
      'true = só as ativas (as que aparecem na loja). Sem o filtro, vêm todas.',
  })
  @IsOptional()
  @Transform(textoParaBooleano)
  @IsBoolean({ message: 'ativa deve ser true ou false' })
  ativa?: boolean;
}

export class CategoriaRespostaDto extends Categoria {
  @ApiProperty({
    example: 6,
    description: 'Produtos (não excluídos) nesta categoria',
  })
  quantidadeProdutos: number;
}
