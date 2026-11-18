/* AUTOBARRIER · lecture du n° de lot imprimé (OCR) — V13.22.3
   Le module de lecture (Tesseract.js) n'est chargé qu'au premier appui sur « Lire le lot ». Rien n'est conservé ni envoyé. */
(function (root) {
  'use strict';
  var CFG = root.OCR_CFG || {
    script: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
    opts: {}   /* par défaut : worker, moteur et langue chargés depuis le même CDN */
  };
  var worker = null, chargement = null;
  function charger() {
    if (worker) return Promise.resolve(worker);
    if (chargement) return chargement;
    chargement = new Promise(function (ok, ko) {
      function creer() {
        root.Tesseract.createWorker('eng', 1, CFG.opts).then(function (w) {
          return w.setParameters({ tessedit_char_whitelist: '0123456789', tessedit_pageseg_mode: '6' }).then(function () { worker = w; ok(w); });
        }).catch(ko);
      }
      if (root.Tesseract) return creer();
      var s = document.createElement('script'); s.src = CFG.script; s.onload = creer; s.onerror = function () { ko(new Error('réseau')); };
      document.head.appendChild(s);
    }).catch(function (e) { chargement = null; throw e; });
    return chargement;
  }
  /* texte brut → n° de lot : la plus longue suite de chiffres (6 à 14), à défaut la plus longue */
  function extraire(txt) {
    var L = String(txt || '').replace(/[Oo]/g, '0').match(/\d{4,}/g) || [];
    L.sort(function (a, b) { return b.length - a.length; });
    var bon = L.filter(function (x) { return x.length >= 6 && x.length <= 14; })[0];
    return bon || L[0] || '';
  }
  /* image prétraitée : niveaux de gris, étirement du contraste, largeur ~1000 px */
  function preparer(src) {
    var k = Math.min(3, 1000 / src.width), c = document.createElement('canvas'); c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
    var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(src, 0, 0, c.width, c.height);
    var im = x.getImageData(0, 0, c.width, c.height), d = im.data, i, g, mn = 255, mx = 0;
    for (i = 0; i < d.length; i += 4) { g = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000; d[i] = g; if (g < mn) mn = g; if (g > mx) mx = g; }
    var f = mx > mn ? 255 / (mx - mn) : 1;
    for (i = 0; i < d.length; i += 4) { g = (d[i] - mn) * f; d[i] = d[i + 1] = d[i + 2] = g; }
    x.putImageData(im, 0, 0); return c;
  }
  /* la ligne de chiffres la plus proche du centre du cadre (c'est là que l'on place le n° de lot) */
  function choisir(data, hauteur) {
    var best = '', bd = 1e9;
    (data.lines || []).forEach(function (l) {
      var n = String(l.text || '').replace(/[Oo]/g, '0').replace(/\D/g, '');
      if (n.length < 5 || n.length > 14 || !l.bbox) return;
      var d = Math.abs((l.bbox.y0 + l.bbox.y1) / 2 - hauteur / 2);
      if (d < bd) { bd = d; best = n; }
    });
    return best || extraire(data.text);
  }
  function lire(canvas) {
    var p = preparer(canvas);
    return charger().then(function (w) { return w.recognize(p); }).then(function (r) { return { texte: r.data.text, lot: choisir(r.data, p.height) }; });
  }
  root.ABOcr = { lire: lire, extraire: extraire, charger: charger };
})(typeof window !== 'undefined' ? window : this);
