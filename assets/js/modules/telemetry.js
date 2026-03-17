/**
 * Enhanced Telemetry Module
 * Automatically tracks all student interactions with invisible data collection
 * Sends data to Google Apps Script for academic research analysis
 * Completely anonymous, GDPR compliant, no personal identifiers
 */

// Configure your Google Apps Script URL here
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxwTLy1F6IE5tOtcKgHtkGyz44JebINPkWIHf1fz2aBKp741lYazuhjvZJXIm2AzHgHWQ/exec';
const TELEMETRY_KEYS = {
  studentId: 'bitlab_student_id',
  installationId: 'bitlab_installation_id',
  nickname: 'bitlab_user_nickname',
  sessions: 'telemetry_sessions',
  sendQueue: 'telemetry_send_queue',
  sentCache: 'telemetry_sent_event_ids',
  sequence: 'telemetry_event_sequence'
};

const MAX_QUEUE_SIZE = 1000;
const MAX_SENT_CACHE_SIZE = 3000;

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
    this.sendQueue = this._loadSendQueue();
    this.pendingEvents = [];
    this.sentEventIds = this._loadSentEventIds();
    Object.defineProperty(this, 'offlineQueue', {
      get: () => this.sendQueue
    });
    this.lastSendTime = 0;
    this.sendCooldown = 100; // Rate limiting: min 100ms entre envios
    this.maxRetries = 3;
    this.remoteBlockedUntil = 0; // pausa envio remoto em caso de auth/config inválida
    this.hasWarnedRemoteAuth = false;
    this.isOnline = navigator.onLine;
    this.userJourney = []; // Tracking de páginas visitadas
    this.eventSequence = this._loadEventSequence();
    this.flushInProgress = false;
    
    // Detectar mudanças de conectividade
    window.addEventListener('online', () => this._handleOnlineStatus(true));
    window.addEventListener('offline', () => this._handleOnlineStatus(false));

    this._recoverPendingQueue();
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
    if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
      metadata = {};
    }
    
    // RATE LIMITING é aplicado no flush da fila para não perder eventos
    const now = Date.now();

    const normalizedEventType = String(eventType).trim().toUpperCase();
    const sequence = this._nextEventSequence();
    const eventId = this._generateEventId(normalizedEventType, now, sequence);
    if (this.sentEventIds.has(eventId)) {
      return;
    }

    const event = {
      eventId,
      type: eventType,
      timestamp: now,
      elapsed: now - this.sessionStart,
      sequence,
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
      eventId,
      sequence,
      topic: metadata.topic || 'GENERAL',
      metricType: normalizedEventType,
      value: metadata.value || 1,
      timestamp: new Date(now).toISOString(),
      sessionId: this.sessionId,
      studentId: this._getStudentId(),
      installationId: this._getInstallationId(),
      nickname: this._getNickname(),
      userJourney: JSON.stringify(this.userJourney.slice(-5)), // Últimas 5 páginas
      additionalData: JSON.stringify(metadata)
    };

    payload.checksum = this._buildChecksum(payload);

    if (metadata.isExit) {
      const exitPayload = { ...payload, isExit: true };
      this._enqueuePayload(exitPayload);
      this._sendToGoogleSheets(exitPayload).catch(() => {});
      return;
    }
    
    this._enqueuePayload(payload);
    this._flushSendQueue();

    // Limpar se exceder limite
    if (this.events.length > this.maxEventsPerSession) {
      this.events = this.events.slice(-this.maxEventsPerSession);
    }

    // Salvar periodicamente (a cada 10 eventos)
    if (this.events.length % 10 === 0) {
      this._saveSession();
    }
  }

  setNickname(nickname) {
    const sanitized = String(nickname || '').trim().slice(0, 60);
    if (!sanitized) return null;
    localStorage.setItem(TELEMETRY_KEYS.nickname, sanitized);
    return sanitized;
  }

  /**
   * Envia dados automaticamente para Google Apps Script com retry e offline support
   * @private
   */
  async _sendToGoogleSheets(data, retryCount = 0) {
    // Validação de URL configurada
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('SEU_')) {
      if (retryCount === 0) console.warn('[Telemetria] URL do Google Apps Script não configurada');
      return false;
    }

    // Evita flood quando endpoint está com auth/configuração inválida
    if (Date.now() < this.remoteBlockedUntil) {
      return false;
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
        return false;
      }

      // Se é evento de saída/fechamento, usar sendBeacon (mais confiável)
      if (data.metricType === 'PAGE_EXIT' || data.isExit) {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
          formData.append(key, String(payload[key]));
        });
        navigator.sendBeacon(GOOGLE_SCRIPT_URL, formData);
        this.lastSendTime = Date.now();
        return true;
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
      return true;
      
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
        return false;
      }

      // RETRY MECHANISM para produção
      if (retryCount < this.maxRetries && !data.isExit) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Backoff exponencial
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this._sendToGoogleSheets(data, retryCount + 1);
      }
      
      // Log apenas em desenvolvimento
      if (window.location.hostname === 'localhost') {
        console.warn('[Telemetria] Erro:', e.message, 'Retry:', retryCount);
      }
      return false;
    }
  }

  /**
   * Gera ou recupera ID anônimo do estudante
   * @private
   */
  _getStudentId() {
    let studentId = localStorage.getItem(TELEMETRY_KEYS.studentId);
    if (!studentId) {
      studentId = 'student_' + Math.random().toString(36).substr(2, 12);
      localStorage.setItem(TELEMETRY_KEYS.studentId, studentId);
    }
    return studentId;
  }

  _getInstallationId() {
    let installationId = localStorage.getItem(TELEMETRY_KEYS.installationId);
    if (!installationId) {
      installationId = 'install_' + Math.random().toString(36).substr(2, 16);
      localStorage.setItem(TELEMETRY_KEYS.installationId, installationId);
    }
    return installationId;
  }

  _getNickname() {
    const params = new URLSearchParams(window.location.search);
    const nicknameParam = params.get('nickname') || params.get('apelido');
    if (nicknameParam) {
      this.setNickname(nicknameParam);
    }
    return localStorage.getItem(TELEMETRY_KEYS.nickname) || '';
  }

  /**
   * Detecta se é estudante repetente (já usou o sistema antes)
   * @private
   */
  _getIsRepeatingStudent() {
    const hasHistory = localStorage.getItem(TELEMETRY_KEYS.sessions);
    return hasHistory ? 'true' : 'false';
  }

  /**
   * Gerencia mudanças de conectividade
   * @private
   */
  _handleOnlineStatus(isOnline) {
    this.isOnline = isOnline;
    
    if (isOnline && this.sendQueue.length > 0) {
      // Processar queue offline
      console.log(`[Telemetria] Reconectado! Enviando ${this.sendQueue.length} eventos pendentes`);
      this._flushSendQueue();
    }
    
    // Log do status
    this.logEvent('CONNECTIVITY_CHANGE', {
      topic: 'SYSTEM',
      value: isOnline ? 'ONLINE' : 'OFFLINE',
      queueSize: this.sendQueue.length
    });
  }

  /**
   * Processa queue com debounce
   * @private
   */
  _processQueueDelayed() {
    clearTimeout(this._queueTimer);
    this._queueTimer = setTimeout(() => {
      if (this.pendingEvents.length > 0) {
        const event = this.pendingEvents.shift();
        this.logEvent(event.eventType, event.metadata);
      }
    }, this.sendCooldown * 2);
  }

  _enqueuePayload(payload) {
    if (!payload || !payload.eventId) return;
    if (this.sentEventIds.has(payload.eventId)) return;
    if (this.sendQueue.some(item => item.eventId === payload.eventId)) return;

    this.sendQueue.push(payload);
    if (this.sendQueue.length > MAX_QUEUE_SIZE) {
      this.sendQueue = this.sendQueue.slice(-MAX_QUEUE_SIZE);
    }
    this._persistSendQueue();
  }

  async _flushSendQueue() {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('SEU_')) return;
    if (this.flushInProgress || !this.isOnline || this.sendQueue.length === 0) return;
    this.flushInProgress = true;

    try {
      while (this.sendQueue.length > 0 && this.isOnline) {
        const payload = this.sendQueue[0];
        if (this.sentEventIds.has(payload.eventId)) {
          this.sendQueue.shift();
          continue;
        }

        const elapsed = Date.now() - this.lastSendTime;
        if (elapsed < this.sendCooldown) {
          await new Promise(resolve => setTimeout(resolve, this.sendCooldown - elapsed));
        }

        const sent = await this._sendToGoogleSheets(payload);
        if (!sent) {
          this._persistSendQueue();
          break;
        }

        this._markEventAsSent(payload.eventId);
        this.sendQueue.shift();
        this._persistSendQueue();
      }
    } finally {
      this.flushInProgress = false;
      if (this.sendQueue.length > 0 && this.isOnline) {
        setTimeout(() => this._flushSendQueue(), 1200);
      }
    }
  }

  _recoverPendingQueue() {
    if (this.sendQueue.length > 0 && this.isOnline) {
      setTimeout(() => this._flushSendQueue(), 500);
    }
  }

  _persistSendQueue() {
    try {
      localStorage.setItem(TELEMETRY_KEYS.sendQueue, JSON.stringify(this.sendQueue));
    } catch (e) {
      console.warn('[Telemetria] Falha ao persistir fila de envio:', e);
    }
  }

  _loadSendQueue() {
    try {
      const queue = JSON.parse(localStorage.getItem(TELEMETRY_KEYS.sendQueue)) || [];
      return Array.isArray(queue) ? queue : [];
    } catch {
      return [];
    }
  }

  _loadSentEventIds() {
    try {
      const arr = JSON.parse(localStorage.getItem(TELEMETRY_KEYS.sentCache)) || [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  _persistSentEventIds() {
    try {
      const compacted = Array.from(this.sentEventIds).slice(-MAX_SENT_CACHE_SIZE);
      localStorage.setItem(TELEMETRY_KEYS.sentCache, JSON.stringify(compacted));
    } catch (e) {
      console.warn('[Telemetria] Falha ao persistir cache de dedupe:', e);
    }
  }

  _markEventAsSent(eventId) {
    if (!eventId) return;
    this.sentEventIds.add(eventId);
    if (this.sentEventIds.size > MAX_SENT_CACHE_SIZE) {
      const trimmed = Array.from(this.sentEventIds).slice(-MAX_SENT_CACHE_SIZE);
      this.sentEventIds = new Set(trimmed);
    }
    this._persistSentEventIds();
  }

  _loadEventSequence() {
    const raw = Number(localStorage.getItem(TELEMETRY_KEYS.sequence) || '0');
    return Number.isFinite(raw) && raw >= 0 ? raw : 0;
  }

  _nextEventSequence() {
    this.eventSequence += 1;
    localStorage.setItem(TELEMETRY_KEYS.sequence, String(this.eventSequence));
    return this.eventSequence;
  }

  _generateEventId(metricType, timestampMs, sequence) {
    const base = [
      this.sessionId,
      this._getStudentId(),
      metricType,
      String(timestampMs),
      String(sequence)
    ].join('|');
    return `evt_${this._simpleHash(base)}`;
  }

  _buildChecksum(payload) {
    const canonical = JSON.stringify({
      eventId: payload.eventId,
      timestamp: payload.timestamp,
      sessionId: payload.sessionId,
      studentId: payload.studentId,
      metricType: payload.metricType,
      topic: payload.topic,
      value: payload.value,
      additionalData: payload.additionalData,
      sequence: payload.sequence,
      installationId: payload.installationId,
      nickname: payload.nickname
    });
    return this._simpleHash(canonical);
  }

  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
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

    localStorage.setItem(TELEMETRY_KEYS.sessions, JSON.stringify(sessions));
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
      localStorage.setItem(TELEMETRY_KEYS.sessions, JSON.stringify(sessions));
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
      return JSON.parse(localStorage.getItem(TELEMETRY_KEYS.sessions)) || [];
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
    this.sendQueue = [];
    this.pendingEvents = [];
    this.sentEventIds = new Set();
    localStorage.removeItem(TELEMETRY_KEYS.sessions);
    localStorage.removeItem(TELEMETRY_KEYS.sendQueue);
    localStorage.removeItem(TELEMETRY_KEYS.sentCache);
    localStorage.removeItem(TELEMETRY_KEYS.sequence);
  }
}

// Instância global com inicialização robusta
window.telemetry = new LocalTelemetry();
window.setBitlabNickname = function setBitlabNickname(nickname) {
  return window.telemetry.setNickname(nickname);
};

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
