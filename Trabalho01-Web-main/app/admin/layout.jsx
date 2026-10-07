"use client";

import MenuAdmin from "../../components/MenuAdmin";
import BotaoTema from "../../components/BotaoTema";
import RotaProtegida from "../../components/RotaProtegida";
import { useUsuario } from "../../contexto/UsuarioContext";

// Molde das páginas do painel.
// O acesso é controlado em duas camadas:
// 1. proxy.js: quem não tem o cookie de sessão nem chega a abrir a
//    página, é redirecionado para /login?redirect=/admin...
// 2. RotaProtegida apenasAdmin: no navegador, confere o usuário lido
//    do localStorage. Sem login -> /login. Logado como cliente ->
//    tela de "Acesso negado". Vale também para quem digita /admin
//    direto na barra de endereço.
export default function AdminLayout({ children }) {
  return (
    <RotaProtegida apenasAdmin>
      <PainelAdmin>{children}</PainelAdmin>
    </RotaProtegida>
  );
}

// Só é desenhado depois que a RotaProtegida liberou,
// então aqui o usuario sempre existe e é ADMIN.
function PainelAdmin({ children }) {
  const { usuario } = useUsuario();

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <MenuAdmin />

      <div className="flex-1 bg-gray-100 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-wrap justify-between items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">Painel administrativo</span>
          <div className="flex items-center gap-3">
            <BotaoTema />
            <span className="text-sm">
              <strong>{usuario.nome}</strong>{" "}
              <span className="bg-blue-700 text-white text-xs px-2 py-1 rounded ml-1">
                ADMIN
              </span>
            </span>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
