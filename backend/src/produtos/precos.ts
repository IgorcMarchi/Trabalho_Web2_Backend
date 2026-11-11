import { arredondar } from '../comum/utils/valores';

interface ComPreco {
  preco: number;
  precoPromocional: number | null;
}

// O preço que vale na loja e no checkout: o promocional, se existir.
// É a mesma regra do front (dados/precos.js), mas aqui é a que conta:
// o servidor nunca usa o preço que veio do navegador.
export function precoFinal(produto: ComPreco): number {
  return produto.precoPromocional && produto.precoPromocional > 0
    ? produto.precoPromocional
    : produto.preco;
}

export function subtotal(produto: ComPreco, quantidade: number): number {
  return arredondar(precoFinal(produto) * quantidade);
}
