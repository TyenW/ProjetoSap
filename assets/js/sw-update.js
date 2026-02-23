/**
 * Service Worker Update Handler
 * Detect new SW version and auto-reload page
 */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 Nova versão do app detectada. Recarregando...');
    window.location.reload();
  });

  // Periodically check for updates (a cada 1 hora)
  setInterval(() => {
    navigator.serviceWorker.ready.then((registration) => {
      registration.update();
    });
  }, 60 * 60 * 1000); // 1 hour

  // Check for updates when page regains focus
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }
  });

  // Check for updates on page load
  navigator.serviceWorker.ready.then((registration) => {
    registration.update();
  });

  // Listen for new SW waiting (alternative approach with user notification)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const hasSeenUpdate = sessionStorage.getItem('swUpdateDetected');
    if (!hasSeenUpdate) {
      sessionStorage.setItem('swUpdateDetected', 'true');
      // Reload silently (sem bothering user)
      window.location.reload();
    }
  });
}
