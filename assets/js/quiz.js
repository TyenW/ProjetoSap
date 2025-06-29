const allQuestions = [
  // --- FÁCIL ---
  { text: "O que significa SAP-1?", options: ["Simple As Possible", "Small Arithmetic Processor", "Single Application Platform", "System of Advanced Processing"], answer: 0, difficulty: "fácil" },
  { text: "Qual componente realiza operações aritméticas?", options: ["RAM", "PC", "ALU", "IR"], answer: 2, difficulty: "fácil" },
  { text: "O que significa PC?", options: ["Power Core", "Program Counter", "Processador Central", "Porta de Controle"], answer: 1, difficulty: "fácil" },
  { text: "Para que serve o registrador MAR?", options: ["Mostrar dados", "Armazenar endereços de memória", "Somar valores", "Emitir sinais de controle"], answer: 1, difficulty: "fácil" },
  { text: "O SAP-1 é usado para:", options: ["Jogos", "Redes", "Ensino de arquitetura", "Desenho"], answer: 2, difficulty: "fácil" },
  { text: "O SAP-1 possui quantos bits no barramento de dados?", options: ["4", "8", "16", "32"], answer: 1, difficulty: "fácil" },

  // --- MÉDIO ---
  { text: "O que o registrador IR faz?", options: ["Incrementa o PC", "Armazena instrução da RAM", "Multiplica valores", "Envia sinais para MAR"], answer: 1, difficulty: "médio" },
  { text: "A saída de dados do SAP-1 vai para:", options: ["IR", "ALU", "RAM", "Display"], answer: 3, difficulty: "médio" },
  { text: "Quantas instruções o SAP-1 pode reconhecer?", options: ["2", "4", "8", "16"], answer: 2, difficulty: "médio" },
  { text: "O registrador B serve para:", options: ["Receber operando da memória", "Armazenar instruções", "Atualizar PC", "Emitir clock"], answer: 0, difficulty: "médio" },

  // --- DIFÍCIL ---
  { text: "Qual o ciclo de máquina completo do SAP-1?", options: ["Busca → Execução", "Busca → Decodificação → Execução", "Decodificação → Armazenamento", "Leitura → Execução"], answer: 1, difficulty: "difícil" },
  { text: "Por que o SAP-1 não realiza multiplicações?", options: ["Falta de ALU", "Limite do clock", "Falta de instruções complexas", "RAM insuficiente"], answer: 2, difficulty: "difícil" },
  { text: "Qual a diferença entre MAR e IR?", options: ["Nenhuma", "IR guarda dados e MAR guarda instruções", "MAR guarda endereços e IR guarda instruções", "IR é entrada e MAR é saída"], answer: 2, difficulty: "difícil" }
];

let lives = 3;
let currentQ = 0;
let score = 0;
let acertosSeguidos = 0;
let usedQuestions = [];
let quizSet = [];
let respostasCorretas = []; // armazena true/false para acertos

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

function renderQuestion() {
  if (lives === 0) return endQuiz();
  if (currentQ === 10) return endQuiz();

  const q = quizSet[currentQ];

  document.getElementById("question").innerText = `[${q.difficulty.toUpperCase()}] ${q.text}`;
  document.getElementById("current-q").innerText = currentQ + 1;
  document.getElementById("lives").innerText = "❤️".repeat(lives);

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(idx);
    optionsDiv.appendChild(btn);
  });

  document.getElementById("message").textContent = "";
}

function checkAnswer(selected) {
  const q = quizSet[currentQ];
  const correct = selected === q.answer;
  const messageDiv = document.getElementById("message");

  if (correct) {
    score++;
    acertosSeguidos++;
    messageDiv.textContent = "Correto!";
    messageDiv.style.color = "green";
    respostasCorretas.push(true);
  } else {
    lives--;
    acertosSeguidos = 0;
    messageDiv.textContent = "Errado!";
    messageDiv.style.color = "red";
    respostasCorretas.push(false);
  }

  document.getElementById("lives").innerText = "❤️".repeat(lives);

  currentQ++;

  setTimeout(() => {
    if (lives <= 0 || currentQ >= 10) {
      endQuiz();
    } else {
      const nextQ = selectAdaptiveQuestion();
      if (!nextQ) {
        endQuiz();
        return;
      }
      quizSet.push(nextQ);
      usedQuestions.push(nextQ);
      renderQuestion();
    }
  }, 1500);
}

function endQuiz() {
  document.getElementById("options").innerHTML = "";
  document.getElementById("restartBtn").style.display = "block";

  if (lives === 0) {
    document.getElementById("question").innerText = "☠️ GAME OVER!";
    document.getElementById("message").innerHTML = `<div class="game-over">Você perdeu todas as vidas! Acertou ${score} de 10.</div>`;
  } else {
    document.getElementById("question").innerText = "🎉 PARABÉNS!";
    document.getElementById("message").innerHTML = `<div class="win-message">Você completou o quiz! Pontuação: ${score}/10</div>`;
  }

  renderChart();
}

function startQuiz() {
  lives = 3;
  currentQ = 0;
  score = 0;
  acertosSeguidos = 0;
  usedQuestions = [];
  quizSet = [];
  respostasCorretas = [];

  document.getElementById("message").innerHTML = "";
  document.getElementById("restartBtn").style.display = "none";

  const firstQ = selectAdaptiveQuestion();
  quizSet.push(firstQ);
  usedQuestions.push(firstQ);

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

startQuiz();