"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Regras do cadastro de produto (a API confere tudo de novo no servidor)
const schema = z
  .object({
    nome: z.string().min(3, "O nome precisa ter pelo menos 3 letras"),
    descricao: z.string().min(10, "Escreva uma descrição com pelo menos 10 letras"),
    preco: z.coerce.number().positive("O preço precisa ser maior que zero"),
    // deixar em branco (ou zero) quer dizer que não tem promoção
    precoPromocional: z.coerce.number().min(0, "Não pode ser negativo"),
    imagem: z.string().url("Coloque o endereço de uma imagem (http://...)"),
    categoriaId: z.coerce.number().int().positive("Escolha uma categoria"),
    status: z.string(),
    estoque: z.coerce
      .number()
      .int("O estoque precisa ser um número inteiro")
      .min(0, "O estoque não pode ser negativo"),
  })
  // promoção não pode custar mais caro que o preço normal
  .refine(
    (dados) =>
      dados.precoPromocional === 0 || dados.precoPromocional < dados.preco,
    {
      message: "O preço promocional tem que ser menor que o preço normal",
      path: ["precoPromocional"],
    }
  );

// Formulário usado tanto pra criar quanto pra editar produto.
// Recebe por props o produto (quando é edição), as categorias ({ id, nome })
// e a função de salvar, que chama a API e devolve uma Promise.
function FormProduto({ produto, categorias, aoSalvar }) {
  const router = useRouter();
  const [erro, setErro] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    // na edição já vem tudo preenchido, no cadastro vem vazio
    defaultValues: {
      nome: produto ? produto.nome : "",
      descricao: produto ? produto.descricao : "",
      preco: produto ? produto.preco : "",
      precoPromocional: produto && produto.precoPromocional ? produto.precoPromocional : 0,
      imagem: produto ? produto.imagem : "",
      categoriaId: produto?.categoriaId ?? "",
      status: produto ? produto.status : "ATIVO",
      estoque: produto ? produto.estoque : 0,
    },
  });

  async function enviar(dados) {
    setErro("");

    try {
      await aoSalvar({
        ...dados,
        // zero no campo de promoção quer dizer "sem promoção"
        precoPromocional: dados.precoPromocional > 0 ? dados.precoPromocional : null,
      });
      router.push("/admin/produtos");
    } catch (e) {
      // ex.: 422 "O preço promocional precisa ser menor que o preço normal."
      setErro(e.message);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(enviar)}
      className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-2xl"
    >
      {erro && (
        <p className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mb-4">
          {erro}
        </p>
      )}

      <label className="block font-bold mb-1">Nome</label>
      <input {...register("nome")} className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2" />
      {errors.nome && <p className="text-red-600 text-sm mt-1">{errors.nome.message}</p>}

      <label className="block font-bold mb-1 mt-4">Descrição</label>
      <textarea {...register("descricao")} rows="3" className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2" />
      {errors.descricao && <p className="text-red-600 text-sm mt-1">{errors.descricao.message}</p>}

      <div className="flex flex-wrap gap-4 mt-4">
        <div className="flex-1 min-w-[160px]">
          <label className="block font-bold mb-1">Preço (R$)</label>
          <input type="number" step="0.01" {...register("preco")} className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2" />
          {errors.preco && <p className="text-red-600 text-sm mt-1">{errors.preco.message}</p>}
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block font-bold mb-1">Preço promocional (R$)</label>
          <input type="number" step="0.01" {...register("precoPromocional")} className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2" />
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Deixe 0 se não tem promoção</p>
          {errors.precoPromocional && (
            <p className="text-red-600 text-sm mt-1">{errors.precoPromocional.message}</p>
          )}
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block font-bold mb-1">Estoque</label>
          <input type="number" step="1" {...register("estoque")} className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2" />
          {errors.estoque && <p className="text-red-600 text-sm mt-1">{errors.estoque.message}</p>}
        </div>
      </div>

      <label className="block font-bold mb-1 mt-4">Endereço da imagem</label>
      <input {...register("imagem")} placeholder="https://..." className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2" />
      {errors.imagem && <p className="text-red-600 text-sm mt-1">{errors.imagem.message}</p>}

      <div className="flex flex-wrap gap-4 mt-4">
        <div className="flex-1 min-w-[160px]">
          <label className="block font-bold mb-1">Categoria</label>
          <select {...register("categoriaId")} className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2">
            <option value="">Escolha uma categoria</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.ativa ? "" : " (inativa)"}
              </option>
            ))}
          </select>
          {errors.categoriaId && <p className="text-red-600 text-sm mt-1">{errors.categoriaId.message}</p>}
        </div>

        <div className="flex-1 min-w-[160px]">
          <label className="block font-bold mb-1">Status</label>
          <select {...register("status")} className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2">
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800 disabled:opacity-60"
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/produtos")}
          className="border-2 border-gray-300 dark:border-gray-600 rounded px-6 py-3 font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default FormProduto;
