"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useUsuario } from "./UsuarioContext";

// Lista de desejos. Funciona igual ao carrinho, só que sem quantidade.
// A diferença é que cada usuário tem a sua lista, então guardamos tudo
// num objeto usando o e-mail como chave, do mesmo jeito que os feedbacks
// usam o id do produto.
const ListaDesejosContext = createContext();

export function ListaDesejosProvider({ children }) {
  const { usuario } = useUsuario();

  // fica assim: { "ana@email.com": [produtos], "jeff@email.com": [produtos] }
  const [listas, setListas] = useState({});
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("listaDesejos");

    if (salvo) {
      setListas(JSON.parse(salvo));
    }

    setCarregou(true);
  }, []);

  useEffect(() => {
    if (carregou) {
      localStorage.setItem("listaDesejos", JSON.stringify(listas));
    }
  }, [listas, carregou]);

  // pega só a lista de quem está logado agora.
  // se não tem ninguém logado, devolve lista vazia.
  const itens = usuario ? listas[usuario.email] || [] : [];

  // o some devolve true se algum produto da lista tiver esse id
  function estaNaLista(id) {
    return itens.some((produto) => produto.id === id);
  }

  function adicionar(produto) {
    if (!usuario || estaNaLista(produto.id)) {
      return;
    }

    setListas({ ...listas, [usuario.email]: [...itens, produto] });
  }

  function remover(id) {
    if (!usuario) {
      return;
    }

    setListas({
      ...listas,
      [usuario.email]: itens.filter((produto) => produto.id !== id),
    });
  }

  return (
    <ListaDesejosContext.Provider
      value={{ itens, adicionar, remover, estaNaLista }}
    >
      {children}
    </ListaDesejosContext.Provider>
  );
}

export function useListaDesejos() {
  return useContext(ListaDesejosContext);
}
