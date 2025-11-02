document.addEventListener('DOMContentLoaded', () => {
  // Helpers para scrubber e destaques
  function animateTimeline({containerId, svgSelector, scrubberId, startX, endX, durationMs, steps, highlights, edges}) {
    const container = document.getElementById(containerId);
    const scrubber = document.getElementById(scrubberId);
    const svg = container?.querySelector(svgSelector);
    if (!container || !scrubber || !svg) return { cancel: () => {} };

    // Converte coordenadas de viewBox para pixels do container
    const vb = svg.viewBox.baseVal;
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / vb.width;
    const padLeftPx = 0; // container-diagrama não tem padding interno relativo ao SVG
    const xStartPx = (startX - vb.x) * scale + padLeftPx;
    const xEndPx = (endX - vb.x) * scale + padLeftPx;

    // reseta posicionamento e transição
    scrubber.style.transition = 'none';
    scrubber.style.transform = `translateX(${Math.round(xStartPx)}px)`;
    // forçar reflow
    void scrubber.offsetWidth;
    scrubber.style.transition = `transform ${durationMs}ms linear`;
    scrubber.style.transform = `translateX(${Math.round(xEndPx)}px)`;

    // agendamento dos destaques
  const timeouts = [];
    highlights.forEach(h => {
      const t = setTimeout(() => {
        h.targets.forEach(sel => {
          const el = svg.querySelector(sel);
          if (!el) return;
          if (h.toggle === 'on') {
            if (el.tagName.toLowerCase() === 'text') el.classList.add('destacado-texto');
            else el.classList.add('destacado');
          } else if (h.toggle === 'off') {
            el.classList.remove('destacado');
            el.classList.remove('destacado-texto');
          }
        });
      }, h.atMs);
      timeouts.push(t);
    });

    // agendamento de pulsos de bordas: negativas (limite de estado) e positivas (meio do estado)
    if (edges?.neg?.length) {
      edges.neg.forEach(t => {
        const tt = setTimeout(() => {
          scrubber.classList.add('blink-neg');
          setTimeout(() => scrubber.classList.remove('blink-neg'), 140);
        }, t);
        timeouts.push(tt);
      });
    }
    if (edges?.pos?.length) {
      edges.pos.forEach(t => {
        const tt = setTimeout(() => {
          scrubber.classList.add('blink-pos');
          setTimeout(() => scrubber.classList.remove('blink-pos'), 140);
        }, t);
        timeouts.push(tt);
      });
    }

    const endTimeout = setTimeout(() => {
      // reset visual
      scrubber.style.transition = 'none';
      scrubber.style.transform = `translateX(${Math.round(xStartPx)}px)`;
      // limpa quaisquer destaques restantes
      svg.querySelectorAll('.destacado, .destacado-texto').forEach(el => {
        el.classList.remove('destacado');
        el.classList.remove('destacado-texto');
      });
    }, durationMs + 50);
    timeouts.push(endTimeout);

    return {
      cancel: () => timeouts.forEach(clearTimeout)
    };
  }

  // (a) 1 ciclo de máquina (6s total, 1s por T)
  const btnA = document.getElementById('btn-play-10-10a');
  let runningA = null;
  btnA?.addEventListener('click', () => {
    if (runningA) { runningA.cancel?.(); runningA = null; }
    const duration = 6000; // ms
    const step = duration / 6; // 1000ms por T
    const negEdges = Array.from({length: 7}, (_, i) => i * step); // 0..6000
    const posEdges = Array.from({length: 6}, (_, i) => i * step + step/2); // 500..5500

    // fetch: 0-3000ms | exec: 3000-6000ms (coordenadas posicionadas no SVG)
    runningA = animateTimeline({
      containerId: 'container-10-10a',
      svgSelector: 'svg.camada-waveforms',
      scrubberId: 'scrubber-10-10a',
      startX: 120, // início nominal das barras
      endX: 560,   // final nominal das barras
      durationMs: duration,
      steps: 6,
      edges: { neg: negEdges, pos: posEdges },
      highlights: [
        // CLK acende constante
        { atMs: 0, toggle: 'on', targets: ['#a-clk'] },

        // Buscar ON no início, OFF aos 3000ms
        { atMs: 0, toggle: 'on', targets: ['#a-buscar', 'text[x="80"][y="120"]'] },
        { atMs: 3000, toggle: 'off', targets: ['#a-buscar', 'text[x="80"][y="120"]'] },

        // Executar ON aos 3000ms, OFF no final
        { atMs: 3000, toggle: 'on', targets: ['#a-executar', 'text[x="320"][y="120"]'] },
        { atMs: 6000, toggle: 'off', targets: ['#a-executar', 'text[x="320"][y="120"]'] },

        // Ciclo de máquina e Ciclo de instrução ON durante toda animação
        { atMs: 0, toggle: 'on', targets: ['#a-ciclo-maquina', 'text[x="80"][y="160"]', '#a-ciclo-instr', 'text[x="80"][y="200"]'] },
        { atMs: 6000, toggle: 'off', targets: ['#a-ciclo-maquina', 'text[x="80"][y="160"]', '#a-ciclo-instr', 'text[x="80"][y="200"]', '#a-clk'] }
      ]
    });
  });

  // (b) 2 ciclos de máquina (~11s). Fetch(3s) + Exec1(3s) + Exec2(5s)
  const btnB = document.getElementById('btn-play-10-10b');
  let runningB = null;
  btnB?.addEventListener('click', () => {
    if (runningB) { runningB.cancel?.(); runningB = null; }
    const tFetch = 3000, tExec1 = 3000, tExec2 = 5000;
    const duration = tFetch + tExec1 + tExec2; // 11000ms
    const step = 1000; // aproximado
    const negEdges = Array.from({length: 12}, (_, i) => i * step); // 0..11000
    const posEdges = Array.from({length: 11}, (_, i) => i * step + step/2); // 500..10500

    runningB = animateTimeline({
      containerId: 'container-10-10b',
      svgSelector: 'svg.camada-waveforms',
      scrubberId: 'scrubber-10-10b',
      startX: 120,
      endX: 900,
      durationMs: duration,
      steps: 11,
      edges: { neg: negEdges, pos: posEdges },
      highlights: [
        // CLK
        { atMs: 0, toggle: 'on', targets: ['#b-clk'] },

        // Buscar (0-3s)
        { atMs: 0, toggle: 'on', targets: ['#b-buscar', 'text[x="80"][y="120"]'] },
        { atMs: tFetch, toggle: 'off', targets: ['#b-buscar', 'text[x="80"][y="120"]'] },

        // Executar 1 (3-6s)
        { atMs: tFetch, toggle: 'on', targets: ['#b-exec1', 'text[x="280"][y="120"]'] },
        { atMs: tFetch + tExec1, toggle: 'off', targets: ['#b-exec1', 'text[x="280"][y="120"]'] },

        // Executar 2 (6-11s)
        { atMs: tFetch + tExec1, toggle: 'on', targets: ['#b-exec2', 'text[x="520"][y="120"]'] },
        { atMs: duration, toggle: 'off', targets: ['#b-exec2', 'text[x="520"][y="120"]'] },

        // Ciclos de máquina (1 e 2)
        { atMs: 0, toggle: 'on', targets: ['#b-cm1', 'text[x="80"][y="160"]'] },
        { atMs: tFetch + tExec1, toggle: 'off', targets: ['#b-cm1', 'text[x="80"][y="160"]'] },
        { atMs: tFetch + tExec1, toggle: 'on', targets: ['#b-cm2', 'text[x="520"][y="160"]'] },
        { atMs: duration, toggle: 'off', targets: ['#b-cm2', 'text[x="520"][y="160"]'] },

        // Ciclo de instrução (todo o período)
        { atMs: 0, toggle: 'on', targets: ['#b-ci', 'text[x="80"][y="200"]'] },
        { atMs: duration, toggle: 'off', targets: ['#b-ci', 'text[x="80"][y="200"]', '#b-clk'] }
      ]
    });
  });
});
