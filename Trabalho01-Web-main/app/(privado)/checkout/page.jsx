"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCarrinho } from "../../../contexto/CarrinhoContext";
import { useUsuario } from "../../../contexto/UsuarioContext";
import { usePedidos } from "../../../contexto/PedidosContext";
import { precoFinal } from "../../../dados/precos";

// Aqui ficam as regras de validação do formulário.
// Se o campo não passar na regra, a mensagem aparece embaixo dele.
const schema = z.object({
  nome: z.string().min(3, "O nome precisa ter pelo menos 3 letras"),
  email: z.string().email("Digite um e-mail válido"),
  telefone: z.string().min(10, "Digite o telefone com DDD"),
  cep: z.string().min(8, "O CEP precisa ter 8 números"),
  endereco: z.string().min(5, "Digite o endereço completo"),
  cidade: z.string().min(3, "Digite a cidade"),
  formaPagamento: z.string().min(1, "Escolha a forma de pagamento"),
});

// Checkout (rota /checkout)
export default function Checkout() {
  const { itens, total, limpar } = useCarrinho();
  const { usuario } = useUsuario();
  const { adicionarPedido } = usePedidos();
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    // já preenche o nome e o email de quem está logado.
    // O "?." é só por segurança: a RotaProtegida garante o usuário.
    defaultValues: {
      nome: usuario?.nome ?? "",
      email: usuario?.email ?? "",
    },
  });

  function finalizar(dados) {
    // não tem back-end, então os dados da entrega só vão pro console
    console.log("pedido:", dados);

    // ATENÇÃO: o pedido tem que ser salvo ANTES de limpar o carrinho.
    // Se limpar primeiro, o pedido fica sem nenhum produto.
    adicionarPedido(dados, itens, total);

    limpar();
    setEnviado(true);
  }

  // tela de confirmação depois que o formulário foi enviado certo
  if (enviado) {
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold text-green-700 mb-2">
          Pedido realizado!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Obrigado pela compra. Seu pedido foi salvo no seu histórico.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/meus-pedidos"
            className="bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800"
          >
            Ver meus pedidos
          </Link>
          <Link
            href="/produtos"
            className="border-2 border-blue-700 text-blue-700 dark:text-blue-400 rounded px-6 py-3 font-bold hover:bg-blue-50 dark:hover:bg-blue-900"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  // Não precisa mais checar se tem alguém logado aqui: esta página está
  // dentro do grupo (privado), e o layout desse grupo + o proxy.js já
  // mandam para o /login quem não está autenticado.

  // não deixa finalizar compra sem nada no carrinho
  if (itens.length === 0) {
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-2">Checkout</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Seu carrinho está vazio, não tem o que finalizar.
        </p>
        <Link
          href="/produtos"
          className="bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-800 dark:text-blue-300 mb-6">
        Finalizar compra
      </h1>

      <div className="flex flex-wrap gap-6">
        <form
          onSubmit={handleSubmit(finalizar)}
          className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 flex-1 min-w-[320px]"
        >
          <label className="block font-bold mb-1">Nome completo</label>
          <input
            {...register("nome")}
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.nome && (
            <p className="text-red-600 text-sm mt-1">{errors.nome.message}</p>
          )}

          <label className="block font-bold mb-1 mt-4">E-mail</label>
          <input
            {...register("email")}
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}

          <label className="block font-bold mb-1 mt-4">Telefone</label>
          <input
            {...register("telefone")}
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.telefone && (
            <p className="text-red-600 text-sm mt-1">
              {errors.telefone.message}
            </p>
          )}

          <label className="block font-bold mb-1 mt-4">CEP</label>
          <input
            {...register("cep")}
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.cep && (
            <p className="text-red-600 text-sm mt-1">{errors.cep.message}</p>
          )}

          <label className="block font-bold mb-1 mt-4">Endereço</label>
          <input
            {...register("endereco")}
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.endereco && (
            <p className="text-red-600 text-sm mt-1">
              {errors.endereco.message}
            </p>
          )}

          <label className="block font-bold mb-1 mt-4">Cidade</label>
          <input
            {...register("cidade")}
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.cidade && (
            <p className="text-red-600 text-sm mt-1">{errors.cidade.message}</p>
          )}

          <label className="block font-bold mb-1 mt-4">
            Forma de pagamento
          </label>
          <select
            {...register("formaPagamento")}
            defaultValue=""
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          >
            <option value="">Escolha a forma de pagamento</option>
            <option value="PIX">Pix</option>
            <option value="BOLETO">Boleto</option>
            <option value="CARTAO">Cartão de crédito</option>
          </select>
          {errors.formaPagamento && (
            <p className="text-red-600 text-sm mt-1">
              {errors.formaPagamento.message}
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-6 bg-orange-500 text-white rounded py-3 font-bold hover:bg-orange-600"
          >
            Confirmar pedido
          </button>
        </form>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 w-full md:w-72">
          <h2 className="font-bold text-lg mb-3">Resumo</h2>

          {itens.map((item) => (
            <div key={item.id} className="text-sm mb-2">
              <p className="line-clamp-1">{item.nome}</p>
              <p className="text-gray-500 dark:text-gray-400">
                {item.quantidade}x R$ {precoFinal(item).toFixed(2)}
              </p>
            </div>
          ))}

          <p className="border-t-2 border-gray-200 dark:border-gray-700 mt-3 pt-3 font-bold text-lg">
            Total:{" "}
            <span className="text-green-700">R$ {total.toFixed(2)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
