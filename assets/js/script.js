// Estado global do emulador
let memoria = new Map();
let PC = 0;
let ACC = 0;
let passos = [];
let saida = [];
let running = false;
let animationSpeed = 1500; // Velocidade da animação em ms
let assemblyAnterior = []; // Para acompanhar mudanças no assembly
let asmDebounce = null;    // Debounce para montagem automática
let editMode = 'ram';      // 'ram' | 'asm'
let asmTouched = false;    // true quando o usuário digitar no editor pela primeira vez
// Núcleo determinístico (sem DOM)
let core = null; // window.EmulatorCore.Emulator
// Memory store reativo (fonte de verdade da RAM)
let store = null; // window.MemoryStore
let syncingInputs = false; // evita laço ao sincronizar inputs a partir do store
// Workers
let emulatorWorker = null;
let assemblerWorker = null;
let workerRunning = false;
let tickQueue = [];
let animatingTick = false;

// Tabela de conversão de hex para assembly
const hexParaAssembly = {
    '0': 'LDA',
    '1': 'ADD', 
    '2': 'SUB',
    '3': 'INC',
    '4': 'DEC',
    '5': 'MUL',
    '6': 'JMP',
    'E': 'OUT',
    'F': 'HLT'
};

// Função para converter valor hex da RAM para assembly
function converterHexParaAssembly(hexValue) {
    if (!hexValue || hexValue === '00' || hexValue.length < 2) {
        return '---';
    }
    
    const opcode = hexValue[0].toUpperCase();
    const argumento = hexValue[1].toUpperCase();
    const operacao = hexParaAssembly[opcode];
    
    if (!operacao) {
        return '???';
    }
    
    // Se a operação precisa de argumento
    if (['LDA', 'ADD', 'SUB', 'MUL', 'JMP'].includes(operacao)) {
        // Operando é um nibble 0..F em hex (A..F permitido). Ex.: 0A => LDA A
        return `${operacao} ${argumento}`;
    }
    
    // Operações sem argumento
    return operacao;
}

// Interpretação com sinal (8 bits): 0..255 -> -128..127
function toSigned8(n) {
    n = (n & 0xFF);
    return (n >= 128) ? (n - 256) : n;
}

function safeText(text) {
    const span = document.createElement('span');
    span.textContent = String(text ?? '');
    return span.textContent;
}

// Renderiza display de assembly a partir do store
function atualizarAssemblyDaRAM() {
    const container = document.getElementById('assemblyCode');
    if (!container) return;
    container.textContent = '';
    const novoAssembly = [];
    let temInstrucoes = false;

    const mem = (store && typeof store.getAll === 'function') ? store.getAll() : new Array(16).fill('00');
    const firstHLT = mem.findIndex(v => (v || '').toUpperCase() === 'F0');
    for (let i = 0; i < 16; i++) {
        const hexValue = (mem[i] || '').toUpperCase();
        let asm = hexValue.length >= 2 ? converterHexParaAssembly(hexValue) : '---';

        // Após o primeiro HLT, trate bytes como dados (ex.: .DB 0C (12))
        if (firstHLT !== -1 && i > firstHLT && hexValue.length === 2) {
            if (hexValue !== '00') {
                const dec = parseInt(hexValue, 16);
                const addrHex = i.toString(16).toUpperCase();
                // Formato desejado: "A 3", "B 4" etc.
                asm = `${addrHex} ${dec}`;
            } else {
                asm = '---';
            }
        }

        if (hexValue && hexValue !== '00' && asm !== '---') {
            temInstrucoes = true;
            const linhaDiv = document.createElement('div');
            linhaDiv.className = 'assembly-line';
            linhaDiv.setAttribute('data-linha', String(i));

            const numero = document.createElement('span');
            numero.className = 'assembly-line-no';
            numero.textContent = i.toString().padStart(2, '0') + ': ';

            const instr = document.createElement('span');
            instr.className = 'assembly-instruction';
            instr.textContent = safeText(asm);

            linhaDiv.appendChild(numero);
            linhaDiv.appendChild(instr);

            const mudou = assemblyAnterior[i] !== asm;
            if (mudou && assemblyAnterior.length > 0) {
                linhaDiv.classList.add('changed');
                setTimeout(() => linhaDiv.classList.remove('changed'), 600);
            }
            container.appendChild(linhaDiv);
        }
        novoAssembly.push(asm);
    }

    if (!temInstrucoes) {
        const mensagem = document.createElement('div');
        mensagem.className = 'assembly-empty-message';
        const l1 = document.createElement('div'); l1.textContent = 'Digite códigos hexadecimais na RAM';
        const l2 = document.createElement('div'); l2.textContent = 'para visualizar o Assembly em tempo real!';
        const l3 = document.createElement('div'); l3.textContent = '💡 Ex: 0A, 1F, E0, F0...'; l3.style.fontSize = '0.8em'; l3.style.marginTop = '8px'; l3.style.opacity = '0.8';
        mensagem.appendChild(l1); mensagem.appendChild(l2); mensagem.appendChild(l3);
        container.appendChild(mensagem);
    }
    
    assemblyAnterior = [...novoAssembly];
    return novoAssembly;
}

function aplicarModoEdicaoUI() {
    const isASM = editMode === 'asm';
    const textarea = document.getElementById('codigoMaquina');
    const montarBtn = document.getElementById('converterMaquina');
    const ramInputs = Array.from(document.querySelectorAll('.ran'));
    const memContainer = document.querySelector('.memoryran');
    const titleEl = document.getElementById('displayTitle');

    ramInputs.forEach(inp => inp.disabled = isASM);
    if (textarea) textarea.disabled = !isASM;
    if (montarBtn) montarBtn.disabled = !isASM;
    if (isASM && textarea) textarea.focus();
    if (memContainer) {
        memContainer.classList.toggle('is-asm', isASM);
        memContainer.classList.toggle('is-ram', !isASM);
    }
    if (titleEl) {
        titleEl.textContent = isASM ? 'Memória RAM em Tempo Real' : 'Assembly em Tempo Real';
    }
}

