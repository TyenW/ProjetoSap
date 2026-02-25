(function (global) {
  'use strict';

  const DEFAULT_CLEAR_MS = 900;
  let focusOverlay = null;
  let activeFocusedEl = null;
  
  // TTA (Time to Action) tracking
  let highlightStartTime = null;
  let lastHighlightedComponent = null;

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

    // TELEMETRIA: Marca início do TTA (Time To Action)
    if (focus || className === 'pulse') {
      highlightStartTime = Date.now();
      lastHighlightedComponent = componentId;
    }

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

  // TELEMETRIA: Função para capturar TTA quando componente é clicado
  function logComponentClick(componentId) {
    if (highlightStartTime && lastHighlightedComponent && window.telemetry) {
      const tta = Date.now() - highlightStartTime;
      window.telemetry.logEvent('TIME_TO_ACTION', {
        topic: 'ATTENTION_FLOW',
        value: tta,
        component: componentId,
        expectedComponent: lastHighlightedComponent,
        wasCorrectTarget: componentId === lastHighlightedComponent
      });
      // Reset tracking
      highlightStartTime = null;
      lastHighlightedComponent = null;
    }
  }

  global.UIEffects = {
    highlight,
    clear,
    logComponentClick
  };
})(typeof window !== 'undefined' ? window : globalThis);
