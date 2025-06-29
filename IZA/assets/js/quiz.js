const questions = [
      // 6 fáceis
      {
        text: "O que significa SAP-1?",
        options: ["Simple As Possible", "Simple Architecture Processor", "Small Arithmetic Processor", "Single Application Platform"],
        answer: 0,
        difficulty: "fácil"
      },
      {
        text: "Quantos bits possui o barramento de dados no SAP-1?",
        options: ["4 bits", "8 bits", "16 bits", "32 bits"],
        answer: 1,
        difficulty: "fácil"
      },
      {
        text: "O que o registrador MAR faz?",
        options: ["Armazena instruções", "Armazena endereços de memória", "Realiza operações lógicas", "Controla a saída de dados"],
        answer: 1,
        difficulty: "fácil"
      },
      {
        text: "Qual é a função da Unidade de Controle no SAP-1?",
        options: ["Somar valores", "Exibir dados", "Gerar sinais de controle", "Multiplicar registradores"],
        answer: 2,
        difficulty: "fácil"
      },
      {
        text: "O que significa PC no SAP-1?",
        options: ["Power Control", "Program Counter", "Processing Core", "Page Controller"],
        answer: 1,
        difficulty: "fácil"
      },
      {
        text: "Qual componente realiza operações aritméticas?",
        options: ["RAM", "PC", "ALU", "IR"],
        answer: 2,
        difficulty: "fácil"
      },

      // 3 médias
      {
        text: "Qual a principal função do registrador IR?",
        options: ["Incrementar o PC", "Armazenar instruções da RAM", "Mostrar o resultado na tela", "Emitir sinais para o MAR"],
        answer: 1,
        difficulty: "médio"
      },
      {
        text: "A saída do SAP-1 é conectada a qual componente?",
        options: ["Display", "PC", "RAM", "ALU"],
        answer: 0,
        difficulty: "médio"
      },
      {
        text: "Quantas instruções diferentes o SAP-1 pode reconhecer?",
        options: ["4", "8", "16", "2"],
        answer: 1,
        difficulty: "médio"
      },

      // 1 difícil
      {
        text: "Qual é o ciclo de máquina completo do SAP-1?",
        options: [
          "Busca → Execução",
          "Busca → Decodificação → Execução",
          "Decodificação → Execução → Armazenamento",
          "Leitura → Armazenamento → Execução"
        ],
        answer: 1,
        difficulty: "difícil"
      }
    ];

    let current = 0;
    let lives = 3;

    function renderQuestion() {
      if (lives === 0) {
        document.getElementById("question").innerText = "GAME OVER!";
        document.getElementById("options").innerHTML = "";
        document.getElementById("message").innerHTML = '<div class="game-over">Você perdeu todas as vidas!</div>';
        document.getElementById("restartBtn").style.display = "block";
        return;
      }

      if (current >= questions.length) {
        document.getElementById("question").innerText = "Parabéns!";
        document.getElementById("options").innerHTML = "";
        document.getElementById("message").innerHTML = '<div class="win-message">Você completou o quiz com sucesso!</div>';
        document.getElementById("restartBtn").style.display = "block";
        return;
      }

      const q = questions[current];
      document.getElementById("question").innerText = `[${q.difficulty.toUpperCase()}] ${q.text}`;
      document.getElementById("current-q").innerText = current + 1;
      document.getElementById("lives").innerText = "❤️".repeat(lives);

      const optionsDiv = document.getElementById("options");
      optionsDiv.innerHTML = "";
      q.options.forEach((opt, idx) => {
        const btn = document.createElement("button");
        btn.textContent = opt;
        btn.onclick = () => checkAnswer(idx);
        optionsDiv.appendChild(btn);
      });
    }

    function checkAnswer(selected) {
      const correct = questions[current].answer;
      if (selected === correct) {
        current++;
        renderQuestion();
      } else {
        lives--;
        document.getElementById("lives").innerText = "❤️".repeat(lives);
        renderQuestion();
      }
    }

    function startQuiz() {
      current = 0;
      lives = 3;
      document.getElementById("message").innerHTML = "";
      document.getElementById("restartBtn").style.display = "none";
      renderQuestion();
    }

    // Som
    const music = document.getElementById("bg-music");
    const toggle = document.getElementById("muteToggle");
    toggle.onclick = () => {
      music.muted = !music.muted;
      toggle.textContent = music.muted ? "🔇" : "🔊";
    };

    startQuiz();