function popularTextareaComAssemblyAtual() {
    const textarea = document.getElementById('codigoMaquina');
    if (!textarea) return;
    const mem = (store && store.getAll) ? store.getAll() : new Array(16).fill('00');
    const linhas = [];
    // Instruções até o primeiro HLT
    const firstHLT = mem.findIndex(v => (v || '').toUpperCase() === 'F0');
    const lastInstrIdx = firstHLT >= 0 ? firstHLT : (mem.length - 1);

    for (let i = 0; i <= lastInstrIdx; i++) {
        const val = (mem[i] || '').toUpperCase();
        if (val.length >= 2) {
            const asm = converterHexParaAssembly(val);
            if (asm !== '---') linhas.push(asm);
        }
    }

    // Dados após HLT: formato "A 3", "B 4" (não listar zeros)
    if (firstHLT >= 0) {
        for (let i = firstHLT + 1; i < 16; i++) {
            const hex = (mem[i] || '').toUpperCase();
            if (hex.length === 2 && hex !== '00') {
                const dec = parseInt(hex, 16);
                const addrHex = i.toString(16).toUpperCase();
                linhas.push(`${addrHex} ${dec}`);
            }
        }
    }

    textarea.value = linhas.join('\n');
}

function isRamVazia() {
    const mem = (store && store.getAll) ? store.getAll() : new Array(16).fill('');
    for (let i = 0; i < 16; i++) {
        const v = (mem[i] || '').toUpperCase();
        if (v && v !== '00') return false;
    }
    return true;
}

function montarAssemblyParaRAM() {
    if (editMode !== 'asm') return; // Só monta automaticamente no modo ASM
    const textarea = document.getElementById('codigoMaquina');
    const errosBox = document.getElementById('asmErrors');
    if (!textarea) return;
    const source = textarea.value || '';

    const applyResult = (result) => {
        const { memory, errors, assignments } = result || {};
        if (store && store.setAll && Array.isArray(memory)) {
            store.setAll(memory, 'asm');
        } else if (Array.isArray(memory)) {
            for (let i = 0; i < 16; i++) {
                const el = document.getElementById('order' + (i + 1));
                if (el) el.value = memory[i];
            }
            atualizarRamPreview();
        }
        if (errosBox) {
            const errs = Array.isArray(errors) ? errors : [];
            if (errs.length) {
                errosBox.innerHTML = errs.map(e => `• ${e}`).join('<br>');
                errosBox.classList.add('visible');
                errosBox.style.display = 'block';
            } else {
                const summary = Array.isArray(assignments) && assignments.length ? ('\n' + assignments.map(s => `• ${s}`).join('\n')) : '';
                errosBox.textContent = 'Montagem concluída. RAM atualizada.' + summary;
                errosBox.classList.add('visible');
                errosBox.style.display = 'block';
                errosBox.style.whiteSpace = 'pre-line';
                errosBox.style.color = '#9effa3';
                errosBox.style.background = 'rgba(0,255,100,0.08)';
                errosBox.style.borderColor = 'rgba(0,255,100,0.25)';
                setTimeout(() => {
                    errosBox.style.removeProperty('color');
                    errosBox.style.removeProperty('background');
                    errosBox.style.removeProperty('border-color');
                }, 2500);
            }
        }
        atualizarAssemblyDaRAM();
    };

    // Tenta via worker
    if (window.Worker) {
        ensureWorkers();
        if (assemblerWorker) {
            try {
                const h = (ev) => {
                    const data = ev.data || {};
                    if (data.type === 'assembled') {
                        assemblerWorker.removeEventListener('message', h);
                        applyResult(data);
                    }
                };
                assemblerWorker.addEventListener('message', h, { once: true });
                assemblerWorker.postMessage({ type: 'assemble', source });
                return;
            } catch (e) {
                // fallback abaixo
            }
        }
    }
    // Fallback local
    try {
        if (window.AssemblerCore && typeof window.AssemblerCore.assemble === 'function') {
            const result = window.AssemblerCore.assemble(source);
            applyResult(result);
        }
    } catch (e) {
        if (errosBox) {
            errosBox.textContent = 'Falha ao montar: ' + (e && e.message ? e.message : String(e));
            errosBox.classList.add('visible');
            errosBox.style.display = 'block';
        }
    }
}

function atualizarRamPreview() {
    const mem = (store && store.getAll) ? store.getAll() : new Array(16).fill('');
    for (let i = 0; i < 16; i++) {
        const val = (mem[i] || '').toUpperCase();
        const cell = document.getElementById('preview' + (i + 1));
        if (cell) cell.textContent = (val.length === 2) ? val : '--';
    }
}

// Funções de animação do SAP-1
function resetAnimations() {
    // Remove todas as classes de animação
    document.querySelectorAll('.sap1-block').forEach(block => {
        block.classList.remove('active', 'operation-fetch', 'operation-execute', 'operation-store');
    });
    document.querySelectorAll('.arrow-img').forEach(arrow => {
        arrow.classList.remove('active');
    });
    document.getElementById('barramento').classList.remove('active');
}

function animateDataTransfer(fromElement, toElement) {
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();
    
    const dataPoint = document.createElement('div');
    dataPoint.className = 'data-transfer';
    dataPoint.style.left = (fromRect.left + fromRect.width / 2) + 'px';
    dataPoint.style.top = (fromRect.top + fromRect.height / 2) + 'px';
    dataPoint.style.position = 'fixed';
    
    document.body.appendChild(dataPoint);
    
    // Anima o movimento
    const deltaX = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
    const deltaY = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
    
    dataPoint.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    setTimeout(() => {
        if (dataPoint.parentNode) {
            dataPoint.parentNode.removeChild(dataPoint);
        }
    }, 1000);
}

function animateInstructionFetch() {
    resetAnimations();
    
    // Etapa 1: PC aponta para endereço
    setTimeout(() => {
        document.getElementById('pc').classList.add('active', 'operation-fetch');
        // Ativa seta do PC para barramento
        document.querySelector('#pc .arrow-img').classList.add('active');
    }, 100);
    
    // Etapa 2: Barramento transporta endereço
    setTimeout(() => {
        document.getElementById('barramento').classList.add('active');
        animateDataTransfer(
            document.getElementById('pc'),
            document.getElementById('ram')
        );
    }, 300);
    
    // Etapa 3: RAM acessa a instrução
    setTimeout(() => {
        document.getElementById('ram').classList.add('active', 'operation-fetch');
        document.querySelector('#ram .arrow-img').classList.add('active');
        // Destaca a célula atual no preview 4x4 (endereço PC)
        try { highlightRamPreviewCell(PC); } catch (e) {}
    }, 600);
    
    // Etapa 4: Instrução vai para RI
    setTimeout(() => {
        document.getElementById('ri').classList.add('active', 'operation-fetch');
        document.querySelector('#ri .arrow-img').classList.add('active');
        animateDataTransfer(
            document.getElementById('ram'),
            document.getElementById('ri')
        );
    }, 900);
    
    // Etapa 5: RI envia para controlador
    setTimeout(() => {
        document.getElementById('controlador').classList.add('active', 'operation-fetch');
        document.querySelector('#controlador .arrow-img').classList.add('active');
    }, 1200);
}

