import { NextResponse } from "next/server";
import { COOKIE_TOKEN, origemPermitida } from "../../../../lib/servidor/sessao";

// POST /api/auth/sair: apaga o cookie com o token.
// (O JWT é "stateless": não existe sessão na API para encerrar.)
export async function POST(request) {
  // a mesma proteção das outras rotas que mudam algo: só o próprio site
  // pode pedir para sair (outro site não consegue deslogar ninguém)
  if (!origemPermitida(request)) {
    return NextResponse.json(
      { sucesso: false, erro: { status: 403, mensagem: "Origem não permitida." } },
      { status: 403 }
    );
  }

  const saida = new NextResponse(null, { status: 204 });
  saida.cookies.delete(COOKIE_TOKEN);
  return saida;
}
