(function (global) {
  'use strict';

  const DEFAULT_CLEAR_MS = 900;
  let focusOverlay = null;
  let activeFocusedEl = null;

  function ensureOverlay() {
    if (focusOverlay && document.body.contains(focusOverlay)) return focusOverlay;
    focusOverlay = document.createElement('div');
    focusOverlay.className = 'ui-focus-overlay';
    focusOverlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(focusOverlay);
    return focusOverlay;
  }

  function clear(componentId) {
    if (componentId) {
      const el = document.getElementById(componentId);
      if (el) {
        el.classList.remove('active-bus', 'writing', 'reading', 'pulse', 'focus-target');
        el.style.removeProperty('--glow-color');
        if (activeFocusedEl === el) activeFocusedEl = null;
      }
    } else {
      document.querySelectorAll('.sap1-block, #barramento').forEach((el) => {
        el.classList.remove('active-bus', 'writing', 'reading', 'pulse', 'focus-target');
        el.style.removeProperty('--glow-color');
      });
      activeFocusedEl = null;
    }

    if (!activeFocusedEl && focusOverlay) {
      focusOverlay.classList.remove('active');
    }
  }

  function highlight(componentId, type = 'pulse', options = {}) {
    const el = document.getElementById(componentId);
    if (!el) return false;

    const className = String(type || 'pulse').trim();
    const clearMs = Number.isFinite(options.clearMs) ? options.clearMs : DEFAULT_CLEAR_MS;
    const glowColor = options.glowColor || '';
    const focus = !!options.focus;

    el.classList.add(className);
    if (glowColor) el.style.setProperty('--glow-color', glowColor);

    if (focus) {
      ensureOverlay().classList.add('active');
      if (activeFocusedEl && activeFocusedEl !== el) activeFocusedEl.classList.remove('focus-target');
      el.classList.add('focus-target');
      activeFocusedEl = el;
    }

    if (clearMs > 0) {
      setTimeout(() => {
        el.classList.remove(className);
        if (className === 'pulse') el.style.removeProperty('--glow-color');
      }, clearMs);
    }
    return true;
  }

  global.UIEffects = {
    highlight,
    clear
  };
})(typeof window !== 'undefined' ? window : globalThis);
