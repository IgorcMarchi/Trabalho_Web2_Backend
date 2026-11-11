import { HttpException, HttpStatus } from '@nestjs/common';

// Exceção com o nome da regra e um código para o front tratar
// sem depender do texto da mensagem. 409 = conflito com o estado atual.
export class SemEstoqueException extends HttpException {
  constructor(nomeProduto: string, disponivel: number, pedido: number) {
    super(
      {
        codigo: 'SEM_ESTOQUE',
        mensagem: `Estoque insuficiente para "${nomeProduto}": pedido ${pedido}, disponível ${disponivel}.`,
      },
      HttpStatus.CONFLICT,
    );
  }
}
