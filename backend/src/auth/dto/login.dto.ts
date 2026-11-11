import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@tecshop.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email deve ser um e-mail válido' })
  email: string;

  @ApiProperty({ example: 'admin123' })
  @IsString({ message: 'senha deve ser um texto' })
  @IsNotEmpty({ message: 'senha é obrigatória' })
  @MaxLength(72)
  senha: string;
}
