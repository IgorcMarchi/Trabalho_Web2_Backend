import { TemaProvider } from "../contexto/TemaContext";
import { UsuarioProvider } from "../contexto/UsuarioContext";
import { CarrinhoProvider } from "../contexto/CarrinhoContext";
import { ListaDesejosProvider } from "../contexto/ListaDesejosContext";
import Navbar from "../components/Navbar";
import Rodape from "../components/Rodape";
import Conteudo from "../components/Conteudo";
import "./globals.css";

export const metadata = {
  title: "TecShop",
  description: "Trabalho de Projeto e Desenvolvimento de Sistemas Web",
};

// Molde das páginas: tudo que está aqui aparece em todas as rotas.
// A ordem dos Provider importa: quem está por dentro consegue usar
// quem está por fora. Por isso o UsuarioProvider vem antes do carrinho
// e da lista de desejos (os dois precisam saber quem está logado).
//
// Na segunda etapa ficaram em Context só os estados globais de interface
// (tema, sessão, carrinho e lista de desejos). Produtos, pedidos,
// promoções e avaliações são dados do servidor: cada página busca na API
// o que precisa, já filtrado e paginado (ver lib/ e hooks/useRequisicao).
export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col min-h-screen">
        <TemaProvider>
          <UsuarioProvider>
            <CarrinhoProvider>
              <ListaDesejosProvider>
                <Navbar />
                <Conteudo>{children}</Conteudo>
                <Rodape />
              </ListaDesejosProvider>
            </CarrinhoProvider>
          </UsuarioProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
