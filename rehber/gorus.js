/* PURIX Rehber · görüş katmanı (masa kamerası). Görüntü bu bilgisayarda işlenir; hiçbir kare sunucuya gitmez.
   Yöntem: kalibrasyonda her bölge (kapak, hazne, cihaz ekranı, yazıcı, masa önü) için her durumun küçük gri örnekleri alınır;
   çalışırken bölgenin anlık görüntüsü en yakın örneğe göre sınıflanır, birkaç kare kararlı kalınca "değişti" olayı verilir.
   Yapay zekâ modeli gerekmez; kamera ve masa düzeni sabit kaldıkça güvenilirdir. Işık ya da kamera yeri değişirse yeniden kalibre edilir. */
(function () {
  'use strict';
  const N = 24;               // örnek: 24×24 gri
  const FPS = 6, KARARLI = 4; // 4 kare (~0.7 sn) aynı sonuç → değişim
  const BOLGE = {
    alan: { ad: 'Masa önü (kişi)', durumlar: { bos: 'Boş', kisi: 'Kişi var' } },
    kapak: { ad: 'Kapak', durumlar: { kapali: 'Kapalı', acik: 'Açık' } },
    hazne: { ad: 'Hazne (kapak açıkken)', durumlar: { bos: 'Boş', dolu: 'Altın var' } },
    ekran: { ad: 'Cihaz ekranı', durumlar: { bekle: 'Hazır / boşta', olcuyor: 'Ölçüyor', sonuc: 'Sonuç' } },
    yazici: { ad: 'Yazıcı çıkışı', durumlar: { bos: 'Kâğıt yok', kagit: 'Kâğıt var' } }
  };
  const DEPO = 'purix-rehber-kalibrasyon';
  let video = null, akis = null, cv = null, g = null, zt = null, kal = bos(), dinle = [], son = {}, aday = {}, say = {}, guven = {};

  function bos() { return { surum: 1, kamera: '', bolgeler: {} }; }
  function depoOku() { try { const x = JSON.parse(localStorage.getItem(DEPO) || 'null'); if (x && x.bolgeler) kal = x; } catch { /* yok */ } }
  function depoYaz() { try { localStorage.setItem(DEPO, JSON.stringify(kal)); } catch { /* dolu ya da kapalı */ } }
  depoOku();

  // Bölgenin anlık örneği (0–255 gri, N×N)
  function ornek(b) {
    if (!video || !video.videoWidth || !b) return null;
    const W = video.videoWidth, H = video.videoHeight;
    const sx = Math.max(0, b.x * W), sy = Math.max(0, b.y * H), sw = Math.max(4, b.w * W), sh = Math.max(4, b.h * H);
    g.drawImage(video, sx, sy, sw, sh, 0, 0, N, N);
    const d = g.getImageData(0, 0, N, N).data, o = new Array(N * N);
    for (let i = 0; i < N * N; i++) o[i] = Math.round(d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114);
    return o;
  }
  // Uzaklık: parlaklık farkı az etkiler (ortalama çıkarılır), desen farkı çok etkiler
  function uzaklik(a, b) {
    let ma = 0, mb = 0; for (let i = 0; i < a.length; i++) { ma += a[i]; mb += b[i]; } ma /= a.length; mb /= b.length;
    let t = 0; for (let i = 0; i < a.length; i++) t += Math.abs((a[i] - ma) - (b[i] - mb));
    return t / a.length / 255 + .3 * Math.abs(ma - mb) / 255;
  }
  function siniflandir(ad, o) {
    const b = kal.bolgeler[ad]; if (!b || !o) return null;
    const enYakin = [];
    for (const [durum, liste] of Object.entries(b.ornek || {})) if (liste && liste.length) enYakin.push([durum, Math.min(...liste.map(r => uzaklik(o, r)))]);
    if (enYakin.length < 2) return null;
    enYakin.sort((p, q) => p[1] - q[1]);
    const [[en, enD], [, ikinci]] = enYakin;
    return { durum: en, guven: Math.max(0, Math.min(1, (ikinci - enD) / (ikinci + 1e-6))) };
  }
  const hazir = ad => { const b = kal.bolgeler[ad]; return !!(b && b.ornek && Object.values(b.ornek).filter(l => l && l.length).length >= 2); };

  function dongu() {
    for (const ad of Object.keys(kal.bolgeler)) {
      if (!hazir(ad)) continue;
      const s = siniflandir(ad, ornek(kal.bolgeler[ad])); if (!s) continue;
      guven[ad] = s.guven;
      if (s.guven < .12) continue;  // iki durum arasında kararsız: bekle
      if (aday[ad] === s.durum) say[ad] = (say[ad] || 0) + 1; else { aday[ad] = s.durum; say[ad] = 1; }
      if (say[ad] >= KARARLI && son[ad] !== s.durum) { const eski = son[ad]; son[ad] = s.durum; dinle.forEach(f => { try { f(ad, s.durum, eski); } catch (e) { console.error(e); } }); }
    }
  }

  async function baslat(v, kaynak) {
    video = v; cv = document.createElement('canvas'); cv.width = cv.height = N; g = cv.getContext('2d', { willReadFrequently: true });
    if (kaynak) akis = kaynak;
    else {
      const sec = kal.kamera ? { deviceId: { exact: kal.kamera } } : { facingMode: 'environment' };
      try { akis = await navigator.mediaDevices.getUserMedia({ video: { ...sec, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
      catch (e) { if (!kal.kamera) throw e; akis = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }
    }
    video.srcObject = akis; video.muted = true; video.playsInline = true; await video.play();
    clearInterval(zt); zt = setInterval(dongu, 1000 / FPS);
    return true;
  }
  function durdur() { clearInterval(zt); if (akis) akis.getTracks().forEach(t => t.stop()); akis = null; }
  async function kameralar() { try { return (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput'); } catch { return []; } }

  // Kalibrasyon işlemleri
  function bolgeAyarla(ad, r) { const b = kal.bolgeler[ad] || (kal.bolgeler[ad] = { ornek: {} }); Object.assign(b, { x: +r.x.toFixed(4), y: +r.y.toFixed(4), w: +r.w.toFixed(4), h: +r.h.toFixed(4) }); b.ornek = {}; delete son[ad]; depoYaz(); }
  async function ornekEkle(ad, durum) {
    const b = kal.bolgeler[ad]; if (!b) throw new Error('Önce bölgeyi çizin');
    const l = (b.ornek[durum] = b.ornek[durum] || []);
    for (let k = 0; k < 3; k++) { const o = ornek(b); if (o) l.push(o); await new Promise(r => setTimeout(r, 180)); }
    while (l.length > 12) l.shift();  // durum başına en çok 12 örnek
    depoYaz(); return l.length;
  }
  function ornekSil(ad, durum) { const b = kal.bolgeler[ad]; if (b && b.ornek) { delete b.ornek[durum]; depoYaz(); } }
  function bolgeSil(ad) { delete kal.bolgeler[ad]; delete son[ad]; depoYaz(); }
  function kalibrasyon() { return JSON.parse(JSON.stringify(kal)); }
  function kalibrasyonYukle(k) { if (k && k.bolgeler) { kal = k; son = {}; aday = {}; say = {}; depoYaz(); } }
  function kameraSec(id) { kal.kamera = id || ''; depoYaz(); }
  function anlik() { const o = {}; for (const ad of Object.keys(BOLGE)) o[ad] = { hazir: hazir(ad), durum: son[ad] || null, guven: guven[ad] ?? null, bolge: kal.bolgeler[ad] ? { x: kal.bolgeler[ad].x, y: kal.bolgeler[ad].y, w: kal.bolgeler[ad].w, h: kal.bolgeler[ad].h } : null, sayi: kal.bolgeler[ad] ? Object.fromEntries(Object.entries(kal.bolgeler[ad].ornek || {}).map(([k, v]) => [k, v.length])) : {} }; return o; }

  // Deneme sahnesi (?sahte=1): kamera olmadan tüm akışı denemek için çizilmiş masa. Tuşlar: 1 kişi, 2 kapak, 3 hazne, 4 ekran, 5 yazıcı
  function sahteSahne() {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360; const x = c.getContext('2d');
    const d = { kisi: false, kapak: false, hazne: false, ekran: 0, kagit: false };
    function ciz() {
      x.fillStyle = '#d9d4cc'; x.fillRect(0, 0, 640, 360); x.fillStyle = '#bdb6ac'; x.fillRect(0, 250, 640, 110);
      if (d.kisi) { x.fillStyle = '#5a4a3c'; x.beginPath(); x.ellipse(110, 320, 70, 50, 0, 0, 7); x.fill(); }
      x.fillStyle = '#f4f2ee'; x.fillRect(200, 110, 240, 160);                                    // cihaz gövdesi
      x.fillStyle = d.kapak ? '#3a3532' : '#2b2724'; if (d.kapak) x.fillRect(205, 30, 230, 40); else x.fillRect(200, 90, 240, 26); // kapak
      x.fillStyle = d.kapak ? '#8f877e' : '#f4f2ee'; x.fillRect(285, 118, 70, 26);                // hazne (kapak açıkken görünür)
      if (d.kapak && d.hazne) { x.fillStyle = '#E4CB93'; x.beginPath(); x.arc(320, 131, 11, 0, 7); x.fill(); }
      x.fillStyle = ['#1c2a3a', '#2f5d8a', '#2f7d4a'][d.ekran]; x.fillRect(250, 160, 140, 80);   // ekran
      x.fillStyle = '#fff'; x.font = '16px sans-serif'; x.fillText(['HAZIR', 'ÖLÇÜYOR', 'SONUÇ 21,8K'][d.ekran], 262, 205);
      x.fillStyle = '#e9e6e0'; x.fillRect(500, 200, 100, 70); if (d.kagit) { x.fillStyle = '#fff'; x.fillRect(520, 150, 60, 55); x.fillStyle = '#999'; x.fillRect(528, 160, 40, 4); x.fillRect(528, 170, 34, 4); }
    }
    addEventListener('keydown', e => {
      if (e.key === '1') d.kisi = !d.kisi; else if (e.key === '2') d.kapak = !d.kapak; else if (e.key === '3') d.hazne = !d.hazne;
      else if (e.key === '4') d.ekran = (d.ekran + 1) % 3; else if (e.key === '5') d.kagit = !d.kagit; else return;
      ciz();
    });
    ciz(); setInterval(ciz, 500);
    const st = c.captureStream(10); st.sahne = d; st.ciz = ciz; return st;
  }

  window.Gorus = { BOLGE, baslat, durdur, kameralar, bolgeAyarla, ornekEkle, ornekSil, bolgeSil, kalibrasyon, kalibrasyonYukle, kameraSec, anlik, hazir, durum: ad => son[ad] || null, olay: f => dinle.push(f), sahteSahne, _uzaklik: uzaklik };
})();
