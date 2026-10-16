// POST /api/logout — cierra la sesión.
import { cookieVacia, json } from "../lib/auth.js";

export async function POST() {
  return json({ ok: true }, 200, { "set-cookie": cookieVacia });
}
