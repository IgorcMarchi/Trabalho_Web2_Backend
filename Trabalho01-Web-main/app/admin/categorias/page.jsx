"use client";

import { useState } from "react";
import Carregando from "../../../components/Carregando";
import MensagemErro from "../../../components/MensagemErro";
import { useRequisicao } from "../../../hooks/useRequisicao";
import {
  atualizarCategoria,
  criarCategoria,
  excluirCategoria,
  listarCategorias,
} from "../../../lib/categorias";

// Gerenciamento de categorias (rota /admin/categorias)
export default function AdminCategorias() {
  // cada categoria já vem da API com quantos produtos tem
  const { dados, erro: erroLista, recarregar } = useRequisicao(() => listarCategorias(), []);
  const categorias = dados ?? [];

  const [nomeNovo, setNomeNovo] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // guarda qual categoria está sendo editada e o texto digitado
  const [editandoId, setEditandoId] = useState(null);
  const [textoEditado, setTextoEditado] = useState("");

  // As regras (nome repetido, categoria com produto) quem confere é a API;
  // aqui só mostramos a mensagem que ela devolver.
  async function executar(acao) {
    setErro("");
    setSalvando(true);
    try {
      await acao();
      recarregar();
      return true;
    } catch (e) {
      setErro(e.message);
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function criar(evento) {
    evento.preventDefault();
    setErro("");

    if (nomeNovo.trim().length < 3) {
      setErro("O nome precisa ter pelo menos 3 letras");
      return;
    }

    if (await executar(() => criarCategoria(nomeNovo.trim()))) {
      setNomeNovo("");
    }
  }

  function comecarEdicao(categoria) {
    setEditandoId(categoria.id);
    setTextoEditado(categoria.nome);
    setErro("");
  }

  async function salvarEdicao(id) {
    // renomear não mexe nos produtos: eles apontam para o id da categoria
    if (await executar(() => atualizarCategoria(id, { nome: textoEditado.trim() }))) {
      setEditandoId(null);
    }
  }

  function clicarExcluir(categoria) {
    setErro("");

    const certeza = confirm(`Excluir a categoria "${categoria.nome}"?`);

    if (certeza) {
      // com produtos dentro, a API responde 409 e a mensagem aparece aqui
      executar(() => excluirCategoria(categoria.id));
    }
  }

  if (erroLista) {
    return <MensagemErro texto={erroLista} aoTentarDeNovo={recarregar} />;
  }

  if (!dados) {
    return <Carregando texto="Carregando categorias..." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Categorias</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {categorias.length} cadastrada(s)
      </p>

      {erro && (
        <p className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mb-4">
          {erro}
        </p>
      )}

      {/* formulário de nova categoria */}
      <form
        onSubmit={criar}
        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 flex flex-wrap gap-3"
      >
        <input
          value={nomeNovo}
          onChange={(e) => setNomeNovo(e.target.value)}
          placeholder="Nome da nova categoria"
          className="flex-1 min-w-[200px] border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />
        <button
          type="submit"
          disabled={salvando}
          className="bg-blue-700 text-white rounded px-5 py-2 font-bold hover:bg-blue-800 disabled:opacity-60"
        >
          Criar categoria
        </button>
      </form>

      {categorias.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Nenhuma categoria cadastrada.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {categorias.map((categoria) => (
            <div
              key={categoria.id}
              className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-wrap items-center gap-3"
            >
              {editandoId === categoria.id ? (
                <input
                  value={textoEditado}
                  onChange={(e) => setTextoEditado(e.target.value)}
                  className="flex-1 min-w-[200px] border-2 border-blue-400 rounded p-2"
                />
              ) : (
                <div className="flex-1 min-w-[200px]">
                  <p className="font-bold">{categoria.nome}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {categoria.quantidadeProdutos} produto(s) nesta categoria
                  </p>
                </div>
              )}

              <span
                className={
                  categoria.ativa
                    ? "bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded"
                }
              >
                {categoria.ativa ? "ATIVA" : "INATIVA"}
              </span>

              <div className="flex gap-2">
                {editandoId === categoria.id ? (
                  <>
                    <button
                      onClick={() => salvarEdicao(categoria.id)}
                      disabled={salvando}
                      className="bg-blue-700 text-white rounded px-3 py-1 text-sm font-bold hover:bg-blue-800 disabled:opacity-60"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="border-2 border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => comecarEdicao(categoria)}
                      className="border-2 border-blue-700 text-blue-700 dark:text-blue-400 rounded px-3 py-1 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900"
                    >
                      Renomear
                    </button>
                    <button
                      onClick={() =>
                        executar(() =>
                          atualizarCategoria(categoria.id, { ativa: !categoria.ativa })
                        )
                      }
                      className="border-2 border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {categoria.ativa ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => clicarExcluir(categoria)}
                      className="border-2 border-red-600 text-red-600 rounded px-3 py-1 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900"
                    >
                      Excluir
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-gray-500 dark:text-gray-400 text-sm mt-6">
        Renomear uma categoria muda o nome dela em todos os produtos.
        Categoria desativada some dos filtros da loja.
      </p>
    </div>
  );
}
