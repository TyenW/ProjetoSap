// Emulator Worker (classic worker script)
// Mensagens de entrada:
//  { type: 'run', memory: string[16], maxSteps?: number, speed?: number }
//  { type: 'cancel' }
// Respostas:
//  { type: 'tick', step, fetched, decode, state, outputEmitted }
//  { type: 'done', reason, steps, outputs, state }

/* eslint-disable no-restricted-globals */
try {
  importScripts('../core/emulator-core.js');
} catch (e) {
  // will error on run
}

let canceled = false;
let running = false;
let pendingChallengeResolver = null;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function deepArrayEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if ((a[i] >>> 0) !== (b[i] >>> 0)) return false;
  }
  return true;
}

function evaluateValidation(finalState, validation) {
  if (!validation || typeof validation !== 'object') return null;
  const target = String(validation.target || validation.target_reg || '').toUpperCase();
  const expectedValue = (validation.value != null) ? validation.value : validation.expected_value;
  let actualValue = null;
  let isCorrect = false;

  if (target === 'ACC') {
    actualValue = finalState.ACC;
    isCorrect = (actualValue >>> 0) === (Number(expectedValue) >>> 0);
  } else if (target === 'PC') {
    actualValue = finalState.PC;
    isCorrect = (actualValue >>> 0) === (Number(expectedValue) >>> 0);
  } else if (target === 'OUT') {
    actualValue = Array.isArray(finalState.outputs) ? finalState.outputs.slice() : [];
    if (Array.isArray(expectedValue)) {
      isCorrect = deepArrayEqual(actualValue, expectedValue);
    } else {
      const outValue = actualValue.length ? (actualValue[actualValue.length - 1] >>> 0) : 0;
      isCorrect = outValue === (Number(expectedValue) >>> 0);
    }
  } else if (target === 'RAM') {
    actualValue = Array.isArray(finalState.memory) ? finalState.memory.slice() : [];
    if (Array.isArray(expectedValue)) {
      isCorrect = deepArrayEqual(actualValue, expectedValue);
    }
  }

  return {
    target,
    expectedValue,
    actualValue,
    isCorrect,
    msg: validation.msg || '',
    achievementId: validation.achievementId || validation.id || ''
  };
}

self.onmessage = async (ev) => {
  const msg = ev && ev.data ? ev.data : {};
  if (msg.type === 'challenge-response') {
    if (pendingChallengeResolver) {
      const resolver = pendingChallengeResolver;
      pendingChallengeResolver = null;
      resolver(!!msg.correct);
    }
    return;
  }
  if (msg.type === 'cancel') {
    canceled = true;
    if (pendingChallengeResolver) {
      const resolver = pendingChallengeResolver;
      pendingChallengeResolver = null;
      resolver(false);
    }
    // Resposta imediata; o loop observará a flag
    postMessage({ type: 'done', reason: 'CANCELED' });
    running = false;
    return;
  }
  if (msg.type === 'run') {
    if (running) {
      // já em execução — ignore
      return;
    }
    running = true;
    canceled = false;
    const memHex = Array.isArray(msg.memory) ? msg.memory : new Array(16).fill('00');
    const maxSteps = Number.isFinite(msg.maxSteps) ? msg.maxSteps : 256;
    const speed = Number.isFinite(msg.speed) ? Math.max(0, msg.speed) : 0; // ms por passo
    const challengeMode = !!msg.challengeMode;
    const validation = (msg.validation && typeof msg.validation === 'object') ? msg.validation : null;

    if (!self.EmulatorCore || !self.EmulatorCore.Emulator) {
      postMessage({ type: 'done', reason: 'ERROR', error: 'EmulatorCore indisponível no worker' });
      running = false;
      return;
    }

    try {
      const emu = new self.EmulatorCore.Emulator();
      emu.loadMemoryFromHex(memHex);
      emu.reset();

      let steps = 0;
      while (steps < maxSteps) {
        if (canceled) { break; }

        if (challengeMode) {
          const currentInstr = emu.memory[emu.PC & 0x0F] & 0xFF;
          const targetId = (self.EmulatorCore && typeof self.EmulatorCore.getChallengeTargetFromInstrByte === 'function')
            ? self.EmulatorCore.getChallengeTargetFromInstrByte(currentInstr)
            : null;
          const opcode = (currentInstr >> 4) & 0x0F;
          const arg = currentInstr & 0x0F;
          postMessage({ type: 'challenge', step: steps + 1, targetId, opcode, arg });

          const isCorrect = await new Promise((resolve) => {
            pendingChallengeResolver = resolve;
          });
          if (canceled) break;
          if (!isCorrect) {
            postMessage({ type: 'challenge-feedback', ok: false, targetId });
            continue;
          }
          postMessage({ type: 'challenge-feedback', ok: true, targetId });
        }

        const tick = emu.step();
        steps++;
        
        // TELEMETRIA: Step-by-step execution tracking
        if (self.postMessage && steps % 5 === 0) { // Every 5th step to avoid flooding
          self.postMessage({
            type: 'emulator-step-telemetry',
            step: steps,
            instruction: tick.decode ? `${tick.decode.opName} ${tick.decode.arg}` : 'UNKNOWN',
            registers: {
              PC: tick.after.PC,
              ACC: tick.after.ACC
            },
            memory: tick.readVal !== null ? { address: tick.decode.arg, value: tick.readVal } : null,
            fault: tick.fault
          });
        }
        
        postMessage({
          type: 'tick',
          step: steps,
          fetched: tick.fetched,
          decode: tick.decode,
          readVal: tick.readVal,
          before: tick.before,
          after: tick.after,
          state: tick.state,
          outputEmitted: tick.outputEmitted,
          fault: tick.fault
        });
        if (tick.halted) {
          break;
        }
        if (speed > 0) {
          await sleep(speed);
        }
      }
      const reason = canceled ? 'CANCELED' : (steps >= maxSteps && !emu.halted ? 'MAX_STEPS' : (emu.halted ? 'HLT' : 'DONE'));
      const finalState = emu.snapshot();
      const registers = {
        PC: finalState.PC,
        ACC: finalState.ACC,
        OUT: Array.isArray(finalState.outputs) && finalState.outputs.length ? (finalState.outputs[finalState.outputs.length - 1] >>> 0) : 0
      };
      const validationResult = (reason === 'HLT') ? evaluateValidation(finalState, validation) : null;
      if (reason === 'HLT') {
        postMessage({ type: 'HALT', finalState, registers, validation: validationResult });
      }
      postMessage({ type: 'done', reason, steps, outputs: emu.outputs, state: finalState, registers, validation: validationResult });
    } catch (err) {
      // TELEMETRIA: Captura estado do emulador em caso de exceção
      const errorState = emu ? emu.snapshot() : {
        PC: 0, ACC: 0, memory: new Array(16).fill(0), outputs: [], halted: false
      };
      postMessage({ 
        type: 'done', 
        reason: 'ERROR', 
        error: String(err && err.message ? err.message : err),
        state: errorState,
        steps: steps || 0
      });
    } finally {
      running = false;
      canceled = false;
      pendingChallengeResolver = null;
    }
  }
};
