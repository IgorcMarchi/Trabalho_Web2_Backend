import { NextResponse } from "next/server";
import { COOKIE_TOKEN } from "../../../../lib/servidor/sessao";

// POST /api/auth/sair: apaga o cookie com o token.
// (O JWT é "stateless": não existe sessão na API para encerrar.)
export async function POST() {
  const saida = new NextResponse(null, { status: 204 });
  saida.cookies.delete(COOKIE_TOKEN);
  return saida;
}
