/**
 * Service Worker Registration
 * Registers PWA service worker for offline-first app
 * Runs early in page lifecycle to start caching
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js', { scope: '/' })
      .then((registration) => {
        console.log('Service Worker registered:', registration);
        
        // Check for updates periodically (every 24 hours)
        setInterval(() => {
          registration.update();
        }, 24 * 60 * 60 * 1000);
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error);
      });
  });

  // Listen for messages from sw (e.g., updates available)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('Cache updated in background');
      // Optionally notify user that new version is available
    }
  });
}

// Handle online/offline status
window.addEventListener('online', () => {
  console.log('Back online');
  document.body.classList.remove('offline');
  document.body.classList.add('online');
});

window.addEventListener('offline', () => {
  console.log('Gone offline');
  document.body.classList.add('offline');
  document.body.classList.remove('online');
});

// Set initial online status
if (!navigator.onLine) {
  document.body.classList.add('offline');
}
