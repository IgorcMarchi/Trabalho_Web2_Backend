"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Carregando from "../../../components/Carregando";
import MensagemErro from "../../../components/MensagemErro";
import { useRequisicao } from "../../../hooks/useRequisicao";
import {
  atualizarPromocao,
  criarPromocao,
  excluirPromocao,
  listarPromocoes,
} from "../../../lib/promocoes";
import { listarTodosOsProdutos } from "../../../lib/produtos";
import { listarCategorias } from "../../../lib/categorias";
import { dataDeHoje, diaParaBr } from "../../../lib/datas";

// Regras do formulário: as mesmas que a API confere (400/422).
// A mensagem aparece embaixo do campo, antes de ir ao servidor.
const schema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3, "O nome da promoção precisa ter pelo menos 3 letras")
      .max(120, "O nome pode ter no máximo 120 letras"),
    tipo: z.enum(["PORCENTAGEM", "VALOR"]),
    valor: z.coerce.number().positive("O valor do desconto precisa ser maior que zero"),
    dataInicio: z.string().min(1, "Escolha a data de início"),
    dataFim: z.string().min(1, "Escolha a data de término"),
    alvo: z.enum(["CATEGORIA", "PRODUTO"]),
    alvoId: z.string().min(1, "Escolha a qual produto ou categoria a promoção se aplica"),
  })
  // regras que dependem de dois campos ao mesmo tempo
  .refine((dados) => dados.tipo !== "PORCENTAGEM" || dados.valor <= 100, {
    message: "A porcentagem não pode passar de 100",
    path: ["valor"],
  })
  .refine((dados) => dados.dataFim >= dados.dataInicio, {
    message: "A data de término precisa ser igual ou depois da data de início",
    path: ["dataFim"],
  });

// classes do selo de situação de cada promoção
const SELO_VERDE = "bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded";
const SELO_AMARELO = "bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded";
const SELO_CINZA =
  "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded";

