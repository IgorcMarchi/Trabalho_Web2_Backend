import { NextResponse } from "next/server";
import { API_URL, COOKIE_TOKEN, respostaSemApi } from "../../../../lib/servidor/sessao";

// GET /api/auth/sessao: quem está logado agora?
// O UsuarioContext chama ao abrir o site (inclusive depois do F5).
// Visitante sem cookie recebe { dados: null } sem nem chamar a API.
export async function GET(request) {
  const token = request.cookies.get(COOKIE_TOKEN)?.value;

  if (!token) {
    return NextResponse.json({ sucesso: true, dados: null });
  }

  let resposta;
  try {
    resposta = await fetch(`${API_URL}/auth/eu`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return respostaSemApi();
  }

  // token vencido ou inválido: apaga o cookie e trata como visitante
  if (resposta.status === 401) {
    const saida = NextResponse.json({ sucesso: true, dados: null });
    saida.cookies.delete(COOKIE_TOKEN);
    return saida;
  }

  const json = await resposta.json().catch(() => null);
  return NextResponse.json(json, { status: resposta.status });
}
