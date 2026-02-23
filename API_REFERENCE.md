# 📖 API Reference - BitLab Modules

Quick reference for developers integrating the 6 new modules.

---

## 🎯 Quiz Analytics (`window.quizAnalytics`)

### Methods

#### `recordError(questionText: string, questionIndex: number): void`
Registra erro do usuário em uma questão (chamado automaticamente em quiz.js).
```javascript
quizAnalytics.recordError("Qual é o tamanho da RAM?", 5);
// Classifica por tópico e adiciona ao heatmap
```

#### `finishSession(totalAnswered: number, totalCorrect: number): Object`
Finaliza sessão e retorna relatório de análise.
```javascript
const report = quizAnalytics.finishSession(20, 15);
// {
//   timestamp: "2025-01-15T10:30:00Z",
//   accuracy: 75.0,
//   weakTopics: ["T-states", "Barramento"],
//   strongTopics: ["PC", "ACC"],
//   errorsByTopic: { "T-states": [3, 7, ...] }
// }
```

#### `classifyTopic(questionText: string): string`
Retorna tópico SAP-1 da questão (PC, ACC, RAM, T-states, ...).
```javascript
quizAnalytics.classifyTopic("Qual é a função do Contador de Programa?");
// → "PC"
```

#### `generateStudyRecommendations(weakTopics: string[]): Array`
Gera recomendações de estudo personalizadas.
```javascript
const recs = quizAnalytics.generateStudyRecommendations(["T-states", "IR"]);
// [
//   { topic: "T-states", description: "Estudar ciclos de máquina..." },
//   { topic: "IR", description: "Revisar Registro de Instrução..." }
// ]
```

#### `renderReport(report: Object, container: HTMLElement): void`
Renderiza relatório visual em um container DOM.
```javascript
const container = document.getElementById("analytics-report");
quizAnalytics.renderReport(report, container);
```

#### `reset(): void`
Reseta heatmap da sessão atual (chamado em `startQuiz()`).

#### `exportHeatmap(): string`
Exporta mapa de erros como JSON string.
```javascript
const heatmapJSON = quizAnalytics.exportHeatmap();
// JSON com errorsByTopic, topicMap, etc
```

---

## 👤 User Profile (`window.userProfile`)

### Methods

#### `recordAnswer(questionText: string, difficulty: string, isCorrect: boolean, timeMs: number): void`
Registra resposta individual do usuário (chamado automaticamente em quiz.js).
```javascript
userProfile.recordAnswer(
  "Qual é o tamanho... Total?",
  "fácil",
  true,
  3200
);
```

#### `endSession(score: number): void`
Finaliza sessão do quiz e salva histórico em localStorage.
```javascript
userProfile.endSession(18); // score points
```

#### `getStats(): Object`
Retorna estatísticas consolidadas do perfil.
```javascript
const stats = userProfile.getStats();
// {
//   level: 3,
//   totalAnswered: 45,
//   totalCorrect: 34,
//   accuracy: 75.6,
//   difficultyBreakdown: {
//     fácil: { answered: 20, correct: 19, accuracy: "95%" },
//     médio: { answered: 18, correct: 13, accuracy: "72%" },
//     difícil: { answered: 7, correct: 2, accuracy: "28%" }
//   },
//   timings: { avgMs: 4200, avgSec: "4.2", fastest: 800, slowest: 18000 },
//   sessionsCompleted: 8,
//   achievementsUnlocked: 5
// }
```

#### `unlockAchievement(achievementId: string, title: string): void`
Desbloqueia uma conquista (integrar com sistema de achievements).
```javascript
userProfile.unlockAchievement("streak3", "3 Acertos Seguidos");
```

#### `renderProfile(container: HTMLElement): void`
Renderiza card visual do perfil em um container.
```javascript
const container = document.getElementById("profile-card");
userProfile.renderProfile(container);
```

#### `export(): string`
Exporta perfil completo como JSON.
```javascript
const profileJSON = userProfile.export();
// localStorage.setItem('backup', profileJSON); // salva backup
```

#### `reset(): void`
Reseta perfil do usuário (para testes).

---

## 📦 Asset Loader (`window.assetLoader`)

### Methods

#### `init(): void`
Inicializa Intersection Observer (chamado automaticamente).

#### `observeElement(element: HTMLElement, assetType: string, assetPath: string): void`
Registra elemento para lazy-loading automático.
```javascript
const audio = document.getElementById("quiz-sound");
assetLoader.observeElement(audio, "audio", "assets/audio/quiz_correct.ogg");
// Carrega quando usuário scrollar próximo
```

