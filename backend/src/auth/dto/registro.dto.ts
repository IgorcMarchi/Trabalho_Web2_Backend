import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

const limparTexto = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizarEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// Repare: NÃO existe campo "papel". Com o whitelist + forbidNonWhitelisted
// do ValidationPipe, quem mandar "papel": "ADMIN" leva 400.
// Quem se cadastra pelo site é sempre CLIENTE.
export class RegistroDto {
  @ApiProperty({ example: 'Ana Souza', minLength: 3, maxLength: 120 })
  @Transform(limparTexto)
  @IsString({ message: 'nome deve ser um texto' })
  @Length(3, 120, { message: 'nome deve ter entre 3 e 120 caracteres' })
  nome: string;

  @ApiProperty({ example: 'ana@email.com', maxLength: 160 })
  @Transform(normalizarEmail)
  @IsEmail({}, { message: 'email deve ser um e-mail válido' })
  @MaxLength(160)
  email: string;

  // o bcrypt só considera os primeiros 72 bytes, por isso o limite
  @ApiProperty({ example: 'senha123', minLength: 6, maxLength: 72 })
  @IsString({ message: 'senha deve ser um texto' })
  @Length(6, 72, { message: 'senha deve ter entre 6 e 72 caracteres' })
  senha: string;
}
