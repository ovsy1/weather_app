/**
 * ui.js — рендер всех компонентов в DOM.
 * Принимает готовые данные, ничего не знает про API.
 */

import {
  formatTemp,
  formatTime,
  formatDate,
  formatWeekday,
  isToday,
  getCondition,
} from './weather.js';

// ===== СОСТОЯНИЯ ПРИЛОЖЕНИЯ =====

export function showLoading() {
  document.getElementById('stateLoading').classList.remove('hidden');
  document.getElementById('stateError').classList.add('hidden');
  document.getElementById('stateWelcome').classList.add('hidden');
  document.getElementById('weatherContent').classList.add('hidden');
}

export function showError(message) {
  document.getElementById('stateLoading').classList.add('hidden');
  document.getElementById('stateWelcome').classList.add('hidden');
  document.getElementById('weatherContent').classList.add('hidden');

  const errorEl = document.getElementById('stateError');
  document.getElementById('stateErrorText').textContent = message;
  errorEl.classList.remove('hidden');
}

export function showWeather() {
  document.getElementById('stateLoading').classList.add('hidden');
  document.getElementById('stateError').classList.add('hidden');
  document.getElementById('stateWelcome').classList.add('hidden');
  document.getElementById('weatherContent').classList.remove('hidden');
}

// ===== ТЕКУЩАЯ ПОГОДА =====

/**
 * Отрисовать блок текущей погоды.
 * @param {object} current   — parseCurrentWeather()
 * @param {string} cityName
 * @param {string} country
 * @param {string} [region]  — область / республика
 */
export function renderCurrentWeather(current, cityName, country, region = '') {
  // Формат: "Октябрьский · Республика Башкортостан, Россия"
  const regionPart  = region  ? ` · ${region}` : '';
  const countryPart = country ? `, ${country}`  : '';
  const locationLabel = `${cityName}${regionPart}${countryPart}`;

  document.getElementById('currentWeather').innerHTML = `
    <div class="current-main">
      <span class="current-city">${locationLabel}</span>
      <div class="current-temp">
        ${formatTemp(current.temperature)}<sup>°C</sup>
      </div>
      <p class="current-desc">${current.description}</p>
      <p class="current-feels">Ощущается как ${formatTemp(current.feelsLike)}°</p>
    </div>

    <div class="current-icon-wrapper">
      <span class="current-icon">${current.icon}</span>
    </div>

    <div class="current-metrics">
      ${createMetricHtml('Влажность', current.humidity, '%')}
      ${createMetricHtml('Ветер', current.windSpeed, 'м/с', current.windDirection)}
      ${createMetricHtml('Давление', current.pressure, 'мм')}
      ${createMetricHtml('Видимость', current.visibility, 'км')}
    </div>
  `;
}

/**
 * Создать HTML одного метрика.
 * @param {string} label
 * @param {number|string} value
 * @param {string} unit
 * @param {string} [sub]  — дополнительная подпись
 * @returns {string}
 */
function createMetricHtml(label, value, unit, sub = '') {
  return `
    <div class="current-metric">
      <span class="current-metric__label">${label}</span>
      <span class="current-metric__value">
        ${value}<span class="current-metric__unit">${unit}</span>
      </span>
      ${sub ? `<span style="font-size:12px;color:var(--text-muted)">${sub}</span>` : ''}
    </div>
  `;
}

// ===== ВКЛАДКА: СЕГОДНЯ =====

/**
 * Отрисовать детальную панель текущего дня.
 * @param {object} current   — parseCurrentWeather()
 * @param {Array}  hourly    — parseHourlyForDate()
 * @param {object} todayDaily — один элемент parseDailyForecast()
 */
