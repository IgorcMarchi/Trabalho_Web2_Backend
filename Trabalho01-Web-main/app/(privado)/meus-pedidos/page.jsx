"use client";

import Link from "next/link";
import SeloStatus from "../../../components/SeloStatus";
import { usePedidos } from "../../../contexto/PedidosContext";
import { precoFinal } from "../../../dados/precos";

// Histórico de pedidos do cliente (rota /meus-pedidos)
export default function MeusPedidos() {
  const { pedidos } = usePedidos();

  // a checagem de login fica no layout do grupo (privado)

  if (pedidos.length === 0) {
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">Meus pedidos</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Você ainda não fez nenhum pedido.</p>
        <Link
          href="/produtos"
          className="bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  // o reverse deixa o pedido mais novo em cima.
  // usamos o [...pedidos] pra copiar a lista antes, senão o reverse
  // mexeria na lista original.
  const maisNovosPrimeiro = [...pedidos].reverse();

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">Meus pedidos</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Você já fez {pedidos.length} pedido(s).
      </p>

      <div className="flex flex-col gap-4">
        {maisNovosPrimeiro.map((pedido) => (
          <div
            key={pedido.numero}
            className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5"
          >
            <div className="flex flex-wrap justify-between items-center gap-2 border-b-2 border-gray-200 dark:border-gray-700 pb-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-lg">Pedido #{pedido.numero}</h2>
                <SeloStatus status={pedido.statusPedido} />
              </div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">{pedido.data}</span>
            </div>

            {pedido.itens.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 mb-2"
              >
                <img
                  src={item.imagem}
                  alt={item.nome}
                  className="h-12 w-12 object-contain bg-white rounded"
                />
                <p className="flex-1 min-w-[160px] text-sm line-clamp-1">
                  {item.nome}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.quantidade}x R$ {precoFinal(item).toFixed(2)}
                </p>
                <p className="text-sm font-bold w-24 text-right">
                  R$ {(precoFinal(item) * item.quantidade).toFixed(2)}
                </p>
              </div>
            ))}

            <div className="border-t-2 border-gray-200 dark:border-gray-700 mt-3 pt-3 flex flex-wrap justify-between gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>
                  Pagamento: <strong>{pedido.formaPagamento}</strong>{" "}
                  <SeloStatus status={pedido.statusPagamento} />
                </p>
                <p className="mt-1">
                  Entrega: {pedido.endereco.rua}, {pedido.endereco.cidade} -{" "}
                  {pedido.endereco.cep}
                </p>
              </div>

              <p className="font-bold text-lg">
                Total:{" "}
                <span className="text-green-700">
                  R$ {pedido.total.toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
