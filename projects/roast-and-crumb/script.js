/*
  fantasy-author/script.js
  - Canvas: sky (clouds/stars), fog, dragons (animated sprites)
  - Decorative runes & fireflies (DOM), map pin interactions + modal
  - Background audio toggle, reveal animations, smooth anchors
  - Newsletter and contact form handlers
  - Defensive: silently no-op if expected DOM nodes are missing
*/

(() => {
  'use strict';

  /* -----------------------------
     Small helpers
     ----------------------------- */
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from((ctx || document).querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* -----------------------------
     Canvas sizing helper
     ----------------------------- */
  function fitCanvas(canvas) {
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  /* -----------------------------
     Sky: soft parallax clouds + star twinkle
     ----------------------------- */
  function initSky(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0;
    const clouds = [];

    function makeCloud(){
      return {
        x: Math.random() * w,
        y: Math.random() * h * 0.6,
        rx: 120 + Math.random() * 300,
        ry: 40 + Math.random() * 120,
        a: 0.06 + Math.random() * 0.12,
        vx: -0.02 - Math.random()*0.06
      };
    }

    function onResize(){ fitCanvas(canvas); w = canvas.clientWidth; h = canvas.clientHeight; clouds.length = 0; for(let i=0;i<10;i++) clouds.push(makeCloud()); }
    on(window,'resize', onResize); onResize();

    let last = performance.now();
    let mouse = {x:w/2,y:h/2};
    on(window,'pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

    function tick(now){
      const dt = Math.min(32, now - last); last = now;
      ctx.clearRect(0,0,w,h);

      // subtle stars
      for(let i=0;i<150;i++){
        const x = (i*37) % w + ((i*11)%7);
        const y = ((i*53) % h);
        const a = 0.07 + Math.abs(Math.sin((now/1200) + i)) * 0.12;
        ctx.fillStyle = `rgba(245,235,208,${a})`;
        ctx.fillRect(x,y,1,1);
      }

      // clouds
      clouds.forEach(c=>{
        c.x += c.vx * dt * 0.06;
        if(c.x + c.rx < -50) c.x = w + 60;
        const grd = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.rx);
        grd.addColorStop(0, `rgba(214,178,94,${c.a})`);
        grd.addColorStop(0.6, `rgba(16,26,47,${c.a*0.6})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(c.x,c.y,c.rx,c.ry,0,0,Math.PI*2); ctx.fill();
      });

      return true;
    }

    return {tick, onResize};
  }

  /* -----------------------------
     Fog: layered radial glows for torchlight / ambiance
     ----------------------------- */
  function initFog(canvas){
    if(!canvas) return null;
    const ctx = canvas.getContext('2d');
    let w=0,h=0, blobs=[];
    function mk(){
      return { x: Math.random()*w, y: Math.random()*h, r: 120+Math.random()*360, alpha:0.05+Math.random()*0.08, vx:(Math.random()-0.5)*0.02, vy:(Math.random()-0.5)*0.02 };
    }
    function onResize(){ fitCanvas(canvas); w=canvas.clientWidth; h=canvas.clientHeight; blobs=[]; for(let i=0;i<6;i++) blobs.push(mk()); }
    on(window,'resize', onResize); onResize();
    let last=performance.now();
    function tick(now){ const dt=Math.min(32, now-last); last=now; ctx.clearRect(0,0,w,h); ctx.globalCompositeOperation='lighter'; blobs.forEach(b=>{ b.x+=b.vx*dt; b.y+=b.vy*dt; b.alpha = 0.04 + Math.sin((now/2000)+(b.x+b.y))*0.02; const g = ctx.createRadialGradient(b.x,b.y,b.r*0.05,b.x,b.y,b.r); g.addColorStop(0, `rgba(214,178,94,${b.alpha})`); g.addColorStop(0.5, `rgba(20,31,53,${b.alpha*0.6})`); g.addColorStop(1,'rgba(8,13,28,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill(); }); ctx.globalCompositeOperation='source-over'; return true; }
    return {tick,onResize};
  }

  /* -----------------------------
     Dragons: simple sprite-like shapes flying across the sky
     - Not image-dependent; draw vector wings and body
     ----------------------------- */
  function initDragons(canvas){
    if(!canvas) return null;
    const ctx = canvas.getContext('2d');
    let w=0,h=0, drags=[];
    function mk(){ return { x:-100 - Math.random()*400, y:80 + Math.random()*220, vx:0.06 + Math.random()*0.14, size:0.6+Math.random()*1.2, flip: Math.random()>0.5?1:-1, phase:Math.random()*Math.PI*2 } }
    function onResize(){ fitCanvas(canvas); w=canvas.clientWidth; h=canvas.clientHeight; drags=[]; for(let i=0;i<3;i++) drags.push(mk()); }
    on(window,'resize', onResize); onResize(); let last=performance.now();
    function drawDragon(d, t){
      ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.flip * d.size, d.size);
      // body
      ctx.beginPath(); ctx.moveTo(-18,0); ctx.quadraticCurveTo(-8,-10,0,0); ctx.quadraticCurveTo(-8,8,-18,0); ctx.fillStyle='rgba(8,13,28,0.96)'; ctx.fill();
      // wing flapping
      const wing = Math.sin((t/120)+d.phase) * 14;
      ctx.beginPath(); ctx.moveTo(-4,0); ctx.quadraticCurveTo(24,-wing,54,-wing*0.6); ctx.quadraticCurveTo(26,8,0,2); ctx.fillStyle='rgba(214,178,94,0.52)'; ctx.fill();
      ctx.restore();
    }
    function tick(now){ const dt = Math.min(32, now-last); last=now; ctx.clearRect(0,0,w,h); drags.forEach(d=>{ d.x += d.vx * dt * 0.5 *  (d.flip>0?1:1.2); d.phase += 0.002 * dt; if(d.x > w + 120){ Object.assign(d, mk()); d.x = -120; d.y = 60 + Math.random()* (h*0.5); } drawDragon(d, now); }); return true; }
    return {tick,onResize};
  }

  /* -----------------------------
     Decorative DOM elements: runes and fireflies
     - Create a small number of nodes and animate with CSS classes
     ----------------------------- */
  function seedDecoratives(){
    const root = qs('.site-root'); if(!root) return;
    // runes
    for(let i=0;i<6;i++){
      const r = document.createElement('div'); r.className = `rune rune--${i%2===0?'slow':'fast'}`; r.style.left = `${10 + Math.random()*80}%`; r.style.top = `${10 + Math.random()*70}%`; root.appendChild(r);
    }
    // fireflies
    for(let i=0;i<8;i++){
      const f = document.createElement('div'); f.className = `firefly fly-${(i%3)+1}`; f.style.left = `${5 + Math.random()*90}%`; f.style.top = `${10 + Math.random()*70}%`; root.appendChild(f);
    }
  }

  /* -----------------------------
     Modal & map interactions
     ----------------------------- */
  function openModal(content){ const modal = qs('.modal'); if(!modal) return; const inner = qs('.modal-inner', modal); if(inner) inner.innerHTML = content; modal.classList.remove('modal--hidden'); modal.setAttribute('aria-hidden','false'); }
  function closeModal(){ const modal = qs('.modal'); if(!modal) return; modal.classList.add('modal--hidden'); modal.setAttribute('aria-hidden','true'); }
  function initModal(){ const modal = qs('.modal'); if(!modal) return; on(qs('.modal-close', modal), 'click', closeModal); on(modal,'click', e => { if(e.target === modal) closeModal(); }); }
  function initMapPins(){
    const locationLore = {
      Castle: 'The old seat of the crown, where every stone remembers a coronation and every corridor keeps a secret.',
      Forest: 'A whispering woodland beyond the royal roads. Follow the silver moss and you may find what the maps forgot.',
      'Dragon Mountain': 'Black peaks above the clouds, where ancient wings circle the summit and fire still glows beneath the snow.',
      'Wizard Tower': 'A lonely observatory filled with star charts, forbidden names, and a lantern that never goes dark.',
      'Hidden Village': 'A quiet refuge tucked between the hills, protected by an old spell and known only to those who need it.'
    };

    qsa('.map-pin').forEach(pin => { on(pin,'click', ()=>{
      const locationName = pin.textContent.trim();
      const description = locationLore[locationName] || 'A forgotten corner of the kingdom awaits discovery.';
      const content = `<div class="map-detail"><span class="map-detail-kicker">A place in the realm</span><h3>${locationName}</h3><p>${description}</p><a class="btn btn-ghost" href="#books">Discover its stories</a></div>`;
      openModal(content);
    }); });
  }

  /* -----------------------------
     Audio toggle for background soundtrack
     ----------------------------- */
  function initAudioToggle(){ const btn = qs('#soundToggle'); const audio = qs('#bgAudio'); if(!btn || !audio) return; function update(){ btn.setAttribute('aria-pressed', String(!audio.paused)); btn.textContent = audio.paused ? '🔇' : '🔊'; }
    on(btn,'click', ()=>{ if(audio.paused){ audio.play().catch(()=>{}); } else { audio.pause(); } update(); }); audio.addEventListener('play', update); audio.addEventListener('pause', update); update(); }

  /* -----------------------------
     Reveal animations (IntersectionObserver)
     ----------------------------- */
  function initReveal(){ const els = qsa('.reveal'); if(!els.length) return; if(!('IntersectionObserver' in window)){ els.forEach(e=>e.classList.add('is-visible')); return; }
    const io = new IntersectionObserver(entries => { entries.forEach(en => { if(en.isIntersecting){ en.target.classList.add('is-visible'); io.unobserve(en.target); } }); }, { rootMargin:'0px 0px -10% 0px', threshold: 0.06 }); els.forEach(e => io.observe(e)); }

  /* -----------------------------
     Smooth anchors
     ----------------------------- */
  function initAnchors(){ qsa('a[href^="#"]').forEach(a=>{ on(a,'click', e=>{ const href = a.getAttribute('href'); if(!href || href === '#') return; const target = qs(href); if(!target) return; e.preventDefault(); target.scrollIntoView({behavior:'smooth', block:'center'}); }); }); }

  /* -----------------------------
     Forms: newsletter & contact (lightweight demo handlers)
     ----------------------------- */
  function initForms(){ const news = qs('.newsletter-form'); if(news){ on(news,'submit', e=>{ e.preventDefault(); const email = qs('input[type="email"]', news)?.value || ''; const note = qs('.newsletter-note', news); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ if(note) note.textContent = 'Please enter a valid email.'; return; } if(note) note.textContent = 'Welcome to the Court — check your inbox.'; news.reset(); }); }
    const contact = qs('.contact-form'); if(contact){ on(contact,'submit', e=>{ e.preventDefault(); const name = qs('#name', contact)?.value || ''; const msg = qs('#message', contact)?.value || ''; if(!name||!msg){ alert('Please complete the form.'); return; } alert('Raven sent — thank you! (Demo)'); contact.reset(); }); }
  }

  /* -----------------------------
     Loader hide and initial boot sequence
     ----------------------------- */
  function hideLoader(){ const L = qs('#site-loader'); if(!L) return; L.classList.add('fade'); setTimeout(()=>{ L.style.display='none'; L.setAttribute('aria-hidden','true'); }, 600); }

  /* -----------------------------
     Initialize everything and run animation loop
     ----------------------------- */
  function init(){
    // seed decorative DOM nodes
    seedDecoratives();

    // canvas instances
    const sky = initSky(qs('#skyCanvas'));
    const fog = initFog(qs('#fogCanvas'));
    const dragons = initDragons(qs('#dragonsCanvas'));

    // UI
    initModal(); initMapPins(); initAudioToggle(); initReveal(); initAnchors(); initForms();

    // hide loader when ready
    window.addEventListener('load', ()=>{ hideLoader(); });

    // main animation loop
    function loop(now){
      if(sky) sky.tick(now);
      if(fog) fog.tick(now);
      if(dragons) dragons.tick(now);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // start on DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