export function renderTodayPanel(current, hourly, todayDaily) {
  const panel = document.getElementById('panelToday');

  panel.innerHTML = `
    ${renderHourlyScroll(hourly)}

    <p class="section-title">Подробности</p>
    <div class="today-grid">
      ${renderDetailCard('💧', 'Влажность', current.humidity, '%', createProgressBar(current.humidity))}
      ${renderDetailCard('🌡️', 'Давление', current.pressure, 'мм рт. ст.')}
      ${renderDetailCard('💨', 'Скорость ветра', current.windSpeed, 'м/с',
          `<div class="wind-compass" title="${current.windDegrees}°">${current.windDirection}</div>`
        )}
      ${renderDetailCard('☁️', 'Облачность', current.cloudCover, '%', createProgressBar(current.cloudCover))}
      ${renderDetailCard('🕶️', 'УФ-индекс', current.uvIndex ?? '—', '', renderUvLabel(current.uvIndex))}
      ${renderDetailCard('👁️', 'Видимость', current.visibility, 'км')}
      ${renderDetailCard('🌧️', 'Осадки сейчас', current.precipitation, 'мм')}
      ${renderDetailCard('📊', 'Макс. осадки', todayDaily?.precipitationSum ?? '0', 'мм за день')}
      ${renderSunCard(todayDaily)}
    </div>
  `;
}

/**
 * Создать HTML карточки с деталью.
 */
function renderDetailCard(icon, label, value, unit, extraHtml = '') {
  return `
    <div class="detail-card">
      <div class="detail-card__label">
        <span class="detail-card__icon">${icon}</span>${label}
      </div>
      <div class="detail-card__value">
        ${value}<span class="detail-card__unit">${unit}</span>
      </div>
      ${extraHtml}
    </div>
  `;
}

/**
 * Карточка восхода/заката — занимает всю ширину.
 */
