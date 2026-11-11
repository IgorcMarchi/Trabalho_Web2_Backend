import { requisicao, validar } from "./api";
import { formatarData } from "./datas";
import { paginaDe, pedidoSchema } from "./esquemas";

// Os status possíveis de um pedido, na ordem em que acontecem.
// (Mesmos valores da API e da primeira etapa.)
export const STATUS_PEDIDO = [
  "AGUARDANDO PAGAMENTO",
  "PAGAMENTO APROVADO",
  "EM PREPARAÇÃO",
  "ENVIADO",
  "ENTREGUE",
];

export const CANCELADO = "CANCELADO";

// dado um status, qual é o próximo da esteira (null no último ou cancelado)
export function proximoStatus(statusAtual) {
  const posicao = STATUS_PEDIDO.indexOf(statusAtual);

  if (posicao === -1 || posicao === STATUS_PEDIDO.length - 1) {
    return null;
  }

  return STATUS_PEDIDO[posicao + 1];
}

// Formato que as telas já usavam (numero, data, endereco.rua...).
// O preço de cada item é o que foi cobrado na compra, gravado no servidor.
export function converterPedido(pedido) {
  return {
    numero: pedido.id,
    data: formatarData(pedido.criadoEm),
    clienteNome: pedido.clienteNome,
    clienteEmail: pedido.usuario?.email ?? "",
    telefone: pedido.telefone,
    endereco: { cep: pedido.cep, rua: pedido.endereco, cidade: pedido.cidade },
    formaPagamento: pedido.formaPagamento,
    itens: (pedido.itens ?? []).map((item) => ({
      id: item.id,
      produtoId: item.produtoId,
      nome: item.nomeProduto,
      imagem: item.imagem,
      categoria: item.categoriaNome,
      quantidade: item.quantidade,
      preco: item.precoOriginal,
      precoPromocional: item.precoUnitario < item.precoOriginal ? item.precoUnitario : null,
      subtotal: item.subtotal,
    })),
    total: pedido.total,
    statusPedido: pedido.status,
    statusPagamento: pedido.statusPagamento,
  };
}

const paginaDePedidos = paginaDe(pedidoSchema);

// Checkout: vai só "qual produto" e "quantos". Total, preços e o dono do
// pedido quem decide é o servidor.
export async function criarPedido(dadosDoFormulario, itensDoCarrinho) {
  const dados = await requisicao("/pedidos", {
    metodo: "POST",
    corpo: {
      nome: dadosDoFormulario.nome,
      telefone: dadosDoFormulario.telefone,
      cep: dadosDoFormulario.cep,
      endereco: dadosDoFormulario.endereco,
      cidade: dadosDoFormulario.cidade,
      formaPagamento: dadosDoFormulario.formaPagamento,
      itens: itensDoCarrinho.map((item) => ({ produtoId: item.id, quantidade: item.quantidade })),
    },
  });
  return converterPedido(validar(pedidoSchema, dados));
}

export async function listarMeusPedidos({ pagina = 1, limite = 10 } = {}) {
  const dados = await requisicao("/pedidos/meus", { consulta: { pagina, limite } });
  const resultado = validar(paginaDePedidos, dados);
  return { ...resultado, itens: resultado.itens.map(converterPedido) };
}

// todos os pedidos (ADMIN), com busca e filtro de status
export async function listarPedidos({ busca, status, pagina = 1, limite = 20 } = {}) {
  const dados = await requisicao("/pedidos", { consulta: { busca, status, pagina, limite } });
  const resultado = validar(paginaDePedidos, dados);
  return { ...resultado, itens: resultado.itens.map(converterPedido) };
}

export async function buscarPedido(numero) {
  const dados = await requisicao(`/pedidos/${numero}`);
  return converterPedido(validar(pedidoSchema, dados));
}

export async function mudarStatusPedido(numero, status) {
  const dados = await requisicao(`/pedidos/${numero}/status`, {
    metodo: "PATCH",
    corpo: { status },
  });
  return converterPedido(validar(pedidoSchema, dados));
}
