// Funções pra lidar com o preço do produto.
// Se o produto tiver preço promocional, é ele que vale na loja.

export function precoFinal(produto) {
  return produto.precoPromocional ? produto.precoPromocional : produto.preco;
}

export function temPromocao(produto) {
  return produto.precoPromocional ? true : false;
}

// calcula quantos por cento de desconto, pra mostrar no selo (-20%)
export function porcentagemDesconto(produto) {
  if (!temPromocao(produto)) {
    return 0;
  }

  const diferenca = produto.preco - produto.precoPromocional;

  return Math.round((diferenca / produto.preco) * 100);
}
