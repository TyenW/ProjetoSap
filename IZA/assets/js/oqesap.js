
document.addEventListener('DOMContentLoaded', function() {
  const btns = document.querySelectorAll('.mini-menu .li-btn');
  function setActiveBtn() {
    btns.forEach(btn => btn.classList.remove('active'));
    let hash = window.location.hash || '#introducao';
    let found = false;
    btns.forEach(btn => {
      if(btn.getAttribute('onclick').includes(hash.replace('#',''))) {
        btn.classList.add('active');
        found = true;
      }
    });
    // Se não encontrou, ativa o primeiro
    if(!found && btns[0]) btns[0].classList.add('active');
  }
  setActiveBtn();
  window.addEventListener('hashchange', setActiveBtn);
});
