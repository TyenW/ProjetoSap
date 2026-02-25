/**
 * Challenge Mode Scaffolding / Training Mode
 * Provides progressive hints and partial reveals on wrong answers
 * Usage: Called when user fails a challenge, before reveal
 */

class ChallengeScaffolding {
  constructor() {
    this.hintLevels = {
      'PC': {
        hints: [
          '💡 Dica: Pense no registrador que aponta para a próxima instrução...',
          '💡 Dica: PC = Program Counter, o responsável pelo endereço em ROM',
          '💡 Dica: O sinal EP "enable PC" coloca seu valor no barramento'
        ],
        category: 'Registrador'
      },
      'ACC': {
        hints: [
          '💡 Dica: Este é o registrador onde operações aritméticas são feitas',
          '💡 Dica: ACC = Accumulator, usado por ADD e SUB',
          '💡 Dica: O sinal LA "load accumulator" carrega o resultado'
        ],
        category: 'Registrador'
      },
      'RAM': {
        hints: [
          '💡 Dica: Este é onde os dados da programa são armazenados',
          '💡 Dica: RAM = Random Access Memory, endereçada por MAR',
          '💡 Dica: O sinal LM "load memory" carrega seu valor no barramento'
        ],
        category: 'Memória'
      },
      'T-states': {
        hints: [
          '💡 Dica: Pense no ciclo de relógio (clock states)',
          '💡 Dica: São 5-6 pulsos de relógio por instrução (T1-T6)',
          '💡 Dica: Cada estado ativa sinais diferentes de controle'
        ],
        category: 'Ciclo'
      },
      'Barramento': {
        hints: [
          '💡 Dica: É a linha de transmissão de dados entre componentes',
          '💡 Dica: Sinais de controle (Ep, Lp, Lm, Lb) habilitam leitura/escrita',
          '💡 Dica: Apenas um componente pode untar ao barramento por vez'
        ],
        category: 'Sinais'
      }
    };

    this.sessionHints = {}; // { questionId: hintIndex }
  }