// === Indicador de Estados T (T1–T6) ===
function setTState(n) {
    const textEl = document.getElementById('tstate-text');
    const stepsEl = document.querySelector('.tstate-steps');
    if (!textEl || !stepsEl) return;

    const nClamped = (typeof n === 'number' && n >= 1 && n <= 6) ? n : null;
    textEl.textContent = nClamped ? `T${nClamped}` : '—';
    if (nClamped) stepsEl.setAttribute('aria-valuenow', String(nClamped));

    stepsEl.querySelectorAll('.tstep').forEach(step => {
        const t = parseInt(step.getAttribute('data-t'), 10);
        if (nClamped && t <= nClamped) step.classList.add('active');
        else step.classList.remove('active');
    });
}

function resetTState() {
    setTState(null);
}

// Destaca uma célula do preview 4x4 da RAM por um curto período
function highlightRamPreviewCell(addr, duration = 700) {
    if (addr == null || isNaN(addr)) return;
    const idx = Math.max(0, Math.min(15, parseInt(addr, 10)));
    const cell = document.getElementById('preview' + (idx + 1));
    if (!cell) return;
    cell.classList.add('ram-active');
    setTimeout(() => cell.classList.remove('ram-active'), duration);
}

function animateInstructionExecute(operation, hasMemoryAccess = false, targetAddress = null) {
    // Remove animações de busca
    setTimeout(() => {
        document.querySelectorAll('.operation-fetch').forEach(el => {
            el.classList.remove('operation-fetch');
        });
    }, 200);
    
    if (hasMemoryAccess && targetAddress !== null) {
        // Operações que acessam memória (LDA, ADD, SUB, MUL)
        setTimeout(() => {
            // RAM acessa dados
            document.getElementById('ram').classList.add('active', 'operation-execute');
            document.querySelector('#ram .arrow-img').classList.add('active');
            // Destaca a célula alvo no preview 4x4
            try { highlightRamPreviewCell(targetAddress); } catch (e) {}
        }, 400);
        
        setTimeout(() => {
            // Dados vão para Registrador B ou ACC
            if (operation === 'LDA') {
                document.getElementById('acc').classList.add('active', 'operation-execute');
                animateDataTransfer(
                    document.getElementById('ram'),
                    document.getElementById('acc')
                );
            } else {
                document.getElementById('regb').classList.add('active', 'operation-execute');
                animateDataTransfer(
                    document.getElementById('ram'),
                    document.getElementById('regb')
                );
            }
        }, 700);
        
        if (operation !== 'LDA') {
            // ALU processa os dados
            setTimeout(() => {
                document.getElementById('alu').classList.add('active', 'operation-execute');
                document.querySelector('#alu .arrow-img').classList.add('active');
                animateDataTransfer(
                    document.getElementById('regb'),
                    document.getElementById('alu')
                );
            }, 1000);
            
            // Resultado volta para ACC
            setTimeout(() => {
                document.getElementById('acc').classList.add('active', 'operation-execute');
                animateDataTransfer(
                    document.getElementById('alu'),
                    document.getElementById('acc')
                );
            }, 1300);
        }
    } else {
        // Operações simples (INC, DEC)
        setTimeout(() => {
            document.getElementById('acc').classList.add('active', 'operation-execute');
            document.getElementById('alu').classList.add('active', 'operation-execute');
            document.querySelector('#alu .arrow-img').classList.add('active');
        }, 400);
    }
}

function animateOutput() {
    setTimeout(() => {
        // ACC para registrador de saída
        document.getElementById('saida').classList.add('active', 'operation-store');
        document.querySelector('#saida .arrow-img').classList.add('active');
        animateDataTransfer(
            document.getElementById('acc'),
            document.getElementById('saida')
        );
    }, 200);
    
    setTimeout(() => {
        // Saída para display
        document.getElementById('visual').classList.add('active', 'operation-store');
        animateDataTransfer(
            document.getElementById('saida'),
            document.getElementById('visual')
        );
    }, 600);
}
function passoAtras() {
    if (passos.length > 1) {
        passos.pop(); // Remove o último passo
        // Re-inicializa e executa até o passo anterior
        resetAnimations();
        inicializar();
        for (let i = 1; i < passos.length; i++) {
            executarPassoInterno();
        }
        atualizarStatus();
        mostrarMensagemEstiloMario("Voltou um passo.");
    } else {
        mostrarMensagemEstiloMario("Não é possível voltar mais.");
    }
}

// Resetar
function resetar() {
    // Resetar variáveis globais
    PC = 0;
    ACC = 0;
    saida = [];
    running = false;
    
    // Limpar memória
    memoria.clear();
    
    // Resetar valores nos blocos SAP-1
    document.getElementById('pc-value').textContent = '0';
    document.getElementById('acc-value').textContent = '0';
    document.getElementById('mar-value').textContent = '--';
    document.getElementById('ram-value').textContent = '--';
    document.getElementById('ri-value').textContent = '--';
    document.getElementById('controller-value').textContent = 'IDLE';
    document.getElementById('alu-value').textContent = '--';
    document.getElementById('regb-value').textContent = '0';
    document.getElementById('output-value').textContent = '0';
    document.getElementById('display-value').textContent = '00000000';
    
    // Limpar campos da RAM
    for (let i = 1; i <= 16; i++) {
        const input = document.getElementById('order' + i);
        if (input) {
            input.value = '';
        }
    }
    
    // Limpar display de assembly
    const assemblyCode = document.getElementById('assemblyCode');
    if (assemblyCode) {
        assemblyCode.innerHTML = '<div class="assembly-line">Nenhum código inserido</div>';
    }
    
    // Resetar animações e destaques
    resetAnimations();
    removerDestaqueExecucao();
    
    // Atualizar status
    atualizarStatus();
    
    // Limpar console
    escreverNaLabel("");
    
    // Mostrar mensagem
    mostrarMensagemEstiloMario("Sistema resetado completamente!");

    // Cancelar execução no worker, se houver
    try {
        if (emulatorWorker && workerRunning) {
            emulatorWorker.postMessage({ type: 'cancel' });
        }
        workerRunning = false;
        tickQueue = [];
        animatingTick = false;
    } catch (e) {
        // ignore
    }
}

