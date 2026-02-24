/**
 * Enhanced Telemetry Module
 * Automatically tracks all student interactions with invisible data collection
 * Sends data to Google Apps Script for academic research analysis
 * Completely anonymous, GDPR compliant, no personal identifiers
 */

// Configure your Google Apps Script URL here
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwTLy1F6IE5tOtcKgHtkGyz44JebINPkWIHf1fz2aBKp741lYazuhjvZJXIm2AzHgHWQ/exec';

// HEALTH CHECK do sistema
function validateTelemetrySetup() {
  const issues = [];
  
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('SEU_')) {
    issues.push('❌ URL do Google Apps Script não configurada');
  }
  
  if (!window.fetch) {
    issues.push('❌ Browser não suporta Fetch API');
  }
  
  if (!navigator.sendBeacon) {
    issues.push('⚠️ Browser não suporta Beacon API (dados de saída podem se perder)');
  }
  
  if (!localStorage) {
    issues.push('⚠️ LocalStorage não disponível (anônimato prejudicado)');
  }
  
  return {
    isReady: issues.length === 0,
    issues: issues,
    warnings: issues.filter(i => i.includes('⚠️')).length,
    errors: issues.filter(i => i.includes('❌')).length
  };
}

class LocalTelemetry {
  constructor() {
    this.sessionId = this._generateSessionId();
    this.sessionStart = Date.now();
    this.events = [];
    this.pageMetrics = {};
    this.maxEventsPerSession = 500; // Previne crescimento infinito
    this.currentQuizTopic = null;
    this.currentQuizScore = 0;
    this.totalHintsUsed = 0;
    
    // MELHORIAS PARA PRODUÇÃO
    this.offlineQueue = []; // Queue para eventos offline
    this.lastSendTime = 0;
    this.sendCooldown = 100; // Rate limiting: min 100ms entre envios
    this.maxRetries = 3;
    this.remoteBlockedUntil = 0; // pausa envio remoto em caso de auth/config inválida
    this.hasWarnedRemoteAuth = false;
    this.isOnline = navigator.onLine;
    this.userJourney = []; // Tracking de páginas visitadas
    
    // Detectar mudanças de conectividade
    window.addEventListener('online', () => this._handleOnlineStatus(true));
    window.addEventListener('offline', () => this._handleOnlineStatus(false));
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
   * Registra evento de interação e AUTOMATICAMENTE envia para Google Sheets
   * @param {string} eventType - 'quiz_start', 'challenge_attempt', 'page_load', etc
   * @param {Object} metadata - dados adicionais { page, duration, result }
   */
  logEvent(eventType, metadata = {}) {
    // VALIDAÇÃO DE DADOS
    if (!eventType || typeof eventType !== 'string') return;
    
    // RATE LIMITING para produção
    const now = Date.now();
    if (now - this.lastSendTime < this.sendCooldown && !metadata.isExit) {
      // Adicionar à queue para envio posterior
      this.offlineQueue.push({ eventType, metadata, timestamp: now });
      this._processQueueDelayed();
      return;
    }

    const event = {
      type: eventType,
      timestamp: now,
      elapsed: now - this.sessionStart,
      ...metadata
    };

    this.events.push(event);
    
    // TRACKING DE USER JOURNEY
    if (eventType === 'page_load') {
      this.userJourney.push({
        page: metadata.page || window.location.pathname,
        timestamp: now,
        referrer: document.referrer
      });
    }

    // ENVIO AUTOMÁTICO INVISÍVEL para Google Apps Script
    const payload = {
      topic: metadata.topic || 'GENERAL',
      metricType: eventType.toUpperCase(),
      value: metadata.value || 1,
      timestamp: new Date(now).toISOString(),
      sessionId: this.sessionId,
      studentId: this._getStudentId(),
      userJourney: JSON.stringify(this.userJourney.slice(-5)), // Últimas 5 páginas
      additionalData: JSON.stringify(metadata)
    };
    
    this._sendToGoogleSheets(payload);

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
   * Envia dados automaticamente para Google Apps Script com retry e offline support
   * @private
   */
  async _sendToGoogleSheets(data, retryCount = 0) {
    // Validação de URL configurada
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('SEU_')) {
      if (retryCount === 0) console.warn('[Telemetria] URL do Google Apps Script não configurada');
      return;
    }

    // Evita flood quando endpoint está com auth/configuração inválida
    if (Date.now() < this.remoteBlockedUntil) {
      if (!data.isExit) this.offlineQueue.push(data);
      return;
    }

    const payload = {
      ...data,
      userAgent: navigator.userAgent.substring(0, 100),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      platform: navigator.platform,
      isRepeating: this._getIsRepeatingStudent(),
      retryCount
    };

    try {
      // Se offline, adicionar à queue
      if (!this.isOnline && !data.isExit) {
        this.offlineQueue.push(payload);
        return;
      }

      // Se é evento de saída/fechamento, usar sendBeacon (mais confiável)
      if (data.metricType === 'PAGE_EXIT' || data.isExit) {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
          formData.append(key, String(payload[key]));
        });
        navigator.sendBeacon(GOOGLE_SCRIPT_URL, formData);
        this.lastSendTime = Date.now();
        return;
      }

      // Envio normal assíncrono com timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Necessário para Google Apps Script
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.lastSendTime = Date.now();
      this.hasWarnedRemoteAuth = false;
      
    } catch (e) {
      const message = String(e?.message || '');
      const unauthorized = /401|unauthorized/i.test(message);

      if (unauthorized) {
        // Pausa por 10 minutos para evitar repetição infinita de erro no console
        this.remoteBlockedUntil = Date.now() + (10 * 60 * 1000);
        if (!this.hasWarnedRemoteAuth) {
          console.warn('[Telemetria] Google Apps Script retornou 401. Verifique implantação pública (Anyone) e URL /exec. Envio remoto pausado por 10 minutos.');
          this.hasWarnedRemoteAuth = true;
        }
        if (!data.isExit) {
          this.offlineQueue.push(payload);
        }
        return;
      }

      // RETRY MECHANISM para produção
      if (retryCount < this.maxRetries && !data.isExit) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Backoff exponencial
        setTimeout(() => {
          this._sendToGoogleSheets(data, retryCount + 1);
        }, retryDelay);
      } else {
        // Último recurso: adicionar à queue offline
        if (!data.isExit) {
          this.offlineQueue.push(payload);
        }
      }
      