function renderSunCard(todayDaily) {
  if (!todayDaily) return '';
  const sunrise = formatTime(todayDaily.sunrise);
  const sunset  = formatTime(todayDaily.sunset);

  return `
    <div class="detail-card detail-card--wide">
      <div class="detail-card__label">🌅 Восход и закат</div>
      <div class="sun-widget">
        <div class="sun-widget__time">
          <span class="sun-widget__time-label">Восход</span>
          <span class="sun-widget__time-value">${sunrise}</span>
        </div>
        ${createSunArcSvg()}
        <div class="sun-widget__time">
          <span class="sun-widget__time-label">Закат</span>
          <span class="sun-widget__time-value">${sunset}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * SVG-дуга солнца.
 */
function createSunArcSvg() {
  return `
    <div class="sun-widget__arc">
      <svg viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 50 Q60 0 110 50" stroke="var(--accent-warm)" stroke-width="2"
              stroke-dasharray="4 3" fill="none" opacity="0.5"/>
        <circle cx="60" cy="18" r="6" fill="var(--accent-warm)" opacity="0.9"/>
      </svg>
    </div>
  `;
}

/**
 * Прогресс-бар в виде HTML-строки.
 */
function createProgressBar(value) {
  return `
    <div class="progress-bar">
      <div class="progress-bar__fill" style="width: ${Math.min(value, 100)}%"></div>
    </div>
  `;
}

/**
 * Подпись к УФ-индексу.
 */
function renderUvLabel(uvIndex) {
  if (uvIndex == null) return '';
  const levels = [
    { max: 2,  label: 'Низкий',     color: '#22c55e' },
    { max: 5,  label: 'Умеренный',  color: '#eab308' },
    { max: 7,  label: 'Высокий',    color: '#f97316' },
    { max: 10, label: 'Очень высокий', color: '#ef4444' },
    { max: Infinity, label: 'Экстремальный', color: '#9333ea' },
  ];
  const level = levels.find(l => uvIndex <= l.max);
  return `<span class="detail-card__sub" style="color:${level.color}">${level.label}</span>`;
}

// ===== ПОЧАСОВОЙ СКРОЛЛ =====

/**
 * Отрисовать горизонтальный скролл с часами.
 */
function renderHourlyScroll(hourlyData) {
  const now = new Date();
  const currentHour = now.getHours();

  const cards = hourlyData.map(hour => {
    const hourNumber = new Date(hour.time).getHours();
    const isCurrent  = hourNumber === currentHour;
    const condition  = getCondition(hour.weatherCode);

    return `
      <div class="hourly-card ${isCurrent ? 'hourly-card--current' : ''}">
        <span class="hourly-card__time">${hourNumber.toString().padStart(2, '0')}:00</span>
        <span class="hourly-card__icon">${condition.icon}</span>
        <span class="hourly-card__temp">${formatTemp(hour.temperature)}°</span>
        ${hour.precipitationProb > 0
          ? `<span class="hourly-card__precip">💧${hour.precipitationProb}%</span>`
          : ''}
      </div>
    `;
  }).join('');

  return `
    <p class="section-title" style="margin-bottom:12px">По часам</p>
    <div class="hourly-scroll-wrapper">
      <div class="hourly-row">${cards}</div>
    </div>
  `;
}

// ===== ПРОГНОЗ НА НЕДЕЛЮ =====

/**
 * Отрисовать прогноз на 7 дней.
 * @param {Array} dailyForecast — parseDailyForecast()
 */
export function renderWeekPanel(dailyForecast) {
  const panel = document.getElementById('panelWeek');
  const cards  = dailyForecast.slice(0, 7).map(day => createForecastCard(day)).join('');
  panel.innerHTML = `<div class="forecast-list">${cards}</div>`;
}

// ===== ПРОГНОЗ НА МЕСЯЦ =====

/**
 * Отрисовать прогноз на 30 дней.
 * @param {Array} dailyForecast
 */
export function renderMonthPanel(dailyForecast) {
  const panel = document.getElementById('panelMonth');
  const cards  = dailyForecast.map(day => createForecastCard(day)).join('');
  panel.innerHTML = `<div class="forecast-list">${cards}</div>`;
}

/**
 * Создать HTML одной карточки дня (общий шаблон для недели и месяца).
 * @param {object} day
 * @returns {string}
 */
function createForecastCard(day) {
  const todayMark = isToday(day.date) ? 'forecast-card--today' : '';
  const weekday   = isToday(day.date) ? 'Сегодня' : formatWeekday(day.date);
  const dateStr   = formatDate(day.date);

  return `
    <div class="forecast-card ${todayMark}">
      <div class="forecast-card__day">
        ${weekday}
        <span class="forecast-card__date">${dateStr}</span>
      </div>
      <span class="forecast-card__icon">${day.icon}</span>
      <span class="forecast-card__desc">${day.description}</span>
      <div class="forecast-card__temps">
        <span class="forecast-card__temp-max">${formatTemp(day.tempMax)}°</span>
        <span class="forecast-card__temp-min">${formatTemp(day.tempMin)}°</span>
      </div>
    </div>
  `;
}

// ===== ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК =====

/**
 * Инициализировать переключатель вкладок.
 * @param {Function} onTabChange  — callback(tabName)
 */
export function initTabs(onTabChange) {
  const tabButtons = document.querySelectorAll('.tab');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Переключить активную кнопку
      tabButtons.forEach(b => b.classList.remove('tab--active'));
      btn.classList.add('tab--active');

      // Переключить панели
      ['today', 'week', 'month'].forEach(tabName => {
        const panel = document.getElementById(`panel${capitalize(tabName)}`);
        panel.classList.toggle('hidden', tabName !== targetTab);
      });

      onTabChange(targetTab);
    });
  });
}

/**
 * Вспомогательная функция: первая буква заглавная.
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== ПОИСК =====

/**
 * Отрисовать список подсказок поиска.
 * @param {Array} cities — результат searchCities()
 * @param {Function} onSelect  — callback(city)
 */
export function renderSearchSuggestions(cities, onSelect) {
  const listEl = document.getElementById('searchSuggestions');

  if (!cities.length) {
    listEl.innerHTML = '';
    return;
  }

  listEl.innerHTML = cities.map(city => {
    // admin1 — регион (область, республика), admin2 — район
    const region = city.admin1 ? `<span class="suggestion-item__region">${city.admin1}</span>` : '';
    return `
      <li class="suggestion-item" data-id="${city.id}">
        <span class="suggestion-item__name">${city.name}</span>
        <span class="suggestion-item__meta">${region}<span class="suggestion-item__country">${city.country ?? ''}</span></span>
      </li>
    `;
  }).join('');

  listEl.querySelectorAll('.suggestion-item').forEach((item, index) => {
    item.addEventListener('click', () => onSelect(cities[index]));
  });
}

/**
 * Очистить список подсказок.
 */
export function clearSearchSuggestions() {
  document.getElementById('searchSuggestions').innerHTML = '';
}