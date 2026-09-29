/**
 * PURIX — Talep ve panel arka ucu (Google Apps Script)
 *
 * Kurulum:
 *  1) Yeni bir Google E-Tablosu aç → Uzantılar → Apps Script → bu dosyanın tamamını yapıştır.
 *  2) Üstteki fonksiyon listesinden "kurulum" seç → Çalıştır → izinleri onayla.
 *  3) "sifreBelirle" fonksiyonundaki YENI_SIFRE'yi kendi şifrenle değiştir → Çalıştır.
 *  4) Dağıt → Yeni dağıtım → Tür: Web uygulaması · Yürüten: Ben · Erişim: Herkes → Dağıt.
 *  5) Çıkan web uygulaması URL'sini site ve panele yaz (config).
 */

const SAYFA = 'Talepler';
const BASLIK = ['ID', 'Zaman', 'Ad soyad', 'Firma', 'Telefon', 'E-posta', 'Ülke', 'Dil', 'Sektör', 'Model',
  'İstek', 'Mesaj', 'Kaynak', 'Sayfa', 'Durum', 'Notlar', 'Güncelleme', 'Tarayıcı'];
const COL = Object.fromEntries(BASLIK.map((b, i) => [b, i]));
const DURUMLAR = ['Yeni', 'İletişime geçildi', 'Teklif gönderildi', 'Demo planlandı', 'Kazanıldı', 'Kaybedildi'];
const OTURUM_SN = 6 * 60 * 60; // 6 saat

/* ---------------- Kurulum ---------------- */
function kurulum() {
  const sh = tablo_();
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('BILDIRIM')) p.setProperty('BILDIRIM', Session.getEffectiveUser().getEmail() || '');
  Logger.log('Hazır. Talepler sayfası: ' + sh.getName() + ' · Bildirim: ' + p.getProperty('BILDIRIM'));
}

function sifreBelirle() {
  const YENI_SIFRE = 'BURAYA-GUCLU-BIR-SIFRE-YAZ';
  if (YENI_SIFRE.indexOf('BURAYA') === 0 || YENI_SIFRE.length < 8) throw new Error('Önce YENI_SIFRE satırına en az 8 karakterli kendi şifreni yaz.');
  const tuz = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperties({ SIFRE_TUZ: tuz, SIFRE_OZET: ozet_(tuz + YENI_SIFRE) });
  Logger.log('Panel şifresi kaydedildi.');
}

function tablo_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SAYFA);
  if (!sh) {
    sh = ss.insertSheet(SAYFA);
    sh.getRange(1, 1, 1, BASLIK.length).setValues([BASLIK]).setFontWeight('bold').setBackground('#1C1917').setFontColor('#E4CB93');
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, BASLIK.length, 140);
  }
  return sh;
}

