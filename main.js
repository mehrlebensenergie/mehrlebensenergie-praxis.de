/* Mehr Lebensenergie — Konzept · Verhalten. Alles additiv: ohne JS bleibt die Seite lesbar. */
document.documentElement.classList.remove('kein-js');
document.documentElement.classList.add('js');
const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;
const raf = window.requestAnimationFrame || (f => setTimeout(f, 16));
if (ruhig) document.querySelectorAll('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });

/* ---------- Intro: einmal je Sitzung */
const intro = document.querySelector('.intro');
if (intro) {
  let gesehen = false; try { gesehen = !!sessionStorage.getItem('ille-intro'); } catch (e) {}
  if (gesehen || ruhig) intro.remove();
  else {
    document.body.style.overflow = 'hidden';
    setTimeout(() => { intro.classList.add('weg'); document.body.style.overflow = ''; try { sessionStorage.setItem('ille-intro', '1'); } catch (e) {} }, 3100);
    setTimeout(() => intro.remove(), 4000);
  }
}

/* ---------- Seitenwechsel: Tuschewisch */
const wisch = document.querySelector('.wisch');
if (wisch && !ruhig) {
  addEventListener('pageshow', e => { if (e.persisted) wisch.classList.remove('los'); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const h = a.getAttribute('href');
    if (!h || h.startsWith('#') || h.startsWith('mailto:') || h.startsWith('tel:') || /^https?:/.test(h)) return;
    const ziel = new URL(a.href, location.href);
    if (ziel.pathname === location.pathname) return;
    e.preventDefault();
    try { sessionStorage.setItem('ille-wipe', '1'); } catch (er) {}
    wisch.classList.add('los');
    setTimeout(() => { location.href = a.href; }, 520);
  });
}

/* ---------- Kopf: verschwindet beim Runterscrollen, kommt beim Hochscrollen */
const kopf = document.querySelector('header');
let letzterY = scrollY, ticking = false;
function beiScroll() {
  ticking = false;
  const y = scrollY;
  if (kopf) {
    kopf.classList.toggle('fest', y > 40);
    if (!document.body.classList.contains('menu-offen')) kopf.classList.toggle('weg', y > 160 && y > letzterY + 4);
  }
  letzterY = y;
  scrub();
}
addEventListener('scroll', () => { if (!ticking) { raf(beiScroll); ticking = true; } }, { passive: true });

/* ---------- Der Meridian: Punkte aus den Abschnitten, Fluss = Scrollfortschritt */
const meridian = document.querySelector('.meridian');
let punkte = [];
function meridianBauen() {
  if (!meridian) return;
  meridian.querySelectorAll('.punkt').forEach(p => p.remove());
  punkte = [...document.querySelectorAll('[data-punkt]')].map(sec => {
    const el = document.createElement('a');
    el.className = 'punkt'; el.href = '#' + (sec.id || '');
    el.innerHTML = '<i>' + sec.dataset.punkt + '</i>';
    el.addEventListener('click', ev => { ev.preventDefault(); sec.scrollIntoView({ behavior: ruhig ? 'auto' : 'smooth', block: 'start' }); });
    meridian.appendChild(el);
    return { sec, el };
  });
  meridianMessen();
}
function meridianMessen() {
  if (!meridian) return;
  const doc = document.documentElement.scrollHeight - innerHeight;
  punkte.forEach(p => {
    const top = p.sec.getBoundingClientRect().top + scrollY;
    p.top = top;
    p.el.style.top = (doc > 0 ? Math.min(98, Math.max(2, (top - innerHeight * 0.45) / doc * 100)) : 0) + '%';
  });
}
function meridianLauf() {
  if (!meridian) return;
  const doc = document.documentElement.scrollHeight - innerHeight;
  meridian.style.setProperty('--p', doc > 0 ? Math.min(1, scrollY / doc) : 0);
  const linie = scrollY + innerHeight * 0.45;
  punkte.forEach(p => {
    const an = linie >= p.top;
    if (an && !p.el.classList.contains('an')) { p.el.classList.add('an', 'frisch'); clearTimeout(p.t); p.t = setTimeout(() => p.el.classList.remove('frisch'), 1800); }
    if (!an) p.el.classList.remove('an', 'frisch');
  });
}

/* ---------- Scroll-Scrubs: Qi-Kreis, Hero-Parallax, Statement, Elemente-Rad */
const qiKreis = document.querySelector('.qi-kreis');
const heroInhalt = document.querySelector('.hero .hero-inhalt');
const statement = document.querySelector('.statement');
const statementH2 = statement && statement.querySelector('h2');
let statementWorte = [];
const rad = document.querySelector('.rad');
function scrub() {
  const y = scrollY, h = innerHeight;
  if (qiKreis) qiKreis.style.setProperty('--p', (0.5 + 0.5 * Math.min(1, y / (h * 0.85))).toFixed(3));
  if (heroInhalt && y < h * 1.2 && !ruhig) { heroInhalt.style.transform = `translateY(${(y * 0.16).toFixed(1)}px)`; heroInhalt.style.opacity = Math.max(0, 1 - y / (h * 0.8)).toFixed(3); }
  if (statement && statementWorte.length) {
    // 22.09.2026: gemessen an der H2, nicht an der Sektion — die Sektion beginnt 250 px über dem Satz,
    // damit leuchteten die ersten Wörter, bevor der Satz überhaupt im Bild war (Noah: „zu früh")
    const r = statementH2.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (h * 0.78 - r.top) / (h * 0.46))); // füllt, während der Satz durch die Bildmitte läuft (Start 78 %, voll bei 32 %)
    statement.style.setProperty('--p', p.toFixed(3));
    statementWorte.forEach((w, i) => w.classList.toggle('an', (i + 1) / statementWorte.length <= p + 0.02)); // läuft bei jedem Durchscrollen neu (Noah, 22.09.2026 abends: „wieso ist die animation jetzt wieder weg?!“)
  }
  if (rad && !ruhig) rad.style.setProperty('--rot', (y * 0.06).toFixed(1) + 'deg');
  meridianLauf();
}

