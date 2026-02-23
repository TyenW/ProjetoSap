/**
 * Accessibility Module
 * - Keyboard navigation (←↑→↓) in hardware diagram
 * - ARIA live regions for T-states, ACC, PC updates
 * - Focus management for quiz options
 * - Semantic HTML landmarks
 */

class AccessibilityManager {
  constructor() {
    this.currentFocusIndex = 0;
    this.selectedComponent = null;
    this.ariaAnnouncer = null;
    this.init();
  }

  /**
   * Inicializa features de acessibilidade
   */
  init() {
    this._setupAriaLiveRegion();
    this._setupKeyboardNavigation();
    this._setupFocusManagement();
  }

  /**
   * Cria ARIA live region para anúncios
   * @private
   */
  _setupAriaLiveRegion() {
    const existing = document.getElementById('aria-announcer');
    if (existing) {
      this.ariaAnnouncer = existing;
      return;
    }

    this.ariaAnnouncer = document.createElement('div');
    this.ariaAnnouncer.id = 'aria-announcer';
    this.ariaAnnouncer.setAttribute('aria-live', 'polite');
    this.ariaAnnouncer.setAttribute('aria-atomic', 'true');
    this.ariaAnnouncer.setAttribute('class', 'sr-only');
    document.body.appendChild(this.ariaAnnouncer);

    // CSS para sr-only (screen reader only)
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Anuncia mudanças de estado (emulator ticks)
   * @param {Object} state - { PC, ACC, OUT, T, opcode }
   */
  announceEmulatorState(state) {
    if (!this.ariaAnnouncer) return;

    const parts = [];
    if (state.PC !== undefined) parts.push(`PC = ${state.PC}`);
    if (state.ACC !== undefined) parts.push(`ACC = ${state.ACC}`);
    if (state.OUT !== undefined) parts.push(`Output = ${state.OUT}`);
    if (state.T !== undefined) parts.push(`T-state ${state.T}`);
    if (state.opcode !== undefined) parts.push(`Opcode ${state.opcode}`);

    if (parts.length > 0) {
      this.ariaAnnouncer.textContent = parts.join(', ');
    }
  }

  /**
   * Setup navegação teclado no diagrama
   * Setas: ← ↓ ↑ → para mover entre componentes
   * @private
   */
  _setupKeyboardNavigation() {
    const diagram = document.getElementById('hardware-diagram');
    if (!diagram) return;

    document.addEventListener('keydown', (e) => {
      // Só ativa se o foco está no diagrama ou em elemento dentro dele
      if (!diagram.contains(document.activeElement) && document.activeElement !== document.body) {
        return;
      }

      const components = Array.from(diagram.querySelectorAll('[data-component]'));
      if (components.length === 0) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          this.currentFocusIndex = (this.currentFocusIndex + 1) % components.length;
          this._focusComponent(components[this.currentFocusIndex]);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          this.currentFocusIndex = (this.currentFocusIndex - 1 + components.length) % components.length;
          this._focusComponent(components[this.currentFocusIndex]);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          const focused = components[this.currentFocusIndex];
          if (focused) {
            // Simula clique se for desafio
            if (window.isChallengeMode) {
              focused.click();
            }
          }
          break;
      }
    });
  }

  /**
   * Foca componente e anuncia
   * @private
   */
  _focusComponent(component) {
    if (!component) return;

    component.focus();
    component.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const componentName = component.getAttribute('data-component') || 'componente';
    this.announceState(`Componente selecionado: ${componentName}`);
  }

  /**
   * Setup gerenciamento de foco para opções de quiz
   * @private
   */
  _setupFocusManagement() {
    // Redireciona foco pós-quiz para restart button
    const watchRestartBtn = setInterval(() => {
      const restartBtn = document.getElementById('restartBtn');
      if (restartBtn && restartBtn.style.display !== 'none') {
        restartBtn.focus();
        clearInterval(watchRestartBtn);
      }
    }, 100);

    // Anuncia opções de quiz para leitores de tela
    document.addEventListener('focusin', (e) => {
      if (e.target.closest('#options button')) {
        const buttons = Array.from(document.querySelectorAll('#options button'));
        const index = buttons.indexOf(e.target);
        const total = buttons.length;
        this.announceState(`Opção ${index + 1} de ${total}: ${e.target.textContent}`);
      }
    });
  }

  /**
   * Anuncia mensagem de estado
   * @param {string} message
   */
  announceState(message) {
    if (!this.ariaAnnouncer) return;
    this.ariaAnnouncer.textContent = message;
  }

  /**
   * Adiciona labels ARIA para componentes dinâmicos
   * @param {HTMLElement} element
   * @param {string} label
   */
  setAriaLabel(element, label) {
    if (!element) return;
    element.setAttribute('aria-label', label);
  }

  /**
   * Marca elemento como descrito por outro (para diagramas)
   * @param {HTMLElement} element
   * @param {string} describedById
   */
  setAriaDescribedBy(element, describedById) {
    if (!element) return;
    element.setAttribute('aria-describedby', describedById);
  }

  /**
   * Retorna modo de leitura de tela ativo
   * @returns {boolean}
   */
  isScreenReaderActive() {
    // Heurística: verifica se há listeners de accessibility ou navigator
    return (
      typeof window.getComputedStyle !== 'undefined' &&
      window.navigator.userAgent.includes('Firefox') // Firefox com leitores
    );
  }
}

// Instância global
window.a11y = new AccessibilityManager();

// Exporta para uso nos módulos existentes
window.announceEmulatorState = (state) => window.a11y.announceEmulatorState(state);
window.announceState = (msg) => window.a11y.announceState(msg);
