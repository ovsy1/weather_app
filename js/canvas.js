/**
 * canvas.js — анимированный фон через Canvas.
 * Дождь, снег, солнечные лучи в зависимости от weatherCode.
 */

let canvas = null;
let ctx = null;
let animationId = null;
let particles = [];
let currentWeatherType = null;
let sunBeams = [];

const WEATHER_TYPES = {
  CLEAR:   'clear',
  CLOUDY:  'cloudy',
  RAIN:    'rain',
  SNOW:    'snow',
  STORM:   'storm',
  FOG:     'fog',
};

/**
 * Определить тип погоды по WMO коду.
 */
function getWeatherType(code) {
  if (code === 0 || code === 1) return WEATHER_TYPES.CLEAR;
  if (code === 2 || code === 3) return WEATHER_TYPES.CLOUDY;
  if (code >= 45 && code <= 48) return WEATHER_TYPES.FOG;
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return WEATHER_TYPES.RAIN;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return WEATHER_TYPES.SNOW;
  if (code >= 95) return WEATHER_TYPES.STORM;
  return WEATHER_TYPES.CLOUDY;
}

/**
 * Инициализировать canvas и вставить его в DOM.
 */
export function initWeatherCanvas() {
  canvas = document.createElement('canvas');
  canvas.id = 'weatherCanvas';
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    opacity: 0;
    transition: opacity 1.2s ease;
  `;
  document.body.prepend(canvas);
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

/**
 * Обновить анимацию под новую погоду.
 * @param {number} weatherCode
 */
export function updateWeatherAnimation(weatherCode) {
  const type = getWeatherType(weatherCode);
  if (type === currentWeatherType) return;
  currentWeatherType = type;

  // Остановить старую анимацию
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  particles = [];
  sunBeams = [];

  // Скрыть canvas для типов без частиц
  if (type === WEATHER_TYPES.CLOUDY || type === WEATHER_TYPES.FOG) {
    canvas.style.opacity = '0';
    return;
  }

  // Запустить новую
  canvas.style.opacity = '1';

  if (type === WEATHER_TYPES.CLEAR) {
    initSunBeams();
    animateSun();
  } else if (type === WEATHER_TYPES.RAIN || type === WEATHER_TYPES.STORM) {
    initRain(type === WEATHER_TYPES.STORM ? 280 : 150);
    animateRain();
  } else if (type === WEATHER_TYPES.SNOW) {
    initSnow(120);
    animateSnow();
  }
}

// ===== СОЛНЕЧНЫЕ ЛУЧИ =====

function initSunBeams() {
  sunBeams = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * Math.PI * 2,
    length: Math.random() * 200 + 300,
    width: Math.random() * 60 + 20,
    speed: (Math.random() - 0.5) * 0.003,
    opacity: Math.random() * 0.06 + 0.02,
  }));
}

function animateSun() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width * 0.75;
  const cy = -50;

  sunBeams.forEach(beam => {
    beam.angle += beam.speed;

    const x1 = cx;
    const y1 = cy;
    const x2 = cx + Math.cos(beam.angle) * beam.length;
    const y2 = cy + Math.sin(beam.angle) * beam.length;

    const isDark = document.documentElement.dataset.theme === 'dark';
    const color = isDark ? '200, 200, 255' : '255, 220, 100';

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, `rgba(${color}, ${beam.opacity * 3})`);
    grad.addColorStop(1, `rgba(${color}, 0)`);

    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = beam.width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  });

  animationId = requestAnimationFrame(animateSun);
}

// ===== ДОЖДЬ =====

function initRain(count) {
  particles = Array.from({ length: count }, () => createRainDrop());
}

function createRainDrop() {
  return {
    x: Math.random() * (canvas.width + 200) - 100,
    y: Math.random() * canvas.height - canvas.height,
    length: Math.random() * 20 + 10,
    speed: Math.random() * 8 + 10,
    opacity: Math.random() * 0.4 + 0.1,
    width: Math.random() * 1.5 + 0.5,
  };
}

function animateRain() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const color = isDark ? '140, 180, 255' : '100, 140, 220';

  particles.forEach(drop => {
    drop.x += drop.speed * 0.25;
    drop.y += drop.speed;

    if (drop.y > canvas.height + 20) {
      Object.assign(drop, createRainDrop());
      drop.y = -20;
    }

    ctx.save();
    ctx.strokeStyle = `rgba(${color}, ${drop.opacity})`;
    ctx.lineWidth = drop.width;
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x + drop.length * 0.25, drop.y + drop.length);
    ctx.stroke();
    ctx.restore();
  });

  animationId = requestAnimationFrame(animateRain);
}

// ===== СНЕГ =====

function initSnow(count) {
  particles = Array.from({ length: count }, () => createSnowflake());
}

function createSnowflake() {
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    radius: Math.random() * 4 + 1,
    speedY: Math.random() * 2 + 0.5,
    speedX: (Math.random() - 0.5) * 1.2,
    drift: Math.random() * Math.PI * 2,
    driftSpeed: Math.random() * 0.02 + 0.01,
    opacity: Math.random() * 0.5 + 0.2,
  };
}

function animateSnow() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const isDark = document.documentElement.dataset.theme === 'dark';
  const color = isDark ? '200, 220, 255' : '180, 210, 255';

  particles.forEach(flake => {
    flake.drift += flake.driftSpeed;
    flake.x += flake.speedX + Math.sin(flake.drift) * 0.5;
    flake.y += flake.speedY;

    if (flake.y > canvas.height + 10) {
      Object.assign(flake, createSnowflake());
      flake.y = -10;
    }

    ctx.save();
    ctx.fillStyle = `rgba(${color}, ${flake.opacity})`;
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  animationId = requestAnimationFrame(animateSnow);
}
