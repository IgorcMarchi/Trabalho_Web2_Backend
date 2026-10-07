"use client";

import { useState } from "react";
import Link from "next/link";
import SeloStatus from "../../../components/SeloStatus";
import { usePedidos, STATUS_PEDIDO, CANCELADO } from "../../../contexto/PedidosContext";

// Gerenciamento de pedidos (rota /admin/pedidos)
export default function AdminPedidos() {
  const { todosPedidos } = usePedidos();

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  // busca pelo nome do cliente, pelo e-mail ou pelo número do pedido
  const lista = todosPedidos
    .filter((p) => {
      const texto = busca.toLowerCase();
      return (
        p.clienteNome.toLowerCase().includes(texto) ||
        p.clienteEmail.toLowerCase().includes(texto) ||
        String(p.numero).includes(texto)
      );
    })
    .filter((p) => filtroStatus === "todos" || p.statusPedido === filtroStatus);

  const maisNovosPrimeiro = [...lista].reverse();

  // soma só o que não foi cancelado
  const faturamento = todosPedidos
    .filter((p) => p.statusPedido !== CANCELADO)
    .reduce((soma, p) => soma + p.total, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Pedidos</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {todosPedidos.length} pedido(s) - faturamento de R${" "}
        {faturamento.toFixed(2)}
      </p>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 flex flex-wrap gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente, e-mail ou número..."
          className="flex-1 min-w-[220px] border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        >
          <option value="todos">Todos os status</option>
          {STATUS_PEDIDO.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value={CANCELADO}>{CANCELADO}</option>
        </select>
      </div>

      {maisNovosPrimeiro.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Nenhum pedido encontrado.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {maisNovosPrimeiro.map((pedido) => (
            <div
              key={pedido.numero}
              className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-wrap items-center gap-3"
            >
              <div className="w-16">
                <p className="font-bold">#{pedido.numero}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{pedido.data}</p>
              </div>

              <div className="flex-1 min-w-[180px]">
                <p className="font-bold text-sm">{pedido.clienteNome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{pedido.clienteEmail}</p>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[90px]">
                <p>{pedido.itens.length} item(ns)</p>
                <p className="text-xs">{pedido.formaPagamento}</p>
              </div>

              <p className="font-bold text-green-700 min-w-[100px] text-right">
                R$ {pedido.total.toFixed(2)}
              </p>

              <SeloStatus status={pedido.statusPedido} />

              <Link
                href={`/admin/pedidos/${pedido.numero}`}
                className="border-2 border-blue-700 text-blue-700 dark:text-blue-400 rounded px-3 py-1 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900"
              >
                Ver detalhes
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
