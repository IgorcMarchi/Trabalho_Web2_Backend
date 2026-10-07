"use client";

import { createContext, useContext, useState, useEffect } from "react";

// Guarda quem está logado e a lista de quem já se cadastrou.
// Não tem banco de dados, tudo fica salvo no localStorage do navegador.
const UsuarioContext = createContext();

// Conta de administrador que já vem criada com o sistema.
// Sem ela ninguém conseguiria entrar no painel na primeira vez.
const ADMIN_PADRAO = {
  nome: "Administrador",
  email: "admin@tecshop.com",
  senha: "admin123",
  tipo: "ADMIN",
  ativo: true,
  dataCadastro: "01/01/2026",
};

function hoje() {
  return new Date().toLocaleDateString("pt-BR");
}

// Nome do cookie de sessão. O proxy.js (que roda antes da página,
// no servidor do Next) não consegue ler o localStorage, só cookies.
// Por isso, além do localStorage, guardamos aqui o tipo de quem está
// logado. Na etapa do back-end esse cookie passa a ser criado pelo
// servidor (httpOnly, com um token), e o proxy.js continua igual.
export const COOKIE_SESSAO = "tecshop_sessao";

function salvarCookieSessao(usuario) {
  if (usuario) {
    // max-age em segundos: 7 dias
    document.cookie = `${COOKIE_SESSAO}=${encodeURIComponent(usuario.tipo)}; path=/; max-age=604800; samesite=lax`;
  } else {
    // max-age=0 apaga o cookie
    document.cookie = `${COOKIE_SESSAO}=; path=/; max-age=0; samesite=lax`;
  }
}

export function UsuarioProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [carregou, setCarregou] = useState(false);

  // lê o que estava salvo quando a página abre
  useEffect(() => {
    const listaSalva = localStorage.getItem("usuarios");
    const logadoSalvo = localStorage.getItem("usuarioLogado");

    if (listaSalva) {
      setUsuarios(JSON.parse(listaSalva));
    } else {
      // primeira vez no site: cria a conta do administrador
      setUsuarios([ADMIN_PADRAO]);
    }

    if (logadoSalvo) {
      setUsuario(JSON.parse(logadoSalvo));
    }

    setCarregou(true);
  }, []);

  // salva a lista de cadastrados
  useEffect(() => {
    if (carregou) {
      localStorage.setItem("usuarios", JSON.stringify(usuarios));
    }
  }, [usuarios, carregou]);

  // salva quem está logado (no localStorage e no cookie de sessão).
  // Como roda toda vez que o usuário muda, o cookie fica sempre
  // sincronizado com o localStorage: login, cadastro e logout.
  useEffect(() => {
    if (carregou) {
      if (usuario) {
        localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
      } else {
        localStorage.removeItem("usuarioLogado");
      }

      salvarCookieSessao(usuario);
    }
  }, [usuario, carregou]);

  // devolve { ok: true } quando deu certo e { ok: false, erro: "..." }
  // quando deu errado, aí a página mostra a mensagem
  function cadastrar(dados) {
    const jaExiste = usuarios.find((u) => u.email === dados.email);

    if (jaExiste) {
      return { ok: false, erro: "Esse e-mail já está cadastrado" };
    }

    // quem se cadastra pelo site é sempre CLIENTE
    const novo = {
      nome: dados.nome,
      email: dados.email,
      senha: dados.senha,
      tipo: "CLIENTE",
      ativo: true,
      dataCadastro: hoje(),
    };

    setUsuarios([...usuarios, novo]);
    // o cookie é gravado na hora (e não só no useEffect) porque a página
    // já navega em seguida, e o proxy.js precisa encontrá-lo
    salvarCookieSessao(novo);
    setUsuario(novo);

    return { ok: true };
  }

  function entrar(email, senha) {
    const achou = usuarios.find((u) => u.email === email && u.senha === senha);

    if (!achou) {
      return { ok: false, erro: "E-mail ou senha incorretos" };
    }

    // conta desativada pelo administrador não consegue entrar
    if (!achou.ativo) {
      return { ok: false, erro: "Esta conta está desativada" };
    }

    // mesmo motivo do cadastrar: o cookie precisa existir antes da navegação
    salvarCookieSessao(achou);
    setUsuario(achou);

    return { ok: true };
  }

  function sair() {
    salvarCookieSessao(null);
    setUsuario(null);
  }

  // usada pelo painel do administrador.
  // repare que a senha NÃO entra na lista: o administrador nunca
  // deve conseguir ver a senha de ninguém.
  function listarClientes() {
    return usuarios
      .filter((u) => u.tipo === "CLIENTE")
      .map((u) => ({
        nome: u.nome,
        email: u.email,
        tipo: u.tipo,
        ativo: u.ativo,
        dataCadastro: u.dataCadastro,
      }));
  }

  return (
    <UsuarioContext.Provider
      value={{
        usuario,
        // a RotaProtegida usa o "carregou" para esperar a leitura do
        // localStorage antes de decidir se manda a pessoa pro login.
        // Sem isso, quem dá F5 numa página privada seria expulso,
        // porque no primeiro render o usuario ainda é null.
        carregou,
        cadastrar,
        entrar,
        sair,
        listarClientes,
      }}
    >
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario() {
  return useContext(UsuarioContext);
}
