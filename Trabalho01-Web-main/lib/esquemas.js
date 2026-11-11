import { z } from "zod";

// Formatos das respostas da API, conferidos com Zod antes de chegar nas telas.
// Campos que vêm a mais são ignorados; campo que falta ou vem com o tipo
// errado vira um erro claro (ver validar() em lib/api.js).

export const metaSchema = z.object({
  total: z.number(),
  pagina: z.number(),
  limite: z.number(),
  paginas: z.number(),
});

export function paginaDe(itemSchema) {
  return z.object({ itens: z.array(itemSchema), meta: metaSchema });
}

export const categoriaSchema = z.object({
  id: z.number(),
  nome: z.string(),
  ativa: z.boolean(),
  quantidadeProdutos: z.number().optional(),
});

export const produtoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  descricao: z.string(),
  preco: z.number(),
  precoPromocional: z.number().nullable(),
  imagem: z.string(),
  status: z.enum(["ATIVO", "INATIVO"]),
  estoque: z.number(),
  categoriaId: z.number().nullable(),
  categoria: z.object({ id: z.number(), nome: z.string() }).nullable().optional(),
  criadoEm: z.string(),
  mediaAvaliacoes: z.number().optional(),
  totalAvaliacoes: z.number().optional(),
});

export const usuarioSchema = z.object({
  id: z.number(),
  nome: z.string(),
  email: z.string(),
  papel: z.enum(["CLIENTE", "ADMIN"]),
  ativo: z.boolean(),
  criadoEm: z.string(),
});

export const itemPedidoSchema = z.object({
  id: z.number(),
  produtoId: z.number().nullable(),
  nomeProduto: z.string(),
  imagem: z.string(),
  categoriaNome: z.string().nullable(),
  quantidade: z.number(),
  precoOriginal: z.number(),
  precoUnitario: z.number(),
  subtotal: z.number(),
});

export const pedidoSchema = z.object({
  id: z.number(),
  clienteNome: z.string(),
  telefone: z.string(),
  cep: z.string(),
  endereco: z.string(),
  cidade: z.string(),
  formaPagamento: z.string(),
  status: z.string(),
  statusPagamento: z.string(),
  total: z.number(),
  criadoEm: z.string(),
  itens: z.array(itemPedidoSchema).optional(),
  usuario: z.object({ email: z.string(), nome: z.string() }).optional(),
});

export const promocaoSchema = z.object({
  id: z.number(),
  nome: z.string(),
  tipo: z.enum(["PORCENTAGEM", "VALOR"]),
  valor: z.number(),
  dataInicio: z.string(),
  dataFim: z.string(),
  alvo: z.enum(["CATEGORIA", "PRODUTO"]),
  categoriaId: z.number().nullable(),
  produtoId: z.number().nullable(),
  categoria: z.object({ nome: z.string() }).nullable(),
  produto: z.object({ nome: z.string() }).nullable(),
  ativa: z.boolean(),
  valendo: z.boolean(),
  quantidadeProdutos: z.number(),
});

export const avaliacaoSchema = z.object({
  id: z.number(),
  produtoId: z.number(),
  produtoNome: z.string().nullable(),
  autorNome: z.string(),
  autorEmail: z.string().nullable().optional(),
  nota: z.number(),
  comentario: z.string(),
  criadoEm: z.string(),
});

export const feedbackSchema = z.object({
  id: z.number(),
  autorNome: z.string(),
  autorEmail: z.string().nullable().optional(),
  nota: z.number(),
  comentario: z.string(),
  criadoEm: z.string(),
});

export const pontoSchema = z.object({ rotulo: z.string(), valor: z.number() });
