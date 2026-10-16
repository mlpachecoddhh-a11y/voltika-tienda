// POST /api/foto — sube una foto de producto (JPG, PNG o WEBP, hasta 4 MB).
import { exigirAdmin, json } from "../lib/auth.js";
import { guardarFoto, blobConfigurado } from "../lib/almacen.js";

const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const MAX = 4 * 1024 * 1024;

export async function POST(request) {
  const { error } = exigirAdmin(request);
  if (error) return error;
  if (!blobConfigurado()) return json({ error: "Falta conectar el almacenamiento (Blob) en Vercel." }, 503);
  const tipo = (request.headers.get("content-type") || "").split(";")[0].trim();
  if (!TIPOS.includes(tipo)) return json({ error: "Formato no admitido. Usá JPG, PNG o WEBP." }, 415);
  const bytes = Buffer.from(await request.arrayBuffer());
  if (!bytes.length) return json({ error: "La foto llegó vacía." }, 400);
  if (bytes.length > MAX) return json({ error: "La foto pesa más de 4 MB." }, 413);
  try { return json({ url: await guardarFoto(bytes, tipo) }); }
  catch (e) { console.error(e); return json({ error: "No se pudo subir la foto." }, 500); }
}
