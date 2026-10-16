# Voltika · Tienda web

Tienda de Voltika (electricidad, automatización e impresión 3D, Ushuaia) con carrito, pedido por WhatsApp y panel de administración con usuario y contraseña.

- **Tienda:** `/`
- **Administración:** `/admin`

## Cómo está armada

| Parte | Dónde |
|---|---|
| Páginas, estilos y scripts | `public/` |
| Funciones del servidor (login, catálogo, fotos) | `api/` |
| Usuarios, sesiones y validación | `lib/` |
| Catálogo y fotos | Vercel Blob (`catalogo.json`, `fotos/`, `respaldos/`) |

## Publicar en Vercel (una sola vez)

1. **Importar el proyecto:** en vercel.com → *Add New… → Project* → elegir el repositorio `voltika-tienda` → *Deploy*. No hace falta cambiar ninguna opción.
2. **Crear el almacenamiento:** en el proyecto → *Storage* → *Create* → **Blob** → conectarlo al proyecto (acceso público). Vercel agrega solo la variable `BLOB_READ_WRITE_TOKEN`.
3. **Cargar los usuarios:** en el proyecto → *Settings → Environment Variables*, agregar:

   | Variable | Valor |
   |---|---|
   | `ADMIN_USUARIO_1` | usuario de Laura (ej.: `laura`) |
   | `ADMIN_CLAVE_1` | contraseña de Laura |
   | `ADMIN_USUARIO_2` | usuario de la socia |
   | `ADMIN_CLAVE_2` | contraseña de la socia |
   | `SESSION_SECRET` | texto largo al azar (mínimo 24 caracteres) |

   Se pueden sumar hasta 5 usuarios (`ADMIN_USUARIO_3`, `ADMIN_CLAVE_3`, …).
4. **Volver a publicar:** *Deployments* → en el último, menú **⋯ → Redeploy**. Las variables nuevas recién se aplican después de esto.

## Uso diario

- Entrar a `/admin` con usuario y contraseña.
- Cambiar precios, textos, fotos, orden o visibilidad y tocar **Guardar y publicar**. La tienda se actualiza en menos de un minuto.
- Si las dos personas editan a la vez, la segunda en guardar recibe un aviso para recargar y no pisa los cambios de la otra.
- Cada guardado deja una copia en `respaldos/` dentro del Blob.

## Cambiar o quitar una contraseña

Editar la variable en *Settings → Environment Variables* y hacer **Redeploy**. Si se borra un usuario, su sesión abierta deja de valer.

## Dominio propio

En el proyecto → *Settings → Domains* se puede agregar, por ejemplo, `voltika.com.ar` (se compra en NIC Argentina y se apuntan los DNS a Vercel).
