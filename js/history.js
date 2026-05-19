/**
 * history.js — история поиска городов (последние 5).
 * Хранится в localStorage.
 */

const STORAGE_KEY = 'weather_city_history';
const MAX_ITEMS = 5;

/**
 * Получить историю из localStorage.
 * @returns {Array<{name, latitude, longitude, country, admin1}>}
 */
export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

/**
 * Добавить город в историю (дубли по имени+стране удаляются).
 * @param {object} city
 */
export function addToHistory(city) {
  const history = getHistory().filter(
    c => !(c.name === city.name && c.country === city.country)
  );
  history.unshift({ name: city.name, latitude: city.latitude, longitude: city.longitude, country: city.country ?? '', admin1: city.admin1 ?? '' });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ITEMS)));
}

/**
 * Отрисовать историю в выпадающем списке поиска.
 * @param {Function} onSelect  — callback(city)
 */
export function renderHistory(onSelect) {
  const listEl = document.getElementById('searchSuggestions');
  const history = getHistory();
  if (!history.length) return;

  listEl.innerHTML = `
    <li class="suggestion-history-label">
      <span>Недавние</span>
    </li>
    ${history.map((city, i) => `
      <li class="suggestion-item suggestion-item--history" data-i="${i}">
        <span class="suggestion-item__history-icon">🕐</span>
        <span class="suggestion-item__name">${city.name}</span>
        <span class="suggestion-item__meta">
          ${city.admin1 ? `<span class="suggestion-item__region">${city.admin1}</span>` : ''}
          <span class="suggestion-item__country">${city.country}</span>
        </span>
      </li>
    `).join('')}
  `;

  listEl.querySelectorAll('.suggestion-item--history').forEach(item => {
    item.addEventListener('click', () => onSelect(history[+item.dataset.i]));
  });
}
