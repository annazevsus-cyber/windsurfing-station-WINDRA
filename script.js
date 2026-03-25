// Smooth scrolling is handled by CSS scroll-behavior property

// Form submission handler
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const name = this.querySelector('input[type="text"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const message = this.querySelector('textarea').value;

        // Validate form
        if (!name || !email || !message) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        // In real scenario, send data to server
        // For now, show success message
        showSuccessMessage();
        
        // Reset form
        this.reset();
    });
}

function showSuccessMessage() {
    const form = document.querySelector('.contact-form');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = '✓ Спасибо! Мы получили ваше сообщение';
    successDiv.style.cssText = `
        padding: 15px 20px;
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
        border-radius: 10px;
        border: none;
        margin-bottom: 20px;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;

    form.parentElement.insertBefore(successDiv, form);

    // Remove message after 5 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => successDiv.remove(), 300);
    }, 5000);
}

// Add animation styles dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }
`;
document.head.appendChild(style);

// Add click animations to buttons
document.querySelectorAll('.cta-button, .submit-btn').forEach(button => {
    button.addEventListener('click', function() {
        this.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.style.transition = 'transform 0.1s';
            this.style.transform = 'scale(1)';
        }, 100);
    });
});

// Slightly slow the rose-card video to make camera shake feel less aggressive.
const roseCardVideo = document.querySelector('.about-card-rose .card-video');
if (roseCardVideo) {
    const playlist = (roseCardVideo.dataset.playlist || '')
        .split('|')
        .map(item => item.trim())
        .filter(Boolean);
    let currentVideoIndex = 0;

    const playCurrentRoseVideo = () => {
        if (!playlist.length) {
            roseCardVideo.defaultPlaybackRate = 0.78;
            roseCardVideo.playbackRate = 0.78;
            return;
        }

        roseCardVideo.src = playlist[currentVideoIndex];
        roseCardVideo.load();
        const playPromise = roseCardVideo.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
                // Ignore autoplay blocking; browser will allow play after a user gesture.
            });
        }
    };

    roseCardVideo.defaultPlaybackRate = 0.78;
    roseCardVideo.playbackRate = 0.78;

    if (playlist.length) {
        roseCardVideo.addEventListener('ended', () => {
            currentVideoIndex = (currentVideoIndex + 1) % playlist.length;
            playCurrentRoseVideo();
        });

        playCurrentRoseVideo();
    }
}

// Mobile burger menu
const burger = document.querySelector('.burger');
const navMenu = document.querySelector('.nav-menu');

if (burger && navMenu) {
    burger.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        burger.classList.toggle('open', isOpen);
        burger.setAttribute('aria-expanded', String(isOpen));
    });

    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            burger.classList.remove('open');
            burger.setAttribute('aria-expanded', 'false');
        });
    });

    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !burger.contains(e.target)) {
            navMenu.classList.remove('open');
            burger.classList.remove('open');
            burger.setAttribute('aria-expanded', 'false');
        }
    });
}

// Card click sound (generated in browser, no external audio file needed)
let audioContext;
let lastHoverSoundAt = 0;
let hasPlayedIntroMusic = false;
let introMusicSession = null;
let introResetTimerId = null;
let soundtrackButtonResetId = null;

function getAudioContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
        return null;
    }

    if (!audioContext) {
        audioContext = new AudioCtx();
    }

    return audioContext;
}

function unlockAudioContext() {
    const ctx = getAudioContext();
    if (!ctx) {
        return;
    }

    if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {
            // Ignore resume failures; next gesture will retry.
        });
    }
}

async function ensureAudioReady() {
    const ctx = getAudioContext();
    if (!ctx) {
        return null;
    }

    if (ctx.state === 'suspended') {
        try {
            await ctx.resume();
        } catch {
            return null;
        }
    }

    return ctx.state === 'running' ? ctx : null;
}