// Gerenciamento de promoções (rota /admin/promocoes)
export default function AdminPromocoes() {
  // TODAS = inclusive desativadas e fora do período (só ADMIN)
  const promocoesReq = useRequisicao(() => listarPromocoes({ situacao: "TODAS" }), []);
  const produtosReq = useRequisicao(() => listarTodosOsProdutos(), []);
  const categoriasReq = useRequisicao(() => listarCategorias(), []);

  const promocoes = promocoesReq.dados ?? [];
  const produtos = produtosReq.dados ?? [];
  const categorias = categoriasReq.dados ?? [];

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  // o formulário de nova promoção (React Hook Form + Zod)
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      tipo: "PORCENTAGEM",
      valor: "",
      dataInicio: dataDeHoje(),
      dataFim: "",
      alvo: "CATEGORIA",
      alvoId: "",
    },
  });

  // o rótulo do valor e a lista de opções mudam conforme a escolha
  const tipo = watch("tipo");
  const alvo = watch("alvo");

  // promoções que já venceram mas ainda estão marcadas como ativas
  const vencidas = promocoes.filter((p) => p.ativa && p.dataFim < dataDeHoje());

  async function executar(acao, mensagemDeSucesso) {
    setErro("");
    setSucesso("");
    setSalvando(true);
    try {
      await acao();
      promocoesReq.recarregar();
      setSucesso(mensagemDeSucesso);
      return true;
    } catch (e) {
      setErro(e.message);
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function criar(dados) {
    const criou = await executar(
      () =>
        criarPromocao({
          nome: dados.nome,
          tipo: dados.tipo,
          valor: dados.valor,
          dataInicio: dados.dataInicio,
          dataFim: dados.dataFim,
          alvo: dados.alvo,
          ...(dados.alvo === "CATEGORIA"
            ? { categoriaId: Number(dados.alvoId) }
            : { produtoId: Number(dados.alvoId) }),
          ativa: true,
        }),
      `Promoção "${dados.nome}" criada.`
    );

    if (criou) {
      // limpa o que muda de uma promoção para outra
      reset({ ...dados, nome: "", valor: "", alvoId: "", dataFim: "" });
    }
  }

  function alternarAtiva(promocao) {
    executar(
      () => atualizarPromocao(promocao.id, { ativa: !promocao.ativa }),
      promocao.ativa
        ? `Promoção "${promocao.nome}" desativada.`
        : `Promoção "${promocao.nome}" ativada.`
    );
  }

  function clicarExcluir(promocao) {
    const certeza = confirm(`Excluir a promoção "${promocao.nome}"?`);

    if (certeza) {
      executar(() => excluirPromocao(promocao.id), `Promoção "${promocao.nome}" excluída.`);
    }
  }

  const erroLista = promocoesReq.erro || produtosReq.erro || categoriasReq.erro;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Promoções</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        {promocoes.length} cadastrada(s)
      </p>

      {vencidas.length > 0 && (
        <p className="bg-yellow-50 border-2 border-yellow-300 text-yellow-900 rounded p-3 mb-4 text-sm">
          {vencidas.length} promoção(ões) já passaram da data de término, mas
          continuam marcadas como ativas: o desconto delas continua gravado nos
          produtos. Desative ou exclua para devolver o preço normal.
        </p>
      )}

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

      {/* formulário de nova promoção */}
      <form
        onSubmit={handleSubmit(criar)}
        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-6"
      >
        <h2 className="font-bold mb-4">Nova promoção</h2>

        <label htmlFor="promocao-nome" className="block font-bold mb-1">Nome</label>
        <input
          id="promocao-nome"
          {...register("nome")}
          placeholder="Ex: Semana do consumidor"
          className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />
        {errors.nome && <p className="text-red-600 text-sm mt-1">{errors.nome.message}</p>}

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="promocao-tipo" className="block font-bold mb-1">
              Tipo de desconto
            </label>
            <select
              id="promocao-tipo"
              {...register("tipo")}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="PORCENTAGEM">Porcentagem (%)</option>
              <option value="VALOR">Valor fixo (R$)</option>
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label htmlFor="promocao-valor" className="block font-bold mb-1">
              {tipo === "PORCENTAGEM" ? "Quantos %" : "Quantos R$"}
            </label>
            <input
              id="promocao-valor"
              type="number"
              step="0.01"
              {...register("valor")}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            />
            {errors.valor && <p className="text-red-600 text-sm mt-1">{errors.valor.message}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="promocao-inicio" className="block font-bold mb-1">Início</label>
            <input
              id="promocao-inicio"
              type="date"
              {...register("dataInicio")}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            />
            {errors.dataInicio && (
              <p className="text-red-600 text-sm mt-1">{errors.dataInicio.message}</p>
            )}
          </div>

          <div className="flex-1 min-w-[160px]">
            <label htmlFor="promocao-fim" className="block font-bold mb-1">Término</label>
            <input
              id="promocao-fim"
              type="date"
              {...register("dataFim")}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            />
            {errors.dataFim && (
              <p className="text-red-600 text-sm mt-1">{errors.dataFim.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="promocao-alvo" className="block font-bold mb-1">Aplicar em</label>
            <select
              id="promocao-alvo"
              // trocou entre categoria e produto: a escolha anterior não vale mais
              {...register("alvo", { onChange: () => setValue("alvoId", "") })}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="CATEGORIA">Uma categoria inteira</option>
              <option value="PRODUTO">Um produto só</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label htmlFor="promocao-alvoId" className="block font-bold mb-1">
              {alvo === "CATEGORIA" ? "Qual categoria" : "Qual produto"}
            </label>
            <select
              id="promocao-alvoId"
              {...register("alvoId")}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="">Escolha</option>
              {alvo === "CATEGORIA"
                ? categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))
                : produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
            </select>
            {errors.alvoId && <p className="text-red-600 text-sm mt-1">{errors.alvoId.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="mt-5 bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Criar promoção"}
        </button>
      </form>

      {erroLista ? (
        <MensagemErro
          texto={erroLista}
          aoTentarDeNovo={() => {
            promocoesReq.recarregar();
            produtosReq.recarregar();
            categoriasReq.recarregar();
          }}
        />
      ) : !promocoesReq.dados ? (
        <Carregando texto="Carregando promoções..." />
      ) : promocoes.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">Nenhuma promoção cadastrada.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {promocoes.map((promocao) => {
            // promoção de um produto que foi excluído depois: não vale mais
            // na loja e não dá para ativar/desativar (a API não acha o
            // produto). Só resta excluir a promoção.
            const produtoExcluido = promocao.alvo === "PRODUTO" && !promocao.produto;

            let selo = { texto: "DESATIVADA", classe: SELO_CINZA };
            if (produtoExcluido) {
              selo = { texto: "PRODUTO EXCLUÍDO", classe: SELO_CINZA };
            } else if (promocao.valendo) {
              selo = { texto: "VALENDO AGORA", classe: SELO_VERDE };
            } else if (promocao.ativa) {
              selo = { texto: "FORA DO PERÍODO", classe: SELO_AMARELO };
            }

            return (
              <div
                key={promocao.id}
                className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-wrap items-center gap-3"
              >
                <div className="flex-1 min-w-[200px]">
                  <p className="font-bold">{promocao.nome}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {promocao.tipo === "PORCENTAGEM"
                      ? `${promocao.valor}% de desconto`
                      : `R$ ${promocao.valor.toFixed(2)} de desconto`}{" "}
                    em {promocao.alvo === "CATEGORIA" ? "" : "1 produto: "}
                    {promocao.alvoNome}
                    {" - "}
                    {promocao.quantidadeProdutos} produto(s)
                  </p>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[160px]">
                  <p className="text-xs">
                    De {diaParaBr(promocao.dataInicio)} até {diaParaBr(promocao.dataFim)}
                  </p>
                </div>

                <span className={selo.classe}>{selo.texto}</span>

                <div className="flex gap-2">
                  {!produtoExcluido && (
                    <button
                      onClick={() => alternarAtiva(promocao)}
                      disabled={salvando}
                      className="border-2 border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                    >
                      {promocao.ativa ? "Desativar" : "Ativar"}
                    </button>
                  )}
                  <button
                    onClick={() => clicarExcluir(promocao)}
                    disabled={salvando}
                    className="border-2 border-red-600 text-red-600 rounded px-3 py-1 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900 disabled:opacity-60"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-gray-500 dark:text-gray-400 text-sm mt-6">
        Ativar uma promoção coloca o preço promocional nos produtos dela.
        Desativar devolve o preço normal. Se duas promoções alcançam o mesmo
        produto, vale o menor preço.
      </p>
    </div>
  );
}
