"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Regras do cadastro de produto
const schema = z
  .object({
    nome: z.string().min(3, "O nome precisa ter pelo menos 3 letras"),
    descricao: z.string().min(10, "Escreva uma descrição com pelo menos 10 letras"),
    preco: z.coerce.number().positive("O preço precisa ser maior que zero"),
    // deixar em branco (ou zero) quer dizer que não tem promoção
    precoPromocional: z.coerce.number().min(0, "Não pode ser negativo"),
    imagem: z.string().url("Coloque o endereço de uma imagem (http://...)"),
    categoria: z.string().min(1, "Escolha uma categoria"),
    status: z.string(),
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
// Recebe por props o produto (quando é edição) e a função de salvar.
function FormProduto({ produto, categorias, aoSalvar }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    // na edição já vem tudo preenchido, no cadastro vem vazio
    defaultValues: {
      nome: produto ? produto.nome : "",
      descricao: produto ? produto.descricao : "",
      preco: produto ? produto.preco : "",
      precoPromocional: produto && produto.precoPromocional ? produto.precoPromocional : 0,
      imagem: produto ? produto.imagem : "",
      categoria: produto ? produto.categoria : "",
      status: produto ? produto.status : "ATIVO",
    },
  });

  function enviar(dados) {
    // zero no campo de promoção quer dizer "sem promoção"
    aoSalvar({
      ...dados,
      precoPromocional:
        dados.precoPromocional > 0 ? dados.precoPromocional : null,
    });

    router.push("/admin/produtos");
  }

  return (
    <form
      onSubmit={handleSubmit(enviar)}
      className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-2xl"
    >
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
      </div>

      <label className="block font-bold mb-1 mt-4">Endereço da imagem</label>
      <input {...register("imagem")} placeholder="https://..." className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2" />
      {errors.imagem && <p className="text-red-600 text-sm mt-1">{errors.imagem.message}</p>}

      <div className="flex flex-wrap gap-4 mt-4">
        <div className="flex-1 min-w-[160px]">
          <label className="block font-bold mb-1">Categoria</label>
          <select {...register("categoria")} className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2">
            <option value="">Escolha uma categoria</option>
            {categorias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.categoria && <p className="text-red-600 text-sm mt-1">{errors.categoria.message}</p>}
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
        <button type="submit" className="bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800">
          Salvar
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
