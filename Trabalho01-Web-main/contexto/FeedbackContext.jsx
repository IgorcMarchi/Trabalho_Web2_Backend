"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { feedbacksIniciais, feedbacksSiteIniciais } from "../dados/feedbacks";

// Guarda as avaliações dos produtos e do site.
// Começa com as avaliações fictícias e vai crescendo conforme
// os usuários escrevem as deles.
const FeedbackContext = createContext();

export function FeedbackProvider({ children }) {
  const [feedbacksProdutos, setFeedbacksProdutos] = useState(feedbacksIniciais);
  const [feedbacksSite, setFeedbacksSite] = useState(feedbacksSiteIniciais);
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    const produtosSalvos = localStorage.getItem("feedbacksProdutos");
    const siteSalvo = localStorage.getItem("feedbacksSite");

    if (produtosSalvos) {
      setFeedbacksProdutos(JSON.parse(produtosSalvos));
    }

    if (siteSalvo) {
      setFeedbacksSite(JSON.parse(siteSalvo));
    }

    setCarregou(true);
  }, []);

  useEffect(() => {
    if (carregou) {
      localStorage.setItem(
        "feedbacksProdutos",
        JSON.stringify(feedbacksProdutos)
      );
      localStorage.setItem("feedbacksSite", JSON.stringify(feedbacksSite));
    }
  }, [feedbacksProdutos, feedbacksSite, carregou]);

  // devolve a lista de avaliações de um produto.
  // se o produto não tiver nenhuma, devolve lista vazia.
  function pegarFeedbacks(produtoId) {
    return feedbacksProdutos[produtoId] || [];
  }

  function adicionarFeedbackProduto(produtoId, feedback) {
    const listaAtual = pegarFeedbacks(produtoId);

    setFeedbacksProdutos({
      ...feedbacksProdutos,
      [produtoId]: [...listaAtual, feedback],
    });
  }

  function adicionarFeedbackSite(feedback) {
    setFeedbacksSite([...feedbacksSite, feedback]);
  }

  // junta as avaliações de todos os produtos numa lista só,
  // anotando de qual produto cada uma veio. O painel usa isso.
  function todasAsAvaliacoes() {
    const lista = [];

    for (const produtoId of Object.keys(feedbacksProdutos)) {
      feedbacksProdutos[produtoId].forEach((feedback, indice) => {
        lista.push({ ...feedback, produtoId: produtoId, indice: indice });
      });
    }

    return lista;
  }

  // o índice diz qual avaliação daquele produto deve sair
  function removerFeedbackProduto(produtoId, indice) {
    const lista = pegarFeedbacks(produtoId);

    setFeedbacksProdutos({
      ...feedbacksProdutos,
      [produtoId]: lista.filter((f, i) => i !== indice),
    });
  }

  function removerFeedbackSite(indice) {
    setFeedbacksSite(feedbacksSite.filter((f, i) => i !== indice));
  }

  // calcula a média das notas de um produto
  function calcularMedia(produtoId) {
    const lista = pegarFeedbacks(produtoId);

    if (lista.length === 0) {
      return 0;
    }

    const soma = lista.reduce((total, f) => total + f.nota, 0);

    return soma / lista.length;
  }

  return (
    <FeedbackContext.Provider
      value={{
        feedbacksSite,
        pegarFeedbacks,
        adicionarFeedbackProduto,
        adicionarFeedbackSite,
        calcularMedia,
        todasAsAvaliacoes,
        removerFeedbackProduto,
        removerFeedbackSite,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  return useContext(FeedbackContext);
}
