import { z } from "zod";
import { requisicao, validar } from "./api";
import { promocaoSchema } from "./esquemas";

function converterPromocao(promocao) {
  return {
    ...promocao,
    // nome do que a promoção alcança, para mostrar na lista
    alvoNome:
      promocao.alvo === "CATEGORIA"
        ? (promocao.categoria?.nome ?? "Categoria excluída")
        : (promocao.produto?.nome ?? "Produto excluído"),
  };
}

const listaDePromocoes = z.array(promocaoSchema);

// situacao: VALENDO (público) | TODAS (ADMIN)
export async function listarPromocoes({ situacao } = {}) {
  const dados = await requisicao("/promocoes", { consulta: { situacao } });
  return validar(listaDePromocoes, dados).map(converterPromocao);
}

export async function criarPromocao(dados) {
  const criada = await requisicao("/promocoes", { metodo: "POST", corpo: dados });
  return converterPromocao(validar(promocaoSchema, criada));
}

// { ativa: false } desativa e devolve o preço normal dos produtos
export async function atualizarPromocao(id, alteracoes) {
  const dados = await requisicao(`/promocoes/${id}`, { metodo: "PATCH", corpo: alteracoes });
  return converterPromocao(validar(promocaoSchema, dados));
}

export function excluirPromocao(id) {
  return requisicao(`/promocoes/${id}`, { metodo: "DELETE" });
}
