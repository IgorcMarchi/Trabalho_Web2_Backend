"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { precoFinal } from "../dados/precos";

// Aqui fica o carrinho. Como ele precisa ser acessado em várias páginas
// (navbar, produtos, carrinho, checkout), usamos o Context pra não ter
// que ficar passando os dados de componente em componente por props.
const CarrinhoContext = createContext();

export function CarrinhoProvider({ children }) {
  const [itens, setItens] = useState([]);

  // esse estado serve pra saber se já lemos o localStorage.
  // sem ele, o segundo useEffect salvaria o carrinho vazio por cima
  // do que estava guardado assim que a página abrisse.
  const [carregou, setCarregou] = useState(false);

  // lê o carrinho salvo quando a página abre.
  // tem que ser dentro do useEffect porque o localStorage só existe
  // no navegador, e o Next renderiza uma parte no servidor antes.
  useEffect(() => {
    const salvo = localStorage.getItem("carrinho");

    if (salvo) {
      setItens(JSON.parse(salvo));
    }

    setCarregou(true);
  }, []);

  // salva no localStorage toda vez que o carrinho muda
  useEffect(() => {
    if (carregou) {
      localStorage.setItem("carrinho", JSON.stringify(itens));
    }
  }, [itens, carregou]);

  function adicionar(produto) {
    // se o produto já está no carrinho, só aumenta a quantidade
    const jaEstaNoCarrinho = itens.find((item) => item.id === produto.id);

    if (jaEstaNoCarrinho) {
      setItens(
        itens.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
      setItens([...itens, { ...produto, quantidade: 1 }]);
    }
  }

  function remover(id) {
    setItens(itens.filter((item) => item.id !== id));
  }

  function mudarQuantidade(id, novaQuantidade) {
    // não deixa a quantidade ficar menor que 1
    if (novaQuantidade < 1) {
      return;
    }

    setItens(
      itens.map((item) =>
        item.id === id ? { ...item, quantidade: novaQuantidade } : item
      )
    );
  }

  function limpar() {
    setItens([]);
  }

  // soma usando o precoFinal, que devolve o preço promocional
  // quando o produto está em promoção
  const total = itens.reduce(
    (soma, item) => soma + precoFinal(item) * item.quantidade,
    0
  );

  // quantos produtos no total (pra mostrar na navbar)
  const quantidadeTotal = itens.reduce(
    (soma, item) => soma + item.quantidade,
    0
  );

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        adicionar,
        remover,
        mudarQuantidade,
        limpar,
        total,
        quantidadeTotal,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

// atalho pra usar o carrinho nas páginas sem precisar importar o useContext
export function useCarrinho() {
  return useContext(CarrinhoContext);
}
