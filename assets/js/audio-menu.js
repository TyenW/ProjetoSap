(function(){
  const PREF_VOLUME = 'bitlab.audio.volume'; // 0..1
  const PREF_MUTED = 'bitlab.audio.muted';   // '1' | '0'

  function getStorage(){
    try { return window.localStorage; } catch(_) {}
    return null;
  }
  function getCookie(name){
    const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()\[\]\\\/\+^]/g,'\\$&') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(name, value){
    const days = 365;
    const date = new Date(Date.now() + days*24*60*60*1000);
    document.cookie = name + '=' + encodeURIComponent(value) + '; path=/; expires=' + date.toUTCString();
  }
  function readPref(key, fallback){
    const ls = getStorage();
    if (ls) {
      const v = ls.getItem(key);
      if (v != null) return v;
    }
    const c = getCookie(key);
    return (c != null) ? c : fallback;
  }
  function writePref(key, value){
    const ls = getStorage();
    try { if (ls) ls.setItem(key, String(value)); } catch(_){}
    try { setCookie(key, String(value)); } catch(_){}
  }

  function getAllAudios(){
    return Array.from(document.querySelectorAll('audio'));
  }

  function applyAudioPrefsTo(el, volume, muted){
    try {
      if (typeof volume === 'number' && !Number.isNaN(volume)) el.volume = Math.min(1, Math.max(0, volume));
      if (typeof muted === 'boolean') el.muted = muted;
    } catch(_){}
  }

  function ensureBgAudioLoaded(){
    const audio = document.getElementById('bg-music');
    if (!audio) return null;
    try {
      if (!audio.getAttribute('src')) {
        const ds = audio.getAttribute('data-src');
        if (ds) audio.setAttribute('src', ds);
      }
      // hint: keep preload none, the play() will fetch when needed
      return audio;
    } catch(_) { return audio; }
  }

  function tryPlayIfAudible(){
    const vol = parseFloat(readPref(PREF_VOLUME, '1')) || 1;
    const muted = readPref(PREF_MUTED, '0') === '1';
    const audio = ensureBgAudioLoaded();
    if (!audio) return;
    applyAudioPrefsTo(audio, vol, muted);
    if (!muted && vol > 0) {
      audio.play().catch(()=>{});
    }
  }

  function setAllAudios(volume, muted){
    getAllAudios().forEach(a => applyAudioPrefsTo(a, volume, muted));
  }

  function renderIcon(container, state){
    // state: 'muted' | 'low' | 'high'
    const svgMuted = '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3z"></path><path fill="currentColor" d="M16 9l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    const svgLow   = '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3z"></path><path d="M16 12a4 4 0 0 0-3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    const svgHigh  = '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3z"></path><path d="M16 12a4 4 0 0 0-3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19 12a7 7 0 0 0-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    container.innerHTML = (state === 'muted') ? svgMuted : (state === 'low' ? svgLow : svgHigh);
  }

  function initUI(){
    const toggle = document.getElementById('audioToggle');
    const pop = document.getElementById('audioPopover');
    const chkMute = document.getElementById('audioMute');
    const rng = document.getElementById('audioVolume');
    const val = document.getElementById('audioVolumeValue');
    const iconBox = document.getElementById('audioIcon');
    if (!toggle || !pop || !chkMute || !rng || !val || !iconBox) return;

    // Load prefs
    let volume = parseFloat(readPref(PREF_VOLUME, '1'));
    if (Number.isNaN(volume)) volume = 1;
    let muted = readPref(PREF_MUTED, '0') === '1';

    // Initialize UI
    chkMute.checked = muted;
    rng.value = Math.round(volume * 100);
    val.textContent = `${rng.value}%`;
    const state = (muted || volume === 0) ? 'muted' : (volume < 0.5 ? 'low' : 'high');
    renderIcon(iconBox, state);

    // Apply current to existing audios
    setAllAudios(volume, muted);

    function openMenu(){
      pop.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.addEventListener('click', onDocClick, { capture: true });
      document.addEventListener('keydown', onKey);
    }
    function closeMenu(){
      pop.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDocClick, { capture: true });
      document.removeEventListener('keydown', onKey);
    }
    function onDocClick(e){
      if (!pop.contains(e.target) && e.target !== toggle) closeMenu();
    }
    function onKey(e){ if (e.key === 'Escape') closeMenu(); }

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMenu(); else openMenu();
    });

    chkMute.addEventListener('change', () => {
      muted = chkMute.checked;
      writePref(PREF_MUTED, muted ? '1' : '0');
      setAllAudios(volume, muted);
      const st = (muted || volume === 0) ? 'muted' : (volume < 0.5 ? 'low' : 'high');
      renderIcon(iconBox, st);
      tryPlayIfAudible();
    });

    rng.addEventListener('input', () => {
      volume = Math.min(100, Math.max(0, parseInt(rng.value, 10) || 0)) / 100;
      val.textContent = `${Math.round(volume*100)}%`;
      writePref(PREF_VOLUME, String(volume));
      setAllAudios(volume, muted);
      const st = (muted || volume === 0) ? 'muted' : (volume < 0.5 ? 'low' : 'high');
      renderIcon(iconBox, st);
    });
    rng.addEventListener('change', tryPlayIfAudible);

    // Observe new audio elements and apply prefs
    const mo = new MutationObserver(() => setAllAudios(volume, muted));
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', initUI);
})();
