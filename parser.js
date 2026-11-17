/* AUTOBARRIER · lecture des étiquettes (identifiants de données) — V13.21
   Partagé par la page du téléphone et par les tests. Aucune donnée n'est conservée. */
(function (root) {
  'use strict';
  function norm(s) {
    return String(s == null ? '' : s).replace(/␝/g, '\x1d').replace(/␞/g, '\x1e').replace(/␄/g, '\x04').replace(/␠/g, ' ')
      .replace(/<GS>/gi, '\x1d').replace(/<RS>/gi, '\x1e').replace(/<EOT>/gi, '\x04').replace(/\r|\n/g, '').trim();
  }
  /* un code-barres → liste de {di, val}. Le code ISO 15434 ([)>␞06␝…) contient plusieurs champs ; les autres un seul. */
  function decoder(raw) {
    var s = norm(raw), out = [];
    if (!s) return out;
    if (s.indexOf('[)>') === 0) {
      s.split(/[\x1d\x1e\x04]/).slice(2).forEach(function (f) { var m = /^(\d{0,2}[A-Z])([\s\S]*)$/.exec(f); if (m) out.push({ di: m[1], val: m[2].replace(/\s+/g, ' ').trim() }); });
      out.compose = true;
    } else {
      var m = /^(\d{0,2}[A-Z])([\s\S]*)$/.exec(s);
      out.push(m ? { di: m[1], val: m[2].trim() } : { di: '', val: s });
    }
    return out;
  }
  /* ajoute un code-barres aux champs déjà lus ; renvoie le nombre de champs nouveaux ou modifiés */
  function fusion(champs, raw) {
    var n = 0, L = decoder(raw);
    if (L.compose) champs._fmt = 'iso15434';
    L.forEach(function (c) {
      var k = c.di || '#' + (c.val.length >= 6 ? 'num' : 'x');
      if (k === '#num' && champs['#num'] && champs['#num'] !== c.val) { return; }   /* premier numéro nu conservé */
      if (c.val === '' && k !== 'V') { return; }
      if (champs[k] !== c.val) { champs[k] = c.val; n++; }
    });
    return n;
  }
  function dateISO8(v) {
    var m = /^(20\d{2})(\d{2})(\d{2})$/.exec(v || '');
    if (!m) return '';
    var mo = +m[2], d = +m[3];
    return mo >= 1 && mo <= 12 && d >= 1 && d <= 31 ? m[1] + '-' + m[2] + '-' + m[3] : '';
  }
  /* champs lus → valeurs de la boîte. Le format est reconnu d'après les champs présents (aucun réglage). */
  function deduire(c) {
    var r = { format: 'autre', ref: '', qt: 0, lot: '', dlot: '', serial: '', po: '', fournisseur: '', manque: [], libres: [] };
    r.ref = String(c.P || '').replace(/\s+/g, ' ').trim();
    r.qt = parseInt(c.Q, 10) || 0;
    r.po = c.K || ''; r.fournisseur = c.V || '';
    if (c.H) {                                 /* KNAUF : lot = 3 derniers chiffres du code H ; date du lot saisie à la main */
      r.format = 'knauf'; r.lot = String(c.H).replace(/\D/g, '').slice(-3); r.serial = c['#num'] || '';
      r.manque = r.dlot ? [] : ['dlot'];
    } else if (dateISO8(c['1T'])) {            /* OneTech : 1T = date du lot ; lot = n° de boîte imprimé « Box n », saisi à la main */
      r.format = 'onetech'; r.dlot = dateISO8(c['1T']); r.serial = c['#num'] || ''; r.manque = ['lot'];
    } else if (c['1T'] || c._fmt === 'iso15434') {   /* SEAT / VW : 1T = n° de série ; pas de date lisible */
      r.format = 'seat'; r.serial = c['1T'] || c['#num'] || ''; r.lot = r.serial; r.manque = ['dlot'];
    } else { r.serial = c['#num'] || ''; r.manque = ['lot']; }
    return r;
  }
  function cleRef(s) { return String(s || '').replace(/\s+/g, '').toUpperCase(); }
  var api = { norm: norm, decoder: decoder, fusion: fusion, deduire: deduire, dateISO8: dateISO8, cleRef: cleRef };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ABParse = api;
})(typeof self !== 'undefined' ? self : this);
