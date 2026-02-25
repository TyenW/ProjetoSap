// As perguntas agora serão carregadas de `assets/data/questions.json`.
let allQuestions = [];

// Lista mestre de conquistas (pode ser carregada do JSON)
let masterAchievements = [];

// Fallback padrão de conquistas (usado se o JSON externo não carregar)
const DEFAULT_ACHIEVEMENTS = [
  { id: 'streak3', title: '3 Acertos Seguidos', description: 'Acerte 3 questões consecutivas', icon: '🔥', goal: { type: 'streak', target: 3 } },
  { id: 'pro', title: 'Acertou >= 80%', description: 'Mantenha precisão de 80% ou mais em uma sessão', icon: '🎯', goal: { type: 'accuracy', target: 80 } },
  { id: 'perfect', title: 'Pontuação Perfeita', description: 'Acerte 100% das perguntas de uma sessão', icon: '🌟' },
  { id: 'answered10', title: 'Aquecendo', description: 'Responda 10 perguntas', icon: '✅', goal: { type: 'answered', target: 10 } },
  { id: 'answered50', title: 'Maratonista', description: 'Responda 50 perguntas', icon: '🏃', goal: { type: 'answered', target: 50 } },
  { id: 'score20', title: 'Pontuador', description: 'Alcance 20 pontos em uma sessão', icon: '⚡', goal: { type: 'score', target: 20 } }
];

// Fallback simples de perguntas caso o arquivo externo falhe
const DEFAULT_QUESTIONS = [
  { text: 'O que significa SAP em SAP-1?', options: ['Simple As Possible', 'Systematic Arithmetic Processor', 'Standard Architecture Platform', 'Single Accumulator Processor'], answer: 0, difficulty: 'fácil' },
  { text: 'Qual registrador aponta para a próxima instrução?', options: ['IR', 'MAR', 'PC', 'A'], answer: 2, difficulty: 'fácil' },
  { text: 'Quantos estados T tem o ciclo de máquina do SAP-1?', options: ['4', '6', '8', '2'], answer: 1, difficulty: 'fácil' },
  { text: 'Qual instrução carrega um valor da RAM para o Acumulador?', options: ['OUT', 'ADD', 'HLT', 'LDA'], answer: 3, difficulty: 'médio' },
  { text: 'Qual é a função do sinal Ep?', options: ['Incrementar o PC', 'Colocar o conteúdo do PC no barramento', 'Carregar valor no PC', 'Zerar o PC'], answer: 1, difficulty: 'médio' }
];

// Inicialização rápida com fallback local (não bloqueia a UI)
allQuestions = [...DEFAULT_QUESTIONS];
masterAchievements = [...DEFAULT_ACHIEVEMENTS];

// Configurações dinâmicas
// Modo infinito: perguntas aleatórias até o jogador perder 3 vidas
let TRI_MODE = 'infinite';
let lastFocusedBeforeChartModal = null;

// Carrega dados externos (questions.json e achievements.json)
function showDataAlert(text, tone = 'warn') {
  try {
    // Prefer a dedicated message area in the quiz
    const msg = document.getElementById('message');
    if (msg) {
      msg.textContent = text;
      msg.style.color = tone === 'error' ? '#ff6b6b' : '#ffb347';
      return;
    }
    // Fallback: lightweight floating banner
    let banner = document.getElementById('quiz-data-alert');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'quiz-data-alert';
      banner.setAttribute('role', 'alert');
      banner.style.position = 'fixed';
      banner.style.top = '8px';
      banner.style.left = '50%';
      banner.style.transform = 'translateX(-50%)';
      banner.style.zIndex = 9999;
      banner.style.padding = '10px 14px';
      banner.style.borderRadius = '8px';
      banner.style.fontFamily = 'inherit';
      banner.style.fontSize = '0.9rem';
      banner.style.boxShadow = '0 2px 10px rgba(0,0,0,0.4)';
      document.body.appendChild(banner);
    }
    banner.style.background = tone === 'error' ? '#7a1f1f' : '#7a5a1f';
    banner.style.color = '#fff';
    banner.textContent = text;
    // Auto-hide after 6s
    clearTimeout(banner._timer);
    banner._timer = setTimeout(()=> banner.remove(), 6000);
  } catch (_) { /* ignore */ }
}

