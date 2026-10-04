/* PURIX Rehber · adım motoru. Kural tabanlı: hangi adımda ne beklendiğini bu dosya bilir; dil modeli yalnız sesli sorulara cevap verir (sunucuda).
   İlerleme kaynakları: kamera (gorus.js, kalibre edilmiş bölgeler), sesli "tamam / yaptım", ekrandaki "Tamam" düğmesi, panelden görevli komutu.
   Adresler: ?api=… (yalnız localhost), ?oto=1 (kiosk: başlat dokunuşu yok), ?kurulum=1, ?sahte=1 (kamerasız deneme sahnesi; tuşlar 1–5). */
(function () {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const Q = new URLSearchParams(location.search);
  const DEV_API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? Q.get('api') : '';
  const API = (DEV_API || window.PURIX_API || '').trim();
  const DEPO = 'purix-rehber-cihaz';
  const depo = { al(k) { try { return localStorage.getItem(k); } catch { return null; } }, yaz(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* yok */ } } };
  const pad2 = n => String(n).padStart(2, '0'), hhmm = dk => pad2(Math.floor(dk / 60)) + ':' + pad2(((dk % 60) + 60) % 60);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let lang = 'tr', i = 0, cihaz = depo.al(DEPO) || '', fark = 0, ziy = null, akis = false, kamera = false, sonKomut = null;
  let tk = null, wk = null, sayac = null, durT = null, otoT = null, konusuyor = false, sonKonusma = 0, parca = 1, dur = {}, uyari = {}, kagitGoruldu = false, bekleyen = null;

  // ---- metinler ----
  // Adım tanımı: bolge = vurgulanacak/izlenecek kamera bölgesi; bekle = [bolge, durum] gelince ilerle; oto = konuşmadan sonra kendiliğinden ilerleme (ms)
  const S = [
    { oto: 1500, tr: ['Hoş geldiniz', 'Ben PURIX Rehber. Birlikte kendi altınınızla bir ölçüm yapacağız.', a => 'Hoş geldiniz ' + a + '. Ben PURIX Rehber. Birlikte, kendi altınınızla bir ölçüm yapacağız. İstediğiniz an bana soru sorabilirsiniz.', ''],
      en: ['Welcome', 'I am the PURIX Guide. Together we will measure your own gold.', a => 'Welcome, ' + a + '. I am the PURIX Guide. Together we will run a measurement with your own gold. You can ask me anything at any time.', ''] },
    { bolge: 'alan', bekle: ['alan', 'kisi'], tr: ['Masaya geçin', 'Cihazın önündeki işaretli alana gelin.', 'Önce cihazın önündeki işaretli alana gelin.', 'Kişi test alanında'],
      en: ['Step up to the table', 'Stand in the marked area in front of the device.', 'First, please stand in the marked area in front of the device.', 'Person in test area'] },
    { oto: 4000, atla: ['kapak', 'acik', 4], tr: ['Altını elinize alın', 'Ölçmek istediğiniz parçayı elinize alın.', 'Şimdi ölçmek istediğiniz altını elinize alın.', ''],
      en: ['Hold your gold', 'Pick up the piece you want to measure.', 'Now pick up the gold piece you want to measure.', ''] },
    { bolge: 'kapak', bekle: ['kapak', 'acik'], img: 'K', tr: ['Üst kapağı açın', 'Kapağı öndeki altın tutamaktan tutup kaldırın.', 'Üst kapağı, öndeki altın tutamaktan tutup yukarı kaldırın.', 'Kapak açık'],
      en: ['Open the top lid', 'Lift the lid by the gold handle at the front.', 'Lift the top lid using the gold handle at the front.', 'Lid open'] },
    { bolge: 'hazne', bekle: ['hazne', 'dolu'], img: 'A', tr: ['Altını hazneye koyun', 'Parçayı ortadaki yuvarlak pencerenin üzerine koyun.', 'Altını, ortadaki yuvarlak pencerenin tam üzerine koyun.', 'Altın haznede'],
      en: ['Place the gold', 'Put the piece on the round window in the middle.', 'Place the gold right on top of the round window in the middle.', 'Gold in chamber'] },
    { bolge: 'kapak', bekle: ['kapak', 'kapali'], img: 'A', tr: ['Kapağı kapatın', 'Kapağı yavaşça indirin.', 'Şimdi kapağı yavaşça indirip kapatın.', 'Kapak kapalı'],
      en: ['Close the lid', 'Lower the lid gently.', 'Now gently lower the lid and close it.', 'Lid closed'] },
    { bolge: 'ekran', bekle: ['ekran', 'olcuyor'], tr: ['START’a basın', 'Ekrandaki altın renkli START tuşuna dokunun.', 'Ekrandaki altın renkli START tuşuna dokunun.', 'Ekran ölçüyor'],
      en: ['Press START', 'Tap the gold START button on the screen.', 'Tap the gold START button on the screen.', 'Screen measuring'] },
    { bolge: 'ekran', bekle: ['ekran', 'sonuc'], olcum: true, tr: ['Ölçülüyor', '30–60 saniye sürer. Bu sırada kapağı açmayın.', 'Ölçüm başladı. Otuz ile altmış saniye sürer. Bu sırada kapağı açmayın.', 'Ekranda sonuç'],
      en: ['Measuring', 'Takes 30–60 seconds. Do not open the lid meanwhile.', 'The measurement has started. It takes thirty to sixty seconds. Please do not open the lid meanwhile.', 'Result on screen'] },
    { bolge: 'yazici', yazici: true, tr: ['Sonuç hazır', 'Sonuç cihaz ekranında. Yazıcıdan çıktınızı alın.', 'Sonuç hazır. Cihaz ekranında görebilirsiniz. Yazıcıdan çıktınızı alın.', 'Kâğıt alındı'],
      en: ['Result ready', 'The result is on the device screen. Take your printout.', 'Your result is ready on the device screen. Please take your printout from the printer.', 'Paper taken'],
      tr0: ['Sonuç hazır', 'Sonuç cihaz ekranında. İsterseniz telefonunuzla fotoğrafını çekebilirsiniz.', 'Sonuç hazır. Cihaz ekranında görebilirsiniz. İsterseniz telefonunuzla fotoğrafını çekebilirsiniz.', ''],
      en0: ['Result ready', 'The result is on the device screen. You can take a photo of it with your phone.', 'Your result is ready on the device screen. You can take a photo of it with your phone if you like.', ''] },
    { bolge: 'hazne', bekle: ['hazne', 'bos'], img: 'A', tr: ['Altınınızı geri alın', 'Kapağı açıp parçanızı alın.', 'Kapağı açıp altınınızı geri alın. Haznede bir şey bırakmayalım.', 'Hazne boş'],
      en: ['Take your gold back', 'Open the lid and take your piece.', 'Open the lid and take your gold back. Let us not leave anything inside.', 'Chamber empty'] },
    { secim: true, tr: ['Başka parça ölçelim mi?', '“Evet” ya da “bitti” diyebilirsiniz.', 'Başka bir parça ölçmek ister misiniz? Evet ya da bitti diyebilirsiniz.', ''],
      en: ['Measure another piece?', 'You can say “yes” or “done”.', 'Would you like to measure another piece? You can say yes or done.', ''] },
    { son: true, tr: ['Teşekkürler!', 'Sorularınız için yetkilimiz size dönecek.', a => 'Teşekkürler ' + a + '. Bir sorunuz olursa yetkilimiz size dönecek. İyi günler.', ''],
      en: ['Thank you!', 'Our team will get back to you with any questions.', a => 'Thank you, ' + a + '. If you have any questions, our team will get back to you. Have a nice day.', ''] }
  ];
  const SON = S.length - 1, SECIM = SON - 1, GERI_AL = 9;
  const HATA = {
    sira: { img: 'A', bolge: 'kapak', tr: 'Bir saniye: önce kapağı kapatalım, sonra START’a basalım.', en: 'One moment: let us close the lid first, then press START.' },
    dur: { tr: 'Takıldığınız bir yer mi var? Bu adımı bir kez daha göstereyim.', en: 'Are you stuck? Let me show this step once more.' },
    olcKapak: { img: 'A', bolge: 'kapak', tr: 'Kapak açıldı, ölçüm yarıda kaldı. Kapağı kapatıp START’a yeniden basalım.', en: 'The lid was opened, so the measurement stopped. Let us close it and press START again.' },
    unut: { img: 'A', bolge: 'hazne', tr: 'Haznede bir parça görüyorum. Altınınızı almayı unutmayın!', en: 'I can see a piece in the chamber. Do not forget your gold!' },
    gorevli: { tr: 'Görevlimize haber verdim. Lütfen burada bekleyin.', en: 'I have notified our staff. Please wait here.' }
  };
  const SURE = {
    bes: { tr: 'Randevumuzun son beş dakikası. Bu ölçümü birlikte tamamlayalım.', en: 'We have five minutes left. Let us finish this measurement together.' },
    doldu: { tr: 'Randevu süremiz doldu. Altınınızı geri almayı unutmayın; görevlimiz size yardımcı olacak.', en: 'Our appointment time is up. Please do not forget your gold; our staff will help you.' }
  };
  const TAG = { ok: ['var(--ok)', 'Onaylı bilgiden', 'From approved info'], yon: ['var(--warn)', 'Yetkiliye yönlendirildi', 'Passed to our team'], dis: ['#A8A29E', 'Konu dışı', 'Off topic'] };
  const UI = {
    tr: { no: (a, b) => 'Adım ' + a + ' / ' + b, basla: 'Başlıyoruz', kalan: 'Randevu süresi', dk: ' dk', camK: 'Masa kamerası · canlı · görüntü kaydedilmez', camF: 'Cihaz', mic: 'Sizi dinliyorum, istediğiniz an soru sorun', micS: 'Sesiniz yalnız sizi anlamak için kullanılır, saklanmaz', micYok: 'Sorularınızı görevlimize iletebilirsiniz', dinle: 'Dinliyorum…', tekrar: 'Tekrar anlat', cagir: 'Görevliyi çağır', siz: 'Siz', rehber: 'Rehber', devam: 'Kaldığımız yerden devam: ', evet: 'Evet, başka parça', bitti: 'Bitti', bekle: 'Bekleniyor: ', elle: 'Tamam, yaptım', elleDet: '“Tamam” deyin ya da düğmeye dokunun', gecen: 'geçti', olcS: '30–60 sn', sn: ' sn', yazici: 'Yazıcı', anladim: 'Anladım. Önce bu adımı bitirelim: ' },
    en: { no: (a, b) => 'Step ' + a + ' / ' + b, basla: 'Let us begin', kalan: 'Time left', dk: ' min', camK: 'Table camera · live · not recorded', camF: 'Device', mic: 'I am listening, ask me anything', micS: 'Your voice is used only to understand you and is not stored', micYok: 'You can ask our staff your questions', dinle: 'Listening…', tekrar: 'Repeat', cagir: 'Call staff', siz: 'You', rehber: 'Guide', devam: 'Continuing: ', evet: 'Yes, another piece', bitti: 'Done', bekle: 'Waiting for: ', elle: 'Done, next', elleDet: 'Say “OK” or tap the button', gecen: 'elapsed', olcS: '30–60 s', sn: ' s', yazici: 'Printer', anladim: 'Got it. Let us finish this step first: ' }
  };
  const u = k => UI[lang][k];
  const yaziciVar = () => Gorus.hazir('yazici');
  const metin = (n = i) => { const st = S[n]; return (st.yazici && !yaziciVar() && st[lang + '0']) || st[lang]; };
  const adSoy = () => (ziy && ziy.ad) || '';

  // ---- sunucu ----
  async function api(islem, veri) {
    if (!API) throw new Error('ag');
    const ctl = new AbortController(), zt = setTimeout(() => ctl.abort(), 20000);
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ islem, cihaz, ...veri }), signal: ctl.signal });
      const j = await r.json();
      if (j && j.yetki) { cihaz = ''; depo.yaz(DEPO, null); goster('es'); eslestir(); throw new Error('yetki'); }
      if (!j || !j.ok) throw new Error((j && j.hata) || 'sunucu');
      return j;
    } catch (e) { if (e.name === 'AbortError' || e instanceof TypeError) throw new Error('ag'); throw e; }
    finally { clearTimeout(zt); }
  }

  // ---- konuşma (tarayıcı sesi) ----
  function ses() { const v = speechSynthesis.getVoices(); return v.find(x => x.lang && x.lang.toLowerCase().startsWith(lang) && /google|natural|online/i.test(x.name)) || v.find(x => x.lang && x.lang.toLowerCase().startsWith(lang)); }
  function avatar(d) { $('#av').setAttribute('class', 'av ' + (d || '')); }
  function konus(m, sonra, yuz) {
    clearTimeout(tk); clearInterval(wk);
    const kel = m.split(' ');
    $('#cap').innerHTML = kel.map(w => '<span class="w">' + esc(w) + '</span>').join(' ');
    const ws = $$('#cap .w'); let n = 0, bitti = false;
    avatar('talk'); konusuyor = true;
    const bitir = () => { if (bitti) return; bitti = true; clearInterval(wk); clearTimeout(tk); ws.forEach(w => w.classList.add('on')); avatar(yuz || ''); konusuyor = false; sonKonusma = Date.now(); if (sonra) sonra(); };
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const ut = new SpeechSynthesisUtterance(m); ut.lang = lang === 'tr' ? 'tr-TR' : 'en-GB'; ut.rate = 1; const v = ses(); if (v) ut.voice = v;
      ut.onboundary = () => { if (ws[n]) ws[n++].classList.add('on'); };
      ut.onend = bitir; ut.onerror = bitir;
      speechSynthesis.speak(ut);
      wk = setInterval(() => { if (ws[n]) ws[n++].classList.add('on'); }, 330);  // sınır olayı gelmeyen seslerde yedek
      tk = setTimeout(bitir, 1500 + m.length * 90);
    } else { wk = setInterval(() => { if (ws[n]) ws[n++].classList.add('on'); }, 260); tk = setTimeout(bitir, 600 + kel.length * 260); }
  }
  function sus() { clearTimeout(tk); clearInterval(wk); if ('speechSynthesis' in window) speechSynthesis.cancel(); konusuyor = false; }

  // ---- görünüm ----
  // Fotoğraf modunda vurgu kutuları (% fotoğrafa göre). A = kapak açık, K = kapalı
  const KUTU = { alan: ['K', 0, 0, 100, 100], kapakK: ['K', 2, 2, 94, 22], hazne: ['A', 35, 31, 22, 10], kapakA: ['A', 5, 0, 87, 31], start: ['K', 38, 61, 14, 9], ekran: ['K', 29, 24, 63, 54], yazici: ['P'] };
  const FOTO_KUTU = { alan: 'alan', kapak: null, hazne: 'hazne', ekran: 'ekran', yazici: 'yazici' };
  function foto(t) { const ac = t === 'A'; $('#dev').className = 'dev' + (ac ? '' : ' kapali'); $('#devImg').src = '../assets/' + (ac ? 'x1.webp' : 'x1-kapali.webp'); }
  function vurgu(bolge, renk, yazi) {
    const hl = $('#hl'); hl.hidden = true;
    const ov = $('#ov'), g = ov.getContext('2d'); g.clearRect(0, 0, ov.width, ov.height);
    if (!bolge) return;
    if (kamera) {  // canlı görüntüde kalibre edilmiş bölge
      const b = (Gorus.anlik()[bolge] || {}).bolge; if (!b) return;
      const c = getComputedStyle(document.documentElement).getPropertyValue(renk === 'err' ? '--err' : '--ok').trim() || '#4FB477';
      g.lineWidth = 8; g.strokeStyle = c; g.shadowColor = c; g.shadowBlur = 24;
      g.strokeRect(b.x * ov.width, b.y * ov.height, b.w * ov.width, b.h * ov.height);
      if (yazi) { g.shadowBlur = 0; g.font = '700 30px Archivo, sans-serif'; const w = g.measureText(yazi).width + 24; g.fillStyle = c; g.fillRect(b.x * ov.width - 4, Math.max(0, b.y * ov.height - 48), w, 42); g.fillStyle = '#0f0e0d'; g.fillText(yazi, b.x * ov.width + 8, Math.max(30, b.y * ov.height - 16)); }
      return;
    }
    let ad = bolge === 'kapak' ? (S[i].img === 'A' ? 'kapakA' : 'kapakK') : FOTO_KUTU[bolge];
    if (!ad || (ad === 'yazici' && !yaziciVar())) return;
    const k = KUTU[ad], cam = $('#cam'), sc = cam.getBoundingClientRect().width / cam.offsetWidth;
    const hedef = k[0] === 'P' ? $('#printer') : $('#dev'), r = hedef.getBoundingClientRect(), cr = cam.getBoundingClientRect();
    const ox = (r.left - cr.left) / sc, oy = (r.top - cr.top) / sc, w = r.width / sc, h = r.height / sc;
    const [x, y, ww, hh] = k[0] === 'P' ? [-6, -18, 112, 124] : k.slice(1);
    hl.hidden = false; hl.style.setProperty('--c', renk === 'err' ? 'var(--err)' : 'var(--ok)'); $('#hlT').textContent = yazi || '';
    Object.assign(hl.style, { left: ox + w * x / 100 + 'px', top: oy + h * y / 100 + 'px', width: w * ww / 100 + 'px', height: h * hh / 100 + 'px' });
  }
  const kamIzler = st => kamera && st.bekle && Gorus.hazir(st.bekle[0]);  // bu adım kamerayla mı ilerliyor?

  function ciz(sesli = true) {
    const st = S[i], t = metin();
    clearInterval(sayac); clearTimeout(otoT);
    $('#step').className = 'step';
    $('#sNo').textContent = st.son ? '' : i === 0 ? u('basla') : u('no')(i, 10);
    $('#sH').textContent = t[0]; $('#sP').textContent = t[1];
    $('#prog').innerHTML = Array.from({ length: 10 }, (_, k) => '<i class="' + (st.son || k + 1 < i ? 'done' : k + 1 === i ? 'now' : '') + '"></i>').join('');
    let side = '';
    if (st.olcum) side = '<div class="olc"><b id="rb">0' + u('sn') + '</b><small>' + u('gecen') + ' · ' + u('olcS') + '</small><span class="bar"><i></i></span></div>';
    if (st.secim) side = '<div class="choice"><button type="button" class="g" data-c="evet">' + u('evet') + '</button><button type="button" data-c="bitti">' + u('bitti') + '</button></div>';
    $('#sSide').innerHTML = side;
    if (!kamera) foto(st.img || (i === GERI_AL ? 'A' : 'K'));
    $('#printer').hidden = kamera || !yaziciVar(); $('#printer').dataset.ad = u('yazici'); $('#printer').classList.toggle('paper', !!st.yazici);
    const izle = kamIzler(st), elleAdim = !izle && !st.oto && !st.secim && !st.son && st.bekle;
    $('#det').className = 'det'; $('#det').hidden = !(izle || elleAdim);
    $('#detT').textContent = izle ? u('bekle') + t[3] : u('elleDet');
    $('#elleBtn').hidden = !elleAdim; $('#elleBtn').textContent = u('elle');
    requestAnimationFrame(() => vurgu(st.bolge, 'ok', izle ? t[3] : ''));
    if (st.olcum) { const t0 = Date.now(); sayac = setInterval(() => { const rb = $('#rb'); if (!rb) return clearInterval(sayac); rb.textContent = Math.round((Date.now() - t0) / 1000) + u('sn'); }, 1000); }
    if (st.son) konfeti();
    $('#who').innerHTML = ziy ? '<b>' + esc(ziy.ad) + '</b> · ' + esc(ziy.firma) : '';
    if (sesli) {
      const soz = typeof t[2] === 'function' ? t[2](adSoy()) : t[2];
      konus(soz, () => adimSonrasi(), st.son ? 'happy' : '');
    }
    durKur();
  }
  // Konuşma bitince: kendiliğinden ilerleme, koşul zaten sağlanmışsa ilerleme, son adımda kapanış
  function adimSonrasi() {
    const st = S[i];
    if (bekleyen) { const f = bekleyen; bekleyen = null; f(); return; }
    if (st.oto) { const n = i; otoT = setTimeout(() => { if (i === n && akis) git(i + 1); }, st.oto); }
    if (st.yazici && !kamIzlerYazici()) { const n = i; otoT = setTimeout(() => { if (i === n && akis) git(i + 1); }, 12000); }
    if (st.son) { bitir(); return; }
    kontrol();
  }
  const kamIzlerYazici = () => kamera && Gorus.hazir('yazici');

  function git(n) {
    if (!akis) return;
    i = Math.max(0, Math.min(SON, n)); kagitGoruldu = false;
    ciz();
  }
  function algilandi(sonraki) {
    const t = metin();
    $('#det').className = 'det ok'; $('#detT').textContent = t[3] || '';
    $('#step').className = 'step okk';
    const n = i; setTimeout(() => { if (i === n && akis) git(sonraki ?? i + 1); }, 650);
  }

  // ---- kamera olayları ----
  function kontrol() {
    if (!akis || konusuyor) return;
    const st = S[i];
    if (st.atla && kamera && Gorus.durum(st.atla[0]) === st.atla[1]) { clearTimeout(otoT); algilandi(st.atla[2]); return; }
    if (st.yazici && kamIzlerYazici()) { if (Gorus.durum('yazici') === 'kagit') kagitGoruldu = true; if (kagitGoruldu && Gorus.durum('yazici') === 'bos') algilandi(); return; }
    if (i === GERI_AL && kamera && Gorus.hazir('hazne') && Gorus.hazir('kapak') && Gorus.durum('kapak') !== 'acik') return;  // hazne yalnız kapak açıkken görülür
    if (kamIzler(st) && Gorus.durum(st.bekle[0]) === st.bekle[1]) algilandi();
  }
  Gorus.olay((ad, durum) => {
    if (!akis) return;
    durKur();
    if (S[i].yazici && ad === 'yazici' && durum === 'kagit') kagitGoruldu = true;  // rehber konuşurken çıkıp alınsa da kaçmasın
    if (i === 7 && ad === 'kapak' && durum === 'acik') { hata('olcKapak', () => git(5)); return; }
    if ((i === 5 || i === 6) && ad === 'ekran' && durum === 'olcuyor' && Gorus.durum('kapak') === 'acik') { hata('sira'); return; }
    kontrol();
  });

  // Hareketsizlik: 25 sn ilerleme yoksa adımı yeniden anlat; aynı adımda 3. kez → görevli
  function durKur() {
    clearTimeout(durT);
    if (!akis || i === 0 || i >= SECIM || i === 7 || S[i].oto) return;
    const n = i;
    durT = setTimeout(() => {
      if (!akis || i !== n || konusuyor) return durKur();
      dur[n] = (dur[n] || 0) + 1;
      if (dur[n] >= 3) { dur[n] = 0; gorevliCagir('Adım ' + n + ': ' + metin(n)[0] + ' (3 kez takıldı)'); return; }
      hata('dur', () => ciz());
    }, 25000);
  }
  function hata(k, sonra) {
    const h = HATA[k];
    sus();
    if (h.img && !kamera) foto(h.img);
    $('#step').className = 'step err';
    requestAnimationFrame(() => vurgu(h.bolge || S[i].bolge, 'err', ''));
    konus(h[lang], sonra || (() => { durKur(); }), 'sad');
  }
  function gorevliCagir(neden) {
    hata('gorevli');
    api('rehber_olay', { tip: 'gorevli', kod: ziy && !ziy.deneme ? ziy.kod : '', aciklama: neden || 'misafir düğmeye bastı' }).catch(() => {});
  }

  // ---- ziyaret akışı ----
  function basla(z) {
    ziy = z; akis = true; i = 0; parca = 1; dur = {}; uyari = {}; lang = 'tr'; dilUygula();
    $('#qa').innerHTML = ''; goster('akis'); ciz();
  }
  function bitir() {
    if (ziy && !ziy.deneme && ziy.kod) api('rehber_olay', { tip: 'bitti', kod: ziy.kod, aciklama: parca + ' parça' }).catch(() => {});
    const k = ziy && ziy.kod;
    setTimeout(() => { if (akis && i === SON && (!ziy || ziy.kod === k)) { akis = false; ziy = null; bitenler.add(k); lang = 'tr'; dilUygula(); goster('bekle'); } }, 15000);
  }
  const bitenler = new Set();  // sunucu kapatana kadar aynı ziyaret yeniden başlamasın

  function sureKontrol() {
    if (!akis || !ziy || !ziy.bitis) { $('#kalan').textContent = '—'; return; }
    const kalan = ziy.bitis - (Date.now() + fark), dk = Math.max(0, Math.ceil(kalan / 60e3)), kut = $('#kalanKut');
    $('#kalan').textContent = dk + u('dk');
    kut.classList.toggle('warn', kalan <= 5 * 60e3 && kalan > 0); kut.classList.toggle('err', kalan <= 0);
    if (i >= SON) return;
    if (kalan <= 5 * 60e3 && kalan > 0 && !uyari.bes) { uyari.bes = true; sus(); konus(SURE.bes[lang], () => adimSonrasi()); }
    if (kalan <= 0 && !uyari.doldu) { uyari.doldu = true; sus(); konus(SURE.doldu[lang], () => { if (i < GERI_AL) git(GERI_AL); else if (i !== SON) git(SON); }, 'sad'); }
  }

  // ---- sesli komut ve soru ----
  let tanima = null, dinleAcik = false;
  function dinlemeyiBaslat() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { micGoster(false); return; }
    tanima = new SR(); tanima.continuous = true; tanima.interimResults = false; tanima.lang = lang === 'tr' ? 'tr-TR' : 'en-GB';
    tanima.onresult = e => {
      for (let k = e.resultIndex; k < e.results.length; k++) if (e.results[k].isFinal) {
        const m = e.results[k][0].transcript.trim();
        if (!m || konusuyor || Date.now() - sonKonusma < 700) continue;  // kendi sesini duymasın
        niyet(m);
      }
    };
    tanima.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { dinleAcik = false; micGoster(false); } };
    tanima.onend = () => { if (dinleAcik) setTimeout(() => { try { tanima.lang = lang === 'tr' ? 'tr-TR' : 'en-GB'; tanima.start(); } catch { /* zaten açık */ } }, 300); };
    dinleAcik = true; micGoster(true);
    try { tanima.start(); } catch { /* yok */ }
  }
  function micGoster(acik) { $('#mic').classList.toggle('on', acik); $('#tMic').textContent = acik ? u('mic') : u('micYok'); $('#tMicS').textContent = acik ? u('micS') : ''; }
  function niyet(m) {
    if (!akis) return;
    const k = m.toLowerCase().replace(/[.,!?]/g, ''), kisa = k.split(/\s+/).length <= 3;
    if (S[i].secim && /\b(evet|olur|tabii|yes|sure)\b/.test(k)) return secim('evet');
    if (S[i].secim && /\b(bitti|hayır|yok|teşekkür|done|no|finished)\b/.test(k)) return secim('bitti');
    if (kisa && /\b(tekrar|bir daha|anlamadım|repeat|again)\b/.test(k)) return ciz();
    if (/\b(görevli|yetkili|yardım edin|staff|help me)\b/.test(k) && kisa) return gorevliCagir('misafir sesle istedi');
    const st = S[i], elleAdim = !kamIzler(st) && st.bekle;
    if (kisa && elleAdim && /\b(tamam|yaptım|oldu|koydum|açtım|kapattım|bastım|aldım|devam|okay|ok|done|next)\b/.test(k)) return algilandi();
    if (kisa && /\b(evet|bitti|tamam|ok)\b/.test(k)) { konus(u('anladim') + metin()[1], () => adimSonrasi()); return; }
    if (k.split(/\s+/).length >= 2) sor(m);
  }
  function secim(c) { if (c === 'evet') { parca++; git(2); } else git(SON); }
  async function sor(m) {
    sus(); clearTimeout(durT);
    avatar('listen'); $('#tMic').textContent = u('dinle');
    $('#cap').innerHTML = '<span class="w on" style="color:#A8A29E">“' + esc(m) + '”</span>';
    setTimeout(() => avatar('think'), 500);
    let j;
    try { j = await api('rehber_soru', { soru: m, dil: lang, kod: ziy && !ziy.deneme ? ziy.kod : '', adim_ad: metin()[0] }); }
    catch { j = { cevap: lang === 'tr' ? 'Şu an cevap veremiyorum; sorunuzu görevlimize iletebilirsiniz.' : 'I cannot answer right now; please ask our staff.', etiket: 'yon' }; }
    micGoster(dinleAcik);
    const tg = TAG[j.etiket] || TAG.ok;
    $('#qa').innerHTML = '<p><b>' + u('siz') + ':</b> ' + esc(m) + '</p><p><b>' + u('rehber') + ':</b> ' + esc(j.cevap) + '<span class="tag" style="--c:' + tg[0] + '">' + (lang === 'tr' ? tg[1] : tg[2]) + '</span></p>';
    konus(j.cevap, () => setTimeout(() => { $('#cap').innerHTML = '<span class="w on" style="color:#A8A29E">' + esc(u('devam') + metin()[0]) + '</span>'; adimSonrasi(); durKur(); }, 900));
  }

  // ---- panel komutları ----
  function komut(c) {
    if (!c) return;
    if (sonKomut === null) { sonKomut = c.no; return; }  // açılışta eski komutu yeniden uygulama
    if (c.no <= sonKomut) return;
    sonKomut = c.no;
    if (c.tip === 'deneme') { bitenler.clear(); basla({ kod: 'DENEME', ad: lang === 'tr' ? 'Deneme Misafir' : 'Test Guest', firma: 'PURIX Deneme', kisi: 1, bitis: Date.now() + fark + 45 * 60e3, deneme: true }); return; }
    if (!akis) return;
    sus(); bekleyen = null;
    if (c.tip === 'ileri') git(i === SECIM ? SON : i + 1);
    else if (c.tip === 'geri') git(i - 1);
    else if (c.tip === 'tekrar') ciz();
    else if (c.tip === 'basla') git(0);
    else if (c.tip === 'bitir') git(SON);
  }

  // ---- sunucu döngüsü ----
  let ilk = true;
  async function durumSor() {
    if (!cihaz) return;
    try {
      const j = await api('rehber_durum', { adim: akis ? i : 0, durum: akis ? metin()[0] : 'bekleme', kod: ziy ? ziy.kod : '', mod: kamera ? 'kamera' : 'elle', kalibrasyon: ilk });
      fark = j.simdi - Date.now();
      if (ilk) { ilk = false; if (j.kalibrasyon && j.kalibrasyon.veri && !Object.keys(Gorus.kalibrasyon().bolgeler).length) Gorus.kalibrasyonYukle(j.kalibrasyon.veri); }
      $('#bkS').textContent = j.sube ? (lang === 'tr' ? 'Mağaza · ' : 'Store · ') + j.sube.ad : '';
      komut(j.komut);
      const z = j.ziyaret;
      if (z && !bitenler.has(z.kod) && (!akis || (ziy && ziy.deneme))) { if (!akis) basla(z); }
      else if (z && akis && ziy && ziy.kod === z.kod) ziy.bitis = z.bitis;
    } catch (e) { /* ağ: bir sonraki turda yeniden */ }
  }

  // ---- katmanlar ----
  function goster(k) {
    $('#katEs').hidden = k !== 'es'; $('#katBekle').hidden = k !== 'bekle';
    if (k === 'bekle') { sus(); clearTimeout(durT); avatar(''); }
  }
  let esKod = null, esT = null;
  async function eslestir() {
    clearTimeout(esT); if (cihaz) return;
    try {
      if (!esKod || esKod.bitis - Date.now() - fark < 30e3) { esKod = await api('kapi_eslestir_baslat', { tur: 'rehber' }); if (esKod.simdi) fark = esKod.simdi - Date.now(); }
      const k = esKod.kod;
      $('#esKod').innerHTML = k.slice(0, 3).split('').map(c => '<span>' + c + '</span>').join('') + '<span class="gap"></span>' + k.slice(3).split('').map(c => '<span>' + c + '</span>').join('');
      $('#esP').textContent = 'Panelde Randevular → Şube ayarları → Kapı tableti ve rehber ekranı bölümüne bu kodu girin.';
      $('#esS').textContent = 'Kod ' + Math.max(1, Math.ceil((esKod.bitis - Date.now() - fark) / 60e3)) + ' dakika daha geçerli.';
      const d = await api('kapi_eslestir_durum', { kod: esKod.kod, gizli: esKod.gizli });
      if (d.durum === 'tamam') { cihaz = d.cihaz; depo.yaz(DEPO, cihaz); esKod = null; ilk = true; goster('bekle'); durumSor(); return; }
      if (d.durum !== 'bekle') esKod = null;
    } catch { /* yeniden dene */ }
    esT = setTimeout(eslestir, 3000);
  }

  // ---- kurulum (kalibrasyon) ----
  let kurSec = null, ciziyor = null, kurT = null;
  async function kurulumAc() {
    $('#kur').hidden = false;
    const kv = $('#kvid');
    if (!kamera) { try { await kameraBaslat(); } catch (e) { $('#kurNot').textContent = 'Kamera açılamadı: ' + e.message; } }
    kv.srcObject = $('#vid').srcObject; kv.play().catch(() => {});
    const sel = $('#kamSec'), l = await Gorus.kameralar();
    sel.innerHTML = '<option value="">Kamera: varsayılan</option>' + l.map((d, n) => '<option value="' + esc(d.deviceId) + '"' + (Gorus.kalibrasyon().kamera === d.deviceId ? ' selected' : '') + '>' + esc(d.label || 'Kamera ' + (n + 1)) + '</option>').join('');
    kurCiz(); clearInterval(kurT); kurT = setInterval(kurCiz, 400);
  }
  function kurCiz() {
    const a = Gorus.anlik(), B = Gorus.BOLGE;
    $('#kurListe').innerHTML = Object.keys(B).map(ad => {
      const x = a[ad], d = B[ad].durumlar, simdi = x.durum ? d[x.durum] + (x.guven != null ? ' · %' + Math.round(x.guven * 100) : '') : (x.hazir ? '…' : 'kurulmadı');
      return '<div class="blg' + (kurSec === ad ? ' sec' : '') + '"><h3>' + B[ad].ad + '<span class="' + (x.durum ? 'ok' : '') + '">şu an: ' + simdi + '</span></h3><div class="btns"><button type="button" class="c" data-ciz="' + ad + '">' + (x.bolge ? 'Yeniden çiz' : 'Çiz') + '</button>' +
        (x.bolge ? Object.entries(d).map(([k, ad2]) => '<button type="button" data-orn="' + ad + ':' + k + '">Örnek: ' + ad2 + ' (' + (x.sayi[k] || 0) + ')</button>').join('') + '<button type="button" data-sil="' + ad + '">Sil</button>' : '') + '</div></div>';
    }).join('');
    const cv = $('#kcv'), g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    for (const [ad, x] of Object.entries(a)) if (x.bolge) {
      g.lineWidth = 4; g.strokeStyle = kurSec === ad ? '#E4CB93' : x.durum ? '#4FB477' : '#E0A84A';
      g.strokeRect(x.bolge.x * cv.width, x.bolge.y * cv.height, x.bolge.w * cv.width, x.bolge.h * cv.height);
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x.bolge.x * cv.width, x.bolge.y * cv.height, 260, 30);
      g.fillStyle = '#fff'; g.font = '18px sans-serif'; g.fillText(B[ad].ad + (x.durum ? ' · ' + B[ad].durumlar[x.durum] : ''), x.bolge.x * cv.width + 8, x.bolge.y * cv.height + 21);
    }
    if (ciziyor && ciziyor.son) { g.strokeStyle = '#E4CB93'; g.setLineDash([10, 6]); const r = ciziyor; g.strokeRect(r.x * cv.width, r.y * cv.height, (r.son.x - r.x) * cv.width, (r.son.y - r.y) * cv.height); g.setLineDash([]); }
    $('#kurIpucu').textContent = kurSec ? kurSec && ciziyor ? 'Çerçeveyi bırakınca bölge kaydedilir.' : '"' + B[kurSec].ad + '" için görüntüde fareyle çerçeve çizin.' : (Q.get('sahte') === '1' ? 'Deneme sahnesi: 1 kişi · 2 kapak · 3 hazne · 4 ekran · 5 yazıcı tuşlarıyla durumu değiştirin.' : '');
  }
  const noktaAl = e => { const r = $('#kcv').getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }; };
  $('#kcv').addEventListener('mousedown', e => { if (!kurSec) return; const p = noktaAl(e); ciziyor = { x: p.x, y: p.y, son: p }; });
  $('#kcv').addEventListener('mousemove', e => { if (ciziyor) { ciziyor.son = noktaAl(e); kurCiz(); } });
  addEventListener('mouseup', () => {
    if (!ciziyor || !kurSec) return;
    const r = ciziyor, x = Math.min(r.x, r.son.x), y = Math.min(r.y, r.son.y), w = Math.abs(r.son.x - r.x), h = Math.abs(r.son.y - r.y);
    ciziyor = null; if (w > .01 && h > .01) { Gorus.bolgeAyarla(kurSec, { x, y, w, h }); kurSec = null; } kurCiz();
  });
  $('#kurListe').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ciz) { kurSec = b.dataset.ciz; kurCiz(); }
    if (b.dataset.orn) { const [ad, d] = b.dataset.orn.split(':'); b.disabled = true; try { await Gorus.ornekEkle(ad, d); } catch (err) { $('#kurNot').textContent = err.message; } kurCiz(); }
    if (b.dataset.sil && confirm('Bu bölge ve örnekleri silinsin mi?')) { Gorus.bolgeSil(b.dataset.sil); kurCiz(); }
  });
  $('#kamSec').addEventListener('change', async e => { Gorus.kameraSec(e.target.value); Gorus.durdur(); kamera = false; await kameraBaslat().catch(err => { $('#kurNot').textContent = 'Kamera açılamadı: ' + err.message; }); $('#kvid').srcObject = $('#vid').srcObject; $('#kvid').play().catch(() => {}); });
  $('#kurKaydet').addEventListener('click', async () => {
    try { await api('rehber_kalibrasyon', { veri: Gorus.kalibrasyon() }); $('#kurNot').textContent = 'Kaydedildi (bu bilgisayarda ve sunucuda). ' + new Date().toLocaleTimeString('tr-TR'); }
    catch (e) { $('#kurNot').textContent = 'Bu bilgisayarda kaydedildi; sunucuya kaydedilemedi (' + e.message + ').'; }
    kameraModu();
  });
  $('#kurKapat').addEventListener('click', () => { $('#kur').hidden = true; clearInterval(kurT); kurSec = null; kameraModu(); if (akis) ciz(false); });
  $('#kurAc').addEventListener('click', kurulumAc);

  // ---- kamera ----
  async function kameraBaslat() {
    const v = $('#vid');
    await Gorus.baslat(v, Q.get('sahte') === '1' ? Gorus.sahteSahne() : null);
    kameraModu();
  }
  function kameraModu() {
    const a = Gorus.anlik(), hazirSay = Object.values(a).filter(x => x.hazir).length;
    kamera = !!$('#vid').srcObject && hazirSay > 0;
    $('#cam').classList.toggle('canli', kamera); $('#cam').classList.toggle('foto', !kamera);
    $('#ckutu').hidden = !kamera; $('#dev').hidden = kamera;
    $('#tCam').textContent = kamera ? u('camK') : u('camF');
  }

  // ---- dil, saat, ölçek ----
  function dilUygula() {
    document.documentElement.lang = lang;
    $$('.lang button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.l === lang)));
    $('#tKalan').textContent = u('kalan'); $('#tTekrar').textContent = u('tekrar'); $('#tCagir').textContent = u('cagir');
    $('#tCam').textContent = kamera ? u('camK') : u('camF'); micGoster(dinleAcik);
    if (tanima) { try { tanima.stop(); } catch { /* yok */ } }  // onend yeni dille yeniden başlatır
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => { lang = b.dataset.l; dilUygula(); $('#qa').innerHTML = ''; if (akis) ciz(); }));
  $('#tekrar').addEventListener('click', () => { if (akis) ciz(); });
  $('#cagir').addEventListener('click', () => gorevliCagir('misafir düğmeye bastı'));
  $('#elleBtn').addEventListener('click', () => { if (akis) algilandi(); });
  $('#sSide').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (b) secim(b.dataset.c); });
  addEventListener('keydown', e => {  // görevli klavyesi: → ileri, ← geri, R tekrar, K kurulum
    if (!$('#kur').hidden || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowRight' && akis) git(i === SECIM ? SON : i + 1);
    else if (e.key === 'ArrowLeft' && akis) git(i - 1);
    else if ((e.key === 'r' || e.key === 'R') && akis) ciz();
    else if (e.key === 'k' || e.key === 'K') kurulumAc();
  });
  function saat() { const d = new Date(Date.now() + fark + 3 * 3600e3); $('#saat').textContent = hhmm(d.getUTCHours() * 60 + d.getUTCMinutes()); }
  function konfeti() {
    const c = document.createElement('div'); c.className = 'confetti'; const renk = ['#E4CB93', '#B48C50', '#8B5E14', '#F5F2EC', '#C9A465'];
    for (let k = 0; k < 70; k++) { const e = document.createElement('i'); e.style.left = Math.random() * 100 + '%'; e.style.background = renk[k % 5]; e.style.animationDelay = Math.random() * .8 + 's'; c.appendChild(e); }
    $('#scr').appendChild(c); setTimeout(() => c.remove(), 3800);
  }
  function sigdir() { const s = Math.min(innerWidth / 1920, innerHeight / 1080); $('#tv').style.transform = 'translate(' + (innerWidth - 1920 * s) / 2 + 'px,' + (innerHeight - 1080 * s) / 2 + 'px) scale(' + s + ')'; }
  addEventListener('resize', sigdir); sigdir();
  $('#katBasla svg').innerHTML = $('#av').innerHTML;  // başlat ekranındaki karakter

  // ---- açılış ----
  async function ac() {
    $('#katBasla').hidden = true;
    if ('speechSynthesis' in window) { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; }
    dilUygula();
    if (Q.get('sahte') === '1' || Object.keys(Gorus.kalibrasyon().bolgeler).length || Q.get('kamera') === '1') { try { await kameraBaslat(); } catch (e) { console.warn('Kamera açılamadı', e); } }
    dinlemeyiBaslat();
    if (!cihaz) { goster('es'); eslestir(); } else { goster('bekle'); await durumSor(); }
    setInterval(durumSor, 3000); setInterval(sureKontrol, 5000); setInterval(saat, 15000); saat();
    if (Q.get('kurulum') === '1') kurulumAc();
    if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {});
  }
  if (Q.get('oto') === '1') ac();
  else { const bir = () => { removeEventListener('pointerdown', bir); removeEventListener('keydown', bir); ac(); }; addEventListener('pointerdown', bir); addEventListener('keydown', bir); }
  dilUygula(); saat();
})();
