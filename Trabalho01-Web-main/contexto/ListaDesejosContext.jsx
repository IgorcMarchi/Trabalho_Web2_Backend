"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useUsuario } from "./UsuarioContext";
import { adicionarDesejo, listarDesejos, removerDesejo } from "../lib/listaDesejos";

// Lista de desejos. Fica num Context porque a navbar mostra quantos itens
// tem e o coração de cada card precisa saber se o produto está na lista.
// Agora ela é guardada no banco (cada usuário tem a sua), e não mais
// no localStorage com o e-mail como chave.
const ListaDesejosContext = createContext();

export function ListaDesejosProvider({ children }) {
  const { usuario } = useUsuario();

  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  // busca a lista quando alguém entra (e esvazia quando sai)
  const idDoUsuario = usuario?.id;

  useEffect(() => {
    if (!idDoUsuario) {
      setItens([]);
      setErro("");
      return;
    }

    let valeAinda = true;
    setCarregando(true);
    setErro("");

    listarDesejos()
      .then((lista) => {
        if (valeAinda) setItens(lista);
      })
      .catch((e) => {
        if (valeAinda) setErro(e.message);
      })
      .finally(() => {
        if (valeAinda) setCarregando(false);
      });

    return () => {
      valeAinda = false;
    };
  }, [idDoUsuario, tentativa]);

  // o some devolve true se algum produto da lista tiver esse id
  function estaNaLista(id) {
    return itens.some((produto) => produto.id === id);
  }

  // Atualiza a tela na hora (otimista) e confirma com a API.
  // Se a API recusar, desfaz e avisa.
  async function adicionar(produto) {
    if (!usuario || estaNaLista(produto.id)) {
      return;
    }

    setItens((atuais) => [...atuais, produto]);

    try {
      await adicionarDesejo(produto.id);
    } catch (e) {
      // 409 = já estava na lista (ex.: outra aba). Não é problema.
      if (e.status !== 409) {
        setItens((atuais) => atuais.filter((p) => p.id !== produto.id));
        alert(e.message);
      }
    }
  }

  async function remover(id) {
    if (!usuario) {
      return;
    }

    const antes = itens;
    setItens((atuais) => atuais.filter((produto) => produto.id !== id));

    try {
      await removerDesejo(id);
    } catch (e) {
      // 404 = já não estava na lista. Qualquer outro erro: desfaz.
      if (e.status !== 404) {
        setItens(antes);
        alert(e.message);
      }
    }
  }

  return (
    <ListaDesejosContext.Provider
      value={{
        itens,
        carregando,
        erro,
        recarregar: () => setTentativa((t) => t + 1),
        adicionar,
        remover,
        estaNaLista,
      }}
    >
      {children}
    </ListaDesejosContext.Provider>
  );
}

export function useListaDesejos() {
  return useContext(ListaDesejosContext);
}
