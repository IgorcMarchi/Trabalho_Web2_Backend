"use client";

import { useState } from "react";
import { useFeedback } from "../../../contexto/FeedbackContext";
import { useProdutos } from "../../../contexto/ProdutosContext";

// transforma a nota em estrelinhas, ex: 4 vira ****o
function estrelas(nota) {
  return "★".repeat(nota) + "☆".repeat(5 - nota);
}

// Gerenciamento de avaliações (rota /admin/avaliacoes)
export default function AdminAvaliacoes() {
  const {
    todasAsAvaliacoes,
    removerFeedbackProduto,
    feedbacksSite,
    removerFeedbackSite,
  } = useFeedback();

  const { pegarProduto } = useProdutos();

  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [aba, setAba] = useState("PRODUTOS");

  const avaliacoes = todasAsAvaliacoes();

  // nomes dos produtos que têm avaliação, pro filtro
  const produtosComAvaliacao = [...new Set(avaliacoes.map((a) => a.produtoId))];

  const lista = avaliacoes.filter(
    (a) => filtroProduto === "todos" || a.produtoId === filtroProduto
  );

  function nomeDoProduto(produtoId) {
    const produto = pegarProduto(produtoId);
    return produto ? produto.nome : "Produto excluído (ID " + produtoId + ")";
  }

  function clicarExcluirProduto(avaliacao) {
    const certeza = confirm(
      `Remover a avaliação de ${avaliacao.nome}?`
    );

    if (certeza) {
      removerFeedbackProduto(avaliacao.produtoId, avaliacao.indice);
    }
  }

  function clicarExcluirSite(indice, nome) {
    const certeza = confirm(`Remover a avaliação de ${nome}?`);

    if (certeza) {
      removerFeedbackSite(indice);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Avaliações</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {avaliacoes.length} em produtos e {feedbacksSite.length} sobre o site
      </p>

      {/* abas */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setAba("PRODUTOS")}
          className={
            aba === "PRODUTOS"
              ? "px-4 py-2 rounded bg-blue-700 text-white font-bold"
              : "px-4 py-2 rounded bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
          }
        >
          Avaliações de produtos
        </button>
        <button
          onClick={() => setAba("SITE")}
          className={
            aba === "SITE"
              ? "px-4 py-2 rounded bg-blue-700 text-white font-bold"
              : "px-4 py-2 rounded bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
          }
        >
          Avaliações do site
        </button>
      </div>

      {aba === "PRODUTOS" ? (
        <div>
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <select
              value={filtroProduto}
              onChange={(e) => setFiltroProduto(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="todos">Todos os produtos</option>
              {produtosComAvaliacao.map((id) => (
                <option key={id} value={id}>
                  {nomeDoProduto(id)}
                </option>
              ))}
            </select>
          </div>

          {lista.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhuma avaliação encontrada.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {lista.map((avaliacao) => (
                <div
                  key={avaliacao.produtoId + "-" + avaliacao.indice}
                  className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-bold">
                        {nomeDoProduto(avaliacao.produtoId)}
                      </p>
                      <p className="mt-1">
                        <span className="font-bold">{avaliacao.nome}</span>{" "}
                        <span className="text-orange-500">
                          {estrelas(avaliacao.nota)}
                        </span>
                      </p>
                      {avaliacao.email && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {avaliacao.email}
                        </p>
                      )}
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {avaliacao.comentario}
                      </p>
                    </div>

                    <button
                      onClick={() => clicarExcluirProduto(avaliacao)}
                      className="border-2 border-red-600 text-red-600 rounded px-3 py-1 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {feedbacksSite.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma avaliação sobre o site ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {feedbacksSite.map((avaliacao, indice) => (
                <div
                  key={indice}
                  className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-wrap items-start gap-3"
                >
                  <div className="flex-1 min-w-[220px]">
                    <p>
                      <span className="font-bold">{avaliacao.nome}</span>{" "}
                      <span className="text-orange-500">
                        {estrelas(avaliacao.nota)}
                      </span>
                    </p>
                    {avaliacao.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{avaliacao.email}</p>
                    )}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {avaliacao.comentario}
                    </p>
                  </div>

                  <button
                    onClick={() => clicarExcluirSite(indice, avaliacao.nome)}
                    className="border-2 border-red-600 text-red-600 rounded px-3 py-1 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
