import { z } from "zod";
import { requisicao, validar } from "./api";

const carrinhoCalculadoSchema = z.object({
  itens: z.array(
    z.object({
      produtoId: z.number(),
      nome: z.string().nullable(),
      imagem: z.string().nullable(),
      preco: z.number().nullable(),
      precoPromocional: z.number().nullable(),
      precoUnitario: z.number(),
      quantidade: z.number(),
      subtotal: z.number(),
      estoque: z.number(),
      disponivel: z.boolean(),
      problema: z.string().nullable(),
    })
  ),
  total: z.number(),
  quantidadeTotal: z.number(),
  valido: z.boolean(),
});

// Manda só id e quantidade; o servidor devolve preços, total e o que
// está esgotado. O preço que vale é sempre o do banco.
export async function calcularCarrinho(itens) {
  const dados = await requisicao("/carrinho/calcular", {
    metodo: "POST",
    corpo: {
      itens: itens.map((item) => ({ produtoId: item.id, quantidade: item.quantidade })),
    },
  });
  return validar(carrinhoCalculadoSchema, dados);
}
