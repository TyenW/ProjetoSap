# 🧪 Guia Prático de Testes - BitLab (Passo a Passo)

**Para o usuário testar cada feature implementada após o quiz terminar.**

---

## 🚀 QUICK TEST (5 minutos)

### ✅ Teste Rápido Completo

**Passo 1: Abrir Quiz**
```
1. Vai para http://localhost:8000/quiz.html
2. Clica "Jogar Novamente"
3. Responde 10 perguntas qualquer (certo ou errado)
4. Deixa o quiz terminar (perde 3 vidas ou fecha)
```

**Passo 2: Verificar Relatórios (Devo aparecer na tela!)**
```
Após quiz terminar, você deve VER:
✅ "☠️ GAME OVER" ou "🎉 PARABÉNS"
✅ "📊 Relatório da Sessão" (com tópicos fracos/fortes)
✅ "Nível X" card com seu progresso
✅ Gráfico de desempenho por dificuldade
```

**Se NÃO aparecer = abrir DevTools (F12) e fazer testes manuais abaixo →**

---

## 🔧 TESTES BY FEATURE (Detalhado)

### 1️⃣ **HEATMAP DE ERROS** (quiz-analytics.js)

#### Teste Manual

**Abrir DevTools (F12) → Console → Colar:**

```javascript
// Verifica se módulo carregou
console.log("✅ Heatmap Loaded:", typeof window.quizAnalytics !== 'undefined');

// Simula erros em diferentes tópicos
window.quizAnalytics.recordError("Qual é o tamanho da RAM no SAP-1?", 0);
window.quizAnalytics.recordError("Quantos estados T tem o ciclo?", 1);
window.quizAnalytics.recordError("Qual o papel do Barramento?", 2);

// Finaliza sessão e vê relatório
const report = window.quizAnalytics.finishSession(3, 1);
console.log("📊 RELATÓRIO:", report);

// Deve mostrar:
// {
//   accuracy: 33.3,
//   weakTopics: ["Barramento", "T-states", "RAM"],
//   strongTopics: ["PC"],
//   errorsByTopic: {...}
// }
```

**Resultado Esperado:**
- ✅ Console mostra `{ accuracy: 33.3, weakTopics: [...], ... }`
- ✅ Tópicos identificados corretamente (PC, RAM, T-states, Barramento)
- ✅ Relatório salvo em `localStorage['quiz_session_history']`

---

#### Teste Real (Após Quiz)

**Ao terminar quiz, abrir DevTools e ver:**

```javascript
// 1. Verifica localStorage
console.log(JSON.parse(localStorage.getItem('quiz_session_history')));
// Deve mostrar array com últimas sessões com errorsByTopic

// 2. Verifica relatório na tela
const report = document.getElementById('analytics-report').innerText;
console.log(report);
// Deve conter algo como:
// "📊 Relatório da Sessão"
// "⚠️ Tópicos frágeis: T-states, Barramento"
// "✨ Tópicos fortes: PC, ACC"
```

---

### 2️⃣ **PERFIL DE APRENDIZAGEM** (user-profile.js)

#### Teste Manual

```javascript
// Verifica se módulo carregou
console.log("✅ Profile Loaded:", typeof window.userProfile !== 'undefined');

// Simula respostas (questionText, difficulty, isCorrect, timeMs)
window.userProfile.recordAnswer("PC question", "fácil", true, 2800);
window.userProfile.recordAnswer("RAM question", "médio", false, 4100);
window.userProfile.recordAnswer("T-states question", "difícil", true, 6200);

// Vê estatísticas
const stats = window.userProfile.getStats();
console.log("👤 PERFIL:", stats);

// Deve mostrar:
// {
//   level: 1,
//   totalAnswered: 3,
//   accuracy: 66.7,
//   difficultyBreakdown: {
//     fácil: { answered: 1, correct: 1, accuracy: "100%" },
//     médio: { answered: 1, correct: 0, accuracy: "0%" },
//     difícil: { answered: 1, correct: 1, accuracy: "100%" }
//   },
//   timings: { avgMs: 4366, avgSec: "4.4", ... }
// }
```

**Resultado Esperado:**
- ✅ `totalAnswered: 3`, `totalCorrect: 2`
- ✅ `accuracy: 66.7%`
- ✅ Timing médio calculado corretamente (~4.4s)
- ✅ Breakdown por dificuldade mostra cada uma