async function loadExternalData() {
  const withTimeout = async (url, timeoutMs = 1800) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const [qRes, aRes] = await Promise.allSettled([
    withTimeout('assets/data/questions.json'),
    withTimeout('assets/data/achievements.json')
  ]);

  if (qRes.status === 'fulfilled' && Array.isArray(qRes.value?.questions) && qRes.value.questions.length) {
    allQuestions = qRes.value.questions;
  } else if (qRes.status === 'rejected') {
    console.warn('Falha ao carregar questions.json, usando fallback.', qRes.reason);
  }

  if (aRes.status === 'fulfilled' && Array.isArray(aRes.value?.achievements) && aRes.value.achievements.length) {
    masterAchievements = aRes.value.achievements;
  } else if (aRes.status === 'rejected') {
    console.warn('Falha ao carregar achievements.json, usando fallback.', aRes.reason);
  }

  if (!allQuestions || allQuestions.length === 0) allQuestions = [...DEFAULT_QUESTIONS];
  if (!masterAchievements || masterAchievements.length === 0) masterAchievements = [...DEFAULT_ACHIEVEMENTS];
}

let lives = 3;
let currentQ = 0;
let score = 0;
let acertosSeguidos = 0;
let usedQuestions = [];
let quizSet = [];
let respostasCorretas = []; // armazena true/false para acertos
let answeredCount = 0;
let maxStreak = 0;
let questionStartTime = 0; // timestamp when question was rendered

function updateStatsUI() {
  const answeredEl = document.getElementById('answered-count');
  if (answeredEl) answeredEl.textContent = String(answeredCount);
  const scoreEl = document.getElementById('score-count');
  if (scoreEl) scoreEl.textContent = String(score);
  const accuracyEl = document.getElementById('accuracy-count');
  if (accuracyEl) {
    const accuracy = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;
    accuracyEl.textContent = `${accuracy}%`;
  }
}

// SFX do Quiz (acerto/erro) agora via <audio> no HTML controlado por audio-menu.js