/* ---------- Wörter aufteilen (Überschriften + Statement) */
function worteTeilen(knoten) {
  [...knoten.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      if (!n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) frag.appendChild(document.createTextNode(t));
        else { const i = document.createElement('i'); i.textContent = t; frag.appendChild(i); }
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'I' && n.tagName !== 'SVG') worteTeilen(n);
  });
}
document.querySelectorAll('.worte, .statement h2').forEach(el => {
  if (el.querySelector('i')) return;
  worteTeilen(el);
  el.querySelectorAll('i').forEach((w, i) => w.style.setProperty('--i', i));
});
if (statement) statementWorte = [...statement.querySelectorAll('h2 i')];

/* ---------- Reveal */
const io = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
document.querySelectorAll('.rev, .tusche, .worte, .figur').forEach(el => io.observe(el));
const nachholen = () => {
  const h = innerHeight;
  document.querySelectorAll('.rev:not(.da), .tusche:not(.da), .worte:not(.da), .figur:not(.da)').forEach(el => {
    const r = el.getBoundingClientRect(); if (r.top < h && r.bottom > 0) el.classList.add('da');
  });
};
setTimeout(nachholen, 1800); setTimeout(nachholen, 4200);

/* ---------- Zähler */
const zio = new IntersectionObserver(es => {
  es.forEach(e => {
    if (!e.isIntersecting) return; zio.unobserve(e.target);
    const el = e.target, ziel = parseFloat(el.dataset.zahl), nach = el.dataset.nach || '', vor = el.dataset.vor || '';
    const komma = (String(ziel).split('.')[1] || '').length;
    const setz = v => { el.innerHTML = vor + v.toFixed(komma).replace('.', ',') + (nach ? '<em>' + nach + '</em>' : ''); };
    if (ruhig) { setz(ziel); return; }
    const start = performance.now(), dauer = 1400;
    (function lauf(jetzt) {
      const t = Math.min(1, (jetzt - start) / dauer), e2 = 1 - Math.pow(1 - t, 3);
      setz(ziel * e2); if (t < 1) raf(lauf);
    })(start);
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-zahl]').forEach(el => zio.observe(el));

/* ---------- Video-Montage im Hero */
const montage = [...document.querySelectorAll('.hero .montage video')];
if (montage.length > 1 && !ruhig) {
  let aktiv = 0;
  montage.forEach((v, i) => { if (i === 0) v.classList.add('an'); v.play().catch(() => {}); });
  setInterval(() => {
    montage[aktiv].classList.remove('an'); aktiv = (aktiv + 1) % montage.length;
    montage[aktiv].currentTime = 0; montage[aktiv].classList.add('an'); montage[aktiv].play().catch(() => {});
  }, 3200);
}

/* ---------- Mobil-Menü */
const menuKnopf = document.querySelector('.menu-knopf'), menuFlaeche = document.querySelector('.menu-flaeche');
if (menuKnopf && menuFlaeche) {
  menuFlaeche.querySelectorAll('li').forEach((li, i) => li.style.setProperty('--i', i));
  menuKnopf.addEventListener('click', () => {
    const offen = document.body.classList.toggle('menu-offen');
    menuKnopf.setAttribute('aria-expanded', offen); menuFlaeche.hidden = !offen;
    document.body.style.overflow = offen ? 'hidden' : ''; kopf?.classList.remove('weg');
  });
  menuFlaeche.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-offen'); document.body.style.overflow = ''; }));
}

/* ---------- FAQ */
document.querySelectorAll('.faq-frage').forEach(knopf => {
  knopf.addEventListener('click', () => {
    const item = knopf.closest('.faq-item'), offen = item.classList.toggle('offen');
    knopf.setAttribute('aria-expanded', offen);
  });
});

/* ---------- Fünf Elemente: Rad und Liste sprechen miteinander */
document.querySelectorAll('.elemente').forEach(block => {
  const knoten = [...block.querySelectorAll('.knoten')], liste = [...block.querySelectorAll('.element')];
  const setz = e => { knoten.forEach(k => k.classList.toggle('an', k.dataset.e === e)); liste.forEach(l => l.classList.toggle('an', l.dataset.e === e)); };
  [...knoten, ...liste].forEach(el => {
    el.addEventListener('mouseenter', () => setz(el.dataset.e));
    el.addEventListener('click', () => setz(el.dataset.e));
    el.addEventListener('focus', () => setz(el.dataset.e));
  });
  setz('holz');
});

/* ---------- Cursor: Tuschepunkt folgt mit Verzögerung */
const cursor = document.querySelector('.cursor');
if (cursor && matchMedia('(hover:hover)').matches && !ruhig) {
  let zx = -100, zy = -100, cx = -100, cy = -100;
  addEventListener('mousemove', e => { zx = e.clientX; zy = e.clientY; cursor.classList.add('an'); }, { passive: true });
  document.addEventListener('mouseleave', () => cursor.classList.remove('an'));
  document.addEventListener('mouseover', e => {
    cursor.classList.toggle('foto', !!e.target.closest('.foto, .kachel, .galerie figure'));
    cursor.classList.toggle('link', !e.target.closest('.foto, .kachel') && !!e.target.closest('a, button, label, .element, .knoten'));
  });
  (function folge() { cx += (zx - cx) * 0.18; cy += (zy - cy) * 0.18; cursor.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; raf(folge); })();
}

/* ---------- Magnetische Knöpfe (nur Maus, klein) */
if (matchMedia('(hover:hover)').matches && !ruhig) {
  document.querySelectorAll('.hero .btn, .cta .btn, .plan .btn').forEach(b => {
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.12).toFixed(1) + 'px'); b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.18).toFixed(1) + 'px'); });
    b.addEventListener('mouseleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });
}

