"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Carregando from "../../components/Carregando";
import { useUsuario } from "../../contexto/UsuarioContext";

// Regras do login
const schema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  senha: z.string().min(1, "Digite sua senha"),
});

// O proxy.js e a RotaProtegida mandam pra cá com ?redirect=/pagina.
// Só aceitamos caminhos do próprio site, para ninguém montar um link que,
// depois do login, leve a outro site. Não basta olhar se começa com "/":
// o navegador trata "\" como "/" e ignora TAB, então "/\site.com" vira
// "//site.com". Por isso o endereço é montado do jeito que o navegador
// montaria e só vale se continuar no nosso site.
function lerDestino() {
  const destino = new URLSearchParams(window.location.search).get("redirect");

  if (!destino || !destino.startsWith("/")) {
    return null;
  }

  try {
    const url = new URL(destino, window.location.origin);
    if (url.origin === window.location.origin) {
      return url.pathname + url.search + url.hash;
    }
  } catch {
    // endereço inválido: ignora
  }

  return null;
}

// Login (rota /login)
export default function Login() {
  const { usuario, entrar, sair, conferirSessao } = useUsuario();
  const router = useRouter();
  const [erro, setErro] = useState("");

  // marca que a pessoa acabou de fazer login agora.
  // Sem isso, a tela de "tem certeza que deseja sair" piscava por um
  // instante entre o login dar certo e a página mudar pra home.
  const [acabouDeEntrar, setAcabouDeEntrar] = useState(false);

  // página privada que a pessoa tentou abrir antes de cair no login.
  // Lido no useEffect porque o window só existe no navegador.
  const [destino, setDestino] = useState(null);

  // Quem chega com ?redirect= foi mandado pelo proxy.js porque o token não
  // vale mais (venceu ou foi apagado). Se a tela ainda acha que tem alguém
  // logado, pergunta de novo ao servidor antes de dizer "Você já está
  // logado" (senão o "Continuar" voltaria para cá, num laço).
  const [conferindo, setConferindo] = useState(true);

  useEffect(() => {
    const lido = lerDestino();
    setDestino(lido);

    if (lido) {
      conferirSessao().finally(() => setConferindo(false));
    } else {
      setConferindo(false);
    }
  }, [conferirSessao]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function enviar(dados) {
    setErro("");
    // a API confere a senha (bcrypt) e devolve o token, que fica num
    // cookie httpOnly. Erro: "E-mail ou senha inválidos." vem da API.
    const resultado = await entrar(dados.email, dados.senha);

    if (resultado.ok) {
      setAcabouDeEntrar(true);
      // volta para a página privada que a pessoa queria abrir.
      // replace para o "voltar" do navegador não cair no login de novo.
      router.replace(destino || "/");
    } else {
      setErro(resultado.erro);
    }
  }

  async function clicarSair() {
    setErro("");
    const resultado = await sair();
    if (!resultado.ok) {
      setErro(resultado.erro);
    }
  }

  // se a pessoa já estava logada e mesmo assim abriu /login,
  // não mostramos o formulário de novo. Perguntamos se ela quer sair.
  // Quem acabou de entrar agora não vê essa tela.
  if (usuario && !acabouDeEntrar) {
    if (conferindo) {
      return <Carregando texto="Conferindo sua sessão..." />;
    }

    return (
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-2">
            Você já está logado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Você entrou como <strong>{usuario.nome}</strong>.
          </p>

          {erro && (
            <p className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mt-4">
              {erro}
            </p>
          )}

          {/* veio redirecionado de uma página privada, mas já está logado */}
          {destino && (
            <Link
              href={destino}
              className="inline-block mt-6 bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800"
            >
              Continuar para {destino}
            </Link>
          )}

          <p className="font-bold mt-6 mb-4">Tem certeza que deseja sair?</p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={clicarSair}
              className="bg-red-600 text-white rounded px-6 py-3 font-bold hover:bg-red-700"
            >
              Sim, sair
            </button>
            <Link
              href="/"
              className="border-2 border-blue-700 text-blue-700 dark:text-blue-400 rounded px-6 py-3 font-bold hover:bg-blue-50 dark:hover:bg-blue-900"
            >
              Não, voltar para a loja
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-6">Entrar</h1>

      <form
        onSubmit={handleSubmit(enviar)}
        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6"
      >
        {erro && (
          <p className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mb-4">
            {erro}
          </p>
        )}

        <label htmlFor="email" className="block font-bold mb-1">E-mail</label>
        <input
          id="email"
          {...register("email")}
          className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />
        {errors.email && (
          <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
        )}

        <label htmlFor="senha" className="block font-bold mb-1 mt-4">Senha</label>
        <input
          id="senha"
          type="password"
          {...register("senha")}
          className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />
        {errors.senha && (
          <p className="text-red-600 text-sm mt-1">{errors.senha.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 bg-blue-700 text-white rounded py-3 font-bold hover:bg-blue-800 disabled:opacity-60"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-sm mt-4">
          Não tem conta?{" "}
          <Link
            href="/cadastro"
            className="text-blue-700 dark:text-blue-400 font-bold hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}