function getRandomQuestion(difficulty) {
  const pool = allQuestions.filter(q => q.difficulty === difficulty && !usedQuestions.includes(q));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function selectAdaptiveQuestion() {
  let dificuldade;
  if (score < 3) dificuldade = "fácil";
  else if (score < 6) dificuldade = "médio";
  else dificuldade = "difícil";
  let next = getRandomQuestion(dificuldade);
  if (!next) {
    // fallback se acabar perguntas da dificuldade atual
    const restante = allQuestions.find(q => !usedQuestions.includes(q));
    return restante || null;
  }
  return next;
}

function selectRandomQuestion() {
  if (!allQuestions || allQuestions.length === 0) return null;
  const pool = allQuestions.filter(q => !usedQuestions.includes(q));
  if (pool.length === 0) {
    // reset para reciclar perguntas quando acabar
    usedQuestions = [];
    // escolha diretamente de allQuestions para evitar recursão
    return allQuestions[Math.floor(Math.random() * allQuestions.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

function selectByDifficulty(nextDifficulty) {
  // retorna próxima pergunta pela dificuldade exigida, se não houver, fallback
  const pool = allQuestions.filter(q => q.difficulty === nextDifficulty && !usedQuestions.includes(q));
  if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  return allQuestions.find(q => !usedQuestions.includes(q)) || null;
}

function renderQuestion() {
  if (lives === 0) return endQuiz();

  // Track time spent on this question
  questionStartTime = Date.now();

  const q = quizSet[currentQ];
  
  // TELEMETRIA: Question-level granular tracking
  if (window.telemetry && q) {
    window.telemetry.logEvent('QUESTION_STARTED', {
      topic: 'QUIZ_GRANULAR',
      value: currentQ,
      questionText: q.text.substring(0, 100),
      difficulty: q.difficulty || 'unknown',
      optionCount: q.options ? q.options.length : 0,
      currentStreak: acertosSeguidos,
      livesRemaining: lives
    });
  }
  if (!q) {
    const msg = document.getElementById('message');
    if (msg) { msg.textContent = 'Não há perguntas disponíveis no momento.'; msg.style.color = '#64ffda'; }
    return;
  }

  const questionEl = document.getElementById("question");
  if (questionEl) questionEl.innerText = `[${(q.difficulty||'').toUpperCase()}] ${q.text}`;
  const currEl = document.getElementById("current-q");
  if (currEl) currEl.innerText = currentQ + 1;
  const livesEl = document.getElementById("lives");
  if (livesEl) livesEl.innerText = "❤️".repeat(lives);
  updateStatsUI();

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(idx);
    // touch-friendly
    btn.addEventListener('touchstart', ()=> btn.classList.add('pressed'));
    btn.addEventListener('touchend', ()=> btn.classList.remove('pressed'));
    optionsDiv.appendChild(btn);
  });

  document.getElementById("message").textContent = "";
}

function checkAnswer(selected) {
  const q = quizSet[currentQ];
  const correct = selected === q.answer;
  const messageDiv = document.getElementById("message");
  const optionsDiv = document.getElementById('options');
  const buttons = Array.from(optionsDiv.querySelectorAll('button'));
  const clickedBtn = buttons[selected];
  const timeMs = Date.now() - questionStartTime; // time spent on this question
  
  // desabilita todos os botões ao responder
  buttons.forEach(b => b.disabled = true);

  if (correct) {
    score++;
    acertosSeguidos++;
    if (acertosSeguidos > maxStreak) maxStreak = acertosSeguidos;
    messageDiv.textContent = "Correto!";
    messageDiv.style.color = "green";
    respostasCorretas.push(true);
    if (clickedBtn) { clickedBtn.classList.add('correct'); }
  try { const sfx = document.getElementById('sfx-correct'); if (sfx) { sfx.currentTime = 0; sfx.play().catch(() => {}); } } catch(_) {}
  } else {
    lives--;
    acertosSeguidos = 0;
    messageDiv.textContent = "Errado!";
    messageDiv.style.color = "red";
    respostasCorretas.push(false);
    // Registra erro na heatmap
    if (window.quizAnalytics) {
      window.quizAnalytics.recordError(q.text, currentQ);
    }
  if (clickedBtn) { clickedBtn.classList.add('wrong'); }
  try { const sfxw = document.getElementById('sfx-wrong'); if (sfxw) { sfxw.currentTime = 0; sfxw.play().catch(() => {}); } } catch(_) {}
    // anima hearts
    const hearts = document.getElementById('lives');
    hearts.classList.add('remove');
    setTimeout(()=> hearts.classList.remove('remove'), 350);
  }

  // TELEMETRIA: Question answered event
  if (window.telemetry) {
    window.telemetry.logEvent('QUESTION_ANSWERED', {
      topic: 'QUIZ_GRANULAR',
      value: correct ? 'CORRECT' : 'INCORRECT',
      responseTime: timeMs,
      selectedAnswer: selected,
      correctAnswer: q.answer,
      questionId: currentQ,
      difficulty: q.difficulty || 'unknown',
      livesAfter: lives,
      streakAfter: acertosSeguidos
    });
  }
  
  // TELEMETRIA: Post-hint effectiveness check
  if (window.hintGivenAt && window.hintQuestionId === currentQ && window.telemetry) {
    window.telemetry.logEvent('HINT_EFFECTIVENESS', {
      topic: 'SCAFFOLDING_ANALYSIS',
      value: correct ? 'SUCCESS_AFTER_HINT' : 'FAILED_AFTER_HINT',
      hintLevel: window.hintLevel || 0,
      timeAfterHint: Date.now() - window.hintGivenAt,
      questionId: currentQ,
      hintTopic: window.hintTopic || 'unknown'
    });
    // Reset hint tracking
    window.hintGivenAt = null;
    window.hintQuestionId = null;
    window.hintLevel = null;
    window.hintTopic = null;
  }

  // Registra resposta no perfil do usuário
  if (window.userProfile) {
    window.userProfile.recordAnswer(q.text, q.difficulty, correct, timeMs);
  }

  document.getElementById("lives").innerText = "❤️".repeat(lives);
  answeredCount++;
  updateStatsUI();
  // atualizar progresso de conquistas em tempo real
  renderAchievementsList();

  currentQ++;

  setTimeout(() => {
    if (lives <= 0) {
      endQuiz();
    } else {
      // Sempre pergunta aleatória não usada (modo infinito)
      const nextQ = selectRandomQuestion();
      if (!nextQ) {
        endQuiz();
        return;
      }
      quizSet.push(nextQ);
      usedQuestions.push(nextQ);
      // limpar classes de feedback dos botões antes da próxima pergunta
      buttons.forEach(b=>{ b.classList.remove('correct','wrong','pressed'); });
      renderQuestion();
    }
  }, 1500);
}

function endQuiz() {
  document.getElementById("options").innerHTML = "";
  document.getElementById("restartBtn").style.display = "block";

  // HOOK AUTOMÁTICO: Envio silencioso de dados do quiz finalizado
  const quizResult = {
    finalScore: score,
    questionsAnswered: answeredCount,
    accuracy: answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0,
    maxStreak: maxStreak,
    hintsUsed: window.telemetry?.totalHintsUsed || 0,
    gameOverReason: lives === 0 ? 'NO_LIVES' : 'COMPLETED',
    duration: Date.now() - (window.quizStartTime || Date.now())
  };

  if (window.telemetry) {
    window.telemetry.logEvent('QUIZ_FINISHED', {
      topic: 'QUIZ',
      value: score,
      ...quizResult
    });
  }

  if (lives === 0) {
    document.getElementById("question").innerText = "☠️ GAME OVER!";
    document.getElementById("message").innerHTML = `<div class="game-over">Você perdeu todas as vidas! Acertou ${score} perguntas.</div>`;
  } else {
    document.getElementById("question").innerText = "🎉 PARABÉNS!";
    document.getElementById("message").innerHTML = `<div class="win-message">Você completou o quiz! Pontuação: ${score} pts</div>`;
  }

  // Finaliza analytics e renderiza relatório
  if (window.quizAnalytics) {
    const report = window.quizAnalytics.finishSession(answeredCount, score);
    const reportContainer = document.getElementById('analytics-report');
    if (reportContainer) {
      window.quizAnalytics.renderReport(report, reportContainer);
    }
    // Log recomendações de estudo
    const studySuggestions = window.quizAnalytics.generateStudyRecommendations(report.weakTopics);
    console.log('Sugestões de estudo:', studySuggestions);
  }

  // Finaliza sessão no perfil do usuário
  if (window.userProfile) {
    window.userProfile.endSession(score);
    const profileContainer = document.getElementById('profile-card');
    if (profileContainer) {
      window.userProfile.renderProfile(profileContainer);
    }
  }

  renderChart();
  // gravar cookies com resumo rápido
  try { setCookie('sap_last_score', score, 7); setCookie('sap_last_date', new Date().toISOString(), 7); } catch(e){}

}

function startQuiz() {
  lives = 3;
  currentQ = 0;
  score = 0;
  acertosSeguidos = 0;
  usedQuestions = [];
  
  // HOOK AUTOMÁTICO: Captura início do quiz
  window.quizStartTime = Date.now();
  if (window.telemetry) {
    window.telemetry.currentQuizTopic = document.title || 'SAP-1 Quiz';
    window.telemetry.currentQuizScore = 0;
    window.telemetry.totalHintsUsed = 0;
    
    window.telemetry.logEvent('QUIZ_STARTED', {
      topic: 'QUIZ',
      value: 'START',
      difficulty: TRI_MODE || 'unknown',
      questionsAvailable: allQuestions?.length || 0
    });
  }
  quizSet = [];
  respostasCorretas = [];
  answeredCount = 0;
  maxStreak = 0;

  // Reset analytics para nova sessão
  if (window.quizAnalytics) {
    window.quizAnalytics.reset();
  }

  document.getElementById("message").innerHTML = "";
  document.getElementById("restartBtn").style.display = "none";

  // Modo infinito: pegar primeira pergunta aleatória
  const firstQ = selectRandomQuestion();
  if (firstQ) { quizSet.push(firstQ); usedQuestions.push(firstQ); }
  else {
    const msg = document.getElementById('message');
    if (msg) { msg.textContent = 'Falha ao carregar perguntas. Verifique o arquivo questions.json.'; msg.style.color = 'orange'; }
  }

  renderQuestion();
  updateStatsUI();
}

function renderChart() {
  const modal = document.getElementById("chartModal");
  lastFocusedBeforeChartModal = (document.activeElement instanceof HTMLElement)
    ? document.activeElement
    : null;
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
  modal.removeAttribute("inert");
  const closeBtn = modal.querySelector('.close-btn');
  if (closeBtn) closeBtn.focus();

  const ctx = document.getElementById("performanceChartModal").getContext("2d");

  const stats = { fácil: { total: 0, acertos: 0 }, médio: { total: 0, acertos: 0 }, difícil: { total: 0, acertos: 0 } };

  quizSet.forEach((q, i) => {
    stats[q.difficulty].total++;
    if (respostasCorretas[i]) stats[q.difficulty].acertos++;
  });

  const data = {
    labels: ["Fácil", "Médio", "Difícil"],
    datasets: [{
      label: 'Acertos',
      data: [
        stats.fácil.acertos,
        stats.médio.acertos,
        stats.difícil.acertos
      ],
      backgroundColor: ['#4caf50', '#ff9800', '#f44336']
    }, {
      label: 'Total',
      data: [
        stats.fácil.total,
        stats.médio.total,
        stats.difícil.total
      ],
      backgroundColor: ['#a5d6a7', '#ffcc80', '#ef9a9a']
    }]
  };

  if (window.performanceChartInstance) {
    window.performanceChartInstance.destroy();
  }

  window.performanceChartInstance = new Chart(ctx, {
    type: 'bar',
    data: data,
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, stepSize: 1 }
      }
    }
  });
}

