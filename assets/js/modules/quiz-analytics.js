/**
 * Quiz Analytics Module
 * Tracks error patterns by topic and generates post-quiz reports
 * Storage: localStorage (quiz_heatmap, quiz_session)
 */

class QuizAnalytics {
  constructor() {
    this.sessionStart = Date.now();
    this.currentSessionErrors = {}; // { topic: [questionIds] }
    this.topicMap = {
      'PC': ['Qual', 'Contador de Programa', 'próxima instrução'],
      'ACC': ['Acumulador', 'ACC', 'resultado aritmético'],
      'IR': ['IR', 'Registro de Instrução', 'opcode'],
      'MAR': ['MAR', 'endereço', 'memória'],
      'RAM': ['RAM', 'memória', 'dados'],
      'T-states': ['estado T', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'ciclo', 'máquina'],
      'Barramento': ['barramento', 'sinal', 'Ep', 'Lp', 'Lm'],
      'Instruções': ['LDA', 'ADD', 'SUB', 'OUT', 'HLT', 'opcode'],
      'ALU': ['ALU', 'unidade lógica', 'somador', 'aritmética']
    };
  }

  /**
   * Classifica questão por tópico baseado em keywords
   * @param {string} questionText
   * @returns {string} topicKey ou 'outros'
   */
  classifyTopic(questionText) {
    const lower = questionText.toLowerCase();
    for (const [topic, keywords] of Object.entries(this.topicMap)) {
      if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
        return topic;
      }
    }
    return 'outros';
  }

  /**
   * Registra erro no tópico
   * @param {string} questionText
   * @param {number} questionIndex
   */
  recordError(questionText, questionIndex) {
    const topic = this.classifyTopic(questionText);
    if (!this.currentSessionErrors[topic]) {
      this.currentSessionErrors[topic] = [];
    }
    this.currentSessionErrors[topic].push(questionIndex);
  }

  /**
   * Finaliza sessão e gera relatório
   * @param {number} totalAnswered
   * @param {number} totalCorrect
   * @returns {Object} reportData
   */
  finishSession(totalAnswered, totalCorrect) {
    const sessionDuration = Date.now() - this.sessionStart;
    const accuracy = totalAnswered > 0 ? (totalCorrect / totalAnswered * 100).toFixed(1) : 0;

    const report = {
      timestamp: new Date().toISOString(),
      duration: sessionDuration,
      answered: totalAnswered,
      correct: totalCorrect,
      accuracy: parseFloat(accuracy),
      errorsByTopic: this.currentSessionErrors,
      weakTopics: this._getWeakTopics(),
      strongTopics: this._getStrongTopics()
    };

    // Salva no histórico
    this._saveToHistory(report);
    return report;
  }

  /**
   * Identifica tópicos com mais erros
   * @private
   * @returns {Array<string>}
   */
  _getWeakTopics() {
    return Object.entries(this.currentSessionErrors)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  /**
   * Identifica tópicos sem erros
   * @private
   * @returns {Array<string>}
   */
  _getStrongTopics() {
    const allTopics = Object.keys(this.topicMap);
    const topicsWithErrors = Object.keys(this.currentSessionErrors);
    return allTopics.filter(t => !topicsWithErrors.includes(t)).slice(0, 3);
  }

  /**
   * Salva relatório no histórico (último 5 sessões)
   * @private
   * @param {Object} report
   */
  _saveToHistory(report) {
    try {
      let history = JSON.parse(localStorage.getItem('quiz_session_history')) || [];
      history.push(report);
      // Mantém apenas últimas 5 sessões
      history = history.slice(Math.max(0, history.length - 5));
      localStorage.setItem('quiz_session_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Falha ao salvar histórico:', e);
    }
  }

  /**
   * Gera recomendações de estudo
   * @param {Array<string>} weakTopics
   * @returns {Array<Object>} recomendações
   */
  generateStudyRecommendations(weakTopics) {
    const recommendations = {
      'PC': { description: 'Entender o papel do Contador de Programa', link: '#oqueesap' },
      'ACC': { description: 'Revisar operações com o Acumulador (ADD, SUB)', link: '#oqueesap' },
      'T-states': { description: 'Estudar ciclos de máquina e estados T', link: '#oqueesap' },
      'Barramento': { description: 'Aprender sinais de controle (Ep, Lp, Lm)', link: '#oqueesap' },
      'Instruções': { description: 'Revisar set de instruções SAP-1', link: '#oqueesap' }
    };

    return weakTopics.map(topic => ({
      topic,
      ...recommendations[topic] || { description: `Revisar ${topic}`, link: '#oqueesap' }
    }));
  }

  /**
   * Renderiza relatório pós-quiz no DOM
   * @param {Object} report
   * @param {HTMLElement} container
   */
  renderReport(report, container) {
    if (!container) return;

    const html = `
      <div class="quiz-report-card">
        <h3>📊 Relatório da Sessão</h3>
        <div class="report-stats">
          <div class="stat">
            <span class="label">Duração:</span>
            <span class="value">${this._formatTime(report.duration)}</span>
          </div>
          <div class="stat">
            <span class="label">Respondidas:</span>
            <span class="value">${report.answered}</span>
          </div>
          <div class="stat">
            <span class="label">Precisão:</span>
            <span class="value">${report.accuracy}%</span>
          </div>
        </div>

        ${report.weakTopics.length > 0 ? `
          <div class="weak-topics">
            <h4>⚠️ Tópicos frágeis:</h4>
            <ul>
              ${report.weakTopics.map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${report.strongTopics.length > 0 ? `
          <div class="strong-topics">
            <h4>✨ Tópicos fortes:</h4>
            <ul>
              ${report.strongTopics.map(t => `<li>${t}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Formata duração em minutos:segundos
   * @private
   * @param {number} ms
   * @returns {string}
   */
  _formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  /**
   * Exporta heatmap como JSON
   * @returns {string} JSON stringificado
   */
  exportHeatmap() {
    return JSON.stringify(this.currentSessionErrors, null, 2);
  }

  /**
   * Limpa dados da sessão
   */
  reset() {
    this.sessionStart = Date.now();
    this.currentSessionErrors = {};
  }
}

// Instância global
window.quizAnalytics = new QuizAnalytics();
