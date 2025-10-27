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

// Configurações dinâmicas
// Modo infinito: perguntas aleatórias até o jogador perder 3 vidas
let TRI_MODE = 'infinite';

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
  try {
    const qResp = await fetch('assets/data/questions.json', { cache: 'no-store' });
    if (qResp.ok) {
      const qj = await qResp.json();
      if (Array.isArray(qj.questions)) allQuestions = qj.questions;
      else console.warn('questions.json não possui "questions" como array.');
    } else {
      console.warn('Falha HTTP ao buscar questions.json:', qResp.status, qResp.statusText);
      showDataAlert(`Não foi possível carregar perguntas (HTTP ${qResp.status}). Usando perguntas padrão.`, 'warn');
    }
  } catch (e) {
    console.warn('Falha ao carregar questions.json, usando fallback interno se existir', e);
    showDataAlert('Erro ao carregar questions.json (CORS/offline/JSON inválido). Usando perguntas padrão.', 'warn');
  }
  if (!allQuestions || allQuestions.length === 0) {
    console.warn('Usando perguntas padrão (fallback), verifique se assets/data/questions.json está acessível via HTTP e com JSON válido.');
    allQuestions = DEFAULT_QUESTIONS;
  }

  try {
    const aResp = await fetch('assets/data/achievements.json', { cache: 'no-store' });
    if (aResp.ok) {
      const aj = await aResp.json();
      if (Array.isArray(aj.achievements)) masterAchievements = aj.achievements;
      else console.warn('achievements.json não possui "achievements" como array, usando fallback.');
    } else {
      console.warn('Falha HTTP ao buscar achievements.json:', aResp.status, aResp.statusText);
      showDataAlert(`Não foi possível carregar conquistas (HTTP ${aResp.status}). Usando padrão.`, 'warn');
    }
  } catch (e) {
    console.warn('Falha ao carregar achievements.json', e);
    showDataAlert('Erro ao carregar achievements.json (CORS/offline/JSON inválido). Usando conquistas padrão.', 'warn');
  }

  if (!masterAchievements || masterAchievements.length === 0) {
    console.warn('Usando conquistas padrão (fallback), verifique se assets/data/achievements.json está acessível via HTTP e com JSON válido.');
    masterAchievements = DEFAULT_ACHIEVEMENTS;
  }
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

  const q = quizSet[currentQ];
  if (!q) {
    const msg = document.getElementById('message');
    if (msg) { msg.textContent = 'Não há perguntas disponíveis no momento.'; msg.style.color = '#ffd700'; }
    return;
  }

  const questionEl = document.getElementById("question");
  if (questionEl) questionEl.innerText = `[${(q.difficulty||'').toUpperCase()}] ${q.text}`;
  const currEl = document.getElementById("current-q");
  if (currEl) currEl.innerText = currentQ + 1;
  const livesEl = document.getElementById("lives");
  if (livesEl) livesEl.innerText = "❤️".repeat(lives);

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
  } else {
    lives--;
    acertosSeguidos = 0;
    messageDiv.textContent = "Errado!";
    messageDiv.style.color = "red";
    respostasCorretas.push(false);
    if (clickedBtn) { clickedBtn.classList.add('wrong'); }
    // anima hearts
    const hearts = document.getElementById('lives');
    hearts.classList.add('remove');
    setTimeout(()=> hearts.classList.remove('remove'), 350);
  }

  document.getElementById("lives").innerText = "❤️".repeat(lives);
  answeredCount++;
  const ansEl = document.getElementById('answered-count');
  if (ansEl) ansEl.textContent = answeredCount;
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

  if (lives === 0) {
    document.getElementById("question").innerText = "☠️ GAME OVER!";
    document.getElementById("message").innerHTML = `<div class="game-over">Você perdeu todas as vidas! Acertou ${score} perguntas.</div>`;
  } else {
    document.getElementById("question").innerText = "🎉 PARABÉNS!";
    document.getElementById("message").innerHTML = `<div class="win-message">Você completou o quiz! Pontuação: ${score} pts</div>`;
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
  quizSet = [];
  respostasCorretas = [];
  answeredCount = 0;
  maxStreak = 0;

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
}