function closeChart() {
  const modal = document.getElementById("chartModal");

  // Evita aria-hidden em ancestral com foco ativo
  if (modal.contains(document.activeElement) && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("inert", "");

  if (lastFocusedBeforeChartModal && document.contains(lastFocusedBeforeChartModal)) {
    lastFocusedBeforeChartModal.focus();
  }
}

function exportResults(format = 'txt') {
  const stats = { fácil: { total: 0, acertos: 0 }, médio: { total: 0, acertos: 0 }, difícil: { total: 0, acertos: 0 } };
  quizSet.forEach((q, i) => {
    stats[q.difficulty].total++;
    if (respostasCorretas[i]) stats[q.difficulty].acertos++;
  });

  if (format === 'json') {
    const payload = {
      data: new Date().toISOString(),
      score,
      answered: answeredCount,
      accuracy: answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0,
      byDifficulty: stats
    };
    return downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }), 'estatisticas_sap1.json');
  }

  if (format === 'csv') {
    const rows = [
      'nivel,acertos,total,precisao',
      ...Object.entries(stats).map(([nivel, s]) => `${nivel},${s.acertos},${s.total},${((s.acertos / (s.total || 1)) * 100).toFixed(1)}%`),
      `total,${score},${answeredCount},${answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0}%`
    ];
    return downloadBlob(new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' }), 'estatisticas_sap1.csv');
  }

  return exportarEstatisticas();
}

