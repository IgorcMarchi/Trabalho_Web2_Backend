"use client";

import { MAXIMO_POR_ITEM, useCarrinho } from "../contexto/CarrinhoContext";
import { precoFinal, temPromocao, porcentagemDesconto } from "../dados/precos";

// Uma linha do carrinho. Recebe o item por props.
// Preço, estoque e o aviso de problema vêm do servidor (CarrinhoContext).
function ItemCarrinho({ item }) {
  const { remover, mudarQuantidade } = useCarrinho();

  const preco = precoFinal(item);
  const noLimiteDoEstoque = item.estoque !== undefined && item.quantidade >= item.estoque;
  const noLimitePorProduto = item.quantidade >= MAXIMO_POR_ITEM;

  let motivoDoLimite;
  if (noLimiteDoEstoque) {
    motivoDoLimite = "Não há mais unidades em estoque";
  } else if (noLimitePorProduto) {
    motivoDoLimite = `No máximo ${MAXIMO_POR_ITEM} unidades por produto`;
  }

  return (
    <div
      className={
        item.disponivel === false
          ? "bg-white dark:bg-gray-800 border-2 border-yellow-400 rounded-lg p-4 flex flex-wrap items-center gap-4"
          : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-wrap items-center gap-4"
      }
    >
      <img
        src={item.imagem}
        alt={item.nome}
        className="h-20 w-20 object-contain bg-white rounded"
      />

      <div className="flex-1 min-w-[180px]">
        <h3 className="text-sm font-bold line-clamp-2">{item.nome}</h3>

        <div className="flex items-center gap-2 mt-1">
          <p className="text-green-700 font-bold">R$ {preco.toFixed(2)}</p>
          {temPromocao(item) && (
            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded font-bold">
              -{porcentagemDesconto(item)}%
            </span>
          )}
        </div>

        {item.problema && (
          <p className="text-sm text-yellow-800 dark:text-yellow-300 font-bold mt-1">{item.problema}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => mudarQuantidade(item.id, item.quantidade - 1)}
          aria-label={`Diminuir a quantidade de ${item.nome}`}
          className="bg-gray-200 dark:bg-gray-600 w-8 h-8 rounded font-bold hover:bg-gray-300 dark:hover:bg-gray-500"
        >
          -
        </button>
        <span className="w-8 text-center font-bold">{item.quantidade}</span>
        <button
          onClick={() => mudarQuantidade(item.id, item.quantidade + 1)}
          disabled={Boolean(motivoDoLimite)}
          title={motivoDoLimite}
          aria-label={`Aumentar a quantidade de ${item.nome}`}
          className="bg-gray-200 dark:bg-gray-600 w-8 h-8 rounded font-bold hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>

      <p className="font-bold w-24 text-right">
        R$ {(preco * item.quantidade).toFixed(2)}
      </p>

      <button
        onClick={() => remover(item.id)}
        className="text-red-600 text-sm hover:underline"
      >
        Remover
      </button>
    </div>
  );
}

export default ItemCarrinho;
