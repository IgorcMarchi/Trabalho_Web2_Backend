"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Carregando from "../../../components/Carregando";
import { useCarrinho } from "../../../contexto/CarrinhoContext";
import { useUsuario } from "../../../contexto/UsuarioContext";
import { criarPedido } from "../../../lib/pedidos";
import { precoFinal } from "../../../dados/precos";

// Aqui ficam as regras de validação do formulário.
// Se o campo não passar na regra, a mensagem aparece embaixo dele.
// (A API confere as mesmas regras de novo: o navegador não é confiável.)
const schema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "O nome precisa ter pelo menos 3 letras")
    .max(120, "O nome pode ter no máximo 120 letras"),
  email: z.string().email("Digite um e-mail válido"),
  telefone: z
    .string()
    .trim()
    .regex(/^[\d\s()+-]{10,20}$/, "Digite o telefone com DDD (só números, espaço, parênteses ou traço)"),
  cep: z.string().trim().regex(/^\d{5}-?\d{3}$/, "O CEP precisa ter 8 números (ex.: 85892-000)"),
  endereco: z
    .string()
    .trim()
    .min(5, "Digite o endereço completo")
    .max(200, "O endereço pode ter no máximo 200 letras"),
  cidade: z
    .string()
    .trim()
    .min(3, "Digite a cidade")
    .max(100, "A cidade pode ter no máximo 100 letras"),
  formaPagamento: z.string().min(1, "Escolha a forma de pagamento"),
});

// Checkout (rota /checkout)
export default function Checkout() {
  const {
    itens,
    carregou,
    total,
    limpar,
    podeFinalizar,
    verificando,
    erroVerificacao,
    verificarDeNovo,
  } = useCarrinho();
  const { usuario } = useUsuario();
  const [pedidoCriado, setPedidoCriado] = useState(null);
  const [erro, setErro] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    // já preenche o nome e o email de quem está logado.
    // O "?." é só por segurança: a RotaProtegida garante o usuário.
    defaultValues: {
      nome: usuario?.nome ?? "",
      email: usuario?.email ?? "",
    },
  });

  async function finalizar(dados) {
    setErro("");

    try {
      // Vai para a API só produto + quantidade. Preço e total quem
      // calcula é o servidor, com os dados do banco, e o estoque é
      // baixado lá dentro de uma transação.
      const pedido = await criarPedido(dados, itens);

      // só limpa o carrinho DEPOIS que o pedido foi gravado
      limpar();
      setPedidoCriado(pedido);
    } catch (e) {
      // 409 = acabou o estoque; 404 = produto saiu da loja.
      // Confere o carrinho de novo para mostrar o aviso no item.
      setErro(e.message);
      verificarDeNovo();
    }
  }

  // tela de confirmação depois que o pedido foi gravado
  if (pedidoCriado) {
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold text-green-700 mb-2">
          Pedido #{pedidoCriado.numero} realizado!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Obrigado pela compra. Total de R$ {pedidoCriado.total.toFixed(2)}. Seu
          pedido foi salvo no seu histórico.
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

  // espera ler o carrinho salvo (senão o F5 mostraria "vazio" por um instante)
  if (!carregou) {
    return <Carregando texto="Carregando seu carrinho..." />;
  }

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

      {erro && (
        <div className="bg-red-100 border-2 border-red-300 text-red-700 rounded p-3 mb-4">
          <p className="font-bold">Não foi possível finalizar o pedido</p>
          <p className="text-sm">{erro}</p>
          <Link href="/carrinho" className="text-sm font-bold underline">
            Revisar o carrinho
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-6">
        <form
          onSubmit={handleSubmit(finalizar)}
          className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 flex-1 sm:min-w-[320px]"
        >
          <label htmlFor="nome" className="block font-bold mb-1">Nome completo</label>
          <input
            id="nome"
            {...register("nome")}
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.nome && (
            <p className="text-red-600 text-sm mt-1">{errors.nome.message}</p>
          )}

          <label htmlFor="email" className="block font-bold mb-1 mt-4">E-mail</label>
          {/* o pedido fica na conta de quem está logado (vem do token) */}
          <input
            id="email"
            {...register("email")}
            readOnly
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2 bg-gray-50 dark:bg-gray-900"
          />
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            O pedido fica registrado na sua conta.
          </p>
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}

          <label htmlFor="telefone" className="block font-bold mb-1 mt-4">Telefone</label>
          <input
            id="telefone"
            {...register("telefone")}
            placeholder="(45) 99999-0000"
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.telefone && (
            <p className="text-red-600 text-sm mt-1">
              {errors.telefone.message}
            </p>
          )}

          <label htmlFor="cep" className="block font-bold mb-1 mt-4">CEP</label>
          <input
            id="cep"
            {...register("cep")}
            placeholder="85892-000"
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.cep && (
            <p className="text-red-600 text-sm mt-1">{errors.cep.message}</p>
          )}

          <label htmlFor="endereco" className="block font-bold mb-1 mt-4">Endereço</label>
          <input
            id="endereco"
            {...register("endereco")}
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.endereco && (
            <p className="text-red-600 text-sm mt-1">
              {errors.endereco.message}
            </p>
          )}

          <label htmlFor="cidade" className="block font-bold mb-1 mt-4">Cidade</label>
          <input
            id="cidade"
            {...register("cidade")}
            className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
          />
          {errors.cidade && (
            <p className="text-red-600 text-sm mt-1">{errors.cidade.message}</p>
          )}

          <label htmlFor="formaPagamento" className="block font-bold mb-1 mt-4">
            Forma de pagamento
          </label>
          <select
            id="formaPagamento"
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

          {/* travado enquanto envia (não cria o pedido duas vezes) e
              enquanto o carrinho tiver item sem estoque */}
          <button
            type="submit"
            disabled={isSubmitting || !podeFinalizar}
            className="w-full mt-6 bg-orange-500 text-white rounded py-3 font-bold hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Enviando pedido..." : "Confirmar pedido"}
          </button>
          {!podeFinalizar && !verificando && (
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-2">
              {erroVerificacao
                ? "Não foi possível conferir o carrinho com a loja."
                : "Há itens sem estoque no carrinho."}{" "}
              <Link href="/carrinho" className="font-bold underline">
                Revisar o carrinho
              </Link>
            </p>
          )}
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            O valor final é confirmado pelo servidor.
          </p>
        </div>
      </div>
    </div>
  );
}
