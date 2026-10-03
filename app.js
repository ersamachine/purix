/* PURIX v3 — çok ülkeli / çok dilli site */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  const html = document.documentElement;
  window.PURIX_LANG = window.PURIX_LANG || {};

  /* ---------- Diller ve ülkeler ---------- */
  const LANGS = {
    tr: { name: 'Türkçe', locale: 'tr-TR' },
    en: { name: 'English', locale: 'en-GB' },
    hi: { name: 'हिन्दी', locale: 'hi-IN', script: 'deva' },
    ar: { name: 'العربية', locale: 'ar-u-nu-latn', dir: 'rtl', script: 'arab' },
    zh: { name: '简体中文', locale: 'zh-CN', script: 'hans' },
    fa: { name: 'فارسی', locale: 'fa-u-nu-latn', dir: 'rtl', script: 'arab' },
    id: { name: 'Bahasa Indonesia', locale: 'id-ID' },
    ms: { name: 'Bahasa Melayu', locale: 'ms-MY' },
    th: { name: 'ไทย', locale: 'th-TH', script: 'thai' },
    vi: { name: 'Tiếng Việt', locale: 'vi-VN' },
    it: { name: 'Italiano', locale: 'it-IT' },
    de: { name: 'Deutsch', locale: 'de-DE' },
    es: { name: 'Español', locale: 'es-MX' },
    pt: { name: 'Português', locale: 'pt-BR' }
  };
  const SURUM = '202610032110'; // surum.py tarafından yazılır (önbellek kırıcı)
  const BRO_MB = { ar: 1.4, de: 1.2, en: 1.1, es: 1.2, fa: 1.4, hi: 1.5, id: 1.1, it: 1.1, ms: 1.1, pt: 1.2, th: 1.3, tr: 1.2, vi: 1.5, zh: 1.1 }; // broşür PDF boyutları (MB), broşürler yenilenince güncelleyin
  const FONTS = { arab: 'fonts/arab.css', deva: 'fonts/deva.css', thai: 'fonts/thai.css' }; // sitenin kendi sunucusundan
  // Öncelik sırası kullanıcının satış planından. İlk dil = ülkenin varsayılanı.
  const COUNTRIES = [
    { c: 'IN', r: 'asia', langs: ['en', 'hi'], ig: 'purixxrf.in', ex: '+91 98765 43210' },
    { c: 'TR', r: 'eu', langs: ['tr', 'en'], ig: 'purixxrf.tr', ex: '+90 532 123 45 67' },
    { c: 'AE', r: 'me', langs: ['en', 'ar'], ig: 'purixxrf.ae', ex: '+971 50 123 4567' },
    { c: 'SA', r: 'me', langs: ['ar', 'en'], ig: 'purixxrf.sa', ex: '+966 50 123 4567' },
    { c: 'CN', r: 'asia', langs: ['zh', 'en'], ig: 'purixxrf', ex: '+86 131 2345 6789' },
    { c: 'US', r: 'am', langs: ['en'], ig: 'purixxrf', ex: '+1 212 555 0123' },
    { c: 'EG', r: 'me', langs: ['ar', 'en'], ig: 'purixxrf', ex: '+20 100 123 4567' },
    { c: 'PK', r: 'asia', langs: ['en'], ig: 'purixxrf', ex: '+92 300 1234567' },
    { c: 'ID', r: 'asia', langs: ['id', 'en'], ig: 'purixxrf', ex: '+62 812 3456 7890' },
    { c: 'IR', r: 'me', langs: ['fa', 'en'], ig: 'purixxrf', ex: '+98 912 345 6789' },
    { c: 'KW', r: 'me', langs: ['ar', 'en'], ig: 'purixxrf', ex: '+965 5000 1234' },
    { c: 'IT', r: 'eu', langs: ['it', 'en'], ig: 'purixxrf', ex: '+39 312 345 6789' },
    { c: 'GB', r: 'eu', langs: ['en'], ig: 'purixxrf', ex: '+44 7700 900123' },
    { c: 'DE', r: 'eu', langs: ['de', 'en'], ig: 'purixxrf.de', ex: '+49 151 23456789' },
    { c: 'MY', r: 'asia', langs: ['ms', 'en'], ig: 'purixxrf', ex: '+60 12 345 6789' },
    { c: 'SG', r: 'asia', langs: ['en', 'zh'], ig: 'purixxrf', ex: '+65 8123 4567' },
    { c: 'TH', r: 'asia', langs: ['th', 'en'], ig: 'purixxrf', ex: '+66 81 234 5678' },
    { c: 'VN', r: 'asia', langs: ['vi', 'en'], ig: 'purixxrf', ex: '+84 912 345 678' },
    { c: 'MX', r: 'am', langs: ['es', 'en'], ig: 'purixxrf', ex: '+52 55 1234 5678' },
    { c: 'BR', r: 'am', langs: ['pt', 'en'], ig: 'purixxrf', ex: '+55 11 91234 5678' },
    { c: 'INTL', r: 'intl', langs: ['en', 'tr'], ig: 'purixxrf', ex: '+00 000 000 0000' }
  ];
  const REGIONS = ['asia', 'me', 'eu', 'am', 'intl'];
  const byCode = Object.fromEntries(COUNTRIES.map(x => [x.c, x]));
  // Yalnızca Türkiye + Türkçe için geçerli yerel metinler
  const OVERRIDES = {
    TR: { tr: {
      'meta.desc': 'PURIX X1 XRF altın analiz cihazı: kuyumcu, rafineri ve ayar evleri için 30–60 saniyede, parçaya zarar vermeden ayar ve element ölçümü. Türkiye\'de kurulum ve eğitim desteği.',
      'a3p': 'Gram altın, cumhuriyet altını ve yatırımlık sikkelerin yüzey bileşimini saniyeler içinde, zarar vermeden kontrol edin.',
      'svc.lede': 'Kurulumdan kalibrasyona kadar her adımda karşınızda Türkçe konuşan bir mühendis var.',
      'v1p': 'Kurulum, personel eğitimi ve ilk kalibrasyon desteği; kapsam teklifte belirtilir.',
      'q4a': 'Stoktaki modeller İstanbul içinde 2 iş günü, diğer illerde 5 iş günü içinde kurulur. Personel eğitimi yaklaşık 2 saat sürer.',
      'q5': 'Taksit veya kiralama seçeneği var mı?', 'q5a': 'Peşin ödeme, kredi kartına taksit ve 12–36 ay operasyonel kiralama seçenekleri var. Tercihinizi teklif formunda belirtin.',
      'c.show': 'Showroom', 'c.showV': 'İstanbul', 'c.hoursV': 'Hafta içi 09.00–18.30',
      'f.kvkk': '<a href="#">KVKK aydınlatma metnini</a> okudum; bilgilerimin bu talep için kullanılmasını onaylıyorum.',
      'e.kvkk': 'Devam etmek için KVKK onay kutusunu işaretleyin.', 'foot.kvkk': 'KVKK',
      'f.doneP': 'En kısa sürede sizinle iletişime geçeceğiz.'
    }, en: { 'c.show': 'Showroom', 'c.showV': 'Istanbul' } }  // Türkiye + İngilizce: yalnızca konum etiketi (sahip kararı 2 Ekim 2026)
  };

  let lang = 'tr', country = byCode.TR, dict = {};
  const TR0 = {};
  $$('[data-t]').forEach(el => TR0[el.dataset.t] = el.innerHTML);
  const t = k => dict[k] ?? TR0[k] ?? k;
  const num = (n, d = 2) => n.toLocaleString(LANGS[lang].locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  let regionNames = null;
  const countryName = code => {
    if (code === 'INTL') return t('loc.intlName');
    try { regionNames = regionNames || new Intl.DisplayNames([LANGS[lang].locale.split('-u-')[0]], { type: 'region' }); return regionNames.of(code); }
    catch { return code; }
  };

  function loadLang(code) {
    if (window.PURIX_LANG[code]) return Promise.resolve(window.PURIX_LANG[code]);
    return new Promise(res => {
      const s = document.createElement('script'); s.src = `lang/${code}.js${SURUM ? '?v=' + SURUM : ''}`;
      s.onload = () => res(window.PURIX_LANG[code] || null); s.onerror = () => res(null);
      document.head.appendChild(s);
    });
  }
  const fontsLoaded = {};
  function loadFont(script) {
    if (!script || !FONTS[script] || fontsLoaded[script]) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS[script] + (SURUM ? '?v=' + SURUM : '');
    document.head.appendChild(l); fontsLoaded[script] = 1;
  }

  async function setLocale(cCode, lCode, { save = true } = {}) {
    const ctry = byCode[cCode] || byCode.INTL;
    if (!LANGS[lCode]) lCode = ctry.langs[0];
    const pack = await loadLang(lCode);
    if (!pack) { if (lCode !== 'en') return setLocale(cCode, 'en', { save }); return; }
    lang = lCode; country = ctry; regionNames = null;
    dict = Object.assign({}, pack, (OVERRIDES[ctry.c] || {})[lCode] || {});
    const L = LANGS[lang];
    html.lang = lang; html.dir = L.dir || 'ltr';
    if (L.script) { html.dataset.script = L.script; loadFont(L.script); } else delete html.dataset.script;

    $$('[data-t]').forEach(el => { el.innerHTML = t(el.dataset.t); });
    $$('[data-t-alt]').forEach(el => { el.alt = t(el.dataset.tAlt); });
    $$('[data-t-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.tAria)); });
    $$('[data-t-content]').forEach(el => { el.content = t(el.dataset.tContent); });

    // ülkeye bağlı alanlar
    const cn = countryName(ctry.c), igUrl = `https://www.instagram.com/${ctry.ig}/`;
    $('#locCode').textContent = ctry.c === 'INTL' ? 'INT' : ctry.c;
    $('#locLang').textContent = L.name;
    $('#cCountry').textContent = cn;
    $('#cIg').href = igUrl; $('#cIg').textContent = '@' + ctry.ig; $('#fIg').href = igUrl; $('#fIg').textContent = '@' + ctry.ig;
    const mail = ctry.c === 'TR' ? 'tr@purixxrf.com' : 'info@purixxrf.com'; $('#cMail').href = 'mailto:' + mail; $('#cMail').textContent = mail; // Türkiye'ye özel adres
    $('#footLocCode').textContent = ctry.c === 'INTL' ? 'INT' : ctry.c; $('#footLocLang').textContent = L.name;
    $('#fMailL').href = 'mailto:' + mail; $('#fMailL').textContent = mail;
    $('#fTel-h').textContent = t('f.phoneH').replace('{ex}', ctry.ex);
    const pct = s => lang === 'tr' ? s.replace(/(\d[\d.,]*)\s?%/g, '%$1') : s; // Türkçede yüzde işareti sayıdan önce (TDK)
    $$('[data-fmt]').forEach(el => { el.innerHTML = iso(pct(el.dataset.fmt.replace(/\{([\d.]+)\}/g, (_, n) => num(+n, (n.split('.')[1] || '').length)))); });
    // Gizlilik bağlantıları: Türkçe → KVKK aydınlatma metni, diğer diller → İngilizce gizlilik bildirimi (yeni sekmede, form kaybolmasın)
    const gizlilik = lang === 'tr' ? 'kvkk.html' : 'privacy.html';
    $$('[data-t="f.kvkk"] a, [data-t="foot.kvkk"]').forEach(a => { a.href = gizlilik; a.target = '_blank'; a.rel = 'noopener'; });
    // Broşür: her dilin kendi PDF'i (14 dil)
    $$('[data-t="foot.bro"], [data-bro]').forEach(a => { a.href = `assets/purix-x1-brosur-${lang}.pdf${SURUM ? '?v=' + SURUM : ''}`; a.target = '_blank'; a.rel = 'noopener'; });
    $$('[data-bro] img').forEach(im => { im.src = `assets/brosur-kapak-${lang}.webp${SURUM ? '?v=' + SURUM : ''}`; });
    $$('[data-t="f2.pdfM"]').forEach(el => { el.innerHTML = t('f2.pdfM').replace('{mb} MB', `<bdi dir="ltr">${num(BRO_MB[lang] || 1.2, 1)} MB</bdi>`); });
    window.PURIX_LOC = { lang, country: ctry.c, t, gizlilik }; document.dispatchEvent(new CustomEvent('purix-locale', { detail: window.PURIX_LOC })); // site asistanı (asistan.js) dil ve ülkeyi buradan alır

    if (save) {
      store.set('purix-c', ctry.c); store.set('purix-l', lang);
      const u = new URL(location.href); u.searchParams.set('c', ctry.c.toLowerCase()); u.searchParams.set('l', lang);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
    renderReadout(heroShown);
    demoRelabel();
    clearErrors();
    if (dlg.open) renderLocale();
  }

  /* ---------- Ülke / dil penceresi ---------- */
  const dlg = $('#locDlg'), list = $('#locList'), langBtns = $('#locLangBtns');
  function renderLocale() {
    const coll = new Intl.Collator(LANGS[lang].locale.split('-u-')[0]);
    list.innerHTML = REGIONS.map(r => {
      const items = COUNTRIES.filter(x => x.r === r).map(x => ({ x, n: countryName(x.c) })).sort((a, b) => r === 'intl' ? 0 : coll.compare(a.n, b.n));
      return `<section class="loc-reg"><h3>${t('loc.' + r)}</h3><div class="loc-grid">${items.map(({ x, n }) =>
        `<button type="button" class="loc-item" data-c="${x.c}" ${x.c === country.c ? 'aria-current="true"' : ''}>
          <span class="lc-code">${x.c === 'INTL' ? 'INT' : x.c}</span><span class="lc-txt"><b>${n}</b><small>${x.langs.map(l => LANGS[l].name).join(' · ')}</small></span></button>`).join('')}</div></section>`;
    }).join('');
    langBtns.innerHTML = country.langs.map(l => `<button type="button" data-l="${l}" aria-pressed="${l === lang}" lang="${l}">${LANGS[l].name}</button>`).join('');
  }
  function openLocale() { renderLocale(); dlg.showModal(); ($('.loc-item[aria-current]', dlg) || $('.loc-item', dlg)).focus(); }
  $('#locBtn').addEventListener('click', openLocale);
  $$('[data-open-loc]').forEach(b => b.addEventListener('click', openLocale));
  $('#locClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => {
    if (e.target === dlg) return dlg.close(); // arka plana tıklama
    const c = e.target.closest('[data-c]'), l = e.target.closest('[data-l]');
    if (c) { const x = byCode[c.dataset.c]; setLocale(x.c, x.langs[0]).then(() => dlg.close()); } // ülke seçilince o ülkenin varsayılan dili
    if (l) setLocale(country.c, l.dataset.l);
  });
  dlg.addEventListener('close', () => $('#locBtn').focus());

  /* ---------- Spektrum modeli ---------- */
  const LINES = {
    Au: [[9.713, 1, 'Au Lα'], [11.442, .72, 'Au Lβ'], [13.381, .11], [8.494, .05], [2.123, .18, 'Au M']],
    Ag: [[22.163, 1, 'Ag Kα'], [24.942, .2, 'Ag Kβ'], [2.984, .12]],
    Cu: [[8.048, 1, 'Cu Kα'], [8.905, .14]],
    Zn: [[8.639, 1, 'Zn Kα'], [9.572, .14]],
    Ni: [[7.478, 1, 'Ni Kα'], [8.265, .14]],
    Pd: [[21.177, 1, 'Pd Kα'], [23.819, .2]]
  };
  const SENS = { Au: 1, Ag: .9, Cu: 1.35, Zn: 1.45, Ni: 1.25, Pd: .9 };
  const EMAX = 30;
  const spec = (E, comp) => {
    let y = .018 * Math.max(0, E - 1.2) * Math.exp(-E / 9) + .012 * Math.exp(-((E - 20.2) ** 2) / 3.5);
    for (const el in comp) {
      const c = comp[el] / 100; if (!c || !LINES[el]) continue;
      for (const [e0, r] of LINES[el]) { const s = .075 + .006 * e0; y += c * SENS[el] * r * Math.exp(-((E - e0) ** 2) / (2 * s * s)); }
    }
    return y;
  };
  const shape = v => Math.pow(v, .55);
  // Sayı + birim dizileri sağdan sola dillerde karışmasın diye yalıtılır
  const iso = s => `<bdi dir="ltr">${s}</bdi>`;

  /* ---------- Giriş: spektrum + sayaç ---------- */
  const heroComp = { Au: 91.67, Ag: 4.10, Cu: 3.95, Zn: .28 };
  let heroShown = heroComp.Au;
  function renderReadout(au) {
    $('#roVal').textContent = num(au);
    $('#roMil').textContent = num(au * 10, 1);
    $('#roK').textContent = num(au * 24 / 100);
  }
  function heroSpectrum() {
    const svg = $('#heroSpec'), band = svg.parentElement, tags = $('#heroTags');
    const W = 1600, H = 180, base = 150, N = 700;
    let max = 0; const pts = [];
    for (let i = 0; i <= N; i++) { const E = i / N * EMAX, v = shape(spec(E, heroComp)); pts.push([E, v]); if (v > max) max = v; }
    const X = E => E / EMAX * W, Y = v => base - v / max * 132;
    const d = pts.map(([E, v], i) => (i ? 'L' : 'M') + X(E).toFixed(1) + ' ' + Y(v).toFixed(1)).join('');
    svg.innerHTML = `<defs><linearGradient id="sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B48C50" stop-opacity=".26"/><stop offset="1" stop-color="#B48C50" stop-opacity="0"/></linearGradient></defs>
      <line class="ax" x1="0" y1="${base}" x2="${W}" y2="${base}"/><path class="area" d="${d}L${W} ${base}L0 ${base}Z"/><path class="ln" d="${d}"/>`;
    [['Cu Kα', 8.048, 'l'], ['Au Lα', 9.713, ''], ['Au Lβ', 11.442, 'r'], ['Ag Kα', 22.163, '']].forEach(([txt, E, cls]) => {
      const s = document.createElement('span'); s.className = 'pk ' + cls;
      s.innerHTML = `${txt}<small>${E.toFixed(2)} keV</small>`;
      s.style.left = (E / EMAX * 100) + '%'; s.style.top = (Y(shape(spec(E, heroComp))) / H * 100) + '%';
      tags.appendChild(s);
    });
    for (let k = 0; k <= 30; k += 5) {
      const s = document.createElement('span'); s.className = 'tk' + (k === 0 ? ' first' : k === 30 ? ' last' : '');
      s.textContent = k === 30 ? '30 keV' : k; s.style.left = (k / EMAX * 100) + '%'; s.style.top = (base / H * 100) + '%';
      tags.appendChild(s);
    }
    const ln = $('.ln', svg), pk = $$('.pk', tags);
    const finish = () => { band.classList.add('drawn'); pk.forEach(p => p.classList.add('on')); heroShown = heroComp.Au; renderReadout(heroShown); ln.style.strokeDasharray = 'none'; ln.style.strokeDashoffset = 0; }; // geniş ekranlarda çizginin yarıda kalmaması için
    if (reduce) return finish();
    const len = ln.getTotalLength() * Math.max(1, svg.getBoundingClientRect().width / 1600) * 1.05;
    ln.style.strokeDasharray = len; ln.style.strokeDashoffset = len;
    const t0 = performance.now() + 450, dur = 2400, ease = x => 1 - Math.pow(1 - x, 3);
    let done = false;
    const tick = now => {
      if (done) return;
      const p = Math.max(0, Math.min(1, (now - t0) / dur)), e = ease(p);
      ln.style.strokeDashoffset = len * (1 - e);
      heroShown = heroComp.Au * e; renderReadout(heroShown);
      pk.forEach((el, i) => { if (e > [.3, .34, .4, .75][i]) el.classList.add('on'); });
      if (p < 1) requestAnimationFrame(tick); else { done = true; finish(); }
    };
    requestAnimationFrame(tick);
    setTimeout(() => { if (!done) { done = true; finish(); } }, 450 + dur + 800);
  }

  /* ---------- Nasıl ölçer ---------- */
  const tr = k => t(k); // çeviri (sahne içinde 't' zaman değişkeni)
  /* ---------- Nasıl ölçer: gerçek cihaz üzerinde ölçüm sahnesi ---------- */
  (function measureScene() {
    const sec = $('#nasil'), view = $('#xsView'), inner = $('#xsInner'), items = $$('#steps li');
    if (!view) return;
    const el = id => document.getElementById(id);
    const open = el('xsOpen'), closed = el('xsClosed'), scr = el('xsScreen'), placed = el('xsPlaced'), cut = el('xsCut');
    const focus = el('xsFocus'), win = el('xsWin');
    const hand1 = el('xsHand1'), hand2 = el('xsHand2'), tap = el('xsTap'), playBtn = el('xsPlay'), playIc = el('xsPlayIc');
    const suSt = el('suSt'), suK = el('suK'), suStart = el('suStart'), suRing = el('suRing'), suSpec = el('suSpec'), suProg = el('suProg');
    const V = [0, 1, 2, 3].map(i => el('suV' + i)), B = [0, 1, 2, 3].map(i => el('suB' + i));
    const COMP = [['Au', 91.67], ['Ag', 4.10], ['Cu', 3.95], ['Zn', .28]];
    const compObj = Object.fromEntries(COMP);

    // Ekran camının köşeleri (sahne koordinatı, iki fotoğrafta da aynı yere hizalı)
    const QUAD = [[280.4, 388.1], [748.3, 374.4], [800.4, 714.5], [307.9, 740.0]], SW = 480, SH = 352;
    const H = (() => { // (0,0)-(SW,SH) dikdörtgenini QUAD dörtgenine taşıyan homografi
      const src = [[0, 0], [SW, 0], [SW, SH], [0, SH]], A = [], b = [];
      src.forEach(([x, y], i) => { const [u, v] = QUAD[i];
        A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
        A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); });
      for (let c = 0; c < 8; c++) { let p = c; for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
        [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
        for (let r = 0; r < 8; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; } }
      return b.map((v, i) => v / A[i][i]);
    })();
    scr.style.transform = `matrix3d(${H[0]},${H[3]},0,${H[6]},${H[1]},${H[4]},0,${H[7]},0,0,1,0,${H[2]},${H[5]},0,1)`;
    const proj = (x, y) => { const w = H[6] * x + H[7] * y + 1; return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]; };

    const fit = () => { inner.style.transform = `scale(${view.clientWidth / 900})`; };
    new ResizeObserver(fit).observe(view); fit();

    const START_PT = proj(28 + 118 * .74, 352 - 18 - 3 - 10 - 20); // parmak START'ın sağ-ortasına dokunur
    const T = 16, PLACE = [412, 296], HOLD = [428, 258], OFF1 = [1190, 170], OFF2 = [1190, START_PT[1] + 30];
    const REL = [PLACE[0] + 96, PLACE[1] - 4]; // bilezik bırakılınca işaret parmağının ucu
    const cl = v => Math.max(0, Math.min(1, v)), ez = v => v < .5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
    const seg = (t, a, b) => ez(cl((t - a) / (b - a)));
    const mix = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];
    const STEP_AT = [0, 4, 7, 11];
    const NS = 'http://www.w3.org/2000/svg';

    // birincil ışın konisi (tüp ağzından pencereye)
    const SRC = [333, 530], DST = [410, 452];
    (() => { const dx = DST[0] - SRC[0], dy = DST[1] - SRC[1], L = Math.hypot(dx, dy), px = -dy / L, py = dx / L;
      el('xsBeam').setAttribute('points', [[SRC, 3], [DST, 15], [DST, -15], [SRC, -3]].map(([q, w]) => `${(q[0] + px * w).toFixed(1)},${(q[1] + py * w).toFixed(1)}`).join(' ')); })();
    const phot = el('xsPhot'), PH = [];
    for (let i = 0; i < 9; i++) { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 3.2); c.setAttribute('fill', '#FFF6DA'); phot.appendChild(c); PH.push(c); }
    // floresans dalgaları: numuneden dedektöre, her element kendi dalga boyunda
    const WAVES = [['xsWAu', [416, 452], [486, 534], 13], ['xsWAg', [422, 453], [492, 538], 8], ['xsWCu', [428, 454], [498, 542], 17]];
    const wave = (a, b, lam, ph, grow) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, n = 70, pts = [];
      for (let i = 0; i <= n * grow; i++) { const s = i / n * L, amp = 5.2 * Math.sin(Math.PI * i / n); const o = amp * Math.sin(s / lam * 2 * Math.PI - ph);
        pts.push(`${i ? 'L' : 'M'}${(a[0] + ux * s - uy * o).toFixed(1)} ${(a[1] + uy * s + ux * o).toFixed(1)}`); }
      return pts.join(''); };
    // altın konfeti (kurumsal renkler)
    const conf = el('xsConf'), CF = [], COLORS = ['#B48C50', '#E4CB93', '#F3D48E', '#8B5E14', '#FFF6DA', '#1C1917'];
    let sd = 7; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 90; i++) {
      const kind = i % 3, e = document.createElementNS(NS, kind === 2 ? 'circle' : 'rect');
      if (kind === 2) e.setAttribute('r', 2.6 + rnd() * 2); else { const w = kind ? 7 : 11, h = kind ? 7 : 5; e.setAttribute('x', -w / 2); e.setAttribute('y', -h / 2); e.setAttribute('width', w); e.setAttribute('height', h); e.setAttribute('rx', kind ? 1 : 1.5); }
      e.setAttribute('fill', COLORS[i % COLORS.length]); e.setAttribute('opacity', 0); conf.appendChild(e);
      const ang = -Math.PI / 2 + (rnd() - .5) * 2.6, sp = 200 + rnd() * 260;
      CF.push({ e, x: 450 + (rnd() - .5) * 200, y: 124, vx: Math.cos(ang) * sp * 1.5, vy: Math.sin(ang) * sp - 60, r: rnd() * 360, vr: (rnd() - .5) * 900, dl: rnd() * .25 });
    }
    const leg = [['xsLAu', 'Au Lα', 9.713], ['xsLAg', 'Ag Kα', 22.163], ['xsLCu', 'Cu Kα', 8.048]];

    function handPos(t) { // [x, y, el1 opaklığı, el2 opaklığı]
      if (t < .3) return [...OFF1, 0, 0];
      if (t < 1.5) return [...mix(OFF1, HOLD, seg(t, .3, 1.5)), 1, 0];
      if (t < 1.9) return [...mix(HOLD, PLACE, seg(t, 1.5, 1.9)), 1, 0];
      if (t < 2.15) { const k = cl((t - 1.9) / .25); return [...PLACE, 1 - k, k]; }
      if (t < 3.2) return [...mix(REL, OFF2, seg(t, 2.15, 3.2)), 0, 1];
      if (t < 5.0) return [...OFF2, 0, 0];
      if (t < 5.8) return [...mix(OFF2, START_PT, seg(t, 5.0, 5.8)), 0, 1];
      if (t < 6.1) { const k = Math.sin(cl((t - 5.8) / .3) * Math.PI); return [START_PT[0] - 3 * k, START_PT[1] + 4 * k, 0, 1]; }
      if (t < 7.0) return [...mix(START_PT, OFF2, seg(t, 6.1, 7.0)), 0, 1];
      return [...OFF2, 0, 0];
    }
    const fmt = v => v.toFixed(2);
    let lastStep = 0, lastSpec = -1, lastLeg = '';

    function render(t) {
      const S = START_PT;
      const openA = t < 4.2 ? 1 : t < 4.65 ? 1 - seg(t, 4.2, 4.65) : t < 15.4 ? 0 : seg(t, 15.4, 15.85);
      open.style.opacity = openA; closed.style.opacity = 1 - openA;
      const isPlaced = t >= 1.9 && t < 15.6;
      placed.setAttribute('opacity', isPlaced ? openA : 0);
      suRing.setAttribute('opacity', isPlaced ? 1 : 0);
      // eller
      const [hx, hy, o1, o2] = handPos(t);
      hand1.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)})`); hand1.setAttribute('opacity', o1);
      const h2 = t < 2.15 ? REL : [hx, hy];
      hand2.setAttribute('transform', `translate(${h2[0].toFixed(1)} ${h2[1].toFixed(1)})`); hand2.setAttribute('opacity', o2);
      // dokunma
      suStart.classList.toggle('press', t >= 5.85 && t < 6.35);
      const tk = cl((t - 5.9) / .6);
      tap.setAttribute('cx', S[0]); tap.setAttribute('cy', S[1]);
      tap.setAttribute('r', 8 + 34 * tk); tap.setAttribute('opacity', t >= 5.9 && t < 6.5 ? (1 - tk) : 0);
      // X-ışını floresansı
      const cutA = t < 7 ? 0 : t < 7.5 ? seg(t, 7, 7.5) : t < 10.6 ? 1 : t < 11.1 ? 1 - seg(t, 10.6, 11.1) : 0;
      cut.setAttribute('opacity', cutA);
      if (cutA > 0) {
        const bOn = cl((t - 7.5) / .35) * (t < 10.8 ? 1 : 0), fOn = cl((t - 8.1) / .4) * (t < 10.8 ? 1 : 0);
        el('xsBeam').setAttribute('opacity', (.75 + .25 * Math.sin(t * 22)) * bOn);
        el('xsCore').setAttribute('opacity', .8 * bOn);
        PH.forEach((c, i) => { const f = ((t * 1.6 + i / PH.length) % 1); c.setAttribute('cx', SRC[0] + (DST[0] - SRC[0]) * f); c.setAttribute('cy', SRC[1] + (DST[1] - SRC[1]) * f); c.setAttribute('opacity', bOn * Math.sin(f * Math.PI)); });
        el('xsHit').setAttribute('opacity', bOn * (.6 + .3 * Math.sin(t * 14)));
        el('xsHit').setAttribute('r', 38 + 6 * Math.sin(t * 9));
        focus.setAttribute('fill', bOn ? '#F3D48E' : '#57534E'); win.setAttribute('fill', fOn ? '#F3D48E' : '#57534E');
        el('xsWaves').setAttribute('opacity', fOn);
        const grow = cl((t - 8.1) / .6);
        WAVES.forEach(([id, a, b, lam]) => el(id).setAttribute('d', wave(a, b, lam, t * 14, grow)));
        el('xsLeg').setAttribute('opacity', fOn);
        const legTxt = leg.map(l => num(l[2])).join();
        if (legTxt !== lastLeg) { lastLeg = legTxt; leg.forEach(([id, n, e]) => { el(id).textContent = `${n} · ${num(e)} keV`; }); }
        const cp = cl((t - 8.1) / 2.5);
        el('xsCps').textContent = `${Math.round(48210 * cp * (0.97 + .03 * Math.sin(t * 13))).toLocaleString(html.lang === 'tr' ? 'tr-TR' : 'en-US')} cps`;
        el('xsLed').setAttribute('r', fOn && Math.sin(t * 30) > 0 ? 3.5 : 0);
        const mx = shape(spec(9.713, { Au: 100 })) * 1.08, pts = [];
        for (let i = 0; i <= 90; i++) { const E = i / 90 * 30, y = shape(spec(E, compObj) * ez(cp)); pts.push(`${(564 + i / 90 * 208).toFixed(1)},${(516 - Math.min(y / mx, 1) * 48).toFixed(1)}`); }
        el('xsCutSpec').setAttribute('points', cp ? pts.join(' ') : '');
      }
      // ekran: sayım ve sonuç
      const p = cl((t - 6) / 6.6), done = t >= 12.6 && t < 15.6, busy = t >= 5.9 && t < 12.6;
      suProg.style.transform = `scaleX(${t >= 15.6 ? 0 : p})`;
      suSt.textContent = done ? 'COMPLETE' : busy ? `MEASURING ${Math.round(p * 45)} s` : 'READY';
      suSt.className = 'su-st' + (done ? ' done' : busy ? ' busy' : '');
      suK.textContent = done ? '22.00 K' : '—';
      const conv = t < 7.5 ? 0 : cl((t - 7.5) / 5.1);
      COMP.forEach(([elm, v], i) => {
        if (t < 7.5 || t >= 15.6) { V[i].textContent = '—'; B[i].style.width = '0'; return; }
        const noise = done ? 0 : (1 - conv) * .18 * Math.sin(t * 11 + i * 2.1);
        const val = v * (1 + noise) * (done ? 1 : .35 + .65 * conv);
        V[i].textContent = fmt(val); B[i].style.width = Math.max(1.5, val) + '%';
      });
      const sc = t < 6 || t >= 15.6 ? 0 : ez(p);
      if (Math.abs(sc - lastSpec) > .004) {
        lastSpec = sc;
        if (!sc) suSpec.setAttribute('points', '');
        else { let max = shape(spec(9.713, { Au: 100 })) * 1.08, pts = [];
          for (let i = 0; i <= 140; i++) { const E = i / 140 * 30, y = shape(spec(E, compObj) * sc); pts.push(`${(i / 140 * 280).toFixed(1)},${(86 - Math.min(y / max, 1) * 80).toFixed(1)}`); }
          suSpec.setAttribute('points', pts.join(' ')); }
      }
      // sonuç kartı ve konfeti
      const dA = t < 12.8 ? 0 : t < 13.2 ? seg(t, 12.8, 13.2) : t < 15.2 ? 1 : 1 - seg(t, 15.2, 15.6);
      const sc2 = .92 + .08 * dA;
      el('xsDone').setAttribute('opacity', dA);
      el('xsDone').setAttribute('transform', `translate(450 120) scale(${sc2.toFixed(3)}) translate(-450 -120)`);
      const ct = t - 12.85;
      CF.forEach(q => { const d = ct - q.dl;
        if (reduce || d <= 0 || d > 2.6) { q.e.setAttribute('opacity', 0); return; }
        const x = q.x + q.vx * d * .9, y = q.y + q.vy * d + 650 * d * d;
        q.e.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(q.r + q.vr * d).toFixed(0)})`);
        q.e.setAttribute('opacity', d > 2 ? (2.6 - d) / .6 : 1); });
      // adımlar
      const st = t < 4 ? 1 : t < 7 ? 2 : t < 11 ? 3 : 4;
      if (st !== lastStep) { lastStep = st; items.forEach(li => li.classList.toggle('on', +li.dataset.step === st)); }
    }
    // "Hareketi azalt" açıksa (iPhone ve bazı Windows ayarları) sahne kendiliğinden oynamaz: son kare ve oynat düğmesi görünür,
    // dokununca baştan oynar. Diğer cihazlarda görünür olunca kendiliğinden oynar.
    let t = 0, playing = !reduce, basladi = !reduce, visible = false, last = 0, dongu = false;
    const loop = now => {
      if (!visible || !basladi) { last = 0; dongu = false; return; }
      if (last && playing) t = (t + Math.min(.05, (now - last) / 1000)) % T;
      last = now; render(t); requestAnimationFrame(loop);
    };
    const surdur = () => { if (visible && basladi && !dongu) { dongu = true; requestAnimationFrame(loop); } };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; surdur(); }, { threshold: .25 }).observe(view);
    const setPlay = on => {
      if (on && !basladi) { basladi = true; t = 0; lastStep = 0; sec.classList.add('anim'); }
      playing = on;
      playIc.setAttribute('d', on ? 'M6 4h3v12H6zM11 4h3v12h-3z' : 'M6 4l10 6-10 6z');
      playBtn.dataset.tAria = on ? 'how.pause' : 'how.play'; playBtn.setAttribute('aria-label', tr(on ? 'how.pause' : 'how.play'));
      surdur();
    };
    playBtn.addEventListener('click', () => setPlay(!playing));
    items.forEach(li => li.addEventListener('click', () => { if (!basladi) setPlay(true); t = STEP_AT[+li.dataset.step - 1] + .01; lastStep = 0; setPlay(true); }));
    if (reduce) { render(14); items.forEach(li => li.classList.add('on')); setPlay(false); }
    else { sec.classList.add('anim'); render(0); }
  })();

  /* ---------- Canlı analiz ---------- */
  const SAMPLES = {
    bilezik: { Au: 91.67, Ag: 4.10, Cu: 3.95, Zn: .28 },
    gram: { Au: 99.95, Ag: .03, Cu: .02 },
    yuzuk: { Au: 75.08, Pd: 7.90, Cu: 9.60, Ni: 4.30, Ag: 3.12 },
    kolye: { Au: 58.62, Cu: 30.95, Ag: 7.80, Zn: 2.63 },
    sahte: { Cu: 62.10, Zn: 26.80, Au: 9.40, Ni: 1.70 }
  };
  const canvas = $('#specCanvas'), ctx = canvas.getContext('2d');
  const body = $('#elemBody'), runBtn = $('#runBtn'), prog = $('#prog');
  const state = $('#scrState'), stateTxt = $('#scrStateTxt'), vK = $('#vK'), vM = $('#vM'), vN = $('#vNote');
  let cur = 'bilezik', running = false, phase = 'ready', shown = { t: 0, seed: 1 };

  function draw(comp, tt, seed) {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w) return;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const pl = 4, pb = 22, pt = 24, gw = w - pl - 4, gh = h - pb - pt;
    ctx.font = '500 12px Archivo, sans-serif'; if ('fontStretch' in ctx) ctx.fontStretch = 'semi-condensed';
    ctx.strokeStyle = '#1F1C1A'; ctx.lineWidth = 1; ctx.fillStyle = '#7C756C'; ctx.textAlign = 'center';
    for (let k = 0; k <= 30; k += 5) {
      const x = pl + k / EMAX * gw;
      ctx.beginPath(); ctx.moveTo(x, pt); ctx.lineTo(x, pt + gh); ctx.stroke();
      ctx.fillText(k === 30 ? 'keV' : k, Math.min(Math.max(x, 8), w - 14), h - 5);
    }
    if (tt <= 0) return;
    const ref = shape(spec(9.713, { Au: 100 })) * 1.05;
    let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const noise = .06 * (1 - tt) + .008, N = Math.round(gw), path = new Path2D();
    for (let i = 0; i <= N; i++) {
      const E = i / N * EMAX; let v = shape(spec(E, comp) * tt);
      v = Math.max(0, v + (rnd() - .5) * noise * (.4 + v));
      const x = pl + i, y = pt + gh - Math.min(v / ref, 1.02) * gh;
      i ? path.lineTo(x, y) : path.moveTo(x, y);
    }
    const area = new Path2D(path); area.lineTo(pl + N, pt + gh); area.lineTo(pl, pt + gh); area.closePath();
    const g = ctx.createLinearGradient(0, pt, 0, pt + gh); g.addColorStop(0, 'rgba(228,203,147,.32)'); g.addColorStop(1, 'rgba(228,203,147,0)');
    ctx.fillStyle = g; ctx.fill(area); ctx.strokeStyle = '#DDBC7C'; ctx.lineWidth = 1.4; ctx.stroke(path);
    if (tt > .55) {
      ctx.globalAlpha = Math.min(1, (tt - .55) / .3); ctx.font = '600 12px Archivo, sans-serif';
      const placed = [];
      for (const el in comp) {
        if (comp[el] < .5) continue;
        for (const [e0, , name] of LINES[el]) {
          if (!name) continue;
          const x = pl + e0 / EMAX * gw; let y = pt + gh - Math.min(shape(spec(e0, comp) * tt) / ref, 1) * gh - 9;
          while (placed.some(p => Math.abs(p[0] - x) < 44 && Math.abs(p[1] - y) < 14)) y -= 15;
          placed.push([x, y]); ctx.fillStyle = el === 'Au' ? '#E4CB93' : '#A39B90'; ctx.fillText(name, x, Math.max(y, 12));
        }
      }
      ctx.globalAlpha = 1;
    }
  }
  function table(comp, tt) {
    body.innerHTML = Object.entries(comp).sort((a, b) => b[1] - a[1]).map(([el, v]) =>
      `<tr class="${el === 'Au' ? 'au' : ''}"><th scope="row">${el}</th><td>${tt ? num(v * tt) : '—'}</td><td><div class="bar"><i style="transform:scaleX(${tt ? Math.max(v * tt, .6) / 100 : 0})"></i></div></td></tr>`).join('');
  }
  function setState(p) {
    phase = p; const warn = p === 'done' && cur === 'sahte';
    state.className = 'scr-state' + (p === 'busy' ? ' busy' : warn ? ' warn' : '');
    stateTxt.textContent = p === 'busy' ? t('d.measuring') : p === 'done' ? (warn ? t('d.warn') : t('d.done')) : t('d.ready');
  }
  function verdict(isDone) {
    const c = SAMPLES[cur];
    vK.textContent = isDone ? num(c.Au * 24 / 100) : '—';
    vM.textContent = isDone ? num(c.Au * 10, 1) : '—';
    vN.className = 'vnote' + (isDone ? (cur === 'sahte' ? ' warn' : ' ok') : '');
    vN.textContent = isDone ? t('n.' + cur) : (phase === 'busy' ? t('d.active') : t('d.placed'));
  }
  function demoRelabel() {
    setState(phase); verdict(phase === 'done');
    runBtn.textContent = running ? t('d.running') : phase === 'done' ? t('d.again') : t('d.run');
    if (!running) table(SAMPLES[cur], phase === 'done' ? 1 : 0);
  }
  function select(key) {
    if (running) return;
    cur = key; shown = { t: 0, seed: 1 };
    $$('.samples button').forEach(b => b.setAttribute('aria-checked', b.dataset.s === key));
    prog.style.transform = 'scaleX(0)';
    setState('ready'); draw(SAMPLES[cur], 0, 1); table(SAMPLES[cur], 0); verdict(false);
    runBtn.textContent = t('d.run');
  }
  function run() {
    if (running) return;
    running = true; runBtn.disabled = true; runBtn.textContent = t('d.running');
    $$('.samples button').forEach(b => b.disabled = true);
    setState('busy'); verdict(false);
    const comp = SAMPLES[cur], seed = 1 + Math.floor(Math.random() * 1e6), dur = reduce ? 1 : 3400, t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur), tt = 1 - Math.pow(1 - p, 2);
      draw(comp, tt, seed); table(comp, p > .25 ? Math.min(1, (p - .25) / .7) : 0);
      prog.style.transform = `scaleX(${p})`;
      if (p < 1) return requestAnimationFrame(tick);
      shown = { t: 1, seed }; running = false;
      setState('done'); table(comp, 1); verdict(true);
      runBtn.disabled = false; runBtn.textContent = t('d.again');
      $$('.samples button').forEach(b => b.disabled = false);
    };
    requestAnimationFrame(tick);
  }
  $$('.samples button').forEach(b => b.addEventListener('click', () => select(b.dataset.s)));
  $('.samples').addEventListener('keydown', e => {
    const bs = $$('.samples button'), i = bs.findIndex(b => b.dataset.s === cur);
    const rtl = html.dir === 'rtl';
    const d = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
    if (d == null || running) return;
    e.preventDefault(); const n = bs[(i + d + bs.length) % bs.length]; select(n.dataset.s); n.focus();
  });
  runBtn.addEventListener('click', run);
  let rz; addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { if (!running) draw(SAMPLES[cur], shown.t, shown.seed); }); });

  /* ---------- Nav ---------- */
  const nav = $('#nav'), bar = $('#progress');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      nav.classList.toggle('is-scrolled', scrollY > 6); ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('#burger'), drawer = $('#drawer');
  const toggle = open => { burger.setAttribute('aria-expanded', open); drawer.hidden = !open; };
  burger.addEventListener('click', () => toggle(burger.getAttribute('aria-expanded') !== 'true'));
  drawer.addEventListener('click', e => { if (e.target.closest('a')) toggle(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) { toggle(false); burger.focus(); } });
  const links = $$('.menu a');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.getAttribute('href') === '#' + e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });

  /* ---------- Teklif formu (mokap: sunucuya gönderim yok) ---------- */
  const form = $('#qForm'), sum = $('#errSum'), errList = $('#errList');
  const rules = {
    fAd: v => v.trim().length >= 3 ? '' : t('e.name'),
    fTel: v => !v.trim() ? t('e.tel') : (v.replace(/\D/g, '').length < 10 ? t('e.telBad') : ''),
    fMail: v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : t('e.mail'),
    fKvkk: (v, el) => el.checked ? '' : t('e.kvkk')
  };
  const check = id => {
    const el = $('#' + id), msg = rules[id](el.value, el), out = $('#' + id + '-e');
    out.textContent = msg; msg ? el.setAttribute('aria-invalid', 'true') : el.removeAttribute('aria-invalid');
    return msg;
  };
  function clearErrors() {
    Object.keys(rules).forEach(id => { $('#' + id + '-e').textContent = ''; $('#' + id).removeAttribute('aria-invalid'); });
    sum.hidden = true;
  }
  Object.keys(rules).forEach(id => {
    const el = $('#' + id);
    el.addEventListener('blur', () => { if (el.value || el.hasAttribute('aria-invalid')) check(id); });
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', () => { if (el.hasAttribute('aria-invalid')) check(id); });
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const bad = Object.keys(rules).map(id => [id, check(id)]).filter(([, m]) => m);
    if (bad.length) {
      errList.innerHTML = bad.map(([id, m]) => `<li><a href="#${id}">${m}</a></li>`).join('');
      sum.hidden = false; sum.focus(); return;
    }
    sum.hidden = true;
    send();
  });
  // Talebi Apps Script'e gönder (config.js'teki PURIX_API). Adres yoksa mokap gibi davranır.
  const kaynak = (() => {
    const q = new URLSearchParams(location.search), utm = q.get('utm_source');
    // ör. "instagram / 2026-w40 / olcum-reels": hangi paylaşımdan geldiği panelde görünür
    if (utm) return [utm, q.get('utm_campaign'), q.get('utm_content')].filter(Boolean).join(' / ').slice(0, 120);
    try { const r = document.referrer && new URL(document.referrer).hostname; if (r && r !== location.hostname) return r.replace(/^www\./, ''); } catch {}
    return 'Doğrudan';
  })();
  async function send() {
    const btn = $('button[type=submit]', form), err = $('#fSendErr'), label = btn.innerHTML;
    const api = (window.PURIX_API || '').trim();
    err.textContent = '';
    if (api) {
      const f = new FormData(form);
      const veri = {
        ad: f.get('ad'), firma: f.get('firma'), tel: f.get('tel'), mail: f.get('mail'),
        ulke: country.c, dil: lang,
        sektor: $('#fSektor').selectedOptions[0].dataset.t ? TR0[$('#fSektor').selectedOptions[0].dataset.t] : f.get('sektor'),
        model: 'X1', istek: f.getAll('istek').join(', '), mesaj: f.get('mesaj'),
        kaynak, sayfa: location.pathname + location.search, ua: navigator.userAgent.slice(0, 200), web: f.get('web'),
        // Onay kaydı (Faz 0.10): hangi metni gösterdik, işaretlendi mi. Metin değişirse sürüm numarası artırılır.
        kvkk: $('#fKvkk').checked === true, kvkk_surum: 'kvkk-1', kvkk_metin: ($('label[for="fKvkk"]') || $('#fKvkk').parentElement).innerText.replace(/\s+/g, ' ').trim().slice(0, 500)
      };
      btn.disabled = true; btn.textContent = t('f.sending');
      try {
        const r = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ islem: 'talep', veri }) });
        let j = null; try { j = await r.clone().json(); } catch {}
        if (j) { if (!j.ok) throw new Error(j.hata || 'fail'); }
        // Google yanıtı googleusercontent.com'dan verir; oraya yönlendirildiysek kayıt zaten yapılmıştır
        // (bazı ağlarda bu yanıt sayfası 404 döner ama talep tabloya yazılmış olur).
        else if (!/googleusercontent\.com/.test(r.url)) throw new Error('HTTP ' + r.status);
        else console.warn('PURIX: yanıt okunamadı, talep Google tarafından alındı', r.status);
      } catch (e2) {
        btn.disabled = false; btn.innerHTML = label; err.textContent = t('e.send'); return;
      }
    }
    olcum('form', '', true);
    form.hidden = true;
    const done = $('#done'); done.hidden = false; done.focus();
  }
  errList.addEventListener('click', e => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); $(a.getAttribute('href')).focus(); });

  /* ---------- Ziyaret ölçümü (çerezsiz, anonim; IP ve kişisel veri saklanmaz; panel → Trafik) ---------- */
  const olcumApi = (window.PURIX_API || '').trim();
  const olcumKapali = !olcumApi || /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const olcumQ = new URLSearchParams(location.search), olcumOnce = {};
  function olcum(tur, ayrinti, tek) {
    if (olcumKapali || (tek && olcumOnce[tur])) return;
    olcumOnce[tur] = true;
    let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch {}
    const govde = JSON.stringify({ islem: 'ziyaret', tur, ayrinti: ayrinti || '', dil: lang, hedef: (country && country.c) || '', ref,
      utm: { s: olcumQ.get('utm_source') || '', m: olcumQ.get('utm_medium') || '', c: olcumQ.get('utm_campaign') || '', k: olcumQ.get('utm_content') || '' } });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(olcumApi, new Blob([govde], { type: 'text/plain;charset=utf-8' }));
      else fetch(olcumApi, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: govde, keepalive: true }).catch(() => {});
    } catch {}
  }
  runBtn.addEventListener('click', () => olcum('demo', '', true));   // yalnızca kullanıcının başlattığı analiz (otomatik gösterim sayılmaz)
  const olcumTablo = $('.m-specs');
  if (olcumTablo && 'IntersectionObserver' in window) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); olcum('tablo', '', true); } }, { threshold: .3 }).observe(olcumTablo);
  form.addEventListener('focusin', () => olcum('form_ac', '', true));
  document.addEventListener('click', e => { const a = e.target.closest('[data-t="foot.bro"], [data-bro]'); if (a) olcum('brosur', lang); });

  /* ---------- Başlat ---------- */
  const boot = window.PURIX_BOOT || { c: 'TR', l: 'tr' };
  const fromUrl = new URLSearchParams(location.search).has('c');
  select('bilezik');
  setLocale(boot.c, boot.l, { save: fromUrl }).finally(() => {
    html.classList.remove('i18n-wait'); html.classList.add('ready');
    olcum('g', '', true);
    heroSpectrum();
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); setTimeout(run, reduce ? 0 : 350); } }, { threshold: .4 }).observe($('.console'));
  });
})();
