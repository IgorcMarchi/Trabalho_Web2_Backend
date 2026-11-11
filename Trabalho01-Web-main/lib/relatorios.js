import { z } from "zod";
import { requisicao, validar } from "./api";
import { diaParaBr } from "./datas";
import { pedidoSchema, pontoSchema, usuarioSchema } from "./esquemas";
import { converterPedido } from "./pedidos";
import { converterUsuario } from "./usuarios";

const dashboardSchema = z.object({
  totalVendas: z.number(),
  faturamento: z.number(),
  totalPedidos: z.number(),
  clientes: z.number(),
  produtos: z.number(),
  categorias: z.number(),
  produtosAtivos: z.number(),
  emPromocao: z.number(),
  faturamentoPorDia: z.array(pontoSchema),
  maisVendidos: z.array(pontoSchema),
  vendasPorCategoria: z.array(pontoSchema),
  pedidosRecentes: z.array(pedidoSchema),
});

const vendasSchema = z.object({
  totalVendas: z.number(),
  faturamento: z.number(),
  pecasVendidas: z.number(),
  ticketMedio: z.number(),
  faturamentoPorDia: z.array(pontoSchema),
  pedidosPorDia: z.array(pontoSchema),
  maisVendidos: z.array(pontoSchema),
  menosVendidos: z.array(pontoSchema),
  vendasPorCategoria: z.array(pontoSchema),
  clientes: z.object({ total: z.number(), recentes: z.array(usuarioSchema) }),
});

// os gráficos por dia vêm como 2026-11-11; na tela, 11/11/2026
const diasParaBr = (pontos) => pontos.map((p) => ({ ...p, rotulo: diaParaBr(p.rotulo) }));

// Tudo calculado no servidor, a partir dos pedidos gravados no banco
export async function buscarDashboard() {
  const dados = validar(dashboardSchema, await requisicao("/relatorios/dashboard"));
  return {
    ...dados,
    faturamentoPorDia: diasParaBr(dados.faturamentoPorDia),
    pedidosRecentes: dados.pedidosRecentes.map(converterPedido),
  };
}

export async function buscarRelatorioVendas({ de, ate, categoriaId, produtoId } = {}) {
  const dados = validar(
    vendasSchema,
    await requisicao("/relatorios/vendas", { consulta: { de, ate, categoriaId, produtoId } })
  );
  return {
    ...dados,
    faturamentoPorDia: diasParaBr(dados.faturamentoPorDia),
    pedidosPorDia: diasParaBr(dados.pedidosPorDia),
    clientes: { total: dados.clientes.total, recentes: dados.clientes.recentes.map(converterUsuario) },
  };
}
