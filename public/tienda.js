// Tienda: catálogo desde /api/catalogo, carrito y pedido por WhatsApp.
(function () {
  const { esc, money, visual, CATS, toast } = window.VK;
  const $ = s => document.querySelector(s);

  let DATA = { config: { whatsapp: "5492901417703", telefono: "(2901) 41-7703", alias: "", envio: 0 }, productos: [] };
  const cfg = () => DATA.config;
  const waLink = t => `https://wa.me/${String(cfg().whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(t)}`;
  const live = () => DATA.productos.filter(p => p.visible !== false);
  const byId = () => Object.fromEntries(live().map(p => [p.id, p]));

  /* ---------- Catálogo ---------- */
  let filtro = "todos", filtroH = "todos";
  function renderPromo() {
    const p = (DATA.config || {}).promo || {}, el = $("#promo");
    if (!p.activa || !(p.titulo || p.video || p.imagen)) { el.hidden = true; el.innerHTML = ""; return; }
    const media = p.video
      ? `<div class="p-media"><video src="${esc(p.video)}" ${p.imagen ? `poster="${esc(p.imagen)}"` : ""} autoplay muted loop playsinline controls preload="metadata"></video></div>`
      : p.imagen ? `<div class="p-media"><img src="${esc(p.imagen)}" alt="${esc(p.titulo || "Promoción")}" loading="lazy"></div>` : "";
    el.className = "promo" + (media ? "" : " solo");
    el.innerHTML = media + `<div class="p-txt">
      ${p.etiqueta ? `<span class="p-tag">${esc(p.etiqueta)}</span>` : ""}
      ${p.titulo ? `<h3>${esc(p.titulo)}</h3>` : ""}
      ${p.texto ? `<p>${esc(p.texto)}</p>` : ""}
      ${p.boton ? `<a class="btn lime" target="_blank" rel="noopener" href="${waLink(p.mensaje || ("Hola Voltika, quiero consultar por la promo: " + (p.titulo || "")))}">${esc(p.boton)}</a>` : ""}
    </div>`;
    el.hidden = false;
  }
  function renderCatalog() {
    const items3d = live().filter(p => p.sec === "3d");
    const cats = [...new Set(items3d.map(p => p.cat))].filter(c => CATS[c]);
    if (filtro !== "todos" && !cats.includes(filtro)) filtro = "todos";
    $("#filters").innerHTML = [["todos", "Todos"], ...cats.map(c => [c, CATS[c]])]
      .map(([k, t]) => `<button class="chip" type="button" data-f="${k}" aria-pressed="${k === filtro}">${esc(t)}</button>`).join("");
    $("#filters").hidden = cats.length < 2;
    const card = p => `<article class="card"><div class="pic">${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}${visual(p)}</div>
      <div class="body"><h3>${esc(p.nombre)}</h3>${p.sub ? `<p class="sub">${esc(p.sub)}</p>` : ""}
      <div class="row"><span class="price">${money(p.precio)}</span><button class="add" type="button" data-add="${esc(p.id)}">Agregar</button></div></div></article>`;
    const shown = items3d.filter(p => filtro === "todos" || p.cat === filtro);
    $("#grid3d").innerHTML = shown.length ? shown.map(card).join("") : `<p class="none">Pronto vas a encontrar productos nuevos acá.</p>`;
    const lamps = live().filter(p => p.sec === "lum");
    $("#gridLamps").innerHTML = lamps.length ? lamps.map(card).join("") : `<p class="none" style="color:#aab4b8">Nuevos modelos en camino.</p>`;
    const hogar = live().filter(p => p.sec === "hogar");
    const catsH = [...new Set(hogar.map(p => p.cat))].filter(c => CATS[c]);
    if (filtroH !== "todos" && !catsH.includes(filtroH)) filtroH = "todos";
    $("#filtersHogar").innerHTML = [["todos", "Todos"], ...catsH.map(c => [c, CATS[c]])]
      .map(([k, t]) => `<button class="chip" type="button" data-fh="${k}" aria-pressed="${k === filtroH}">${esc(t)}</button>`).join("");
    $("#filtersHogar").hidden = catsH.length < 2;
    const shownH = hogar.filter(p => filtroH === "todos" || p.cat === filtroH);
    $("#gridHogar").innerHTML = shownH.length ? shownH.map(card).join("") : `<p class="none">Muy pronto: accesorios para cocina, baño y organización.</p>`;
    document.querySelectorAll("[data-wa]").forEach(a => a.href = waLink(a.dataset.wa));
    document.querySelectorAll("[data-phone]").forEach(el => el.textContent = cfg().telefono);
  }
  $("#filtersHogar").addEventListener("click", e => { const c = e.target.closest("[data-fh]"); if (!c) return; filtroH = c.dataset.fh; renderCatalog(); renderPromo(); });
  $("#filters").addEventListener("click", e => { const c = e.target.closest("[data-f]"); if (!c) return; filtro = c.dataset.f; renderCatalog(); renderPromo(); });

  /* ---------- Menú lateral ---------- */
  const menu = $("#menu"), mScrim = $("#menuScrim"), mBtn = $("#openMenu");
  function showPanel(id) {
    $("#mMain").hidden = id !== "mMain"; $("#mProducts").hidden = id !== "mProducts";
    const f = $("#" + id).querySelector("a,button"); if (f) f.focus();
  }
  function openMenu() {
    menu.classList.add("open"); menu.setAttribute("aria-hidden", "false"); mScrim.hidden = false;
    mBtn.setAttribute("aria-expanded", "true"); document.body.classList.add("no-scroll"); showPanel("mMain");
  }
  function closeMenu() {
    if (!menu.classList.contains("open")) return;
    menu.classList.remove("open"); menu.setAttribute("aria-hidden", "true"); mScrim.hidden = true;
    mBtn.setAttribute("aria-expanded", "false"); document.body.classList.remove("no-scroll"); mBtn.focus();
  }
  mBtn.onclick = openMenu; mScrim.onclick = closeMenu; $("#closeMenu").onclick = closeMenu;
  $("#toProducts").onclick = () => showPanel("mProducts");
  $("#backMain").onclick = () => showPanel("mMain");
  menu.addEventListener("click", e => {
    if (e.target.closest("[data-close]")) return closeMenu();
    const a = e.target.closest("[data-go]"); if (!a) return;
    if (a.dataset.f) { filtro = a.dataset.f; renderCatalog(); }
    if (a.dataset.fh) { filtroH = a.dataset.fh; renderCatalog(); }
    menu.classList.remove("open"); menu.setAttribute("aria-hidden", "true"); mScrim.hidden = true;
    mBtn.setAttribute("aria-expanded", "false"); document.body.classList.remove("no-scroll");
  });
  document.querySelectorAll("[data-wa]").forEach(a => a.href = waLink(a.dataset.wa));

  /* ---------- Carrito ---------- */
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem("voltika-cart") || "{}") || {}; } catch { cart = {}; }
  const save = () => { try { localStorage.setItem("voltika-cart", JSON.stringify(cart)); } catch {} };
  const cleanCart = () => { const ids = byId(); for (const k in cart) if (!ids[k]) delete cart[k]; save(); };
  const count = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = () => { const ids = byId(); return Object.entries(cart).reduce((a, [id, q]) => a + (Number(ids[id].precio) || 0) * q, 0); };
  const refreshCount = () => { $("#cartCount").textContent = count(); };

  document.addEventListener("click", e => {
    const b = e.target.closest("[data-add]"); if (!b) return;
    const id = b.dataset.add; cart[id] = (cart[id] || 0) + 1; save(); refreshCount();
    b.textContent = "✓ Agregado"; b.classList.add("done");
    setTimeout(() => { b.textContent = "Agregar"; b.classList.remove("done"); }, 1200);
    toast(`${byId()[id].nombre} agregado al carrito`);
  });

  let step = 1, pedido = null;
  const datos = { nombre: "", tel: "", entrega: "retiro", direccion: "", pago: "transferencia", nota: "" };
  function openCart() { $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden", "false"); $("#scrim").hidden = false; if (step === 4) step = 1; render(); $("#closeCart").focus(); }
  function closeCart() { $("#drawer").classList.remove("open"); $("#drawer").setAttribute("aria-hidden", "true"); $("#scrim").hidden = true; }
  $("#openCart").onclick = openCart; $("#closeCart").onclick = closeCart; $("#scrim").onclick = closeCart;
  document.addEventListener("keydown", e => { if (e.key === "Escape") { closeCart(); closeMenu(); } });

  const envio = () => datos.entrega === "envio" ? (Number(cfg().envio) || 0) : 0;
  const PAGOS = () => ({
    transferencia: ["Transferencia bancaria", cfg().alias ? `Alias: ${cfg().alias}. Enviás el comprobante por WhatsApp.` : "Te pasamos los datos por WhatsApp."],
    mercadopago: ["Mercado Pago", "Te enviamos el link de pago por WhatsApp."],
    efectivo: ["Efectivo", "Al retirar o al recibir el pedido."]
  });
  const setSteps = () => document.querySelectorAll(".steps span").forEach(s => s.classList.toggle("on", +s.dataset.s === Math.min(step, 3)));
  const thumb = p => `<div class="thumb${p.sec === "lum" ? " lum" : ""}">${visual(p)}</div>`;

  function render() {
    setSteps();
    const body = $("#dBody"), foot = $("#dFoot"), ids = byId();
    if (step === 1) {
      $("#dTitle").textContent = "Tu carrito";
      if (!count()) {
        body.innerHTML = `<div class="empty"><strong>Tu carrito está vacío</strong>Elegí productos de la Tienda 3D o de Luminarias y aparecen acá.</div>`;
        foot.innerHTML = `<button class="btn" type="button" id="goShop">Ver productos</button>`;
        $("#goShop").onclick = () => { closeCart(); location.hash = "tienda3d"; };
        return;
      }
      body.innerHTML = Object.entries(cart).map(([id, q]) => { const p = ids[id]; return `
        <div class="line">${thumb(p)}
          <div><h4>${esc(p.nombre)}</h4><small>${money(p.precio)} c/u</small>
            <div class="qty"><button type="button" data-q="-1" data-id="${esc(id)}" aria-label="Quitar uno">−</button><output>${q}</output><button type="button" data-q="1" data-id="${esc(id)}" aria-label="Agregar uno">+</button><button class="rm" type="button" data-rm="${esc(id)}">Quitar</button></div></div>
          <strong class="price">${money(p.precio * q)}</strong></div>`; }).join("");
      foot.innerHTML = `<div class="sum total"><span>Subtotal</span><span>${money(subtotal())}</span></div>
        <button class="btn lime" type="button" id="next1" style="justify-content:center">Continuar con mis datos</button>`;
      $("#next1").onclick = () => { step = 2; render(); };
    }
    if (step === 2) {
      $("#dTitle").textContent = "Tus datos";
      body.innerHTML = `<form id="f" novalidate>
        <label for="fNombre">Nombre y apellido<input id="fNombre" autocomplete="name" value="${esc(datos.nombre)}" required></label>
        <label for="fTel">Teléfono / WhatsApp<input id="fTel" type="tel" autocomplete="tel" placeholder="2901 …" value="${esc(datos.tel)}" required></label>
        <fieldset><legend>Entrega</legend>
          <label class="opt"><input type="radio" name="ent" value="retiro" ${datos.entrega === "retiro" ? "checked" : ""}><span>Retiro en Ushuaia<small>Coordinamos día y lugar.</small></span></label>
          <label class="opt"><input type="radio" name="ent" value="envio" ${datos.entrega === "envio" ? "checked" : ""}><span>Envío a domicilio (Ushuaia) · ${money(cfg().envio)}<small>Otras localidades: consultá costo.</small></span></label>
        </fieldset>
        <label for="fDir" id="dirWrap" ${datos.entrega === "envio" ? "" : "hidden"}>Dirección de entrega<input id="fDir" autocomplete="street-address" value="${esc(datos.direccion)}"></label>
        <fieldset><legend>Forma de pago</legend>
          ${Object.entries(PAGOS()).map(([k, [t, d]]) => `<label class="opt"><input type="radio" name="pago" value="${k}" ${datos.pago === k ? "checked" : ""}><span>${t}<small>${esc(d)}</small></span></label>`).join("")}
        </fieldset>
        <label for="fNota">Comentarios (color, medida, horario)<textarea id="fNota" rows="2">${esc(datos.nota)}</textarea></label>
        <div class="err" id="fErr" hidden></div>
      </form>`;
      const f = $("#f");
      f.addEventListener("change", e => { if (e.target.name === "ent") { datos.entrega = e.target.value; $("#dirWrap").hidden = datos.entrega !== "envio"; } if (e.target.name === "pago") datos.pago = e.target.value; });
      f.addEventListener("submit", e => { e.preventDefault(); toStep3(); });
      foot.innerHTML = `<div class="sum"><span>Subtotal</span><span>${money(subtotal())}</span></div>
        <div style="display:flex;gap:10px"><button class="btn ghost" type="button" id="back2">Volver</button><button class="btn lime" type="button" id="next2" style="flex:1;justify-content:center">Revisar pedido</button></div>`;
      $("#back2").onclick = () => { grab(); step = 1; render(); };
      $("#next2").onclick = toStep3;
    }
    if (step === 3) {
      $("#dTitle").textContent = "Confirmar pedido";
      const [pt, pd] = PAGOS()[datos.pago];
      body.innerHTML = `<div class="summary">
        <h4>Productos</h4>
        ${Object.entries(cart).map(([id, q]) => `<div class="sum"><span>${q} × ${esc(ids[id].nombre)}</span><span>${money(ids[id].precio * q)}</span></div>`).join("")}
        <div class="sum"><span>Envío</span><span>${envio() ? money(envio()) : "Sin cargo (retiro)"}</span></div>
        <div class="sum total"><span>Total</span><span>${money(subtotal() + envio())}</span></div>
        <h4>Entrega</h4><div>${datos.entrega === "envio" ? "Envío a " + esc(datos.direccion) : "Retiro en Ushuaia"}</div>
        <h4>Pago</h4><div>${pt}. ${esc(pd)}</div>
        <h4>Contacto</h4><div>${esc(datos.nombre)} · ${esc(datos.tel)}</div>
        ${datos.nota ? `<h4>Comentarios</h4><div>${esc(datos.nota)}</div>` : ""}
      </div>`;
      foot.innerHTML = `<div style="display:flex;gap:10px"><button class="btn ghost" type="button" id="back3">Editar</button><button class="btn lime" type="button" id="confirm" style="flex:1;justify-content:center">Confirmar pedido</button></div>`;
      $("#back3").onclick = () => { step = 2; render(); };
      $("#confirm").onclick = confirmar;
    }
    if (step === 4) {
      $("#dTitle").textContent = "¡Pedido listo!";
      body.innerHTML = `<div class="ok">
        <span class="tag">Número de pedido</span><div class="code">${pedido.code}</div>
        <p>Último paso: enviá el pedido por WhatsApp. Te respondemos con la confirmación y los datos para pagar.</p>
        <a class="btn lime" href="${waLink(pedido.msg)}" target="_blank" rel="noopener">Enviar pedido por WhatsApp</a>
        <p style="font-size:.85rem;color:var(--muted)">Si el botón no abre WhatsApp, copiá el mensaje y mandalo al <strong style="user-select:all">${esc(cfg().telefono)}</strong>.</p>
        <div class="msg" id="msgTxt">${esc(pedido.msg)}</div>
        <button class="btn ghost" type="button" id="copyMsg">Copiar mensaje</button>
      </div>`;
      foot.innerHTML = `<button class="btn ghost" type="button" id="newOrder" style="justify-content:center">Hacer otro pedido</button>`;
      $("#copyMsg").onclick = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pedido.msg).then(() => toast("Mensaje copiado"), selMsg); else selMsg();
      };
      $("#newOrder").onclick = () => { step = 1; closeCart(); };
    }
  }
  function selMsg() { const r = document.createRange(); r.selectNodeContents($("#msgTxt")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Mensaje seleccionado: copialo"); }

  document.addEventListener("click", e => {
    const q = e.target.closest("[data-q]"), r = e.target.closest("[data-rm]");
    if (q) { const id = q.dataset.id; cart[id] = Math.max(0, cart[id] + (+q.dataset.q)); if (!cart[id]) delete cart[id]; }
    else if (r) { delete cart[r.dataset.rm]; }
    else return;
    save(); refreshCount(); render();
  });
  function grab() {
    if (!$("#fNombre")) return;
    datos.nombre = $("#fNombre").value.trim(); datos.tel = $("#fTel").value.trim();
    datos.direccion = $("#fDir").value.trim(); datos.nota = $("#fNota").value.trim();
  }
  function toStep3() {
    grab();
    const err = [];
    if (!datos.nombre) err.push("tu nombre");
    if (datos.tel.replace(/\D/g, "").length < 6) err.push("un teléfono válido");
    if (datos.entrega === "envio" && !datos.direccion) err.push("la dirección de entrega");
    if (err.length) { const el = $("#fErr"); el.textContent = "Completá " + err.join(", ") + " para seguir."; el.hidden = false; return; }
    step = 3; render();
  }
  function confirmar() {
    const ids = byId();
    const code = "VK-" + Date.now().toString(36).slice(-5).toUpperCase();
    const lines = Object.entries(cart).map(([id, q]) => `• ${q} × ${ids[id].nombre} — ${money(ids[id].precio * q)}`);
    const msg = [
      `¡Hola Voltika! Quiero confirmar mi pedido ${code}:`, "", ...lines,
      envio() ? `• Envío Ushuaia — ${money(envio())}` : "• Retiro en Ushuaia",
      `TOTAL: ${money(subtotal() + envio())}`, "",
      `Nombre: ${datos.nombre}`, `Teléfono: ${datos.tel}`,
      datos.entrega === "envio" ? `Dirección: ${datos.direccion}` : null,
      `Pago: ${PAGOS()[datos.pago][0]}`,
      datos.nota ? `Comentarios: ${datos.nota}` : null
    ].filter(x => x !== null).join("\n");
    pedido = { code, msg };
    cart = {}; save(); refreshCount();
    step = 4; render();
  }

  /* ---------- Carga ---------- */
  refreshCount();
  fetch("/api/catalogo").then(r => r.ok ? r.json() : Promise.reject())
    .then(d => { DATA = { config: { ...DATA.config, ...d.config }, productos: d.productos || [] }; cleanCart(); refreshCount(); renderCatalog(); renderPromo(); })
    .catch(() => {
      $("#grid3d").innerHTML = `<p class="none">No pudimos cargar los productos. Probá recargar la página o escribinos por WhatsApp.</p>`;
      $("#gridLamps").innerHTML = "";
    });
})();
