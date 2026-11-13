// Utilidades compartidas por la tienda y el panel.
(function () {
  const W = "#eef1f2", S = "#b9c1c5";
  const ART = {
    cube: `<svg viewBox="0 0 100 100"><g stroke="${S}" stroke-width="1.5"><polygon points="50,12 86,30 50,48 14,30" fill="#fff"/><polygon points="14,30 50,48 50,88 14,70" fill="${W}"/><polygon points="86,30 50,48 50,88 86,70" fill="#dde2e4"/><path d="M32 21 68 39M68 21 32 39M32 39v40M68 39v40M14 50l36 18 36-18" fill="none"/></g></svg>`,
    egg: `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="54" rx="30" ry="38" fill="${W}" stroke="${S}" stroke-width="1.5"/><g fill="none" stroke="${S}" stroke-width="1.5"><path d="M22 42q14 8 28 0t28 0M21 58q15 8 29 0t29 0M24 74q13 7 26 0t26 0"/><path d="M36 30q14 6 28 0"/></g></svg>`,
    web: `<svg viewBox="0 0 100 100"><g fill="none" stroke="#fff" stroke-width="3"><circle cx="50" cy="50" r="36"/><circle cx="50" cy="50" r="24"/><circle cx="50" cy="50" r="12"/><path d="M50 14v72M14 50h72M24.5 24.5l51 51M75.5 24.5l-51 51"/></g></svg>`,
    phone: `<svg viewBox="0 0 100 100"><path d="M18 84h64l-10-10H40z" fill="${W}" stroke="${S}" stroke-width="1.5"/><rect x="36" y="14" width="34" height="58" rx="5" transform="rotate(-10 53 43)" fill="#2a3135"/><rect x="40" y="19" width="26" height="46" rx="2" transform="rotate(-10 53 43)" fill="#5fbf2a" opacity=".85"/></svg>`,
    glasses: `<svg viewBox="0 0 100 100"><path d="M50 18c-9 0-16 8-16 18 0 14 16 26 16 26s16-12 16-26c0-10-7-18-16-18z" fill="${W}" stroke="${S}" stroke-width="1.5"/><path d="M34 86h32l-6-24H40z" fill="${W}" stroke="${S}" stroke-width="1.5"/><g fill="none" stroke="#161b1d" stroke-width="3"><circle cx="34" cy="48" r="9"/><circle cx="66" cy="48" r="9"/><path d="M43 47q7-4 14 0"/></g></svg>`,
    kit: `<svg viewBox="0 0 100 100"><rect x="14" y="20" width="72" height="60" rx="4" fill="${W}" stroke="${S}" stroke-width="1.5"/><g fill="#fff" stroke="${S}" stroke-width="1.5"><rect x="22" y="28" width="22" height="14" rx="2"/><circle cx="64" cy="35" r="8"/><rect x="22" y="50" width="12" height="22" rx="2"/><path d="M42 72l10-20 10 20z"/><rect x="68" y="50" width="10" height="22" rx="2"/></g></svg>`,
    box: `<svg viewBox="0 0 100 100"><g stroke="${S}" stroke-width="1.5"><polygon points="50,18 82,32 50,46 18,32" fill="#fff"/><polygon points="18,32 50,46 50,84 18,70" fill="${W}"/><polygon points="82,32 50,46 50,84 82,70" fill="#dde2e4"/></g><path d="M56 52l10-4-6 12 8-3-14 18 4-13-7 3z" fill="#5fbf2a"/></svg>`,
    l1: `<svg viewBox="0 0 100 100"><path d="M50 10 76 74H24z" fill="#fff4dc"/><path d="M50 10 62 74M50 10 38 74" stroke="#e8c58a" stroke-width="1.5"/><path d="M40 74l-8 18M60 74l8 18M50 74v18" stroke="#c7a87a" stroke-width="3"/></svg>`,
    l2: `<svg viewBox="0 0 100 100"><g fill="none" stroke="#e8c58a" stroke-width="1.6"><path d="M28 30q22-16 44 0M24 44q26-16 52 0M24 58q26-16 52 0M28 72q22-16 44 0"/></g><path d="M28 30q-8 22 0 42h44q8-20 0-42q-22-16-44 0z" fill="#fff4dc" opacity=".9"/><path d="M38 72l-6 20M62 72l6 20" stroke="#c7a87a" stroke-width="3"/></svg>`,
    l3: `<svg viewBox="0 0 100 100"><path d="M30 20q20-8 40 0q14 24 0 52q-20 8-40 0q-14-28 0-52z" fill="#fff4dc"/><g fill="none" stroke="#e8c58a" stroke-width="1.6"><path d="M34 22q-10 26 2 50M46 18q-6 30 2 56M58 18q8 28 0 56M68 22q10 24-2 50"/></g><rect x="40" y="76" width="20" height="14" rx="3" fill="#c7a87a"/></svg>`,
    l4: `<svg viewBox="0 0 100 100"><path d="M50 12q24 10 24 38t-24 38q-24-10-24-38t24-38z" fill="#fff4dc"/><g fill="none" stroke="#e8c58a" stroke-width="1.6"><path d="M30 28q20 10 40-6M27 44q24 12 47-6M27 60q24 12 47-6M31 76q20 10 38-4"/></g></svg>`
  };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fotoOk = u => typeof u === "string" && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(u);
  window.VK = {
    ART, esc, fotoOk,
    CATS: { antiestres: "Antiestrés y sensoriales", soportes: "Soportes", kits: "Kits", deco: "Decoración", otros: "Otros", lamparas: "Lámparas", cocina: "Cocina", bano: "Baño", organizacion: "Organización" },
    SECS: { "3d": "Tienda 3D", lum: "Luminarias", hogar: "Accesorios para el hogar" },
    TEXTOS_INICIALES: {"inicio": {"nombre": "Portada", "etiqueta": "Ushuaia · Tierra del Fuego", "titulo": "Tu proyecto,", "destacado": "en buenas manos.", "texto": "Soluciones técnicas para espacios más seguros, funcionales y eficientes. Y objetos impresos en 3D, diseñados y fabricados acá."}, "tienda3d": {"nombre": "Didácticos · Antiestrés · Sensoriales (Tienda 3D)", "etiqueta": "Voltika 3D", "titulo": "Lo que imaginás", "destacado": "ahora es posible.", "texto": "Antiestrés, sensoriales y soportes útiles. Impresos a pedido, con terminación prolija."}, "luminarias": {"nombre": "Iluminación (Luminarias)", "etiqueta": "Voltika Luminarias", "titulo": "¿Y si tu casa", "destacado": "brillara distinto?", "texto": "Electricidad que se convierte en diseño. Lámparas decorativas, apliques y pantallas fabricadas en impresión 3D."}, "hogar": {"nombre": "Deco · Hogar (Accesorios para el hogar)", "etiqueta": "Voltika Hogar", "titulo": "Accesorios", "destacado": "para el hogar.", "texto": "Piezas útiles para la cocina, el baño y el orden de todos los días. Diseñadas e impresas en 3D."}, "servicios": {"nombre": "Servicios eléctricos", "etiqueta": "Electricista matriculado", "titulo": "Servicios", "destacado": "eléctricos", "texto": "Domiciliarios y comerciales. Pedí presupuesto sin compromiso y coordinamos una visita."}},
    PROMO_INICIAL: { activa: true, etiqueta: "", titulo: "Promo BBVA", texto: "Martes y viernes, 30% de devolución con las tarjetas del banco BBVA.", boton: "", mensaje: "", video: "", imagen: "" },
    CATS_SEC: { "3d": ["antiestres", "soportes", "kits", "deco", "otros"], lum: ["lamparas", "deco", "otros"], hogar: ["cocina", "bano", "organizacion", "deco", "otros"] },
    money: n => "$ " + (Number(n) || 0).toLocaleString("es-AR"),
    visual: p => fotoOk(p.img) ? `<img src="${esc(p.img)}" alt="${esc(p.nombre)}" loading="lazy">` : (ART[p.art] || (p.sec === "lum" ? ART.l1 : ART.box)),
    toast(t) {
      const el = document.getElementById("toast"); if (!el) return;
      el.textContent = t; el.hidden = false; clearTimeout(el._t); el._t = setTimeout(() => el.hidden = true, 2800);
    }
  };
})();
