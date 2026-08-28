import { AYAKA_TOKENS } from "../ayaka-tokens.js";
/**
 * Required services (cordis fiber inject — the loader passes all module
 * exports as an object plugin). `theme` is the ThemeRuntime service owned by
 * ui-theme; without declaring it here, `ctx.theme` is unreachable and the
 * loader throws `cannot get property "theme" without inject`.
 */
export const inject = ['theme'];
/** Plugin id used as the override-token source identity. */
const PLUGIN_ID = '@l-vm2k/dsh-ayaka-theme';
const VOICE_LINES = [
    {
        audio: '/ayaka-assets/ayaka-1.wav',
        text: '神里流 · 霜灭！',
    },
    {
        audio: '/ayaka-assets/ayaka-2.wav',
        text: '稻妻神里流太刀术 · 皆传 —— 神里绫华，参上！',
    },
    {
        audio: '/ayaka-assets/ayaka-3.mp3',
        text: '谢谢你, 我真的很开心',
    },
];
/**
 * Client plugin body: register Ayaka themes and spawn the pet + petals.
 * @param ctx - client cordis context with ctx.theme injected by ui-theme.
 */
export function apply(ctx) {
    // --- 1. Register Ayaka themes through the ThemeRuntime API ---
    const lightTokens = {};
    const darkTokens = {};
    for (const [name, modes] of Object.entries(AYAKA_TOKENS)) {
        lightTokens[name] = modes.light;
        darkTokens[name] = modes.dark;
    }
    const disposeLight = ctx.theme.register({
        id: 'ayaka-light',
        colorScheme: 'light',
        tokens: lightTokens,
    });
    const disposeDark = ctx.theme.register({
        id: 'ayaka-dark',
        colorScheme: 'dark',
        tokens: darkTokens,
    });
    ctx.effect(() => ctx.theme.overrideTokens(PLUGIN_ID, AYAKA_TOKENS), 'ayaka-theme: token override layer');
    ctx.effect(() => () => {
        disposeLight();
        disposeDark();
    }, 'ayaka-theme: theme disposers');
    // --- 2. Spawn the portrait + head pet + sakura petals (DOM overlay) ---
    const spawnPet = () => {
        if (typeof document === 'undefined')
            return;
        if (document.getElementById('ayaka-pet') !== null)
            return;
        // Inject the CSS.
        const style = document.createElement('style');
        style.id = 'ayaka-pet-style';
        style.textContent = PET_CSS;
        document.head.appendChild(style);
        // --- 2a. Background image (very faint, covers entire viewport) ---
        const bg = document.createElement('div');
        bg.id = 'ayaka-bg';
        bg.innerHTML = '<img src="/ayaka-assets/ayaka-bg.jpg" alt="" />';
        document.body.appendChild(bg);
        // --- 2b. Ayaka portrait on the right edge (semi-transparent, above bg) ---
        const portrait = document.createElement('div');
        portrait.id = 'ayaka-portrait';
        portrait.innerHTML = '<img src="/ayaka-assets/ayaka-portrait.png" alt="Ayaka" />';
        document.body.appendChild(portrait);
        // --- 2b. Ayaka chibi head pet (resting on the chat input top edge) ---
        const pet = document.createElement('div');
        pet.id = 'ayaka-pet';
        pet.innerHTML = `
      <div class="ayaka-pet-speech"></div>
      <div class="ayaka-pet-head-wrap">
        <img src="/ayaka-assets/ayaka-head.png" alt="Ayaka" class="ayaka-pet-head-img" />
      </div>
    `;
        document.body.appendChild(pet);
        // Track the chat input element to position the head on its top edge.
        const updatePetPosition = () => {
            // The input card is the element with the input-major background.
            // We search for the textarea or the input card container.
            const textarea = document.querySelector('textarea');
            let inputCard = null;
            if (textarea !== null) {
                // Walk up to find the card container (has border-radius + background)
                let el = textarea;
                while (el !== null && el !== document.body) {
                    const style = getComputedStyle(el);
                    if (style.borderRadius !== '0px' && style.borderRadius !== '' &&
                        (style.background.includes('input-major') || el.classList.toString().includes('card') || el.querySelector('textarea') !== null)) {
                        inputCard = el;
                        break;
                    }
                    el = el.parentElement;
                }
                // Fallback: just use the textarea's parent
                if (inputCard === null)
                    inputCard = textarea.parentElement;
            }
            if (inputCard !== null) {
                const rect = inputCard.getBoundingClientRect();
                // Head sits on top-right of the input card, half overlapping the edge
                pet.style.bottom = 'auto';
                pet.style.top = 'auto';
                pet.style.left = 'auto';
                pet.style.right = (window.innerWidth - rect.right + 12) + 'px';
                pet.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
            }
            else {
                // Fallback: use composer height variable
                pet.style.right = '48px';
                pet.style.bottom = 'calc(var(--dsh-composer-height, 152px) + 8px)';
            }
        };
        // Update position on load + resize + scroll + interval (input height changes)
        updatePetPosition();
        window.addEventListener('resize', updatePetPosition);
        // Poll for input height changes (textarea grows/shrinks)
        setInterval(updatePetPosition, 500);
        const speech = pet.querySelector('.ayaka-pet-speech');
        const headWrap = pet.querySelector('.ayaka-pet-head-wrap');
        let lineIndex = 0;
        let currentAudio = null;
        let speechTimer = null;
        /**
         * Play one voice line: show the text bubble and play the audio.
         * The bubble stays visible for the audio's full duration.
         * Click-only — no auto-play.
         */
        const playLine = () => {
            if (currentAudio !== null) {
                currentAudio.pause();
                currentAudio = null;
            }
            if (speechTimer !== null) {
                clearTimeout(speechTimer);
                speechTimer = null;
            }
            const line = VOICE_LINES[lineIndex % VOICE_LINES.length];
            if (line === undefined)
                return;
            lineIndex++;
            if (speech !== null) {
                speech.textContent = line.text;
                speech.classList.add('show');
            }
            const audio = new Audio(line.audio);
            currentAudio = audio;
            const hideSpeech = () => {
                if (speechTimer !== null) {
                    clearTimeout(speechTimer);
                    speechTimer = null;
                }
                speech?.classList.remove('show');
                if (currentAudio === audio)
                    currentAudio = null;
            };
            audio.addEventListener('ended', hideSpeech);
            audio.addEventListener('error', hideSpeech);
            speechTimer = setTimeout(hideSpeech, 10000);
            void audio.play().catch(() => { hideSpeech(); });
        };
        // Click: play the next voice line.
        pet.addEventListener('click', playLine);
        // Hover: happy bounce
        pet.addEventListener('mouseenter', () => {
            headWrap?.classList.add('happy');
        });
        pet.addEventListener('mouseleave', () => {
            headWrap?.classList.remove('happy');
        });
        // --- Sakura petals + snowflakes (mixed sizes: tiny + large) ---
        const sakuraChars = ['❀', '✿', '❁', '✾'];
        const snowChars = ['❄', '❅', '❆', '✻', '✼'];
        const createPetal = () => {
            const petal = document.createElement('div');
            const isSnow = Math.random() < 0.4;
            petal.className = isSnow ? 'ayaka-snow' : 'ayaka-sakura';
            const chars = isSnow ? snowChars : sakuraChars;
            petal.textContent = chars[Math.floor(Math.random() * chars.length)] ?? '';
            petal.style.left = Math.random() * 100 + 'vw';
            // Mix sizes: 50% tiny (6-14px), 35% medium (20-40px), 15% large (60-100px)
            const sizeRoll = Math.random();
            let size;
            let duration;
            let opacity;
            if (sizeRoll < 0.5) {
                // Tiny
                size = 6 + Math.random() * 8;
                duration = 5 + Math.random() * 5;
                opacity = 0.3 + Math.random() * 0.2;
            }
            else if (sizeRoll < 0.85) {
                // Medium
                size = 20 + Math.random() * 20;
                duration = 8 + Math.random() * 5;
                opacity = 0.15 + Math.random() * 0.15;
            }
            else {
                // Large
                size = 60 + Math.random() * 40;
                duration = 12 + Math.random() * 6;
                opacity = 0.06 + Math.random() * 0.08;
            }
            petal.style.fontSize = size + 'px';
            petal.style.animationDuration = duration + 's';
            if (isSnow) {
                petal.style.color = `rgba(186, 230, 253, ${opacity})`;
            }
            else {
                petal.style.color = `rgba(251, 207, 232, ${opacity * 0.8})`;
            }
            document.body.appendChild(petal);
            setTimeout(() => petal.remove(), (duration + 2) * 1000);
        };
        // Sparse: every 2.5s
        setInterval(createPetal, 800);
        for (let i = 0; i < 3; i++)
            setTimeout(createPetal, i * 600);
        console.log('%c❄ 神里绫华 · 冰华主题已加载 ❀', 'color: #4a90c8; font-size: 14px; font-weight: bold;');
        console.log('%c点击绫华小头，听她说话~ 鼠标放上去会有互动哦~', 'color: #7dd3fc; font-size: 12px;');
    };
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', spawnPet, { once: true });
        }
        else {
            spawnPet();
        }
    }
    ctx.effect(() => () => {
        document.getElementById('ayaka-pet')?.remove();
        document.getElementById('ayaka-pet-style')?.remove();
        document.getElementById('ayaka-portrait')?.remove();
        document.getElementById('ayaka-bg')?.remove();
    }, 'ayaka-theme: pet cleanup');
}
// ============================================================
// Pet CSS (inline so the bundle is self-contained)
// ============================================================
const PET_CSS = `
/* ===== Background image (very faint, covers entire viewport) ===== */
#ayaka-bg {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
#ayaka-bg img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.12;
  filter: blur(4px) saturate(0.5);
  /* Fade out the right half so it doesn't cover Ayaka portrait */
  -webkit-mask-image: linear-gradient(to right,
    rgba(0,0,0,1) 0%,
    rgba(0,0,0,1) 30%,
    rgba(0,0,0,0.2) 50%,
    rgba(0,0,0,0) 65%);
  mask-image: linear-gradient(to right,
    rgba(0,0,0,1) 0%,
    rgba(0,0,0,1) 30%,
    rgba(0,0,0,0.2) 50%,
    rgba(0,0,0,0) 65%);
}
/* Subtle dark overlay for eye comfort (reduces contrast) */
#ayaka-bg::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: linear-gradient(to right,
    rgba(0, 0, 0, 0.15) 0%,
    rgba(0, 0, 0, 0.08) 30%,
    rgba(0, 0, 0, 0.02) 50%,
    rgba(0, 0, 0, 0) 65%);
  pointer-events: none;
}

/* ===== Ayaka portrait (right edge, semi-transparent, above bg) ===== */
#ayaka-portrait {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 280px;
  height: auto;
  z-index: 99998;
  pointer-events: none;
  opacity: 0.35;
  filter: drop-shadow(0 0 20px rgba(125, 211, 252, 0.3));
  mask-image: linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
  -webkit-mask-image: linear-gradient(to top, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
  transition: opacity 0.5s ease;
}
#ayaka-portrait img {
  width: 100%;
  height: auto;
  display: block;
}
#ayaka-portrait:hover {
  opacity: 0.5;
}

/* ===== Ayaka chibi head pet (resting on the chat input top edge) ===== */
/* The head sits ON the input card's top border, with little arms draped
   over the edge — like leaning/趴 on the input box. */
#ayaka-pet {
  position: fixed;
  width: 80px;
  height: 80px;
  z-index: 99999;
  cursor: pointer;
  user-select: none;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* The head circle */
#ayaka-pet .ayaka-pet-head-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: visible;
  border: 3px solid rgba(125, 211, 252, 0.3);
  box-shadow:
    0 4px 15px rgba(56, 189, 248, 0.15),
    0 0 20px rgba(186, 230, 253, 0.2);
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  opacity: 0.6;
}
#ayaka-pet .ayaka-pet-head-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  opacity: 0.85;
}

/* Idle: gentle breathing animation (趴着的呼吸感) */
#ayaka-pet {
  animation: ayaka-breathe 3s ease-in-out infinite;
}
@keyframes ayaka-breathe {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-2px) scale(1.02); }
}

/* Hover: head lifts up + glow + becomes opaque */
#ayaka-pet:hover {
  transform: translateY(-10px) scale(1.1) !important;
}
#ayaka-pet:hover .ayaka-pet-head-wrap {
  border-color: rgba(251, 207, 232, 0.5);
  box-shadow:
    0 8px 25px rgba(251, 207, 232, 0.25),
    0 0 35px rgba(186, 230, 253, 0.4);
  opacity: 1;
}
#ayaka-pet:hover .ayaka-pet-head-img {
  opacity: 1;
}
#ayaka-pet:active {
  transform: translateY(-2px) scale(0.95) !important;
}

/* Happy bounce on hover (JS toggles .happy class) */
#ayaka-pet .ayaka-pet-head-wrap.happy {
  animation: ayaka-happy 0.6s ease-in-out;
}
@keyframes ayaka-happy {
  0% { transform: rotate(0deg) scale(1); }
  20% { transform: rotate(-8deg) scale(1.05); }
  40% { transform: rotate(8deg) scale(1.05); }
  60% { transform: rotate(-5deg) scale(1.02); }
  80% { transform: rotate(5deg) scale(1.02); }
  100% { transform: rotate(0deg) scale(1); }
}

/* ===== Speech bubble ===== */
#ayaka-pet .ayaka-pet-speech {
  position: absolute;
  bottom: 88px;
  right: -10px;
  background: rgba(255,255,255,0.95);
  border: 1px solid rgba(125,211,252,0.3);
  border-radius: 12px;
  padding: 8px 14px;
  font-size: 13px;
  color: rgb(45,110,165);
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(56,189,248,0.15);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  pointer-events: none;
}
#ayaka-pet .ayaka-pet-speech.show { opacity: 1; transform: translateY(0); }
#ayaka-pet .ayaka-pet-speech::after {
  content: '';
  position: absolute;
  bottom: -6px;
  right: 25px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(255,255,255,0.95);
}

/* ===== Sakura petals + snowflakes (mixed sizes) ===== */
.ayaka-sakura, .ayaka-snow {
  position: fixed;
  top: -60px;
  z-index: 99997;
  pointer-events: none;
  animation: ayaka-fall linear forwards;
}
.ayaka-sakura { color: rgba(251,207,232,0.5); }
.ayaka-snow { color: rgba(186,230,253,0.6); }
@keyframes ayaka-fall {
  0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.7; }
  90% { opacity: 0.7; }
  100% { transform: translateY(100vh) translateX(60px) rotate(360deg); opacity: 0; }
}
`;
//# sourceMappingURL=index.js.map