**assetType:** `"audio"` ou `"image"`

#### `playAudio(path: string): Promise<void>`
Toca arquivo de áudio (com lazy-load automático).
```javascript
await assetLoader.playAudio("assets/audio/quiz_correct.ogg");
```

#### `preload(paths: string[], type?: string): void`
Pré-carrega assets (chamado automaticamente para áudio crítico).
```javascript
assetLoader.preload([
  "assets/audio/quiz_correct.ogg",
  "assets/audio/quiz_wrong.ogg"
], "audio");
```

#### `clear(): void`
Limpa cache de assets (ao trocar de página).

#### `getStatus(): Object`
Retorna status de carregamento.
```javascript
const status = assetLoader.getStatus();
// { loadedAssets: 8, cachedAudio: 2 }
```

---

## 🧩 Challenge Scaffolding (`window.scaffolding`)

### Methods

#### `provideHint(questionId: number, questionText: string): Object`
Fornece dica progressiva para questão errada.
```javascript
const hintData = scaffolding.provideHint(5, "Qual é a função do PC?");
// {
//   hint: "💡 Dica: Pense no registrador que aponta para a próxima...",
//   level: 0,      // 0, 1, ou 2 (3 dicas por tópico)
//   maxLevel: 2,
//   topic: "PC",
//   category: "Registrador"
// }
```

#### `renderHint(container: HTMLElement, hintData: Object): void`
Renderiza dica visualmente.
```javascript
const container = document.getElementById("message");
scaffolding.renderHint(container, hintData);
```

#### `partialRevealCorrectOption(options: string[], correctIndex: number): string[]`
Revela 50% de cada letra da opção correta.
```javascript
const revealed = scaffolding.partialRevealCorrectOption(
  ["ROM", "RAM", "CPU", "ALU"],
  1  // RAM é correta
);
// → ["ROM", "RA█", "CPU", "ALU"]
```

#### `narrowDownOptions(options: string[], correctIndex: number): Object`
Elimina 2 opções incorretas, deixando 2 (correta + 1 incorreta).
```javascript
const narrowed = scaffolding.narrowDownOptions(
  ["Armazenar", "Resgistrar", "Contar", "Desabilitar"],
  2  // "Contar" é correta
);
// {
//   remaining: [1, 2],      // índices das 2 restantes
//   eliminated: [0, 3]       // eliminadas (ofuscadas)
// }
```

#### `renderNarrowedOptions(optionsContainer: HTMLElement, narrowData: Object): void`
Renderiza opções reduzidas visualmente.

#### `getStats(): Object`
Retorna estatísticas de uso de dicas.
```javascript
const stats = scaffolding.getStats();
// { totalHints: 5, questionsWithHints: 3, avgHintsPerQuestion: "1.7" }
```

#### `reset(): void`
Reseta hints da sessão.

---

## 📊 Telemetria Local (`window.telemetry`)

### Methods

#### `logEvent(eventType: string, metadata?: Object): void`
Registra evento genérico.
```javascript
telemetry.logEvent("challenge_attempt", {
  difficulty: "médio",
  component: "barramento",
  success: false
});
```

#### `recordPageLoad(pageName: string): void`
Registra tempo de carregamento da página (chamado automaticamente).

#### `logQuizAttempt(qId: number, difficulty: string, correct: boolean, timeMs: number): void`
Registra tentativa de quiz com timing.
```javascript
telemetry.logQuizAttempt(5, "fácil", true, 3200);
```

#### `logAbandonment(context?: Object): void`
Registra abreviação de sessão (sem conclusão).
```javascript
telemetry.logAbandonment({ type: "page_unload_during_quiz" });
```

#### `logError(message: string, stack?: string): void`
Registra erros não-tratados (chamado automaticamente em window.onerror).

#### `logComponentMetric(component: string, durationMs: number): void`
Registra métrica de performance de componente.
```javascript
telemetry.logComponentMetric("hardware-diagram", 150);
```

#### `getSummary(limit?: number): Object`
Retorna resumo agregado de últimas N sessões.
```javascript
const summary = telemetry.getSummary(10);
// {
//   totalSessions: 8,
//   avgLoadTime: 1850,
//   slowLoadCount: 1,
//   abandonmentCount: 1,
//   abandonmentRate: "12.5",
//   quizAttemptsTotal: 145,
//   avgTimePerQuestion: 3800,
//   abnormalAttempts: 3
// }
```