// Browsers can block audio until first explicit user gesture.
['pointerdown', 'touchstart', 'keydown'].forEach(eventName => {
    document.addEventListener(eventName, unlockAudioContext, { once: true });
});

function playCardSound() {
    const ctx = getAudioContext();
    if (!ctx) {
        return;
    }

    if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
            playCardSound();
        }).catch(() => {
            // If browser still blocks audio, skip silently.
        });
        return;
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    const shimmerFilter = ctx.createBiquadFilter();
    const toneA = ctx.createOscillator();
    const toneAGain = ctx.createGain();
    const toneB = ctx.createOscillator();
    const toneBGain = ctx.createGain();

    // Frost-fantasy hover cue: soft bell + icy shimmer.
    shimmerFilter.type = 'highshelf';
    shimmerFilter.frequency.setValueAtTime(1900, now);
    shimmerFilter.gain.setValueAtTime(5, now);

    toneA.type = 'triangle';
    toneA.frequency.setValueAtTime(760, now);
    toneA.frequency.exponentialRampToValueAtTime(560, now + 0.18);
    toneAGain.gain.setValueAtTime(0.0001, now);
    toneAGain.gain.exponentialRampToValueAtTime(0.1, now + 0.02);
    toneAGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    toneB.type = 'sine';
    toneB.frequency.setValueAtTime(1140, now + 0.015);
    toneB.frequency.exponentialRampToValueAtTime(860, now + 0.2);
    toneBGain.gain.setValueAtTime(0.0001, now + 0.015);
    toneBGain.gain.exponentialRampToValueAtTime(0.05, now + 0.035);
    toneBGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    masterGain.gain.value = 0.9;

    toneA.connect(toneAGain);
    toneB.connect(toneBGain);
    toneAGain.connect(shimmerFilter);
    toneBGain.connect(shimmerFilter);
    shimmerFilter.connect(masterGain);
    masterGain.connect(ctx.destination);

    toneA.start(now);
    toneB.start(now + 0.015);
    toneA.stop(now + 0.22);
    toneB.stop(now + 0.24);
}

function stopIntroMusic(fadeSeconds = 0.5) {
    if (!introMusicSession) {
        hasPlayedIntroMusic = false;
        return;
    }

    const { ctx, master, nodes } = introMusicSession;
    const stopAt = ctx.currentTime + fadeSeconds;

    try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
        master.gain.exponentialRampToValueAtTime(0.0001, stopAt);
    } catch {
        // Ignore envelope failures; we still attempt node stop.
    }

    nodes.forEach(node => {
        try {
            node.stop(stopAt + 0.05);
        } catch {
            // Node may already be stopped.
        }
    });

    introMusicSession = null;
    hasPlayedIntroMusic = false;

    if (introResetTimerId) {
        clearTimeout(introResetTimerId);
        introResetTimerId = null;
    }
}

