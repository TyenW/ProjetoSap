// Media optimization: lazy audio, lazy images, opportunistic WebP swaps
(function(){
	function supportsWebP() {
		try {
			const canvas = document.createElement('canvas');
			if (!canvas.getContext) return false;
			return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
		} catch (_) { return false; }
	}

	function webpEnabled() {
		// Opt-in via flag JS ou meta tag; padrão: desabilitado para evitar 404 em dev
		try {
			if (window.MEDIA_OPT && window.MEDIA_OPT.webp === true) return true;
			const meta = document.querySelector('meta[name="enable-webp"]');
			if (meta && /^(1|true|yes)$/i.test(meta.getAttribute('content') || '')) return true;
		} catch(_) {}
		return false;
	}

	function optimizeImages() {
		const imgs = Array.from(document.images || []);
		imgs.forEach(img => {
			if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
			if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
		});
	}

	async function trySwapBackground() {
		const body = document.body;
		if (!body) return;
		if (!supportsWebP() || !webpEnabled()) return;
		const webpBg = body.getAttribute('data-webp-bg');
		if (!webpBg) return;
		// Preserve repeat and other bg props; only swap image URL
		body.style.backgroundImage = `url('${webpBg}')`;
		body.style.backgroundRepeat = body.style.backgroundRepeat || 'repeat';
		body.style.imageRendering = body.style.imageRendering || 'pixelated';
	}

	async function trySwapInlineImages() {
		if (!supportsWebP() || !webpEnabled()) return;
		const imgs = Array.from(document.images || []);
		imgs.forEach((img) => {
			const candidate = img.getAttribute('data-webp');
			if (candidate) {
				img.setAttribute('src', candidate);
			}
		});
	}

	function initLazyAudio() {
		const audio = document.getElementById('bg-music');
		const muteBtn = document.getElementById('muteToggle');
		if (!audio || !muteBtn) return;

		const hasScriptJs = !!document.querySelector('script[src*="assets/js/script.js"]');

		// If HTML still has src, migrate to data-src to avoid auto-download
		const currentSrc = audio.getAttribute('src');
		if (currentSrc) {
			audio.setAttribute('data-src', currentSrc);
			audio.removeAttribute('src');
		}
		audio.setAttribute('preload', 'none');
		audio.muted = true;
		audio.autoplay = false;

		// Ensure initial icon shows muted
		if (muteBtn && !muteBtn.dataset.mediaOptInit) {
			muteBtn.textContent = '🔇';
			muteBtn.dataset.mediaOptInit = '1';
		}

		const onFirstClick = async (e) => {
			try {
				if (!audio.getAttribute('src')) {
					const ds = audio.getAttribute('data-src');
					if (ds) {
						audio.setAttribute('src', ds);
						await audio.load();
					}
				}
				// Toggle muted state based on current
				audio.muted = !audio.muted;
				if (!audio.paused && audio.muted) {
					try { await audio.pause(); } catch {}
				} else {
					try { await audio.play(); } catch {}
				}
				muteBtn.textContent = audio.muted ? '🔇' : '🔊';
				muteBtn.setAttribute('aria-pressed', String(!audio.muted));
				muteBtn.setAttribute('aria-label', audio.muted ? 'Ativar som' : 'Desativar som');

				// If script.js exists (index), remove our handler to avoid double toggle next times
				if (hasScriptJs) {
					muteBtn.removeEventListener('click', onFirstClick);
				}
			} catch (_) {}
		};

		muteBtn.addEventListener('click', onFirstClick);
	}

	document.addEventListener('DOMContentLoaded', function(){
		optimizeImages();
		trySwapBackground();
		trySwapInlineImages();
		initLazyAudio();
	});
})();
