"use client";

import { useState } from "react";
import Link from "next/link";
import SeloStatus from "../../../components/SeloStatus";
import Carregando from "../../../components/Carregando";
import MensagemErro from "../../../components/MensagemErro";
import Paginacao from "../../../components/Paginacao";
import { useRequisicao } from "../../../hooks/useRequisicao";
import { useDebounce } from "../../../hooks/useDebounce";
import { listarPedidos, STATUS_PEDIDO, CANCELADO } from "../../../lib/pedidos";
import { buscarDashboard } from "../../../lib/relatorios";

// Gerenciamento de pedidos (rota /admin/pedidos)
export default function AdminPedidos() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);

  const buscaAtrasada = useDebounce(busca);

  // busca pelo nome do cliente, pelo e-mail ou pelo número do pedido (na API)
  const pedidosReq = useRequisicao(
    () =>
      listarPedidos({
        busca: buscaAtrasada,
        status: filtroStatus === "todos" ? undefined : filtroStatus,
        pagina,
      }),
    [buscaAtrasada, filtroStatus, pagina]
  );

  // total de pedidos e faturamento (sem cancelados) calculados no servidor
  const resumoReq = useRequisicao(() => buscarDashboard(), []);

  const dados = pedidosReq.dados;

  // sem o resumo (erro na API), a lista de pedidos continua funcionando
  let textoDoResumo = "Carregando resumo...";
  if (resumoReq.dados) {
    textoDoResumo = `${resumoReq.dados.totalPedidos} pedido(s) - faturamento de R$ ${resumoReq.dados.faturamento.toFixed(2)}`;
  } else if (resumoReq.erro) {
    textoDoResumo = "Não foi possível carregar o resumo.";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Pedidos</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {textoDoResumo}
      </p>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 flex flex-wrap gap-3">
        <input
          aria-label="Buscar por cliente, e-mail ou número do pedido"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
          placeholder="Buscar por cliente, e-mail ou número..."
          className="flex-1 min-w-[220px] border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />

        <select
          aria-label="Filtrar por status"
          value={filtroStatus}
          onChange={(e) => {
            setFiltroStatus(e.target.value);
            setPagina(1);
          }}
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

      {pedidosReq.erro && (
        <MensagemErro texto={pedidosReq.erro} aoTentarDeNovo={pedidosReq.recarregar} />
      )}

      {!pedidosReq.erro && !dados && <Carregando texto="Carregando pedidos..." />}

      {!pedidosReq.erro && dados && (
        <div>
          {dados.itens.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhum pedido encontrado.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {/* a API já devolve os mais novos primeiro */}
              {dados.itens.map((pedido) => (
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

          <Paginacao meta={dados.meta} aoMudar={setPagina} />
        </div>
      )}
    </div>
  );
}
