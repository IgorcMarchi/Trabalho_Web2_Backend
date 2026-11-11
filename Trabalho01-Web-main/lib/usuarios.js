import { requisicao, validar } from "./api";
import { formatarData } from "./datas";
import { paginaDe, usuarioSchema } from "./esquemas";

// A API chama de "papel"; as telas da primeira etapa usam "tipo".
// A conversão fica aqui para não precisar mexer em todos os componentes.
export function converterUsuario(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.papel,
    ativo: usuario.ativo,
    dataCadastro: formatarData(usuario.criadoEm),
  };
}

// usado no dashboard e nos relatórios (só ADMIN)
export async function listarUsuarios({ papel, busca, pagina = 1, limite = 10 } = {}) {
  const dados = await requisicao("/usuarios", { consulta: { papel, busca, pagina, limite } });
  const resultado = validar(paginaDe(usuarioSchema), dados);
  return { ...resultado, itens: resultado.itens.map(converterUsuario) };
}
