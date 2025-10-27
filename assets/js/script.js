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
        if (argumento && argumento !== '0') {
            return `${operacao} A${argumento}`;
        } else {
            return `${operacao} A0`;
        }
    }
    
    // Operações sem argumento
    return operacao;
}

// Função para atualizar o display de assembly baseado na RAM
function atualizarAssemblyDaRAM() {
    const container = document.getElementById('assemblyCode');
    if (!container) return;
    
    container.innerHTML = '';
    const novoAssembly = [];
    let temInstrucoes = false;
    
    for (let i = 0; i < 16; i++) {
        const ramInput = document.getElementById('order' + (i + 1));
        const hexValue = ramInput ? ramInput.value.trim().toUpperCase() : '';
        
        if (hexValue && hexValue !== '00') {
            const assembly = converterHexParaAssembly(hexValue);
            if (assembly !== '---') {
                temInstrucoes = true;
                const linhaDiv = document.createElement('div');
                linhaDiv.className = 'assembly-line';
                linhaDiv.setAttribute('data-linha', i);
                const numeroFormatado = i.toString().padStart(2, '0');
                linhaDiv.innerHTML = `${numeroFormatado}: <span class="assembly-instruction">${assembly}</span>`;
                const mudou = assemblyAnterior[i] !== assembly;
                if (mudou && assemblyAnterior.length > 0) {
                    linhaDiv.classList.add('changed');
                    setTimeout(() => linhaDiv.classList.remove('changed'), 600);
                }
                container.appendChild(linhaDiv);
            }
        }
        novoAssembly.push(hexValue ? converterHexParaAssembly(hexValue) : '---');
    }
    
    if (!temInstrucoes) {
        const mensagem = document.createElement('div');
        mensagem.className = 'assembly-empty-message';
        mensagem.innerHTML = `
            <div>Digite códigos hexadecimais na RAM</div>
            <div>para visualizar o Assembly em tempo real!</div>
            <div style="font-size: 0.8em; margin-top: 8px; opacity: 0.8;">💡 Ex: 0A, 1F, E0, F0...</div>
        `;
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
    const linhas = [];
    for (let i = 0; i < 16; i++) {
        const val = (document.getElementById('order' + (i + 1))?.value || '').trim().toUpperCase();
        const asm = converterHexParaAssembly(val);
        linhas.push(asm === '---' ? '' : asm);
    }
    textarea.value = linhas.join('\n');
}

function isRamVazia() {
    for (let i = 0; i < 16; i++) {
        const v = (document.getElementById('order' + (i + 1))?.value || '').trim().toUpperCase();
        if (v && v !== '00') return false;
    }
    return true;
}

function montarAssemblyParaRAM() {
    if (editMode !== 'asm') return; // Só monta automaticamente no modo ASM
    const textarea = document.getElementById('codigoMaquina');
    const errosBox = document.getElementById('asmErrors');
    if (!textarea) return;

    let bruto = textarea.value.replace(/[,;]+/g, '\n');
    // Normaliza espaços não separáveis (NBSP) e similares
    bruto = bruto.replace(/\u00A0/g, ' ');
    const linhasBrutas = bruto.split(/\r?\n/);
    const linhas = [];
    for (const l of linhasBrutas) linhas.push(l.trim());

    const OPC = {
        LDA: { code: '0', arg: 'nibble' },
        ADD: { code: '1', arg: 'nibble' },
        SUB: { code: '2', arg: 'nibble' },
        INC: { code: '3', arg: 'none' },
        DEC: { code: '4', arg: 'none' },
        MUL: { code: '5', arg: 'nibble' },
        JMP: { code: '6', arg: 'nibble' },
        OUT: { code: 'E', arg: 'none' },
        HLT: { code: 'F', arg: 'none' }
    };

    const erros = [];
    const mem = new Array(16).fill('00');
    const used = new Array(16).fill(false);

    const parseNibble = (tok) => {
        if (!tok) return null;
        let t = tok.trim().toUpperCase();
        t = t.replace(/^0X/, '');
        if (/^\d+$/.test(t)) {
            const dec = parseInt(t, 10);
            if (isNaN(dec) || dec < 0 || dec > 15) return null;
            return dec.toString(16).toUpperCase();
        }
        if (/^[0-9A-F]{1,2}$/.test(t)) {
            const val = parseInt(t, 16);
            if (val < 0 || val > 15) return null;
            return val.toString(16).toUpperCase();
        }
        return null;
    };

    const parseAddr = (tok) => {
        if (!tok) return null;
        let t = tok.trim().toUpperCase().replace(/^0X/, '');
        let val = null;
        if (/^\d+$/.test(t)) val = parseInt(t, 10);
        else if (/^[0-9A-F]{1,2}$/.test(t)) val = parseInt(t, 16);
        if (val === null || isNaN(val) || val < 0 || val > 15) return null;
        return val;
    };

    const parseByte = (tok) => {
        if (!tok) return null;
        let t = tok.trim().toUpperCase().replace(/^0X/, '');
        if (/^\d+$/.test(t)) {
            const dec = parseInt(t, 10);
            if (isNaN(dec) || dec < 0 || dec > 255) return null;
            return dec.toString(16).toUpperCase().padStart(2, '0');
        }
        if (/^[0-9A-F]{1,2}$/.test(t)) {
            return t.padStart(2, '0');
        }
        return null;
    };

    const instrLinhas = [];
    linhas.forEach((raw, idx) => {
        let semComentario = raw.replace(/(#|\/\/).*$/, '').trim();
        if (!semComentario) return;

        // Se parece com par numérico (endereço valor), trate como diretiva de dados SEMPRE
        const tokens = semComentario.split(/\s+/);
        const addrLike = tokens[0] && /^(?:0x)?[0-9A-Fa-f]{1,2}$|^\d{1,2}$/.test(tokens[0]);
        const hasSecond = tokens.length > 1 && tokens[1];
        if (addrLike && hasSecond) {
            const a = parseAddr(tokens[0]);
            const b = parseByte(tokens[1]);
            if (a === null) erros.push(`Linha ${idx + 1}: Endereço inválido (0–15).`);
            else if (!b) erros.push(`Linha ${idx + 1}: Valor inválido (00–FF ou 0–255).`);
            else { mem[a] = b; used[a] = true; }
            return; // não tratar como instrução
        }

        // Tenta outros separadores (= : ,)
        const mdir = semComentario.match(/^(.+?)\s*[,=:]\s*(.+)$/);
        if (mdir) {
            const a = parseAddr(mdir[1]);
            const b = parseByte(mdir[2]);
            if (a === null) erros.push(`Linha ${idx + 1}: Endereço inválido (0–15).`);
            else if (!b) erros.push(`Linha ${idx + 1}: Valor inválido (00–FF ou 0–255).`);
            else { mem[a] = b; used[a] = true; }
            return;
        }

        // Caso contrário, considere linha como instrução
        instrLinhas.push({ text: semComentario, idx: idx + 1 });
    });

    let ptr = 0;
    const nextFree = () => {
        while (ptr < 16 && used[ptr]) ptr++;
        return ptr < 16 ? ptr : -1;
    };

    instrLinhas.forEach(({ text, idx }) => {
        const m = text.toUpperCase().match(/^(\w+)(?:\s+(.+))?$/);
        if (!m) { erros.push(`Linha ${idx}: Sintaxe inválida.`); return; }
        const op = m[1];

        // Aceita byte hex direto (ex.: 0A, 30, E0, F0) como instrução bruta
        if (/^[0-9A-F]{2}$/i.test(op) && (!m[2] || !m[2].trim())) {
            const slotRaw = nextFree();
            if (slotRaw === -1) { erros.push(`Sem espaço na memória para instruções adicionais (limite 16).`); return; }
            mem[slotRaw] = op.toUpperCase();
            used[slotRaw] = true;
            return;
        }

        const spec = OPC[op];
        if (!spec) { erros.push(`Linha ${idx}: Mnemônico desconhecido: ${op}.`); return; }
        let argNib = '0';
        if (spec.arg === 'nibble') {
            const nib = parseNibble((m[2] || '').trim());
            if (nib === null) { erros.push(`Linha ${idx}: Operando inválido (0–F ou 0–15).`); return; }
            argNib = nib;
        } else if (m[2] && m[2].trim()) {
            erros.push(`Linha ${idx}: ${op} não usa operando. Valor ignorado.`);
        }
        const slot = nextFree();
        if (slot === -1) { erros.push(`Sem espaço na memória para instruções adicionais (limite 16).`); return; }
        mem[slot] = `${spec.code}${argNib}`;
        used[slot] = true;
    });

    for (let i = 0; i < 16; i++) {
        const el = document.getElementById('order' + (i + 1));
        if (el) el.value = mem[i];
    }
    atualizarRamPreview();

    if (errosBox) {
        if (erros.length) {
            errosBox.innerHTML = erros.map(e => `• ${e}`).join('<br>');
            errosBox.classList.add('visible');
            errosBox.style.display = 'block';
        } else {
            errosBox.textContent = 'Montagem concluída. RAM atualizada.';
            errosBox.classList.add('visible');
            errosBox.style.display = 'block';
            errosBox.style.color = '#9effa3';
            errosBox.style.background = 'rgba(0,255,100,0.08)';
            errosBox.style.borderColor = 'rgba(0,255,100,0.25)';
            setTimeout(() => {
                errosBox.style.removeProperty('color');
                errosBox.style.removeProperty('background');
                errosBox.style.removeProperty('border-color');
            }, 2000);
        }
    }

    atualizarAssemblyDaRAM();
}

function atualizarRamPreview() {
    for (let i = 0; i < 16; i++) {
        const val = (document.getElementById('order' + (i + 1))?.value || '--').toUpperCase();
        const cell = document.getElementById('preview' + (i + 1));
        if (cell) cell.textContent = val && val.length ? val : '--';
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
    for (let i = 0; i < 16; i++) {
        let valor = (linhas[i] || '').toUpperCase().replace(/[^0-9A-F]/g, '');
        if (valor.length === 0) valor = '00';
        if (valor.length > 2) valor = valor.slice(0,2);
        if (!/^[0-9A-F]{2}$/.test(valor)) {
            throw new Error(`Valor inválido na linha ${i+1}: ${linhas[i]}`);
        }
        const input = document.getElementById('order' + (i + 1));
        if (input) input.value = valor;
    }
    inicializar();
    atualizarStatus();
    mostrarMensagemEstiloMario("Memória carregada do arquivo!");
}

// Exibe mensagens estilo Mario Bros
function mostrarMensagemEstiloMario(texto) {
    const consoleDiv = document.getElementById('console-log');
    consoleDiv.textContent = texto;
    consoleDiv.style.display = 'block';

    setTimeout(() => {
        consoleDiv.style.display = 'none';
    }, 5000);
}

function inicializar() {
    memoria = new Map();
    for (let i = 1; i <= 16; i++) {
        const address = i - 1;
        let val = document.getElementById('order' + i).value.trim().toUpperCase();
        // Preenche com zeros à esquerda para garantir 2 dígitos
        memoria.set(address, val.padStart(2, '0'));
    }
    PC = 0;
    ACC = 0;
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
    if (riValue) riValue.textContent = instrucaoAtual || (memoria.get(PC) || '--');
    if (outputValue) outputValue.textContent = saida.length > 0 ? saida[saida.length - 1] : '0';
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
            input.addEventListener('input', function() {
                atualizarAssemblyDaRAM();
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
    if (!running || PC >= 16) {
        mostrarMensagemEstiloMario(passos.join('\n') + (saida.length ? "\nSaída: " + saida.join(', ') : ''));
        return;
    }

    const instr = memoria.get(PC) || '0000';
    const { op, arg } = decode(instr);

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
        passos.push(`PC=${PC} | Instr: ${instr} | ACC=${ACC}`);

        switch (op) {
            case 'LDA':
                animateInstructionExecute('LDA', true, arg);
                const valorMem = parseInt(memoria.get(arg) || '0000', 16);
                atualizarValorBloco('ram-value', memoria.get(arg) || '--');
                atualizarValorBloco('mar-value', arg);
                ACC = valorMem;
                atualizarValorBloco('acc-value', ACC);
                passos.push(`LDA ${arg}: ACC <- MEM[${arg}] = ${memoria.get(arg)} (${ACC})`);
                PC++;
                break;
            case 'ADD':
                animateInstructionExecute('ADD', true, arg);
                const valorAdd = parseInt(memoria.get(arg) || '0000', 16);
                atualizarValorBloco('regb-value', valorAdd);
                atualizarValorBloco('mar-value', arg);
                mostrarOperacaoALU('ADD', ACC, valorAdd, ACC + valorAdd);
                ACC += valorAdd;
                atualizarValorBloco('acc-value', ACC);
                passos.push(`ADD ${arg}: ACC += MEM[${arg}] = ${memoria.get(arg)} (ACC=${ACC})`);
                PC++;
                break;
            case 'SUB':
                animateInstructionExecute('SUB', true, arg);
                const valorSub = parseInt(memoria.get(arg) || '0000', 16);
                atualizarValorBloco('regb-value', valorSub);
                atualizarValorBloco('mar-value', arg);
                mostrarOperacaoALU('SUB', ACC, valorSub, ACC - valorSub);
                ACC -= valorSub;
                atualizarValorBloco('acc-value', ACC);
                passos.push(`SUB ${arg}: ACC -= MEM[${arg}] = ${memoria.get(arg)} (ACC=${ACC})`);
                PC++;
                break;
            case 'INC':
                animateInstructionExecute('INC', false);
                mostrarOperacaoALU('INC', ACC, 1, ACC + 1);
                ACC++;
                atualizarValorBloco('acc-value', ACC);
                passos.push(`INC: ACC++ (ACC=${ACC})`);
                PC++;
                break;
            case 'DEC':
                animateInstructionExecute('DEC', false);
                mostrarOperacaoALU('DEC', ACC, 1, ACC - 1);
                ACC--;
                atualizarValorBloco('acc-value', ACC);
                passos.push(`DEC: ACC-- (ACC=${ACC})`);
                PC++;
                break;
            case 'MUL':
                animateInstructionExecute('MUL', true, arg);
                const valorMul = parseInt(memoria.get(arg) || '0000', 16);
                atualizarValorBloco('regb-value', valorMul);
                atualizarValorBloco('mar-value', arg);
                mostrarOperacaoALU('MUL', ACC, valorMul, ACC * valorMul);
                ACC *= valorMul;
                atualizarValorBloco('acc-value', ACC);
                passos.push(`MUL ${arg}: ACC *= MEM[${arg}] = ${memoria.get(arg)} (ACC=${ACC})`);
                PC++;
                break;
            case 'JMP':
                passos.push(`JMP para ${arg}`);
                atualizarValorBloco('controller-value', `JMP→${arg}`);
                PC = arg;
                atualizarValorBloco('pc-value', PC);
                break;
            case 'OUT':
                animateOutput();
                passos.push(`OUT: ${ACC}`);
                saida.push(ACC);
                atualizarValorBloco('output-value', ACC);
                atualizarValorBloco('display-value', ACC.toString(2).padStart(8, '0'));
                PC++;
                break;
            case 'HLT':
                passos.push("HLT: Parada");
                atualizarValorBloco('controller-value', 'HALT');
                running = false;
                break;
            default:
                passos.push(`Instrução desconhecida: ${instr}`);
                running = false;
                break;
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
    if (!running || passos.length === 0) {
        inicializar();
    }
    
    resetAnimations();
    mostrarMensagemEstiloMario("Executando todas as instruções...");
    
    function executarProximoPasso() {
        if (running && PC < 16) {
            executarPasso();
            // Agenda o próximo passo após a animação atual terminar
            setTimeout(executarProximoPasso, animationSpeed + 500);
        } else {
            // Execução completa
            setTimeout(() => {
                mostrarMensagemEstiloMario(passos.join('\n') + (saida.length ? "\nSaída: " + saida.join(', ') : ''));
                resetAnimations();
            }, 1000);
        }
    }
    
    // Inicia a execução
    executarProximoPasso();
}

// Versão interna sem mostrar mensagem
function executarPassoInterno() {
    if (!running || PC >= 16) return;

    const instr = memoria.get(PC) || '0000';
    const { op, arg } = decode(instr);

    passos.push(`PC=${PC} | Instr: ${instr} | ACC=${ACC}`);

    switch (op) {
        case 'LDA':
            ACC = parseInt(memoria.get(arg) || '0000', 16);
            passos.push(`LDA ${arg}: ACC <- MEM[${arg}] = ${memoria.get(arg)} (${ACC})`);
            PC++;
            break;
        case 'ADD':
            ACC += parseInt(memoria.get(arg) || '0000', 16);
            passos.push(`ADD ${arg}: ACC += MEM[${arg}] = ${memoria.get(arg)} (ACC=${ACC})`);
            PC++;
            break;
        case 'SUB':
            ACC -= parseInt(memoria.get(arg) || '0000', 16);
            passos.push(`SUB ${arg}: ACC -= MEM[${arg}] = ${memoria.get(arg)} (ACC=${ACC})`);
            PC++;
            break;
        case 'INC':
            ACC++;
            passos.push(`INC: ACC++ (ACC=${ACC})`);
            PC++;
            break;
        case 'DEC':
            ACC--;
            passos.push(`DEC: ACC-- (ACC=${ACC})`);
            PC++;
            break;
        case 'MUL':
            ACC *= parseInt(memoria.get(arg) || '0000', 16);
            passos.push(`MUL ${arg}: ACC *= MEM[${arg}] = ${memoria.get(arg)} (ACC=${ACC})`);
            PC++;
            break;
        case 'JMP':
            passos.push(`JMP para ${arg}`);
            PC = arg;
            break;
        case 'OUT':
            passos.push(`OUT: ${ACC}`);
            saida.push(ACC);
            PC++;
            break;
        case 'HLT':
            passos.push("HLT: Parada");
            running = false;
            break;
        default:
            passos.push(`Instrução desconhecida: ${instr}`);
            running = false;
            break;
    }
}

// Escreve saída final no console Mario
function escreverNaLabel(mensagem) {
    mostrarMensagemEstiloMario(mensagem);
}

// Botões e eventos
document.addEventListener('DOMContentLoaded', function () {
    // Inicializa o display de assembly baseado na RAM
    atualizarAssemblyDaRAM();
    aplicarModoEdicaoUI();
    
    // Adiciona eventos de input nos campos da RAM
    adicionarEventosRAM();
    atualizarRamPreview();
    
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
    });
});
