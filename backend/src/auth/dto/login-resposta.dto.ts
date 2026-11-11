import { ApiProperty } from '@nestjs/swagger';
import { Usuario } from '../../usuarios/usuario.entity';

export class LoginRespostaDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AdGVjc2hvcC5jb20iLCJwYXBlbCI6IkFETUlOIn0.assinatura',
    description:
      'JWT. Envie em Authorization: Bearer <token> (no Swagger, cole no botão Authorize).',
  })
  token: string;

  @ApiProperty({
    example: '2026-11-11T13:00:00.000Z',
    description: 'Quando o token expira',
  })
  expiraEm: string;

  @ApiProperty({ type: () => Usuario })
  usuario: Usuario;
}
