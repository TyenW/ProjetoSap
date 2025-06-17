// Estado global do emulador
let memoria = new Map();
let PC = 0;
let ACC = 0;
let passos = [];
let saida = [];
let running = false;

// Inicializa a memória e o estado
function inicializar() {
    memoria = new Map();
    for (let i = 1; i <= 16; i++) {
        const address = i - 1;
        let val = document.getElementById('order' + i).value.trim().toUpperCase();
        memoria.set(address, val.padStart(4, '0'));
    }
    PC = 0;
    ACC = 0;
    passos = [];
    saida = [];
    running = true;
    passos.push("Início: PC=0, ACC=0");
}

// Decodifica instrução
function decode(instr) {
    if (!instr || instr.length < 2) {
        return { op: '???', arg: 0 };
    }
    const opcodeHex = instr[0];
    const arg = parseInt(instr.slice(1), 16);
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
        alert(passos.join('\n') + (saida.length ? "\nSaída: " + saida.join(', ') : ''));
        return;
    }

    const instr = memoria.get(PC) || '0000';
    const { op, arg } = decode(instr);

    passos.push("PC=" + PC + " | Instr: " + instr + " | ACC=" + ACC);

    switch (op) {
        case 'LDA':
            ACC = parseInt(memoria.get(arg) || '0000', 16);
            passos.push("LDA " + arg + ": ACC <- MEM[" + arg + "] = " + memoria.get(arg) + " (" + ACC + ")");
            PC++;
            break;
        case 'ADD':
            ACC += parseInt(memoria.get(arg) || '0000', 16);
            passos.push("ADD " + arg + ": ACC += MEM[" + arg + "] = " + memoria.get(arg) + " (ACC=" + ACC + ")");
            PC++;
            break;
        case 'SUB':
            ACC -= parseInt(memoria.get(arg) || '0000', 16);
            passos.push("SUB " + arg + ": ACC -= MEM[" + arg + "] = " + memoria.get(arg) + " (ACC=" + ACC + ")");
            PC++;
            break;
        case 'INC':
            ACC++;
            passos.push("INC: ACC++ (ACC=" + ACC + ")");
            PC++;
            break;
        case 'DEC':
            ACC--;
            passos.push("DEC: ACC-- (ACC=" + ACC + ")");
            PC++;
            break;
        case 'MUL':
            ACC *= parseInt(memoria.get(arg) || '0000', 16);
            passos.push("MUL " + arg + ": ACC *= MEM[" + arg + "] = " + memoria.get(arg) + " (ACC=" + ACC + ")");
            PC++;
            break;
        case 'JMP':
            passos.push("JMP para " + arg);
            PC = arg;
            break;
        case 'OUT':
            passos.push("OUT: " + ACC);
            saida.push(ACC);
            PC++;
            break;
        case 'HLT':
            passos.push("HLT: Parada");
            running = false;
            break;
        default:
            passos.push("Instrução desconhecida: " + instr);
            running = false;
            break;
    }

    alert(passos[passos.length - 1]);
}

// Executa tudo
function executarTudo() {
    if (!running || passos.length === 0) {
        inicializar();
    }
    while (running && PC < 16) {
        executarPassoInterno();
    }
    alert(passos.join('\n') + (saida.length ? "\nSaída: " + saida.join(', ') : ''));
}

// Versão interna sem alert
function executarPassoInterno() {
    if (!running || PC >= 16) return;

    const instr = memoria.get(PC) || '0000';
    const { op, arg } = decode(instr);

    passos.push("PC=" + PC + " | Instr: " + instr + " | ACC=" + ACC);

    switch (op) {
        case 'LDA':
            ACC = parseInt(memoria.get(arg) || '0000', 16);
            passos.push("LDA " + arg + ": ACC <- MEM[" + arg + "] = " + memoria.get(arg) + " (" + ACC + ")");
            PC++;
            break;
        case 'ADD':
            ACC += parseInt(memoria.get(arg) || '0000', 16);
            passos.push("ADD " + arg + ": ACC += MEM[" + arg + "] = " + memoria.get(arg) + " (ACC=" + ACC + ")");
            PC++;
            break;
        case 'SUB':
            ACC -= parseInt(memoria.get(arg) || '0000', 16);
            passos.push("SUB " + arg + ": ACC -= MEM[" + arg + "] = " + memoria.get(arg) + " (ACC=" + ACC + ")");
            PC++;
            break;
        case 'INC':
            ACC++;
            passos.push("INC: ACC++ (ACC=" + ACC + ")");
            PC++;
            break;
        case 'DEC':
            ACC--;
            passos.push("DEC: ACC-- (ACC=" + ACC + ")");
            PC++;
            break;
        case 'MUL':
            ACC *= parseInt(memoria.get(arg) || '0000', 16);
            passos.push("MUL " + arg + ": ACC *= MEM[" + arg + "] = " + memoria.get(arg) + " (ACC=" + ACC + ")");
            PC++;
            break;
        case 'JMP':
            passos.push("JMP para " + arg);
            PC = arg;
            break;
        case 'OUT':
            passos.push("OUT: " + ACC);
            saida.push(ACC);
            PC++;
            break;
        case 'HLT':
            passos.push("HLT: Parada");
            running = false;
            break;
        default:
            passos.push("Instrução desconhecida: " + instr);
            running = false;
            break;
    }
}

// Exibir saída
function escreverNaLabel(mensagem) {
    const label = document.getElementById('saida-label');
    if (label) {
        label.textContent = mensagem;
    }
}

// Botões: só executa após DOM carregado
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
});