// Importar CSV
function importarCSVParaMemoria(csvText) {
    if (typeof csvText !== 'string') throw new Error('Conteúdo inválido');
    const linhasBrutas = csvText.split(/\r?\n/).map(l => l.trim());
    // Ignorar linhas vazias e comentários iniciados por # ou ;
    const linhas = linhasBrutas.filter(l => l.length > 0 && !/^\s*[#;]/.test(l));
    if (linhas.length < 16) {
        throw new Error('Arquivo possui menos de 16 linhas válidas');
    }
    const arr = new Array(16);
    for (let i = 0; i < 16; i++) {
        let valor = (linhas[i] || '').toUpperCase().replace(/[^0-9A-F]/g, '');
        if (valor.length === 0) valor = '00';
        if (valor.length > 2) valor = valor.slice(0,2);
        if (!/^[0-9A-F]{2}$/.test(valor)) {
            throw new Error(`Valor inválido na linha ${i+1}: ${linhas[i]}`);
        }
        arr[i] = valor;
    }
    if (store && store.setAll) {
        store.setAll(arr, 'csv');
    } else {
        for (let i = 0; i < 16; i++) {
            const input = document.getElementById('order' + (i + 1));
            if (input) input.value = arr[i];
        }
        atualizarAssemblyDaRAM();
        atualizarRamPreview();
    }
    inicializar();
    atualizarStatus();
    mostrarMensagemEstiloMario("Memória carregada do arquivo!");
}

// Exibe mensagens estilo Mario Bros
function mostrarMensagemEstiloMario(texto, tipo = 'info') {
    const consoleDiv = document.getElementById('console-log');
    if (!consoleDiv) return;
    try {
        const safe = safeText(texto);
        if (tipo === 'error') {
            consoleDiv.classList.add('is-error');
            consoleDiv.innerHTML = `<img src="assets/img/bug.png" alt="" aria-hidden="true" class="icon-inline" /> ${safe}`;
        } else {
            consoleDiv.classList.remove('is-error');
            consoleDiv.textContent = safe;
        }
        consoleDiv.style.display = 'block';
        clearTimeout(consoleDiv._hideTimer);
        consoleDiv._hideTimer = setTimeout(() => {
            consoleDiv.style.display = 'none';
        }, 5000);
    } catch(_) {
        consoleDiv.textContent = String(texto || '');
        consoleDiv.style.display = 'block';
        setTimeout(() => { consoleDiv.style.display = 'none'; }, 5000);
    }
}

function inicializar() {
    // Captura RAM atual como hex a partir do MemoryStore
    memoria = new Map();
    const memHex = (store && store.getAll) ? store.getAll().map(v => (v || '').toUpperCase().replace(/[^0-9A-F]/g, '').padStart(2, '0')) : new Array(16).fill('00');
    for (let i = 0; i < 16; i++) memoria.set(i, memHex[i]);

    // Instancia núcleo do emulador determinístico
    try {
        core = new (window.EmulatorCore && window.EmulatorCore.Emulator ? window.EmulatorCore.Emulator : function(){ throw new Error('EmulatorCore indisponível'); })();
        core.loadMemoryFromHex(memHex);
        core.reset();
    } catch (e) {
        console.error('Falha ao inicializar núcleo do emulador:', e);
        mostrarMensagemEstiloMario('Erro ao inicializar o núcleo do emulador.');
        running = false;
        return;
    }

    // Espelha estado no legado
    PC = core.PC;
    ACC = core.ACC;
    passos = [];
    saida = [];
    running = true;
    
    // Atualizar valores iniciais nos blocos
    document.getElementById('pc-value').textContent = '0';
    document.getElementById('acc-value').textContent = '0';
    document.getElementById('mar-value').textContent = '--';
    document.getElementById('ram-value').textContent = '--';
    document.getElementById('ri-value').textContent = '--';
    document.getElementById('controller-value').textContent = 'READY';
    document.getElementById('alu-value').textContent = '--';
    document.getElementById('regb-value').textContent = '0';
    document.getElementById('output-value').textContent = '0';
    document.getElementById('display-value').textContent = '00000000';
    
    passos.push("Início: PC=0, ACC=0");
    resetAnimations();
}

// Função para atualizar valores individuais nos blocos
function atualizarValorBloco(blocoId, valor) {
    const elemento = document.getElementById(blocoId);
    if (elemento) {
        elemento.textContent = valor;
        // Adicionar efeito visual de atualização
        elemento.style.transform = 'scale(1.1)';
        elemento.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.8)';
        setTimeout(() => {
            elemento.style.transform = 'scale(1)';
            elemento.style.boxShadow = '';
        }, 300);
    }
}

// Função para mostrar operação na ALU
function mostrarOperacaoALU(operacao, valorA, valorB, resultado) {
    const aluValue = document.getElementById('alu-value');
    if (aluValue) {
        aluValue.textContent = `${operacao}`;
        setTimeout(() => {
            aluValue.textContent = resultado;
        }, 500);
    }
}

function atualizarStatus(instrucaoAtual = '') {
    // Atualizar valores nos blocos SAP-1
    const pcValue = document.getElementById('pc-value');
    const accValue = document.getElementById('acc-value');
    const riValue = document.getElementById('ri-value');
    const outputValue = document.getElementById('output-value');
    const displayValue = document.getElementById('display-value');
    
    if (pcValue) pcValue.textContent = PC;
    if (accValue) accValue.textContent = ACC;
    if (riValue) {
        const riHex = instrucaoAtual || (core ? core.peekCurrentInstrHex() : (memoria.get(PC) || '--'));
        riValue.textContent = riHex || '--';
    }
    if (outputValue) {
        const lastUnsigned = saida.length > 0 ? (saida[saida.length - 1] >>> 0) : 0;
        const signed = toSigned8(lastUnsigned);
        outputValue.textContent = String(signed);
        // Dica: mostrar também o valor sem sinal no title
        outputValue.title = `sem sinal: ${lastUnsigned}`;
    }
    if (displayValue) {
        const lastOutput = saida.length > 0 ? parseInt(saida[saida.length - 1]) : 0;
        displayValue.textContent = lastOutput.toString(2).padStart(8, '0');
    }
    
    // Destaca a linha atual sendo executada
    destacarLinhaAtual(PC);
}

// Evento para conversão assembly em tempo real baseado na RAM
function adicionarEventosRAM() {
    for (let i = 1; i <= 16; i++) {
        const input = document.getElementById('order' + i);
        if (input) {
            input.addEventListener('input', function(e) {
                const v = (e.target.value || '').toUpperCase().replace(/[^0-9A-F]/g, '').slice(0,2);
                e.target.value = v; // mantém parcial
                if (store && store.setByte) store.setByte(i - 1, v, 'ram');
            });
            input.addEventListener('blur', function(e) {
                const v = ((e.target.value || '').toUpperCase().replace(/[^0-9A-F]/g, '')).slice(0,2).padStart(2,'0');
                e.target.value = v;
                if (store && store.setByte) store.setByte(i - 1, v, 'ram');
            });
        }
    }
}

// Monta o Assembly digitado e aplica automaticamente na RAM
// REMOVIDO: definição duplicada de montarAssemblyParaRAM substituída por versão superior no topo do arquivo

function atualizarRamPreview() {
    for (let i = 0; i < 16; i++) {
        const val = (document.getElementById('order' + (i + 1))?.value || '--').toUpperCase();
        const cell = document.getElementById('preview' + (i + 1));
        if (cell) cell.textContent = val && val.length ? val : '--';
    }
}

// Evento para aplicar o código na memória
const converterMaquinaBtn = document.getElementById('converterMaquina');
if (converterMaquinaBtn) {
    converterMaquinaBtn.addEventListener('click', function () {
        editMode = 'asm';
        document.getElementById('modeAsm')?.setAttribute('checked', 'checked');
        document.getElementById('modeRam')?.removeAttribute('checked');
        aplicarModoEdicaoUI();
        montarAssemblyParaRAM();
        inicializar();
        atualizarStatus();
        mostrarMensagemEstiloMario('Assembly montado e aplicado na RAM!');
    });
}

// Decodifica instrução
function decode(instr) {
    if (!instr || instr.length < 2) {
        return { op: '???', arg: 0 };
    }
    const opcodeHex = instr[0];
    const arg = parseInt(instr[1], 16);
    const OPCODES = {
        '0': 'LDA',
        '1': 'ADD',
        '2': 'SUB',
        '3': 'INC',
        '4': 'DEC',
        '5': 'MUL',
        '6': 'JMP',
        'E': 'OUT',
        'F': 'HLT'
    };
    const op = OPCODES[opcodeHex] || '???';
    return { op, arg: isNaN(arg) ? 0 : arg };
}

// Função para destacar a linha atual sendo executada
function destacarLinhaAtual(pc) {
    // Remove destaque de todas as linhas
    document.querySelectorAll('.assembly-line').forEach(linha => {
        linha.classList.remove('executing');
    });
    
    // Destaca a linha atual no assembly (se existir)
    const linhaAtual = document.querySelector(`[data-linha="${pc}"]`);
    if (linhaAtual) {
        linhaAtual.classList.add('executing');
        console.log(`Destacando linha ${pc} para execução`); // Debug
    }
}

// Função para remover destaque da execução
function removerDestaqueExecucao() {
    document.querySelectorAll('.assembly-line').forEach(linha => {
        linha.classList.remove('executing');
    });
}

// Executa um passo
function executarPasso() {
    if (!running || !core || core.halted || PC >= 16) {
        mostrarMensagemEstiloMario(passos.join('\n') + (saida.length ? "\nSaída: " + saida.join(', ') : ''));
        return;
    }
    // Obter instrução atual (antes do step)
    const instr = core.peekCurrentInstrHex();
    const decoded = (function decodeHex(hx){
        if (!hx || hx.length < 2) return { op:'???', arg:0 };
        const opcode = parseInt(hx[0], 16);
        const arg = parseInt(hx[1], 16);
        const map = {0:'LDA',1:'ADD',2:'SUB',3:'INC',4:'DEC',5:'MUL',6:'JMP',14:'OUT',15:'HLT'};
        return { op: map.hasOwnProperty(opcode)? map[opcode]:'???', arg: isNaN(arg)?0:arg };
    })(instr);
    const op = decoded.op; const arg = decoded.arg;

    // Define duração base para micro-passos T1..T6 em função da velocidade
    const stepDur = Math.max(120, Math.floor(animationSpeed / 6));

    // Inicia animação de busca de instrução
    animateInstructionFetch();
    // Avança Estados T durante a busca
    resetTState();
    setTState(1);
    setTimeout(() => setTState(2), stepDur);
    setTimeout(() => setTState(3), stepDur * 2);

    // Aguarda a animação de busca terminar, então executa
    setTimeout(() => {
        // Executa 1 passo no núcleo determinístico
        const result = core.step();
        const opName = result.decode.opName;
        const argVal = result.decode.arg;
        const hasMem = ['LDA','ADD','SUB','MUL'].includes(opName);

        passos.push(`PC=${result.before.PC} | Instr: ${instr} | ACC=${result.before.ACC}`);

        if (opName === 'JMP') {
            passos.push(`JMP para ${argVal}`);
            atualizarValorBloco('controller-value', `JMP→${argVal}`);
        }

        // Anima execução conforme tipo
        if (opName === 'OUT') {
            animateOutput();
        } else if (opName && opName !== 'HLT' && opName !== '???') {
            animateInstructionExecute(opName, hasMem, hasMem ? argVal : null);
        }

        // Atualiza valores de UI (ACC/PC/REGs) segundo resultado
        ACC = result.after.ACC;
        PC = result.after.PC;

        // Valores auxiliares para UI (REG B, ALU, MAR, RAM value)
        if (hasMem) {
            atualizarValorBloco('mar-value', argVal);
            const memHexVal = core.getInstrHexAt(argVal);
            atualizarValorBloco('ram-value', memHexVal || '--');
            if (opName !== 'LDA') {
                const rb = result.readVal ?? parseInt(memHexVal || '00', 16);
                atualizarValorBloco('regb-value', rb);
                const preview = (opName === 'ADD') ? (result.before.ACC + rb)
                               : (opName === 'SUB') ? (result.before.ACC - rb)
                               : (opName === 'MUL') ? (result.before.ACC * rb)
                               : result.after.ACC;
                mostrarOperacaoALU(opName, result.before.ACC, rb, preview);
            }
        } else if (opName === 'INC' || opName === 'DEC') {
            const delta = (opName === 'INC') ? 1 : -1;
            mostrarOperacaoALU(opName, result.before.ACC, Math.abs(delta), result.before.ACC + delta);
        }

        if (opName === 'OUT') {
            // OUT usa ACC antes da operação como saída (no core outputs foi empurrada)
            const last = core.outputs.length ? core.outputs[core.outputs.length - 1] : result.before.ACC;
            saida.push(last);
            // Mostrar como valor com sinal
            atualizarValorBloco('output-value', toSigned8(last));
            atualizarValorBloco('display-value', (last >>> 0).toString(2).padStart(8, '0'));
            passos.push(`OUT: ${last}`);
            try { sfx.out.currentTime = 0; sfx.out.play(); } catch(_) {}
        }
        if (opName === 'HLT') {
            passos.push('HLT: Parada');
            atualizarValorBloco('controller-value', 'HALT');
            running = false;
        }
        if (result.fault) {
            passos.push(result.fault);
            running = false;
            try { sfx.alert.currentTime = 0; sfx.alert.play(); } catch(_) {}
            try { mostrarMensagemEstiloMario(result.fault, 'error'); } catch(_) {}
        }

        // Avança Estados T durante a execução (T4..T6)
        setTState(4);
        setTimeout(() => setTState(5), stepDur);
        setTimeout(() => setTState(6), stepDur * 2);

        mostrarMensagemEstiloMario(passos[passos.length - 1]);
        
        // Atualiza status após a animação
        setTimeout(() => {
            atualizarStatus(instr);
        }, 500);
        
    }, animationSpeed);
}

// Executa tudo com animações
function executarTudo() {
    // Executa via Web Worker para não travar a UI
    // Sempre reinicializa para garantir ACC=0, PC=0 e limpeza de estado entre execuções
    try {
        if (emulatorWorker && workerRunning) {
            emulatorWorker.postMessage({ type: 'cancel' });
            workerRunning = false;
            tickQueue = [];
            animatingTick = false;
        }
    } catch (_) {}
    inicializar();
    resetAnimations();
    mostrarMensagemEstiloMario("Executando (worker)...");

    ensureWorkers();
    if (!emulatorWorker) {
        // fallback para o modo antigo
        return (function fallback(){
            const MAX_STEPS = 256; let steps = 0; let interrompidoPorLimite = false;
            const loop = () => {
                const podeContinuar = running && core && !core.halted && PC < 16 && steps < MAX_STEPS;
                if (podeContinuar) {
                    executarPasso(); steps++; setTimeout(loop, animationSpeed + 500);
                } else {
                    if (steps >= MAX_STEPS && core && !core.halted) interrompidoPorLimite = true;
                    setTimeout(() => {
                        const base = passos.join('\n') + (saida.length ? "\nSaída: " + saida.join(', ') : '');
                        const aviso = interrompidoPorLimite ? `\nExecução interrompida: limite de ${MAX_STEPS} passos atingido (possível loop sem HLT).` : '';
                        mostrarMensagemEstiloMario(base + aviso);
                        resetAnimations();
                    }, 1000);
                }
            };
            loop();
        })();
    }

    try {
        workerRunning = true;
        tickQueue = [];
        animatingTick = false;
        const memHex = (store && store.getAll) ? store.getAll().map(v => (v || '').toUpperCase()) : new Array(16).fill('00');

        const onMsg = (ev) => {
            const data = ev.data || {};
            if (data.type === 'tick') {
                tickQueue.push(data);
                processTickQueue();
            } else if (data.type === 'done') {
                workerRunning = false;
                const reason = data.reason || 'DONE';
                const base = passos.join('\n') + (saida.length ? "\nSaída: " + saida.join(', ') : '');
                const aviso = (reason === 'MAX_STEPS') ? `\nExecução interrompida: limite de 256 passos.` : (reason === 'CANCELED' ? '\nExecução cancelada.' : '');
                setTimeout(() => {
                    mostrarMensagemEstiloMario(base + aviso);
                    resetAnimations();
                }, 300);
                emulatorWorker.removeEventListener('message', onMsg);
            }
        };
        emulatorWorker.addEventListener('message', onMsg);
        const stepMs = Math.max(0, parseInt(animationSpeed, 10) || 0);
        emulatorWorker.postMessage({ type: 'run', memory: memHex, maxSteps: 256, speed: stepMs });
    } catch (e) {
        workerRunning = false;
    }
}

function processTickQueue() {
    if (animatingTick) return;
    const item = tickQueue.shift();
    if (!item) return;
    animatingTick = true;
    try {
        renderTickFromWorker(item);
    } finally {
        setTimeout(() => {
            animatingTick = false;
            processTickQueue();
        }, (parseInt(animationSpeed, 10) || 1500) + 400);
    }
}

function renderTickFromWorker(tick) {
    // tick: { fetched, decode:{opName,arg}, before, after, outputEmitted, fault }
    const instrHex = (tick && typeof tick.fetched === 'number') ? (tick.fetched & 0xFF).toString(16).toUpperCase().padStart(2, '0') : '--';
    const opName = tick && tick.decode ? tick.decode.opName : '???';
    const argVal = tick && tick.decode ? tick.decode.arg : 0;
    const hasMem = ['LDA','ADD','SUB','MUL'].includes(opName);

    // Usa mesmas animações básicas do executarPasso(), mas sem chamar core.step()
    animateInstructionFetch();
    const stepDur = Math.max(120, Math.floor(animationSpeed / 6));
    resetTState();
    setTState(1);
    setTimeout(() => setTState(2), stepDur);
    setTimeout(() => setTState(3), stepDur * 2);

    setTimeout(() => {
        if (opName === 'OUT') {
            animateOutput();
        } else if (opName && opName !== 'HLT' && opName !== '???') {
            animateInstructionExecute(opName, hasMem, hasMem ? argVal : null);
        }

        // Aplicar efeitos/valores em UI
        const beforeACC = tick.before ? tick.before.ACC : ACC;
        if (hasMem) {
            atualizarValorBloco('mar-value', argVal);
            const memHexAt = (store && store.getAll) ? (store.getAll()[argVal] || '--') : '--';
            atualizarValorBloco('ram-value', memHexAt || '--');
            if (opName !== 'LDA') {
                const rb = tick.readVal ?? parseInt(memHexAt || '00', 16);
                atualizarValorBloco('regb-value', rb);
                const preview = (opName === 'ADD') ? (beforeACC + rb)
                               : (opName === 'SUB') ? (beforeACC - rb)
                               : (opName === 'MUL') ? (beforeACC * rb)
                               : (tick.after ? tick.after.ACC : ACC);
                mostrarOperacaoALU(opName, beforeACC, rb, preview);
            }
        } else if (opName === 'INC' || opName === 'DEC') {
            const delta = (opName === 'INC') ? 1 : -1;
            mostrarOperacaoALU(opName, beforeACC, Math.abs(delta), beforeACC + delta);
        }

        // Atualiza estados globais
        ACC = tick.after ? (tick.after.ACC || 0) : ACC;
        PC = tick.after ? (tick.after.PC || 0) : PC;

        if (opName === 'OUT') {
            const last = (tick.before && typeof tick.before.ACC === 'number') ? tick.before.ACC : ACC;
            saida.push(last);
            atualizarValorBloco('output-value', toSigned8(last));
            atualizarValorBloco('display-value', (last >>> 0).toString(2).padStart(8, '0'));
            passos.push(`OUT: ${last}`);
            try { sfx.out.currentTime = 0; sfx.out.play(); } catch(_) {}
        }
        if (opName === 'JMP') {
            passos.push(`JMP para ${argVal}`);
            atualizarValorBloco('controller-value', `JMP→${argVal}`);
        }
        if (opName === 'HLT') {
            passos.push('HLT: Parada');
            atualizarValorBloco('controller-value', 'HALT');
            running = false;
        }
        if (tick.fault) {
            passos.push(tick.fault);
            running = false;
            try { sfx.alert.currentTime = 0; sfx.alert.play(); } catch(_) {}
            try { mostrarMensagemEstiloMario(tick.fault, 'error'); } catch(_) {}
        }

        // Avança T4..T6
        setTState(4);
        setTimeout(() => setTState(5), stepDur);
        setTimeout(() => setTState(6), stepDur * 2);

        mostrarMensagemEstiloMario(passos[passos.length - 1] || `Instr ${instrHex}`);
        setTimeout(() => atualizarStatus(instrHex), 500);
    }, animationSpeed);
}

function ensureWorkers() {
    try {
        if (!window.Worker) return;
        if (!emulatorWorker) {
            emulatorWorker = new Worker('assets/js/workers/emulator.worker.js');
        }
        if (!assemblerWorker) {
            assemblerWorker = new Worker('assets/js/workers/assembler.worker.js');
        }
    } catch (e) {
        console.warn('Workers indisponíveis:', e);
    }
}

// Versão interna sem mostrar mensagem
function executarPassoInterno() {
    if (!running || !core || core.halted || PC >= 16) return;
    const res = core.step();
    ACC = res.after.ACC;
    PC = res.after.PC;
    if (res.decode && res.decode.opName === 'OUT') {
        const last = core.outputs.length ? core.outputs[core.outputs.length - 1] : res.before.ACC;
        saida.push(last);
    }
    if (res.decode && res.decode.opName === 'JMP') {
        passos.push(`JMP para ${res.decode.arg}`);
    }
    if (res.halted) running = false;
}

// Escreve saída final no console Mario
function escreverNaLabel(mensagem) {
    mostrarMensagemEstiloMario(mensagem);
}

// Botões e eventos
document.addEventListener('DOMContentLoaded', function () {
    // Cria MemoryStore e conecta assinantes
    if (!store && window.MemoryStore && typeof window.MemoryStore.create === 'function') {
        store = window.MemoryStore.create();
        // Inicializa store com valores dos inputs (se houver) para preservar estado visual atual
        const initArr = new Array(16);
        for (let i = 0; i < 16; i++) {
            const el = document.getElementById('order' + (i + 1));
            const v = (el && el.value ? el.value : '').toUpperCase().replace(/[^0-9A-F]/g, '').slice(0,2);
            initArr[i] = v;
        }
        store.setAll(initArr, 'init');

        store.subscribe(({ source, next }) => {
            // Atualiza preview e assembly sempre
            atualizarRamPreview();
            atualizarAssemblyDaRAM();
            // Sincroniza inputs quando a mudança não veio do próprio input
            if (source !== 'ram') {
                syncingInputs = true;
                for (let i = 0; i < 16; i++) {
                    const el = document.getElementById('order' + (i + 1));
                    if (el) el.value = (next[i] || '').toUpperCase();
                }
                syncingInputs = false;
            }
        });
    }
    // Inicializa o display de assembly baseado na RAM
    atualizarAssemblyDaRAM();
    aplicarModoEdicaoUI();
    
    // Adiciona eventos de input nos campos da RAM
    adicionarEventosRAM();
    atualizarRamPreview();

    // Clique nas linhas do assembly: foca RAM correspondente e troca para modo RAM
    try {
        const assemblyContainer = document.getElementById('assemblyCode');
        if (assemblyContainer) {
            assemblyContainer.addEventListener('click', (ev) => {
                const line = ev.target.closest('.assembly-line');
                if (!line) return;
                const idx = parseInt(line.getAttribute('data-linha'), 10);
                if (isNaN(idx)) return;
                const input = document.getElementById('order' + (idx + 1));
                const modeRam = document.getElementById('modeRam');
                const modeAsm = document.getElementById('modeAsm');
                if (modeRam && modeAsm) {
                    modeRam.checked = true;
                    modeAsm.checked = false;
                    editMode = 'ram';
                    aplicarModoEdicaoUI();
                }
                if (input) {
                    input.focus();
                    input.select();
                }
            });
        }
    } catch (e) {
        console.warn('Falha ao conectar clique no assembly:', e);
    }
    
    document.getElementById('passo').addEventListener('click', function () {
        if (editMode === 'asm') montarAssemblyParaRAM();
        if (!running || passos.length === 0) {
            inicializar();
        }
        executarPasso();
    });

    document.getElementById('emular').addEventListener('click', function () {
        if (editMode === 'asm') montarAssemblyParaRAM();
        inicializar();
        executarTudo();
    });

    document.getElementById('passo-atras').addEventListener('click', passoAtras);
    document.getElementById('resetar').addEventListener('click', resetar);

    // Botão para carregar CSV
    document.getElementById('loadCSV').addEventListener('click', function() {
        document.getElementById('csvInput').click();
    });

    // Controle de velocidade
    document.getElementById('speedRange').addEventListener('input', function() {
        animationSpeed = parseInt(this.value);
        const speedLabels = {
            500: 'Rápido',
            750: 'Rápido',
            1000: 'Rápido',
            1250: 'Normal',
            1500: 'Normal',
            1750: 'Normal',
            2000: 'Lento',
            2250: 'Lento',
            2500: 'Muito Lento',
            2750: 'Muito Lento',
            3000: 'Muito Lento'
        };
        document.getElementById('speedValue').textContent = speedLabels[animationSpeed] || 'Normal';
    });

    document.getElementById('csvInput').addEventListener('change', function (e) {
        try {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 256 * 1024) {
                mostrarMensagemEstiloMario("Arquivo muito grande (>256KB). Use um CSV/TXT com até 16 linhas.");
                return;
            }
            const reader = new FileReader();
            reader.onerror = () => mostrarMensagemEstiloMario("Erro ao ler o arquivo. Tente novamente.");
            reader.onload = function (evt) {
                try {
                    importarCSVParaMemoria(evt.target.result);
                } catch (err) {
                    mostrarMensagemEstiloMario("Formato inválido: 16 linhas com 2 dígitos hex (ex: 0A, 1F).");
                }
            };
            reader.readAsText(file);
        } catch (err) {
            mostrarMensagemEstiloMario("Não foi possível processar o arquivo selecionado.");
        }
    });

    // Atualização em tempo real da sequência
    const codigoMaquinaElement = document.getElementById('codigoMaquina');
    if (codigoMaquinaElement) {
        codigoMaquinaElement.addEventListener('input', function() {
            if (editMode !== 'asm') return;
            asmTouched = true;
            clearTimeout(asmDebounce);
            asmDebounce = setTimeout(() => {
                montarAssemblyParaRAM();
            }, 250);
        });
    }

    // Aplicar sequência à memória
    // Botão alternativo (se existir)
    const aplicarSequenciaBtn = document.getElementById('aplicarSequencia');
    if (aplicarSequenciaBtn) {
        aplicarSequenciaBtn.addEventListener('click', () => {
            montarAssemblyParaRAM();
            inicializar();
            atualizarStatus();
        });
    }

        // Ajuda SAP-1: em telas pequenas, abrir conteúdo como modal
        try {
            const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
            const isSmall = window.matchMedia('(max-width: 768px)').matches;
            const helpIcon = document.querySelector('.sap-help-icon');
            const innerTooltip = helpIcon ? helpIcon.querySelector('.sap-tooltip') : null;
            if (helpIcon && innerTooltip && (isCoarsePointer || isSmall)) {
                // Cria overlay modal
                const overlay = document.createElement('div');
                overlay.className = 'sap-help-overlay';
                overlay.setAttribute('role', 'dialog');
                overlay.setAttribute('aria-modal', 'true');
                overlay.setAttribute('aria-labelledby', 'sapHelpTitle');
                overlay.innerHTML = `
                    <div class="sap-help-card" tabindex="-1">
                        <button class="sap-help-close" aria-label="Fechar ajuda">✖</button>
                        <h3 id="sapHelpTitle" style="margin-top:0;">Ajuda SAP-1</h3>
                        ${innerTooltip.innerHTML}
                    </div>`;
                document.body.appendChild(overlay);

                const openModal = (e) => {
                    e.preventDefault();
                    overlay.classList.add('visible');
                    const card = overlay.querySelector('.sap-help-card');
                    if (card) card.focus();
                };
                const closeModal = () => {
                    overlay.classList.remove('visible');
                    helpIcon.focus();
                };

                helpIcon.addEventListener('click', openModal);
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) closeModal();
                });
                overlay.querySelector('.sap-help-close').addEventListener('click', closeModal);
                document.addEventListener('keydown', (ev) => {
                    if (overlay.classList.contains('visible') && ev.key === 'Escape') closeModal();
                });
            }
        } catch (err) {
            console.warn('Falha ao inicializar modal de ajuda SAP-1:', err);
        }

        // Toggle do modo de edição (RAM vs ASM)
        try {
            const modeRam = document.getElementById('modeRam');
            const modeAsm = document.getElementById('modeAsm');
            const errosBox = document.getElementById('asmErrors');
            if (modeRam && modeAsm) {
                const onChange = () => {
                    editMode = modeAsm.checked ? 'asm' : 'ram';
                    aplicarModoEdicaoUI();
                    if (editMode === 'asm') {
                        // Primeira vez no editor: se RAM está vazia e o usuário ainda não digitou, deixa vazio
                        if (!asmTouched && isRamVazia()) {
                            const ta = document.getElementById('codigoMaquina');
                            if (ta) ta.value = '';
                        } else {
                            popularTextareaComAssemblyAtual();
                        }
                        montarAssemblyParaRAM(); // sincroniza RAM a partir do textarea
                        if (errosBox) { errosBox.style.display = 'none'; errosBox.classList.remove('visible'); }
                        atualizarRamPreview();
                    } else {
                        // Ao voltar para RAM, monta uma vez para garantir que RAM reflita último Assembly
                        montarAssemblyParaRAM();
                        if (errosBox) { errosBox.style.display = 'none'; errosBox.classList.remove('visible'); }
                        atualizarRamPreview();
                    }
                    atualizarAssemblyDaRAM();
                };
                modeRam.addEventListener('change', onChange);
                modeAsm.addEventListener('change', onChange);
            }
        } catch (e) {
            console.warn('Falha ao conectar switch de modo:', e);
        }
});