---

#### Teste Real (Após Quiz)

```javascript
// 1. Verifica localStorage
const profile = JSON.parse(localStorage.getItem('user_profile'));
console.log("Nível atual:", profile.level);
console.log("Total respondidas:", profile.totalAnswered);
console.log("Acurácia:", (profile.totalCorrect / profile.totalAnswered * 100).toFixed(1) + "%");

// 2. Verifica renderização na tela
const profileCard = document.getElementById('profile-card').innerText;
console.log(profileCard);
// Deve conter:
// "Nível X"
// "Acurácia XX%"
// "Por Dificuldade" com breakdown
```

**Card deve aparecer na página após quiz com:**
- 🔴 Badge "Nível X"
- 📊 Barra de progresso (quantas perguntas respondidas)
- 📈 Stats: Acurácia, Tempo Médio, Sessões, Conquistas
- 🎯 Breakdown por dificuldade (fácil/médio/difícil)

---

### 3️⃣ **LAZY LOADING** (asset-loader.js)

#### Teste Manual (DevTools Network)

**Passo 1: Abrir DevTools → Network tab**

```
1. Recarregar quiz.html (F5)
2. Filtrar por "media" ou "audio"
3. Verificar que quiz_correct.ogg NÃO aparece imediatamente!
```

**Passo 2: Responder pergunta correta**

```
1. Responder uma pergunta CORRETAMENTE
2. Som deve tocar (ding)
3. Voltar para Network tab
4. Procurar por quiz_correct.ogg (deve estar lá AGORA)
5. Status deve ser 200 (carregado do cache na 2ª resposta)
```

**Resultado Esperado:**
- ✅ Primeira carga: quiz_correct.ogg NÃO está na Network
- ✅ Após responder corretamente: arquivo aparece + toca som
- ✅ 2ª resposta correta: arquivo já no cache (mostrar Size: "from cache")

---

#### Teste via Console

```javascript
// Ver status de carregamento
console.log("🎵 Assets Status:", window.assetLoader.getStatus());
// Deve mostrar: { loadedAssets: 2, cachedAudio: 2 }

// Testar preload
window.assetLoader.preload(['assets/audio/quiz_correct.ogg'], 'audio');

// Testar play
await window.assetLoader.playAudio('assets/audio/quiz_correct.ogg');
// Deve tocar som imediatamente
```

---

### 4️⃣ **PWA + OFFLINE** (service-worker.js)

#### Teste 1: Service Worker Registrado

**DevTools → Application → Service Workers**

```
Deve aparecer:
✅ "/service-worker.js"
✅ Status: "activated and running"
✅ Scope: "/"
```

**Se NÃO aparecer:**
```javascript
// No console:
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log("Registrations:", regs);
  regs.forEach(reg => console.log("Scope:", reg.scope));
});
```

---

#### Teste 2: Cache Vendo Storage

**DevTools → Application → Cache Storage**

```
Deve aparecer:
✅ "v1" (cache name)
   ├── index.html
   ├── quiz.html
   ├── assets/css/base.css
   ├── assets/js/quiz.js
   ├── assets/js/modules/...
   └── ... (muitos outros arquivos)
```

**Click em "v1" → ver lista de todos assets cached**

---

#### Teste 3: Funcionar Offline

**Passo 1: Ativar Offline**

```
1. DevTools (F12) → Network tab
2. Procurar checkbox "Offline"
3. Marcar checkbox ✓
```

**Passo 2: Recarregar Página**

```
1. F5 para recarregar
2. Página DEVE carregar do cache (não mostrar erro 404)
3. HTML, CSS, tudo deve funcionar
4. JS deve rodar normalmente
```

**Passo 3: Testar Quiz Offline**

```
1. Ir para quiz.html (offline)
2. Clica "Jogar Novamente"
3. Perguntas aparecem VAZIAS (fallback graceful)
4. Quiz ainda funciona (você consegue "responder" options vazias)
```

**Resultado Esperado:**
- ✅ Página carrega SEM erros 404
- ✅ CSS e layout intacto
- ✅ JS roda (conselhos aparecem)
- ✅ questions.json retorna `{ questions: [] }` (fallback)
- ✅ Nenhuma mensagem de erro no console

---

