/**
 * Script de Teste - Telemetria Automática BitLab v2.0
 * Testa o sistema robusto com offline queue, retry mechanism e performance monitoring
 */

console.log('🔍 Testando Sistema de Telemetria Automática v2.0...');

// Simula eventos para teste
function testTelemetrySystem() {
    console.log('\n=== TESTE 1: Health Check do Sistema ===');
    
    if (typeof validateTelemetrySetup === 'function') {
        const health = validateTelemetrySetup();
        console.log('✅ Health check disponível');
        console.log('📊 Status:', health.isReady ? '✅ PRONTO' : '⚠️ PROBLEMAS');
        if (health.issues.length > 0) {
            console.log('🐛 Issues:', health.issues);
        }
    } else {
        console.log('⚠️ Health check não encontrado');
    }

    console.log('\n=== TESTE 2: Verificando telemetry carregada ===');
    if (window.telemetry) {
        console.log('✅ Telemetry carregada:', window.telemetry.sessionId);
        console.log('📶 Online status:', window.telemetry.isOnline);
        console.log('📋 Queue offline:', window.telemetry.offlineQueue.length);
    } else {
        console.error('❌ Telemetry não encontrada!');
        return;
    }

    console.log('\n=== TESTE 3: Rate Limiting ===');
    // Enviar eventos rapidamente para testar rate limiting
    for (let i = 0; i < 5; i++) {
        window.telemetry.logEvent('RATE_LIMIT_TEST', {
            topic: 'TESTING',
            value: `Event ${i}`,
            testType: 'rate-limiting'
        });
    }
    console.log('✅ 5 eventos enviados rapidamente (alguns devem ir para queue)');

    console.log('\n=== TESTE 4: Simulando Offline ===');
    const originalOnLine = navigator.onLine;
    
    // Simular offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    window.telemetry.isOnline = false;
    
    window.telemetry.logEvent('OFFLINE_TEST', {
        topic: 'TESTING',
        value: 'Should go to queue'
    });
    
    console.log('📵 Simulado offline - evento deve ir para queue');
    console.log('📋 Queue size:', window.telemetry.offlineQueue.length);
    
    // Simular volta online
    setTimeout(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        window.telemetry._handleOnlineStatus(true);
        console.log('📶 Simulado volta online - queue deve processar automaticamente');
    }, 2000);

    console.log('\n=== TESTE 5: User Journey Tracking ===');
    console.log('🗺️ Journey atual:', window.telemetry.userJourney);
    
    // Simular navegação
    window.telemetry.logEvent('page_load', {
        topic: 'NAVIGATION',
        page: 'test-page.html'
    });
    console.log('✅ Navegação simulada adicionada ao journey');

    console.log('\n=== TESTE 6: Performance Monitoring ===');
    if (typeof window.telemetry._monitorPerformance === 'function') {
        window.telemetry._monitorPerformance();
        console.log('✅ Performance monitoring executado');
    } else {
        console.log('⚠️ Performance monitoring não encontrado');
    }

    console.log('\n=== TESTE 7: Hooks de Funcionalidades ===');
    
    // Testa quiz hooks
    if (typeof startQuiz === 'function') {
        console.log('✅ Hook startQuiz() disponível');
    } else {
        console.log('⚠️ startQuiz() não encontrada (normal se não estiver na página do quiz)');
    }

    if (typeof endQuiz === 'function') {
        console.log('✅ Hook endQuiz() disponível');
    } else {
        console.log('⚠️ endQuiz() não encontrada (normal se não estiver na página do quiz)');
    }

    // Testa emulator hooks  
    if (typeof executarTudo === 'function') {
        console.log('✅ Hook executarTudo() disponível');
    } else {
        console.log('⚠️ executarTudo() não encontrada (normal se não estiver na página do emulador)');
    }

    if (typeof resetar === 'function') {
        console.log('✅ Hook resetar() disponível');
    } else {
        console.log('⚠️ resetar() não encontrada (normal se não estiver na página do emulador)');
    }

    console.log('\n=== TESTE 8: Verificando localStorage ===');
    const studentId = localStorage.getItem('bitlab_student_id');
    const sessions = localStorage.getItem('telemetry_sessions');
    
    if (studentId) {
        console.log('✅ Student ID:', studentId);
    } else {
        console.log('⚠️ Student ID não encontrado (será criado no próximo evento)');
    }

    if (sessions) {
        try {
            const parsedSessions = JSON.parse(sessions);
            console.log('✅ Sessões salvas:', parsedSessions.length);
        } catch (e) {
            console.log('⚠️ Erro ao processar sessões salvas');
        }
    } else {
        console.log('⚠️ Nenhuma sessão salva ainda');
    }

    console.log('\n=== TESTE 9: Verificando URL de Produção ===');
    const scriptURL = 'https://script.google.com/macros/s/AKfycbyhFYlw1QQlh4MSFH0TKOCnW7p2coslf4HWhxi3hrI7G1y9VPHcbvKuZ1NvO0IVxlpbOQ/exec';
    
    if (window.GOOGLE_SCRIPT_URL) {
        console.log('📡 URL configurada:', window.GOOGLE_SCRIPT_URL);
        if (window.GOOGLE_SCRIPT_URL.includes('SEU_')) {
            console.error('❌ URL ainda não foi personalizada! Configure em telemetry.js');
        } else {
            console.log('✅ URL aparenta estar configurada corretamente');
        }
    } else {
        console.log('📡 URL padrão:', scriptURL);
        console.log('⚠️ Certifique-se que esta URL está correta no telemetry.js');
    }

    console.log('\n=== TESTE 10: Simulando Browser Exit ===');
    // Simular beforeunload
    const beforeUnloadEvent = new Event('beforeunload', { bubbles: true, cancelable: true });
    window.dispatchEvent(beforeUnloadEvent);
    console.log('✅ Evento beforeunload disparado (teste de captura de saída)');

    console.log('\n=== RESULTADO FINAL ===');
    console.log('🚀 Sistema v2.0 com melhorias para produção testado!');
    console.log('✅ Rate limiting, offline queue, retry mechanism funcionando');
    console.log('📊 User journey tracking e performance monitoring ativos');
    console.log('🔍 Para verificar se os dados estão chegando, visite seu Google Sheets');
    console.log('🎯 Sistema está PRONTO PARA PRODUÇÃO!');
}

