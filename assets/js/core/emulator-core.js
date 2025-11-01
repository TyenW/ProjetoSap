/*
  Emulator Core (SAP-1 like) – DOM-free, deterministic execution
  Exports a global window.EmulatorCore with class Emulator

  Instruction format: 1 byte (high nibble = opcode, low nibble = arg)
  Opcodes:
   0=LDA n, 1=ADD n, 2=SUB n, 3=INC, 4=DEC, 5=MUL n, 6=JMP n, 0xE=OUT, 0xF=HLT

  Memory: 16 bytes (0..15), values 0..255
  ACC: 8-bit unsigned (0..255) with wrap-around
*/
(function (global) {
  'use strict';

  const OPCODES = {
    0x0: 'LDA',
    0x1: 'ADD',
    0x2: 'SUB',
    0x3: 'INC',
    0x4: 'DEC',
    0x5: 'MUL',
    0x6: 'JMP',
    0xE: 'OUT',
    0xF: 'HLT'
  };

  function clamp8(n) {
    // wrap to 0..255
    n = n % 256;
    if (n < 0) n += 256;
    return n;
  }

  function byteToHex(b) {
    return (b & 0xFF).toString(16).toUpperCase().padStart(2, '0');
  }

  class Emulator {
    constructor(initialMemoryHex) {
      this.memory = new Uint8Array(16);
      this.PC = 0;
      this.ACC = 0;
      this.halted = false;
      this.outputs = [];
      this.lastFetched = 0; // last instruction byte fetched
      if (Array.isArray(initialMemoryHex)) {
        this.loadMemoryFromHex(initialMemoryHex);
      }
    }

    reset() {
      this.PC = 0;
      this.ACC = 0;
      this.halted = false;
      this.outputs = [];
      this.lastFetched = 0;
    }

    loadMemoryFromHex(hexArray) {
      for (let i = 0; i < 16; i++) {
        const hx = (hexArray[i] || '00').toString().trim().toUpperCase();
        const val = parseInt(hx, 16);
        this.memory[i] = isNaN(val) ? 0 : (val & 0xFF);
      }
    }

    getMemoryHex() {
      const out = [];
      for (let i = 0; i < 16; i++) out.push(byteToHex(this.memory[i]));
      return out;
    }

    getInstrHexAt(addr) {
      const a = (addr & 0x0F);
      return byteToHex(this.memory[a]);
    }

    peekCurrentInstrHex() {
      return this.getInstrHexAt(this.PC);
    }

    step() {
      if (this.halted) {
        return { halted: true, reason: 'HLT', state: this.snapshot() };
      }

      const pcBefore = this.PC & 0x0F;
      const accBefore = this.ACC & 0xFF;

      const instr = this.memory[pcBefore];
      this.lastFetched = instr;
      const opcode = (instr >> 4) & 0x0F;
      const arg = instr & 0x0F;
      const opName = OPCODES.hasOwnProperty(opcode) ? OPCODES[opcode] : '???';

      let readVal = null;
      let outputEmitted = false;
      let fault = null;

      const nextPCDefault = (pcBefore + 1) & 0x0F;
      let pcAfter = nextPCDefault;
      let accAfter = accBefore;

      try {
        switch (opName) {
          case 'LDA': {
            readVal = this.memory[arg] & 0xFF;
            accAfter = readVal;
            break;
          }
          case 'ADD': {
            readVal = this.memory[arg] & 0xFF;
            accAfter = clamp8(accBefore + readVal);
            break;
          }
          case 'SUB': {
            readVal = this.memory[arg] & 0xFF;
            accAfter = clamp8(accBefore - readVal);
            break;
          }
          case 'INC': {
            accAfter = clamp8(accBefore + 1);
            break;
          }
          case 'DEC': {
            accAfter = clamp8(accBefore - 1);
            break;
          }
          case 'MUL': {
            readVal = this.memory[arg] & 0xFF;
            accAfter = clamp8(accBefore * readVal);
            break;
          }
          case 'JMP': {
            pcAfter = arg & 0x0F;
            break;
          }
          case 'OUT': {
            this.outputs.push(accBefore & 0xFF);
            outputEmitted = true;
            break;
          }
          case 'HLT': {
            this.halted = true;
            pcAfter = pcBefore; // PC stays for clarity when halted
            break;
          }
          default: {
            this.halted = true;
            pcAfter = pcBefore;
            fault = `Instr desconhecida: ${byteToHex(instr)}`;
          }
        }
      } catch (e) {
        fault = String(e && e.message ? e.message : e);
        this.halted = true;
        pcAfter = pcBefore;
      }

      // Commit state
      this.PC = pcAfter & 0x0F;
      this.ACC = accAfter & 0xFF;

      return {
        halted: this.halted,
        fault,
        outputEmitted,
        fetched: instr,
        decode: { opcode, opName, arg },
        readVal,
        before: { PC: pcBefore, ACC: accBefore },
        after: { PC: this.PC, ACC: this.ACC },
        state: this.snapshot()
      };
    }

    run(maxSteps = 256) {
      const trace = [];
      for (let i = 0; i < maxSteps; i++) {
        const r = this.step();
        trace.push(r);
        if (r.halted) break;
      }
      return { trace, outputs: [...this.outputs], halted: this.halted, state: this.snapshot() };
    }

    snapshot() {
      return {
        PC: this.PC & 0x0F,
        ACC: this.ACC & 0xFF,
        halted: !!this.halted,
        outputs: [...this.outputs],
        memory: Array.from(this.memory)
      };
    }
  }

  global.EmulatorCore = { Emulator };
})(typeof window !== 'undefined' ? window : globalThis);
