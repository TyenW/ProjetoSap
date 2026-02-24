# 🚀 CONFIGURAÇÃO RÁPIDA - Telemetria Automática BitLab

## ⚡ Passos para Ativação (5 minutos)

### 1. Configure o Google Apps Script

1. Acesse: https://script.google.com
2. Clique **+ Novo projeto**
3. Cole o código de `docs/GOOGLE_APPS_SCRIPT.js`
4. **ALTERE** a linha: `const SPREADSHEET_ID = 'SEU_SPREADSHEET_ID_AQUI';`
5. Salve (Ctrl+S)
6. Clique **Implementar** → **Nova implementação**
7. Tipo: **Aplicativo da web**
8. Executar como: **Eu**  
9. Quem tem acesso: **Qualquer pessoa**
10. **Copie a URL** gerada

### 2. Configure a URL no BitLab

1. Abra `assets/js/modules/telemetry.js`
2. Na linha 9, substitua pela **sua URL**:
```javascript
const GOOGLE_SCRIPT_URL = 'SUA_URL_COPIADA_AQUI';
```

### 3. Crie a Planilha do Google Sheets

1. Crie nova planilha: https://sheets.google.com
2. **Copie o ID** da URL (parte entre `/d/` e `/edit`)
   - Exemplo: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
3. Volte ao Google Apps Script
4. Cole o ID na linha `const SPREADSHEET_ID = ...`
5. Salve e **reimplemente**

### 4. Teste a Configuração

1. Abra o BitLab no navegador
2. Pressione **F12** (DevTools)
3. Vá em **Console**
4. Digite: `testTelemetry()` e pressione Enter
5. Verifique se aparece ✅ em todos os testes

### 5. Verifique os Dados

1. Navegue pelo BitLab (clique em algumas páginas)
2. Inicie um quiz
3. Execute um programa no emulador  
4. Feche/abra a página algumas vezes
5. Verifique na planilha se os dados estão chegando

## 🎯 O que Você Terá

### Dados Capturados Automaticamente:
- **100% dos acessos** (sem depender do usuário lembrar)
- **Abandono real** (fechou a página, travou, desistiu)
- **Performance** (tempo de carregamento, erros JavaScript)
- **Comportamento** (Alt+Tab, redimensionar tela, múltiplos resets)
- **Progresso detalhado** (pontuação, acertos, tentativas)

### Para Seu Artigo Acadêmico:
- **"Taxa de abandono sem viés"** - captamos até quem fecha abruptamente
- **"Telemetria comportamental invisível"** - zero interferência na UX
- **"Coleta robusta via Beacon API"** - técnica avançada para dados íntegros
- **"Análise de dispositivos cross-platform"** - mobile vs desktop automaticamente

## 🔧 Troubleshooting Rápido

### ❌ Erro: "Failed to fetch"
- **Causa**: URL do Google Apps Script incorreta
- **Solução**: Verifique se reimplementou após mudanças

### ❌ Planilha vazia
- **Causa**: SPREADSHEET_ID errado ou sem permissão
- **Solução**: Verifique ID e reimplemente o Apps Script

### ❌ testTelemetry() não funciona
- **Causa**: Script de teste não carregado
- **Solução**: Descomente a linha no index.html e recarregue

### ❌ Dados duplicados
- **Normal**: Cada interação gera um evento (proposital)
- **Para filtrar**: Use `sessionId` para agrupar uma sessão

## 📊 Exemplo de Análise no Sheets

```
=COUNTIF(C:C,"QUIZ_FINISHED")/COUNTIF(C:C,"QUIZ_STARTED")
```
↑ Taxa de conclusão real do quiz

```
=COUNTIF(C:C,"*ABANDONED*")/COUNTA(C:C)
```
↑ Taxa real de abandono total

```
=COUNTIFS(C:C,"EXECUTION_STARTED",J:J,"*programLength*:0*")
```
↑ Tentativas com programa vazio (estudantes perdidos)

## 🎉 Pronto! 

Agora você tem um sistema de **telemetria acadêmica invisível** que captura dados que outros estudos nunca conseguiram obter. Seus resultados serão únicos e muito mais precisos!

Para dúvidas específicas, consulte `TELEMETRIA_AUTOMATICA.md`.