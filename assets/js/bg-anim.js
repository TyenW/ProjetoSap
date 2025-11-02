/*
  Fundo animado infinito (Canvas) no tema BitLab
  - Partículas em ciano/menta com conexões quando próximas
  - Interativo: segue o mouse; pausa com prefers-reduced-motion ou quando a aba não está visível
  - Injeta <canvas id="bg-canvas"> automaticamente no <body>
*/
(function(){
  try {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // cria canvas
    let canvas = document.getElementById('bg-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg-canvas';
      document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d', { alpha: true });

  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  let w = 0, h = 0, running = !prefersReduced, pausedByVisibility = false, started = false;

    const CSS = getComputedStyle(document.documentElement);
    const COL_CYAN = CSS.getPropertyValue('--cor-ciano').trim() || '#00ffff';
    const COL_MINT = CSS.getPropertyValue('--cor-menta').trim() || '#64ffda';

    const mouse = { x: NaN, y: NaN, active: false };

    // parâmetros responsivos
    function getConfig(){
      const area = w*h;
      // densidade baseada na área (limitar para performance)
      const base = Math.min(160, Math.max(60, Math.floor(area / (12000))));
      return {
        count: base,
        maxSpeed: 0.25,
        linkDist: Math.max(60, Math.min(160, Math.sqrt(Math.sqrt(area))/2*48)),
        mouseInfluence: 90,
      };
    }

    let config = { count: 100, maxSpeed: 0.25, linkDist: 120, mouseInfluence: 90 };
    let particles = [];

    function getViewportSize(){
      // Tentar múltiplas fontes de medida para evitar 0 em certas condições (p. ex. abas em background ou iOS)
      let cssW = Math.max(0,
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
      );
      let cssH = Math.max(0,
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
      );
      if (!cssW || !cssH) {
        // último recurso: tentar dimensões do body
        cssW = Math.max(cssW, document.body && document.body.clientWidth || 0);
        cssH = Math.max(cssH, document.body && document.body.clientHeight || 0);
      }
      return { cssW: cssW || 1, cssH: cssH || 1 };
    }

    function resize(){
      const { cssW, cssH } = getViewportSize();
      w = Math.floor(cssW * DPR);
      h = Math.floor(cssH * DPR);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      config = getConfig();
      // ajustar quantidade de partículas
      const target = config.count;
      if (particles.length > target) particles.length = target;
      while (particles.length < target) particles.push(randParticle());
    }

    function rand(min, max){ return min + Math.random()*(max-min); }

    function randParticle(){
      const angle = Math.random()*Math.PI*2;
      const speed = rand(0.02, config.maxSpeed);
      return {
        x: Math.random()*w,
        y: Math.random()*h,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        r: rand(0.8*DPR, 1.8*DPR),
        hue: Math.random() < 0.5 ? COL_CYAN : COL_MINT,
      };
    }

    function step(){
      if (!running) return;
      ctx.clearRect(0,0,w,h);

      // animação das partículas
      for (let p of particles){
        // leve atração ao mouse
        if (mouse.active && !Number.isNaN(mouse.x)){
          const mx = mouse.x*DPR, my = mouse.y*DPR;
          const dx = mx - p.x, dy = my - p.y;
          const d2 = dx*dx + dy*dy;
          const rad = config.mouseInfluence*DPR;
          if (d2 < rad*rad){
            const d = Math.sqrt(d2) || 1;
            const ux = dx/d, uy = dy/d;
            // influência suave
            p.vx += ux*0.005; p.vy += uy*0.005;
          }
        }

        p.x += p.vx; p.y += p.vy;
        // wrap infinito nas bordas
        if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5; else if (p.y > h + 5) p.y = -5;
      }

      // conexões próximas
      const linkDist2 = (config.linkDist*DPR)*(config.linkDist*DPR);
      for (let i=0; i<particles.length; i++){
        const a = particles[i];
        // desenha ponto
        ctx.beginPath();
        ctx.fillStyle = a.hue;
        ctx.globalAlpha = 0.9;
        ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
        ctx.fill();

        for (let j=i+1; j<particles.length; j++){
          const b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx*dx + dy*dy;
          if (d2 < linkDist2){
            const alpha = 1 - (d2 / linkDist2);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            // gradiente sutil ciano -> menta
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, COL_CYAN);
            grad.addColorStop(1, COL_MINT);
            ctx.strokeStyle = grad;
            ctx.globalAlpha = 0.28 * alpha;
            ctx.lineWidth = 1 * DPR;
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(step);
    }

    function start(){
      if (started) return;
      started = true;
      running = !prefersReduced;
      if (running) requestAnimationFrame(step);
    }
    function stop(){ running = false; }

    // eventos
    window.addEventListener('resize', resize, { passive: true });
    // Reagir à renderização inicial e retorno de BFCache
    window.addEventListener('load', ()=>{ resize(); if (!prefersReduced && !document.hidden) start(); }, { once: true });
    window.addEventListener('pageshow', (e)=>{ if (e.persisted){ resize(); if (!prefersReduced && !document.hidden) start(); } });

    // Tentar observar mudanças de layout que impactem o viewport (ex.: barras do mobile)
    if (typeof ResizeObserver !== 'undefined'){
      try {
        const ro = new ResizeObserver(()=> resize());
        ro.observe(document.documentElement);
      } catch {}
    }
    document.addEventListener('mousemove', (e)=>{ mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
    document.addEventListener('mouseleave', ()=>{ mouse.active = false; });
    document.addEventListener('touchmove', (e)=>{
      if (e.touches && e.touches[0]){ mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; mouse.active = true; }
    }, { passive: true });
    document.addEventListener('touchend', ()=>{ mouse.active = false; });

    document.addEventListener('visibilitychange', ()=>{
      pausedByVisibility = document.hidden;
      if (pausedByVisibility) stop(); else if (!prefersReduced) {
        // garantir que dimensões estejam válidas ao voltar
        resize();
        started = false; // força reentrada em start caso necessário
        start();
      }
    });

    // Inicialização robusta: se as dimensões vierem 0, re-tentar no próximo frame
    function initWithRetry(attempt=0){
      resize();
      if ((w === 0 || h === 0) && attempt < 5){
        setTimeout(()=> initWithRetry(attempt+1), 50 * (attempt+1));
        return;
      }
      if (!prefersReduced && !document.hidden) start();
    }
    initWithRetry();
  } catch (e){ console.warn('bg-anim init falhou', e); }
})();
