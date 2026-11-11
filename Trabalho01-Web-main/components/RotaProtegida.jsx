"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Carregando from "./Carregando";
import { useUsuario } from "../contexto/UsuarioContext";

// Proteção das rotas privadas do lado do cliente.
// Trabalha junto com o proxy.js: o proxy barra o acesso antes da página
// abrir (conferindo o JWT do cookie), e este componente confere de novo
// no navegador, com o usuário que a API devolveu para a sessão.
// Quem protege os DADOS de verdade é a API (AuthGuard + PapeisGuard).
//
// Uso: <RotaProtegida> para qualquer usuário logado e
//      <RotaProtegida apenasAdmin> para o painel.
function RotaProtegida({ children, apenasAdmin = false }) {
  const { usuario, carregou } = useUsuario();
  const router = useRouter();
  const caminho = usePathname();

  // não autenticado: manda para o login, guardando de onde veio
  // para voltar para a mesma página depois de entrar.
  // replace (e não push) para o botão "voltar" não cair de novo aqui.
  useEffect(() => {
    if (carregou && !usuario) {
      router.replace(`/login?redirect=${encodeURIComponent(caminho)}`);
    }
  }, [carregou, usuario, caminho, router]);

  // enquanto a sessão não foi conferida no servidor, ou enquanto o redirecionamento
  // acontece, não mostra nada da página privada
  if (!carregou || !usuario) {
    return <Carregando texto="Verificando acesso..." />;
  }

  // logado, mas sem permissão (cliente tentando abrir o painel)
  if (apenasAdmin && usuario.tipo !== "ADMIN") {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <h1 className="text-2xl font-bold text-red-700 mb-2">Acesso negado</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Esta área é só para administradores. Sua conta é de cliente.
        </p>
        <Link
          href="/"
          className="bg-blue-700 text-white rounded px-6 py-3 font-bold hover:bg-blue-800"
        >
          Voltar para a loja
        </Link>
      </div>
    );
  }

  return children;
}

export default RotaProtegida;