const memoryDiv = document.querySelector('.memoryran');
const otherLogicDiv = document.querySelector('.other-logic');
const toggleBtn = document.getElementById('toggleLogic');

if (toggleBtn && memoryDiv && otherLogicDiv) {
    toggleBtn.addEventListener('click', () => {
        if (memoryDiv.style.display === 'none') {
            memoryDiv.style.display = '';
            otherLogicDiv.style.display = 'none';
        } else {
            memoryDiv.style.display = 'none';
            otherLogicDiv.style.display = '';
        }
    });
}

// deixar mudo 
document.addEventListener('DOMContentLoaded', () => {
    const music = document.getElementById('bg-music');
    const muteBtn = document.getElementById('muteToggle');
    // SFX: pré-carregar e gerenciar estado de mute em conjunto com a música
    const sfx = {
        click: new Audio('assets/audio/ui_click.ogg'),
        hover: new Audio('assets/audio/ui_hover.ogg'),
        toggle: new Audio('assets/audio/ui_toggle.ogg'),
        alert: new Audio('assets/audio/ui_alert.ogg'),
        out: new Audio('assets/audio/ui_out.ogg'),
        setMuted(m) {
            this.click.muted = m; this.hover.muted = m; this.toggle.muted = m; this.alert.muted = m; this.out.muted = m;
        },
        init() {
            const v = 0.25; this.click.volume = v; this.hover.volume = 0.2; this.toggle.volume = 0.22; this.alert.volume = 0.28; this.out.volume = 0.18;
            this.setMuted(music ? music.muted : true);
        }
    };
    try { sfx.init(); } catch(_) {}

    // Ensure ARIA state
    const updateMuteAria = () => {
        muteBtn.setAttribute('aria-pressed', String(!music.muted));
        muteBtn.setAttribute('aria-label', music.muted ? 'Ativar som' : 'Desativar som');
    };
    updateMuteAria();

    muteBtn.addEventListener('click', () => {
        music.muted = !music.muted;
        muteBtn.textContent = music.muted ? '🔇' : '🔊';
        updateMuteAria();
        // manter SFX em sincronia com o estado
        sfx.setMuted(music.muted);
        try { if (!music.muted) { sfx.toggle.currentTime = 0; sfx.toggle.play(); } } catch(_) {}
    });

    // Sons de UI: hover e click em botões principais
    try {
        const buttons = document.querySelectorAll('.li-btn, button, .btn, [role="button"]');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => { try { sfx.hover.currentTime = 0; sfx.hover.play(); } catch(_) {} });
            btn.addEventListener('click', () => { try { sfx.click.currentTime = 0; sfx.click.play(); } catch(_) {} });
        });
    } catch(_) {}
});
