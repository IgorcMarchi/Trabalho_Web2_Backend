import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

// O administrador só pode ativar/desativar contas. Nome, e-mail, senha
// e papel não são alterados por aqui (o whitelist rejeita esses campos).
export class AtualizarUsuarioDto {
  @ApiProperty({
    example: false,
    description: 'false desativa a conta (ela não consegue mais entrar)',
  })
  @IsBoolean({ message: 'ativo deve ser true ou false' })
  ativo: boolean;
}
