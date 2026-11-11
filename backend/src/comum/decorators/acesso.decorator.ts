import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Papel } from '../tipos/papel.enum';
import { ApiErros } from './api-respostas.decorator';
import { Papeis } from './papeis.decorator';
import { Publico } from './publico.decorator';

// Cada rota declara quem pode usá-la com um destes três decorators.
// Eles juntam a regra de verdade (que os Guards aplicam) com a
// documentação do Swagger, então as duas nunca ficam diferentes:
// rota com cadeado no Swagger = rota que o AuthGuard protege.

// Aberta a qualquer visitante (não aparece o cadeado no Swagger)
export const AcessoPublico = () => applyDecorators(Publico(), ApiErros(500));

// Qualquer usuário logado (CLIENTE ou ADMIN)
export const AcessoAutenticado = () =>
  applyDecorators(ApiBearerAuth(), ApiErros(401, 500));

// Somente ADMIN: sem token -> 401, token de cliente -> 403
export const AcessoAdmin = () =>
  applyDecorators(
    Papeis(Papel.ADMIN),
    ApiBearerAuth(),
    ApiErros(401, 403, 500),
  );