/* ---------------- Web uygulaması ---------------- */
function doGet() {
  return json_({ ok: true, servis: 'PURIX', zaman: new Date().toISOString() });
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, hata: 'Geçersiz istek' }); }
  try {
    switch (body.islem) {
      case 'talep': return json_(talepEkle_(body.veri || {}));
      case 'giris': return json_(giris_(body.sifre));
      case 'liste': yetki_(body.token); return json_(liste_());
      case 'guncelle': yetki_(body.token); return json_(guncelle_(body));
      case 'ayarlar': yetki_(body.token); return json_(ayarlar_(body));
      case 'cikis': cikis_(body.token); return json_({ ok: true });
      default: return json_({ ok: false, hata: 'Bilinmeyen işlem' });
    }
  } catch (err) {
    return json_({ ok: false, hata: String(err && err.message || err), yetki: err && err.yetki === true });
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- Siteden gelen talep ---------------- */
function talepEkle_(v) {
  // bot tuzağı: gizli alan doluysa sessizce kabul et, kaydetme
  if (v.web) return { ok: true };
  const ad = kes_(v.ad, 120), tel = kes_(v.tel, 40);
  if (ad.length < 2 || tel.replace(/\D/g, '').length < 7) return { ok: false, hata: 'Eksik bilgi' };
  // aynı telefondan 10 dakikada en fazla 3 talep
  const cache = CacheService.getScriptCache(), anahtar = 'tel_' + tel.replace(/\D/g, '');
  const sayi = Number(cache.get(anahtar) || 0);
  if (sayi >= 3) return { ok: false, hata: 'Çok fazla deneme' };
  cache.put(anahtar, String(sayi + 1), 600);

  const kilit = LockService.getScriptLock(); kilit.waitLock(10000);
  try {
    const sh = tablo_(), zaman = new Date();
    const id = 'PX-' + Utilities.formatDate(zaman, 'Europe/Istanbul', 'yyMMdd') + '-' + Math.floor(1000 + Math.random() * 9000);
    const satir = [id, zaman, ad, kes_(v.firma, 120), tel, kes_(v.mail, 120), kes_(v.ulke, 8).toUpperCase(), kes_(v.dil, 5),
      kes_(v.sektor, 60), kes_(v.model, 20), kes_(v.istek, 80), kes_(v.mesaj, 2000), kes_(v.kaynak, 120), kes_(v.sayfa, 300),
      'Yeni', '', zaman, kes_(v.ua, 200)].map(guvenli_);
    sh.appendRow(satir);
    try { bildir_(satir); } catch (err) { console.warn('E-posta gönderilemedi: ' + err); }
    return { ok: true, id: id };
  } finally { kilit.releaseLock(); }
}

function bildir_(s) {
  const alici = PropertiesService.getScriptProperties().getProperty('BILDIRIM');
  if (!alici) return;
  const esc = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const tel = String(s[COL['Telefon']]).replace(/[^\d+]/g, '');
  const satirlar = ['Ad soyad', 'Firma', 'Telefon', 'E-posta', 'Ülke', 'Dil', 'Sektör', 'Model', 'İstek', 'Mesaj', 'Kaynak']
    .map(k => `<tr><td style="padding:6px 12px 6px 0;color:#78716C">${k}</td><td style="padding:6px 0"><b>${esc(s[COL[k]])}</b></td></tr>`).join('');
  MailApp.sendEmail({
    to: alici,
    subject: `PURIX yeni talep · ${s[COL['Ülke']]} · ${s[COL['Ad soyad']]}${s[COL['Model']] ? ' · ' + s[COL['Model']] : ''}`,
    htmlBody: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1C1917">
      <p style="font-size:18px;margin:0 0 12px"><b>Yeni teklif talebi</b> <span style="color:#8B5E14">${esc(s[0])}</span></p>
      <table>${satirlar}</table>
      <p style="margin-top:16px"><a href="https://wa.me/${tel.replace('+', '')}" style="background:#1C1917;color:#fff;padding:10px 16px;border-radius:20px;text-decoration:none">WhatsApp ile yaz</a>
      &nbsp; <a href="https://www.purixxrf.com/panel/">Panelde aç</a></p></div>`
  });
}

/* ---------------- Panel ---------------- */
function giris_(sifre) {
  const p = PropertiesService.getScriptProperties(), tuz = p.getProperty('SIFRE_TUZ'), oz = p.getProperty('SIFRE_OZET');
  if (!tuz || !oz) throw new Error('Panel şifresi henüz belirlenmemiş (sifreBelirle).');
  const cache = CacheService.getScriptCache(), hataSay = Number(cache.get('giris_hata') || 0);
  if (hataSay >= 8) throw new Error('Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.');
  if (ozet_(tuz + String(sifre || '')) !== oz) { cache.put('giris_hata', String(hataSay + 1), 900); throw new Error('Şifre hatalı.'); }
  const token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  cache.put('oturum_' + token, '1', OTURUM_SN);
  return { ok: true, token: token, sure: OTURUM_SN };
}

function yetki_(token) {
  if (!token || !CacheService.getScriptCache().get('oturum_' + token)) { const e = new Error('Oturum süresi doldu, yeniden giriş yapın.'); e.yetki = true; throw e; }
}
function cikis_(token) { if (token) CacheService.getScriptCache().remove('oturum_' + token); }

function liste_() {
  const sh = tablo_(), n = sh.getLastRow();
  const rows = n > 1 ? sh.getRange(2, 1, n - 1, BASLIK.length).getValues() : [];
  const talepler = rows.filter(r => r[0]).map(r => {
    const o = {}; BASLIK.forEach((b, i) => { o[b] = r[i] instanceof Date ? r[i].toISOString() : r[i]; }); return o;
  }).reverse();
  return { ok: true, talepler: talepler, durumlar: DURUMLAR, bildirim: PropertiesService.getScriptProperties().getProperty('BILDIRIM') || '' };
}

function guncelle_(b) {
  const kilit = LockService.getScriptLock(); kilit.waitLock(10000);
  try {
    const sh = tablo_(), n = sh.getLastRow();
    if (n < 2) throw new Error('Kayıt bulunamadı');
    const ids = sh.getRange(2, 1, n - 1, 1).getValues().map(r => String(r[0]));
    const i = ids.indexOf(String(b.id));
    if (i < 0) throw new Error('Kayıt bulunamadı');
    const row = i + 2, simdi = new Date();
    if (b.durum != null) {
      if (DURUMLAR.indexOf(b.durum) < 0) throw new Error('Geçersiz durum');
      sh.getRange(row, COL['Durum'] + 1).setValue(b.durum);
    }
    if (b.not) {
      const hucre = sh.getRange(row, COL['Notlar'] + 1), eski = String(hucre.getValue() || '');
      const satir = Utilities.formatDate(simdi, 'Europe/Istanbul', 'dd.MM.yyyy HH:mm') + ' · ' + kes_(b.not, 1000);
      hucre.setValue(guvenli_(eski ? eski + '\n' + satir : satir));
    }
    if (b.sil === true) { sh.deleteRow(row); return { ok: true, silindi: true }; }
    sh.getRange(row, COL['Güncelleme'] + 1).setValue(simdi);
    const r = sh.getRange(row, 1, 1, BASLIK.length).getValues()[0], o = {};
    BASLIK.forEach((h, k) => { o[h] = r[k] instanceof Date ? r[k].toISOString() : r[k]; });
    return { ok: true, talep: o };
  } finally { kilit.releaseLock(); }
}

function ayarlar_(b) {
  const p = PropertiesService.getScriptProperties();
  if (b.bildirim != null) {
    const liste = String(b.bildirim).split(/[,;\s]+/).filter(Boolean);
    if (liste.some(x => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x))) throw new Error('Geçersiz e-posta adresi');
    p.setProperty('BILDIRIM', liste.join(','));
  }
  return { ok: true, bildirim: p.getProperty('BILDIRIM') || '' };
}

/* ---------------- Yardımcılar ---------------- */
function kes_(x, n) { return String(x == null ? '' : x).trim().slice(0, n); }
// Tabloya formül enjeksiyonunu önle (=, +, -, @ ile başlayan metinler)
function guvenli_(x) { return (typeof x === 'string' && /^[=+\-@]/.test(x)) ? "'" + x : x; }
function ozet_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}
