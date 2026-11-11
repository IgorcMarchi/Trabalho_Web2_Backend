import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

// Registra toda requisição: método, URL, status e tempo.
// O status só é conhecido quando a resposta termina, por isso o log
// fica no evento "finish" (assim pega até o status dos erros).
//
// De propósito NÃO registramos corpo, cabeçalhos nem query string:
// o corpo do login tem a senha, o cabeçalho tem o token e a busca
// pode ter dados pessoais.
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(requisicao: Request, resposta: Response, proximo: NextFunction) {
    const inicio = Date.now();
    const caminho = requisicao.originalUrl.split('?')[0];

    resposta.on('finish', () => {
      const duracao = Date.now() - inicio;
      this.logger.log(
        `${requisicao.method} ${caminho} ${resposta.statusCode} - ${duracao}ms`,
      );
    });

    proximo();
  }
}
