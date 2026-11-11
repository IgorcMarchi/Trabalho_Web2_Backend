import { z } from "zod";
import { requisicao, validar } from "./api";
import { usuarioSchema } from "./esquemas";
import { converterUsuario } from "./usuarios";

// As rotas /api/auth/* são Route Handlers do Next: elas falam com a API,
// guardam o JWT num cookie httpOnly e devolvem só o usuário.
const respostaComUsuario = z.object({ usuario: usuarioSchema });

export async function entrar(email, senha) {
  const dados = await requisicao("/auth/login", { metodo: "POST", corpo: { email, senha } });
  return converterUsuario(validar(respostaComUsuario, dados).usuario);
}

export async function cadastrar({ nome, email, senha }) {
  // repare: não mandamos "papel". Quem se cadastra é sempre CLIENTE.
  const dados = await requisicao("/auth/registro", {
    metodo: "POST",
    corpo: { nome, email, senha },
  });
  return converterUsuario(validar(respostaComUsuario, dados).usuario);
}

export function sair() {
  return requisicao("/auth/sair", { metodo: "POST" });
}

// quem está logado agora (null para visitante ou sessão vencida)
export async function buscarSessao() {
  const dados = await requisicao("/auth/sessao");
  return dados ? converterUsuario(validar(usuarioSchema, dados)) : null;
}
