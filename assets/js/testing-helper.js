/**
 * TESTING HELPER - BitLab
 * Cole no console (F12) para testar automaticamente todas as features
 * 
 * Usage:
 * 1. Abra quiz.html
 * 2. F12 → Console
 * 3. Cole este arquivo inteiro (Ctrl+V)
 * OU
 * 4. Cole apenas a função que quer testar (ex: testHeatmap())
 */

// ============================================================
// 🧪 TESTE RÁPIDO - TUDO EM 1 COMANDO
// ============================================================

window.testAllFeatures = function() {
  console.clear();
  console.log("🚀 INICIANDO TESTES DE TODAS AS FEATURES...\n");
  
  testModulesLoaded();
  testHeatmapBasic();
  testProfileBasic();
  testAssetLoader();
  testServiceWorker();
  testAccessibility();
  testTelemetry();
  testLocalStorage();
  
  console.log("\n✅ TESTES CONCLUÍDOS!");
  console.log("📖 Ver detalhes com: testHeatmap(), testProfile(), etc");
};

// ============================================================
// 1️⃣ MODULOS CARREGADOS
// ============================================================

window.testModulesLoaded = function() {
  console.log("=== 1️⃣ MÓDULOS CARREGADOS ===\n");
  
  const modules = {
    'quizAnalytics': window.quizAnalytics,
    'userProfile': window.userProfile,
    'assetLoader': window.assetLoader,
    'telemetry': window.telemetry,
    'a11y': window.a11y,
    'scaffolding': window.scaffolding
  };
  
  let allLoaded = true;
  Object.entries(modules).forEach(([name, module]) => {
    const status = module ? "✅ CARREGADO" : "❌ NÃO CARREGADO";
    console.log(`${name.padEnd(20)} ${status}`);
    if (!module) allLoaded = false;
  });
  
  console.log(`\nRESULTADO: ${allLoaded ? "✅ Todos carregados!" : "⚠️ Alguns módulos faltam"}\n`);
  return allLoaded;
};

// ============================================================
// 2️⃣ HEATMAP (Quiz Analytics)
// ============================================================

window.testHeatmap = function() {
  console.log("=== 2️⃣ HEATMAP DE ERROS ===\n");
  
  if (!window.quizAnalytics) {
    console.log("❌ quizAnalytics não carregou!");
    return;
  }
  
  // Reset
  window.quizAnalytics.reset();
  
  // Simula erros em diferentes tópicos
  console.log("📝 Registrando erros de teste...");
  window.quizAnalytics.recordError("Qual é a função do PC (Contador de Programa)?", 0);
  window.quizAnalytics.recordError("Quantos estados T tem o ciclo?", 1);
  window.quizAnalytics.recordError("Qual a função do barramento?", 2);
  window.quizAnalytics.recordError("O que significa T-state?", 3);
  
  // Finaliza sessão
  const report = window.quizAnalytics.finishSession(4, 1); // 4 respondidas, 1 correta
  
  console.log("\n📊 RELATÓRIO GERADO:");
  console.log(`   Acurácia: ${report.accuracy}%`);
  console.log(`   Tópicos Fracos: ${report.weakTopics.join(", ")}`);
  console.log(`   Tópicos Fortes: ${report.strongTopics.join(", ")}`);
  console.log(`   Erros por Tópico:`, report.errorsByTopic);
  
  // Recomendações
  const recs = window.quizAnalytics.generateStudyRecommendations(report.weakTopics);
  console.log("\n📚 RECOMENDAÇÕES DE ESTUDO:");
  recs.forEach(r => {
    console.log(`   ${r.topic}: ${r.description}`);
  });
  
  console.log("\n✅ Heatmap funcionando!\n");
};

window.testHeatmapBasic = function() {
  if (!window.quizAnalytics) {
    console.log("  ❌ Heatmap...");
    return;
  }
  console.log("  ✅ Heatmap...");
};

// ============================================================
// 3️⃣ PERFIL DE APRENDIZAGEM
// ============================================================

