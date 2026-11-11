"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUsuario } from "../../contexto/UsuarioContext";

// Regras do cadastro (os mesmos limites que a API confere no RegistroDto)
const schema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3, "O nome precisa ter pelo menos 3 letras")
      .max(120, "O nome pode ter no máximo 120 letras"),
    email: z
      .string()
      .trim()
      .max(160, "O e-mail pode ter no máximo 160 caracteres")
      .email("Digite um e-mail válido"),
    // o bcrypt só considera os primeiros 72 caracteres, por isso o limite
    senha: z
      .string()
      .min(6, "A senha precisa ter pelo menos 6 caracteres")
      .max(72, "A senha pode ter no máximo 72 caracteres"),
    confirmarSenha: z.string(),
  })
  // o refine confere se as duas senhas são iguais
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não são iguais",
    path: ["confirmarSenha"],
  });

// Cadastro (rota /cadastro)
export default function Cadastro() {
  const { usuario, cadastrar, sair } = useUsuario();
  const router = useRouter();
  const [erro, setErro] = useState("");

  // mesmo caso da página de login: evita a tela de confirmação
  // piscar logo depois que a conta é criada
  const [acabouDeEntrar, setAcabouDeEntrar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function enviar(dados) {
    setErro("");
    // a conta é criada no banco (sempre como CLIENTE, quem decide é a API).
    // E-mail repetido volta como erro 409 com a mensagem da API.
    const resultado = await cadastrar(dados);

    if (resultado.ok) {
      setAcabouDeEntrar(true);
      router.push("/");
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

  // quem já tem conta e está logado não precisa criar outra.
  // Mesma tela de confirmação da página de login.
  // Quem acabou de se cadastrar agora não vê essa tela.
  if (usuario && !acabouDeEntrar) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-2">
            Você já está logado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Você entrou como <strong>{usuario.nome}</strong>. Para criar outra
            conta você precisa sair desta primeiro.
          </p>

          {erro && (
            <p className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mt-4">
              {erro}
            </p>
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
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-6">Criar conta</h1>

      <form
        onSubmit={handleSubmit(enviar)}
        className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6"
      >
        {erro && (
          <p className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mb-4">
            {erro}
          </p>
        )}

        <label htmlFor="nome" className="block font-bold mb-1">Nome completo</label>
        <input
          id="nome"
          {...register("nome")}
          className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />
        {errors.nome && (
          <p className="text-red-600 text-sm mt-1">{errors.nome.message}</p>
        )}

        <label htmlFor="email" className="block font-bold mb-1 mt-4">E-mail</label>
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

        <label htmlFor="confirmarSenha" className="block font-bold mb-1 mt-4">
          Confirmar senha
        </label>
        <input
          id="confirmarSenha"
          type="password"
          {...register("confirmarSenha")}
          className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        />
        {errors.confirmarSenha && (
          <p className="text-red-600 text-sm mt-1">
            {errors.confirmarSenha.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 bg-blue-700 text-white rounded py-3 font-bold hover:bg-blue-800 disabled:opacity-60"
        >
          {isSubmitting ? "Criando conta..." : "Cadastrar"}
        </button>

        <p className="text-center text-sm mt-4">
          Já tem conta?{" "}
          <Link href="/login" className="text-blue-700 dark:text-blue-400 font-bold hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
