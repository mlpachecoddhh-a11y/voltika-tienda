// GET /api/catalogo — catálogo público de la tienda.
import { leerCatalogo } from "../lib/almacen.js";
import { json } from "../lib/auth.js";

export async function GET(request) {
  const fresco = new URL(request.url).searchParams.has("fresco");
  try {
    const { catalogo, version } = await leerCatalogo();
    const { config, productos } = catalogo;
    return json({ config, productos, version }, 200, {
      "cache-control": fresco ? "no-store" : "public, s-maxage=15, stale-while-revalidate=60"
    });
  } catch (e) {
    console.error(e);
    return json({ error: "No se pudo cargar el catálogo." }, 500);
  }
}