function playIntroMusic30s() {
    const ctx = getAudioContext();
    if (!ctx || hasPlayedIntroMusic) {
        return;
    }

    hasPlayedIntroMusic = true;

    const now = ctx.currentTime;
    const duration = 30;
    const fadeIn = 4;
    const fadeOut = 6;

    const master = ctx.createGain();
    const lowpass = ctx.createBiquadFilter();
    const activeNodes = [];
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1700, now);
    lowpass.Q.value = 0.8;

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.12, now + fadeIn);
    master.gain.setValueAtTime(0.12, now + duration - fadeOut);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    lowpass.connect(master);
    master.connect(ctx.destination);

    const padNotes = [146.83, 220.0, 293.66];
    const padOscillators = [];

    padNotes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = index === 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((index - 1) * 4, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.025 + index * 0.004, now + 3 + index * 0.4);
        gain.gain.setValueAtTime(0.025 + index * 0.004, now + duration - fadeOut - 0.8);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration - 0.1);

        osc.connect(gain);
        gain.connect(lowpass);
        osc.start(now);
        osc.stop(now + duration + 0.1);
        padOscillators.push(osc);
        activeNodes.push(osc);
    });

    // Slow movement gives a choir-like frozen ambience.
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, now);
    lfoGain.gain.value = 7;
    lfo.connect(lfoGain);
    padOscillators.forEach(osc => {
        lfoGain.connect(osc.detune);
    });
    lfo.start(now);
    lfo.stop(now + duration);
    activeNodes.push(lfo);

    // Icy bells over the pad.
    for (let t = 2.5; t < duration - 2; t += 4.2) {
        const start = now + t;
        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(880, start);
        bell.frequency.exponentialRampToValueAtTime(660, start + 1.1);
        bellGain.gain.setValueAtTime(0.0001, start);
        bellGain.gain.exponentialRampToValueAtTime(0.035, start + 0.04);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, start + 1.2);
        bell.connect(bellGain);
        bellGain.connect(lowpass);
        bell.start(start);
        bell.stop(start + 1.25);
        activeNodes.push(bell);
    }

    introMusicSession = {
        ctx,
        master,
        nodes: activeNodes
    };

    if (introResetTimerId) {
        clearTimeout(introResetTimerId);
    }

    introResetTimerId = setTimeout(() => {
        hasPlayedIntroMusic = false;
        introMusicSession = null;
        introResetTimerId = null;
    }, (duration + 0.4) * 1000);
}

async function forceStartIntroMusic() {
    const ctx = await ensureAudioReady();
    if (!ctx) {
        return false;
    }

    stopIntroMusic(0.15);
    hasPlayedIntroMusic = false;
    playIntroMusic30s();

    return Boolean(introMusicSession);
}

function tryStartIntroMusic() {
    const ctx = getAudioContext();
    if (!ctx || hasPlayedIntroMusic) {
        return;
    }

    if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
            playIntroMusic30s();
        }).catch(() => {
            // Browser can still block autoplay until user interaction.
        });
        return;
    }

    playIntroMusic30s();
}

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(tryStartIntroMusic, 150);
});

['pointerdown', 'touchstart', 'keydown'].forEach(eventName => {
    document.addEventListener(eventName, tryStartIntroMusic, { once: true });
});

// Sound only for interactive buttons/links.
document.querySelectorAll('.cta-button, .submit-btn, .social-btn').forEach(button => {
    button.addEventListener('mouseenter', () => {
        const now = Date.now();
        if (now - lastHoverSoundAt < 180) {
            return;
        }

        lastHoverSoundAt = now;
        playCardSound();
    });

    button.addEventListener('click', () => {
        playCardSound();
    });
});

const soundtrackButton = document.getElementById('soundtrack-btn');

function setSoundtrackButtonPlayingState(isPlaying) {
    if (!soundtrackButton) {
        return;
    }

    if (soundtrackButtonResetId) {
        clearTimeout(soundtrackButtonResetId);
        soundtrackButtonResetId = null;
    }

    if (isPlaying) {
        soundtrackButton.textContent = 'Саундтрек играет...';
        soundtrackButton.disabled = true;
        soundtrackButtonResetId = setTimeout(() => {
            soundtrackButton.textContent = 'Включить саундтрек 30с';
            soundtrackButton.disabled = false;
            soundtrackButtonResetId = null;
        }, 30500);
        return;
    }

    soundtrackButton.textContent = 'Включить саундтрек 30с';
    soundtrackButton.disabled = false;
}

if (soundtrackButton) {
    soundtrackButton.addEventListener('click', async () => {
        soundtrackButton.textContent = 'Запуск...';
        soundtrackButton.disabled = true;

        const started = await forceStartIntroMusic();
        if (started) {
            setSoundtrackButtonPlayingState(true);
            return;
        }

        soundtrackButton.textContent = 'Нажмите еще раз';
        soundtrackButton.disabled = false;
    });
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe cards for animation
document.querySelectorAll('.about-card, .spot-card, .fact-item').forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
});

console.log('WindsurfKG website loaded successfully! 🏄');
