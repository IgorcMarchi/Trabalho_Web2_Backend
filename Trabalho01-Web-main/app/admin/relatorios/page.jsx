"use client";

import { useState } from "react";
import GraficoBarras from "../../../components/GraficoBarras";
import { usePedidos, CANCELADO } from "../../../contexto/PedidosContext";
import { useProdutos } from "../../../contexto/ProdutosContext";
import { useCategorias } from "../../../contexto/CategoriasContext";
import { useUsuario } from "../../../contexto/UsuarioContext";
import { precoFinal } from "../../../dados/precos";

// a data do pedido fica como 02/10/2026 e o input de data usa
// 2026-10-02. Esta função converte pra conseguir comparar.
function paraFormatoDeComparacao(dataBr) {
  const partes = dataBr.split("/");
  return partes[2] + "-" + partes[1] + "-" + partes[0];
}

// Relatórios (rota /admin/relatorios)
export default function AdminRelatorios() {
  const { todosPedidos } = usePedidos();
  const { produtos, pegarProduto } = useProdutos();
  const { categorias } = useCategorias();
  const { listarClientes } = useUsuario();

  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroProduto, setFiltroProduto] = useState("todos");

  function limparFiltros() {
    setDe("");
    setAte("");
    setFiltroCategoria("todas");
    setFiltroProduto("todos");
  }

  // pedido cancelado não conta como venda
  const pedidosValidos = todosPedidos.filter(
    (p) => p.statusPedido !== CANCELADO
  );

  // aplica o filtro de período
  const pedidosDoPeriodo = pedidosValidos.filter((pedido) => {
    const data = paraFormatoDeComparacao(pedido.data);

    if (de && data < de) {
      return false;
    }

    if (ate && data > ate) {
      return false;
    }

    return true;
  });

  // monta a lista de itens vendidos, já aplicando os filtros de
  // categoria e de produto
  const itensVendidos = [];

  for (const pedido of pedidosDoPeriodo) {
    for (const item of pedido.itens) {
      if (filtroProduto !== "todos" && String(item.id) !== filtroProduto) {
        continue;
      }

      if (filtroCategoria !== "todas" && item.categoria !== filtroCategoria) {
        continue;
      }

      itensVendidos.push({ ...item, dataPedido: pedido.data });
    }
  }

  // ----- os números -----
  const totalDeVendas = pedidosDoPeriodo.length;

  const faturamento = itensVendidos.reduce(
    (soma, item) => soma + precoFinal(item) * item.quantidade,
    0
  );

  const pecasVendidas = itensVendidos.reduce(
    (soma, item) => soma + item.quantidade,
    0
  );

  const ticketMedio = totalDeVendas > 0 ? faturamento / totalDeVendas : 0;

  // ----- produtos mais e menos vendidos -----
  // junta as quantidades do mesmo produto
  const porProduto = {};

  for (const item of itensVendidos) {
    if (!porProduto[item.id]) {
      porProduto[item.id] = { nome: item.nome, quantidade: 0 };
    }
    porProduto[item.id].quantidade += item.quantidade;
  }

  const ranking = Object.values(porProduto).sort(
    (a, b) => b.quantidade - a.quantidade
  );

  const maisVendidos = ranking
    .slice(0, 5)
    .map((p) => ({ rotulo: p.nome, valor: p.quantidade }));

  const menosVendidos = [...ranking]
    .reverse()
    .slice(0, 5)
    .map((p) => ({ rotulo: p.nome, valor: p.quantidade }));

  // ----- vendas por categoria -----
  const porCategoria = {};

  for (const item of itensVendidos) {
    const chave = item.categoria || "Sem categoria";
    if (!porCategoria[chave]) {
      porCategoria[chave] = 0;
    }
    porCategoria[chave] += precoFinal(item) * item.quantidade;
  }

  const vendasPorCategoria = Object.keys(porCategoria).map((nome) => ({
    rotulo: nome,
    valor: porCategoria[nome],
  }));

  // ----- pedidos por data -----
  const porData = {};

  for (const pedido of pedidosDoPeriodo) {
    if (!porData[pedido.data]) {
      porData[pedido.data] = 0;
    }
    porData[pedido.data] += 1;
  }

  const pedidosPorData = Object.keys(porData).map((data) => ({
    rotulo: data,
    valor: porData[data],
  }));

  // ----- faturamento por data -----
  const faturamentoPorData = {};

  for (const pedido of pedidosDoPeriodo) {
    if (!faturamentoPorData[pedido.data]) {
      faturamentoPorData[pedido.data] = 0;
    }
    faturamentoPorData[pedido.data] += pedido.total;
  }

  const graficoFaturamento = Object.keys(faturamentoPorData).map((data) => ({
    rotulo: data,
    valor: faturamentoPorData[data],
  }));

  const clientes = listarClientes();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Relatórios</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Pedidos cancelados não entram nas contas.
      </p>

      {/* filtros */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <h2 className="font-bold mb-3">Filtros</h2>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-bold mb-1">De</label>
            <input
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-bold mb-1">Até</label>
            <input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-bold mb-1">Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="todas">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-bold mb-1">Produto</label>
            <select
              value={filtroProduto}
              onChange={(e) => setFiltroProduto(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded p-2"
            >
              <option value="todos">Todos</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={limparFiltros}
          className="mt-3 border-2 border-gray-300 dark:border-gray-600 rounded px-4 py-2 text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Limpar filtros
        </button>
      </div>

      {/* números gerais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Total de vendas</p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{totalDeVendas}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Faturamento</p>
          <p className="text-3xl font-bold text-green-700">
            R$ {faturamento.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Peças vendidas</p>
          <p className="text-3xl font-bold text-orange-500">{pecasVendidas}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Ticket médio</p>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
            R$ {ticketMedio.toFixed(2)}
          </p>
        </div>
      </div>

      {/* gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="font-bold mb-4">Faturamento por dia</h2>
          <GraficoBarras
            dados={graficoFaturamento}
            prefixo="R$ "
            cor="bg-green-600"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="font-bold mb-4">Pedidos por dia</h2>
          <GraficoBarras dados={pedidosPorData} prefixo="" cor="bg-blue-700" />
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="font-bold mb-4">Produtos mais vendidos</h2>
          <GraficoBarras
            dados={maisVendidos}
            prefixo=""
            cor="bg-green-600"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="font-bold mb-4">Produtos menos vendidos</h2>
          <GraficoBarras
            dados={menosVendidos}
            prefixo=""
            cor="bg-orange-500"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="font-bold mb-4">Vendas por categoria</h2>
          <GraficoBarras
            dados={vendasPorCategoria}
            prefixo="R$ "
            cor="bg-indigo-600"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <h2 className="font-bold mb-4">Clientes cadastrados</h2>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">{clientes.length}</p>
          <div className="mt-4 flex flex-col gap-2">
            {clientes.slice(0, 5).map((cliente) => (
              <div key={cliente.email} className="text-sm">
                <span className="font-bold">{cliente.nome}</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {" "}
                  - cadastrado em {cliente.dataCadastro}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
