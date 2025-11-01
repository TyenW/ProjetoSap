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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

self.onmessage = async (ev) => {
  const msg = ev && ev.data ? ev.data : {};
  if (msg.type === 'cancel') {
    canceled = true;
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
        const tick = emu.step();
        steps++;
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
      postMessage({ type: 'done', reason, steps, outputs: emu.outputs, state: emu.snapshot() });
    } catch (err) {
      postMessage({ type: 'done', reason: 'ERROR', error: String(err && err.message ? err.message : err) });
    } finally {
      running = false;
      canceled = false;
    }
  }
};
