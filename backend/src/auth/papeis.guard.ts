import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PAPEIS } from '../comum/decorators/papeis.decorator';
import { Papel } from '../comum/tipos/papel.enum';
import type { RequisicaoAutenticada } from '../comum/tipos/usuario-token.interface';

// "O que você pode fazer?" — roda DEPOIS do AuthGuard.
// Já sabemos quem é; aqui só conferimos se o papel permite (senão 403).
@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const papeisPermitidos = this.reflector.getAllAndOverride<Papel[]>(PAPEIS, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    // rota sem @Papeis(): basta estar autenticado
    if (!papeisPermitidos || papeisPermitidos.length === 0) {
      return true;
    }

    const { usuario } = contexto
      .switchToHttp()
      .getRequest<RequisicaoAutenticada>();

    if (!usuario) {
      throw new UnauthorizedException('Faça login para continuar.');
    }

    if (!papeisPermitidos.includes(usuario.papel)) {
      throw new ForbiddenException(
        `Acesso permitido apenas para: ${papeisPermitidos.join(', ')}.`,
      );
    }

    return true;
  }
}
