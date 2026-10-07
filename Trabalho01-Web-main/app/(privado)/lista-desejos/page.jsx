"use client";

import Link from "next/link";
import CardProduto from "../../../components/CardProduto";
import { useListaDesejos } from "../../../contexto/ListaDesejosContext";

// Lista de desejos (rota /lista-desejos)
export default function ListaDesejos() {
  const { itens } = useListaDesejos();

  // precisa estar logado porque cada pessoa tem a sua lista.
  // Essa checagem agora fica no layout do grupo (privado).

  if (itens.length === 0) {
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">
          Lista de desejos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sua lista está vazia. Clique no coração dos produtos que você quer
          comprar depois.
        </p>
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
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">
        Lista de desejos
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {itens.length} produto(s) guardado(s). Clique no coração vermelho para
        tirar da lista.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {itens.map((produto) => (
          <CardProduto key={produto.id} produto={produto} />
        ))}
      </div>
    </div>
  );
}
