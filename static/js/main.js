(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Interactive starfield ---------- */
  const cv = $('#space'), ctx = cv.getContext('2d');
  const nebula = $('#nebula'), moon = $('#moon'), portrait = $('#portrait');
  let W, H, stars = [], shooters = [];
  let zoom = 1, pan = { x: 0, y: 0 }, mouse = { x: 0, y: 0, px: 0, py: 0 };
  let dragging = false, last = null;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(W * H / 600, W < 700 ? 900 : 2200)); // fewer on mobile
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      d: .1 + Math.random() * .9,                    // depth layer
      r: Math.random() < .03 ? 1.8 : .4 + Math.random() * .9,
      c: Math.random() < .2 ? '#FFD966' : Math.random() < .35 ? '#60A5FA' : '#E5E7EB',
      t: Math.random() * 6.28, fine: Math.random() < .35, // "fine" stars appear when zoomed in
    }));
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    mouse.px += (mouse.x - mouse.px) * .05; mouse.py += (mouse.y - mouse.py) * .05;
    for (const s of stars) {
      if (s.fine && zoom < 1.15) continue;
      const k = s.d * zoom;
      let x = (s.x + pan.x * k + mouse.px * 30 * s.d) % W; if (x < 0) x += W;
      let y = (s.y + pan.y * k + mouse.py * 30 * s.d) % H; if (y < 0) y += H;
      // stars near the cursor drift away gently
      const dx = x - mouse.cx, dy = y - mouse.cy, dist = Math.hypot(dx, dy);
      if (dist < 90) { const f = (90 - dist) / 90 * 14; x += dx / dist * f; y += dy / dist * f; }
      const tw = reduce ? 1 : .6 + .4 * Math.sin(time / 900 + s.t);
      ctx.globalAlpha = (.25 + s.d * .75) * tw;
      ctx.fillStyle = s.c;
      ctx.beginPath(); ctx.arc(x, y, s.r * (.8 + zoom * .35), 0, 6.28); ctx.fill();
      if (s.r > 1.5) { ctx.globalAlpha *= .18; ctx.beginPath(); ctx.arc(x, y, s.r * 4, 0, 6.28); ctx.fill(); }
      if (!reduce) { s.y -= .02 * s.d; if (s.y < 0) s.y = H; } // slow glitter drift
    }
    // shooting stars (rare, subtle)
    if (!reduce && Math.random() < .002 && shooters.length < 2)
      shooters.push({ x: Math.random() * W, y: Math.random() * H * .4, l: 0 });
    shooters = shooters.filter(s => s.l < 40);
    for (const s of shooters) {
      s.x += 9; s.y += 4; s.l++;
      const g = ctx.createLinearGradient(s.x, s.y, s.x - 70, s.y - 30);
      g.addColorStop(0, 'rgba(245,230,168,.8)'); g.addColorStop(1, 'transparent');
      ctx.globalAlpha = 1 - s.l / 40; ctx.strokeStyle = g; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - 70, s.y - 30); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    nebula.style.transform = `translate(${mouse.px * -18 + pan.x * .1}px,${mouse.py * -18 + pan.y * .1}px) scale(${.85 + zoom * .15})`;
    moon.style.translate = `${mouse.px * -40}px ${mouse.py * -40}px`;
    requestAnimationFrame(draw);
  }

  mouse.cx = -999; mouse.cy = -999;
  addEventListener('mousemove', e => {
    mouse.x = e.clientX / W - .5; mouse.y = e.clientY / H - .5; mouse.cx = e.clientX; mouse.cy = e.clientY;
    if (portrait && !reduce) portrait.style.transform = `translate(${mouse.x * 18}px,${mouse.y * 18}px)`;
    if (dragging) { pan.x += e.clientX - last.x; pan.y += e.clientY - last.y; last = { x: e.clientX, y: e.clientY }; }
  });
  addEventListener('mousedown', e => {
    if (e.target.closest('.card,a,button,input,textarea,.nav,.hero-text,.portrait-wrap')) return;
    dragging = true; last = { x: e.clientX, y: e.clientY }; document.body.style.cursor = 'grabbing';
  });
  addEventListener('mouseup', () => { dragging = false; document.body.style.cursor = ''; });
  const setZoom = z => { zoom = Math.min(2.5, Math.max(.6, z)); };
  addEventListener('wheel', e => { if (e.ctrlKey) { e.preventDefault(); setZoom(zoom - e.deltaY * .002); } }, { passive: false });
  $('#zin').onclick = () => setZoom(zoom + .25);
  $('#zout').onclick = () => setZoom(zoom - .25);
  $('#zreset').onclick = () => { zoom = 1; pan = { x: 0, y: 0 }; };
  addEventListener('resize', resize);
  resize(); requestAnimationFrame(draw);

  /* ---------- Navigation ---------- */
  const nav = $('#nav'), menu = $('#menu'), dot = $('#dot');
  const links = $$('nav a');
  $('#burger').onclick = () => menu.classList.toggle('open');
  links.forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  addEventListener('scroll', () => nav.classList.toggle('solid', scrollY > 40), { passive: true });
  const secObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => {
      const on = a.getAttribute('href') === '#' + e.target.id;
      a.classList.toggle('active', on);
      if (on) dot.style.transform = `translateX(${a.offsetLeft + a.offsetWidth / 2 - 4}px)`;
    });
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('section').forEach(s => secObs.observe(s));

  /* ---------- Scroll reveal (cards only) ---------- */
  const revObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revObs.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.card,.chip,.stop,.title').forEach(el => { el.classList.add('reveal'); revObs.observe(el); });

  /* ---------- Skill descriptions ---------- */
  $$('.node').forEach(n => {
    const show = () => { $$('.node.on').forEach(x => x.classList.remove('on')); n.classList.add('on'); $('#skill-desc').textContent = `> ${n.textContent}: ${n.dataset.desc}`; };
    n.addEventListener('mouseenter', show); n.addEventListener('focus', show); n.addEventListener('click', show);
  });

  /* ---------- Journey ---------- */
  $$('.stop').forEach(s => s.addEventListener('click', () => {
    $$('.stop.on').forEach(x => x.classList.remove('on')); s.classList.add('on');
    $('#journey-info').textContent = `> ${$('span', s).textContent}: ${s.dataset.info}`;
  }));

  /* ---------- Project card tilt ---------- */
  if (!reduce && matchMedia('(hover:hover)').matches) $$('.tilt').forEach(c => {
    c.addEventListener('mousemove', e => {
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
    });
    c.addEventListener('mouseleave', () => c.style.transform = '');
  });


  /* ---------- Project screenshot galleries + lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
  let active = null;
  function setShot(g, i) {
    g.i = (i + g.thumbs.length) % g.thumbs.length;
    const t = g.thumbs[g.i], main = $('.gal-main img', g.el);
    main.style.opacity = 0;
    setTimeout(() => { main.src = t.dataset.src; main.alt = t.dataset.cap; main.style.opacity = 1; }, 150);
    $('.gal-cap', g.el).textContent = `${t.dataset.cap} (${g.i + 1}/${g.thumbs.length})`;
    g.thumbs.forEach(x => x.classList.toggle('on', x === t));
    t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    if (!lb.hidden) { lbImg.src = t.dataset.src; lbImg.alt = t.dataset.cap; lbCap.textContent = `${t.dataset.cap} (${g.i + 1}/${g.thumbs.length})`; }
  }
  $$('.gallery').forEach(el => {
    const g = { el, thumbs: $$('.thumb', el), i: 0 };
    g.thumbs.forEach((t, i) => t.addEventListener('click', () => setShot(g, i)));
    $('.gal-stage .prev', el).onclick = () => setShot(g, g.i - 1);
    $('.gal-stage .next', el).onclick = () => setShot(g, g.i + 1);
    $('.gal-main', el).onclick = () => { active = g; lb.hidden = false; setShot(g, g.i); };
    setShot(g, 0);
  });
  const closeLb = () => { lb.hidden = true; };
  $('.lb-close', lb).onclick = closeLb;
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  $('.prev', lb).onclick = () => setShot(active, active.i - 1);
  $('.next', lb).onclick = () => setShot(active, active.i + 1);
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') setShot(active, active.i - 1);
    if (e.key === 'ArrowRight') setShot(active, active.i + 1);
  });

  /* ---------- Contact form -> Flask + SQLite ---------- */
  const form = $('#contact-form'), status = $('#form-status');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('button', form); btn.disabled = true; status.textContent = '> sending...';
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json();
      status.textContent = data.ok ? '> message sent. Thank you!' : '> ' + data.error;
      if (data.ok) form.reset();
    } catch { status.textContent = '> could not reach the server. Is app.py running?'; }
    btn.disabled = false;
  });
})();
