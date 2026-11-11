import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Toda resposta de erro da API passa por aqui e sai no mesmo formato:
// { sucesso: false, erro: { status, mensagem }, caminho, timestamp }
//
// O @Catch() vazio pega QUALQUER exceção. O que não é HttpException
// (erro de programação, banco fora do ar...) vira 500 com uma mensagem
// genérica, e o detalhe técnico vai só para o log. Nunca devolvemos
// stack trace para o cliente.
@Catch()
export class TodosErrosFilter implements ExceptionFilter {
  private readonly logger = new Logger('Erros');

  catch(excecao: unknown, host: ArgumentsHost) {
    const contexto = host.switchToHttp();
    const resposta = contexto.getResponse<Response>();
    const requisicao = contexto.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensagem = 'Erro interno do servidor.';
    let codigo: string | undefined;
    let detalhes: string[] | undefined;

    if (excecao instanceof HttpException) {
      status = excecao.getStatus();
      const corpo = excecao.getResponse();

      if (typeof corpo === 'string') {
        mensagem = corpo;
      } else {
        const dados = corpo as Record<string, unknown>;

        // o ValidationPipe devolve a lista de campos inválidos em "message"
        if (Array.isArray(dados.message)) {
          mensagem = 'Dados inválidos.';
          detalhes = dados.message.map(String);
        } else if (typeof dados.mensagem === 'string') {
          // exceções próprias (ex.: SemEstoqueException) usam "mensagem"
          mensagem = dados.mensagem;
        } else if (typeof dados.message === 'string') {
          mensagem = dados.message;
        }

        if (typeof dados.codigo === 'string') {
          codigo = dados.codigo;
        }
      }

      // rota que não existe: o Nest manda "Cannot GET /x" em inglês
      if (status === 404 && mensagem.startsWith('Cannot ')) {
        mensagem = `Rota não encontrada: ${requisicao.method} ${requisicao.path}`;
      }
    } else if (
      excecao instanceof QueryFailedError &&
      /UNIQUE constraint failed/i.test(excecao.message)
    ) {
      // rede de segurança: os services já conferem duplicidade antes,
      // mas se duas requisições chegarem juntas o banco ainda barra
      status = HttpStatus.CONFLICT;
      mensagem = 'Registro duplicado.';
    } else {
      const detalheTecnico =
        excecao instanceof Error
          ? (excecao.stack ?? excecao.message)
          : String(excecao);
      this.logger.error(
        `${requisicao.method} ${requisicao.path} -> ${detalheTecnico}`,
      );
    }

    resposta.status(status).json({
      sucesso: false,
      erro: {
        status,
        mensagem,
        ...(codigo ? { codigo } : {}),
        ...(detalhes ? { detalhes } : {}),
      },
      caminho: requisicao.originalUrl ?? requisicao.url,
      timestamp: new Date().toISOString(),
    });
  }
}
