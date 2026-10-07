import { NextResponse } from "next/server";

// Controle de acesso das rotas privadas (o "middleware" do trabalho).
// No Next.js 16 o antigo middleware.js passou a se chamar proxy.js:
// ele roda ANTES da página ser entregue, a cada requisição, inclusive
// nas navegações feitas pelo <Link>.
//
// O que ele faz:
// 1. confere se existe o cookie de sessão (criado no login);
// 2. se não existe, bloqueia a rota e redireciona para /login,
//    levando o endereço original em ?redirect= para voltar depois;
// 3. se existe, deixa a requisição seguir.
//
// Quem é ADMIN ou CLIENTE é conferido no navegador pela RotaProtegida.
// Na etapa do back-end, aqui entra a validação do token (JWT) enviado
// pelo servidor, sem precisar mudar as páginas.

const COOKIE_SESSAO = "tecshop_sessao";

export function proxy(request) {
  const sessao = request.cookies.get(COOKIE_SESSAO)?.value;

  if (!sessao) {
    const urlLogin = new URL("/login", request.url);
    urlLogin.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(urlLogin);
  }

  return NextResponse.next();
}

// Só as rotas privadas passam pelo proxy. As públicas (home, produtos,
// sobre, feedback, carrinho, login, cadastro) nem são verificadas.
export const config = {
  matcher: ["/admin/:path*", "/checkout", "/meus-pedidos", "/lista-desejos"],
};
