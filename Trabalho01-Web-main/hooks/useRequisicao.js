"use client";

import { useEffect, useState } from "react";

// Custom hook que toda tela com dados do servidor usa.
// Cuida dos estados de carregando, erro e sucesso, e dá o "Tentar de novo"
// (recarregar). O "vazio" cada tela decide olhando os dados.
//
//   const { dados, carregando, erro, recarregar } =
//     useRequisicao(() => listarProdutos({ busca }), [busca]);
//
// Quando as dependências mudam (ex.: filtro), busca de novo. Os dados
// anteriores ficam na tela enquanto a nova resposta não chega, para a
// lista não piscar a cada letra digitada.
export function useRequisicao(buscar, dependencias = []) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  // status HTTP do erro (ex.: 404 para "não existe"; 0 = sem conexão)
  const [statusErro, setStatusErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    // Se o filtro mudar antes da resposta chegar, a resposta antiga é
    // ignorada (senão ela poderia aparecer por cima da mais nova).
    let valeAinda = true;

    setCarregando(true);
    setErro("");
    setStatusErro(null);

    buscar()
      .then((resultado) => {
        if (valeAinda) setDados(resultado);
      })
      .catch((e) => {
        if (valeAinda) {
          setErro(e.message);
          setStatusErro(e.status ?? null);
        }
      })
      .finally(() => {
        if (valeAinda) setCarregando(false);
      });

    return () => {
      valeAinda = false;
    };
    // "buscar" é uma função nova a cada render; quem decide quando buscar
    // de novo são as dependências que a tela passou
  }, [...dependencias, tentativa]);

  return {
    dados,
    carregando,
    erro,
    statusErro,
    recarregar: () => setTentativa((t) => t + 1),
    // para atualizar a tela na hora depois de uma ação (ex.: excluir)
    setDados,
  };
}
