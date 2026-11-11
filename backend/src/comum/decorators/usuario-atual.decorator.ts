import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type {
  RequisicaoAutenticada,
  UsuarioToken,
} from '../tipos/usuario-token.interface';

// Entrega para o controller o usuário que veio no token.
// O id de quem faz a operação vem SEMPRE daqui, nunca do corpo da requisição.
// Em rota pública devolve undefined quando não há token.
export const UsuarioAtual = createParamDecorator(
  (_dados: unknown, contexto: ExecutionContext): UsuarioToken | undefined => {
    const requisicao = contexto
      .switchToHttp()
      .getRequest<RequisicaoAutenticada>();
    return requisicao.usuario;
  },
);
