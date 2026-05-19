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
      <span class="city-fact" id="cityFact"></span>
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

    <div class="today-holiday" id="todayHoliday"></div>
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

export function renderTodayPanel(current, hourly, todayDaily, currentHour = new Date().getHours()) {
  const panel = document.getElementById('panelToday');

  panel.innerHTML = `
    ${renderTempChart(hourly, currentHour)}

    <p class="section-title">Подробности</p>
    <div class="today-grid">
      ${renderDetailCard('💧', 'Влажность', current.humidity, '%', createProgressBar(current.humidity))}
      ${renderDetailCard('🌡️', 'Давление', current.pressure, 'мм рт. ст.')}
      ${renderDetailCard('💨', 'Скорость ветра', current.windSpeed, 'м/с',
          renderWindArrow(current.windDegrees, current.windDirection)
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

function renderWindArrow(degrees, directionLabel) {
  const arrowDeg = (degrees + 180) % 360;
  return `
    <div class="wind-arrow-wrap">
      <svg class="wind-arrow" viewBox="0 0 24 24" width="22" height="22"
           style="transform: rotate(${arrowDeg}deg)">
        <path d="M12 3 L17 14 L12 11 L7 14 Z"
              fill="var(--accent-primary)" opacity="0.9"/>
        <line x1="12" y1="11" x2="12" y2="20"
              stroke="var(--accent-primary)" stroke-width="2"
              stroke-linecap="round" opacity="0.5"/>
      </svg>
      <span class="wind-direction-label">${directionLabel}</span>
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

function renderTempChart(hourlyData, currentHour = new Date().getHours()) {
  if (!hourlyData.length) return '';

  const now = currentHour;

  // На мобилке каждый час — отдельная колонка шириной 52px, итого скролл
  // На десктопе фиксированный viewBox, растягивается по ширине
  const COL_W = 28;          // ширина колонки на мобилке
  const H = 140;
  const PAD_X = 16;
  const PAD_TOP = 28;        // место для подписи температуры сверху
  const PAD_BOT = 22;        // место для подписи часа снизу
  const drawH = H - PAD_TOP - PAD_BOT;

  const n = hourlyData.length;
  const W_MOBILE = COL_W * n + PAD_X * 2;
  const W_DESK   = 800;

  const temps  = hourlyData.map(h => h.temperature);
  const rawMin = Math.min(...temps);
  const rawMax = Math.max(...temps);
  const spread = rawMax - rawMin;
  // Минимальный диапазон 6° — иначе при ровной погоде линия болтается у потолка
  const padding = Math.max(3, (6 - spread) / 2);
  const minT   = rawMin - padding;
  const maxT   = rawMax + padding;
  const range  = maxT - minT;

  // Функции координат — принимают totalWidth чтобы строить и мобильную и десктопную версию
  const buildSvg = (W) => {
    const toX = i => PAD_X + (i / (n - 1)) * (W - PAD_X * 2);
    const toY = t => PAD_TOP + drawH - ((t - minT) / range) * drawH;

    // Плавная кривая Безье
    let d = `M ${toX(0)} ${toY(temps[0])}`;
    for (let i = 1; i < n; i++) {
      const x0 = toX(i - 1), y0 = toY(temps[i - 1]);
      const x1 = toX(i),     y1 = toY(temps[i]);
      const cpx = (x0 + x1) / 2;
      d += ` C ${cpx} ${y0}, ${cpx} ${y1}, ${x1} ${y1}`;
    }
    const dFill = d + ` L ${toX(n - 1)} ${H - PAD_BOT + 4} L ${toX(0)} ${H - PAD_BOT + 4} Z`;

    // Точки — каждые 2 часа для мобилки, каждые 3 для десктопа
    const step = 2; // каждые 2 часа на мобилке при ширине колонки 28px
    const dots = hourlyData.map((h, i) => {
      const hNum = parseInt(h.time.slice(11, 13), 10);
      if (hNum % step !== 0) return '';
      const cx = toX(i);
      const cy = toY(h.temperature);
      const isCur = hNum === now;
      // Подпись температуры — всегда над точкой
      const labelY = cy - 10;
      return `
        <circle cx="${cx}" cy="${cy}" r="${isCur ? 5 : 3.5}"
          fill="${isCur ? 'var(--accent-primary)' : 'var(--bg-surface)'}"
          stroke="${isCur ? 'var(--accent-primary)' : 'var(--text-muted)'}"
          stroke-width="2"/>
        <text x="${cx}" y="${labelY}" text-anchor="middle"
          font-size="12" fill="${isCur ? 'var(--accent-primary)' : 'var(--text-primary)'}"
          font-family="var(--font-body)" font-weight="600">
          ${formatTemp(h.temperature)}°
        </text>
        <text x="${cx}" y="${H - 6}" text-anchor="middle"
          font-size="11" fill="var(--text-muted)" font-family="var(--font-body)">
          ${hNum.toString().padStart(2, '0')}
        </text>
        ${h.precipitationProb > 15 ? `
          <text x="${cx}" y="${PAD_TOP - 8}" text-anchor="middle"
            font-size="10" fill="#60a5fa" font-family="var(--font-body)">
            💧${h.precipitationProb}%
          </text>` : ''}
      `;
    }).join('');

    // Текущий час — вертикаль
    const nowIdx = hourlyData.findIndex(h => parseInt(h.time.slice(11, 13), 10) === now);
    const nowLine = nowIdx >= 0 ? `
      <line x1="${toX(nowIdx)}" y1="${PAD_TOP}" x2="${toX(nowIdx)}" y2="${H - PAD_BOT}"
        stroke="var(--accent-primary)" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.45"/>
    ` : '';

    return { d, dFill, dots, nowLine };
  };

  const mob  = buildSvg(W_MOBILE);
  const desk = buildSvg(W_DESK);

  const svgInner = (W, parts) => `
    <defs>
      <linearGradient id="tempGrad${W}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent-primary)" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="var(--accent-primary)" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${parts.dFill}" fill="url(#tempGrad${W})"/>
    <path d="${parts.d}" fill="none" stroke="var(--accent-primary)" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round"/>
    ${parts.nowLine}
    ${parts.dots}
  `;

  const nowIdx = hourlyData.findIndex(h => {
    const hNum = parseInt(h.time.slice(11, 13), 10);
    return hNum === now;
  });

  return `
    <p class="section-title" style="margin-bottom:12px">По часам</p>
    <div class="temp-chart-wrapper">

      <!-- Мобильная версия: горизонтальный скролл -->
      <div class="temp-chart-scroll" id="tempChartScroll" data-now-idx="${nowIdx}" data-col-w="${COL_W}" data-pad-x="${PAD_X}">
        <svg width="${W_MOBILE}" height="${H}"
             viewBox="0 0 ${W_MOBILE} ${H}"
             xmlns="http://www.w3.org/2000/svg"
             class="temp-chart-svg temp-chart-svg--mobile">
          ${svgInner(W_MOBILE, mob)}
        </svg>
      </div>

      <!-- Десктопная версия: растягивается -->
      <svg viewBox="0 0 ${W_DESK} ${H}"
           xmlns="http://www.w3.org/2000/svg"
           class="temp-chart-svg temp-chart-svg--desk">
        ${svgInner(W_DESK, desk)}
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

      ['today', 'week', 'month', 'map'].forEach(tabName => {
        const panel = document.getElementById(`panel${capitalize(tabName)}`);
        if (panel) panel.classList.toggle('hidden', tabName !== targetTab);
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
