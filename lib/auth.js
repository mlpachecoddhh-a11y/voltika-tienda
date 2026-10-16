// Usuarios y sesiones del panel de administración.
// Los usuarios se cargan en Vercel como variables de entorno:
//   ADMIN_USUARIO_1 / ADMIN_CLAVE_1, ADMIN_USUARIO_2 / ADMIN_CLAVE_2 ... (hasta 5)
//   SESSION_SECRET: texto largo al azar para firmar las sesiones.
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "vk_sesion";
const DURACION = 12 * 60 * 60; // 12 horas

function usuarios() {
  const lista = [];
  for (let i = 1; i <= 5; i++) {
    const u = (process.env[`ADMIN_USUARIO_${i}`] || "").trim().toLowerCase();
    const c = process.env[`ADMIN_CLAVE_${i}`] || "";
    if (u && c) lista.push({ usuario: u, clave: c });
  }
  return lista;
}

function secreto() {
  const s = process.env.SESSION_SECRET || "";
  if (s.length < 24) throw new Error("Falta configurar SESSION_SECRET en Vercel (mínimo 24 caracteres).");
  return s;
}

const igual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};
const firmar = datos => createHmac("sha256", secreto()).update(datos).digest("base64url");

export function verificarClave(usuario, clave) {
  const u = String(usuario || "").trim().toLowerCase();
  let ok = null;
  for (const x of usuarios()) if (igual(x.usuario, u) & igual(x.clave, clave || "")) ok = x.usuario;
  return ok;
}

export function hayUsuarios() { return usuarios().length > 0; }

export function crearCookie(usuario) {
  const datos = Buffer.from(JSON.stringify({ u: usuario, exp: Math.floor(Date.now() / 1000) + DURACION })).toString("base64url");
  const token = `${datos}.${firmar(datos)}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${DURACION}`;
}

export const cookieVacia = `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export function usuarioDeSesion(request) {
  const cookies = request.headers.get("cookie") || "";
  const m = cookies.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return null;
  const [datos, firma] = m[1].split(".");
  if (!datos || !firma) return null;
  try {
    if (!igual(firmar(datos), firma)) return null;
    const { u, exp } = JSON.parse(Buffer.from(datos, "base64url").toString());
    if (!u || exp < Date.now() / 1000) return null;
    // Si se borra el usuario en Vercel, su sesión deja de valer.
    if (!usuarios().some(x => x.usuario === u)) return null;
    return u;
  } catch { return null; }
}

// Las escrituras exigen sesión y una cabecera propia del panel (protege contra envíos desde otros sitios).
export function exigirAdmin(request) {
  if (request.headers.get("x-voltika") !== "admin") return { error: json({ error: "Pedido no válido." }, 400) };
  const usuario = usuarioDeSesion(request);
  if (!usuario) return { error: json({ error: "Tu sesión venció. Volvé a ingresar." }, 401) };
  return { usuario };
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }
  });
}
