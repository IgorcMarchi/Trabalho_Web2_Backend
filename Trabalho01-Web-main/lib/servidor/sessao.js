// Coisas da sessão que só rodam no SERVIDOR do Next (proxy.js e Route
// Handlers). Nada daqui vai para o navegador.

// Endereço da API NestJS. Sem o prefixo NEXT_PUBLIC_, essa variável só
// existe no servidor: o navegador nunca fala direto com a API, ele fala
// com o próprio Next (/api/...), que repassa a chamada.
export const API_URL = process.env.API_URL || "http://localhost:3001";

// Nome do cookie que guarda o JWT. Ele é httpOnly: o JavaScript da página
// não consegue ler (protege contra roubo do token por XSS).
export const COOKIE_TOKEN = "tecshop_token";

// O cookie vive o mesmo tempo que o token (1 hora)
export function opcoesDoCookie(expiraEm) {
  const segundos = Math.floor((new Date(expiraEm).getTime() - Date.now()) / 1000);

  return {
    httpOnly: true,
    // em produção (https) o cookie só viaja criptografado
    secure: process.env.NODE_ENV === "production",
    // não vai junto em POST vindo de outro site (proteção contra CSRF)
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, segundos),
  };
}

const codificador = new TextEncoder();

function base64urlParaBytes(texto) {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const comPreenchimento = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(comPreenchimento), (letra) => letra.charCodeAt(0));
}

// Confere o JWT de verdade: assinatura (HMAC SHA-256 com o JWT_SECRET,
// o mesmo da API) e validade (exp). Devolve o payload { sub, email, papel }
// ou null. Usa a Web Crypto do próprio Node, sem biblioteca extra.
//
// Na primeira etapa o proxy.js só olhava se o cookie existia, e qualquer um
// podia criar esse cookie pelo F12. Agora um token falso ou vencido é barrado.
export async function verificarToken(token) {
  const segredo = process.env.JWT_SECRET;

  if (!segredo) {
    console.error(
      "JWT_SECRET não configurado no front-end (Trabalho01-Web-main/.env.local). " +
        "Use o mesmo valor do backend/.env."
    );
    return null;
  }

  const partes = token.split(".");
  if (partes.length !== 3) {
    return null;
  }

  const [cabecalho, payload, assinatura] = partes;

  try {
    const chave = await crypto.subtle.importKey(
      "raw",
      codificador.encode(segredo),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const assinaturaConfere = await crypto.subtle.verify(
      "HMAC",
      chave,
      base64urlParaBytes(assinatura),
      codificador.encode(`${cabecalho}.${payload}`)
    );

    if (!assinaturaConfere) {
      return null;
    }

    const dados = JSON.parse(new TextDecoder().decode(base64urlParaBytes(payload)));

    if (!dados.exp || dados.exp * 1000 <= Date.now()) {
      return null;
    }

    return dados;
  } catch {
    return null;
  }
}

// Resposta no mesmo formato de erro da API, para quando nem deu para falar com ela
export function respostaSemApi() {
  return Response.json(
    {
      sucesso: false,
      erro: {
        status: 503,
        mensagem:
          "Não foi possível falar com o servidor da TecShop. Verifique se a API (backend) está rodando e tente de novo.",
      },
    },
    { status: 503 }
  );
}

// Pedidos que mudam dados precisam vir do próprio site (mesma origem)
export function origemPermitida(request) {
  const origem = request.headers.get("origin");

  if (!origem) {
    return true;
  }

  try {
    return new URL(origem).host === request.headers.get("host");
  } catch {
    return false;
  }
}
