// POST /api/video — autoriza subir un video de promoción directo a Vercel Blob (hasta 60 MB).
import { handleUpload } from "@vercel/blob/client";
import { exigirAdmin, json } from "../lib/auth.js";
import { blobConfigurado } from "../lib/almacen.js";

export async function POST(request) {
  if (!blobConfigurado()) return json({ error: "Falta conectar el almacenamiento (Blob) en Vercel." }, 503);
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Pedido no válido." }, 400);
  if (body.type === "blob.generate-client-token") {
    const { error } = exigirAdmin(request);
    if (error) return error;
  }
  try {
    const r = await handleUpload({
      body, request,
      onBeforeGenerateToken: async pathname => {
        if (!/^videos\/[A-Za-z0-9._-]+$/.test(pathname)) throw new Error("Nombre de archivo no válido.");
        return {
          allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime"],
          maximumSizeInBytes: 60 * 1024 * 1024,
          addRandomSuffix: true
        };
      }
    });
    return json(r);
  } catch (e) {
    console.error(e);
    return json({ error: "No se pudo autorizar la subida del video." }, 400);
  }
}
