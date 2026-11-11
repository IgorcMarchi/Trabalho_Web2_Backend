"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Carregando from "../../../components/Carregando";
import MensagemErro from "../../../components/MensagemErro";
import { useRequisicao } from "../../../hooks/useRequisicao";
import {
  atualizarCategoria,
  criarCategoria,
  excluirCategoria,
  listarCategorias,
} from "../../../lib/categorias";

// Regra do nome da categoria: a mesma do CriarCategoriaDto da API.
// Vale tanto para criar quanto para renomear.
const schema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "O nome precisa ter pelo menos 3 letras")
    .max(80, "O nome pode ter no máximo 80 letras"),
});

// Gerenciamento de categorias (rota /admin/categorias)
export default function AdminCategorias() {
  // cada categoria já vem da API com quantos produtos tem
  const { dados, erro: erroLista, recarregar } = useRequisicao(() => listarCategorias(), []);
  const categorias = dados ?? [];

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  // qual categoria está sendo renomeada (uma de cada vez)
  const [editandoId, setEditandoId] = useState(null);

  // um formulário para criar e outro para renomear, com a mesma regra
  const formNova = useForm({ resolver: zodResolver(schema), defaultValues: { nome: "" } });
  const formEdicao = useForm({ resolver: zodResolver(schema), defaultValues: { nome: "" } });

  // As regras que dependem do banco (nome repetido, categoria com produto)
  // quem confere é a API; aqui só mostramos a mensagem que ela devolver.
  async function executar(acao, mensagemDeSucesso) {
    setErro("");
    setSucesso("");
    setSalvando(true);
    try {
      await acao();
      recarregar();
      setSucesso(mensagemDeSucesso);
      return true;
    } catch (e) {
      setErro(e.message);
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function criar({ nome }) {
    if (await executar(() => criarCategoria(nome), `Categoria "${nome}" criada.`)) {
      formNova.reset({ nome: "" });
    }
  }

  function comecarEdicao(categoria) {
    setEditandoId(categoria.id);
    formEdicao.reset({ nome: categoria.nome });
    setErro("");
    setSucesso("");
  }

  async function salvarEdicao({ nome }) {
    // renomear não mexe nos produtos: eles apontam para o id da categoria
    const salvou = await executar(
      () => atualizarCategoria(editandoId, { nome }),
      `Categoria renomeada para "${nome}".`
    );

    if (salvou) {
      setEditandoId(null);
    }
  }

  function alternarAtiva(categoria) {
    executar(
      () => atualizarCategoria(categoria.id, { ativa: !categoria.ativa }),
      categoria.ativa
        ? `Categoria "${categoria.nome}" desativada.`
        : `Categoria "${categoria.nome}" ativada.`
    );
  }

  function clicarExcluir(categoria) {
    setErro("");
    setSucesso("");

    const certeza = confirm(`Excluir a categoria "${categoria.nome}"?`);

    if (certeza) {
      // com produtos dentro, a API responde 409 e a mensagem aparece aqui
      executar(
        () => excluirCategoria(categoria.id),
        `Categoria "${categoria.nome}" excluída.`
      );
    }
  }

  if (erroLista) {
    return <MensagemErro texto={erroLista} aoTentarDeNovo={recarregar} />;
  }

  if (!dados) {
    return <Carregando texto="Carregando categorias..." />;
  }

  const erroNova = formNova.formState.errors.nome;
  const erroEdicao = formEdicao.formState.errors.nome;

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

      {sucesso && (
        <p className="bg-green-100 border-2 border-green-300 text-green-800 rounded p-3 mb-4">
          {sucesso}
        </p>
      )}

      {/* formulário de nova categoria */}
      <form
        onSubmit={formNova.handleSubmit(criar)}
        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 flex flex-wrap gap-3"
      >
        <div className="flex-1 min-w-[200px]">
          <input
            {...formNova.register("nome")}
            placeholder="Nome da nova categoria"
            aria-label="Nome da nova categoria"
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {erroNova && <p className="text-red-600 text-sm mt-1">{erroNova.message}</p>}
        </div>
        <button
          type="submit"
          disabled={salvando}
          className="self-start bg-blue-700 text-white rounded px-5 py-2 font-bold hover:bg-blue-800 disabled:opacity-60"
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
                <div className="flex-1 min-w-[200px]">
                  <input
                    {...formEdicao.register("nome")}
                    aria-label={`Novo nome da categoria ${categoria.nome}`}
                    className="w-full border-2 border-blue-400 rounded p-2"
                  />
                  {erroEdicao && (
                    <p className="text-red-600 text-sm mt-1">{erroEdicao.message}</p>
                  )}
                </div>
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
                      onClick={formEdicao.handleSubmit(salvarEdicao)}
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
                      onClick={() => alternarAtiva(categoria)}
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
