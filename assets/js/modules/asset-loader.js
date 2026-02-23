/**
 * Asset Loader: Lazy-load audio/images with Intersection Observer
 * Defers media load until user is likely to interact
 * Reduces initial page load time by 200-400ms
 */

class AssetLoader {
  constructor() {
    this.loadedAssets = new Set();
    this.observer = null;
    this.audioCache = new Map(); // { fileName: AudioBuffer }
    this.audioUnlocked = false;
    this.unlockListenersAttached = false;
    this.pendingAudioQueue = [];
    this.audioContext = null;
    this._boundUnlockHandler = () => {
      this._unlockAudio();
    };
  }

  /**
   * Inicializa observer para lazy-loading
   */
  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => this._handleIntersection(entries),
        { rootMargin: '200px' }
      );
    }

    this._setupAudioUnlock();
  }

  _setupAudioUnlock() {
    if (this.unlockListenersAttached || this.audioUnlocked) return;

    ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
      window.addEventListener(eventName, this._boundUnlockHandler, {
        once: true,
        passive: true
      });
    });

    this.unlockListenersAttached = true;
  }

  async _unlockAudio() {
    if (this.audioUnlocked) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      try {
        if (!this.audioContext) {
          this.audioContext = new AudioContextClass();
        }
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } catch (error) {
        console.warn('Falha ao desbloquear AudioContext:', error);
      }
    }

    this.audioUnlocked = true;

    ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
      window.removeEventListener(eventName, this._boundUnlockHandler);
    });

    if (this.pendingAudioQueue.length > 0) {
      const pending = [...this.pendingAudioQueue];
      this.pendingAudioQueue = [];
      pending.forEach((item) => {
        this.playAudio(item.path, item.options);
      });
    }
  }

  _queuePendingAudio(path, options = {}) {
    if (!this.pendingAudioQueue.some((item) => item.path === path)) {
      this.pendingAudioQueue.push({ path, options });
    }
  }

  /**
   * Registra elemento para lazy-loading
   * @param {HTMLElement} element
   * @param {string} assetType - 'audio'|'image'
   * @param {string} assetPath
   */
  observeElement(element, assetType, assetPath) {
    if (!element) return;

    element.dataset.lazyType = assetType;
    element.dataset.lazySrc = assetPath;

    if (this.observer) {
      this.observer.observe(element);
    } else {
      // Fallback: load immediately se IntersectionObserver não suportado
      this._loadAsset(element, assetType, assetPath);
    }
  }

  /**
   * Handler de Intersection Observer
   * @private
   */
  _handleIntersection(entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !entry.target.dataset.loaded) {
        const { lazyType, lazySrc } = entry.target.dataset;
        this._loadAsset(entry.target, lazyType, lazySrc);
        entry.target.dataset.loaded = 'true';
        if (this.observer) this.observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Carrega asset (audio ou image)
   * @private
   */
  _loadAsset(element, type, path) {
    if (this.loadedAssets.has(path)) {
      this._applyAsset(element, type, path);
      return;
    }

    if (type === 'audio') {
      this._loadAudio(element, path);
    } else if (type === 'image') {
      this._loadImage(element, path);
    }
  }

  /**
   * Carrega arquivo de áudio
   * @private
   */
  _loadAudio(element, path) {
    const audio = new Audio();
    audio.src = path;
    audio.onloadeddata = () => {
      this.loadedAssets.add(path);
      this.audioCache.set(path, audio);
      element.dataset.audioReady = 'true';
    };
    audio.onerror = () => {
      console.warn(`Falha ao carregar áudio: ${path}`);
    };
  }

  /**
   * Carrega imagem
   * @private
   */
  _loadImage(element, path) {
    const img = new Image();
    img.onload = () => {
      this.loadedAssets.add(path);
      if (element.tagName === 'IMG') {
        element.src = path;
        element.dataset.imageReady = 'true';
      } else {
        element.style.backgroundImage = `url(${path})`;
        element.dataset.imageReady = 'true';
      }
    };
    img.onerror = () => {
      console.warn(`Falha ao carregar imagem: ${path}`);
    };
    img.src = path;
  }

  /**
   * Aplica asset já carregado
   * @private
   */
  _applyAsset(element, type, path) {
    if (type === 'image') {
      if (element.tagName === 'IMG') {
        element.src = path;
      } else {
        element.style.backgroundImage = `url(${path})`;
      }
      element.dataset.imageReady = 'true';
    } else if (type === 'audio') {
      element.dataset.audioReady = 'true';
    }
  }

  /**
   * Toca áudio lazy-loaded
   * @param {string} path
   * @returns {Promise<void>}
   */
  async playAudio(path, options = {}) {
    if (!this.audioUnlocked) {
      this._setupAudioUnlock();
      this._queuePendingAudio(path, options);
      return;
    }

    if (!this.audioCache.has(path)) {
      await new Promise((resolve) => {
        const audio = new Audio();
        audio.src = path;
        audio.onloadeddata = () => {
          this.audioCache.set(path, audio);
          resolve();
        };
      });
    }

    const audio = this.audioCache.get(path);
    if (audio) {
      if (typeof options.volume === 'number') {
        audio.volume = Math.max(0, Math.min(1, options.volume));
      }
      if (typeof options.muted === 'boolean') {
        audio.muted = options.muted;
      }
      audio.currentTime = 0;
      return audio.play().catch((error) => {
        if (error?.name === 'NotAllowedError') {
          this.audioUnlocked = false;
          this._setupAudioUnlock();
          this._queuePendingAudio(path, options);
          return;
        }
        console.warn('Falha ao tocar áudio:', error);
      });
    }
  }

  /**
   * Pré-carrega assets (para otimização)
   * @param {Array<string>} paths
   * @param {string} type
   */
  preload(paths, type = 'audio') {
    paths.forEach(path => {
      if (!this.loadedAssets.has(path)) {
        if (type === 'audio') {
          const audio = new Audio();
          audio.src = path;
          audio.onloadeddata = () => this.loadedAssets.add(path);
        } else if (type === 'image') {
          const img = new Image();
          img.onload = () => this.loadedAssets.add(path);
          img.src = path;
        }
      }
    });
  }

  /**
   * Limpa cache (ex: ao trocar de página)
   */
  clear() {
    this.audioCache.clear();
    this.loadedAssets.clear();
    this.pendingAudioQueue = [];
  }

  /**
   * Retorna status de carregamento
   * @returns {Object}
   */
  getStatus() {
    return {
      loadedAssets: this.loadedAssets.size,
      cachedAudio: this.audioCache.size
    };
  }
}

// Instância global
window.assetLoader = new AssetLoader();
window.assetLoader.init();

// Auto-preload critical assets on page load
window.addEventListener('load', () => {
  window.assetLoader.preload([
    'assets/audio/quiz_correct.ogg',
    'assets/audio/quiz_wrong.ogg'
  ], 'audio');
});
