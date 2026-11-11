import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotaComentarioDto } from '../../avaliacoes/dto/avaliacao.dto';

// Só nota e comentário. O autor é quem está logado.
export class CriarFeedbackDto extends NotaComentarioDto {}

export class FeedbackRespostaDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Thiago Moreira' })
  autorNome: string;

  @ApiPropertyOptional({
    example: 'thiago@email.com',
    nullable: true,
    type: String,
    description: 'Só aparece para ADMIN (moderação)',
  })
  autorEmail?: string | null;

  @ApiProperty({ example: 5 })
  nota: number;

  @ApiProperty({ example: 'Site simples e fácil de usar.' })
  comentario: string;

  @ApiProperty({ example: '2026-11-11T12:00:00.000Z' })
  criadoEm: Date;
}
