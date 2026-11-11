import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROTA_PUBLICA } from '../comum/decorators/publico.decorator';
import type {
  RequisicaoAutenticada,
  UsuarioToken,
} from '../comum/tipos/usuario-token.interface';

// "Quem é você?" — responde com 401 quando não dá para saber.
//
// Ele é GLOBAL (APP_GUARD): toda rota exige token, menos as marcadas
// com @Publico(). Assim, esquecer de proteger uma rota nova é impossível.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    const requisicao = contexto
      .switchToHttp()
      .getRequest<RequisicaoAutenticada>();
    const token = this.extrairToken(requisicao);

    if (publica) {
      // rota aberta: se veio um token válido, aproveitamos para saber
      // quem é (ex.: admin vendo produtos inativos). Token ruim é ignorado.
      if (token) {
        requisicao.usuario = await this.verificar(token).catch(() => undefined);
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException(
        'Token de acesso ausente. Faça login e envie o cabeçalho Authorization: Bearer <token>.',
      );
    }

    try {
      requisicao.usuario = await this.verificar(token);
    } catch (erro) {
      if (erro instanceof Error && erro.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Sessão expirada. Faça login novamente.',
        );
      }
      throw new UnauthorizedException('Token inválido.');
    }

    return true;
  }

  private verificar(token: string): Promise<UsuarioToken> {
    // confere a assinatura (JWT_SECRET) e a validade (exp)
    return this.jwtService.verifyAsync<UsuarioToken>(token);
  }

  private extrairToken(requisicao: RequisicaoAutenticada): string | undefined {
    const [tipo, token] = requisicao.headers.authorization?.split(' ') ?? [];
    return tipo === 'Bearer' && token ? token : undefined;
  }
}