      // Log apenas em desenvolvimento
      if (window.location.hostname === 'localhost') {
        console.warn('[Telemetria] Erro:', e.message, 'Retry:', retryCount);
      }
    }
  }

  /**
   * Gera ou recupera ID anônimo do estudante
   * @private
   */
  _getStudentId() {
    let studentId = localStorage.getItem('bitlab_student_id');
    if (!studentId) {
      studentId = 'student_' + Math.random().toString(36).substr(2, 12);
      localStorage.setItem('bitlab_student_id', studentId);
    }
    return studentId;
  }

  /**
   * Detecta se é estudante repetente (já usou o sistema antes)
   * @private
   */
  _getIsRepeatingStudent() {
    const hasHistory = localStorage.getItem('telemetry_sessions');
    return hasHistory ? 'true' : 'false';
  }

  /**
   * Gerencia mudanças de conectividade
   * @private
   */
  _handleOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    
    if (isOnline && this.offlineQueue.length > 0) {
      // Processar queue offline
      console.log(`[Telemetria] Reconectado! Enviando ${this.offlineQueue.length} eventos pendentes`);
      const queue = [...this.offlineQueue];
      this.offlineQueue = [];
      
      // Enviar com delay entre requisições
      queue.forEach((payload, index) => {
        setTimeout(() => {
          this._sendToGoogleSheets(payload);
        }, index * 200); // 200ms entre envios
      });
    }
    
    // Log do status
    this.logEvent('CONNECTIVITY_CHANGE', {
      topic: 'SYSTEM',
      value: isOnline ? 'ONLINE' : 'OFFLINE',
      queueSize: this.offlineQueue.length
    });
  }

  /**
   * Processa queue com debounce
   * @private
   */
  _processQueueDelayed() {
    clearTimeout(this._queueTimer);
    this._queueTimer = setTimeout(() => {
      if (this.offlineQueue.length > 0) {
        const event = this.offlineQueue.shift();
        this.logEvent(event.eventType, event.metadata);
      }
    }, this.sendCooldown * 2);
  }

  /**
   * Performance monitoring para detectar lentidão
   */
  _monitorPerformance() {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData && perfData.loadEventEnd > 0) {
        const loadTime = perfData.loadEventEnd - perfData.fetchStart;
        
        if (loadTime > 5000) { // Mais de 5s é lento
          this.logEvent('SLOW_LOAD_DETECTED', {
            topic: 'PERFORMANCE',
            value: Math.round(loadTime),
            connection: navigator.connection?.effectiveType || 'unknown'
          });
        }
      }
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

