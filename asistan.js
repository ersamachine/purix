/* PURIX site asistanı: alt çubuk + sohbet penceresi (14 dil, ülke/dil app.js'ten gelir).
   Çerez yok; sohbet geçmişi yalnızca bu sekmenin oturumunda (sessionStorage) tutulur.
   Sunucu kapalıysa (asistan_durum.acik = false) hiçbir şey gösterilmez. Cevaplar yalnızca onaylı bilgiyle gelir (platform/src/bilgi.js). */
(() => {
  'use strict';
  const API = (window.PURIX_API || '').trim();
  if (!API) return;
  let T = (k) => k, LANG = 'tr', CTRY = '', PRIV = 'privacy.html', kuruldu = false, kurulumBekliyor = false;
  let root, bar, panel, govde, girdi, barGirdi, msgs = [], bekliyor = false, kartVar = false, kartBitti = false;
  const $ = (s, k = root) => k.querySelector(s);
  const depo = {
    al(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    yaz(k, v) { try { sessionStorage.setItem(k, v); } catch { /* özel pencere */ } },
    sil(k) { try { sessionStorage.removeItem(k); } catch { /* özel pencere */ } }
  };
  const oturum = (() => {
    let o = depo.al('purix-as-o');
    if (!o) { o = [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(16).padStart(2, '0')).join(''); depo.yaz('purix-as-o', o); }
    return o;
  })();
  try { msgs = JSON.parse(depo.al('purix-as-m') || '[]').filter(m => m && (m.rol === 'k' || m.rol === 'a') && typeof m.metin === 'string').slice(-14); } catch { msgs = []; }
  kartBitti = depo.al('purix-as-k') === '1';

  const api = async (b) => {
    const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(b) });
    return r.json();
  };
  const kaydet = () => depo.yaz('purix-as-m', JSON.stringify(msgs.slice(-14)));

  const IC = {
    chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a1 1 0 011 1v10a1 1 0 01-1 1h-9.5L6 20.5V17H4a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M8 10h8M8 13h5"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V6m0 0l-5 5m5-5l5 5"/></svg>',
    min: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  function kur() {
    root = document.createElement('div');
    root.className = 'as-root'; root.id = 'asRoot';
    root.innerHTML = `
      <div class="as-bar" id="asBar">
        <form class="as-ask" id="asAskF" autocomplete="off">
          <button type="button" class="as-lab" id="asLab">${IC.chat}<b data-as="as.ask"></b></button>
          <input id="asAskI" type="text" maxlength="300" data-as-ph="as.ph" data-as-aria="as.ask" enterkeyhint="send">
          <button type="submit" class="as-go" data-as-aria="as.send">${IC.up}</button>
        </form>
        <a class="as-quote" href="#teklif" data-as="cta.quote"></a>
      </div>
      <section class="as-panel" id="asPanel" role="dialog" aria-labelledby="asTtl" hidden>
        <header class="as-head">
          <span class="as-av"><img src="assets/mark-128.webp" alt="" width="20" height="26"></span>
          <span class="as-ttl"><b id="asTtl" data-as="as.name"></b><small data-as="as.sub"></small></span>
          <span class="as-hb"><button type="button" id="asMin" data-as-aria="as.min">${IC.min}</button><button type="button" id="asX" data-as-aria="as.close">${IC.x}</button></span>
        </header>
        <div class="as-body" id="asBody" role="log" aria-live="polite"></div>
        <footer class="as-foot">
          <form class="as-in" id="asF" autocomplete="off"><input id="asI" type="text" maxlength="600" data-as-ph="as.in" data-as-aria="as.in" enterkeyhint="send"><button type="submit" class="as-send" data-as-aria="as.send">${IC.up}</button></form>
          <p class="as-note"><span data-as="as.note"></span> <a id="asPriv" target="_blank" rel="noopener" data-as="as.priv"></a></p>
        </footer>
      </section>`;
    document.body.appendChild(root);
    bar = $('#asBar'); panel = $('#asPanel'); govde = $('#asBody'); girdi = $('#asI'); barGirdi = $('#asAskI');
    $('#asAskF').addEventListener('submit', e => { e.preventDefault(); const m = barGirdi.value; barGirdi.value = ''; if (m.trim()) sor(m); else ac(); });
    $('#asLab').addEventListener('click', () => ac());
    $('#asF').addEventListener('submit', e => { e.preventDefault(); const m = girdi.value; girdi.value = ''; sor(m); });
    $('#asMin').addEventListener('click', kapat);
    $('#asX').addEventListener('click', () => { kapat(); sifirla(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) kapat(); });
    gizleme();
    etiketle();
  }

  // Çubuk, teklif formu ya da alt bölüm görünürken gizlenir (üstünü kapatmasın); dil penceresi açıkken de gizlenir
  function gizleme() {
    const durum = { teklif: false, alt: false, dil: false };
    const uygula = () => root.classList.toggle('as-gizle', durum.teklif || durum.alt || durum.dil);
    if ('IntersectionObserver' in window) {
      const io = (sel, ad) => { const el = document.querySelector(sel); if (el) new IntersectionObserver(([e]) => { durum[ad] = e.isIntersecting; uygula(); }, { threshold: 0.05 }).observe(el); };
      io('#teklif', 'teklif'); io('.foot2', 'alt');
    }
    const dlg = document.getElementById('locDlg');
    if (dlg) new MutationObserver(() => { durum.dil = dlg.open === true; uygula(); }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
  }

  function etiketle() {
    if (!root) return;
    root.querySelectorAll('[data-as]').forEach(el => { el.textContent = T(el.dataset.as); });
    root.querySelectorAll('[data-as-ph]').forEach(el => { el.placeholder = T(el.dataset.asPh); });
    root.querySelectorAll('[data-as-aria]').forEach(el => { el.setAttribute('aria-label', T(el.dataset.asAria)); });
    const p = $('#asPriv'); if (p) p.href = PRIV;
    panel.setAttribute('aria-label', T('as.name'));
    const g = govde.querySelector('.as-greet'); if (g) g.textContent = T('as.greet');
    govde.querySelectorAll('.as-chip').forEach((c, i) => { c.textContent = T('as.c' + (i + 1)); });
  }

  function kaydir() { govde.scrollTop = govde.scrollHeight; }
  function balon(rol, metin, ekSinif) {
    const d = document.createElement('div');
    d.className = 'as-m ' + (rol === 'k' ? 'u' : 'b') + (ekSinif ? ' ' + ekSinif : '');
    d.textContent = metin;
    govde.appendChild(d); kaydir();
    return d;
  }
  function cizGecmis() {
    govde.textContent = '';
    balon('a', T('as.greet'), 'as-greet');
    if (!msgs.length) {
      const c = document.createElement('div'); c.className = 'as-chips';
      [1, 2, 3].forEach(i => { const b = document.createElement('button'); b.type = 'button'; b.className = 'as-chip'; b.textContent = T('as.c' + i); b.addEventListener('click', () => sor(b.textContent)); c.appendChild(b); });
      govde.appendChild(c);
    }
    msgs.forEach(m => balon(m.rol, m.metin));
    kartVar = false;
  }

  function ac() {
    if (!panel) return;
    if (panel.hidden) { cizGecmis(); panel.hidden = false; root.classList.add('as-acik'); document.documentElement.classList.add('as-kilit'); }
    setTimeout(() => girdi.focus({ preventScroll: true }), 50);
  }
  function kapat() { if (!panel) return; panel.hidden = true; root.classList.remove('as-acik'); document.documentElement.classList.remove('as-kilit'); }
  function sifirla() { msgs = []; kartBitti = false; depo.sil('purix-as-m'); depo.sil('purix-as-k'); }

  function yaziyor(ac_) {
    const var_ = govde.querySelector('.as-typ');
    if (!ac_) { if (var_) var_.remove(); return; }
    if (var_) return;
    const d = document.createElement('div'); d.className = 'as-m b as-typ'; d.setAttribute('role', 'status'); d.setAttribute('aria-label', T('as.wait'));
    d.innerHTML = '<i></i><i></i><i></i>'; govde.appendChild(d); kaydir();
  }

  async function sor(metin) {
    metin = String(metin || '').trim().slice(0, 600);
    if (!metin || bekliyor) return;
    ac();
    const ch = govde.querySelector('.as-chips'); if (ch) ch.remove();
    balon('k', metin); msgs.push({ rol: 'k', metin }); kaydet();
    bekliyor = true; girdi.disabled = true; yaziyor(true);
    let c = null;
    try { c = await api({ islem: 'asistan_sohbet', mesajlar: msgs.slice(-14), oturum, dil: LANG, ulke: CTRY }); } catch { c = null; }
    yaziyor(false);
    let metinA, form = false;
    if (c && c.ok && c.cevap) { metinA = c.cevap; form = c.form === true; }
    else if (c && c.ok && c.filtre) { metinA = T('as.team'); form = true; }
    else if (c && c.ok && c.sinir) { metinA = T('as.limit'); form = true; }
    else { metinA = T('as.err'); form = true; }
    balon('a', metinA); msgs.push({ rol: 'a', metin: metinA }); kaydet();
    if (form && !kartBitti) kart();
    bekliyor = false; girdi.disabled = false; girdi.focus({ preventScroll: true });
  }

  // İletişim kartı: ad + telefon/e-posta + onay; mevcut "talep" işlemine gider (Talepler listesine "Site asistanı" kaynağıyla düşer)
  function kart() {
    if (kartVar || kartBitti) return;
    kartVar = true;
    const f = document.createElement('form'); f.className = 'as-card'; f.noValidate = true;
    f.innerHTML = `<input name="ad" type="text" maxlength="120" autocomplete="name" data-as-ph="as.f1" data-as-aria="as.f1">
      <input name="iletisim" type="text" maxlength="120" autocomplete="off" inputmode="email" data-as-ph="as.f2" data-as-aria="as.f2" dir="auto">
      <input name="web" type="text" class="as-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="as-ck"><input type="checkbox" name="onay"><span data-as="as.ck"></span></label>
      <p class="as-err" role="alert"></p>
      <button type="submit" class="as-sb" data-as="as.send"></button>`;
    govde.appendChild(f);
    f.querySelectorAll('[data-as]').forEach(el => { el.textContent = T(el.dataset.as); });
    f.querySelectorAll('[data-as-ph]').forEach(el => { el.placeholder = T(el.dataset.asPh); });
    f.querySelectorAll('[data-as-aria]').forEach(el => { el.setAttribute('aria-label', T(el.dataset.asAria)); });
    kaydir();
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const err = $('.as-err', f), ad = f.ad.value.trim(), il = f.iletisim.value.trim();
      const posta = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(il), tel = il.replace(/\D/g, '').length >= 7 && !il.includes('@');
      err.textContent = '';
      if (ad.length < 2) { err.textContent = T('as.e1'); f.ad.focus(); return; }
      if (!posta && !tel) { err.textContent = T('as.e2'); f.iletisim.focus(); return; }
      if (!f.onay.checked) { err.textContent = T('as.e3'); return; }
      const btn = $('.as-sb', f); btn.disabled = true; btn.textContent = T('as.sending');
      const ozet = ('Site asistanı sohbeti: ' + msgs.filter(m => m.rol === 'k').map(m => m.metin).join(' | ')).slice(0, 1900);
      const veri = { ad, tel: tel ? il : '', mail: posta ? il : '', firma: '', ulke: CTRY, dil: LANG, sektor: '', model: 'X1', istek: 'Site asistanı', mesaj: ozet, kaynak: 'Site asistanı',
        sayfa: location.pathname + location.search, ua: navigator.userAgent.slice(0, 200), web: f.web.value,
        kvkk: true, kvkk_surum: 'asistan-1', kvkk_metin: T('as.ck').slice(0, 500) };
      let j = null;
      try { j = await api({ islem: 'talep', veri }); } catch { j = null; }
      if (!j || !j.ok) { btn.disabled = false; btn.textContent = T('as.send'); err.textContent = T('as.err'); return; }
      f.remove(); kartVar = false; kartBitti = true; depo.yaz('purix-as-k', '1');
      balon('a', T('as.done')); msgs.push({ rol: 'a', metin: T('as.done') }); kaydet();
    });
  }

  async function baslat() {
    if (kuruldu || kurulumBekliyor) return;
    kurulumBekliyor = true;
    try {
      const d = await api({ islem: 'asistan_durum' });
      if (!d || !d.ok || !d.acik) return;
    } catch { return; } finally { kurulumBekliyor = false; }
    kuruldu = true; kur();
  }

  const yerel = (d) => {
    if (!d) return;
    if (typeof d.t === 'function') T = d.t;
    LANG = d.lang || LANG; CTRY = d.country || CTRY; PRIV = d.gizlilik || PRIV;
    if (kuruldu) etiketle(); else baslat();
  };
  document.addEventListener('purix-locale', e => yerel(e.detail));
  yerel(window.PURIX_LOC);  // asistan.js, ilk dil olayından sonra yüklendiyse
})();