#### `exportAnonimized(): string`
Exporta dados agregados sem IDs pessoais (para análise).

#### `pruneOldData(): void`
Limpa dados >30 dias (chamado periodicamente).

#### `clear(): void`
Reseta todos os dados de telemetria.

---

## ♿ Acessibilidade (`window.a11y`)

### Methods

#### `announceEmulatorState(state: Object): void`
Anuncia mudanças de registrador via ARIA live region.
```javascript
a11y.announceEmulatorState({
  PC: 3,
  ACC: 127,
  OUT: 42,
  T: 5,
  opcode: "ADD"
});
// Screen reader: "PC = 3, ACC = 127, Output = 42, T-state 5, Opcode ADD"
```

#### `announceState(message: string): void`
Anuncia mensagem genérica.
```javascript
a11y.announceState("Quiz iniciado com 3 vidas");
```

#### `setAriaLabel(element: HTMLElement, label: string): void`
Define aria-label em elemento.
```javascript
a11y.setAriaLabel(document.getElementById("pc-register"), "Contador de Programa");
```

#### `setAriaDescribedBy(element: HTMLElement, describedById: string): void`
Define aria-describedby para descrição de diagrama.
```javascript
a11y.setAriaDescribedBy(
  document.getElementById("hardware-diagram"),
  "diagram-description"
);
```

#### `isScreenReaderActive(): boolean`
Detecta se há leitor de tela ativo (heurística).

---

## 🔧 Lazy Loading Assets - Async Guide

### Auto-preload (No código)

```javascript
// Em asset-loader.js, automático:
window.addEventListener('load', () => {
  assetLoader.preload([
    'assets/audio/quiz_correct.ogg',
    'assets/audio/quiz_wrong.ogg'
  ], 'audio');
});
```

### Manual Observation

```html
<!-- HTML: Marca elemento para lazy-load -->
<img data-lazy-type="image" data-lazy-src="assets/img/moeda.png" />
```

```javascript
// JS: Registra elemento
const img = document.querySelector('[data-lazy-src]');
assetLoader.observeElement(img, "image", img.dataset.lazySrc);
// Carrega quando usuário scrollar próximo
```

---

## 🔄 Service Worker - Cache Strategies

### Network-First (JSON Data)
```
Requisição → Network 
             ↓ sucesso: Cache + return
             ↓ falha: Cache fallback (ou empty array)
```

### Cache-First (Assets)
```
Requisição → Cache (se existe: return)
             ↓ não existe: Network → Cache + return
             ↓ falha: 404
```

### Stale-While-Revalidate (HTML)
```
Requisição → Cache (return immediately)
             ↓ Background: Network → Cache update
             ↓ Próxima página: versão atualizada
```

---

## 🚨 Error Handling

### Quiz Analytics

```javascript
try {
  quizAnalytics.recordError(questionText, idx);
} catch (e) {
  console.warn("Telemetry failed:", e);
  // Continua quiz normalmente (graceful degradation)
}
```

### Service Worker

```javascript
// Em sw.js: Fallback suave em offline
fetch(request)
  .catch(() => {
    if (url.pathname.includes('questions.json')) {
      return new Response(JSON.stringify({ questions: [] }));
    }
    // Fallback: empty data
  });
```

### Acessibilidade

```javascript
// Fallback se ARIA não suportado
const liveRegion = document.getElementById("aria-announcer");
if (!liveRegion) {
  console.log("ARIA live region não disponível");
  // Continua sem anúncios (graceful degradation)
}
```

---

## 📋 Checklist de Integração

Em qualquer novo arquivo que use modules:

- [ ] `<script src="assets/js/modules/XXX.js" defer></script>` no HTML
- [ ] Verifique order: modules antes de lógica principal
- [ ] Use `window.moduloName` (instância global)
- [ ] Teste sem internet (DevTools offline)
- [ ] Valide localStorage em DevTools → Application
- [ ] Teste com leitor de tela (NVDA/JAWS)

---

## 🔗 Ver Também

- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Visão geral do projeto
- [service-worker.js](./service-worker.js) - Estratégias de cache
- [manifest.json](./manifest.json) - PWA config
- Quiz.html - [Containers de integração](#analytics-report)

---

**Última atualização:** 2025 | **Versão:** 1.0