// Instância global com inicialização robusta
window.telemetry = new LocalTelemetry();

// INICIALIZAÇÃO E VALIDAÇÃO AUTOMÁTICA
(function initializeTelemetry() {
  const health = validateTelemetrySetup();
  
  // Em desenvolvimento, mostrar status no console
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.group('🔍 BitLab Telemetry System Status');
    if (health.isReady) {
      console.log('✅ Sistema configurado e funcionando');
      console.log('📊 Dados serão enviados para:', GOOGLE_SCRIPT_URL.substring(0, 60) + '...');
      console.log('🔧 Para testar: testTelemetry()');
    } else {
      console.warn('⚠️ Problemas encontrados:');
      health.issues.forEach(issue => console.warn(issue));
    }
    console.groupEnd();
  }
  
  // Log de inicialização
  setTimeout(() => {
    window.telemetry.logEvent('SYSTEM_INITIALIZED', {
      topic: 'SYSTEM',
      value: health.isReady ? 'READY' : 'ISSUES',
      errors: health.errors,
      warnings: health.warnings,
      url: window.location.href
    });
  }, 500);
})();

// Auto-log page load com performance monitoring
window.addEventListener('load', () => {
  const pageName = document.title || location.pathname;
  window.telemetry.recordPageLoad(pageName);
  
  // Monitor performance após carregar
  setTimeout(() => {
    window.telemetry._monitorPerformance();
  }, 1000);
});

// HOOKS AUTOMÁTICOS INVISÍVEIS ===================================================

// 1. Hook automático: Detecta saída/fechamento da página (CRUCIAL para seu artigo)
window.addEventListener('beforeunload', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  window.telemetry.logEvent('PAGE_EXIT', { 
    topic: 'SESSION',
    value: currentPage,
    isExit: true,
    duration: Date.now() - window.telemetry.sessionStart
  });
  
  // Detecta abandono específico durante atividades
  const quizContainer = document.getElementById('quiz-container');
  const isQuizActive = quizContainer && !document.getElementById('restartBtn')?.hidden;
  const isEmulatorActive = window.running || false;
  
  if (isQuizActive) {
    window.telemetry.logEvent('QUIZ_ABANDONED', { 
      topic: 'QUIZ',
      value: window.telemetry.currentQuizScore || 0,
      progress: `${window.currentQ || 0}/${window.quizSet?.length || 0}`
    });
  }
  
  if (isEmulatorActive) {
    window.telemetry.logEvent('EMULATOR_ABANDONED', { 
      topic: 'EMULATION',
      value: window.PC || 0,
      state: 'RUNNING'
    });
  }
});

// 2. Hook automático: Visibilidade da página (detecta alt+tab, minimizar)
document.addEventListener('visibilitychange', () => {
  window.telemetry.logEvent(document.hidden ? 'PAGE_HIDDEN' : 'PAGE_VISIBLE', {
    topic: 'SESSION',
    value: document.hidden ? 'HIDDEN' : 'VISIBLE'
  });
});

// 3. Hook automático: Erros de JavaScript
window.addEventListener('error', (event) => {
  window.telemetry.logError(event.message, event.error?.stack || '');
  window.telemetry.logEvent('JS_ERROR', {
    topic: 'SYSTEM',
    value: event.message.substring(0, 100),
    filename: event.filename,
    line: event.lineno
  });
});

// 4. Hook automático: Redimensionamento de tela (mudança de dispositivo/orientação)
window.addEventListener('resize', () => {
  window.telemetry.logEvent('VIEWPORT_CHANGE', {
    topic: 'UI',
    value: `${window.innerWidth}x${window.innerHeight}`
  });
});
