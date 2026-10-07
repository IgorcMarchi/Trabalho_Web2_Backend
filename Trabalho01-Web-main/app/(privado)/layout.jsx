import RotaProtegida from "../../components/RotaProtegida";

// Layout do grupo de rotas (privado).
// Os parênteses no nome da pasta fazem o Next ignorar esse nome na URL:
// app/(privado)/checkout/page.jsx continua sendo a rota /checkout.
// A vantagem é que todas as páginas da área do cliente (checkout,
// meus pedidos e lista de desejos) ficam protegidas num lugar só.
export default function LayoutPrivado({ children }) {
  return <RotaProtegida>{children}</RotaProtegida>;
}
