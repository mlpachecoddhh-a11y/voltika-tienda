// Panel de administración: login, edición del catálogo, fotos y publicación.
(function () {
  const { esc, visual, fotoOk, CATS, SECS, CATS_SEC, toast } = window.VK;
  const $ = s => document.querySelector(s);
  const H = { "x-voltika": "admin" };

  let DATA = null, draft = null, version = 0, dirty = false, saving = false, sureDel = null, almacenamiento = true;
  const clone = o => JSON.parse(JSON.stringify(o));

  async function api(path, opts = {}) {
    const r = await fetch(path, { credentials: "same-origin", ...opts, headers: { ...H, ...(opts.headers || {}) } });
    let body = {};
    try { body = await r.json(); } catch {}
    if (r.status === 401 && path !== "/api/login") { showLogin("Tu sesión venció. Volvé a ingresar."); }
    return { ok: r.ok, status: r.status, body };
  }

  /* ---------- Login ---------- */
  function showLogin(msg) {
    $("#adminView").hidden = true; $("#loginView").hidden = false;
    const e = $("#lErr"); e.hidden = !msg; e.textContent = msg || "";
    $("#lPass").value = ""; $("#lPass").type = "password"; $("#lUser").focus();
  }
  $("#loginForm").addEventListener("submit", async ev => {
    ev.preventDefault();
    const usuario = $("#lUser").value.trim(), clave = $("#lPass").value;
    if (!usuario || !clave) { showLogin("Completá usuario y contraseña."); return; }
    $("#lBtn").disabled = true; $("#lBtn").textContent = "Ingresando…";
    const r = await api("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ usuario, clave }) });
    $("#lBtn").disabled = false; $("#lBtn").textContent = "Ingresar";
    if (!r.ok) { showLogin(r.body.error || "No se pudo ingresar."); return; }
    start(true);
  });
  $("#lShow").onclick = () => { const i = $("#lPass"), v = i.type === "password"; i.type = v ? "text" : "password"; $("#lShow").setAttribute("aria-label", v ? "Ocultar contraseña" : "Mostrar contraseña"); $("#lShow").textContent = v ? "🙈" : "👁"; };
  $("#aLogout").onclick = async () => {
    if (dirty && !$("#aLogout").dataset.sure) { $("#aLogout").dataset.sure = "1"; toast("Tenés cambios sin publicar. Tocá Salir de nuevo para salir igual."); setTimeout(() => delete $("#aLogout").dataset.sure, 4000); return; }
    await api("/api/logout", { method: "POST" }); dirty = false; showLogin("");
  };
  window.addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  async function start(recienIngreso) {
    const s = await fetch("/api/sesion", { credentials: "same-origin", cache: "no-store", headers: H })
      .then(async r => ({ ok: r.ok, body: await r.json().catch(() => ({})) }))
      .catch(() => ({ ok: false, body: {} }));
    if (!s.ok) {
      showLogin(recienIngreso
        ? "El usuario y la contraseña son correctos, pero este navegador no guardó la sesión. Abrí la página directamente en Chrome (no desde WhatsApp o Instagram) y volvé a ingresar."
        : "");
      return;
    }
    almacenamiento = s.body.almacenamiento;
    $("#who").innerHTML = `Ingresaste como <b>${esc(s.body.usuario)}</b>`;
    $("#loginView").hidden = true; $("#adminView").hidden = false;
    await cargar();
  }
  async function cargar() {
    const r = await fetch("/api/catalogo?fresco=" + Date.now(), { cache: "no-store" });
    if (!r.ok) { $("#aMain").innerHTML = `<div class="a-note">No se pudo cargar el catálogo. Recargá la página.</div>`; return; }
    const d = await r.json();
    version = d.version; DATA = { config: d.config, productos: d.productos };
    draft = clone(DATA); setDirty(false); renderAdmin();
  }

  /* ---------- Estado ---------- */
  function setDirty(v) {
    dirty = v;
    const s = $("#aStatus"); s.textContent = saving ? "Publicando…" : v ? "Cambios sin publicar" : "Sin cambios"; s.classList.toggle("dirty", v);
    $("#aSave").disabled = !v || saving || !almacenamiento; $("#aDiscard").disabled = !v || saving;
  }
  $("#aDiscard").onclick = () => { draft = clone(DATA); sureDel = null; setDirty(false); renderAdmin(); toast("Cambios descartados"); };
  $("#aSave").onclick = publicar;

  /* ---------- Render ---------- */
  function catOptions(p) {
    const keys = CATS_SEC[p.sec] || CATS_SEC["3d"];
    return keys.map(k => `<option value="${k}" ${p.cat === k ? "selected" : ""}>${CATS[k]}</option>`).join("");
  }
  function prodRow(p, i, n) {
    const off = p.visible === false, id = esc(p.id);
    return `<article class="prod${p.sec === "lum" ? " lum" : ""}${off ? " off" : ""}">
      <div class="photo">
        <div class="ph">${visual(p)}${p._busy ? `<span class="busy">Subiendo…</span>` : ""}</div>
        <div style="display:grid;gap:6px">
          <label class="btn ghost small filebtn">${fotoOk(p.img) ? "Cambiar foto" : "Subir foto"}<input type="file" accept="image/png,image/jpeg,image/webp" data-photo="${i}" id="photo-${id}" ${almacenamiento ? "" : "disabled"}></label>
          ${fotoOk(p.img) ? `<button class="linkbtn" type="button" data-nophoto="${i}">Quitar foto</button>` : ""}
        </div>
      </div>
      <div class="fields">
        <label for="n-${id}">Nombre<input id="n-${id}" data-k="nombre" data-i="${i}" value="${esc(p.nombre)}" maxlength="60"></label>
        <label for="p-${id}">Precio ($)<input id="p-${id}" data-k="precio" data-i="${i}" type="number" inputmode="numeric" min="0" step="100" value="${Number(p.precio) || 0}"></label>
        <label class="full" for="s-${id}">Descripción corta<input id="s-${id}" data-k="sub" data-i="${i}" value="${esc(p.sub)}" maxlength="120"></label>
        <label for="sec-${id}">Sección<select id="sec-${id}" data-k="sec" data-i="${i}">${Object.entries(SECS).map(([k, t]) => `<option value="${k}" ${p.sec === k ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label for="c-${id}">Categoría<select id="c-${id}" data-k="cat" data-i="${i}">${catOptions(p)}</select></label>
        <label class="full" for="b-${id}">Etiqueta destacada (opcional)<input id="b-${id}" data-k="badge" data-i="${i}" value="${esc(p.badge)}" maxlength="22" placeholder="Ej.: Nuevo, Más vendido, Oferta"></label>
      </div>
      <div class="prod-actions">
        <label class="toggle" for="v-${id}"><input type="checkbox" id="v-${id}" data-vis="${i}" ${off ? "" : "checked"}> Visible en la tienda</label>
        <button class="icon" type="button" data-move="-1" data-i="${i}" aria-label="Subir" ${i === 0 ? "disabled" : ""}>↑</button>
        <button class="icon" type="button" data-move="1" data-i="${i}" aria-label="Bajar" ${i === n - 1 ? "disabled" : ""}>↓</button>
        <button class="del${sureDel === p.id ? " sure" : ""}" type="button" data-del="${i}">${sureDel === p.id ? "Confirmar eliminación" : "Eliminar"}</button>
      </div>
    </article>`;
  }
  function promoBlock() {
    const p = draft.config.promo || (draft.config.promo = { ...window.VK.PROMO_INICIAL });
    const f = (k, label, max, ph = "", full = false) => `<label${full ? ' class="full"' : ""} for="pr-${k}">${label}<input id="pr-${k}" data-pc="${k}" value="${esc(p[k] || "")}" maxlength="${max}" placeholder="${esc(ph)}"></label>`;
    const media = p.video ? `<video src="${esc(p.video)}" muted playsinline controls preload="metadata" style="width:100%;max-height:200px;background:#000;border-radius:4px"></video>`
      : p.imagen ? `<img src="${esc(p.imagen)}" alt="" style="width:100%;max-height:200px;object-fit:cover;border-radius:4px">`
      : `<div class="a-note" style="margin:0">Sin video ni imagen.</div>`;
    return `<section class="a-sec" style="padding:0">
      <header><div><h3>Banner de promoción</h3><p class="hint">Aparece en Servicios eléctricos. Ideal para promos bancarias, cuotas o lanzamientos.</p></div>
      <label class="toggle" for="pr-activa"><input type="checkbox" id="pr-activa" data-pa ${p.activa ? "checked" : ""}> Mostrar en la tienda</label></header>
      <div class="cfg">
        ${f("etiqueta", "Etiqueta", 40, "Ej.: Promo BBVA")}
        ${f("titulo", "Título", 70, "Ej.: 6 cuotas sin interés")}
        ${f("texto", "Texto", 220, "Condiciones, vigencia, medios de pago…", true)}
        ${f("boton", "Texto del botón", 30, "Ej.: Quiero la promo")}
        ${f("mensaje", "Mensaje de WhatsApp del botón", 160, "Hola Voltika, quiero la promo BBVA")}
        <div class="full" style="display:grid;gap:10px">
          ${media}
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <label class="btn ghost small filebtn">${p.video ? "Cambiar video" : "Subir video"}<input type="file" accept="video/mp4,video/webm,video/quicktime" id="prVideo" ${almacenamiento ? "" : "disabled"}></label>
            <label class="btn ghost small filebtn">${p.imagen ? "Cambiar imagen" : "Subir imagen"}<input type="file" accept="image/png,image/jpeg,image/webp" id="prImg" ${almacenamiento ? "" : "disabled"}></label>
            ${p.video ? `<button class="linkbtn" type="button" data-prq="video">Quitar video</button>` : ""}
            ${p.imagen ? `<button class="linkbtn" type="button" data-prq="imagen">Quitar imagen</button>` : ""}
            <span class="hint" id="prProg"></span>
          </div>
          <p class="hint" style="margin:0">Video MP4 de hasta 60 MB (se reproduce sin sonido y en bucle). La imagen se usa si no hay video, o como portada mientras carga.</p>
        </div>
      </div>
    </section>`;
  }
  async function subirVideo(file) {
    if (!file) return;
    if (file.size > 60 * 1024 * 1024) { toast("El video pesa más de 60 MB. Probá con uno más corto o comprimido."); return; }
    const prog = $("#prProg");
    try {
      const { upload } = await import("/vendor/blob-client.js");
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
      const r = await upload(`videos/promo.${ext}`, file, {
        access: "public", handleUploadUrl: "/api/video", headers: H, contentType: file.type || "video/mp4",
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: e => { if (prog) prog.textContent = `Subiendo… ${Math.round(e.percentage)}%`; }
      });
      draft.config.promo.video = r.url; setDirty(true); renderAdmin(); toast("Video cargado. Publicá para que se vea en la tienda.");
    } catch (e) { console.error(e); if (prog) prog.textContent = ""; toast("No se pudo subir el video. Revisá la conexión o probá con un MP4."); }
  }
  async function subirImagenPromo(file) {
    if (!file) return;
    const prog = $("#prProg"); if (prog) prog.textContent = "Subiendo imagen…";
    try {
      const blob = await achicar(file);
      const r = await api("/api/foto", { method: "POST", headers: { "content-type": blob.type || "image/jpeg" }, body: blob });
      if (!r.ok) { toast(r.body.error || "No se pudo subir la imagen."); if (prog) prog.textContent = ""; return; }
      draft.config.promo.imagen = r.body.url; setDirty(true); renderAdmin(); toast("Imagen cargada. Publicá para que se vea en la tienda.");
    } catch { toast("No se pudo subir la imagen."); if (prog) prog.textContent = ""; }
  }
  function renderAdmin() {
    const c = draft.config, n = draft.productos.length;
    const list = sec => draft.productos.map((p, i) => [p, i]).filter(([p]) => p.sec === sec);
    const block = (sec, title, hint) => {
      const rows = list(sec);
      return `<section class="a-sec" style="padding:0">
        <header><div><h3>${title} · ${rows.length}</h3><p class="hint">${hint}</p></div>
        <button class="btn small" type="button" data-new="${sec}">+ Agregar producto</button></header>
        ${rows.length ? rows.map(([p, i]) => prodRow(p, i, n)).join("") : `<div class="a-note">Todavía no hay productos en esta sección.</div>`}
      </section>`;
    };
    $("#aMain").innerHTML = `
      ${almacenamiento ? "" : `<div class="a-note" style="border-left:5px solid var(--danger)"><strong>Falta conectar el almacenamiento.</strong> En Vercel, entrá al proyecto → Storage → creá un Blob store y conectalo. Hasta entonces no se pueden guardar cambios ni fotos.</div>`}
      <section class="a-sec" style="padding:0">
        <header><div><h3>Datos de venta</h3><p class="hint">Se usan en el carrito y en los botones de WhatsApp.</p></div></header>
        <div class="cfg">
          <label for="cfgWa">WhatsApp de pedidos (con 549)<input id="cfgWa" data-c="whatsapp" inputmode="numeric" value="${esc(c.whatsapp)}" placeholder="5492901417703"></label>
          <label for="cfgTel">Teléfono visible<input id="cfgTel" data-c="telefono" value="${esc(c.telefono)}"></label>
          <label for="cfgAlias">Alias para transferencias<input id="cfgAlias" data-c="alias" value="${esc(c.alias)}"></label>
          <label for="cfgEnvio">Costo de envío en Ushuaia ($)<input id="cfgEnvio" data-c="envio" type="number" min="0" step="100" value="${Number(c.envio) || 0}"></label>
        </div>
      </section>
      ${promoBlock()}
      ${block("3d", "Tienda 3D", "Antiestrés, sensoriales, soportes y kits. Usá las flechas para cambiar el orden en la tienda.")}
      ${block("lum", "Luminarias", "Lámparas y apliques. Se muestran en la banda oscura.")}
      ${block("hogar", "Accesorios para el hogar", "Cocina, baño, organización y decoración.")}
      <div class="a-note">Los cambios se ven en la tienda cuando tocás <strong>Guardar y publicar</strong> (pueden tardar hasta un minuto). Ocultar un producto lo saca de la tienda sin borrarlo.</div>`;
  }

  /* ---------- Edición ---------- */
  $("#aMain").addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.k) { const p = draft.productos[+t.dataset.i]; p[t.dataset.k] = t.dataset.k === "precio" ? Math.max(0, Math.round(Number(t.value) || 0)) : t.value; setDirty(true); }
    else if (t.dataset.pc) { draft.config.promo[t.dataset.pc] = t.value; setDirty(true); }
    else if (t.dataset.c) { draft.config[t.dataset.c] = t.dataset.c === "envio" ? Math.max(0, Math.round(Number(t.value) || 0)) : t.value; setDirty(true); }
  });
  $("#aMain").addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.k === "sec") { const p = draft.productos[+t.dataset.i]; p.cat = p.sec === "lum" ? "lamparas" : "otros"; if (!p.img) p.art = ""; renderAdmin(); }
    if (t.dataset.vis) { draft.productos[+t.dataset.vis].visible = t.checked; setDirty(true); renderAdmin(); }
    if (t.dataset.photo) subirFoto(+t.dataset.photo, t.files && t.files[0]);
    if (t.id === "prVideo") subirVideo(t.files && t.files[0]);
    if (t.id === "prImg") subirImagenPromo(t.files && t.files[0]);
    if (t.hasAttribute("data-pa")) { draft.config.promo.activa = t.checked; setDirty(true); }
  });
  $("#aMain").addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    const P = draft.productos;
    if (t.dataset.new) {
      const sec = t.dataset.new;
      const p = { id: "p" + Date.now().toString(36), sec, cat: sec === "lum" ? "lamparas" : "otros", nombre: "Producto nuevo", sub: "", precio: 0, art: "", badge: "Nuevo", img: "", visible: true };
      const last = P.reduce((a, q, i) => (q.sec === sec ? i : a), P.length - 1);
      P.splice(last + 1, 0, p); setDirty(true); renderAdmin();
      const inp = document.getElementById("n-" + p.id); if (inp) { inp.scrollIntoView({ block: "center" }); inp.select(); }
    }
    if (t.dataset.move) {
      const i = +t.dataset.i, d = +t.dataset.move, sec = P[i].sec;
      let j = i + d; while (j >= 0 && j < P.length && P[j].sec !== sec) j += d;
      if (j < 0 || j >= P.length) return;
      [P[i], P[j]] = [P[j], P[i]]; setDirty(true); renderAdmin();
    }
    if (t.dataset.del) {
      const i = +t.dataset.del;
      if (sureDel === P[i].id) { const name = P[i].nombre; P.splice(i, 1); sureDel = null; setDirty(true); renderAdmin(); toast(`${name} eliminado (se aplica al publicar)`); }
      else { sureDel = P[i].id; renderAdmin(); }
    }
    if (t.dataset.prq) { draft.config.promo[t.dataset.prq] = ""; setDirty(true); renderAdmin(); }
    if (t.dataset.nophoto) { draft.productos[+t.dataset.nophoto].img = ""; setDirty(true); renderAdmin(); }
  });

  /* ---------- Fotos ---------- */
  async function achicar(file) {
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext("2d").drawImage(bmp, 0, 0, cv.width, cv.height);
      return await new Promise(r => cv.toBlob(b => r(b || file), "image/jpeg", 0.85));
    } catch { return file; }
  }
  async function subirFoto(i, file) {
    if (!file) return;
    const p = draft.productos[i];
    p._busy = true; renderAdmin();
    try {
      const blob = await achicar(file);
      if (blob.size > 4 * 1024 * 1024) { toast("La foto es muy pesada. Probá con una más chica."); return; }
      const r = await api("/api/foto", { method: "POST", headers: { "content-type": blob.type || "image/jpeg" }, body: blob });
      if (!r.ok) { toast(r.body.error || "No se pudo subir la foto."); return; }
      p.img = r.body.url; setDirty(true); toast("Foto cargada. Publicá para que se vea en la tienda.");
    } catch { toast("No se pudo subir la foto. Revisá la conexión."); }
    finally { delete p._busy; renderAdmin(); }
  }

  /* ---------- Publicar ---------- */
  async function publicar() {
    if (!dirty || saving) return;
    const productos = draft.productos.map(p => { const q = { ...p }; delete q._busy; return q; });
    saving = true; setDirty(true); $("#aSave").textContent = "Publicando…";
    const r = await api("/api/guardar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ base: version, config: draft.config, productos }) });
    saving = false; $("#aSave").textContent = "Guardar y publicar";
    if (r.ok) {
      version = r.body.version; DATA = r.body.catalogo; draft = clone(DATA); sureDel = null;
      setDirty(false); renderAdmin(); toast("Cambios publicados en la tienda.");
    } else {
      setDirty(true);
      toast(r.body.error || "No se pudo publicar. Probá de nuevo.");
    }
  }

  start();
})();
