"use client";

import { useState } from "react";
import Carregando from "../../../components/Carregando";
import MensagemErro from "../../../components/MensagemErro";
import Paginacao from "../../../components/Paginacao";
import { useRequisicao } from "../../../hooks/useRequisicao";
import {
  listarAvaliacoes,
  listarFeedbacks,
  removerAvaliacao,
  removerFeedback,
} from "../../../lib/avaliacoes";
import { listarTodosOsProdutos } from "../../../lib/produtos";

// transforma a nota em estrelinhas, ex: 4 vira ★★★★☆
function estrelas(nota) {
  return "★".repeat(nota) + "☆".repeat(5 - nota);
}

// Gerenciamento de avaliações (rota /admin/avaliacoes)
export default function AdminAvaliacoes() {
  const [filtroProduto, setFiltroProduto] = useState("todos");
  const [aba, setAba] = useState("PRODUTOS");
  const [paginaProdutos, setPaginaProdutos] = useState(1);
  const [paginaSite, setPaginaSite] = useState(1);
  const [erroAcao, setErroAcao] = useState("");
  const [sucesso, setSucesso] = useState("");

  // com token de ADMIN, a API devolve também o e-mail de quem avaliou
  const avaliacoesReq = useRequisicao(
    () =>
      listarAvaliacoes({
        produtoId: filtroProduto === "todos" ? undefined : filtroProduto,
        pagina: paginaProdutos,
        limite: 20,
      }),
    [filtroProduto, paginaProdutos]
  );
  const feedbacksReq = useRequisicao(
    () => listarFeedbacks({ pagina: paginaSite, limite: 20 }),
    [paginaSite]
  );
  const produtosReq = useRequisicao(() => listarTodosOsProdutos(), []);

  async function remover(acao, recarregar) {
    setErroAcao("");
    setSucesso("");
    try {
      await acao();
      recarregar();
      setSucesso("Avaliação removida.");
    } catch (e) {
      setErroAcao(e.message);
    }
  }

  function clicarExcluirProduto(avaliacao) {
    const certeza = confirm(`Remover a avaliação de ${avaliacao.nome}?`);

    if (certeza) {
      remover(() => removerAvaliacao(avaliacao.id), avaliacoesReq.recarregar);
    }
  }

  function clicarExcluirSite(feedback) {
    const certeza = confirm(`Remover a avaliação de ${feedback.nome}?`);

    if (certeza) {
      remover(() => removerFeedback(feedback.id), feedbacksReq.recarregar);
    }
  }

  const avaliacoes = avaliacoesReq.dados;
  const feedbacks = feedbacksReq.dados;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Avaliações</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {avaliacoes ? avaliacoes.meta.total : "..."} em produtos
        {filtroProduto !== "todos" && " (no produto escolhido)"} e{" "}
        {feedbacks ? feedbacks.meta.total : "..."} sobre o site
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

      {erroAcao && (
        <p className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mb-4">
          {erroAcao}
        </p>
      )}

      {sucesso && (
        <p className="bg-green-100 border-2 border-green-300 text-green-800 rounded p-3 mb-4">
          {sucesso}
        </p>
      )}

      {aba === "PRODUTOS" ? (
        <div>
          <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
            <select
              aria-label="Filtrar avaliações por produto"
              value={filtroProduto}
              onChange={(e) => {
                setFiltroProduto(e.target.value);
                setPaginaProdutos(1);
              }}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="todos">Todos os produtos</option>
              {(produtosReq.dados ?? []).map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </select>
          </div>

          {avaliacoesReq.erro ? (
            <MensagemErro texto={avaliacoesReq.erro} aoTentarDeNovo={avaliacoesReq.recarregar} />
          ) : !avaliacoes ? (
            <Carregando texto="Carregando avaliações..." />
          ) : avaliacoes.itens.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhuma avaliação encontrada.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {avaliacoes.itens.map((avaliacao) => (
                <div
                  key={avaliacao.id}
                  className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="flex-1 min-w-[220px]">
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-bold">
                        {avaliacao.produtoNome ?? `Produto excluído (ID ${avaliacao.produtoId})`}
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

          {avaliacoes && <Paginacao meta={avaliacoes.meta} aoMudar={setPaginaProdutos} />}
        </div>
      ) : (
        <div>
          {feedbacksReq.erro ? (
            <MensagemErro texto={feedbacksReq.erro} aoTentarDeNovo={feedbacksReq.recarregar} />
          ) : !feedbacks ? (
            <Carregando texto="Carregando avaliações..." />
          ) : feedbacks.itens.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma avaliação sobre o site ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {feedbacks.itens.map((feedback) => (
                <div
                  key={feedback.id}
                  className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-wrap items-start gap-3"
                >
                  <div className="flex-1 min-w-[220px]">
                    <p>
                      <span className="font-bold">{feedback.nome}</span>{" "}
                      <span className="text-orange-500">
                        {estrelas(feedback.nota)}
                      </span>
                    </p>
                    {feedback.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{feedback.email}</p>
                    )}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {feedback.comentario}
                    </p>
                  </div>

                  <button
                    onClick={() => clicarExcluirSite(feedback)}
                    className="border-2 border-red-600 text-red-600 rounded px-3 py-1 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}

          {feedbacks && <Paginacao meta={feedbacks.meta} aoMudar={setPaginaSite} />}
        </div>
      )}
    </div>
  );
}
