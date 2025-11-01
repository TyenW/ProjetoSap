/*
  MemoryStore – estado central da RAM (16 bytes) com reatividade simples
  - Armazena strings hex de 0..2 chars (parcial) ou 2 chars (completas)
  - Normaliza para [0-9A-F] e uppercase
  - Notifica assinantes { type, source, prev, next }
*/
(function (global) {
  'use strict';

  function normalizePartialHex2(v) {
    if (v == null) return '';
    const s = String(v).toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 2);
    return s; // pode ser '' | 'F' | '0F' | 'FF'
  }

  class MemoryStore {
    constructor(initial) {
      this._mem = new Array(16).fill('00');
      if (Array.isArray(initial) && initial.length === 16) {
        for (let i = 0; i < 16; i++) {
          const x = normalizePartialHex2(initial[i]);
          this._mem[i] = x.length === 0 ? '00' : (x.length === 1 ? x : x);
        }
      }
      this._listeners = new Set();
    }

    subscribe(fn) {
      if (typeof fn === 'function') this._listeners.add(fn);
      return () => this._listeners.delete(fn);
    }

    _emit(evt) {
      for (const fn of this._listeners) {
        try { fn(evt); } catch (e) { /* noop */ }
      }
    }

    getAll() {
      return this._mem.slice();
    }

    setByte(index, value, source = 'unknown') {
      const i = Number(index) | 0;
      if (i < 0 || i > 15) return false;
      const prev = this._mem.slice();
      const v = normalizePartialHex2(value);
      if (prev[i] === v) return false;
      this._mem[i] = v;
      this._emit({ type: 'setByte', source, index: i, prev, next: this._mem.slice() });
      return true;
    }

    setAll(arr, source = 'unknown') {
      if (!Array.isArray(arr) || arr.length !== 16) return false;
      const prev = this._mem.slice();
      const next = new Array(16);
      for (let i = 0; i < 16; i++) next[i] = normalizePartialHex2(arr[i]);
      // Verifica se houve mudança
      let changed = false;
      for (let i = 0; i < 16; i++) if (prev[i] !== next[i]) { changed = true; break; }
      if (!changed) return false;
      this._mem = next;
      this._emit({ type: 'setAll', source, prev, next: this._mem.slice() });
      return true;
    }
  }

  function create(initial) { return new MemoryStore(initial); }

  global.MemoryStore = { MemoryStore, create };
})(typeof window !== 'undefined' ? window : globalThis);
