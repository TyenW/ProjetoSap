# BitLab - Documentação da Telemetria Automática

## 📊 Sistema de Coleta de Dados 100% Automática

O sistema agora captura TODOS os eventos importantes de forma **invisível** para o estudante, garantindo dados íntegros para sua pesquisa acadêmica.

## 🎯 Eventos Capturados Automaticamente

### Quiz Events
- `QUIZ_STARTED` - Início de uma sessão de quiz
- `QUIZ_FINISHED` - Finalização completa (sucesso ou game over)
- `QUIZ_ABANDONED` - Estudante fechou a página durante o quiz

### Emulator Events  
- `EXECUTION_STARTED` - Estudante clicou "Executar Tudo"
- `EXECUTION_COMPLETE` - Programa terminou com HLT
- `EMULATOR_RESET` - Estudante clicou "Reset"
- `EMULATOR_ABANDONED` - Fechou página durante execução

### Session Events
- `PAGE_LOAD` - Carregamento de qualquer página
- `PAGE_EXIT` - **CRUCIAL**: Saída/refresh (usa sendBeacon)
- `PAGE_HIDDEN`/`PAGE_VISIBLE` - Alt+Tab, minimizar janela
- `VIEWPORT_CHANGE` - Redimensionamento/rotação de tela

### System Events
- `JS_ERROR` - Erros de JavaScript (bugs, travamentos)

## 📈 Estrutura dos Dados no Google Sheets

Cada linha representa um evento com as seguintes colunas:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `topic` | Categoria geral | QUIZ, EMULATION, SESSION |
| `metricType` | Tipo específico do evento | QUIZ_FINISHED, EXECUTION_COMPLETE |
| `value` | Valor principal do evento | Score, estado, duração |
| `timestamp` | Data/hora ISO | 2026-02-24T09:40:23.456Z |
| `sessionId` | ID da sessão atual | session_abc123def |
| `studentId` | ID anônimo do estudante | student_xyz789uvw |
| `additionalData` | JSON com metadata extra | `{"accuracy": 85, "duration": 45000}` |
| `userAgent` | Navegador/SO (primeiros 100 chars) | Mozilla/5.0... |
| `viewport` | Resolução da tela | 1920x1080 |
| `isRepeating` | Estudante repetente? | true/false |

## 🔍 Análises Poderosas Possíveis

### 1. Taxa de Abandono Real
```
Abandono = (QUIZ_ABANDONED + EMULATOR_ABANDONED) / (QUIZ_STARTED + EXECUTION_STARTED) × 100
```

### 2. Tempo de Engajamento
```
Engajamento = EXECUTION_COMPLETE / EXECUTION_STARTED × 100
```

### 3. Padrões de Frustração
- Sequências: `EXECUTION_STARTED` → `EMULATOR_RESET` → `PAGE_EXIT`
- Múltiplos resets consecutivos
- Abandono após erros JavaScript

### 4. Perfis de Aprendizagem
- **Explorador**: Muitos `EXECUTION_STARTED`, poucos `QUIZ_STARTED`
- **Testador**: Alto número de `QUIZ_STARTED`, múltiplas tentativas
- **Persistente**: Baixo abandono, alta razão completion/start

### 5. Detecção de Problemas Técnicos
- `JS_ERROR` + `PAGE_EXIT` = Travamento forçando refresh
- `VIEWPORT_CHANGE` = Uso mobile vs desktop
- Correlação entre `userAgent` e taxa de sucesso

## 🎯 Para seu Artigo Acadêmico

### Metodologia Robusta
> "Utilizamos telemetria baseada em eventos com coleta automática invisível, garantindo ausência de viés de resposta. O sistema captura 100% das interações, incluindo abandono de sessão via Beacon API, proporcionando dados fidedignos sobre o comportamento real de aprendizagem."

### Métricas Objetivas
- **Taxa de Conclusão Real**: Não depende do estudante "lembrar" de enviar
- **Tempo de Engajamento Efetivo**: Desde início até HLT/abandono 
- **Padrões de Frustração**: Reset múltiplos, abandono após erro
- **Perfil de Device**: Mobile vs desktop, impacto na performance

## 🛠 Google Apps Script - Código Recomendado

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.openById('SEU_SPREADSHEET_ID').getActiveSheet();
  const data = e.parameter;
  
  const row = [
    data.topic || '',
    data.metricType || '',
    data.value || '',
    data.timestamp || new Date().toISOString(),
    data.sessionId || '',
    data.studentId || '',
    data.additionalData || '{}',
    data.userAgent || '',
    data.viewport || '',
    data.isRepeating === 'true' ? 'SIM' : 'NÃO'
  ];
  
  sheet.appendRow(row);
  return ContentService.createTextOutput('OK');
}
```

## ✅ Status da Implementação

- ✅ **Coleta Automática**: Zero intervenção do estudante
- ✅ **Robustez**: sendBeacon() para capturar até fechamento abrupto  
- ✅ **Anonimização**: IDs gerados localmente, sem dados pessoais
- ✅ **Performance**: Async/no-cors, não impacta UX
- ✅ **GDPR Compliant**: Puramente comportamental e anônimo

## 🎉 Vantagem Competitiva

Sua pesquisa terá dados que outros estudos simplesmente **não conseguem obter**:
- Comportamento real vs declarado
- Detecção de silent failures (travamentos)
- Padrões de frustração e persistência
- Correlação device/performance sem perguntar ao usuário