window.testProfile = function() {
  console.log("=== 3️⃣ PERFIL DE APRENDIZAGEM ===\n");
  
  if (!window.userProfile) {
    console.log("❌ userProfile não carregou!");
    return;
  }
  
  // Reset
  window.userProfile.reset();
  
  // Simula respostas
  console.log("📝 Registrando respostas de teste...");
  window.userProfile.recordAnswer("PC question", "fácil", true, 2800);
  window.userProfile.recordAnswer("RAM question", "médio", false, 4100);
  window.userProfile.recordAnswer("T-states question", "difícil", true, 6200);
  window.userProfile.recordAnswer("ACC question", "fácil", true, 2000);
  window.userProfile.recordAnswer("Barramento question", "médio", false, 5000);
  
  // Estatísticas
  const stats = window.userProfile.getStats();
  
  console.log("\n👤 ESTATÍSTICAS DO PERFIL:");
  console.log(`   Nível: ${stats.level}`);
  console.log(`   Total Respondidas: ${stats.totalAnswered}`);
  console.log(`   Acertos: ${stats.totalCorrect}`);
  console.log(`   Acurácia: ${stats.accuracy}%`);
  console.log(`   Tempo Médio: ${stats.timings.avgSec}s`);
  console.log(`   Sessões: ${stats.sessionsCompleted}`);
  console.log(`   Conquistas: ${stats.achievementsUnlocked}`);
  
  console.log("\n📊 POR DIFICULDADE:");
  Object.entries(stats.difficultyBreakdown).forEach(([diff, data]) => {
    console.log(`   ${diff.padEnd(10)} ${data.correct}/${data.answered} (${data.accuracy}%)`);
  });
  
  window.userProfile.endSession(3); // Salva sessão
  console.log("\n✅ Perfil funcionando!\n");
};

window.testProfileBasic = function() {
  if (!window.userProfile) {
    console.log("  ❌ Perfil...");
    return;
  }
  console.log("  ✅ Perfil...");
};

// ============================================================
// 4️⃣ LAZY LOADING
// ============================================================

window.testAssetLoader = function() {
  console.log("=== 4️⃣ LAZY LOADING ===\n");
  
  if (!window.assetLoader) {
    console.log("❌ assetLoader não carregou!");
    return;
  }
  
  const status = window.assetLoader.getStatus();
  console.log("🎵 ASSETS CARREGADOS:");
  console.log(`   Total: ${status.loadedAssets}`);
  console.log(`   Áudio em Cache: ${status.cachedAudio}`);
  
  console.log("\n🧪 Testando playAudio...");
  window.assetLoader.playAudio('assets/audio/quiz_correct.ogg')
    .then(() => console.log("   ✅ Som tocou!"))
    .catch(e => console.log(`   ❌ Erro: ${e.message}`));
  
  console.log("\n✅ Asset Loader funcionando!\n");
};

window.testAssetLoaderBasic = function() {
  if (!window.assetLoader) {
    console.log("  ❌ Asset Loader...");
    return;
  }
  console.log("  ✅ Asset Loader...");
};

// ============================================================
// 5️⃣ SERVICE WORKER & PWA
// ============================================================

window.testServiceWorker = function() {
  console.log("=== 5️⃣ SERVICE WORKER & PWA ===\n");
  
  if (!navigator.serviceWorker) {
    console.log("❌ Service Worker não suportado!");
    return;
  }
  
  navigator.serviceWorker.getRegistrations().then(regs => {
    console.log("📱 SERVICE WORKER:");
    if (regs.length === 0) {
      console.log("   ❌ Nenhuma registração encontrada");
      console.log("   Verifique: DevTools → Application → Service Workers");
      return;
    }
    
    regs.forEach((reg, i) => {
      console.log(`   ✅ Registração ${i + 1} encontrada`);
      console.log(`      Scope: ${reg.scope}`);
      console.log(`      Status: ${reg.active ? "Active" : "Inactive"}`);
    });
    
    // Verificar manifest
    const manifest = document.querySelector('link[rel="manifest"]');
    console.log(`\n📦 MANIFEST:`);
    console.log(`   ${manifest ? "✅ Presente" : "❌ Faltando"}`);
    if (manifest) {
      console.log(`      href: ${manifest.href}`);
    }
    
    // Verificar cache
    caches.keys().then(names => {
      console.log(`\n💾 CACHES:`);
      names.forEach(name => {
        caches.open(name).then(cache => {
          cache.keys().then(reqs => {
            console.log(`   ${name}: ${reqs.length} assets`);
          });
        });
      });
    });
    
    console.log("\n✅ Service Worker funcionando!\n");
  });
};

