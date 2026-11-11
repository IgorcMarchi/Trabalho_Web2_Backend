"use client";

import { createContext, useContext, useState, useEffect } from "react";
import * as auth from "../lib/auth";
import { EVENTO_SESSAO_EXPIRADA } from "../lib/api";

// Guarda quem está logado.
// Agora quem cadastra, confere a senha e emite o token (JWT) é a API.
// O token fica num cookie httpOnly que o JavaScript não consegue ler;
// aqui guardamos só nome, e-mail e tipo, para as telas usarem.
const UsuarioContext = createContext();

// Chaves do localStorage que pertencem a quem está logado e precisam
// sumir quando a pessoa sai da conta:
// - carrinho: os itens que a pessoa colocou no carrinho
const CHAVES_DA_SESSAO = ["carrinho"];

// Dados que a primeira etapa guardava no navegador e agora moram no banco.
// "usuarios" tinha até as senhas em texto puro, então limpamos de vez.
const CHAVES_ANTIGAS = [
  "usuarios",
  "usuarioLogado",
  "produtos",
  "categorias",
  "promocoes",
  "pedidos",
  "listaDesejos",
  "feedbacksProdutos",
  "feedbacksSite",
  "filtrosInicio",
];

export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregou, setCarregou] = useState(false);

  // ao abrir o site (e a cada F5), pergunta ao servidor quem está logado
  useEffect(() => {
    CHAVES_ANTIGAS.forEach((chave) => localStorage.removeItem(chave));

    auth
      .buscarSessao()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCarregou(true));
  }, []);

  // a API avisou que o token venceu (1 hora): volta a ser visitante
  useEffect(() => {
    function aoExpirar() {
      setUsuario(null);
    }

    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  // devolve { ok: true } quando deu certo e { ok: false, erro: "..." }
  // quando deu errado, aí a página mostra a mensagem (que vem da API)
  async function cadastrar(dados) {
    try {
      setUsuario(await auth.cadastrar(dados));
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e.message };
    }
  }

  async function entrar(email, senha) {
    try {
      setUsuario(await auth.entrar(email, senha));
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e.message };
    }
  }

  async function sair() {
    // apaga o cookie com o token (no servidor do Next)
    await auth.sair().catch(() => {});

    // e apaga do localStorage o que era da sessão de quem estava logado.
    // Não usamos localStorage.clear() para não apagar preferências do
    // navegador, como o tema escuro.
    CHAVES_DA_SESSAO.forEach((chave) => localStorage.removeItem(chave));

    setUsuario(null);
  }

  return (
    <UsuarioContext.Provider
      value={{
        usuario,
        // a RotaProtegida usa o "carregou" para esperar a resposta do
        // servidor antes de decidir se manda a pessoa pro login.
        // Sem isso, quem dá F5 numa página privada seria expulso,
        // porque no primeiro render o usuario ainda é null.
        carregou,
        cadastrar,
        entrar,
        sair,
      }}
    >
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario() {
  return useContext(UsuarioContext);
}
