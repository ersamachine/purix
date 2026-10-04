/* PURIX Mağaza ve randevu sayfaları: ortak yardımcılar (dil TR/EN, sunucu çağrısı, tarih, QR, takvim dosyası). */
(function () {
  'use strict';
  const API = (window.PURIX_API || '').trim();
  const q = new URLSearchParams(location.search);
  const depo = { al(k) { try { return localStorage.getItem(k); } catch { return null; } }, yaz(k, v) { try { localStorage.setItem(k, v); } catch { /* özel pencere */ } } };
  const istek = q.get('l');
  const dil = istek === 'en' || istek === 'tr' ? istek : ((depo.al('purix-l') || 'tr') === 'tr' ? 'tr' : 'en');
  if (istek === 'en' || istek === 'tr') depo.yaz('purix-l', istek);
  document.documentElement.lang = dil;

  const TR = {
    'nav.how': 'Nasıl ölçer', 'nav.demo': 'Canlı analiz', 'nav.model': 'PURIX X1', 'nav.store': 'Mağaza', 'nav.contact': 'İletişim', 'nav.book': 'Randevu al', 'nav.my': 'Randevum',
    'g.days': ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'], 'g.daysL': ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'],
    'g.mon': ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'], 'g.monL': ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
    'g.min': 'dakika', 'g.err': 'Bağlantı kurulamadı. İnternetinizi kontrol edip sayfayı yenileyin.', 'g.soon': 'Bu mağaza yakında randevu almaya başlayacak. Adres ve çalışma saatleri netleşince bu sayfada duyuracağız.',
    'g.visit': '1 firma, en fazla {n} kişi', 'g.closed': 'Kapalı', 'g.free': '{n} boş', 'g.full': 'Dolu', 'g.until': '’e kadar', 'g.sel': 'seçili', 'g.taken': 'dolu',
  };
  const EN = {
    'nav.how': 'How it measures', 'nav.demo': 'Live analysis', 'nav.model': 'PURIX X1', 'nav.store': 'Store', 'nav.contact': 'Contact', 'nav.book': 'Book a visit', 'nav.my': 'My booking',
    'g.days': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], 'g.daysL': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    'g.mon': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], 'g.monL': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    'g.min': 'minutes', 'g.err': 'Could not connect. Check your internet connection and reload the page.', 'g.soon': 'This store will start taking bookings soon. We will announce the address and opening hours on this page.',
    'g.visit': '1 company, up to {n} people', 'g.closed': 'Closed', 'g.free': '{n} free', 'g.full': 'Full', 'g.until': ' until', 'g.sel': 'selected', 'g.taken': 'taken',
  };
  const S = dil === 'en' ? EN : TR;
  // Sayfaya özgü metinler sayfa betiğinde PX.ekle({tr:{}, en:{}}) ile eklenir
  function ekle(d) { Object.assign(TR, d.tr || {}); Object.assign(EN, d.en || {}); }
  const M = (k, v) => { let s = S[k] ?? TR[k] ?? k; if (v) for (const [a, b] of Object.entries(v)) s = String(s).split('{' + a + '}').join(b); return s; };
  // data-m="anahtar" → metin; data-m-html → HTML (yalnız kendi sabit metinlerimiz)
  function uygula(kok) {
    (kok || document).querySelectorAll('[data-m]').forEach(el => { el.textContent = M(el.dataset.m); });
    (kok || document).querySelectorAll('[data-m-html]').forEach(el => { el.innerHTML = M(el.dataset.mHtml); });
    (kok || document).querySelectorAll('[data-m-ph]').forEach(el => { el.placeholder = M(el.dataset.mPh); });
    (kok || document).querySelectorAll('[data-m-aria]').forEach(el => { el.setAttribute('aria-label', M(el.dataset.mAria)); });
    document.querySelectorAll('.lang-sw a').forEach(a => a.setAttribute('aria-current', String(a.dataset.l === dil)));
  }
  function dilBaglantilari() {
    document.querySelectorAll('.lang-sw a').forEach(a => { const u = new URL(location.href); u.searchParams.set('l', a.dataset.l); a.href = u.pathname + u.search + u.hash; });
  }

  async function api(islem, veri) {
    if (!API) throw new Error(M('g.err'));
    let r;
    try { r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ islem, ...veri }) }); }
    catch { throw new Error(M('g.err')); }
    const j = await r.json().catch(() => null);
    if (!j) throw new Error(M('g.err'));
    return j;
  }

  // tarih: 'YYYY-MM-DD' (Türkiye günü) ve gün içi dakika
  const pad = n => String(n).padStart(2, '0');
  const hhmm = t => pad(Math.floor(t / 60)) + ':' + pad(((t % 60) + 60) % 60);
  const gunNesne = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const gunEkle = (s, n) => { const d = gunNesne(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const tarihKisa = s => { const d = gunNesne(s); return d.getUTCDate() + ' ' + M('g.mon')[d.getUTCMonth()] + ' ' + M('g.days')[d.getUTCDay()]; };
  const tarihUzun = s => { const d = gunNesne(s); return dil === 'en' ? M('g.daysL')[d.getUTCDay()] + ', ' + d.getUTCDate() + ' ' + M('g.monL')[d.getUTCMonth()] + ' ' + d.getUTCFullYear() : d.getUTCDate() + ' ' + M('g.monL')[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + ', ' + M('g.daysL')[d.getUTCDay()]; };
  const haftaGunu = s => gunNesne(s).getUTCDay();
  const zamanYaz = iso => { const d = new Date(new Date(iso).getTime() + 3 * 3600e3); return d.getUTCDate() + ' ' + M('g.mon')[d.getUTCMonth()] + ' ' + d.getUTCFullYear() + ', ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Gerçek, okunabilir QR (assets/qrcode.js, MIT)
  function qrSvg(metin, px) {
    if (!window.qrcode) return '';
    const qr = window.qrcode(0, 'M'); qr.addData(metin); qr.make();
    const n = qr.getModuleCount(), V = n + 8; let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += 'M' + (x + 4) + ' ' + (y + 4) + 'h1v1h-1z';
    return '<svg viewBox="0 0 ' + V + ' ' + V + '" width="' + px + '" height="' + px + '" role="img" aria-label="QR" shape-rendering="crispEdges"><rect width="' + V + '" height="' + V + '" fill="#fff"/><path d="' + d + '" fill="#1C1917"/></svg>';
  }

  // Takvim dosyası (.ics) — randevu Türkiye saatiyle
  function takvimDosyasi(r, baslik, yer, url) {
    const z = (t, ek) => { const ms = Date.UTC(...r.tarih.split('-').map((x, i) => i === 1 ? x - 1 : +x)) + (t + ek) * 60e3 - 3 * 3600e3; return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PURIX//Magaza//TR', 'BEGIN:VEVENT', 'UID:' + r.kod + '@purixxrf.com', 'DTSTAMP:' + z(0, 0),
      'DTSTART:' + z(r.saat, 0), 'DTEND:' + z(r.bitis, 0), 'SUMMARY:' + baslik, 'LOCATION:' + (yer || '').replace(/[,;]/g, ' '), 'URL:' + url, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'purix-' + r.kod + '.ics'; a.click();
  }

  // Bu cihazda alınan randevular (Randevum menüsü için)
  const KAYIT = 'purix-randevular';
  const kayitlar = () => { try { return JSON.parse(depo.al(KAYIT) || '[]'); } catch { return []; } };
  function kayitEkle(o) { const l = kayitlar().filter(x => x.token !== o.token); l.unshift(o); depo.yaz(KAYIT, JSON.stringify(l.slice(0, 10))); }

  // Sayfanın HTML'i Türkçe kaynaktır: sözlükte olmayan Türkçe metinler sayfadan toplanır (İngilizce sözlükte karşılığı aranır)
  function turkceTopla() {
    document.querySelectorAll('[data-m]').forEach(el => { if (!(el.dataset.m in TR) && el.textContent.trim()) TR[el.dataset.m] = el.textContent.trim(); });
    document.querySelectorAll('[data-m-html]').forEach(el => { if (!(el.dataset.mHtml in TR) && el.innerHTML.trim()) TR[el.dataset.mHtml] = el.innerHTML.trim(); });
  }
  function hazirla() { turkceTopla(); dilBaglantilari(); uygula(); }
  window.PX = { dil, q, api, M, ekle, uygula, hazirla, hhmm, gunEkle, tarihKisa, tarihUzun, haftaGunu, zamanYaz, esc, qrSvg, takvimDosyasi, kayitlar, kayitEkle };
})();