function exportarEstatisticas() {
  const stats = { fácil: { total: 0, acertos: 0 }, médio: { total: 0, acertos: 0 }, difícil: { total: 0, acertos: 0 } };

  quizSet.forEach((q, i) => {
    stats[q.difficulty].total++;
    if (respostasCorretas[i]) stats[q.difficulty].acertos++;
  });

  const linhas = [
    `=== Estatísticas do Quiz SAP-1 ===`,
    `Data: ${new Date().toLocaleString()}`,
    ``,
    `Pontuação total: ${score}/${quizSet.length}`,
    ``,
    `Por nível de dificuldade:`
  ];

  for (const nivel in stats) {
    const { acertos, total } = stats[nivel];
    const perc = ((acertos / (total || 1)) * 100).toFixed(1);
    linhas.push(`${nivel.toUpperCase()}: ${acertos}/${total} acertos (${perc}%)`);
  }

  const blob = new Blob([linhas.join('\n')], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "estatisticas_sap1.txt";
  link.click();
}

// Som e mute: controlado globalmente pelo audio-menu.js

// --- Funcionalidades: conquistas e export em múltiplos formatos (sem leaderboard) ---

// Achievements simples
const ACHIEVEMENTS_KEY = 'sap_quiz_achievements';
let _storageWarned = false;

function lsGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : v;
  } catch (e) {
    if (!_storageWarned) { showDataAlert('Armazenamento desativado pelo navegador. Progresso pode não ser salvo.', 'warn'); _storageWarned = true; }
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (!_storageWarned) { showDataAlert('Armazenamento desativado pelo navegador. Progresso pode não ser salvo.', 'warn'); _storageWarned = true; }
    return false;
  }
}

