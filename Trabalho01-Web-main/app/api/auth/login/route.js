import { autenticar } from "../../../../lib/servidor/autenticar";

// POST /api/auth/login -> API POST /auth/login (grava o cookie httpOnly)
export async function POST(request) {
  return autenticar(request, "/auth/login");
}
