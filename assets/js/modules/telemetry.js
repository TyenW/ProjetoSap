/**
 * Local Telemetry Module
 * Tracks page load time, quiz stalls, abandonment, user interactions
 * Data stored in localStorage (completely anonymous, no external calls)
 * No cookies or identifiers — purely behavioral metrics
 */

class LocalTelemetry {
  constructor() {
    this.sessionId = this._generateSessionId();
    this.sessionStart = Date.now();
    this.events = [];
    this.pageMetrics = {};
    this.maxEventsPerSession = 500; // Previne crescimento infinito
  }

  /**
   * Gera ID de sessão aleatório (não é identificador pessoal)
   * @private
   * @returns {string}
   */
  _generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Registra evento de interação
   * @param {string} eventType - 'quiz_start', 'challenge_attempt', 'page_load', etc
   * @param {Object} metadata - dados adicionais { page, duration, result }
   */
  logEvent(eventType, metadata = {}) {
    const event = {
      type: eventType,
      timestamp: Date.now(),
      elapsed: Date.now() - this.sessionStart,
      ...metadata
    };

    this.events.push(event);

    // Limpar se exceder limite
    if (this.events.length > this.maxEventsPerSession) {
      this.events = this.events.slice(-this.maxEventsPerSession);
    }

    // Salvar periodicamente (a cada 10 eventos)
    if (this.events.length % 10 === 0) {
      this._saveSession();
    }
  }

  /**
   * Marca tempo de carregamento da página
   * @param {string} pageName
   */
  recordPageLoad(pageName) {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) {
      this.pageMetrics[pageName] = {
        loadTime: perfData.loadEventEnd - perfData.loadEventStart,
        domReady: perfData.domInteractive - perfData.fetchStart,
        resourceTime: perfData.responseEnd - perfData.fetchStart,
        timestamp: new Date().toISOString()
      };
    }

    this.logEvent('page_load', {
      page: pageName,
      windoLoadTime: performance?.getEntriesByType('navigation')?.[0]?.loadEventEnd || 0
    });
  }

  /**
   * Rastreia tentativa de resposta no quiz
   * @param {number} questionId
   * @param {string} difficulty
   * @param {boolean} correct
   * @param {number} timeMs
   */
  logQuizAttempt(questionId, difficulty, correct, timeMs) {
    this.logEvent('quiz_attempt', {
      questionId,
      difficulty,
      correct,
      timeMs,
      abnormal: timeMs > 30000 // Mais de 30s é anormal
    });
  }

  /**
   * Rastreia abreviação de sessão (sem finalizar quiz)
   * Detecta quando usuário sai sem completar
   */
  logAbandonment(context = {}) {
    this.logEvent('session_abandoned', {
      context,
      sessionDuration: Date.now() - this.sessionStart
    });
    this._saveSession();
  }

  /**
   * Rastreja erro na aplicação
   * @param {string} message
   * @param {string} stack
   */
  logError(message, stack = '') {
    this.logEvent('app_error', {
      message,
      stack: stack.substring(0, 200) // Limitar tamanho
    });
    this._saveSession();
  }

  /**
   * Rastreia performance de um componente
   * @param {string} component
   * @param {number} durationMs
   */
  logComponentMetric(component, durationMs) {
    this.logEvent('component_metric', {
      component,
      durationMs,
      slow: durationMs > 1000
    });
  }

  /**
   * Obtém resumo agregado de sessões (últimas N)
   * @param {number} limit
   * @returns {Object} { totalSessions, avgLoadTime, abandonmentRate, ... }
   */
  getSummary(limit = 10) {
    const sessions = this._loadSessions().slice(-limit);

    if (sessions.length === 0) {
      return { totalSessions: 0, noData: true };
    }

    const pageLoads = sessions.flatMap(s => s.events || []).filter(e => e.type === 'page_load');
    const abandonments = sessions.flatMap(s => s.events || []).filter(e => e.type === 'session_abandoned');
    const quizAttempts = sessions.flatMap(s => s.events || []).filter(e => e.type === 'quiz_attempt');

    const avgLoadTime = pageLoads.length > 0
      ? pageLoads.reduce((sum, e) => sum + (e.windoLoadTime || 0), 0) / pageLoads.length
      : 0;

    const slowLoads = pageLoads.filter(e => (e.windoLoadTime || 0) > 2000).length;

    return {
      totalSessions: sessions.length,
      avgLoadTime: Math.round(avgLoadTime),
      slowLoadCount: slowLoads,
      abandonmentCount: abandonments.length,
      abandonmentRate: (abandonments.length / sessions.length * 100).toFixed(1),
      quizAttemptsTotal: quizAttempts.length,
      avgTimePerQuestion: quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum, e) => sum + e.timeMs, 0) / quizAttempts.length)
        : 0,
      abnormalAttempts: quizAttempts.filter(e => e.abnormal).length
    };
  }

  /**
   * Exporta dados anonimizados para análise
   * @returns {string} JSON com resumo agregado (sem IDs pessoais)
   */
  exportAnonimized() {
    const summary = this.getSummary(20);
    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      summary,
      note: 'Dados completamente anonimizados. Sem identificadores pessoais.'
    }, null, 2);
  }

  /**
   * Limpa dados antigos (>30 dias)
   * @private
   */
  pruneOldData() {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let sessions = this._loadSessions();

    sessions = sessions.filter(s => {
      const firstEventTime = s.events?.[0]?.timestamp || 0;
      return (now - firstEventTime) < thirtyDaysMs;
    });

    localStorage.setItem('telemetry_sessions', JSON.stringify(sessions));
  }

  /**
   * Salva sessão atual no localStorage
   * @private
   */
  _saveSession() {
    try {
      let sessions = this._loadSessions();
      
      // Não duplicar sessão se já existe
      const sessionIndex = sessions.findIndex(s => s.sessionId === this.sessionId);
      const sessionData = {
        sessionId: this.sessionId,
        startTime: this.sessionStart,
        events: this.events
      };

      if (sessionIndex >= 0) {
        sessions[sessionIndex] = sessionData;
      } else {
        sessions.push(sessionData);
      }

      // Manter apenas últimas 50 sessões
      sessions = sessions.slice(Math.max(0, sessions.length - 50));
      localStorage.setItem('telemetry_sessions', JSON.stringify(sessions));
    } catch (e) {
      console.warn('Falha ao salvar telemetria:', e);
    }
  }

  /**
   * Carrega todas as sessões salvas
   * @private
   */
  _loadSessions() {
    try {
      return JSON.parse(localStorage.getItem('telemetry_sessions')) || [];
    } catch {
      return [];
    }
  }

  /**
   * Reseta dados de telemetria (para testes)
   */
  clear() {
    this.events = [];
    this.pageMetrics = {};
    localStorage.removeItem('telemetry_sessions');
  }
}

// Instância global
window.telemetry = new LocalTelemetry();

// Auto-log page load
window.addEventListener('load', () => {
  const pageName = document.title || location.pathname;
  window.telemetry.recordPageLoad(pageName);
});

// Log de abandono se página descarrega sem conclusão
window.addEventListener('beforeunload', () => {
  const quizContainer = document.getElementById('quiz-container');
  if (quizContainer && !document.getElementById('restartBtn')?.hidden) {
    // Quiz ainda está ativo (não foi finalizado)
    window.telemetry.logAbandonment({ type: 'page_unload_during_quiz' });
  }
});

// Log de erros não capturados
window.addEventListener('error', (event) => {
  window.telemetry.logError(event.message, event.error?.stack || '');
});
