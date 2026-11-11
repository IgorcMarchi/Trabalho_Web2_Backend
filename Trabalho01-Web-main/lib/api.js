// Cliente HTTP da TecShop. TODA chamada ao back-end passa por aqui:
// URL base, cabeçalhos, tratamento de erro e o formato das respostas
// ficam num lugar só, e as páginas nunca montam fetch na mão.
//
// O navegador fala com o próprio Next (/api/...). O Next (Route Handler)
// coloca o token e repassa para a API NestJS.

// avisado quando a API responde que a sessão venceu (o UsuarioContext escuta)
export const EVENTO_SESSAO_EXPIRADA = "tecshop:sessao-expirada";

export class ApiError extends Error {
  constructor(status, mensagem, { codigo, detalhes } = {}) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

function montarUrl(caminho, consulta) {
  const parametros = new URLSearchParams();

  for (const [chave, valor] of Object.entries(consulta ?? {})) {
    // filtro vazio não vai na URL
    if (valor !== undefined && valor !== null && valor !== "") {
      parametros.set(chave, String(valor));
    }
  }

  const texto = parametros.toString();
  return `/api${caminho}${texto ? `?${texto}` : ""}`;
}

export async function requisicao(caminho, { metodo = "GET", corpo, consulta } = {}) {
  let resposta;

  try {
    resposta = await fetch(montarUrl(caminho, consulta), {
      method: metodo,
      headers: corpo ? { "Content-Type": "application/json" } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
      cache: "no-store",
    });
  } catch {
    // o fetch só lança erro quando nem chegou no servidor (rede)
    throw new ApiError(0, "Sem conexão. Verifique a internet e tente de novo.");
  }

  const sessaoExpirada = Boolean(resposta.headers.get("x-sessao-expirada"));
  if (sessaoExpirada) {
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
  }

  if (resposta.status === 204) {
    return null;
  }

  const json = await resposta.json().catch(() => null);

  // ATENÇÃO: 404 e 500 NÃO lançam erro no fetch. Por isso o res.ok.
  if (!resposta.ok) {
    // a sessão acabou (token vencido ou apagado): mensagem clara, em vez
    // do texto técnico da API sobre o cabeçalho Authorization
    if (sessaoExpirada) {
      throw new ApiError(401, "Sua sessão expirou. Entre na sua conta de novo.");
    }

    const erro = json?.erro;
    const mensagem = erro?.mensagem ?? `O servidor respondeu com erro ${resposta.status}.`;

    // Erro de validação (400): a API manda o motivo de cada campo em
    // "detalhes". Juntamos na mensagem para a pessoa saber o que corrigir.
    const detalhes = Array.isArray(erro?.detalhes) ? erro.detalhes : [];

    throw new ApiError(
      resposta.status,
      detalhes.length > 0 ? `${mensagem} ${detalhes.join("; ")}` : mensagem,
      { codigo: erro?.codigo, detalhes }
    );
  }

  // a API embrulha tudo em { sucesso: true, dados }
  return json?.dados ?? null;
}

// Confere se a resposta veio no formato esperado (Zod).
// Se a API mudar o formato, o erro aparece aqui, com mensagem clara,
// em vez de quebrar a tela lá na frente.
export function validar(schema, dados) {
  const resultado = schema.safeParse(dados);

  if (!resultado.success) {
    console.error("Resposta da API fora do formato esperado:", resultado.error);
    throw new ApiError(500, "O servidor respondeu num formato inesperado.");
  }

  return resultado.data;
}

// Para listas usadas em <select> (todas as categorias, todos os produtos):
// vai pedindo página por página (máximo 50 por vez, o limite da API).
export async function buscarTodasAsPaginas(buscarPagina) {
  const todos = [];
  let pagina = 1;
  let paginas = 1;

  do {
    const resultado = await buscarPagina(pagina);
    todos.push(...resultado.itens);
    paginas = resultado.meta.paginas;
    pagina++;
  } while (pagina <= paginas);

  return todos;
}
