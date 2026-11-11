// TEMPORAL: diagnóstico de usuarios cargados (no muestra contraseñas). Borrar después.
import { json } from "../lib/auth.js";
export async function GET() {
  const out = [];
  for (let i = 1; i <= 5; i++) {
    const u = process.env[`ADMIN_USUARIO_${i}`], c = process.env[`ADMIN_CLAVE_${i}`];
    out.push({ i, usuario: u ?? null, claveLargo: c == null ? null : c.length, claveInicio: c ? c[0] : null });
  }
  return json({ out, secret: (process.env.SESSION_SECRET || "").length });
}
