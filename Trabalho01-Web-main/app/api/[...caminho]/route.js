import { NextResponse } from "next/server";
import {
  API_URL,
  COOKIE_TOKEN,
  origemPermitida,
  respostaSemApi,
} from "../../../lib/servidor/sessao";

// Ponte entre o navegador e a API (Route Handler do Next).
//
//   navegador  ->  /api/produtos?busca=x  ->  API_URL/produtos?busca=x
//
// O navegador nunca vê o token: ele fica no cookie httpOnly, e é aqui,
// no servidor do Next, que ele vira o cabeçalho Authorization: Bearer.
// Quem decide se pode ou não é sempre a API (AuthGuard e PapeisGuard).
async function encaminhar(request, { params }) {
  const { caminho } = await params;
  const metodo = request.method;

  if (metodo !== "GET" && !origemPermitida(request)) {
    return NextResponse.json(
      { sucesso: false, erro: { status: 403, mensagem: "Origem não permitida." } },
      { status: 403 }
    );
  }

  const token = request.cookies.get(COOKIE_TOKEN)?.value;
  const cabecalhos = { Accept: "application/json" };
  if (token) {
    cabecalhos.Authorization = `Bearer ${token}`;
  }

  let corpo;
  if (metodo === "POST" || metodo === "PUT" || metodo === "PATCH") {
    corpo = await request.text();
    cabecalhos["Content-Type"] = "application/json";
  }

  const destino =
    `${API_URL}/${caminho.map(encodeURIComponent).join("/")}` +
    new URL(request.url).search;

  let resposta;
  try {
    resposta = await fetch(destino, {
      method: metodo,
      headers: cabecalhos,
      body: corpo || undefined,
      cache: "no-store",
    });
  } catch {
    return respostaSemApi();
  }

  // 204 não tem corpo
  const texto = resposta.status === 204 ? null : await resposta.text();

  const saida = new NextResponse(texto, {
    status: resposta.status,
    headers: {
      "Content-Type": resposta.headers.get("content-type") ?? "application/json",
    },
  });

  // tinha token e a API disse 401: a sessão venceu. Apaga o cookie e
  // avisa a página (o UsuarioContext escuta esse aviso).
  if (resposta.status === 401 && token) {
    saida.cookies.delete(COOKIE_TOKEN);
    saida.headers.set("x-sessao-expirada", "1");
  }

  return saida;
}

export const GET = encaminhar;
export const POST = encaminhar;
export const PUT = encaminhar;
export const PATCH = encaminhar;
export const DELETE = encaminhar;
