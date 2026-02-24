/**
 * Google Apps Script - Receptor de Telemetria BitLab
 * Versão Otimizada para Pesquisa Acadêmica
 * 
 * INSTRUÇÕES:
 * 1. Abra script.google.com
 * 2. Crie novo projeto
 * 3. Cole este código
 * 4. Salve e publique como Web App
 * 5. Copie a URL e cole no telemetry.js
 */

function doPost(e) {
  try {
    // Configuração - ALTERE AQUI COM SEU SPREADSHEET ID
    const SPREADSHEET_ID = 'SEU_SPREADSHEET_ID_AQUI';
    const SHEET_NAME = 'BitLab_Telemetria';
    
    // Abrir planilha
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet;
    
    try {
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
    } catch (err) {
      // Criar aba se não existir
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      
      // Adicionar cabeçalhos
      const headers = [
        'Timestamp', 'Topic', 'Metric Type', 'Value', 'Session ID',
        'Student ID', 'User Agent', 'Viewport', 'Is Repeating',
        'Additional Data', 'Raw Data'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // Formatação dos cabeçalhos
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#1f4e79');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      
      console.log('Planilha criada com cabeçalhos');
    }
    
    // Extrair dados do POST
    const data = e.parameter;
    
    // Timestamp mais legível para análise
    const timestamp = data.timestamp ? 
      new Date(data.timestamp) : 
      new Date();
    
    // Processar additional data
    let additionalDataFormatted = '';
    try {
      const additionalData = JSON.parse(data.additionalData || '{}');
      additionalDataFormatted = Object.keys(additionalData).length > 0 ? 
        JSON.stringify(additionalData, null, 1) : '';
    } catch (err) {
      additionalDataFormatted = data.additionalData || '';
    }
    
    // Dados estruturados para análise
    const row = [
      timestamp,
      data.topic || '',
      data.metricType || '',
      data.value || '',
      data.sessionId || '',
      data.studentId || '',
      (data.userAgent || '').substring(0, 100), // Limitar tamanho
      data.viewport || '',
      data.isRepeating === 'true' ? 'SIM' : 'NÃO',
      additionalDataFormatted,
      JSON.stringify(data) // Raw data for backup
    ];
    
    // Inserir linha
    sheet.appendRow(row);
    
    // Log para debug (opcional)
    console.log('Dados salvos:', {
      topic: data.topic,
      metricType: data.metricType,
      studentId: data.studentId,
      timestamp: timestamp.toISOString()
    });
    
    // Retornar sucesso
    return ContentService
      .createTextOutput('{"status":"success","message":"Data recorded"}')
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Erro no doPost:', error);
    
    // Log detalhado do erro
    console.error('Dados recebidos:', e.parameter);
    console.error('Stack trace:', error.stack);
    
    // Retornar erro sem quebrar o sistema
    return ContentService
      .createTextOutput('{"status":"error","message":"' + error.message + '"}')
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // Endpoint para teste rápido
  return ContentService
    .createTextOutput('BitLab Telemetry API is running. Use POST to send data.')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * Função de configuração inicial (execute uma vez manualmente)
 */
function setupInitialSheet() {
  const SPREADSHEET_ID = 'SEU_SPREADSHEET_ID_AQUI'; // ALTERE AQUI
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.insertSheet('BitLab_Telemetria');
    
    const headers = [
      'Timestamp', 'Topic', 'Metric Type', 'Value', 'Session ID',
      'Student ID', 'User Agent', 'Viewport', 'Is Repeating',
      'Additional Data', 'Raw Data'
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Formatação
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#1f4e79');
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    // Auto-resize colunas
    sheet.autoResizeColumns(1, headers.length);
    
    console.log('Planilha configurada com sucesso!');
    
  } catch (error) {
    console.error('Erro na configuração:', error);
  }
}

/**
 * Função para criar relatório automático (execute periodicamente)
 */
function generateWeeklyReport() {
  const SPREADSHEET_ID = 'SEU_SPREADSHEET_ID_AQUI'; // ALTERE AQUI
  
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const dataSheet = spreadsheet.getSheetByName('BitLab_Telemetria');
    
    if (!dataSheet) {
      console.log('Planilha de dados não encontrada');
      return;
    }
    
    // Criar aba de relatório
    let reportSheet;
    try {
      reportSheet = spreadsheet.getSheetByName('Relatório_Semanal');
      reportSheet.clear();
    } catch (err) {
      reportSheet = spreadsheet.insertSheet('Relatório_Semanal');
    }
    
    // Pegar dados da última semana
    const data = dataSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentData = rows.filter(row => {
      const timestamp = new Date(row[0]);
      return timestamp >= sevenDaysAgo;
    });
    
    // Métricas agregadas
    const totalEvents = recentData.length;
    const uniqueStudents = new Set(recentData.map(row => row[5])).size;
    const quizStarts = recentData.filter(row => row[2] === 'QUIZ_STARTED').length;
    const quizFinished = recentData.filter(row => row[2] === 'QUIZ_FINISHED').length;
    const execStarts = recentData.filter(row => row[2] === 'EXECUTION_STARTED').length;
    const execCompleted = recentData.filter(row => row[2] === 'EXECUTION_COMPLETE').length;
    const abandonments = recentData.filter(row => row[2].includes('ABANDONED')).length;
    
    const completionRateQuiz = quizStarts > 0 ? ((quizFinished / quizStarts) * 100).toFixed(1) : 0;
    const completionRateEmulator = execStarts > 0 ? ((execCompleted / execStarts) * 100).toFixed(1) : 0;
    const abandonmentRate = totalEvents > 0 ? ((abandonments / totalEvents) * 100).toFixed(1) : 0;
    
    // Relatório
    const report = [
      ['RELATÓRIO SEMANAL BITLAB', '', ''],
      [`Período: ${sevenDaysAgo.toLocaleDateString()} - ${new Date().toLocaleDateString()}`, '', ''],
      ['', '', ''],
      ['MÉTRICAS GERAIS', '', ''],
      ['Total de Eventos', totalEvents, ''],
      ['Estudantes Únicos', uniqueStudents, ''],
      ['', '', ''],
      ['QUIZ', '', ''],
      ['Quiz Iniciados', quizStarts, ''],
      ['Quiz Finalizados', quizFinished, ''],
      ['Taxa de Conclusão Quiz', completionRateQuiz + '%', ''],
      ['', '', ''],
      ['EMULADOR', '', ''],
      ['Execuções Iniciadas', execStarts, ''],
      ['Execuções Completas', execCompleted, ''],
      ['Taxa de Conclusão Emulador', completionRateEmulator + '%', ''],
      ['', '', ''],
      ['ABANDONO', '', ''],
      ['Total de Abandonos', abandonments, ''],
      ['Taxa de Abandono', abandonmentRate + '%', '']
    ];
    
    reportSheet.getRange(1, 1, report.length, 3).setValues(report);
    
    // Formatação  
    reportSheet.getRange(1, 1, 1, 3).setBackground('#1f4e79').setFontColor('#ffffff').setFontWeight('bold');
    reportSheet.getRange(4, 1, 1, 3).setBackground('#d9e1f2').setFontWeight('bold');
    reportSheet.getRange(8, 1, 1, 3).setBackground('#d9e1f2').setFontWeight('bold');
    reportSheet.getRange(13, 1, 1, 3).setBackground('#d9e1f2').setFontWeight('bold');
    reportSheet.getRange(18, 1, 1, 3).setBackground('#d9e1f2').setFontWeight('bold');
    
    reportSheet.autoResizeColumns(1, 3);
    
    console.log('Relatório semanal gerado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
  }
}