function renderChart() {
  const modal = document.getElementById("chartModal");
  modal.style.display = "block";

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
  document.getElementById("chartModal").style.display = "none";
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

// Som e mute
const music = document.getElementById("bg-music");
const toggle = document.getElementById("muteToggle");
toggle.onclick = () => {
  music.muted = !music.muted;
  toggle.textContent = music.muted ? "🔇" : "🔊";
};

// --- Novas funcionalidades: achievements, leaderboard e export em múltiplos formatos ---

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

// Leaderboard top-3 salvo em localStorage
const LEADERBOARD_KEY = 'sap_quiz_leaderboard';
function loadLeaderboard() {
  try {
    const fromCookie = getCookie(LEADERBOARD_KEY);
    if (fromCookie && Array.isArray(fromCookie)) return fromCookie;
    return JSON.parse(lsGet(LEADERBOARD_KEY, '[]'));
  }
  catch (e) { return []; }
}

// Preenche o placar com exemplos se estiver vazio (apenas primeira carga)
function seedLeaderboardIfEmpty() {
  const existing = loadLeaderboard();
  if (existing && existing.length > 0) return;
  const now = Date.now();
  const base = [
    { name: 'Ana', score: 28 },
    { name: 'Bruno', score: 24 },
    { name: 'Carla', score: 22 },
    { name: 'Diego', score: 19 },
    { name: 'Elisa', score: 16 },
    { name: 'Felipe', score: 14 },
  ];
  const seeded = base.map((e, i) => ({ ...e, date: new Date(now - (i+1)*24*60*60*1000).toISOString() }));
  // ordenar e manter top-10 por consistência
  seeded.sort((a,b)=> b.score - a.score || new Date(a.date) - new Date(b.date));
  const top = seeded.slice(0,10);
  lsSet(LEADERBOARD_KEY, JSON.stringify(top));
  try { setCookie(LEADERBOARD_KEY, top, 30); } catch(e){}
}

function saveToLeaderboard(name, score) {
  const lb = loadLeaderboard();
  lb.push({ name: name || '---', score, date: new Date().toISOString() });
  lb.sort((a,b)=> b.score - a.score || new Date(a.date) - new Date(b.date));
  const top = lb.slice(0,10); // manter top-10
  lsSet(LEADERBOARD_KEY, JSON.stringify(top));
  try { setCookie(LEADERBOARD_KEY, top, 30); } catch(e){}
  // Atualizar imediatamente após salvar (sem reload)
  renderLeaderboard();
  // Toast de confirmação
  showSaveToast(`${name} adicionado ao placar!`);
}

function showSaveToast(message) {
  const toast = document.createElement('div');
  toast.className = 'achievement-toast';
  toast.textContent = `✅ ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add('visible'); }, 50);
  setTimeout(() => { toast.classList.remove('visible'); setTimeout(()=>toast.remove(),400); }, 2800);
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboard');
  if (!container) return;
  const lb = loadLeaderboard();
  const medals = ['🥇','🥈','🥉'];
  // completar com linhas fictícias até 10
  const filled = [...lb];
  for (let i = filled.length; i < 10; i++) {
    filled.push({ name: '---', score: 0, date: new Date(0).toISOString(), _placeholder: true });
  }
  container.innerHTML = '<h3>🏅 Placar de Líderes (Top 10)</h3>' + '<ol class="lb-list">' + filled.map((e,i)=>{
    const medal = medals[i] || (i+1);
    const rowCls = `lb-row lb-${i+1}` + (e._placeholder ? ' lb-empty' : '');
    const date = e._placeholder ? '--/--/----' : new Date(e.date).toLocaleDateString();
    const scoreTxt = (e.score||0) + ' pts';
    return `<li class="${rowCls}"><span class="lb-medal">${medal}</span><span class="lb-name">${e.name}</span><span class="lb-score">${scoreTxt}</span><span class="lb-date">${date}</span></li>`;
  }).join('') + '</ol>';
}

// Export em múltiplos formatos (JSON, CSV, TXT)
function exportResults(format = 'txt') {
  const stats = { fácil: { total: 0, acertos: 0 }, médio: { total: 0, acertos: 0 }, difícil: { total: 0, acertos: 0 } };
  quizSet.forEach((q, i) => { stats[q.difficulty].total++; if (respostasCorretas[i]) stats[q.difficulty].acertos++; });

  const payload = {
    date: new Date().toISOString(),
    score: score,
    totalQuestions: quizSet.length,
    perDifficulty: stats,
    questions: quizSet.map((q,i)=>({ text: q.text, difficulty: q.difficulty, correct: respostasCorretas[i]||false }))
  };

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'quiz_sap1.json');
  } else if (format === 'csv') {
    const lines = ['pergunta,dificuldade,acertou'];
    payload.questions.forEach(q=> lines.push(`"${q.text.replace(/"/g,'""')}",${q.difficulty},${q.correct}`));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, 'quiz_sap1.csv');
  } else { // txt
    const linhas = [];
    linhas.push('=== Estatísticas do Quiz SAP-1 ===');
    linhas.push(`Data: ${new Date().toLocaleString()}`);
    linhas.push(`Pontuação total: ${score}/${quizSet.length}`);
    linhas.push('Por nível de dificuldade:');
    for (const nivel in stats) {
      const { acertos, total } = stats[nivel];
      const perc = ((acertos / (total || 1)) * 100).toFixed(1);
      linhas.push(`${nivel.toUpperCase()}: ${acertos}/${total} acertos (${perc}%)`);
    }
    const blob = new Blob([linhas.join('\n')], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'estatisticas_sap1.txt');
  }
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

  // Abre modal para salvar no leaderboard
  setTimeout(()=>{
    openNameModal(score);
  }, 300);
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

// Inicialização adicional
// Carrega dados externos primeiro, depois inicializa o quiz
loadExternalData().then(()=>{
  seedLeaderboardIfEmpty();
  attachTouchHandlers();
  renderLeaderboard();
  renderAchievementsList();
  wireQuizUI();
  startQuiz();
}).catch(err=>{
  console.warn('Erro na inicialização dos dados externos', err);
  seedLeaderboardIfEmpty();
  attachTouchHandlers();
  renderLeaderboard();
  renderAchievementsList();
  wireQuizUI();
  startQuiz();
});

// Modal e ações auxiliares
function openNameModal(sc) {
  const overlay = document.getElementById('nameModal');
  if (!overlay) return;
  document.getElementById('modalScore').textContent = sc;
  overlay.style.display = 'flex';
}

function closeNameModal() {
  const overlay = document.getElementById('nameModal');
  if (!overlay) return;
  overlay.style.display = 'none';
}

function wireQuizUI() {
  const saveBtn = document.getElementById('saveNameBtn');
  const cancelBtn = document.getElementById('cancelNameBtn');
  const nameInput = document.getElementById('playerNameInput');
  if (saveBtn) saveBtn.onclick = () => {
    const name = (nameInput?.value || '').trim();
    if (name) { saveToLeaderboard(name, score); closeNameModal(); }
    else { alert('Digite um nome para salvar no placar.'); }
  };
  if (cancelBtn) cancelBtn.onclick = () => closeNameModal();
}