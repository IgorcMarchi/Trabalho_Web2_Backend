"use client";

import Link from "next/link";
import ItemCarrinho from "../../components/ItemCarrinho";
import { useCarrinho } from "../../contexto/CarrinhoContext";

// Carrinho (rota /carrinho)
export default function Carrinho() {
  const { itens, total, limpar } = useCarrinho();

  // se não tem nada no carrinho, mostra um aviso no lugar da lista
  if (itens.length === 0) {
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">Carrinho</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Seu carrinho está vazio.</p>
        <Link
          href="/produtos"
          className="bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-6">Carrinho</h1>

      <div className="flex flex-col gap-3">
        {itens.map((item) => (
          <ItemCarrinho key={item.id} item={item} />
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-xl font-bold">
          Total: <span className="text-green-700">R$ {total.toFixed(2)}</span>
        </p>

        <div className="flex gap-2">
          <button
            onClick={limpar}
            className="border-2 border-gray-300 dark:border-gray-600 rounded px-4 py-2 font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Limpar carrinho
          </button>
          <Link
            href="/checkout"
            className="bg-orange-500 text-white rounded px-6 py-2 font-bold hover:bg-orange-600"
          >
            Finalizar compra
          </Link>
        </div>
      </div>
    </div>
  );
}
