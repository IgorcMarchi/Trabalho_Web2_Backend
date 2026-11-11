import { formatarData } from "./datas";

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
