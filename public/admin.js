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
      ${block("3d", "Tienda 3D", "Antiestrés, sensoriales, soportes y kits. Usá las flechas para cambiar el orden en la tienda.")}
      ${block("lum", "Luminarias", "Lámparas y apliques. Se muestran en la banda oscura.")}
      ${block("hogar", "Accesorios para el hogar", "Cocina, baño, organización y decoración.")}
      <div class="a-note">Los cambios se ven en la tienda cuando tocás <strong>Guardar y publicar</strong> (pueden tardar hasta un minuto). Ocultar un producto lo saca de la tienda sin borrarlo.</div>`;
  }

  /* ---------- Edición ---------- */
  $("#aMain").addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.k) { const p = draft.productos[+t.dataset.i]; p[t.dataset.k] = t.dataset.k === "precio" ? Math.max(0, Math.round(Number(t.value) || 0)) : t.value; setDirty(true); }
    else if (t.dataset.c) { draft.config[t.dataset.c] = t.dataset.c === "envio" ? Math.max(0, Math.round(Number(t.value) || 0)) : t.value; setDirty(true); }
  });
  $("#aMain").addEventListener("change", e => {
    const t = e.target;
    if (t.dataset.k === "sec") { const p = draft.productos[+t.dataset.i]; p.cat = p.sec === "lum" ? "lamparas" : "otros"; if (!p.img) p.art = ""; renderAdmin(); }
    if (t.dataset.vis) { draft.productos[+t.dataset.vis].visible = t.checked; setDirty(true); renderAdmin(); }
    if (t.dataset.photo) subirFoto(+t.dataset.photo, t.files && t.files[0]);
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
