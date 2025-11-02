document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('fig-10-2-animada');
  if (!root) return;

  const ffs = [1,2,3,4,5,6].map(n => document.getElementById(`ff${n}`));
  const saidas = [1,2,3,4,5,6].map(n => document.getElementById(`t${n}`));
  const btnClk = document.getElementById('btn-clk-anel');
  const btnReset = document.getElementById('btn-reset-anel');

  let estadoAtivo = 0; // 0..5

  function atualizarUI(idx) {
    ffs.forEach((ff, i) => {
      ff.classList.toggle('ativo', i === idx);
      const v = ff.querySelector('.ff-valor');
      if (v) v.textContent = i === idx ? '1' : '0';
    });
    saidas.forEach((s, i) => s.classList.toggle('ativo', i === idx));
  }

  btnClk?.addEventListener('click', () => {
    // flash de clock nos FFs
    ffs.forEach(ff => {
      ff.classList.add('clk-flash');
      setTimeout(() => ff.classList.remove('clk-flash'), 140);
    });
    estadoAtivo = (estadoAtivo + 1) % 6;
    atualizarUI(estadoAtivo);
  });

  btnReset?.addEventListener('click', () => {
    estadoAtivo = 0;
    atualizarUI(estadoAtivo);
  });

  atualizarUI(estadoAtivo);
});
(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', function(){
    const root = document.getElementById('fig-10-2');
    if (!root) return;

    const btnPlay = document.getElementById('btn-play-tempo-10-2');
    const scrubber = document.getElementById('scrubber-10-2');
    const labelEstado = document.getElementById('label-estado-10-2');
    const svg = root.querySelector('svg.camada-waveforms');
    const ondaClk = document.getElementById('onda-CLK');

    const estadosIds = ['T1','T2','T3','T4','T5','T6'];

    const elementosPorEstado = estadosIds.reduce((acc, key) => {
      acc[key] = {
        pulso: document.getElementById('onda-' + key),
        label: document.getElementById('label-' + key)
      };
      return acc;
    }, {});

    let isPlaying = false;
    let timeouts = [];

    // Converte coordenada X do viewBox para px relativos ao container
    function computeMapping(){
      const vb = (svg.getAttribute('viewBox') || '0 0 720 380').split(/\s+/).map(Number);
      const vbWidth = vb[2] || 720;
      const svgRect = svg.getBoundingClientRect();
      const containerRect = root.querySelector('.container-diagrama').getBoundingClientRect();
      const scale = svgRect.width / vbWidth;
      const offsetLeft = svgRect.left - containerRect.left;
      return { scale, offsetLeft, vbWidth };
    }

    function xToPx(x){
      const { scale, offsetLeft } = computeMapping();
      return offsetLeft + x * scale;
    }

    function limparDestaques(manterClk){
      estadosIds.forEach(k => {
        elementosPorEstado[k].pulso && elementosPorEstado[k].pulso.classList.remove('destacado');
        elementosPorEstado[k].label && elementosPorEstado[k].label.classList.remove('destacado');
      });
      if (!manterClk && ondaClk){
        ondaClk.classList.remove('destacada');
      }
    }

    function resetar(){
      isPlaying = false;
      btnPlay.textContent = '► Iniciar Animação';
      btnPlay.setAttribute('aria-pressed', 'false');
      labelEstado.textContent = 'Nenhum';
      timeouts.forEach(clearTimeout);
      timeouts = [];
      // Reset scrubber
      const startX = xToPx(100);
      scrubber.style.transition = 'none';
      scrubber.style.transform = `translateX(${startX}px)`;
      // limpar destaques
      limparDestaques(false);
    }

    // Inicializa posição do scrubber no load
    (function init(){
      const startX = xToPx(100);
      scrubber.style.transition = 'none';
      scrubber.style.transform = `translateX(${startX}px)`;
    })();

    btnPlay.addEventListener('click', function(){
      if (isPlaying){
        resetar();
        return;
      }

      // Play
      isPlaying = true;
      btnPlay.textContent = '■ Parar/Resetar';
      btnPlay.setAttribute('aria-pressed', 'true');

      // Destaca o CLK durante toda a animação
      if (ondaClk) ondaClk.classList.add('destacada');

      // Posição inicial e final do scrubber (alinha a janela útil: de ~x=100 a ~x=660)
      const startX = xToPx(100);
      const endX = xToPx(660);

      // Garante que a posição inicial seja aplicada antes da transição
      scrubber.style.transition = 'none';
      scrubber.style.transform = `translateX(${startX}px)`;
      // Força reflow
      void scrubber.offsetWidth;
      // Aplica a animação linear de 6s
      const total = 6000; // 6 estados * 1s
      requestAnimationFrame(() => {
        scrubber.style.transition = `transform ${total}ms linear`;
        scrubber.style.transform = `translateX(${endX}px)`;
      });

      // Agenda os realces por estado
      const duracaoEstado = 1000;
      estadosIds.forEach((estado, idx) => {
        const t = setTimeout(() => {
          if (!isPlaying) return;
          limparDestaques(true);
          const el = elementosPorEstado[estado];
          if (el && el.pulso) el.pulso.classList.add('destacado');
          if (el && el.label) el.label.classList.add('destacado');
          labelEstado.textContent = `${estado} Estado`;
        }, idx * duracaoEstado);
        timeouts.push(t);
      });

      // Ao final, faz reset suave
      const tFinal = setTimeout(() => {
        resetar();
      }, total);
      timeouts.push(tFinal);
    });

    // Ajusta posição inicial do scrubber ao redimensionar (se não estiver tocando)
    window.addEventListener('resize', () => {
      if (!isPlaying){
        const startX = xToPx(100);
        scrubber.style.transition = 'none';
        scrubber.style.transform = `translateX(${startX}px)`;
      }
    });
  });
})();
