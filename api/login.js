// POST /api/login — { usuario, clave } → cookie de sesión.
import { verificarClave, crearCookie, hayUsuarios, json } from "../lib/auth.js";

const intentos = new Map(); // freno básico contra adivinar claves (por instancia)

export async function POST(request) {
  if (request.headers.get("x-voltika") !== "admin") return json({ error: "Pedido no válido." }, 400);
  if (!hayUsuarios()) return json({ error: "Todavía no hay usuarios cargados en Vercel (ADMIN_USUARIO_1 y ADMIN_CLAVE_1)." }, 503);
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "?";
  const ahora = Date.now();
  const reg = intentos.get(ip) || { n: 0, desde: ahora };
  if (ahora - reg.desde > 15 * 60 * 1000) { reg.n = 0; reg.desde = ahora; }
  if (reg.n >= 8) return json({ error: "Demasiados intentos. Esperá 15 minutos." }, 429);

  let body = {};
  try { body = await request.json(); } catch {}
  let usuario;
  try { usuario = verificarClave(body.usuario, body.clave); }
  catch (e) { return json({ error: e.message }, 503); }
  if (!usuario) {
    reg.n++; intentos.set(ip, reg);
    await new Promise(r => setTimeout(r, 700));
    return json({ error: "Usuario o contraseña incorrectos." }, 401);
  }
  intentos.delete(ip);
  try { return json({ usuario }, 200, { "set-cookie": crearCookie(usuario) }); }
  catch (e) { return json({ error: e.message }, 503); }
}
