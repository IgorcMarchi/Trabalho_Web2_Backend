import { NextResponse } from "next/server";
import {
  API_URL,
  COOKIE_TOKEN,
  opcoesDoCookie,
  origemPermitida,
  respostaSemApi,
} from "./sessao";

// Usado pelos Route Handlers de login e de cadastro.
// Repassa e-mail e senha para a API e, se der certo, guarda o JWT num
// cookie httpOnly. Para o navegador volta só o usuário, nunca o token.
export async function autenticar(request, caminhoNaApi) {
  if (!origemPermitida(request)) {
    return NextResponse.json(
      { sucesso: false, erro: { status: 403, mensagem: "Origem não permitida." } },
      { status: 403 }
    );
  }

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminhoNaApi}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    });
  } catch {
    return respostaSemApi();
  }

  const json = await resposta.json().catch(() => null);

  // erro (400, 401, 409...): devolve do jeito que a API mandou
  if (!resposta.ok || !json?.dados?.token) {
    return NextResponse.json(json, { status: resposta.status });
  }

  const { token, expiraEm, usuario } = json.dados;

  const saida = NextResponse.json(
    { sucesso: true, dados: { usuario } },
    { status: resposta.status }
  );
  saida.cookies.set(COOKIE_TOKEN, token, opcoesDoCookie(expiraEm));

  return saida;
}
