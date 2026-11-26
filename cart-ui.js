/* ==========================================================
   cart-ui.js – Keranjang pesanan Zemil.in
   ========================================================== */
(function () {
  "use strict";

  const cfg = Object.assign({
    whatsapp: "6281389900332",
    store: "Zemil.in",
    openButton: null,
    badge: null,
    menuHref: "#menu",
    accent: "#FF6B35",
    ink: "#2A1A10",
    storageKey: "zemil-cart-v1"
  }, window.ZEMIL_CART_CONFIG || {});

  let items = [];
  try { items = JSON.parse(localStorage.getItem(cfg.storageKey)) || []; } catch (e) { items = []; }
  const listeners = [];
  let lastFocus = null;

  const rp = (n) => "Rp" + Number(n).toLocaleString("id-ID");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const css = `
  .zc-root{--a:${cfg.accent};--ink:${cfg.ink};--soft:#FFF4E8;--line:#F1E3D3;position:fixed;inset:0;z-index:9999;visibility:hidden;transition:visibility 0s .3s;font-family:inherit;color:var(--ink)}
  .zc-root.zc-open{visibility:visible;transition-delay:0s}
  .zc-backdrop{position:absolute;inset:0;background:rgba(30,15,5,.5);opacity:0;transition:opacity .3s}
  .zc-open .zc-backdrop{opacity:1}
  .zc-panel{position:absolute;top:0;right:0;bottom:0;width:min(440px,100%);background:#fff;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .3s ease;box-shadow:-12px 0 40px rgba(0,0,0,.2);outline:none}
  .zc-open .zc-panel{transform:none}
  .zc-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--line)}
  .zc-head h2{font-size:1.3rem;margin:0}
  .zc-x{width:42px;height:42px;border-radius:50%;border:1px solid var(--line);background:#fff;cursor:pointer;font-size:1rem;color:var(--ink)}
  .zc-body{flex:1;overflow-y:auto;padding:16px 20px}
  .zc-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
  .zc-item{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;padding:10px;border:1px solid var(--line);border-radius:16px;background:#fff}
  .zc-thumb{width:56px;height:56px;border-radius:14px;background:var(--soft);display:grid;place-items:center;font-size:1.8rem;overflow:hidden}.zc-thumb img{display:block;width:100%;height:100%;object-fit:contain;object-position:center}
  .zc-name{font-weight:800;line-height:1.2}.zc-price{font-size:.85rem;opacity:.7;margin-top:2px}
  .zc-qty{display:flex;align-items:center;gap:6px}.zc-qty button{width:32px;height:32px;border-radius:50%;border:1px solid var(--line);background:var(--soft);font-weight:800;font-size:1.05rem;cursor:pointer;color:var(--ink)}
  .zc-qty b{min-width:22px;text-align:center}.zc-del{grid-column:1/-1;justify-self:end;background:none;border:0;color:#B3341A;font-weight:700;font-size:.82rem;cursor:pointer;padding:0;margin-top:-4px}
  .zc-empty{text-align:center;padding:36px 8px}.zc-empty .big{font-size:3rem}.zc-empty p{margin:8px 0 16px;opacity:.75}
  .zc-link{display:inline-block;background:var(--a);color:#fff;text-decoration:none;font-weight:800;padding:11px 22px;border-radius:999px}
  .zc-form{margin-top:18px;display:grid;gap:6px}.zc-form label{font-weight:800;font-size:.9rem;margin-top:6px}
  .zc-form input,.zc-form textarea{width:100%;font:inherit;color:var(--ink);padding:11px 13px;border:1px solid var(--line);border-radius:12px;background:#fff;resize:vertical}
  .zc-form input:focus,.zc-form textarea:focus{outline:2px solid var(--a);border-color:transparent}.zc-err{color:#B3341A;font-weight:700;font-size:.88rem;min-height:1.2em;margin-top:6px}
  .zc-foot{padding:16px 20px calc(16px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line);background:#fff}
  .zc-sum{display:flex;justify-content:space-between;margin-bottom:6px}.zc-sum b{font-size:1.05rem}.zc-note{font-size:.8rem;opacity:.65;margin:2px 0 10px}
  .zc-send{width:100%;border:0;border-radius:999px;background:var(--a);color:#fff;font:800 1rem inherit;padding:14px;cursor:pointer;box-shadow:0 8px 18px -6px var(--a)}
  .zc-send:disabled{opacity:.45;cursor:not-allowed;box-shadow:none}.zc-clear{display:block;margin:10px auto 0;background:none;border:0;text-decoration:underline;font:700 .85rem inherit;color:var(--ink);opacity:.7;cursor:pointer}
  .zc-root :focus-visible{outline:3px solid var(--ink);outline-offset:2px}
  @media (max-width:640px){.zc-panel{top:auto;left:0;width:100%;max-height:92vh;max-height:92dvh;border-radius:24px 24px 0 0;transform:translateY(100%);box-shadow:0 -12px 40px rgba(0,0,0,.25)}.zc-open .zc-panel{transform:none}}
  @media (prefers-reduced-motion:reduce){.zc-panel,.zc-backdrop{transition:none}}
  `;

  function build() {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    const root = document.createElement("div");
    root.className = "zc-root";
    root.id = "zcRoot";
    root.innerHTML = `
      <div class="zc-backdrop" data-zc-close></div>
      <aside class="zc-panel" role="dialog" aria-modal="true" aria-labelledby="zcTitle" tabindex="-1">
        <header class="zc-head"><h2 id="zcTitle">Pesanan Kamu</h2><button type="button" class="zc-x" data-zc-close aria-label="Tutup keranjang">✕</button></header>
        <div class="zc-body">
          <ul class="zc-list" id="zcList"></ul>
          <div class="zc-empty" id="zcEmpty"><div class="big" aria-hidden="true">🛒</div><p>Pesananmu masih kosong.<br>Pilih cemilan favoritmu dulu, ya.</p><a class="zc-link" href="${esc(cfg.menuHref)}" data-zc-close>Lihat Menu</a></div>
          <div class="zc-form" id="zcForm"><label for="zcName">Nama</label><input id="zcName" type="text" placeholder="Nama kamu" autocomplete="name"><label for="zcNote">Catatan (opsional)</label><textarea id="zcNote" rows="2" placeholder="Contoh: alamat, jam ambil, level pedas"></textarea><div class="zc-err" id="zcErr" role="alert"></div></div>
        </div>
        <footer class="zc-foot">
          <div class="zc-sum"><span>Jumlah item</span><b id="zcQty">0</b></div>
          <div class="zc-sum" id="zcPriceRow"><span>Estimasi harga</span><b id="zcPrice"></b></div>
          <p class="zc-note" id="zcNoteTxt">Harga akhir dan ketersediaan dikonfirmasi lewat WhatsApp.</p>
          <button type="button" class="zc-send" id="zcSend">Kirim Pesanan via WhatsApp</button>
          <button type="button" class="zc-clear" id="zcClear">Kosongkan pesanan</button>
        </footer>
      </aside>`;
    document.body.appendChild(root);
    return root;
  }

  let root, $;
  function render() {
    const count = items.reduce((s, i) => s + i.qty, 0);
    $("#zcList").innerHTML = items.map((i) => {
      const thumb = i.image ? `<img src="${esc(i.image)}" alt="">` : esc(i.emoji || i.name.charAt(0));
      const price = i.price > 0 ? `${rp(i.price)} / pcs` : "Harga via chat";
      return `<li class="zc-item" data-id="${esc(i.id)}"><div class="zc-thumb" aria-hidden="true">${thumb}</div><div><div class="zc-name">${esc(i.name)}</div><div class="zc-price">${price}</div></div><div class="zc-qty"><button type="button" data-act="minus" aria-label="Kurangi ${esc(i.name)}">−</button><b>${i.qty}</b><button type="button" data-act="plus" aria-label="Tambah ${esc(i.name)}">+</button></div><button type="button" class="zc-del" data-act="del">Hapus</button></li>`;
    }).join("");

    const has = items.length > 0;
    $("#zcEmpty").hidden = has;
    $("#zcForm").hidden = !has;
    $("#zcSend").disabled = !has;
    $("#zcClear").hidden = !has;
    $("#zcQty").textContent = count;

    const priced = items.filter((i) => i.price > 0);
    const total = priced.reduce((s, i) => s + i.price * i.qty, 0);
    $("#zcPriceRow").hidden = !priced.length;
    $("#zcPrice").textContent = rp(total);
    $("#zcNoteTxt").textContent = priced.length && priced.length < items.length ? "Sebagian item belum ada harga, jadi total ini belum lengkap. Harga akhir dikonfirmasi lewat WhatsApp." : "Harga akhir dan ketersediaan dikonfirmasi lewat WhatsApp.";

    document.querySelectorAll("[data-cart-count]").forEach((el) => el.textContent = count);
    try { localStorage.setItem(cfg.storageKey, JSON.stringify(items)); } catch (e) {}
    listeners.forEach((fn) => fn(items.slice(), count));
  }

  function open() {
    lastFocus = document.activeElement;
    $("#zcErr").textContent = "";
    root.classList.add("zc-open");
    document.body.style.overflow = "hidden";
    setTimeout(() => root.querySelector(".zc-x").focus(), 50);
  }

  function close() {
    root.classList.remove("zc-open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function norm(it) {
    return { id: String(it.id || slug(it.name)), name: String(it.name), price: Number(it.price) || 0, qty: Math.max(1, parseInt(it.qty, 10) || 1), emoji: it.emoji || "", image: it.image || "" };
  }

  function add(it) {
    const n = norm(it);
    const found = items.find((x) => x.id === n.id);
    if (found) found.qty += n.qty; else items.push(n);
    render();
  }

  function clear() { items = []; render(); }

  function send() {
    const name = $("#zcName").value.trim();
    const err = $("#zcErr");
    if (!items.length) { err.textContent = "Pilih minimal satu cemilan dulu."; return; }
    if (!name) { err.textContent = "Isi nama kamu dulu ya."; $("#zcName").focus(); return; }
    err.textContent = "";
    const note = $("#zcNote").value.trim();
    let msg = `Halo ${cfg.store}, saya ${name} ingin memesan:\n`;
    items.forEach((i) => { msg += `- ${i.name} x${i.qty}\n`; });
    const priced = items.filter((i) => i.price > 0);
    if (priced.length === items.length) msg += `\nEstimasi total: ${rp(priced.reduce((s, i) => s + i.price * i.qty, 0))}`;
    if (note) msg += `\nCatatan: ${note}`;
    msg += `\n\nMohon konfirmasi ketersediaan dan total harganya. Terima kasih!`;
    window.open(`https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  function init() {
    root = build();
    $ = (s) => root.querySelector(s);

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-zc-close]")) { close(); return; }
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const li = btn.closest("[data-id]");
      const it = items.find((x) => x.id === li.dataset.id);
      if (!it) return;
      if (btn.dataset.act === "plus") it.qty++;
      if (btn.dataset.act === "minus") it.qty = Math.max(1, it.qty - 1);
      if (btn.dataset.act === "del") items = items.filter((x) => x !== it);
      render();
    });

    $("#zcSend").addEventListener("click", send);
    $("#zcClear").addEventListener("click", clear);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("zc-open")) close(); });

    document.querySelectorAll("[data-cart-open]").forEach((button) => button.addEventListener("click", (e) => { e.preventDefault(); open(); }));
    render();
  }

  window.ZemilCart = { open, close, add, clear, getItems: () => items.slice(), onChange: (fn) => listeners.push(fn) };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
