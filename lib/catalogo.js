// Catálogo inicial y validación de lo que guarda el panel de administración.

export const CATALOGO_INICIAL = {
  config: { whatsapp: "5492901417703", telefono: "(2901) 41-7703", alias: "VOLTIKA.3D", envio: 3000 },
  productos: [
    { id: "cubo", sec: "3d", cat: "antiestres", nombre: "Cubo infinito", sub: "Antiestrés. Se pliega sin fin.", precio: 8500, art: "cube", badge: "Más vendido", img: "", visible: true },
    { id: "huevo", sec: "3d", cat: "antiestres", nombre: "Huevo de dragón", sub: "Antiestrés articulado, escamas móviles.", precio: 9500, art: "egg", badge: "", img: "", visible: true },
    { id: "tela", sec: "3d", cat: "antiestres", nombre: "Telaraña", sub: "Sensorial. Ideal para manos inquietas.", precio: 7500, art: "web", badge: "", img: "", visible: true },
    { id: "scel", sec: "3d", cat: "soportes", nombre: "Soporte celular", sub: "Escritorio o mesa de luz.", precio: 6500, art: "phone", badge: "", img: "", visible: true },
    { id: "santeo", sec: "3d", cat: "soportes", nombre: "Soporte anteojos", sub: "Para que siempre estén a mano.", precio: 7000, art: "glasses", badge: "", img: "", visible: true },
    { id: "kit", sec: "3d", cat: "kits", nombre: "Kit de armado", sub: "Piezas para armar en casa.", precio: 12000, art: "kit", badge: "", img: "", visible: true },
    { id: "cuspide", sec: "lum", cat: "lamparas", nombre: "Modelo Cúspide", sub: "Moderna, única, hecha para tu espacio.", precio: 38000, art: "l1", badge: "", img: "", visible: true },
    { id: "aura", sec: "lum", cat: "lamparas", nombre: "Modelo Aura", sub: "Un diseño que vibra con vos.", precio: 42000, art: "l2", badge: "", img: "", visible: true },
    { id: "aqua", sec: "lum", cat: "lamparas", nombre: "Modelo Aqua", sub: "Formas que inspiran calma.", precio: 40000, art: "l3", badge: "", img: "", visible: true },
    { id: "coral", sec: "lum", cat: "lamparas", nombre: "Modelo Coral", sub: "Elegancia hecha movimiento.", precio: 45000, art: "l4", badge: "", img: "", visible: true }
  ]
};

const SECS = ["3d", "lum", "hogar"];
const CATS = ["antiestres", "soportes", "kits", "deco", "otros", "lamparas", "cocina", "bano", "organizacion"];
const ARTS = ["cube", "egg", "web", "phone", "glasses", "kit", "box", "l1", "l2", "l3", "l4", ""];

const txt = (v, max) => String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const num = v => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 ? Math.min(n, 100000000) : 0; };

// Solo se aceptan fotos guardadas en el almacenamiento de Vercel Blob.
export const videoValido = u => typeof u === "string" && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/videos\/[A-Za-z0-9._-]+$/.test(u);
export const fotoValida = u => typeof u === "string" && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/fotos\/[A-Za-z0-9._-]+$/.test(u);

export function validarCatalogo(data) {
  if (!data || typeof data !== "object") throw new Error("Catálogo vacío.");
  const c = data.config || {};
  const config = {
    whatsapp: txt(c.whatsapp, 20).replace(/\D/g, ""),
    telefono: txt(c.telefono, 30),
    alias: txt(c.alias, 40),
    envio: num(c.envio),
    textos: (() => {
      const t = c.textos || {}, out = {};
      for (const sec of ["inicio", "tienda3d", "luminarias", "hogar", "servicios"]) {
        const s = t[sec] || {};
        const v = { etiqueta: txt(s.etiqueta, 40), titulo: txt(s.titulo, 60), destacado: txt(s.destacado, 60), texto: txt(s.texto, 240) };
        if (Object.values(v).some(Boolean)) out[sec] = v;
      }
      return out;
    })(),
    promo: (() => {
      const p = c.promo || {};
      return {
        activa: p.activa === true,
        etiqueta: txt(p.etiqueta, 40),
        titulo: txt(p.titulo, 70),
        texto: txt(p.texto, 220),
        boton: txt(p.boton, 30),
        mensaje: txt(p.mensaje, 160),
        video: videoValido(p.video) ? p.video : "",
        imagen: fotoValida(p.imagen) ? p.imagen : ""
      };
    })()
  };
  if (config.whatsapp.length < 10) throw new Error("El WhatsApp tiene que incluir 549 y el código de área.");
  if (!Array.isArray(data.productos)) throw new Error("Falta la lista de productos.");
  if (data.productos.length > 300) throw new Error("Máximo 300 productos.");
  const ids = new Set();
  const productos = data.productos.map((p, i) => {
    let id = txt(p.id, 40).replace(/[^A-Za-z0-9_-]/g, "") || "p" + i;
    while (ids.has(id)) id += "x";
    ids.add(id);
    const sec = SECS.includes(p.sec) ? p.sec : "3d";
    return {
      id, sec,
      cat: CATS.includes(p.cat) ? p.cat : (sec === "lum" ? "lamparas" : "otros"),
      nombre: txt(p.nombre, 60) || "Producto",
      sub: txt(p.sub, 120),
      precio: num(p.precio),
      art: ARTS.includes(p.art) ? p.art : "",
      badge: txt(p.badge, 22),
      img: fotoValida(p.img) ? p.img : "",
      visible: p.visible !== false,
      colores: (Array.isArray(p.colores) ? p.colores : []).slice(0, 20)
        .map(c => ({ c: String(c && c.c || "").toLowerCase(), n: txt(c && c.n, 24) }))
        .filter(c => /^#[0-9a-f]{6}$/.test(c.c))
    };
  });
  const sinPrecio = productos.find(p => p.visible && !p.precio);
  if (sinPrecio) throw new Error(`"${sinPrecio.nombre}" está visible con precio $ 0. Cargá el precio u ocultalo.`);
  return { config, productos };
}
