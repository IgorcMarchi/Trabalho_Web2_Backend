// Os mesmos textos que o front-end já usava (SeloStatus pinta cada um
// de uma cor), por isso os valores têm espaço e acento.
export enum StatusPedido {
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO PAGAMENTO',
  PAGAMENTO_APROVADO = 'PAGAMENTO APROVADO',
  EM_PREPARACAO = 'EM PREPARAÇÃO',
  ENVIADO = 'ENVIADO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

// A esteira normal do pedido, na ordem. CANCELADO fica fora dela.
export const SEQUENCIA_STATUS: StatusPedido[] = [
  StatusPedido.AGUARDANDO_PAGAMENTO,
  StatusPedido.PAGAMENTO_APROVADO,
  StatusPedido.EM_PREPARACAO,
  StatusPedido.ENVIADO,
  StatusPedido.ENTREGUE,
];

export enum StatusPagamento {
  PENDENTE = 'PENDENTE',
  APROVADO = 'APROVADO',
  CANCELADO = 'CANCELADO',
}

export enum FormaPagamento {
  PIX = 'PIX',
  BOLETO = 'BOLETO',
  CARTAO = 'CARTAO',
}
