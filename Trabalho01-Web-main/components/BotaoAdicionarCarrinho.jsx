"use client";

import { useEffect, useState } from "react";
import { useCarrinho, MAXIMO_POR_ITEM } from "../contexto/CarrinhoContext";

// O que o botão mostra por um instante depois do clique, conforme a
// resposta do carrinho. "leitor" é o texto lido pelo leitor de tela.
const AVISOS = {
  adicionado: {
    texto: "✓ Adicionado!",
    leitor: "Produto adicionado ao carrinho.",
    cor: "bg-green-600",
  },
  estoque: {
    texto: "Limite do estoque",
    leitor: "Você já tem no carrinho todas as unidades em estoque.",
    cor: "bg-orange-500",
  },
  maximo: {
    texto: `Máximo de ${MAXIMO_POR_ITEM} unidades`,
    leitor: `O limite é de ${MAXIMO_POR_ITEM} unidades por produto.`,
    cor: "bg-orange-500",
  },
};

// quanto tempo (ms) o aviso fica no botão
const DURACAO_DO_AVISO = 1500;

// Botão "Adicionar ao carrinho" com retorno visual: por um instante ele
// fica verde com "Adicionado!", ou laranja quando não dá para colocar
// mais unidades. Usado no card do produto e na página de detalhes.
// O className recebido cuida só do tamanho e do espaçamento.
export default function BotaoAdicionarCarrinho({ produto, className = "" }) {
  const { adicionar } = useCarrinho();
  const [aviso, setAviso] = useState(null);

  // o aviso some sozinho depois do tempo; se a pessoa clicar de novo
  // antes disso, o cleanup cancela o timer anterior e a contagem recomeça
  useEffect(() => {
    if (!aviso) {
      return;
    }

    const timer = setTimeout(() => setAviso(null), DURACAO_DO_AVISO);
    return () => clearTimeout(timer);
  }, [aviso]);

  // o estoque e o status vêm do banco: sem unidades, ou fora de
  // venda, não dá para adicionar
  const inativo = produto.status === "INATIVO";
  const esgotado = produto.estoque === 0;

  let texto = "Adicionar ao carrinho";
  if (inativo) {
    texto = "Indisponível";
  } else if (esgotado) {
    texto = "Esgotado";
  } else if (aviso) {
    texto = aviso.texto;
  }

  function clicar() {
    const resultado = adicionar(produto);

    // um objeto novo a cada clique, para o useEffect reiniciar o tempo
    if (AVISOS[resultado]) {
      setAviso({ ...AVISOS[resultado] });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={clicar}
        disabled={inativo || esgotado}
        className={`${className} ${
          aviso ? aviso.cor : "bg-blue-700 hover:bg-blue-800"
        } text-white rounded font-bold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed`}
      >
        {texto}
      </button>

      {/* o mesmo aviso, para quem usa leitor de tela */}
      <span className="sr-only" aria-live="polite">
        {aviso ? aviso.leitor : ""}
      </span>
    </>
  );
}
