"use client";

import { useState } from "react";
import GraficoBarras from "../../../components/GraficoBarras";
import Carregando from "../../../components/Carregando";
import MensagemErro from "../../../components/MensagemErro";
import { useRequisicao } from "../../../hooks/useRequisicao";
import { buscarRelatorioVendas } from "../../../lib/relatorios";
import { listarCategorias } from "../../../lib/categorias";
import { listarTodosOsProdutos } from "../../../lib/produtos";

// Relatórios (rota /admin/relatorios)
export default function AdminRelatorios() {
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroProduto, setFiltroProduto] = useState("todos");

  function limparFiltros() {
    setDe("");
    setAte("");
    setFiltroCategoria("todas");
    setFiltroProduto("todos");
  }

  // Os números são calculados no servidor (SUM/COUNT/GROUP BY no banco),
  // com os filtros de período, categoria e produto.
  const relatorioReq = useRequisicao(
    () =>
      buscarRelatorioVendas({
        de: de || undefined,
        ate: ate || undefined,
        categoriaId: filtroCategoria === "todas" ? undefined : filtroCategoria,
        produtoId: filtroProduto === "todos" ? undefined : filtroProduto,
      }),
    [de, ate, filtroCategoria, filtroProduto]
  );

  const categoriasReq = useRequisicao(() => listarCategorias(), []);
  const produtosReq = useRequisicao(() => listarTodosOsProdutos(), []);

  const dados = relatorioReq.dados;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Relatórios</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Pedidos cancelados não entram nas contas. Com uma categoria ou um
        produto escolhido, os números e os gráficos contam só os pedidos que
        têm esses itens.
      </p>

      {/* filtros */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <h2 className="font-bold mb-3">Filtros</h2>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[150px]">
            <label htmlFor="relatorio-de" className="block text-sm font-bold mb-1">De</label>
            <input
              id="relatorio-de"
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label htmlFor="relatorio-ate" className="block text-sm font-bold mb-1">Até</label>
            <input
              id="relatorio-ate"
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label htmlFor="relatorio-categoria" className="block text-sm font-bold mb-1">
              Categoria
            </label>
            <select
              id="relatorio-categoria"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="todas">Todas</option>
              {(categoriasReq.dados ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label htmlFor="relatorio-produto" className="block text-sm font-bold mb-1">
              Produto
            </label>
            <select
              id="relatorio-produto"
              value={filtroProduto}
              onChange={(e) => setFiltroProduto(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="todos">Todos</option>
              {(produtosReq.dados ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={limparFiltros}
          className="mt-3 border-2 border-gray-300 dark:border-gray-600 rounded px-4 py-2 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Limpar filtros
        </button>
      </div>

      {relatorioReq.erro && (
        <MensagemErro texto={relatorioReq.erro} aoTentarDeNovo={relatorioReq.recarregar} />
      )}

      {!relatorioReq.erro && !dados && <Carregando texto="Calculando relatório..." />}

      {!relatorioReq.erro && dados && (
        <div>
          {/* números gerais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Total de vendas</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{dados.totalVendas}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Faturamento</p>
              <p className="text-3xl font-bold text-green-700">
                R$ {dados.faturamento.toFixed(2)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Peças vendidas</p>
              <p className="text-3xl font-bold text-orange-500">{dados.pecasVendidas}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Ticket médio</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                R$ {dados.ticketMedio.toFixed(2)}
              </p>
            </div>
          </div>

          {/* gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="font-bold mb-4">Faturamento por dia</h2>
              <GraficoBarras
                dados={dados.faturamentoPorDia}
                prefixo="R$ "
                cor="bg-green-600"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="font-bold mb-4">Pedidos por dia</h2>
              <GraficoBarras dados={dados.pedidosPorDia} prefixo="" cor="bg-blue-700" />
            </div>

            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="font-bold mb-4">Produtos mais vendidos</h2>
              <GraficoBarras
                dados={dados.maisVendidos}
                prefixo=""
                cor="bg-green-600"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="font-bold mb-4">Produtos menos vendidos</h2>
              <GraficoBarras
                dados={dados.menosVendidos}
                prefixo=""
                cor="bg-orange-500"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="font-bold mb-4">Vendas por categoria</h2>
              <GraficoBarras
                dados={dados.vendasPorCategoria}
                prefixo="R$ "
                cor="bg-indigo-600"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
              <h2 className="font-bold mb-4">Clientes cadastrados</h2>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{dados.clientes.total}</p>
              <div className="mt-4 flex flex-col gap-2">
                {dados.clientes.recentes.map((cliente) => (
                  <div key={cliente.id} className="text-sm">
                    <span className="font-bold">{cliente.nome}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {" "}
                      - cadastrado em {cliente.dataCadastro}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
