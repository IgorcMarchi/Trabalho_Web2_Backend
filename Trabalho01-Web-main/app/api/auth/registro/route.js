import { autenticar } from "../../../../lib/servidor/autenticar";

// POST /api/auth/registro -> API POST /auth/registro (já entra na conta)
export async function POST(request) {
  return autenticar(request, "/auth/registro");
}
