// Estado global do emulador
let memoria = new Map();
let PC = 0;
let ACC = 0;
let passos = [];
let saida = [];
let running = false;
function passoAtras() {
    if (passos.length > 1) {
        passos.pop(); // Remove o último passo
        // Re-inicializa e executa até o passo anterior
        inicializar();
        for (let i = 1; i < passos.length; i++) {
            executarPassoInterno();
        }
        atualizarStatus();
    } else {
        mostrarMensagemEstiloMario("Não é possível voltar mais.");
    }
}

// Resetar
function resetar() {
    inicializar();
    atualizarStatus();
    escreverNaLabel("");
    mostrarMensagemEstiloMario("Resetado!");
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
    passos.push("Início: PC=0, ACC=0");
}
function atualizarStatus(instrucaoAtual = '') {
    document.getElementById('status-pc').textContent = PC;
    document.getElementById('status-acc').textContent = ACC;
    document.getElementById('status-instr').textContent = instrucaoAtual || (memoria.get(PC) || '00');
    document.getElementById('status-saida').textContent = saida.join(', ');
}

document.getElementById('converterMaquina').addEventListener('click', function () {
    const linhas = document.getElementById('codigoMaquina').value.split(/\r?\n/);
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
                // Se argumento for tipo A0, pega só o número/hex
                argHex = arg.replace(/[^0-9A-F]/g, '');
                if (argHex.length === 0) argHex = '0';
            }
            hex = opHex + argHex;
        }
        document.getElementById('order' + (i + 1)).value = hex.padStart(2, '0');
    }
    inicializar();
    atualizarStatus();
    mostrarMensagemEstiloMario("Código convertido para memória!");
});

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

// Executa um passo
function executarPasso() {
    if (!running || PC >= 16) {
        mostrarMensagemEstiloMario(passos.join('\n') + (saida.length ? "\nSaída: " + saida.join(', ') : ''));
        return;
    }

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

    mostrarMensagemEstiloMario(passos[passos.length - 1]);
    atualizarStatus(instr);
}

// Executa tudo
function executarTudo() {
    if (!running || passos.length === 0) {
        inicialinicializar();
    }
    while (running && PC < 16) {
        executarPassoInterno();
    }
    mostrarMensagemEstiloMario(passos.join('\n') + (saida.length ? "\nSaída: " + saida.join(', ') : ''));
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

// Escreve saída final na label
function escreverNaLabel(mensagem) {
    const label = document.getElementById('saida-label');
    if (label) {
        label.textContent = mensagem;
    }
}

// Botões e eventos
document.addEventListener('DOMContentLoaded', function () {
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

    document.getElementById('saida').addEventListener('click', function () {
        if (saida.length > 0) {
            escreverNaLabel("Saída: " + saida.join(", "));
        } else {
            escreverNaLabel("Nenhuma saída gerada.");
        }
    });

    document.getElementById('passo-atras').addEventListener('click', passoAtras);
    document.getElementById('resetar').addEventListener('click', resetar);

    document.getElementById('csvInput').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
            importarCSVParaMemoria(evt.target.result);
        };
        reader.readAsText(file);
    });
});

const memoryDiv = document.querySelector('.memoryran');
const otherLogicDiv = document.querySelector('.other-logic');
const toggleBtn = document.getElementById('toggleLogic');

toggleBtn.addEventListener('click', () => {
    if (memoryDiv.style.display === 'none') {
        memoryDiv.style.display = '';
        otherLogicDiv.style.display = 'none';
    } else {
        memoryDiv.style.display = 'none';
        otherLogicDiv.style.display = '';
    }
});