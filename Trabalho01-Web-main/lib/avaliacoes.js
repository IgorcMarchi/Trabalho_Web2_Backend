import { requisicao, validar } from "./api";
import { avaliacaoSchema, feedbackSchema, paginaDe } from "./esquemas";

// Formato que ListaFeedbacks e o painel já usavam: { nome, email, nota, comentario }
function converterAvaliacao(avaliacao) {
  return {
    id: avaliacao.id,
    produtoId: avaliacao.produtoId,
    produtoNome: avaliacao.produtoNome,
    nome: avaliacao.autorNome,
    email: avaliacao.autorEmail ?? null,
    nota: avaliacao.nota,
    comentario: avaliacao.comentario,
  };
}

function converterFeedback(feedback) {
  return {
    id: feedback.id,
    nome: feedback.autorNome,
    email: feedback.autorEmail ?? null,
    nota: feedback.nota,
    comentario: feedback.comentario,
  };
}

const paginaDeAvaliacoes = paginaDe(avaliacaoSchema);
const paginaDeFeedbacks = paginaDe(feedbackSchema);

// ----- avaliações de produtos -----

export async function listarAvaliacoes({ produtoId, pagina = 1, limite = 50 } = {}) {
  const dados = await requisicao("/avaliacoes", { consulta: { produtoId, pagina, limite } });
  const resultado = validar(paginaDeAvaliacoes, dados);
  return { ...resultado, itens: resultado.itens.map(converterAvaliacao) };
}

// o nome de quem avalia não vai no corpo: a API usa o usuário do token
export async function criarAvaliacao(produtoId, { nota, comentario }) {
  const dados = await requisicao("/avaliacoes", {
    metodo: "POST",
    corpo: { produtoId: Number(produtoId), nota, comentario },
  });
  return converterAvaliacao(validar(avaliacaoSchema, dados));
}

export function removerAvaliacao(id) {
  return requisicao(`/avaliacoes/${id}`, { metodo: "DELETE" });
}

// ----- feedback do site -----

export async function listarFeedbacks({ pagina = 1, limite = 50 } = {}) {
  const dados = await requisicao("/feedbacks", { consulta: { pagina, limite } });
  const resultado = validar(paginaDeFeedbacks, dados);
  return { ...resultado, itens: resultado.itens.map(converterFeedback) };
}

export async function criarFeedback({ nota, comentario }) {
  const dados = await requisicao("/feedbacks", { metodo: "POST", corpo: { nota, comentario } });
  return converterFeedback(validar(feedbackSchema, dados));
}

export function removerFeedback(id) {
  return requisicao(`/feedbacks/${id}`, { metodo: "DELETE" });
}
