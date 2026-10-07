"use client";

import { useState } from "react";
import { useCategorias } from "../../../contexto/CategoriasContext";

// Gerenciamento de categorias (rota /admin/categorias)
export default function AdminCategorias() {
  const {
    categorias,
    contarProdutos,
    adicionarCategoria,
    editarCategoria,
    excluirCategoria,
    alternarAtivaCategoria,
  } = useCategorias();

  const [nomeNovo, setNomeNovo] = useState("");
  const [erro, setErro] = useState("");

  // guarda qual categoria está sendo editada e o texto digitado
  const [editandoId, setEditandoId] = useState(null);
  const [textoEditado, setTextoEditado] = useState("");

  function criar(evento) {
    evento.preventDefault();
    setErro("");

    if (nomeNovo.trim().length < 3) {
      setErro("O nome precisa ter pelo menos 3 letras");
      return;
    }

    const resultado = adicionarCategoria(nomeNovo.trim());

    if (resultado.ok) {
      setNomeNovo("");
    } else {
      setErro(resultado.erro);
    }
  }

  function comecarEdicao(categoria) {
    setEditandoId(categoria.id);
    setTextoEditado(categoria.nome);
    setErro("");
  }

  function salvarEdicao(id) {
    const resultado = editarCategoria(id, textoEditado.trim());

    if (resultado.ok) {
      setEditandoId(null);
    } else {
      setErro(resultado.erro);
    }
  }

  function clicarExcluir(categoria) {
    setErro("");

    const certeza = confirm(`Excluir a categoria "${categoria.nome}"?`);

    if (!certeza) {
      return;
    }

    const resultado = excluirCategoria(categoria.id);

    if (!resultado.ok) {
      setErro(resultado.erro);
    }
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
          className="bg-blue-700 text-white rounded px-5 py-2 font-bold hover:bg-blue-800"
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
                    {contarProdutos(categoria.nome)} produto(s) nesta categoria
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
                      className="bg-blue-700 text-white rounded px-3 py-1 text-sm font-bold hover:bg-blue-800"
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
                      onClick={() => alternarAtivaCategoria(categoria.id)}
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
