"use client";

import { useState } from "react";
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

// Gerenciamento de promoções (rota /admin/promocoes)
export default function AdminPromocoes() {
  // TODAS = inclusive desativadas e fora do período (só ADMIN)
  const promocoesReq = useRequisicao(() => listarPromocoes({ situacao: "TODAS" }), []);
  const produtosReq = useRequisicao(() => listarTodosOsProdutos(), []);
  const categoriasReq = useRequisicao(() => listarCategorias(), []);

  const promocoes = promocoesReq.dados ?? [];
  const produtos = produtosReq.dados ?? [];
  const categorias = categoriasReq.dados ?? [];

  // os campos do formulário
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("PORCENTAGEM");
  const [valor, setValor] = useState("");
  const [dataInicio, setDataInicio] = useState(dataDeHoje());
  const [dataFim, setDataFim] = useState("");
  const [alvo, setAlvo] = useState("CATEGORIA");
  const [alvoId, setAlvoId] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // promoções que já venceram mas ainda estão marcadas como ativas
  const vencidas = promocoes.filter((p) => p.ativa && p.dataFim < dataDeHoje());

  async function executar(acao) {
    setErro("");
    setSalvando(true);
    try {
      await acao();
      promocoesReq.recarregar();
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

    // conferências rápidas para avisar antes de ir ao servidor
    // (a API confere tudo de novo e devolve 400/422 se algo escapar)
    if (nome.trim().length < 3) {
      setErro("O nome da promoção precisa ter pelo menos 3 letras");
      return;
    }

    if (Number(valor) <= 0) {
      setErro("O valor do desconto precisa ser maior que zero");
      return;
    }

    if (tipo === "PORCENTAGEM" && Number(valor) > 100) {
      setErro("A porcentagem não pode passar de 100");
      return;
    }

    if (!alvoId) {
      setErro("Escolha a qual produto ou categoria a promoção se aplica");
      return;
    }

    if (!dataFim || dataFim < dataInicio) {
      setErro("A data de término precisa ser depois da data de início");
      return;
    }

    const criou = await executar(() =>
      criarPromocao({
        nome: nome.trim(),
        tipo: tipo,
        valor: Number(valor),
        dataInicio: dataInicio,
        dataFim: dataFim,
        alvo: alvo,
        ...(alvo === "CATEGORIA"
          ? { categoriaId: Number(alvoId) }
          : { produtoId: Number(alvoId) }),
        ativa: true,
      })
    );

    if (criou) {
      setNome("");
      setValor("");
      setAlvoId("");
      setDataFim("");
    }
  }

  function clicarExcluir(promocao) {
    const certeza = confirm(`Excluir a promoção "${promocao.nome}"?`);

    if (certeza) {
      executar(() => excluirPromocao(promocao.id));
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
          {vencidas.length} promoção(ões) estão marcadas como ativas mas já
          passaram da data de término. Elas não valem mais na loja. Desative
          para devolver o preço normal dos produtos.
        </p>
      )}

      {erro && (
        <p className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mb-4">
          {erro}
        </p>
      )}

      {/* formulário de nova promoção */}
      <form
        onSubmit={criar}
        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 mb-6"
      >
        <h2 className="font-bold mb-4">Nova promoção</h2>

        <label className="block font-bold mb-1">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Semana do consumidor"
          className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block font-bold mb-1">Tipo de desconto</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="PORCENTAGEM">Porcentagem (%)</option>
              <option value="VALOR">Valor fixo (R$)</option>
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block font-bold mb-1">
              {tipo === "PORCENTAGEM" ? "Quantos %" : "Quantos R$"}
            </label>
            <input
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block font-bold mb-1">Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            />
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="block font-bold mb-1">Término</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block font-bold mb-1">Aplicar em</label>
            <select
              value={alvo}
              onChange={(e) => {
                setAlvo(e.target.value);
                setAlvoId("");
              }}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="CATEGORIA">Uma categoria inteira</option>
              <option value="PRODUTO">Um produto só</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block font-bold mb-1">
              {alvo === "CATEGORIA" ? "Qual categoria" : "Qual produto"}
            </label>
            <select
              value={alvoId}
              onChange={(e) => setAlvoId(e.target.value)}
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
          {promocoes.map((promocao) => (
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

              <span
                className={
                  promocao.valendo
                    ? "bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded"
                    : promocao.ativa
                    ? "bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-xs font-bold px-2 py-1 rounded"
                }
              >
                {promocao.valendo
                  ? "VALENDO AGORA"
                  : promocao.ativa
                  ? "FORA DO PERÍODO"
                  : "DESATIVADA"}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    executar(() => atualizarPromocao(promocao.id, { ativa: !promocao.ativa }))
                  }
                  disabled={salvando}
                  className="border-2 border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60"
                >
                  {promocao.ativa ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => clicarExcluir(promocao)}
                  disabled={salvando}
                  className="border-2 border-red-600 text-red-600 rounded px-3 py-1 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900 disabled:opacity-60"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-gray-500 dark:text-gray-400 text-sm mt-6">
        Ativar uma promoção coloca o preço promocional nos produtos dela.
        Desativar devolve o preço normal.
      </p>
    </div>
  );
}
