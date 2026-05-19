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

export function renderCurrentWeather(current, cityName, country, region = '') {
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

export function renderTodayPanel(current, hourly, todayDaily) {
  const panel = document.getElementById('panelToday');

  panel.innerHTML = `
    ${renderTempChart(hourly)}

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

function createProgressBar(value) {
  return `
    <div class="progress-bar">
      <div class="progress-bar__fill" style="width: ${Math.min(value, 100)}%"></div>
    </div>
  `;
}

function renderUvLabel(uvIndex) {
  if (uvIndex == null) return '';
  const levels = [
    { max: 2,  label: 'Низкий',          color: '#22c55e' },
    { max: 5,  label: 'Умеренный',        color: '#eab308' },
    { max: 7,  label: 'Высокий',          color: '#f97316' },
    { max: 10, label: 'Очень высокий',    color: '#ef4444' },
    { max: Infinity, label: 'Экстремальный', color: '#9333ea' },
  ];
  const level = levels.find(l => uvIndex <= l.max);
  return `<span class="detail-card__sub" style="color:${level.color}">${level.label}</span>`;
}

// ===== SVG ГРАФИК ТЕМПЕРАТУРЫ =====

function renderTempChart(hourlyData) {
  if (!hourlyData.length) return '';

  const now = new Date().getHours();
  const W = 800, H = 160, PAD_X = 40, PAD_Y = 20;
  const drawW = W - PAD_X * 2;
  const drawH = H - PAD_Y * 2;

  const temps = hourlyData.map(h => h.temperature);
  const precips = hourlyData.map(h => h.precipitationProb);
  const minT = Math.min(...temps) - 2;
  const maxT = Math.max(...temps) + 2;
  const range = maxT - minT || 1;
  const n = temps.length;

  const toX = i => PAD_X + (i / (n - 1)) * drawW;
  const toY = t => PAD_Y + drawH - ((t - minT) / range) * drawH;

  // Построить плавный путь (cubic bezier)
  let d = `M ${toX(0)} ${toY(temps[0])}`;
  for (let i = 1; i < n; i++) {
    const x0 = toX(i - 1), y0 = toY(temps[i - 1]);
    const x1 = toX(i),     y1 = toY(temps[i]);
    const cpx = (x0 + x1) / 2;
    d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
  }

  // Закрытый контур для градиента
  const dFill = d +
    ` L ${toX(n - 1)} ${H} L ${toX(0)} ${H} Z`;

  // Точки только для каждые 3 часа
  const dots = hourlyData
    .map((h, i) => {
      const hNum = new Date(h.time).getHours();
      if (hNum % 3 !== 0) return '';
      const cx = toX(i);
      const cy = toY(h.temperature);
      const isCur = hNum === now;
      const labelY = cy > PAD_Y + 20 ? cy - 10 : cy + 20;
      return `
        <circle cx="${cx}" cy="${cy}" r="${isCur ? 6 : 4}"
          fill="${isCur ? 'var(--accent-primary)' : 'var(--bg-surface)'}"
          stroke="${isCur ? 'var(--accent-primary)' : 'var(--text-muted)'}"
          stroke-width="2"/>
        <text x="${cx}" y="${labelY}" text-anchor="middle"
          font-size="11" fill="var(--text-primary)" font-family="var(--font-display)" font-weight="600">
          ${formatTemp(h.temperature)}°
        </text>
        <text x="${cx}" y="${H - 4}" text-anchor="middle"
          font-size="10" fill="var(--text-muted)" font-family="var(--font-body)">
          ${hNum.toString().padStart(2, '0')}
        </text>
        ${h.precipitationProb > 15 ? `
          <text x="${cx}" y="${PAD_Y - 6}" text-anchor="middle"
            font-size="9" fill="#60a5fa" font-family="var(--font-body)">
            ${h.precipitationProb}%
          </text>` : ''}
      `;
    }).join('');

  // Текущий час — вертикальная линия
  const nowIdx = hourlyData.findIndex(h => new Date(h.time).getHours() === now);
  const nowLine = nowIdx >= 0 ? `
    <line x1="${toX(nowIdx)}" y1="${PAD_Y}" x2="${toX(nowIdx)}" y2="${H - 16}"
      stroke="var(--accent-primary)" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>
  ` : '';

  return `
    <p class="section-title" style="margin-bottom:12px">По часам</p>
    <div class="temp-chart-wrapper">
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="temp-chart-svg">
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0"/>
          </linearGradient>
        </defs>

        <!-- Заливка под кривой -->
        <path d="${dFill}" fill="url(#tempGrad)"/>

        <!-- Линия графика -->
        <path d="${d}" fill="none" stroke="var(--accent-primary)" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"/>

        ${nowLine}
        ${dots}
      </svg>
    </div>
  `;
}

// ===== ПРОГНОЗ НА НЕДЕЛЮ =====

export function renderWeekPanel(dailyForecast) {
  const panel = document.getElementById('panelWeek');
  const cards  = dailyForecast.slice(0, 7).map(day => createForecastCard(day)).join('');
  panel.innerHTML = `<div class="forecast-list">${cards}</div>`;
}

// ===== ПРОГНОЗ НА МЕСЯЦ =====

export function renderMonthPanel(dailyForecast) {
  const panel = document.getElementById('panelMonth');
  const cards  = dailyForecast.map(day => createForecastCard(day)).join('');
  panel.innerHTML = `<div class="forecast-list">${cards}</div>`;
}

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

export function initTabs(onTabChange) {
  const tabButtons = document.querySelectorAll('.tab');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove('tab--active'));
      btn.classList.add('tab--active');

      ['today', 'week', 'month'].forEach(tabName => {
        const panel = document.getElementById(`panel${capitalize(tabName)}`);
        panel.classList.toggle('hidden', tabName !== targetTab);
      });

      onTabChange(targetTab);
    });
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== ПОИСК =====

export function renderSearchSuggestions(cities, onSelect) {
  const listEl = document.getElementById('searchSuggestions');

  if (!cities.length) {
    listEl.innerHTML = '';
    return;
  }

  listEl.innerHTML = cities.map(city => {
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

export function clearSearchSuggestions() {
  document.getElementById('searchSuggestions').innerHTML = '';
}
