import { buscarTodasAsPaginas, requisicao, validar } from "./api";
import { formatarData } from "./datas";
import { paginaDe, produtoSchema } from "./esquemas";

// Formato que as telas já usavam: categoria como texto (o nome) e
// dataCadastro em dd/mm/aaaa. O categoriaId vem junto para os formulários.
export function converterProduto(produto) {
  return {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao,
    preco: produto.preco,
    precoPromocional: produto.precoPromocional,
    imagem: produto.imagem,
    status: produto.status,
    estoque: produto.estoque,
    categoriaId: produto.categoriaId,
    categoria: produto.categoria?.nome ?? "Sem categoria",
    dataCadastro: formatarData(produto.criadoEm),
    mediaAvaliacoes: produto.mediaAvaliacoes,
    totalAvaliacoes: produto.totalAvaliacoes,
  };
}

const paginaDeProdutos = paginaDe(produtoSchema);

// Busca, categoria e paginação são resolvidas no banco (a API filtra).
// status: ATIVO (loja) | INATIVO | TODOS (os dois últimos só para ADMIN)
export async function listarProdutos({
  busca,
  categoriaId,
  status,
  emPromocao,
  pagina = 1,
  limite = 12,
} = {}) {
  const dados = await requisicao("/produtos", {
    consulta: { busca, categoriaId, status, emPromocao, pagina, limite },
  });
  const resultado = validar(paginaDeProdutos, dados);
  return { ...resultado, itens: resultado.itens.map(converterProduto) };
}

// para os <select> do painel (promoções, relatórios)
export function listarTodosOsProdutos(status = "TODOS") {
  return buscarTodasAsPaginas((pagina) => listarProdutos({ status, pagina, limite: 50 }));
}

export async function buscarProduto(id) {
  const dados = await requisicao(`/produtos/${id}`);
  return converterProduto(validar(produtoSchema, dados));
}

export async function criarProduto(dados) {
  const criado = await requisicao("/produtos", { metodo: "POST", corpo: dados });
  return converterProduto(validar(produtoSchema, criado));
}

// PATCH: manda só o que mudou (ex.: { status: "INATIVO" })
export async function atualizarProduto(id, dados) {
  const atualizado = await requisicao(`/produtos/${id}`, { metodo: "PATCH", corpo: dados });
  return converterProduto(validar(produtoSchema, atualizado));
}

export function excluirProduto(id) {
  return requisicao(`/produtos/${id}`, { metodo: "DELETE" });
}