  /**
   * Classifica questão por tópico (mesmo da analytics)
   * @param {string} questionText
   * @private
   * @returns {string}
   */
  _classifyTopic(questionText) {
    const topicMap = {
      'PC': ['Contador de Programa', 'próxima instrução', 'PC'],
      'ACC': ['Acumulador', 'ACC', 'resultado aritmético'],
      'RAM': ['RAM', 'memória', 'dados'],
      'IR': ['IR', 'Registro de Instrução', 'opcode'],
      'T-states': ['estado T', 'T1', 'T2', 'ciclo', 'máquina'],
      'Barramento': ['barramento', 'sinal', 'Ep', 'Lp', 'Lm'],
      'ACC': ['ACC', 'Acumulador']
    };

    const lower = questionText.toLowerCase();
    for (const [topic, keywords] of Object.entries(topicMap)) {
      if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
        return topic;
      }
    }
    return null;
  }

  /**
   * Fornece dica progressiva para questão errada
   * @param {number} questionId
   * @param {string} questionText
   * @returns {Object} { hint: string, level: 0|1|2, topic: string }
   */
  provideHint(questionId, questionText) {
    const topic = this._classifyTopic(questionText);
    
    if (!this.hintLevels[topic]) {
      return { hint: null, level: 0, topic: null };
    }

    const hints = this.hintLevels[topic].hints;
    
    // Rastreia quantas dicas já foram dadas para esta questão
    if (!this.sessionHints[questionId]) {
      this.sessionHints[questionId] = 0;
    }

    const currentLevel = this.sessionHints[questionId];
    const hint = hints[Math.min(currentLevel, hints.length - 1)];
    
    // TELEMETRIA: Gatilho de ativação do scaffolding
    if (window.telemetry) {
      window.telemetry.logEvent('SCAFFOLDING_TRIGGERED', {
        topic: 'ADAPTIVE_LEARNING',
        value: `level_${currentLevel}`,
        questionId: questionId,
        hintLevel: currentLevel,
        topicCategory: topic,
        maxLevel: hints.length - 1,
        questionText: questionText
      });
    }
    
    // TELEMETRIA: Track hint effectiveness setup
    window.hintGivenAt = Date.now();
    window.hintQuestionId = questionId;
    window.hintLevel = currentLevel;
    window.hintTopic = topic;

    this.sessionHints[questionId]++;

    return {
      hint: hint,
      level: currentLevel,
      maxLevel: hints.length - 1,
      topic: topic,
      category: this.hintLevels[topic].category
    };
  }

  /**
   * Renderiza hint no DOM (durante desafio)
   * @param {HTMLElement} container
   * @param {Object} hintData
   */
  renderHint(container, hintData) {
    if (!container || !hintData.hint) return;

    const progressBar = hintData.maxLevel > 0 
      ? `<div style="font-size:0.8em; color:#b0d0ff; margin-top:6px;">Dica ${hintData.level + 1}/${hintData.maxLevel + 1}</div>`
      : '';

    const html = `
      <div class="challenge-hint" style="
        margin-top: 16px;
        padding: 12px;
        background: rgba(100,50,150,0.3);
        border-left: 3px solid #b06eff;
        border-radius: 6px;
        color: #e6c0ff;
        font-size: 0.95em;
        animation: slideInUp 0.3s ease;
      ">
        ${hintData.hint}
        ${progressBar}
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
  }

  /**
   * Revela parcialmente as opções corretas (50% da letra)
   * @param {Array<string>} options
   * @param {number} correctIndex
   * @returns {Array<string>} opções obfuscadas parcialmente
   */
  partialRevealCorrectOption(options, correctIndex) {
    const text = options[correctIndex];
    const revealed = Math.ceil(text.length / 2);
    const obfuscated = text.substring(0, revealed) + '█'.repeat(text.length - revealed);

    return options.map((opt, idx) => idx === correctIndex ? obfuscated : opt);
  }

  /**
   * Sugere estreitar opções: elimina 2 incorretas, deixa 2 (correta + 1)
   * @param {Array<string>} options
   * @param {number} correctIndex
   * @returns {Object} { remaining: [indices], eliminated: [indices] }
   */
  narrowDownOptions(options, correctIndex) {
    const incorrect = options
      .map((_, idx) => idx)
      .filter(idx => idx !== correctIndex);

    // Elimina 2 opções incorretas aleatoriamente
    const eliminated = incorrect.sort(() => Math.random() - 0.5).slice(0, 2);
    const remaining = options
      .map((_, idx) => idx)
      .filter(idx => !eliminated.includes(idx))
      .sort(); // mantém ordem: correta + 1 incorreta

    return { remaining, eliminated };
  }

  /**
   * Renderiza "narrowing down" visualmente
   * @param {HTMLElement} optionsContainer
   * @param {Object} narrowData
   */
  renderNarrowedOptions(optionsContainer, narrowData) {
    if (!optionsContainer) return;

    const buttons = Array.from(optionsContainer.querySelectorAll('button'));

    narrowData.eliminated.forEach(idx => {
      if (buttons[idx]) {
        buttons[idx].disabled = true;
        buttons[idx].style.opacity = '0.3';
        buttons[idx].style.textDecoration = 'line-through';
      }
    });

    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      margin-top: 10px;
      padding: 8px;
      background: rgba(255,180,0,0.2);
      border: 1px solid #ffb400;
      border-radius: 6px;
      color: #ffcc80;
      font-size: 0.85em;
      text-align: center;
    `;
    tooltip.textContent = '✋ Eliminadas 2 opções. Tente entre as 2 restantes!';
    optionsContainer.parentElement.insertBefore(tooltip, optionsContainer.nextSibling);
  }

  /**
   * Reseta hints para nova sessão
   */
  reset() {
    this.sessionHints = {};
  }

  /**
   * Retorna estatísticas de uso de dicas
   * @returns {Object}
   */
  getStats() {
    const totalHints = Object.values(this.sessionHints).reduce((a, b) => a + b, 0);
    const questionsWithHints = Object.keys(this.sessionHints).length;

    return {
      totalHints,
      questionsWithHints,
      avgHintsPerQuestion: questionsWithHints > 0 
        ? (totalHints / questionsWithHints).toFixed(1)
        : 0
    };
  }
}

// Instância global
window.scaffolding = new ChallengeScaffolding();