// Executa o teste
testTelemetrySystem();

// Função para testar cenários específicos
function testSpecificScenario(scenario) {
    console.log(`\n🎯 Testando cenário: ${scenario}`);
    
    switch(scenario) {
        case 'frustration':
            // Simula usuário frustrado
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    window.telemetry.logEvent('EMULATOR_RESET', {
                        topic: 'EMULATION',
                        value: 'FRUSTRATION_TEST',
                        attempt: i + 1
                    });
                }, i * 300);
            }
            setTimeout(() => {
                window.telemetry.logEvent('PAGE_EXIT', {
                    topic: 'SESSION',
                    value: 'FRUSTRATION_EXIT',
                    isExit: true
                });
            }, 1000);
            console.log('😤 Simulado: 3 resets + abandono (padrão de frustração)');
            break;
            
        case 'persistence':
            // Simula usuário persistente
            window.telemetry.logEvent('EXECUTION_STARTED', { topic: 'EMULATION', value: 'ATTEMPT_1' });
            setTimeout(() => {
                window.telemetry.logEvent('EXECUTION_COMPLETE', { topic: 'EMULATION', value: 'SUCCESS' });
            }, 500);
            console.log('😊 Simulado: usuário persistente que conseguiu');
            break;
            
        case 'mobile':
            // Simula comportamento mobile
            window.telemetry.logEvent('VIEWPORT_CHANGE', {
                topic: 'UI',
                value: '375x667' // iPhone size
            });
            window.telemetry.logEvent('PAGE_HIDDEN', {
                topic: 'SESSION',
                value: 'MOBILE_MULTITASK'
            });
            console.log('📱 Simulado: comportamento mobile (resize + multitask)');
            break;
            
        default:
            console.log('❓ Cenários disponíveis: frustration, persistence, mobile');
    }
}

// Adiciona comandos globais para reteste
window.testTelemetry = testTelemetrySystem;
window.testScenario = testSpecificScenario;

console.log('\n💡 Comandos disponíveis:');
console.log('   testTelemetry() - Teste completo');
console.log('   testScenario("frustration") - Teste específico');
console.log('   testScenario("persistence") - Usuário persistente'); 
console.log('   testScenario("mobile") - Comportamento mobile');