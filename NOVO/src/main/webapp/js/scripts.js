// Estado global do emulador
let memoria = [];
let PC = 0;
let ACC = 0;
let passos = [];
let saida = [];
let running = false;


// Inicializa a memória e o estado
function inicializar() {
    memoria = [];
    for (let i = 1; i <= 16; i++) {
        let val = document.getElementById('order' + i).value.trim().toUpperCase();
        memoria.push(val.padStart(4, '0'));
    }
    PC = 0;
    ACC = 0;
    passos = [];
    saida = [];
    running = true;
    passos.push(`Início: PC=0, ACC=0`);
}

// Decodifica instrução
// Decodifica instrução em hexadecimal
function decode(instr) {
    const opcodeHex = instr[0];
    const arg = parseInt(instr.slice(1), 16);
    // Mapeamento dos opcodes hexadecimais para operações SAP
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
    return { op, arg };
}

// Executa um passo
function executarPasso() {
    if (!running || PC >= memoria.length) {
        alert(passos.join('\n') + (saida.length ? `\nSaída: ${saida.join(', ')}` : ''));
        return;
    }

    const instr = memoria[PC];
    const { op, arg } = decode(instr);

    passos.push(`PC=${PC} | Instr: ${instr} | ACC=${ACC}`);

    switch (op) {
        case 'LDA':
            ACC = parseInt(memoria[arg], 16) || 0;
            passos.push(`LDA ${arg}: ACC <- MEM[${arg}] = ${memoria[arg]} (${ACC})`);
            PC++;
            break;
        case 'ADD':
            ACC += parseInt(memoria[arg], 16) || 0;
            passos.push(`ADD ${arg}: ACC += MEM[${arg}] = ${memoria[arg]} (ACC=${ACC})`);
            PC++;
            break;
        case 'SUB':
            ACC -= parseInt(memoria[arg], 16) || 0;
            passos.push(`SUB ${arg}: ACC -= MEM[${arg}] = ${memoria[arg]} (ACC=${ACC})`);
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
            ACC *= parseInt(memoria[arg], 16) || 0;
            passos.push(`MUL ${arg}: ACC *= MEM[${arg}] = ${memoria[arg]} (ACC=${ACC})`);
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
            passos.push('HLT: Parada');
            running = false;
            break;
        default:
            passos.push(`Instrução desconhecida: ${instr}`);
            running = false;
            break;
    }

    alert(passos[passos.length - 1]);
}

// Executa até o fim
function executarTudo() {
    if (!running || passos.length === 0) {
        inicializar();
    }
    while (running && PC < memoria.length) {
        executarPassoInterno();
    }
    alert(passos.join('\n') + (saida.length ? `\nSaída: ${saida.join(', ')}` : ''));
}

// Executa um passo sem alert (para executarTudo)
function executarPassoInterno() {
    if (!running || PC >= memoria.length) return;

    const instr = memoria[PC];
    const { op, arg } = decode(instr);

    passos.push(`PC=${PC} | Instr: ${instr} | ACC=${ACC}`);

    switch (op) {
        case 'LDA':
            ACC = parseInt(memoria[arg], 16) || 0;
            passos.push(`LDA ${arg}: ACC <- MEM[${arg}] = ${memoria[arg]} (${ACC})`);
            PC++;
            break;
        case 'ADD':
            ACC += parseInt(memoria[arg], 16) || 0;
            passos.push(`ADD ${arg}: ACC += MEM[${arg}] = ${memoria[arg]} (ACC=${ACC})`);
            PC++;
            break;
        case 'SUB':
            ACC -= parseInt(memoria[arg], 16) || 0;
            passos.push(`SUB ${arg}: ACC -= MEM[${arg}] = ${memoria[arg]} (ACC=${ACC})`);
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
            ACC *= parseInt(memoria[arg], 16) || 0;
            passos.push(`MUL ${arg}: ACC *= MEM[${arg}] = ${memoria[arg]} (ACC=${ACC})`);
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
            passos.push('HLT: Parada');
            running = false;
            break;
        default:
            passos.push(`Instrução desconhecida: ${instr}`);
            running = false;
            break;
    }
}

// Handler dos botões
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

// Função para escrever a saída na label
function escreverNaLabel(mensagem) {
    const label = document.getElementById('saida-label');
    if (label) {
        label.textContent = mensagem;
    }
}

// mostra a saida na laibel:
document.getElementById('saida').addEventListener('click', function () {
    if (saida.length > 0) {
        escreverNaLabel(`Saída: ${saida.join(', ')}`);
    } else {
        escreverNaLabel('Nenhuma saída gerada.');
    }
});