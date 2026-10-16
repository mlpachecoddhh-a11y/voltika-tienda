// GET /api/sesion — quién está conectado al panel.
import { usuarioDeSesion, json } from "../lib/auth.js";
import { blobConfigurado } from "../lib/almacen.js";

export async function GET(request) {
  let usuario = null;
  try { usuario = usuarioDeSesion(request); } catch {}
  if (!usuario) return json({ usuario: null }, 401);
  return json({ usuario, almacenamiento: blobConfigurado() });
}
