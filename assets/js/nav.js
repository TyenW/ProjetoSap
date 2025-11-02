document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.site-header .nav-toggle');
  const nav = document.getElementById('site-nav');
  if (!header || !toggle || !nav) return;

  function closeMenu() {
    header.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Fecha ao navegar por um link
  nav.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.closest('a')) closeMenu();
  });

  // Fecha com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
});
