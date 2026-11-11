import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginacaoDto } from '../../comum/dto/paginacao.dto';
import { Papel } from '../../comum/tipos/papel.enum';

export class ListarUsuariosDto extends PaginacaoDto {
  @ApiPropertyOptional({ enum: Papel })
  @IsOptional()
  @IsEnum(Papel, { message: 'papel deve ser CLIENTE ou ADMIN' })
  papel?: Papel;

  @ApiPropertyOptional({
    description: 'Parte do nome ou do e-mail',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  busca?: string;
}
