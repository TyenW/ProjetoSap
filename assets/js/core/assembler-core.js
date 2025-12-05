(function (global) {
  'use strict';

  // Puro: sem DOM. Expõe global.AssemblerCore.assemble(source)
  // Retorna { memory: string[16] (hex 2 chars), errors: string[], assignments: string[] }

  function normalizeWhitespace(s) {
    return String(s || '').replace(/\u00A0/g, ' ');
  }

  function assemble(source) {
    const text = normalizeWhitespace(source || '');
    let bruto = text.replace(/[,;]+/g, '\n');
    const linhasBrutas = bruto.split(/\r?\n/);
    const linhas = linhasBrutas.map(l => String(l || '').trim());

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

    const errors = [];
    const mem = new Array(16).fill('00');
    const used = new Array(16).fill(false);
    const assignments = [];

    const parseNibble = (tok) => {
      if (!tok) return null;
      let t = tok.trim().toUpperCase();
      // sufixos opcionais: D (decimal), H (hex)
      let baseHint = null;
      const suff = t.match(/^([0-9A-F]+)([DHB])$/);
      if (suff) { t = suff[1]; baseHint = suff[2]; }
      t = t.replace(/^0X/, '');
      if (baseHint === 'D' || (/^\d+$/.test(t) && baseHint !== 'H')) {
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
      let t = tok.trim().toUpperCase();
      let baseHint = null;
      const suff = t.match(/^([0-9A-F]+)([DHB])$/);
      if (suff) { t = suff[1]; baseHint = suff[2]; }
      t = t.replace(/^0X/, '');
      let val = null;
      if (baseHint === 'D' || (/^\d+$/.test(t) && baseHint !== 'H')) val = parseInt(t, 10);
      else if (/^[0-9A-F]{1,2}$/.test(t)) val = parseInt(t, 16);
      if (val === null || isNaN(val) || val < 0 || val > 15) return null;
      return val;
    };

    const parseByte = (tok) => {
      if (!tok) return null;
      let t = tok.trim().toUpperCase();
      let baseHint = null;
      const suff = t.match(/^([0-9A-F]+)([DHB])$/);
      if (suff) { t = suff[1]; baseHint = suff[2]; }
      t = t.replace(/^0X/, '');
      if (baseHint === 'D' || (/^\d+$/.test(t) && baseHint !== 'H')) {
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

      // Diretivas de dados: "<addr> <byte>" ou com separadores , = :
      const tokens = semComentario.split(/\s+/);
      const addrLike = tokens[0] && /^(?:0x)?[0-9A-Fa-f]{1,2}$|^\d{1,2}$/.test(tokens[0]);
      const hasSecond = tokens.length > 1 && tokens[1];
      if (addrLike && hasSecond) {
        const a = parseAddr(tokens[0]);
        const b = parseByte(tokens[1]);
        if (a === null) errors.push(`Linha ${idx + 1}: Endereço inválido (0–15).`);
        else if (!b) errors.push(`Linha ${idx + 1}: Valor inválido (00–FF ou 0–255).`);
        else { mem[a] = b; used[a] = true; assignments.push(`RAM[0x${a.toString(16).toUpperCase()}] = ${b} (${parseInt(b,16)}d)`); }
        return;
      }

      const mdir = semComentario.match(/^(.+?)\s*[,=:]\s*(.+)$/);
      if (mdir) {
        const a = parseAddr(mdir[1]);
        const b = parseByte(mdir[2]);
        if (a === null) errors.push(`Linha ${idx + 1}: Endereço inválido (0–15).`);
        else if (!b) errors.push(`Linha ${idx + 1}: Valor inválido (00–FF ou 0–255).`);
        else { mem[a] = b; used[a] = true; assignments.push(`RAM[0x${a.toString(16).toUpperCase()}] = ${b} (${parseInt(b,16)}d)`); }
        return;
      }

      // Caso contrário, é instrução
      instrLinhas.push({ text: semComentario, idx: idx + 1 });
    });

    let ptr = 0;
    const nextFree = () => {
      while (ptr < 16 && used[ptr]) ptr++;
      return ptr < 16 ? ptr : -1;
    };

    instrLinhas.forEach(({ text, idx }) => {
      const m = text.toUpperCase().match(/^(\w+)(?:\s+(.+))?$/);
      if (!m) { errors.push(`Linha ${idx}: Sintaxe inválida.`); return; }
      const op = m[1];

      // Byte raw (ex.: 0A, 30, E0, F0)
      if (/^[0-9A-F]{2}$/i.test(op) && (!m[2] || !m[2].trim())) {
        const slotRaw = nextFree();
        if (slotRaw === -1) { errors.push(`Sem espaço na memória para instruções adicionais (limite 16).`); return; }
        mem[slotRaw] = op.toUpperCase();
        used[slotRaw] = true;
        return;
      }

      const spec = OPC[op];
      if (!spec) { errors.push(`Linha ${idx}: Mnemônico desconhecido: ${op}.`); return; }
      let argNib = '0';
      if (spec.arg === 'nibble') {
        const nib = parseNibble((m[2] || '').trim());
        if (nib === null) { errors.push(`Linha ${idx}: Operando inválido (0–F ou 0–15).`); return; }
        argNib = nib;
      } else if (m[2] && m[2].trim()) {
        // Op não usa argumento — reportar como erro de sintaxe
        errors.push(`Linha ${idx}: Operando inesperado para o mnemônico ${op} (não aceita argumentos).`);
        return;
      }
      const slot = nextFree();
      if (slot === -1) { errors.push(`Sem espaço na memória para instruções adicionais (limite 16).`); return; }
      mem[slot] = `${spec.code}${argNib}`;
      used[slot] = true;
    });

    return { memory: mem, errors, assignments };
  }

  global.AssemblerCore = { assemble };
})(typeof window !== 'undefined' ? window : globalThis);
