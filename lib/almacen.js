// Lectura y escritura del catálogo en Vercel Blob.
import { head, put, BlobNotFoundError } from "@vercel/blob";
import { CATALOGO_INICIAL } from "./catalogo.js";

const RUTA = "catalogo.json";

export const blobConfigurado = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// Devuelve { catalogo, version }. version = momento del último guardado (0 si nunca se guardó).
export async function leerCatalogo() {
  if (!blobConfigurado()) return { catalogo: CATALOGO_INICIAL, version: 0 };
  let info;
  try { info = await head(RUTA); }
  catch (e) {
    if (e instanceof BlobNotFoundError) return { catalogo: CATALOGO_INICIAL, version: 0 };
    throw e;
  }
  const version = new Date(info.uploadedAt).getTime();
  const r = await fetch(`${info.url}?v=${version}`, { cache: "no-store" });
  if (!r.ok) throw new Error("No se pudo leer el catálogo guardado.");
  return { catalogo: await r.json(), version };
}

export async function guardarCatalogo(catalogo, usuario) {
  const cuerpo = JSON.stringify({ ...catalogo, actualizado: new Date().toISOString(), por: usuario });
  await put(RUTA, cuerpo, {
    access: "public", addRandomSuffix: false, allowOverwrite: true,
    contentType: "application/json", cacheControlMaxAge: 60
  });
  // Copia de respaldo de cada guardado, por si hay que volver atrás.
  const marca = new Date().toISOString().replace(/[:.]/g, "-");
  await put(`respaldos/catalogo-${marca}.json`, cuerpo, { access: "public", addRandomSuffix: true, contentType: "application/json" }).catch(() => {});
  const info = await head(RUTA);
  return new Date(info.uploadedAt).getTime();
}

export async function guardarFoto(bytes, contentType) {
  const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[contentType];
  const nombre = `fotos/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const r = await put(nombre, bytes, { access: "public", addRandomSuffix: false, contentType });
  return r.url;
}
