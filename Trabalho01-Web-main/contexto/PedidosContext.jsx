"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useUsuario } from "./UsuarioContext";

// Os status possíveis de um pedido, na ordem em que acontecem.
// O administrador vai avançando de um pro outro.
export const STATUS_PEDIDO = [
  "AGUARDANDO PAGAMENTO",
  "PAGAMENTO APROVADO",
  "EM PREPARAÇÃO",
  "ENVIADO",
  "ENTREGUE",
];

export const CANCELADO = "CANCELADO";

// Guarda os pedidos.
// Agora é uma lista só, e cada pedido anota de qual cliente ele é.
// Assim o cliente vê os dele e o administrador vê todos.
const PedidosContext = createContext();

export function PedidosProvider({ children }) {
  const { usuario } = useUsuario();

  const [todosPedidos, setTodosPedidos] = useState([]);
  const [carregou, setCarregou] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("pedidos");

    if (salvo) {
      setTodosPedidos(JSON.parse(salvo));
    }

    setCarregou(true);
  }, []);

  useEffect(() => {
    if (carregou) {
      localStorage.setItem("pedidos", JSON.stringify(todosPedidos));
    }
  }, [todosPedidos, carregou]);

  // os pedidos de quem está logado agora
  const pedidos = usuario
    ? todosPedidos.filter((p) => p.clienteEmail === usuario.email)
    : [];

  function pegarPedido(numero) {
    return todosPedidos.find((p) => p.numero === Number(numero));
  }

  // chamada no checkout quando a compra é confirmada.
  // Recebe os dados do formulário, os itens e o total.
  function adicionarPedido(dadosDoFormulario, itens, total) {
    if (!usuario) {
      return;
    }

    // o número é global: conta todos os pedidos da loja, não só os do cliente
    const maiorNumero =
      todosPedidos.length > 0
        ? Math.max(...todosPedidos.map((p) => p.numero))
        : 0;

    const novoPedido = {
      numero: maiorNumero + 1,
      // toLocaleDateString com "pt-BR" já devolve no formato 02/10/2026
      data: new Date().toLocaleDateString("pt-BR"),
      clienteNome: dadosDoFormulario.nome,
      clienteEmail: usuario.email,
      telefone: dadosDoFormulario.telefone,
      endereco: {
        cep: dadosDoFormulario.cep,
        rua: dadosDoFormulario.endereco,
        cidade: dadosDoFormulario.cidade,
      },
      formaPagamento: dadosDoFormulario.formaPagamento,
      itens: itens,
      total: total,
      statusPedido: STATUS_PEDIDO[0],
      statusPagamento: "PENDENTE",
    };

    setTodosPedidos([...todosPedidos, novoPedido]);
  }

  function mudarStatus(numero, novoStatus) {
    setTodosPedidos(
      todosPedidos.map((p) => {
        if (p.numero !== Number(numero)) {
          return p;
        }

        // quando o pagamento é aprovado, o status do pagamento
        // acompanha automaticamente
        const pagamento =
          novoStatus === STATUS_PEDIDO[0] ? "PENDENTE" : "APROVADO";

        return { ...p, statusPedido: novoStatus, statusPagamento: pagamento };
      })
    );
  }

  function cancelarPedido(numero) {
    setTodosPedidos(
      todosPedidos.map((p) =>
        p.numero === Number(numero)
          ? { ...p, statusPedido: CANCELADO, statusPagamento: "CANCELADO" }
          : p
      )
    );
  }

  // dado um status, devolve qual é o próximo da fila.
  // Devolve null quando já chegou no último ou foi cancelado.
  function proximoStatus(statusAtual) {
    if (statusAtual === CANCELADO) {
      return null;
    }

    const posicao = STATUS_PEDIDO.indexOf(statusAtual);

    if (posicao === -1 || posicao === STATUS_PEDIDO.length - 1) {
      return null;
    }

    return STATUS_PEDIDO[posicao + 1];
  }

  return (
    <PedidosContext.Provider
      value={{
        pedidos,
        todosPedidos,
        pegarPedido,
        adicionarPedido,
        mudarStatus,
        cancelarPedido,
        proximoStatus,
      }}
    >
      {children}
    </PedidosContext.Provider>
  );
}

export function usePedidos() {
  return useContext(PedidosContext);
}
