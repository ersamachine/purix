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
  const FONTS = { arab: 'fonts/arab.css', deva: 'fonts/deva.css', thai: 'fonts/thai.css' }; // sitenin kendi sunucusundan
  // Öncelik sırası kullanıcının satış planından. İlk dil = ülkenin varsayılanı.
  const COUNTRIES = [
    { c: 'IN', r: 'asia', langs: ['en', 'hi'], ig: 'purixxrf.in', ex: '+91 98765 43210' },
    { c: 'TR', r: 'eu', langs: ['tr', 'en'], ig: 'purixxrf.tr', ex: '+90 532 123 45 67' },
    { c: 'AE', r: 'me', langs: ['en', 'ar'], ig: 'purixxrf.ae', ex: '+971 50 123 4567' },
    { c: 'SA', r: 'me', langs: ['ar', 'en'], ig: 'purixxrf.sa', ex: '+966 50 123 4567' },
    { c: 'CN', r: 'asia', langs: ['zh', 'en'], ig: 'purixxrf.cn', ex: '+86 131 2345 6789' },
    { c: 'US', r: 'am', langs: ['en'], ig: 'purixxrf.us', ex: '+1 212 555 0123' },
    { c: 'EG', r: 'me', langs: ['ar', 'en'], ig: 'purixxrf.eg', ex: '+20 100 123 4567' },
    { c: 'PK', r: 'asia', langs: ['en'], ig: 'purixxrf.pk', ex: '+92 300 1234567' },
    { c: 'ID', r: 'asia', langs: ['id', 'en'], ig: 'purixxrf.id', ex: '+62 812 3456 7890' },
    { c: 'IR', r: 'me', langs: ['fa', 'en'], ig: 'purixxrf.ir', ex: '+98 912 345 6789' },
    { c: 'KW', r: 'me', langs: ['ar', 'en'], ig: 'purixxrf.kw', ex: '+965 5000 1234' },
    { c: 'IT', r: 'eu', langs: ['it', 'en'], ig: 'purixxrf.it', ex: '+39 312 345 6789' },
    { c: 'GB', r: 'eu', langs: ['en'], ig: 'purixxrf.gb', ex: '+44 7700 900123' },
    { c: 'DE', r: 'eu', langs: ['de', 'en'], ig: 'purixxrf.de', ex: '+49 151 23456789' },
    { c: 'MY', r: 'asia', langs: ['ms', 'en'], ig: 'purixxrf.my', ex: '+60 12 345 6789' },
    { c: 'SG', r: 'asia', langs: ['en', 'zh'], ig: 'purixxrf.sg', ex: '+65 8123 4567' },
    { c: 'TH', r: 'asia', langs: ['th', 'en'], ig: 'purixxrf.th', ex: '+66 81 234 5678' },
    { c: 'VN', r: 'asia', langs: ['vi', 'en'], ig: 'purixxrf.vn', ex: '+84 912 345 678' },
    { c: 'MX', r: 'am', langs: ['es', 'en'], ig: 'purixxrf.mx', ex: '+52 55 1234 5678' },
    { c: 'BR', r: 'am', langs: ['pt', 'en'], ig: 'purixxrf.br', ex: '+55 11 91234 5678' },
    { c: 'INTL', r: 'intl', langs: ['en', 'tr'], ig: 'purixxrf.tr', ex: '+00 000 000 0000' }
  ];
  const REGIONS = ['asia', 'me', 'eu', 'am', 'intl'];
  const byCode = Object.fromEntries(COUNTRIES.map(x => [x.c, x]));
  // Yalnızca Türkiye + Türkçe için geçerli yerel metinler
  const OVERRIDES = {
    TR: { tr: {
      'meta.desc': 'PURIX X1 XRF altın analiz cihazı: kuyumcu, rafineri ve ayar evleri için 30 saniyede, parçaya dokunmadan ayar ve element ölçümü. Türkiye\'de kurulum, eğitim ve NDK lisans desteği.',
      'craft.sP': 'Kapak açıldığı anda tüp kapanır. Gövde yüzeyinde ölçülen doz 1 µSv/sa altındadır. NDK lisans başvuru dosyanızı biz hazırlarız.',
      'a3p': 'Gram altın, cumhuriyet altını ve yatırımlık sikkeleri ambalajından çıkarmadan kontrol edin.',
      'svc.lede': 'Kurulumdan kalibrasyona kadar her adımda karşınızda Türkçe konuşan bir mühendis var.',
      'v1p': 'Teslimat günü kurulum, personel eğitimi ve ilk kalibrasyon fiyata dahil.',
      'v2': 'NDK lisans desteği', 'v2p': 'Radyasyon kaynağı lisans dosyası, doz ölçüm raporu ve başvuru takibi.',
      'q3a': 'Tüp yalnızca kapak kapalıyken çalışır; gövde yüzeyindeki doz doğal fon seviyesine yakındır. Türkiye\'de X-ışını cihazları için NDK lisansı gerekir ve başvuru dosyasını sizin adınıza hazırlarız.',
      'q4a': 'Stoktaki modeller İstanbul içinde 2 iş günü, diğer illerde 5 iş günü içinde kurulur. Personel eğitimi yaklaşık 2 saat sürer.',
      'q5': 'Taksit veya kiralama seçeneği var mı?', 'q5a': 'Peşin ödeme, kredi kartına taksit ve 12–36 ay operasyonel kiralama seçenekleri var. Tercihinizi teklif formunda belirtin.',
      'c.show': 'Showroom', 'c.showV': 'Kapalıçarşı yakını, Fatih / İstanbul', 'c.hoursV': 'Hafta içi 09.00–18.30',
      'f.kvkk': '<a href="#">KVKK aydınlatma metnini</a> okudum; bilgilerimin bu talep için kullanılmasını onaylıyorum.',
      'e.kvkk': 'Devam etmek için KVKK onay kutusunu işaretleyin.', 'foot.kvkk': 'KVKK',
      'f.doneP': 'Bir iş günü içinde sizi arayacağız. Acil durumlar için +90 212 000 00 00.'
    } }
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
      const s = document.createElement('script'); s.src = `lang/${code}.js`;
      s.onload = () => res(window.PURIX_LANG[code] || null); s.onerror = () => res(null);
      document.head.appendChild(s);
    });
  }
  const fontsLoaded = {};
  function loadFont(script) {
    if (!script || !FONTS[script] || fontsLoaded[script]) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS[script];
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
    $('#cIg').href = igUrl; $('#cIg').textContent = '@' + ctry.ig; $('#fIg').href = igUrl;
    $('#footLoc').textContent = `${cn} · ${L.name}`;
    $('#fTel-h').textContent = t('f.phoneH').replace('{ex}', ctry.ex);
    $('#specPrec').innerHTML = iso(`±${num(.03)} %`);
    // Gizlilik bağlantıları: Türkçe → KVKK aydınlatma metni, diğer diller → İngilizce gizlilik bildirimi (yeni sekmede, form kaybolmasın)
    const gizlilik = lang === 'tr' ? 'kvkk.html' : 'privacy.html';
    $$('[data-t="f.kvkk"] a, [data-t="foot.kvkk"]').forEach(a => { a.href = gizlilik; a.target = '_blank'; a.rel = 'noopener'; });

    if (save) {
      store.set('purix-c', ctry.c); store.set('purix-l', lang);
      const u = new URL(location.href); u.searchParams.set('c', ctry.c.toLowerCase()); u.searchParams.set('l', lang);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
    renderReadout(heroShown);
    renderSeries();
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
    const finish = () => { band.classList.add('drawn'); pk.forEach(p => p.classList.add('on')); heroShown = heroComp.Au; renderReadout(heroShown); ln.style.strokeDashoffset = 0; };
    if (reduce) return finish();
    const len = ln.getTotalLength();
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
  (function howLoop() {
    const sec = $('#nasil'), dg = $('#diagram'), items = $$('#steps li');
    if (reduce) { items.forEach(li => li.classList.add('on')); dg.dataset.step = 3; return; }
    sec.classList.add('anim');
    let step = 0, timer = null;
    const go = () => { step = step % 3 + 1; dg.dataset.step = step; items.forEach(li => li.classList.toggle('on', +li.dataset.step === step)); };
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !timer) { go(); timer = setInterval(go, 2400); }
      else if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
    }, { threshold: .35 }).observe(sec);
    items.forEach(li => li.addEventListener('click', () => { step = +li.dataset.step - 1; go(); }));
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

  /* ---------- X1 serisi (yer tutucu teknik değerler) ---------- */
  const MODELS = [
    { id: 'X1', key: 'X1', det: () => iso('Si-PIN'), prec: .05, res: 165, time: [30, 60], col: () => t('m.fixed').replace('{v}', iso('1 mm')), pt: false, coat: false, out: false },
    { id: 'X1 PRO', key: 'PRO', det: () => iso('SDD 25 mm²'), prec: .03, res: 139, time: [15, 30], col: () => iso('1 / 2 mm'), pt: true, coat: true, out: true },
    { id: 'X1 LAB', key: 'LAB', det: () => t('m.fastSdd') + ' ' + iso('50 mm²'), prec: .01, res: 125, time: [10, 30], col: () => t('m.auto').replace('{v}', iso([.2, .5, 1, 2].map(v => v.toLocaleString(LANGS[lang].locale)).join(' · ') + ' mm')), pt: true, coat: true, out: true }
  ];
  const KEYS = ['det', 'prec', 'res', 'time', 'col', 'pt', 'coat', 'out'];
  const val = (m, k) => {
    const v = m[k];
    if (typeof v === 'boolean') return v ? t('m.yes') : t('m.no');
    if (k === 'prec') return iso(`±${num(v)} %`);
    if (k === 'res') return iso(`≤ ${v} eV`);
    if (k === 'time') return `${iso(`${v[0]}–${v[1]}`)} ${t('u.s')}`;
    return v();
  };
  let model = 1;
  const tabs = $('#tabs'), mBody = $('#modelBody'), panel = $('#modelPanel');
  function renderSeries(animate) {
    tabs.innerHTML = MODELS.map((m, i) => `<button type="button" role="tab" id="tab-${i}" aria-controls="modelPanel" aria-selected="${i === model}" tabindex="${i === model ? 0 : -1}">${m.id}</button>`).join('');
    panel.setAttribute('aria-labelledby', 'tab-' + model);
    const m = MODELS[model];
    const markup = `<p class="m-name">${m.id}</p><p class="m-for">${t('m.' + m.key + '.for')}</p>
      <dl class="m-specs">${KEYS.slice(0, 6).map(k => `<div><dt>${t('sl.' + k)}</dt><dd>${val(m, k)}</dd></div>`).join('')}</dl>
      <div class="m-cta"><a class="btn btn-gold" href="#teklif" data-model="${m.id}">${t('m.quoteFor').replace('{m}', m.id)}</a></div>`;
    if (animate && !reduce) { mBody.classList.add('swap'); setTimeout(() => { mBody.innerHTML = markup; mBody.classList.remove('swap'); }, 180); }
    else mBody.innerHTML = markup;
    $('#cmpTable').innerHTML = `<thead><tr><th scope="col"><span class="sr">${t('m.specCol')}</span></th>${MODELS.map(x => `<th scope="col">${x.id}</th>`).join('')}</tr></thead>
      <tbody>${KEYS.map(k => `<tr><th scope="row">${t('sl.' + k)}</th>${MODELS.map(x => `<td>${val(x, k)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  }
  tabs.addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (!b) return; model = +b.id.split('-')[1]; renderSeries(true); $('#tab-' + model).focus(); });
  tabs.addEventListener('keydown', e => {
    const rtl = html.dir === 'rtl';
    const d = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, Home: -99, End: 99 }[e.key]; if (d == null) return;
    e.preventDefault(); model = Math.abs(d) > 1 ? (d > 0 ? 2 : 0) : (model + d + 3) % 3; renderSeries(true); $('#tab-' + model).focus();
  });
  document.addEventListener('click', e => { const a = e.target.closest('[data-model]'); if (a) $('#fModel').value = a.dataset.model; });

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
    if (utm) return utm;
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
        model: f.get('model'), istek: f.getAll('istek').join(', '), mesaj: f.get('mesaj'),
        kaynak, sayfa: location.pathname + location.search, ua: navigator.userAgent.slice(0, 200), web: f.get('web')
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
    form.hidden = true;
    const done = $('#done'); done.hidden = false; done.focus();
  }
  errList.addEventListener('click', e => { const a = e.target.closest('a'); if (!a) return; e.preventDefault(); $(a.getAttribute('href')).focus(); });

  /* ---------- Başlat ---------- */
  const boot = window.PURIX_BOOT || { c: 'TR', l: 'tr' };
  const fromUrl = new URLSearchParams(location.search).has('c');
  select('bilezik');
  setLocale(boot.c, boot.l, { save: fromUrl }).finally(() => {
    html.classList.remove('i18n-wait'); html.classList.add('ready');
    heroSpectrum();
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); setTimeout(run, reduce ? 0 : 350); } }, { threshold: .4 }).observe($('.console'));
  });
})();