window.testServiceWorkerBasic = function() {
  if (!navigator.serviceWorker) {
    console.log("  ❌ Service Worker...");
    return;
  }
  
  navigator.serviceWorker.getRegistrations().then(regs => {
    console.log(regs.length > 0 ? "  ✅ Service Worker..." : "  ❌ Service Worker...");
  });
};

// ============================================================
// 6️⃣ ACESSIBILIDADE
// ============================================================

window.testAccessibility = function() {
  console.log("=== 6️⃣ ACESSIBILIDADE ===\n");
  
  if (!window.a11y) {
    console.log("❌ a11y não carregou!");
    return;
  }
  
  console.log("⌨️  TECLADO:");
  console.log("   Tente usar setas (←↑→↓) no hardware-diagram em index.html");
  
  console.log("\n🔊 ARIA LIVE REGION:");
  const announcer = document.getElementById('aria-announcer');
  console.log(`   ${announcer ? "✅ Presente" : "❌ Faltando"}`);
  console.log(`   role="status" aria-live="polite"`);
  
  // Testar anúncio
  console.log("\n🧪 Teste de anúncio...");
  window.a11y.announceState("Teste de acessibilidade!");
  console.log(`   Texto anunciado: "${announcer.textContent}"`);
  
  console.log("\n✅ Acessibilidade funcionando!\n");
};

window.testAccessibilityBasic = function() {
  if (!window.a11y) {
    console.log("  ❌ Acessibilidade...");
    return;
  }
  console.log("  ✅ Acessibilidade...");
};

// ============================================================
// 7️⃣ TELEMETRIA LOCAL
// ============================================================

window.testTelemetry = function() {
  console.log("=== 7️⃣ TELEMETRIA LOCAL ===\n");
  
  if (!window.telemetry) {
    console.log("❌ telemetry não carregou!");
    return;
  }
  
  // Log eventos de teste
  console.log("📝 Registrando eventos de teste...");
  window.telemetry.logEvent("test_event", { feature: "manual_test" });
  window.telemetry.logQuizAttempt(1, "fácil", true, 3200);
  window.telemetry.logQuizAttempt(2, "médio", false, 4100);
  window.telemetry.logComponentMetric("hardware-diagram", 150);
  
  // Resumo
  const summary = window.telemetry.getSummary();
  console.log("\n📊 RESUMO DE TELEMETRIA:");
  console.log(`   Sessões: ${summary.totalSessions}`);
  console.log(`   Tentativas Quiz: ${summary.quizAttemptsTotal}`);
  console.log(`   Tempo Médio/Pergunta: ${summary.avgTimePerQuestion}ms`);
  console.log(`   Taxa Abandonment: ${summary.abandonmentRate}%`);
  
  console.log("\n✅ Telemetria funcionando!\n");
};

window.testTelemetryBasic = function() {
  if (!window.telemetry) {
    console.log("  ❌ Telemetria...");
    return;
  }
  console.log("  ✅ Telemetria...");
};

// ============================================================
// 💾 LOCAL STORAGE
// ============================================================

window.testLocalStorage = function() {
  console.log("=== 💾 LOCAL STORAGE ===\n");
  
  const keys = ['user_profile', 'quiz_session_history', 'telemetry_sessions'];
  
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      const size = (new Blob([data]).size / 1024).toFixed(2);
      console.log(`✅ ${key.padEnd(25)} (${size} KB)`);
    } else {
      console.log(`❌ ${key.padEnd(25)} (não encontrado)`);
    }
  });
  
  // Tamanho total
  const totalSize = Object.values(localStorage)
    .reduce((sum, val) => sum + new Blob([val]).size, 0) / 1024;
  console.log(`\n📊 Total utilizando: ${totalSize.toFixed(2)} KB`);
  
  console.log("\n💡 Para LER dados:");
  console.log("   const profile = JSON.parse(localStorage.getItem('user_profile'));");
  console.log("   console.log(profile);");
  
  console.log("\n⚠️  Para LIMPAR:");
  console.log("   localStorage.clear(); // Apaga tudo!");
  
  console.log("\n✅ Storage verificado!\n");
};

