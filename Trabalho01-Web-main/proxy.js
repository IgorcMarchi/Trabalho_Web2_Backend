import { NextResponse } from "next/server";
import { COOKIE_TOKEN, verificarToken } from "./lib/servidor/sessao";

// Controle de acesso das rotas privadas (o "middleware" do trabalho).
// No Next.js 16 o antigo middleware.js passou a se chamar proxy.js:
// ele roda ANTES da página ser entregue, a cada requisição, inclusive
// nas navegações feitas pelo <Link>.
//
// O que ele faz agora, com o back-end:
// 1. lê o cookie httpOnly com o JWT (criado no login pela rota /api/auth/login);
// 2. confere a ASSINATURA e a VALIDADE do token (verificarToken);
// 3. sem token válido, bloqueia a rota e redireciona para /login, levando
//    o endereço original em ?redirect= para voltar depois;
// 4. com token válido, deixa a requisição seguir.
//
// Isso só decide se a PÁGINA abre. Os dados vêm da API, que confere o
// token e o papel (CLIENTE/ADMIN) de novo em toda requisição. Por isso,
// mesmo que alguém burle o front, não consegue ler nem mudar nada.

export async function proxy(request) {
  const token = request.cookies.get(COOKIE_TOKEN)?.value;
  const usuario = token ? await verificarToken(token) : null;

  if (!usuario) {
    const urlLogin = new URL("/login", request.url);
    urlLogin.searchParams.set("redirect", request.nextUrl.pathname);

    const resposta = NextResponse.redirect(urlLogin);
    // token vencido ou adulterado: já apaga
    if (token) {
      resposta.cookies.delete(COOKIE_TOKEN);
    }
    return resposta;
  }

  return NextResponse.next();
}

// Só as rotas privadas passam pelo proxy. As públicas (home, produtos,
// sobre, feedback, carrinho, login, cadastro) nem são verificadas.
export const config = {
  matcher: ["/admin/:path*", "/checkout", "/meus-pedidos", "/lista-desejos"],
};
