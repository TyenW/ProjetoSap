/**
 * User Profile & Learning Analytics
 * Tracks user progress, time-per-question, difficulty mastery
 * Storage: localStorage (user_profile)
 */

class UserProfile {
  constructor(userId = 'anonymous') {
    this.userId = userId;
    this.profile = this._loadProfile();
  }

  /**
   * Carrega ou inicializa perfil do usuário
   * @private
   * @returns {Object}
   */
  _loadProfile() {
    try {
      const saved = localStorage.getItem('user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Falha ao carregar perfil:', e);
    }

    return {
      userId: this.userId,
      level: 1,
      totalAnswered: 0,
      totalCorrect: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessions: [],
      difficultyStats: {
        fácil: { answered: 0, correct: 0 },
        médio: { answered: 0, correct: 0 },
        difícil: { answered: 0, correct: 0 }
      },
      timings: {
        avgTimePerQuestion: 0, // ms
        fastestAnswer: Infinity,
        slowestAnswer: 0
      },
      achievements: []
    };
  }

  /**
   * Registra resposta do usuário
   * @param {string} questionText
   * @param {string} difficulty - 'fácil'|'médio'|'difícil'
   * @param {boolean} isCorrect
   * @param {number} timeMs - tempo em ms
   */
  recordAnswer(questionText, difficulty, isCorrect, timeMs) {
    this.profile.totalAnswered++;
    if (isCorrect) this.profile.totalCorrect++;

    const stats = this.profile.difficultyStats[difficulty] || this.profile.difficultyStats['fácil'];
    stats.answered++;
    if (isCorrect) stats.correct++;

    // Atualiza timings
    const allTimes = this.profile.timings;
    allTimes.fastestAnswer = Math.min(allTimes.fastestAnswer, timeMs);
    allTimes.slowestAnswer = Math.max(allTimes.slowestAnswer, timeMs);

    const totalMs = (allTimes.avgTimePerQuestion * (this.profile.totalAnswered - 1)) + timeMs;
    allTimes.avgTimePerQuestion = Math.round(totalMs / this.profile.totalAnswered);

    this.profile.updatedAt = new Date().toISOString();
    this._updateLevel();
    this._save();
  }

  /**
   * Atualiza nível baseado em progresso
   * @private
   */
  _updateLevel() {
    const accuracy = this.profile.totalAnswered > 0
      ? this.profile.totalCorrect / this.profile.totalAnswered
      : 0;

    // level 1-5 baseado em total de respostas e acurácia
    const totalWeight = this.profile.totalAnswered;
    const accuracyWeight = accuracy * 100;

    this.profile.level = Math.floor((totalWeight + accuracyWeight) / 30) + 1;
    this.profile.level = Math.min(this.profile.level, 10); // cap em level 10
  }

  /**
   * Adiciona conquista desbloqueada
   * @param {string} achievementId
   * @param {string} title
   */
  unlockAchievement(achievementId, title) {
    if (!this.profile.achievements.includes(achievementId)) {
      this.profile.achievements.push(achievementId);
      this._save();
    }
  }

  /**
   * Retorna estatísticas de aprendizagem
   * @returns {Object}
   */
  getStats() {
    const accuracy = this.profile.totalAnswered > 0
      ? (this.profile.totalCorrect / this.profile.totalAnswered * 100).toFixed(1)
      : 0;

    const difficultyBreakdown = Object.entries(this.profile.difficultyStats).reduce((acc, [diff, stats]) => {
      acc[diff] = {
        ...stats,
        accuracy: stats.answered > 0 ? (stats.correct / stats.answered * 100).toFixed(1) : 0
      };
      return acc;
    }, {});

    return {
      level: this.profile.level,
      totalAnswered: this.profile.totalAnswered,
      totalCorrect: this.profile.totalCorrect,
      accuracy: parseFloat(accuracy),
      difficultyBreakdown,
      timings: {
        avgMs: this.profile.timings.avgTimePerQuestion,
        avgSec: (this.profile.timings.avgTimePerQuestion / 1000).toFixed(1),
        fastest: this.profile.timings.fastestAnswer,
        slowest: this.profile.timings.slowestAnswer
      },
      sessionsCompleted: this.profile.sessions.length,
      achievementsUnlocked: this.profile.achievements.length
    };
  }

  /**
   * Renderiza card de perfil no DOM
   * @param {HTMLElement} container
   */
  renderProfile(container) {
    if (!container) return;

    const stats = this.getStats();
    const progressPct = Math.min((stats.totalAnswered / 100) * 100, 100);

    const html = `
      <div class="user-profile-card">
        <div class="profile-header">
          <div class="level-badge">Nível ${stats.level}</div>
          <h3>${this.profile.userId}</h3>
        </div>

        <div class="profile-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPct}%"></div>
          </div>
          <span class="progress-text">${stats.totalAnswered}/100 respondidas</span>
        </div>

        <div class="profile-grid">
          <div class="profile-stat">
            <span class="stat-label">Acurácia</span>
            <span class="stat-value">${stats.accuracy}%</span>
          </div>
          <div class="profile-stat">
            <span class="stat-label">Tempo Médio</span>
            <span class="stat-value">${stats.timings.avgSec}s</span>
          </div>
          <div class="profile-stat">
            <span class="stat-label">Sessões</span>
            <span class="stat-value">${stats.sessionsCompleted}</span>
          </div>
          <div class="profile-stat">
            <span class="stat-label">Conquistas</span>
            <span class="stat-value">${stats.achievementsUnlocked}</span>
          </div>
        </div>

        ${Object.keys(stats.difficultyBreakdown).length > 0 ? `
          <div class="difficulty-breakdown">
            <h4>Por Dificuldade:</h4>
            ${Object.entries(stats.difficultyBreakdown).map(([diff, s]) => `
              <div class="difficulty-row">
                <span class="difficulty-label">${this._capitalize(diff)}</span>
                <span class="difficulty-stats">${s.correct}/${s.answered} (${s.accuracy}%)</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Finaliza sessão e salva
   * @param {number} score
   */
  endSession(score) {
    this.profile.sessions.push({
      timestamp: new Date().toISOString(),
      score,
      answered: this.profile.totalAnswered,
      correct: this.profile.totalCorrect
    });
    // Manter apenas últimas 20 sessões
    this.profile.sessions = this.profile.sessions.slice(Math.max(0, this.profile.sessions.length - 20));
    this._save();
  }

  /**
   * Exporta perfil como JSON
   * @returns {string}
   */
  export() {
    return JSON.stringify(this.profile, null, 2);
  }

  /**
   * Reseta perfil (para testes)
   */
  reset() {
    this.profile = this._loadProfile();
    this._save();
  }

  /**
   * Salva perfil em localStorage
   * @private
   */
  _save() {
    try {
      localStorage.setItem('user_profile', JSON.stringify(this.profile));
    } catch (e) {
      console.warn('Falha ao salvar perfil:', e);
    }
  }

  /**
   * Helper: capitalize primeira letra
   * @private
   */
  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Instância global
window.userProfile = new UserProfile();
