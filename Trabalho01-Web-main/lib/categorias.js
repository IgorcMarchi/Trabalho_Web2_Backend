import { z } from "zod";
import { requisicao, validar } from "./api";
import { categoriaSchema } from "./esquemas";

const listaDeCategorias = z.array(categoriaSchema);

// lista curta, sem paginação. ativa: true = só as que aparecem na loja
export async function listarCategorias({ ativa } = {}) {
  const dados = await requisicao("/categorias", { consulta: { ativa } });
  return validar(listaDeCategorias, dados);
}

export async function criarCategoria(nome) {
  const dados = await requisicao("/categorias", { metodo: "POST", corpo: { nome } });
  return validar(categoriaSchema, dados);
}

// { nome } para renomear ou { ativa } para ativar/desativar
export async function atualizarCategoria(id, alteracoes) {
  const dados = await requisicao(`/categorias/${id}`, { metodo: "PATCH", corpo: alteracoes });
  return validar(categoriaSchema, dados);
}

export function excluirCategoria(id) {
  return requisicao(`/categorias/${id}`, { metodo: "DELETE" });
}
