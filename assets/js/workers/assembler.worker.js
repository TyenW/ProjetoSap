// Assembler Worker (classic worker script)
// Recebe: { type: 'assemble', source: string }
// Responde: { type: 'assembled', memory, errors, assignments }

/* eslint-disable no-restricted-globals */
try {
  importScripts('../core/assembler-core.js');
} catch (e) {
  // fallback noop; responderá erro ao montar
}

let busy = false;

self.onmessage = async (ev) => {
  const msg = ev && ev.data ? ev.data : {};
  if (msg.type === 'assemble') {
    if (busy) {
      // fila simples: ignora requests enquanto montando para evitar backlog
      // caller pode debouncer no main
      return;
    }
    busy = true;
    const source = String(msg.source || '');
    try {
      if (!self.AssemblerCore || !self.AssemblerCore.assemble) {
        postMessage({ type: 'assembled', memory: new Array(16).fill('00'), errors: ['AssemblerCore indisponível no worker'], assignments: [] });
      } else {
        const t0 = Date.now();
        const result = self.AssemblerCore.assemble(source);
        const dt = Date.now() - t0;
        postMessage({ type: 'assembled', ...result, elapsedMs: dt });
      }
    } catch (err) {
      postMessage({ type: 'assembled', memory: new Array(16).fill('00'), errors: [String(err && err.message ? err.message : err)], assignments: [] });
    } finally {
      busy = false;
    }
  } else if (msg.type === 'ping') {
    postMessage({ type: 'pong' });
  }
};
