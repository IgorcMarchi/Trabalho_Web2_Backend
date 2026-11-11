import { buscarTodasAsPaginas, requisicao, validar } from "./api";
import { paginaDe, produtoSchema } from "./esquemas";
import { converterProduto } from "./produtos";

const paginaDeProdutos = paginaDe(produtoSchema);

// A lista é de quem está logado: a API descobre quem é pelo token.
export function listarDesejos() {
  return buscarTodasAsPaginas(async (pagina) => {
    const dados = await requisicao("/lista-desejos", { consulta: { pagina, limite: 50 } });
    const resultado = validar(paginaDeProdutos, dados);
    return { ...resultado, itens: resultado.itens.map(converterProduto) };
  });
}

export function adicionarDesejo(produtoId) {
  return requisicao("/lista-desejos", { metodo: "POST", corpo: { produtoId } });
}

export function removerDesejo(produtoId) {
  return requisicao(`/lista-desejos/${produtoId}`, { metodo: "DELETE" });
}
