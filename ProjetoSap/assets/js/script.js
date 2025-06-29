// Estado global do emulador
let memoria = new Map();
let PC = 0;
let ACC = 0;
let passos = [];
let saida = [];
let running = false;
let animationSpeed = 1500; // Velocidade da animação em ms
let assemblyAnterior = []; // Para acompanhar mudanças no assembly

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
    console.log("Atualizando assembly da RAM..."); // Debug
    const container = document.getElementById('assemblyCode');
    
    if (!container) {
        console.log("Container assembly não encontrado!"); // Debug
        return;
    }
    
    // Limpa o container
    container.innerHTML = '';
    
    const novoAssembly = [];
    let temInstrucoes = false;
    
    for (let i = 0; i < 16; i++) {
        const ramInput = document.getElementById('order' + (i + 1));
        const hexValue = ramInput ? ramInput.value.trim().toUpperCase() : '';
        
        // Só processa se há valor digitado
        if (hexValue && hexValue !== '00' && hexValue !== '') {
            const assembly = converterHexParaAssembly(hexValue);
            
            if (assembly !== '---') {
                temInstrucoes = true;
                
                // Cria o elemento da linha
                const linhaDiv = document.createElement('div');
                linhaDiv.className = 'assembly-line';
                linhaDiv.setAttribute('data-linha', i);
                
                const numeroFormatado = i.toString().padStart(2, '0');
                linhaDiv.innerHTML = `${numeroFormatado}: <span class="assembly-instruction">${assembly}</span>`;
                
                // Verifica se houve mudança
                const mudou = assemblyAnterior[i] !== assembly;
                if (mudou && assemblyAnterior.length > 0) {
                    linhaDiv.classList.add('changed');
                    // Remove a classe após a animação
                    setTimeout(() => {
                        linhaDiv.classList.remove('changed');
                    }, 600);
                }
                
                container.appendChild(linhaDiv);
                console.log(`Adicionada linha ${i}: ${hexValue} -> ${assembly}`); // Debug
            }
        }
        
        novoAssembly.push(hexValue ? converterHexParaAssembly(hexValue) : '---');
    }
    
    // Se não há instruções, mostra mensagem
    if (!temInstrucoes) {
        const mensagem = document.createElement('div');
        mensagem.className = 'assembly-empty-message';
        mensagem.innerHTML = `
            <div>Digite códigos hexadecimais na RAM</div>
            <div>para visualizar o Assembly em tempo real!</div>
            <div style="font-size: 0.8em; margin-top: 8px; opacity: 0.8;">
                💡 Ex: 0A, 1F, E0, F0...
            </div>
        `;
        container.appendChild(mensagem);
    }
    
    assemblyAnterior = [...novoAssembly];
    return novoAssembly;
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
    const linhas = csvText.split(/\r?\n/);
    for (let i = 0; i < 16; i++) {
        let valor = (linhas[i] || '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();
        document.getElementById('order' + (i + 1)).value = valor.padStart(2, '0');
    }
    inicializar();
    atualizarStatus();
    mostrarMensagemEstiloMario("Memória carregada do CSV!");
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

// Função para aplicar código de máquina na memória (do textarea)
function aplicarSequenciaNaMemoria() {
    const codigoMaquinaElement = document.getElementById('codigoMaquina');
    if (!codigoMaquinaElement) return;
    
    const codigoMaquina = codigoMaquinaElement.value;
    const linhas = codigoMaquina.split(/\r?\n/);
    const tabelaOp = {
        'LDA': '0',
        'ADD': '1',
        'SUB': '2',
        'INC': '3',
        'DEC': '4',
        'MUL': '5',
        'JMP': '6',
        'OUT': 'E',
        'HLT': 'F'
    };
    
    for (let i = 0; i < 16; i++) {
        let linha = (linhas[i] || '').trim().toUpperCase();
        let hex = '00';
        if (linha) {
            let [op, arg] = linha.split(/\s+/);
            let opHex = tabelaOp[op] || '0';
            let argHex = '0';
            if (typeof arg !== 'undefined') {
                argHex = arg.replace(/[^0-9A-F]/g, '');
                if (argHex.length === 0) argHex = '0';
            }
            hex = opHex + argHex;
        }
        const elemento = document.getElementById('order' + (i + 1));
        if (elemento) {
            elemento.value = hex.padStart(2, '0');
        }
    }
    
    // Atualiza o display de assembly após aplicar na memória
    atualizarAssemblyDaRAM();
    inicializar();
    atualizarStatus();
    mostrarMensagemEstiloMario("Código aplicado na memória!");
}

// Evento para aplicar o código na memória
const converterMaquinaBtn = document.getElementById('converterMaquina');
if (converterMaquinaBtn) {
    converterMaquinaBtn.addEventListener('click', function () {
        aplicarSequenciaNaMemoria();
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

    // Inicia animação de busca de instrução
    animateInstructionFetch();

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
    
    // Adiciona eventos de input nos campos da RAM
    adicionarEventosRAM();
    
    document.getElementById('passo').addEventListener('click', function () {
        if (!running || passos.length === 0) {
            inicializar();
        }
        executarPasso();
    });

    document.getElementById('emular').addEventListener('click', function () {
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
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
            importarCSVParaMemoria(evt.target.result);
        };
        reader.readAsText(file);
    });

    // Atualização em tempo real da sequência
    const codigoMaquinaElement = document.getElementById('codigoMaquina');
    if (codigoMaquinaElement) {
        codigoMaquinaElement.addEventListener('input', function() {
            // Função para atualizar em tempo real removida (elemento não existe)
        });
    }

    // Aplicar sequência à memória
    const aplicarSequenciaBtn = document.getElementById('aplicarSequencia');
    if (aplicarSequenciaBtn) {
        aplicarSequenciaBtn.addEventListener('click', aplicarSequenciaNaMemoria);
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

  muteBtn.addEventListener('click', () => {
    music.muted = !music.muted;
    muteBtn.textContent = music.muted ? '🔇' : '🔊';
  });
});
