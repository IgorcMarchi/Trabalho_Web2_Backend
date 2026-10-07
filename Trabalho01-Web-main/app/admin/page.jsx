"use client";

import Link from "next/link";
import GraficoBarras from "../../components/GraficoBarras";
import SeloStatus from "../../components/SeloStatus";
import { useProdutos } from "../../contexto/ProdutosContext";
import { useUsuario } from "../../contexto/UsuarioContext";
import { usePedidos, CANCELADO } from "../../contexto/PedidosContext";
import { useCategorias } from "../../contexto/CategoriasContext";
import { temPromocao, precoFinal } from "../../dados/precos";

// Cartão com um número. Recebe tudo por props pra ser reaproveitado.
function Cartao({ titulo, valor, cor }) {
  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <p className="text-gray-500 dark:text-gray-400 text-sm">{titulo}</p>
      <p className={`text-3xl font-bold mt-1 ${cor}`}>{valor}</p>
    </div>
  );
}

// Dashboard (rota /admin)
export default function Dashboard() {
  const { produtos } = useProdutos();
  const { listarClientes } = useUsuario();
  const { todosPedidos } = usePedidos();
  const { categorias } = useCategorias();

  const clientes = listarClientes();

  // pedido cancelado não conta como venda
  const vendas = todosPedidos.filter((p) => p.statusPedido !== CANCELADO);

  const faturamento = vendas.reduce((soma, p) => soma + p.total, 0);

  const ativos = produtos.filter((p) => p.status === "ATIVO").length;
  const emPromocao = produtos.filter(temPromocao).length;

  // os 5 pedidos mais recentes
  const recentes = [...todosPedidos].reverse().slice(0, 5);

  // ----- faturamento por dia, pro gráfico -----
  const porData = {};

  for (const pedido of vendas) {
    if (!porData[pedido.data]) {
      porData[pedido.data] = 0;
    }
    porData[pedido.data] += pedido.total;
  }

  const faturamentoPorDia = Object.keys(porData).map((data) => ({
    rotulo: data,
    valor: porData[data],
  }));

  // ----- quantidade vendida por produto, pro gráfico -----
  const porProduto = {};

  for (const pedido of vendas) {
    for (const item of pedido.itens) {
      if (!porProduto[item.id]) {
        porProduto[item.id] = { nome: item.nome, quantidade: 0 };
      }
      porProduto[item.id].quantidade += item.quantidade;
    }
  }

  const maisVendidos = Object.values(porProduto)
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 5)
    .map((p) => ({ rotulo: p.nome, valor: p.quantidade }));

  // ----- vendas por categoria -----
  const porCategoria = {};

  for (const pedido of vendas) {
    for (const item of pedido.itens) {
      const chave = item.categoria || "Sem categoria";
      if (!porCategoria[chave]) {
        porCategoria[chave] = 0;
      }
      porCategoria[chave] += precoFinal(item) * item.quantidade;
    }
  }

  const vendasPorCategoria = Object.keys(porCategoria).map((nome) => ({
    rotulo: nome,
    valor: porCategoria[nome],
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Dashboard</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Visão geral da loja.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Cartao
          titulo="Total de vendas"
          valor={vendas.length}
          cor="text-blue-700 dark:text-blue-400"
        />
        <Cartao
          titulo="Faturamento total"
          valor={`R$ ${faturamento.toFixed(2)}`}
          cor="text-green-700"
        />
        <Cartao
          titulo="Pedidos (com cancelados)"
          valor={todosPedidos.length}
          cor="text-gray-700 dark:text-gray-300"
        />
        <Cartao
          titulo="Clientes cadastrados"
          valor={clientes.length}
          cor="text-blue-700 dark:text-blue-400"
        />
        <Cartao
          titulo="Produtos cadastrados"
          valor={produtos.length}
          cor="text-blue-700 dark:text-blue-400"
        />
        <Cartao
          titulo="Categorias"
          valor={categorias.length}
          cor="text-indigo-600"
        />
        <Cartao titulo="Produtos ativos" valor={ativos} cor="text-green-700" />
        <Cartao
          titulo="Em promoção"
          valor={emPromocao}
          cor="text-orange-500"
        />
      </div>

      {/* gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="font-bold mb-4">Faturamento por dia</h2>
          <GraficoBarras
            dados={faturamentoPorDia}
            prefixo="R$ "
            cor="bg-green-600"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="font-bold mb-4">Produtos mais vendidos</h2>
          <GraficoBarras dados={maisVendidos} prefixo="" cor="bg-blue-700" />
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="font-bold mb-4">Vendas por categoria</h2>
          <GraficoBarras
            dados={vendasPorCategoria}
            prefixo="R$ "
            cor="bg-indigo-600"
          />
        </div>
      </div>

      {/* pedidos recentes */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 mt-6">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
          <h2 className="font-bold">Pedidos recentes</h2>
          <Link
            href="/admin/pedidos"
            className="text-blue-700 dark:text-blue-400 text-sm font-bold hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {recentes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Nenhum pedido feito ainda. Faça uma compra na loja para o painel
            começar a mostrar números.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentes.map((pedido) => (
              <Link
                key={pedido.numero}
                href={`/admin/pedidos/${pedido.numero}`}
                className="bg-gray-50 dark:bg-gray-700 rounded p-3 flex flex-wrap items-center gap-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="font-bold">#{pedido.numero}</span>
                <span className="text-gray-500 dark:text-gray-400">{pedido.data}</span>
                <span className="flex-1 min-w-[140px]">
                  {pedido.clienteNome}
                </span>
                <span className="font-bold text-green-700">
                  R$ {pedido.total.toFixed(2)}
                </span>
                <SeloStatus status={pedido.statusPedido} />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* atalhos */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 mt-6">
        <h2 className="font-bold mb-3">Atalhos</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/produtos/novo"
            className="bg-blue-700 text-white rounded px-5 py-3 font-bold hover:bg-blue-800"
          >
            Cadastrar produto
          </Link>
          <Link
            href="/admin/promocoes"
            className="border-2 border-blue-700 text-blue-700 dark:text-blue-400 rounded px-5 py-3 font-bold hover:bg-blue-50 dark:hover:bg-blue-900"
          >
            Criar promoção
          </Link>
          <Link
            href="/"
            className="border-2 border-gray-300 dark:border-gray-600 rounded px-5 py-3 font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Ver a loja
          </Link>
        </div>
      </div>
    </div>
  );
}
