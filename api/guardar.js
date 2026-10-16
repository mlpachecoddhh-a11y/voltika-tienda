// POST /api/guardar — guarda el catálogo completo. Body: { base, config, productos }.
import { exigirAdmin, json } from "../lib/auth.js";
import { validarCatalogo } from "../lib/catalogo.js";
import { leerCatalogo, guardarCatalogo, blobConfigurado } from "../lib/almacen.js";

export async function POST(request) {
  const { error, usuario } = exigirAdmin(request);
  if (error) return error;
  if (!blobConfigurado()) return json({ error: "Falta conectar el almacenamiento (Blob) en Vercel." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Datos no válidos." }, 400); }
  let catalogo;
  try { catalogo = validarCatalogo(body); } catch (e) { return json({ error: e.message }, 422); }
  try {
    const { version } = await leerCatalogo();
    if (Number(body.base) !== version) {
      return json({ error: "Alguien guardó cambios mientras editabas. Recargá el panel para ver la última versión." }, 409);
    }
    const nueva = await guardarCatalogo(catalogo, usuario);
    return json({ ok: true, version: nueva, catalogo });
  } catch (e) {
    console.error(e);
    return json({ error: "No se pudo guardar. Probá de nuevo." }, 500);
  }
}
