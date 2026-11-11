import type { Request } from 'express';
import { Papel } from './papel.enum';

// O que vai dentro do JWT. Payload mínimo: só o necessário para saber
// quem é (sub), avisar o e-mail e decidir permissões (papel).
export interface UsuarioToken {
  sub: number;
  email: string;
  papel: Papel;
}

// Requisição depois de passar pelo AuthGuard
export interface RequisicaoAutenticada extends Request {
  usuario?: UsuarioToken;
}
