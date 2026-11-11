"use client";

import { useState } from "react";
import Link from "next/link";
import Carregando from "../../../components/Carregando";
import MensagemErro from "../../../components/MensagemErro";
import Paginacao from "../../../components/Paginacao";
import { useRequisicao } from "../../../hooks/useRequisicao";
import { useDebounce } from "../../../hooks/useDebounce";
import { atualizarProduto, excluirProduto, listarProdutos } from "../../../lib/produtos";
import { listarCategorias } from "../../../lib/categorias";
import { temPromocao } from "../../../dados/precos";

// Lista de produtos do painel (rota /admin/produtos)
export default function AdminProdutos() {
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [pagina, setPagina] = useState(1);
  const [erroAcao, setErroAcao] = useState("");
  const [sucesso, setSucesso] = useState("");

  const buscaAtrasada = useDebounce(busca);

  // os três filtros são aplicados pela API, no banco
  const produtosReq = useRequisicao(
    () =>
      listarProdutos({
        busca: buscaAtrasada,
        categoriaId: filtroCategoria === "todas" ? undefined : filtroCategoria,
        status: filtroStatus,
        pagina,
        limite: 20,
      }),
    [buscaAtrasada, filtroCategoria, filtroStatus, pagina]
  );

  const categoriasReq = useRequisicao(() => listarCategorias(), []);
  const categorias = categoriasReq.dados ?? [];

  // filtro novo começa da primeira página
  function filtrar(mudar) {
    return (evento) => {
      mudar(evento.target.value);
      setPagina(1);
    };
  }

  async function executar(acao, mensagemDeSucesso) {
    setErroAcao("");
    setSucesso("");
    try {
      await acao();
      produtosReq.recarregar();
      setSucesso(mensagemDeSucesso);
    } catch (e) {
      setErroAcao(e.message);
    }
  }

  function clicarExcluir(produto) {
    // o confirm é a janelinha do próprio navegador perguntando sim ou não
    const certeza = confirm(`Excluir o produto "${produto.nome}"?`);

    if (certeza) {
      executar(() => excluirProduto(produto.id), `Produto "${produto.nome}" excluído.`);
    }
  }

  function alternarStatus(produto) {
    const novoStatus = produto.status === "ATIVO" ? "INATIVO" : "ATIVO";
    executar(
      () => atualizarProduto(produto.id, { status: novoStatus }),
      novoStatus === "ATIVO"
        ? `Produto "${produto.nome}" ativado.`
        : `Produto "${produto.nome}" desativado.`
    );
  }

  const dados = produtosReq.dados;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Produtos</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Catálogo da loja (dados do banco)
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
          onChange={filtrar(setBusca)}
          placeholder="Buscar pelo nome..."
          aria-label="Buscar produto pelo nome"
          className="flex-1 min-w-[200px] border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />

        <select
          value={filtroCategoria}
          onChange={filtrar(setFiltroCategoria)}
          aria-label="Filtrar por categoria"
          className="border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        >
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>

        <select
          value={filtroStatus}
          onChange={filtrar(setFiltroStatus)}
          aria-label="Filtrar por status"
          className="border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        >
          <option value="TODOS">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
        </select>
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

      {produtosReq.erro && (
        <MensagemErro texto={produtosReq.erro} aoTentarDeNovo={produtosReq.recarregar} />
      )}

      {!produtosReq.erro && !dados && <Carregando />}

      {!produtosReq.erro && dados && (
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            Mostrando {dados.itens.length} de {dados.meta.total} produto(s)
            {produtosReq.carregando && " - atualizando..."}
          </p>

          {dados.itens.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Nenhum produto encontrado.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {dados.itens.map((produto) => (
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
                      ID {produto.id} - {produto.categoria} - {produto.estoque} em
                      estoque - cadastrado em {produto.dataCadastro}
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
                      onClick={() => alternarStatus(produto)}
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

          <Paginacao meta={dados.meta} aoMudar={setPagina} />
        </div>
      )}
    </div>
  );
}
