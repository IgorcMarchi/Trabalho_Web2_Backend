"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import SeloStatus from "../../../../components/SeloStatus";
import {
  usePedidos,
  STATUS_PEDIDO,
  CANCELADO,
} from "../../../../contexto/PedidosContext";
import { precoFinal } from "../../../../dados/precos";

// Detalhe do pedido (rota /admin/pedidos/[numero])
export default function DetalhePedido() {
  const params = useParams();
  const { pegarPedido, mudarStatus, cancelarPedido, proximoStatus } =
    usePedidos();

  const pedido = pegarPedido(params.numero);

  if (!pedido) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Pedido não encontrado
        </h1>
        <Link href="/admin/pedidos" className="text-blue-700 dark:text-blue-400 hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const proximo = proximoStatus(pedido.statusPedido);

  function clicarCancelar() {
    const certeza = confirm(`Cancelar o pedido #${pedido.numero}?`);

    if (certeza) {
      cancelarPedido(pedido.numero);
    }
  }

  return (
    <div>
      <Link href="/admin/pedidos" className="text-blue-700 dark:text-blue-400 hover:underline">
        Voltar para os pedidos
      </Link>

      <div className="flex flex-wrap items-center gap-3 mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          Pedido #{pedido.numero}
        </h1>
        <SeloStatus status={pedido.statusPedido} />
        <span className="text-gray-500 dark:text-gray-400">{pedido.data}</span>
      </div>

      <div className="flex flex-wrap gap-4">
        {/* produtos do pedido */}
        <div className="flex-1 min-w-[320px]">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <h2 className="font-bold mb-3">Produtos</h2>

            {pedido.itens.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 mb-3"
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

            <p className="border-t-2 border-gray-200 dark:border-gray-700 pt-3 text-right font-bold text-lg">
              Total:{" "}
              <span className="text-green-700">
                R$ {pedido.total.toFixed(2)}
              </span>
            </p>
          </div>

          {/* mudar o status */}
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 mt-4">
            <h2 className="font-bold mb-3">Status do pedido</h2>

            {/* mostra a esteira toda, marcando onde o pedido está */}
            <div className="flex flex-wrap gap-2 mb-4">
              {STATUS_PEDIDO.map((s) => (
                <span
                  key={s}
                  className={
                    s === pedido.statusPedido
                      ? "text-xs font-bold px-2 py-1 rounded bg-blue-700 text-white"
                      : "text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
                  }
                >
                  {s}
                </span>
              ))}
            </div>

            {pedido.statusPedido === CANCELADO ? (
              <p className="text-red-700 font-bold">
                Este pedido foi cancelado.
              </p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {proximo ? (
                  <button
                    onClick={() => mudarStatus(pedido.numero, proximo)}
                    className="bg-blue-700 text-white rounded px-5 py-2 font-bold hover:bg-blue-800"
                  >
                    Avançar para: {proximo}
                  </button>
                ) : (
                  <p className="text-green-700 font-bold py-2">
                    Pedido finalizado.
                  </p>
                )}

                <button
                  onClick={clicarCancelar}
                  className="border-2 border-red-600 text-red-600 rounded px-5 py-2 font-bold hover:bg-red-50 dark:hover:bg-red-900"
                >
                  Cancelar pedido
                </button>
              </div>
            )}
          </div>
        </div>

        {/* dados do cliente e da entrega */}
        <div className="w-full lg:w-80">
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
            <h2 className="font-bold mb-3">Cliente</h2>
            <p className="text-sm">{pedido.clienteNome}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{pedido.clienteEmail}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{pedido.telefone}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 mt-4">
            <h2 className="font-bold mb-3">Entrega</h2>
            <p className="text-sm">{pedido.endereco.rua}</p>
            <p className="text-sm">{pedido.endereco.cidade}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              CEP {pedido.endereco.cep}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 mt-4">
            <h2 className="font-bold mb-3">Pagamento</h2>
            <p className="text-sm mb-2">
              Forma: <strong>{pedido.formaPagamento}</strong>
            </p>
            <SeloStatus status={pedido.statusPagamento} />
          </div>
        </div>
      </div>
    </div>
  );
}