/* ---------- Formulare: öffnen das Mailprogramm mit allem, was eingetragen wurde.
   Kein Server, kein stiller Verlust — wer nichts abschickt, sieht das in seinem Mailprogramm. */
document.querySelectorAll('form.formular[data-mail]').forEach(form => {
  const meldung = document.createElement('p');
  meldung.className = 'form-meldung'; meldung.hidden = true;
  meldung.setAttribute('role', 'status'); meldung.setAttribute('aria-live', 'polite');
  form.appendChild(meldung);

  const zeigen = (text, art) => {
    meldung.textContent = text;
    meldung.dataset.art = art;
    meldung.hidden = false;
  };

  form.addEventListener('submit', e => {
    e.preventDefault();

    /* Pflichtfelder selbst prüfen, damit die Meldung im Stil der Seite steht */
    const fehlend = [...form.querySelectorAll('[required]')].filter(f => !f.value.trim() ||
      (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim())));
    form.querySelectorAll('.fehlt').forEach(f => f.classList.remove('fehlt'));
    if (fehlend.length) {
      fehlend.forEach(f => f.classList.add('fehlt'));
      zeigen(fehlend.length === 1
        ? 'Da fehlt noch etwas: ' + (fehlend[0].name || 'ein Feld') + '.'
        : 'Bitte fülle noch aus: ' + fehlend.map(f => f.name).join(', ') + '.', 'fehler');
      fehlend[0].focus();
      return;
    }

    const zeilen = [];
    form.querySelectorAll('input[name], textarea[name]').forEach(f => {
      if (f.type === 'checkbox') return;
      if (f.value.trim()) zeilen.push(f.name + ': ' + f.value.trim());
    });
    form.querySelectorAll('.anliegen[data-gruppe]').forEach(g => {
      const an = [...g.querySelectorAll('input:checked')].map(i => i.value);
      if (an.length) zeilen.push(g.dataset.gruppe + ': ' + an.join(', '));
    });

    const adresse = 'mailto:' + form.dataset.mail
      + '?subject=' + encodeURIComponent(form.dataset.betreff)
      + '&body=' + encodeURIComponent(zeilen.join('\n') + '\n\n— gesendet über mehrlebensenergie-praxis.de');
    location.href = adresse;
    zeigen('Dein E-Mail-Programm öffnet sich mit der fertigen Nachricht. Öffnet sich nichts, schreib direkt an '
      + form.dataset.mail + ' oder ruf an.', 'ok');
  });

  /* Die rote Markierung verschwindet, sobald getippt wird */
  form.addEventListener('input', e => e.target.classList?.remove('fehlt'));
});

/* ---------- Cookie-Hinweis */
const cookie = document.querySelector('.cookie');
if (cookie) {
  let ok = false; try { ok = !!localStorage.getItem('ille-cookie'); } catch (e) {}
  if (!ok) cookie.hidden = false;
  cookie.querySelector('.btn')?.addEventListener('click', () => { cookie.hidden = true; try { localStorage.setItem('ille-cookie', '1'); } catch (e) {} });
}

/* ---------- Start */
const geladen = () => { document.body.classList.add('geladen'); meridianBauen(); scrub(); };
if (document.readyState === 'complete') geladen(); else addEventListener('load', geladen);
addEventListener('resize', () => { meridianMessen(); scrub(); });
setTimeout(meridianMessen, 1500); setTimeout(meridianMessen, 4000);
