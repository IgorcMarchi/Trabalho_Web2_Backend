"use client";

import { useState } from "react";
import Link from "next/link";
import { useProdutos } from "../../../contexto/ProdutosContext";
import { temPromocao } from "../../../dados/precos";

// Lista de produtos do painel (rota /admin/produtos)
export default function AdminProdutos() {
  const { produtos, excluirProduto, alternarStatus } = useProdutos();

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const categorias = [...new Set(produtos.map((p) => p.categoria))];

  // os três filtros são aplicados um depois do outro
  const lista = produtos
    .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    .filter((p) => filtroCategoria === "todas" || p.categoria === filtroCategoria)
    .filter((p) => filtroStatus === "todos" || p.status === filtroStatus);

  function clicarExcluir(produto) {
    // o confirm é a janelinha do próprio navegador perguntando sim ou não
    const certeza = confirm(`Excluir o produto "${produto.nome}"?`);

    if (certeza) {
      excluirProduto(produto.id);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Produtos</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {produtos.length} cadastrado(s)
          </p>
        </div>

        <Link
          href="/admin/produtos/novo"
          className="bg-blue-700 text-white rounded px-5 py-3 font-bold hover:bg-blue-800"
        >
          Novo produto
        </Link>
      </div>

      {/* busca e filtros */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 flex flex-wrap gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pelo nome..."
          className="flex-1 min-w-[200px] border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        >
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        >
          <option value="todos">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
        </select>
      </div>

      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
        Mostrando {lista.length} produto(s)
      </p>

      {lista.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Nenhum produto encontrado.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((produto) => (
            <div
              key={produto.id}
              className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-wrap items-center gap-3"
            >
              <img
                src={produto.imagem}
                alt={produto.nome}
                className="h-14 w-14 object-contain bg-white rounded"
              />

              <div className="flex-1 min-w-[180px]">
                <p className="font-bold text-sm line-clamp-1">{produto.nome}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ID {produto.id} - {produto.categoria} - cadastrado em{" "}
                  {produto.dataCadastro}
                </p>
              </div>

              <div className="text-right min-w-[110px]">
                {temPromocao(produto) ? (
                  <div>
                    <p className="text-gray-400 text-xs line-through">
                      R$ {produto.preco.toFixed(2)}
                    </p>
                    <p className="text-green-700 font-bold">
                      R$ {produto.precoPromocional.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-green-700 font-bold">
                    R$ {produto.preco.toFixed(2)}
                  </p>
                )}
              </div>

              <span
                className={
                  produto.status === "ATIVO"
                    ? "bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded"
                }
              >
                {produto.status}
              </span>

              <div className="flex gap-2">
                <Link
                  href={`/admin/produtos/${produto.id}`}
                  className="border-2 border-blue-700 text-blue-700 dark:text-blue-400 rounded px-3 py-1 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900"
                >
                  Editar
                </Link>

                <button
                  onClick={() => alternarStatus(produto.id)}
                  className="border-2 border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {produto.status === "ATIVO" ? "Desativar" : "Ativar"}
                </button>

                <button
                  onClick={() => clicarExcluir(produto)}
                  className="border-2 border-red-600 text-red-600 rounded px-3 py-1 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