### 5️⃣ **ACESSIBILIDADE** (accessibility.js)

#### Teste 1: Teclado no Emulador

**Em index.html:**

```
1. Clica no hardware-diagram (emulador SAP-1)
2. Pressiona seta DIREITA (→)
   - Componente deve ficar destacado visualmente
3. Pressiona seta ESQUERDA (←)
   - Foca componente anterior
4. Pressiona seta CIMA (↑)
   - Navega para cima
5. Pressiona seta BAIXO (↓)
   - Navega para baixo
```

**Resultado Esperado:**
- ✅ Componentes ficam em foco visual (border, glow)
- ✅ Navegação funciona suavemente
- ✅ Não precisa usar mouse

---

#### Teste 2: ARIA Live Region (Console)

```javascript
// Verifica se ARIA announcer existe
const announcer = document.getElementById('aria-announcer');
console.log("✅ ARIA Live Region:", announcer ? "SIM" : "NÃO");

// Teste anúncio
window.a11y.announceState("Teste de anúncio");
console.log("Texto anunciado:", announcer.textContent);
```

**Se tiver leitor de tela (NVDA, JAWS, VoiceOver):**
```
Deve ler em voz alta: "Teste de anúncio"
```

---

#### Teste 3: Teclado no Quiz

```
1. Vai para quiz.html
2. Começa quiz
3. Usa TAB para navegar entre opções
4. Cada opção que ganha foco deve:
   - Receber destaque visual
   - IR ARIA deve ler: "Opção 1 de 4: [texto da opção]"
```

---

### 6️⃣ **TELEMETRIA LOCAL** (telemetry.js)

#### Teste Manual

```javascript
// Ver instância carregada
console.log("✅ Telemetry:", typeof window.telemetry !== 'undefined');

// Registrar eventos manualmente
window.telemetry.logQuizAttempt(1, "fácil", true, 3200);
window.telemetry.logQuizAttempt(2, "médio", false, 4100);
window.telemetry.logComponentMetric("hardware-diagram", 150);

// Ver resumo
const summary = window.telemetry.getSummary();
console.log("📊 TELEMETRY SUMMARY:", summary);
// Deve mostrar:
// {
//   totalSessions: 1,
//   quizAttemptsTotal: 2,
//   avgTimePerQuestion: 3650,
//   abnormalAttempts: 0
// }
```

---

#### Teste Real (LocalStorage)

```javascript
// Ver dados salvos
const sessions = JSON.parse(localStorage.getItem('telemetry_sessions'));
console.log("📊 Telemetria Sessions:", sessions);

// Ver primeira sessão
if (sessions && sessions.length > 0) {
  const firstSession = sessions[0];
  console.log("Eventos na sessão:", firstSession.events);
  
  firstSession.events.forEach(e => {
    console.log(`- ${e.type} em T+${e.elapsed}ms`, e);
  });
}
```

**Resultado Esperado:**
- ✅ `localStorage['telemetry_sessions']` contém array
- ✅ Cada sessão tem `sessionId`, `startTime`, `events`
- ✅ `events` incluem `page_load`, `quiz_attempt`, etc
- ✅ Sem dados pessoais (nenhum email, nome, etc)

---

## 📋 CHECKLIST DE TESTE COMPLETO

Copia e cola no console um por um:

```javascript
/// ==== 1. HEATMAP ====
console.log("1️⃣ HEATMAP:", window.quizAnalytics ? "✅" : "❌");

/// ==== 2. PERFIL ====
console.log("2️⃣ PERFIL:", window.userProfile ? "✅" : "❌");

/// ==== 3. LAZY LOAD ====
console.log("3️⃣ ASSET LOADER:", window.assetLoader ? "✅" : "❌");
console.log("   - Status:", window.assetLoader.getStatus());

/// ==== 4. PWA ====
console.log("4️⃣ SERVICE WORKER:", navigator.serviceWorker ? "✅" : "❌");
navigator.serviceWorker.getRegistrations().then(r => {
  console.log("   - Registrado:", r.length > 0 ? "✅" : "❌");
});

/// ==== 5. A11Y ====
console.log("5️⃣ ACCESSIBILITY:", window.a11y ? "✅" : "❌");
console.log("   - ARIA Region:", document.getElementById('aria-announcer') ? "✅" : "❌");

/// ==== 6. TELEMETRIA ====
console.log("6️⃣ TELEMETRIA:", window.telemetry ? "✅" : "❌");
console.log("   - Resumo:", window.telemetry.getSummary());

/// ==== STORAGE ====
console.log("\n💾 STORAGE:");
console.log("   - user_profile:", localStorage.getItem('user_profile') ? "✅" : "❌");
console.log("   - quiz_session_history:", localStorage.getItem('quiz_session_history') ? "✅" : "❌");
console.log("   - telemetry_sessions:", localStorage.getItem('telemetry_sessions') ? "✅" : "❌");
```

