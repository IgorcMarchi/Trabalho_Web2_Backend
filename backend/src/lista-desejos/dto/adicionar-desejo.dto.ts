import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AdicionarDesejoDto {
  @ApiProperty({ example: 3 })
  @IsInt({ message: 'produtoId deve ser um número inteiro' })
  @Min(1)
  produtoId: number;
}
