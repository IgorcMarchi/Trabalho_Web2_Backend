import { TemaProvider } from "../contexto/TemaContext";
import { UsuarioProvider } from "../contexto/UsuarioContext";
import { ProdutosProvider } from "../contexto/ProdutosContext";
import { CategoriasProvider } from "../contexto/CategoriasContext";
import { PromocoesProvider } from "../contexto/PromocoesContext";
import { CarrinhoProvider } from "../contexto/CarrinhoContext";
import { ListaDesejosProvider } from "../contexto/ListaDesejosContext";
import { PedidosProvider } from "../contexto/PedidosContext";
import { FeedbackProvider } from "../contexto/FeedbackContext";
import Navbar from "../components/Navbar";
import Rodape from "../components/Rodape";
import Conteudo from "../components/Conteudo";
import "./globals.css";

export const metadata = {
  title: "TecShop",
  description: "Trabalho 01 de Projeto e Desenvolvimento de Sistemas Web",
};

// Molde das páginas: tudo que está aqui aparece em todas as rotas.
// A ordem dos Provider importa: quem está por dentro consegue usar
// quem está por fora. Por isso o UsuarioProvider é o primeiro e o
// CategoriasProvider fica dentro do ProdutosProvider.
export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 flex flex-col min-h-screen">
        <TemaProvider>
          <UsuarioProvider>
            <ProdutosProvider>
              <CategoriasProvider>
                <PromocoesProvider>
                  <CarrinhoProvider>
                    <ListaDesejosProvider>
                      <PedidosProvider>
                        <FeedbackProvider>
                          <Navbar />
                          <Conteudo>{children}</Conteudo>
                          <Rodape />
                        </FeedbackProvider>
                      </PedidosProvider>
                    </ListaDesejosProvider>
                  </CarrinhoProvider>
                </PromocoesProvider>
              </CategoriasProvider>
            </ProdutosProvider>
          </UsuarioProvider>
        </TemaProvider>
      </body>
    </html>
  );
}
