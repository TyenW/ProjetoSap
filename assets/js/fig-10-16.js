document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('modulo-microprograma');
  if (!root) return;

  // Controles
  const btnPlay = document.getElementById('btn-play-microprograma');
  const selectInstrucao = document.getElementById('instrucao-select');

  // Blocos e valores
  const romAddr = document.getElementById('micro-rom-addr');
  const contador = document.getElementById('micro-contador');
  const romCtrl = document.getElementById('micro-rom-ctrl');
  const valOpcode = document.getElementById('val-opcode');
  const valStartAddr = document.getElementById('val-start-addr');
  const valCurrentAddr = document.getElementById('val-current-addr');
  const valMicroinst = document.getElementById('val-microinst');
  const sinalT3 = document.getElementById('sinal-t3');
  const tabelaCorpo = document.getElementById('log-corpo');
  const fluxoAddrCont = document.getElementById('fluxo-addr-contador');
  const fluxoContRom = document.getElementById('fluxo-contador-rom');

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Mapas (ajustados ao texto da página)
  const MAPA_ROM_ENDERECO = {
    '0000': '0011', // LDA -> 3H
    '0001': '0110', // ADD -> 6H
    '0010': '1001', // SUB -> 9H
    '1110': '1100'  // OUT -> CH
  };

  const MAPA_ROM_CONTROLE = {
    // Fetch (T1..T3)
    '0000': '5E3H', // T1
    '0001': 'BE3H', // T2
    '0010': '263H', // T3

    // LDA (T4..T6) 3H..5H
    '0011': '1A3H', // T4
    '0100': '2C3H', // T5
    '0101': '3E3H', // T6 (nop)

    // ADD (T4..T6) 6H..8H
    '0110': '1A3H', // T4
    '0111': '2E1H', // T5
    '1000': '3C7H', // T6

    // SUB (T4..T6) 9H..BH
    '1001': '1A3H', // T4
    '1010': '2E1H', // T5
    '1011': '3CFH', // T6 (exemplo com sinal de subtração ativado)

    // OUT (T4..T6) CH..EH
    '1100': '3F2H', // T4
    '1101': '3E3H', // T5 (nop)
    '1110': '3E3H'  // T6 (nop)
  };

  btnPlay?.addEventListener('click', async () => {
    try {
      btnPlay.disabled = true;
      tabelaCorpo.innerHTML = '';
      valOpcode.textContent = '--';
      valStartAddr.textContent = '--';
      valCurrentAddr.textContent = '--';
      valMicroinst.textContent = '--';

      // Reseta destaques
      [romAddr, contador, romCtrl].forEach(el => el.classList.remove('ativo', 'carregando'));
      [fluxoAddrCont, fluxoContRom].forEach(el => el.classList.remove('ativo'));
      sinalT3.classList.remove('ativo');

      const option = selectInstrucao.options[selectInstrucao.selectedIndex];
      const opcode = option.getAttribute('data-op') || '0000';
      const enderecoPartida = MAPA_ROM_ENDERECO[opcode];

      // Fase 1: Ciclo de busca (T1..T3)
      await simularEstado('T1', 'Busca', '0000');
      await simularEstado('T2', 'Busca', '0001');
      await simularEstado('T3', 'Busca', '0010');

      // Fase 2: Carga do endereço no contador (durante T3)
      valOpcode.textContent = opcode;
      romAddr.classList.add('ativo');
      await sleep(400);

      valStartAddr.textContent = enderecoPartida;
      fluxoAddrCont.classList.add('ativo');
      await sleep(400);

      sinalT3.classList.add('ativo');
      contador.classList.add('carregando');
      valCurrentAddr.textContent = enderecoPartida;
      await sleep(400);

      romAddr.classList.remove('ativo');
      fluxoAddrCont.classList.remove('ativo');
      sinalT3.classList.remove('ativo');
      contador.classList.remove('carregando');

      // Fase 3: Execução (T4..T6)
      let endAtual = parseInt(enderecoPartida, 2);
      await simularEstado('T4', 'Execução', endAtual.toString(2).padStart(4, '0'));
      endAtual++;
      await simularEstado('T5', 'Execução', endAtual.toString(2).padStart(4, '0'));
      endAtual++;
      await simularEstado('T6', 'Execução', endAtual.toString(2).padStart(4, '0'));
    } finally {
      btnPlay.disabled = false;
    }
  });

  async function simularEstado(nomeEstado, fase, endereco) {
    const microinstrucao = MAPA_ROM_CONTROLE[endereco] || '--';

    // 1. Contador emite endereço para ROM
    valCurrentAddr.textContent = endereco;
    contador.classList.add('ativo');
    fluxoContRom.classList.add('ativo');
    await sleep(350);

    // 2. ROM de controle responde
    romCtrl.classList.add('ativo');
    valMicroinst.textContent = microinstrucao;
    await sleep(350);

    // 3. Log
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${nomeEstado}</td>
      <td>${fase}</td>
      <td>${endereco}</td>
      <td>${microinstrucao}</td>
    `;
    tabelaCorpo.appendChild(tr);

    // 4. Limpa para próximo
    contador.classList.remove('ativo');
    fluxoContRom.classList.remove('ativo');
    romCtrl.classList.remove('ativo');
    valMicroinst.textContent = '--';
    await sleep(200);
  }
});