---

## 🎯 TESTE COMPLETO (Scenario Real)

**Tempo:** ~15 minutos

### Passo 1: Preparar (1 min)
```
1. Abrir http://localhost:8000/quiz.html
2. F12 (DevTools) → Application tab (deixar aberto)
3. Verificar localStorage está vazio (limpar se necessário)
```

### Passo 2: Jogar Quiz (5 min)
```
1. Clica "Jogar Novamente"
2. Responde 10 perguntas qualquer
3. Deixa terminar (perde 3 vidas ou responde todas)
```

### Passo 3: Verificar Relatórios (2 min)
```
✅ Deve ver na página:
   - "📊 Relatório da Sessão" 
   - "Nível X" card com stats
   - "Por Dificuldade" breakdown
   - Gráfico de desempenho
```

### Passo 4: Verificar Storage (2 min)
```
DevTools → Application → Local Storage:
✅ user_profile
   - level aumentou?
   - totalAnswered aumentou?
✅ quiz_session_history
   - nova sessão adicionada?
   - errorsByTopic preenchido?
✅ telemetry_sessions
   - eventos registrados?
```

### Passo 5: Console Checks (3 min)
```
F12 Console e colar:
```javascript
console.log("HEATMAP:", window.quizAnalytics.currentSessionErrors);
console.log("PERFIL:", window.userProfile.getStats());
console.log("TELEMETRIA:", window.telemetry.getSummary());
console.log("ACCESSIBILITY:", window.a11y ? "✅" : "❌");
```
```

### Passo 6: Testar Offline (2 min)
```
1. Network tab → marcar "Offline"
2. Recarregar página
3. Deve carr​egar do cache
4. Novo quiz online → sem erros 404
```

---

## 🐛 Se Algo Não Funcionar

### Relatório NÃO aparece após quiz

```javascript
// Verificar se containers existem
console.log("Analytics container:", document.getElementById('analytics-report'));
console.log("Profile container:", document.getElementById('profile-card'));

// Verificar se renderização foi chamada
console.log("Analytics report:", window.quizAnalytics.currentSessionErrors);
console.log("Profile stats:", window.userProfile.getStats());
```

**Fix:** Abrir DevTools → verifica console para erros

---

### Módulos não carregados

```javascript
// Verifica cada um
[
  'quizAnalytics',
  'userProfile',
  'assetLoader',
  'telemetry',
  'a11y',
  'scaffolding'
].forEach(m => {
  console.log(`${m}:`, window[m] ? "✅" : "❌");
});
```

**Fix:** 
- F5 para recarregar
- Ctrl+Shift+Delete para limpar cache
- Verificar Network tab para ver se módulos carregam (status 200)

---

### LocalStorage cheio

```javascript
// Ver tamanho aproximado
const size = new Blob(
  Object.values(localStorage).map(JSON.stringify)
).size / 1024;
console.log(`Storage usado: ${size.toFixed(2)} KB`);

// Limpar se necessário
localStorage.clear(); // ⚠️ Apaga tudo!
```

---

## ✅ Success Criteria

Se TUDO abaixo funciona → **Tudo OK!** ✅

- [x] Quiz começa e termina
- [x] Após quiz → vê heatmap relatório (tópicos fracos)
- [x] Após quiz → vê perfil card (nível, acurácia)
- [x] localStorage tem `user_profile` + `quiz_session_history`
- [x] Áudio carrega lazy (não no load inicial)
- [x] Offline → página abre do cache
- [x] Teclado → setas navegam no emulador
- [x] ARIA live → anúncios para screen reader
- [x] Telemetria → eventos registrados em localStorage
- [x] Sem erros no console (F12)

---

**Pronto! Agora você consegue testar tudo! 🚀**
