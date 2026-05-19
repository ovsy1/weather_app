/**
 * theme.js — переключение тем (день/ночь).
 * Автодетект по времени суток, ручное переключение, сохранение в localStorage.
 */

const STORAGE_KEY     = 'weather-app-theme';
const THEME_LIGHT     = 'light';
const THEME_DARK      = 'dark';
const DAY_START_HOUR  = 7;
const DAY_END_HOUR    = 21;

const themeIcons = {
  [THEME_LIGHT]: '☀',
  [THEME_DARK]:  '☾',
};

/**
 * Определить тему по текущему времени суток.
 * @returns {'light'|'dark'}
 */
function getAutoTheme() {
  const hour = new Date().getHours();
  return (hour >= DAY_START_HOUR && hour < DAY_END_HOUR) ? THEME_LIGHT : THEME_DARK;
}

/**
 * Прочитать тему из localStorage.
 * @returns {'light'|'dark'|null}
 */
function getSavedTheme() {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Применить тему к документу.
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  const iconEl = document.getElementById('themeIcon');
  if (iconEl) {
    iconEl.textContent = themeIcons[theme];
  }
}

/**
 * Инициализировать тему: берём сохранённую или определяем автоматически.
 */
export function initTheme() {
  const savedTheme = getSavedTheme();
  const activeTheme = savedTheme ?? getAutoTheme();
  applyTheme(activeTheme);
}

/**
 * Переключить тему вручную и сохранить выбор.
 */
export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') ?? THEME_LIGHT;
  const nextTheme    = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;

  applyTheme(nextTheme);
  localStorage.setItem(STORAGE_KEY, nextTheme);
}

/**
 * Подписаться на кнопку переключения темы.
 */
export function bindThemeToggle() {
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }
}
