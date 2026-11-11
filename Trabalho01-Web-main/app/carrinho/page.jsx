"use client";

import Link from "next/link";
import Carregando from "../../components/Carregando";
import ItemCarrinho from "../../components/ItemCarrinho";
import { useCarrinho } from "../../contexto/CarrinhoContext";

// Carrinho (rota /carrinho)
export default function Carrinho() {
  const {
    itens,
    carregou,
    total,
    limpar,
    verificando,
    erroVerificacao,
    podeFinalizar,
    verificarDeNovo,
  } = useCarrinho();

  // espera ler o carrinho salvo (senão o F5 mostraria "vazio" por um instante)
  if (!carregou) {
    return <Carregando texto="Carregando seu carrinho..." />;
  }

  // se não tem nada no carrinho, mostra um aviso no lugar da lista
  if (itens.length === 0) {
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">Carrinho</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Seu carrinho está vazio.</p>
        <Link
          href="/produtos"
          className="bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  const temProblema = itens.some((item) => item.disponivel === false);

  // o texto embaixo do total acompanha a conferência com o servidor
  let situacaoDosPrecos = "Preços conferidos com a loja.";
  if (verificando) {
    situacaoDosPrecos = "Conferindo preços e estoque...";
  } else if (erroVerificacao) {
    situacaoDosPrecos = "Preços ainda não conferidos com a loja.";
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-6">Carrinho</h1>

      {erroVerificacao && (
        <div className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mb-4 text-sm flex flex-wrap items-center justify-between gap-2">
          <span>Não foi possível conferir os preços com o servidor: {erroVerificacao}</span>
          <button onClick={verificarDeNovo} className="font-bold underline">
            Tentar de novo
          </button>
        </div>
      )}

      {temProblema && (
        <p className="bg-yellow-50 border-2 border-yellow-300 text-yellow-900 rounded p-3 mb-4 text-sm">
          Alguns itens não podem ser comprados agora (veja o aviso em cada um).
          Ajuste a quantidade ou remova para finalizar a compra.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {itens.map((item) => (
          <ItemCarrinho key={item.id} item={item} />
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xl font-bold">
            Total: <span className="text-green-700">R$ {total.toFixed(2)}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{situacaoDosPrecos}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={limpar}
            className="border-2 border-gray-300 dark:border-gray-600 rounded px-4 py-2 font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Limpar carrinho
          </button>
          {podeFinalizar ? (
            // prefetch={false}: o /checkout é privado. Pré-carregado por um
            // visitante, o Next guardava o redirect do proxy.js para o login
            // e, depois de entrar, mandava a pessoa de volta para o login.
            <Link
              href="/checkout"
              prefetch={false}
              className="bg-orange-500 text-white rounded px-6 py-2 font-bold hover:bg-orange-600"
            >
              Finalizar compra
            </Link>
          ) : (
            <span className="bg-gray-400 text-white rounded px-6 py-2 font-bold cursor-not-allowed">
              Finalizar compra
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