// Leaderboard removido
function loadAchievements() {
  try {
    return JSON.parse(lsGet(ACHIEVEMENTS_KEY, '[]'));
  } catch (_) { return []; }
}

// Cookie utilities (simples JSON wrapper)
function setCookie(name, value, days) {
  try {
    const d = new Date(); d.setTime(d.getTime() + (days*24*60*60*1000));
    const expires = "expires="+ d.toUTCString();
    const v = encodeURIComponent(JSON.stringify(value));
    document.cookie = `${name}=${v}; ${expires}; path=/`;
  } catch(e) { console.warn('setCookie falhou', e); }
}

function getCookie(name) {
  try {
    const cookies = document.cookie.split(';').map(c=>c.trim());
    for (const c of cookies) {
      if (c.startsWith(name + '=')) {
        const v = c.substring(name.length+1);
        return JSON.parse(decodeURIComponent(v));
      }
    }
  } catch(e) { /* ignore */ }
  return null;
}

function saveAchievement(id, title) {
  const unlocked = loadAchievements();
  if (!unlocked.find(a => a.id === id)) {
    unlocked.push({ id, title, date: new Date().toISOString() });
    lsSet(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
    try { setCookie(ACHIEVEMENTS_KEY, unlocked, 30); } catch(e){}
    showAchievementToast(title);
  }
}

function showAchievementToast(title) {
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.textContent = `🏆 Conquista desbloqueada: ${title}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add('visible'); }, 50);
  setTimeout(() => { toast.classList.remove('visible'); setTimeout(()=>toast.remove(),400); }, 3500);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

// Tutorial interativo simples
function startTutorial() {
  const overlay = document.getElementById('tutorialOverlay');
  if (!overlay) return;
  overlay.style.display = 'block';
  overlay.classList.add('visible');
}

function closeTutorial() {
  const overlay = document.getElementById('tutorialOverlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  setTimeout(()=> overlay.style.display = 'none', 300);
}

// Touch: garantir que botões de opção suportem touchstart para resposta mais rápida
function attachTouchHandlers() {
  const optionsDiv = document.getElementById('options');
  if (!optionsDiv) return;
  optionsDiv.addEventListener('touchstart', (e) => {
    const btn = e.target.closest('button');
    if (btn) btn.classList.add('pressed');
  }, { passive: true });
  optionsDiv.addEventListener('touchend', (e) => {
    const btn = e.target.closest('button');
    if (btn) btn.classList.remove('pressed');
  });
}

// Ao terminar o quiz, salvamos leaderboard e conquistas
function handleEndQuizSave() {
  // Achievements: várias condições
  if (score === quizSet.length) saveAchievement('perfect', 'Pontuação Perfeita');
  if (score >= Math.ceil(quizSet.length * 0.8)) saveAchievement('pro', 'Acertou >= 80%');
  if (acertosSeguidos >= 3) saveAchievement('streak3', '3 Acertos Seguidos');
  // Sem leaderboard: apenas registra as conquistas
}

function renderAchievementsList() {
  const container = document.getElementById('achievements');
  if (!container) return;
  const unlocked = loadAchievements();
  const stats = computeStats();
  if (masterAchievements && masterAchievements.length) {
    const total = masterAchievements.length;
    const unlockedCount = unlocked.length;
    const cards = masterAchievements.map(m => {
      const found = unlocked.find(u => u.id === m.id);
      const { pct, text } = computeAchievementProgress(m, stats, found);
      const cls = found ? 'unlocked' : 'locked';
      const icon = (m.icon) ? m.icon : (found ? '🏆' : '🔒');
      return `
        <div class="ach-card ${cls}" title="${m.description || ''}">
          <div class="ach-head">
            <span class="ach-icon">${icon}</span>
            <span class="ach-title">${m.title}</span>
          </div>
          <div class="ach-desc">${m.description || ''}</div>
          <div class="ach-progress"><div class="ach-progress-fill" style="width:${pct}%;"></div></div>
          <div class="ach-progress-text">${pct}% • ${text}</div>
        </div>`;
    }).join('');
  container.innerHTML = `<h3>🏆 Conquistas (${unlockedCount}/${total})</h3><div class="ach-grid">${cards}</div>`;
  } else {
    container.innerHTML = '<h3>🏆 Conquistas</h3><div class="empty-ach">Carregue achievements.json para ver a lista completa</div>';
  }
}

function computeStats() {
  const accuracy = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;
  return { score, answeredCount, maxStreak, accuracy, lives };
}

// Suporta progresso por id conhecido ou por m.goal { type, target }
function computeAchievementProgress(m, stats, isUnlocked) {
  // unlocked: 100%
  if (isUnlocked) return { pct: 100, text: 'Conquistada' };
  const goal = m.goal || {};
  const type = goal.type || m.id; // fallback para id conhecidos
  const target = goal.target || ((m.id === 'streak3') ? 3 : (m.id === 'pro' ? 80 : 100));
  let pct = 0;
  let text = '';
  switch (type) {
    case 'streak':
    case 'streak3':
      pct = Math.min(100, Math.round((stats.maxStreak / target) * 100));
      text = `Streak: ${stats.maxStreak}/${target}`;
      break;
    case 'accuracy':
    case 'pro':
      pct = Math.min(100, Math.round((stats.accuracy / target) * 100));
      text = `Precisão: ${stats.accuracy}% (meta ${target}%)`;
      break;
    case 'perfect':
      pct = stats.accuracy === 100 && stats.answeredCount > 0 ? 100 : Math.min(99, stats.accuracy);
      text = stats.accuracy === 100 && stats.answeredCount > 0 ? 'Perfeito!' : 'Acerte 100% em uma sessão';
      break;
    case 'answered':
      pct = Math.min(100, Math.round((stats.answeredCount / (target || 10)) * 100));
      text = `Responda ${target} perguntas (${stats.answeredCount})`;
      break;
    case 'score':
      pct = Math.min(100, Math.round((stats.score / (target || 10)) * 100));
      text = `Pontuação: ${stats.score}/${target}`;
      break;
    default:
      // fallback genérico
      pct = 0;
      text = 'Progrida jogando';
  }
  return { pct, text };
}

// Atualizar endQuiz para chamar salvamentos extras
const originalEndQuiz = endQuiz;
endQuiz = function() {
  originalEndQuiz();
  handleEndQuizSave();
};

// Inicialização adicional (first paint rápido)
attachTouchHandlers();
renderAchievementsList();
startQuiz();

// Hidratação de dados externos em segundo plano
loadExternalData().then(() => {
  renderAchievementsList();
}).catch(err => {
  console.warn('Erro na hidratação de dados externos', err);
});

// UI do placar removida (sem modal)