/**
 * app.js — точка входа.
 * Управляет состоянием, связывает модули, обрабатывает события.
 */

import { searchCities, fetchWeatherData, reverseGeocode } from './api.js';
import { getCurrentPosition } from './geo.js';
import { initTheme, bindThemeToggle } from './theme.js';
import {
  parseCurrentWeather,
  parseHourlyForDate,
  parseDailyForecast,
} from './weather.js';
import {
  showLoading,
  showError,
  showWeather,
  renderCurrentWeather,
  renderTodayPanel,
  renderWeekPanel,
  renderMonthPanel,
  renderSearchSuggestions,
  clearSearchSuggestions,
  initTabs,
} from './ui.js';
import { initWeatherCanvas, updateWeatherAnimation } from './canvas.js';
import { getHistory, addToHistory, renderHistory } from './history.js';
import { getCityFact, getTodayHoliday } from './facts.js';

// ===== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====

const state = {
  latitude:   null,
  longitude:  null,
  cityName:   '',
  region:     '',
  country:    '',
  apiData:    null,
};

// ===== ЗАГРУЗКА ПОГОДЫ =====

async function loadWeather(latitude, longitude, cityName, country = '', region = '') {
  state.latitude  = latitude;
  state.longitude = longitude;
  state.cityName  = cityName;
  state.country   = country;
  state.region    = region;

  showLoading();

  try {
    const apiData = await fetchWeatherData(latitude, longitude);
    state.apiData  = apiData;

    // Обновить анимированный фон
    const current = parseCurrentWeather(apiData);
    updateWeatherAnimation(current.weatherCode);

    renderAllPanels(apiData, cityName, country, region);
    showWeather();

    // Сохранить в историю
    addToHistory({ name: cityName, latitude, longitude, country, admin1: region });

    // Асинхронно подгрузить факт о городе и праздник
    loadCityExtras(cityName, country, region);
  } catch (error) {
    showError(`Не удалось загрузить погоду: ${error.message}`);
    console.error('[app] loadWeather error:', error);
  }
}

function renderAllPanels(apiData, cityName, country, region = '') {
  // Текущее время в таймзоне города, а не устройства
  const utcOffsetSeconds = apiData.utc_offset_seconds ?? 0;
  const nowInCity        = new Date(Date.now() + utcOffsetSeconds * 1000 - new Date().getTimezoneOffset() * 60000);
  // Нет — правильнее через UTC:
  const nowCityMs        = Date.now() + utcOffsetSeconds * 1000;
  const nowCity          = new Date(nowCityMs);
  // Дата в городе (YYYY-MM-DD) без привязки к локальной TZ устройства
  const pad = n => String(n).padStart(2, '0');
  const todayDateStr = `${nowCity.getUTCFullYear()}-${pad(nowCity.getUTCMonth() + 1)}-${pad(nowCity.getUTCDate())}`;
  const currentHourInCity = nowCity.getUTCHours();

  const current       = parseCurrentWeather(apiData);
  const hourly        = parseHourlyForDate(apiData, todayDateStr);
  const dailyFull     = parseDailyForecast(apiData);
  const todayDaily    = dailyFull.find(d => d.date === todayDateStr) ?? dailyFull[0];

  renderCurrentWeather(current, cityName, country, region);
  renderTodayPanel(current, hourly, todayDaily, currentHourInCity);
  renderWeekPanel(dailyFull);
  renderMonthPanel(dailyFull);

  // Прокрутить мобильный график к текущему часу
  requestAnimationFrame(() => scrollChartToNow());
}

// ===== ФАКТ О ГОРОДЕ И ПРАЗДНИК =====

async function loadCityExtras(cityName, country, region = '') {
  const todayStr = new Date().toISOString().slice(0, 10);

  // Запускаем параллельно
  const [fact, holiday] = await Promise.all([
    getCityFact(cityName, country, region),
    getTodayHoliday(todayStr),
  ]);

  // Вставить факт под название города
  if (fact) {
    const factEl = document.getElementById('cityFact');
    if (factEl) {
      factEl.textContent = fact;
      factEl.classList.add('city-fact--visible');
    }
  }

  // Вставить праздник
  const holidayEl = document.getElementById('todayHoliday');
  if (holidayEl) {
    if (holiday) {
      holidayEl.innerHTML = `
        <span class="holiday__emoji">🎉</span>
        <div class="holiday__text">
          <span class="holiday__name">Сегодня: ${holiday.name}</span>
          <span class="holiday__fact">${holiday.fact}</span>
        </div>
      `;
      holidayEl.classList.add('today-holiday--visible');
    }
  }
}



