# 🧪 Como Testar - Guia Rápido Visual

**Quer testar tudo em 5 minutos? Siga este guia!**

---

## ⚡ TESTE RÁPIDO (5 min)

### Passo 1: Preparar
```
1. Abrir: http://localhost:8000/quiz.html
2. Apertar F12 (abrir DevTools)
3. Clicar na aba "Console"
```

### Passo 2: Cole isto no Console
```javascript
testAllFeatures()
```

**Pronto!** Você verá:
```
🚀 INICIANDO TESTES DE TODAS AS FEATURES...

  ✅ Heatmap...
  ✅ Perfil...
  ✅ Asset Loader...
  ✅ Service Worker...
  ✅ Acessibilidade...
  ✅ Telemetria...

✅ TESTES CONCLUÍDOS!
```

---

## 📖 TESTES DETALHADOS

### ✅ Teste 1: Completar um Quiz Real

```
Passo 1: Clicar "Jogar Novamente"
Passo 2: Responder 10 perguntas qualquer
Passo 3: Deixar terminar (perde 3 vidas)
Passo 4: VOCÊ DEVE VER NA PÁGINA:
  ✅ "📊 Relatório da Sessão"
  ✅ "Nível X" com seu progresso
  ✅ Gráfico de desempenho
```

**Se não ver relatório:**
```javascript
// No console, rodar:
window.quizAnalytics.finishSession(10, 7);
// Deve aparecer na página
```

---

### ✅ Teste 2: Verificar Dados Salvos

```javascript
// No Console (F12):

// Ver perfil
console.log(JSON.parse(localStorage.getItem('user_profile')));

// Ver histórico de quizzes
console.log(JSON.parse(localStorage.getItem('quiz_session_history')));

// Ver telemetria
console.log(JSON.parse(localStorage.getItem('telemetry_sessions')));
```

---

### ✅ Teste 3: Simular Quiz Completo

```javascript
// No Console:
simulateQuiz(5)
```

Isso vai:
1. Responder 5 perguntas (mix de certo/errado)
2. Registrar no perfil
3. Registrar no heatmap
4. Salvar em localStorage
5. Mostrar resultado no console

---

### ✅ Teste 4: Testar Cada Feature Individualmente

```javascript
// Heatmap
testHeatmap()

// Perfil
testProfile()

// Asset Loader (lazy loading)
testAssetLoader()

// Service Worker (PWA)
testServiceWorker()

// Acessibilidade
testAccessibility()

// Telemetria
testTelemetry()

// Storage
testLocalStorage()
```

---

## 🎯 Testes Visuais (Não precisa Console)

### Teste 1: Lazy Loading (Assets)

```
1. Abrir: http://localhost:8000/quiz.html
2. F12 → Network tab
3. Recarregar página (F5)
4. Procurar por "quiz_correct.ogg"
5. RESULTADO ESPERADO:
   ❌ NÃO deve aparecer imediatamente
6. Agora responder uma pergunta CORRETA
7. Voltar para Network tab
8. RESULTADO ESPERADO:
   ✅ Arquivo aparece (foi carregado sob demanda)
```

---

### Teste 2: Offline Mode

```
1. Abrir: http://localhost:8000/quiz.html
2. F12 → Network tab
3. Marcar checkbox "Offline"
4. Recarregar página (F5)
5. RESULTADO ESPERADO:
   ✅ Página abre do cache (sem erro 404)
   ✅ Layout intacto
   ✅ Quiz funciona (perguntas vazias é normal offline)
```

---

### Teste 3: Teclado (Acessibilidade)

```
1. Abrir: http://localhost:8000/index.html
2. Clicar no emulador SAP-1
3. Pressionar SETA DIREITA (→)
4. RESULTADO ESPERADO:
   ✅ Componente fica destacado
5. Pressionar SETA ESQUERDA (←)
6. RESULTADO ESPERADO:
   ✅ Navega para componente anterior
```

---

### Teste 4: Service Worker Ativo

```
1. Abrir: http://localhost:8000/quiz.html
2. F12 → Application → Service Workers
3. RESULTADO ESPERADO:
   ✅ Mostra "/service-worker.js"
   ✅ Status: "activated and running"
```

---

## 🎮 Teste Completo (15 min)

Se você quer testar TUDO manualmente:

### Fase 1: Preparar (2 min)
```
1. Abrir http://localhost:8000/quiz.html
2. F12 (DevTools)
3. Application → Local Storage → limpar todos dados
   (Ou: localStorage.clear())
```

### Fase 2: Jogar (5 min)
```
1. Clica "Jogar Novamente"
2. Responde 10 perguntas
3. Deixa terminar
4. ESPERA VER:
   ✅ "📊 Relatório da Sessão"
   ✅ "Nível X" card
```

### Fase 3: Verificar Storage (3 min)
```
F12 → Application → Local Storage:
Deve ter 3 entradas:
  ✅ user_profile (seu nível + stats)
  ✅ quiz_session_history (erros por tópico)
  ✅ telemetry_sessions (eventos)
```

### Fase 4: Console Checks (3 min)
```javascript
// Cole no console:
testAllFeatures()

// Ou testes individuais:
testHeatmap()
testProfile()
testTelemetry()
```

### Fase 5: Offline (2 min)
```
DevTools → Network → marcar Offline
Recarregar página
ESPERA: Carrega do cache (sem erro)
```

---

## ❌ Se Algo Não Funcionar...

### Problema: "Não vejo relatório após quiz"

**Solução 1:**
```javascript
// No console:
window.quizAnalytics.finishSession(10, 7);
// Relatório deve aparecer na página
```

**Solução 2:**
```javascript
// Verificar se containers existem:
console.log(document.getElementById('analytics-report')); // deve mostrar elemento
console.log(document.getElementById('profile-card'));     // deve mostrar elemento
```

**Solução 3:**
```javascript
// Limpar cache e tudo:
localStorage.clear();
location.reload();
```

---

### Problema: "Módulos não carregados"

```javascript
// Verificar cada um:
console.log("Analytics:", window.quizAnalytics ? "✅" : "❌");
console.log("Perfil:", window.userProfile ? "✅" : "❌");
console.log("Assets:", window.assetLoader ? "✅" : "❌");
console.log("Telemetria:", window.telemetry ? "✅" : "❌");
console.log("A11y:", window.a11y ? "✅" : "❌");
```

**Se algum for ❌:**
1. Verificar DevTools → Network
2. Procurar `assets/js/modules/*.js`
3. Se status não for 200, recarregar (F5)

---

### Problema: "Offline não funciona"

```javascript
// Verificar Service Worker:
navigator.serviceWorker.getRegistrations().then(r => {
  console.log("Registrações:", r.length);
  r.forEach(reg => console.log("Scope:", reg.scope));
});
```

**Se mostrar 0 registrações:**
1. Recarregar página
2. Verificar console para erros
3. Tentar em incognito (sem extensões)

---

## 🎓 Conceitos

### localStorage
- Onde são salvos dados (user_profile, histórico, telemetria)
- **Ver:** F12 → Application → Local Storage → http://localhost:8000
- **Limpar:** localStorage.clear() no console

### Service Worker
- Cache automático para offline
- **Ver:** F12 → Application → Service Workers
- **Ver Cache:** F12 → Application → Cache Storage

### DevTools Abas Importantes
```
▶ Console     ← Rodar comandos teste
▶ Network     ← Ver carregamento assets + offline
▶ Application → Local Storage (dados salvos)
              → Service Workers (SW status)
              → Cache Storage (arquivos cached)
```

---

## ✅ Checklist Final

Marca como feito:

- [ ] Joguei quiz e vi relatório aparecer
- [ ] localStorage tem dados (user_profile, history)
- [ ] testAllFeatures() passou
- [ ] Áudio carrega lazy (não no load inicial)
- [ ] Offline funciona (marcar Network offline + recarregar)
- [ ] Teclado navega no emulador (setas)
- [ ] Service Worker ativado (DevTools)
- [ ] Sem erros no console (F12 → Console)

Se tudo acima ✅ = **TUDO FUNCIONANDO!** 🎉

---

## 📚 Documentação Completa

**Para testes super detalhados:**
- `TESTING_MANUAL.md` ← Guia passo a passo completo

**Para entender APIs:**
- `API_REFERENCE.md` ← Como usar cada módulo

---

## 🚀 Pronto?

1. **Quiz.html** → F12 → Console
2. **Cole:** `testAllFeatures()` 
3. **Enter!**

Boa sorte! 🎮
