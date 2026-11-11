"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUsuario } from "../contexto/UsuarioContext";

// Regras da avaliação (as mesmas que a API confere de novo no servidor)
const schema = z.object({
  nota: z.coerce.number().min(1, "Escolha uma nota").max(5),
  comentario: z
    .string()
    .trim()
    .min(5, "Escreva pelo menos 5 letras")
    .max(1000, "O comentário pode ter no máximo 1000 letras"),
});

// Formulário de avaliação. Recebe por props a função que vai ser
// chamada quando o usuário enviar, por isso serve tanto pro produto
// quanto pro site. A função devolve uma Promise (ela chama a API).
function FormFeedback({ aoEnviar }) {
  const { usuario } = useUsuario();
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  // só quem está logado pode avaliar
  if (!usuario) {
    return (
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Você precisa estar logado para avaliar.
        </p>
        <Link
          href="/login"
          className="inline-block mt-3 bg-blue-700 text-white rounded px-4 py-2 font-bold hover:bg-blue-800"
        >
          Entrar
        </Link>
      </div>
    );
  }

  async function enviar(dados) {
    setErro("");
    setEnviado(false);

    // o nome de quem avaliou não vai daqui: a API usa o usuário do token
    try {
      await aoEnviar({ nota: dados.nota, comentario: dados.comentario });
      // limpa o formulário depois de enviar
      reset();
      setEnviado(true);
    } catch (e) {
      setErro(e.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(enviar)}
      className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4"
    >
      <h3 className="font-bold mb-3">Deixe sua avaliação</h3>

      {erro && (
        <p className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mb-3 text-sm">
          {erro}
        </p>
      )}

      {enviado && (
        <p className="bg-green-100 border-2 border-green-300 text-green-800 rounded p-3 mb-3 text-sm">
          Obrigado! Sua avaliação foi publicada.
        </p>
      )}

      <label htmlFor="feedback-nota" className="block font-bold mb-1">Nota</label>
      <select
        id="feedback-nota"
        {...register("nota")}
        defaultValue=""
        className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
      >
        <option value="">Escolha uma nota</option>
        <option value="5">5 - Muito bom</option>
        <option value="4">4 - Bom</option>
        <option value="3">3 - Normal</option>
        <option value="2">2 - Ruim</option>
        <option value="1">1 - Muito ruim</option>
      </select>
      {errors.nota && (
        <p className="text-red-600 text-sm mt-1">{errors.nota.message}</p>
      )}

      <label htmlFor="feedback-comentario" className="block font-bold mb-1 mt-4">
        Comentário
      </label>
      <textarea
        id="feedback-comentario"
        {...register("comentario")}
        rows="3"
        className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
        placeholder="O que você achou?"
      />
      {errors.comentario && (
        <p className="text-red-600 text-sm mt-1">{errors.comentario.message}</p>
      )}

      {/* travado enquanto envia, para não publicar duas vezes */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 bg-blue-700 text-white rounded px-6 py-2 font-bold hover:bg-blue-800 disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}

export default FormFeedback;