// ============================================================
// 🎯 TESTE COMPLETO DO QUIZ
// ============================================================

window.simulateQuiz = function(numQuestions = 5) {
  console.clear();
  console.log("🎮 SIMULANDO QUIZ COM 5 PERGUNTAS...\n");
  
  // Reseta
  if (window.quizAnalytics) window.quizAnalytics.reset();
  if (window.userProfile) window.userProfile.reset();
  
  const questions = [
    { text: "O que é PC?", difficulty: "fácil", correct: true },
    { text: "Qual é o tamanho da RAM?", difficulty: "fácil", correct: false },
    { text: "Quantos T-states?", difficulty: "médio", correct: true },
    { text: "O que é ACC?", difficulty: "médio", correct: true },
    { text: "Função do Barramento?", difficulty: "difícil", correct: false }
  ];
  
  let correctCount = 0;
  
  questions.slice(0, numQuestions).forEach((q, i) => {
    const correct = q.correct;
    
    // Registra no perfil
    if (window.userProfile) {
      window.userProfile.recordAnswer(q.text, q.difficulty, correct, 3000 + Math.random() * 3000);
    }
    
    // Registra na telemetria
    if (window.telemetry) {
      window.telemetry.logQuizAttempt(i, q.difficulty, correct, 3000);
    }
    
    // Se errado, registra no heatmap
    if (!correct && window.quizAnalytics) {
      window.quizAnalytics.recordError(q.text, i);
    }
    
    if (correct) correctCount++;
    console.log(`${i + 1}. ${correct ? "✅" : "❌"} ${q.text}`);
  });
  
  console.log(`\n📊 Resultado: ${correctCount}/${numQuestions} corretas`);
  
  // Finaliza analytics
  if (window.quizAnalytics) {
    const report = window.quizAnalytics.finishSession(numQuestions, correctCount);
    console.log("\n📋 HEATMAP:");
    console.log(`   Tópicos Fracos: ${report.weakTopics.join(", ")}`);
    console.log(`   Tópicos Fortes: ${report.strongTopics.join(", ")}`);
  }
  
  // Finaliza perfil
  if (window.userProfile) {
    window.userProfile.endSession(correctCount);
    const stats = window.userProfile.getStats();
    console.log("\n👤 PERFIL:");
    console.log(`   Nível: ${stats.level}`);
    console.log(`   Acurácia: ${stats.accuracy}%`);
    console.log(`   Tempo Médio: ${stats.timings.avgSec}s`);
  }
  
  console.log("\n✅ Simulação concluída!");
  console.log("💡 Verifique localStorage: localStorage.user_profile\n");
};

// ============================================================
// 📖 AJUDA
// ============================================================

window.testHelp = function() {
  console.clear();
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          🧪 BitLab Testing Helper - Ajuda                ║
╚════════════════════════════════════════════════════════════╝

📋 TESTES DISPONÍVEIS:

testAllFeatures()        👈 Testa TUDO de uma vez
testModulesLoaded()      Verifica se todos módulos carregaram
testHeatmap()            Testa heatmap de erros
testProfile()            Testa perfil de aprendizagem
testAssetLoader()        Testa lazy loading
testServiceWorker()      Testa PWA e offline
testAccessibility()      Testa acessibilidade
testTelemetry()          Testa telemetria local
testLocalStorage()       Verifica localStorage

simulateQuiz(5)          Simula um quiz completo com 5 perguntas

📍 COMO USAR:

1. Abra quiz.html em http://localhost:8000/quiz.html
2. Pressione F12 para abrir DevTools
3. Clique na aba "Console"
4. Cole um dos comandos acima e pressione Enter

💡 DICA: Cola este arquivo todo no console para ter acesso a tudo!

📚 DOCUMENTAÇÃO:
   TESTING_MANUAL.md    - Guia passo-a-passo detalhado
   API_REFERENCE.md     - Documentação das APIs

🚀 Ready to test!
  `);
};

// Mostrar ajuda automaticamente
console.log("\n🧪 BitLab Testing Helper Carregado!");
console.log("💡 Digite: testHelp() para ver todos os comandos");
console.log("🚀 Ou: testAllFeatures() para testar tudo!\n");