function scrollChartToNow() {
  const scrollEl = document.getElementById('tempChartScroll');
  if (!scrollEl) return;
  const nowIdx = parseInt(scrollEl.dataset.nowIdx ?? '-1', 10);
  const colW   = parseInt(scrollEl.dataset.colW  ?? '52', 10);
  const padX   = parseInt(scrollEl.dataset.padX  ?? '28', 10);
  if (nowIdx < 0) return;

  // Позиция текущего часа — центрируем его в контейнере
  const xOfNow     = padX + nowIdx * colW;
  const scrollLeft = xOfNow - scrollEl.clientWidth / 2;
  scrollEl.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
}



async function handleGeoRequest() {
  showLoading();

  try {
    const { latitude, longitude }      = await getCurrentPosition();
    const { name, country, region }    = await reverseGeocode(latitude, longitude);
    await loadWeather(latitude, longitude, name, country, region);
  } catch (error) {
    showError(error.message);
  }
}

// ===== ПОИСК =====

const SEARCH_DEBOUNCE_MS = 350;
let searchDebounceTimer  = null;

function handleSearchInput(event) {
  const query = event.target.value;

  clearTimeout(searchDebounceTimer);

  if (query.length < 2) {
    clearSearchSuggestions();
    return;
  }

  searchDebounceTimer = setTimeout(async () => {
    try {
      const cities = await searchCities(query);
      renderSearchSuggestions(cities, handleCitySelect);
    } catch (error) {
      console.error('[app] search error:', error);
    }
  }, SEARCH_DEBOUNCE_MS);
}

function handleCitySelect(city) {
  const searchInput = document.getElementById('searchInput');
  searchInput.value = city.name;
  clearSearchSuggestions();
  loadWeather(city.latitude, city.longitude, city.name, city.country, city.admin1 ?? '');
}

function handleSearchKeydown(event) {
  if (event.key === 'Escape') {
    clearSearchSuggestions();
  }
}

// Показать историю при фокусе на пустом поле
function handleSearchFocus(event) {
  if (event.target.value.length < 2) {
    const history = getHistory();
    if (history.length) {
      renderHistory(handleCitySelect);
    }
  }
}

// ===== ВКЛАДКИ =====

function handleTabChange(tabName) {
  console.debug('[app] tab changed to:', tabName);
}

// ===== ЗАКРЫТИЕ ПОДСКАЗОК ПРИ КЛИКЕ ВНЕ =====

function handleDocumentClick(event) {
  const searchWrapper = document.querySelector('.search-wrapper');
  if (!searchWrapper.contains(event.target)) {
    clearSearchSuggestions();
  }
}

// ===== АВТОЗАПУСК ПО ГЕОЛОКАЦИИ =====

async function requestWeatherOnLoad() {
  try {
    const { latitude, longitude }   = await getCurrentPosition();
    const { name, country, region } = await reverseGeocode(latitude, longitude);
    await loadWeather(latitude, longitude, name, country, region);
  } catch {
    // Молча игнорируем — пользователь сам введёт город
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

function init() {
  initTheme();
  bindThemeToggle();
  initTabs(handleTabChange);
  initWeatherCanvas();

  // Поиск
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input',   handleSearchInput);
  searchInput.addEventListener('keydown', handleSearchKeydown);
  searchInput.addEventListener('focus',   handleSearchFocus);

  // Геолокация по кнопке
  document.getElementById('geoBtn').addEventListener('click', handleGeoRequest);

  // Закрытие подсказок
  document.addEventListener('click', handleDocumentClick);

  // Автоопределение местоположения при старте
  requestWeatherOnLoad();
}

init();
