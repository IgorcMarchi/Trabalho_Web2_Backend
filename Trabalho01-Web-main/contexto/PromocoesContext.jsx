"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useProdutos } from "./ProdutosContext";

// Guarda as promoções da loja.
// Quando uma promoção é ativada, ela coloca o preço promocional nos
// produtos que ela alcança. Quando é desativada ou vence, tira.
const PromocoesContext = createContext();

// devolve a data de hoje no formato 2026-10-02, que é o mesmo
// formato que o input de data usa. Assim dá pra comparar com <= e >=
export function dataDeHoje() {
  return new Date().toISOString().slice(0, 10);
}

export function PromocoesProvider({ children }) {
  const { produtos, definirPrecoPromocional } = useProdutos();

  const [promocoes, setPromocoes] = useState([]);
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("promocoes");

    if (salvo) {
      setPromocoes(JSON.parse(salvo));
    }

    setCarregou(true);
  }, []);

  useEffect(() => {
    if (carregou) {
      localStorage.setItem("promocoes", JSON.stringify(promocoes));
    }
  }, [promocoes, carregou]);

  // a promoção só vale se estiver ativa E dentro do período
  function estaValendo(promocao) {
    const hoje = dataDeHoje();

    return (
      promocao.ativa &&
      promocao.dataInicio <= hoje &&
      hoje <= promocao.dataFim
    );
  }

  // quais produtos essa promoção alcança
  function produtosAlcancados(promocao) {
    if (promocao.alvo === "PRODUTO") {
      return produtos.filter((p) => p.id === Number(promocao.alvoValor));
    }

    return produtos.filter((p) => p.categoria === promocao.alvoValor);
  }

  // quanto fica o preço do produto com essa promoção
  function calcularPreco(produto, promocao) {
    let novoPreco;

    if (promocao.tipo === "PORCENTAGEM") {
      novoPreco = produto.preco - (produto.preco * promocao.valor) / 100;
    } else {
      novoPreco = produto.preco - promocao.valor;
    }

    // não deixa o preço ficar negativo
    return novoPreco < 0 ? 0 : novoPreco;
  }

  // coloca o preço promocional nos produtos da promoção
  function aplicar(promocao) {
    const alcancados = produtosAlcancados(promocao);
    const ids = alcancados.map((p) => p.id);

    definirPrecoPromocional(ids, (produto) =>
      calcularPreco(produto, promocao)
    );
  }

  // tira o preço promocional dos produtos da promoção
  function limpar(promocao) {
    const alcancados = produtosAlcancados(promocao);
    const ids = alcancados.map((p) => p.id);

    definirPrecoPromocional(ids, () => null);
  }

  function adicionarPromocao(dados) {
    const maiorId =
      promocoes.length > 0 ? Math.max(...promocoes.map((p) => p.id)) : 0;

    const nova = { ...dados, id: maiorId + 1 };

    setPromocoes([...promocoes, nova]);

    if (estaValendo(nova)) {
      aplicar(nova);
    }
  }

  function alternarAtivaPromocao(id) {
    const promocao = promocoes.find((p) => p.id === id);
    const virouAtiva = !promocao.ativa;

    setPromocoes(
      promocoes.map((p) => (p.id === id ? { ...p, ativa: virouAtiva } : p))
    );

    // ligou: aplica o desconto. Desligou: devolve o preço normal.
    if (virouAtiva) {
      aplicar({ ...promocao, ativa: true });
    } else {
      limpar(promocao);
    }
  }

  function excluirPromocao(id) {
    const promocao = promocoes.find((p) => p.id === id);

    // antes de apagar, devolve o preço normal dos produtos
    if (promocao.ativa) {
      limpar(promocao);
    }

    setPromocoes(promocoes.filter((p) => p.id !== id));
  }

  // promoções que já venceram mas ainda estão marcadas como ativas
  const vencidas = promocoes.filter(
    (p) => p.ativa && p.dataFim < dataDeHoje()
  );

  return (
    <PromocoesContext.Provider
      value={{
        promocoes,
        vencidas,
        estaValendo,
        produtosAlcancados,
        adicionarPromocao,
        alternarAtivaPromocao,
        excluirPromocao,
      }}
    >
      {children}
    </PromocoesContext.Provider>
  );
}

export function usePromocoes() {
  return useContext(PromocoesContext);
}
