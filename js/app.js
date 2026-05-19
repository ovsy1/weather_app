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

/**
 * Загрузить и отрисовать погоду для заданных координат.
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} cityName
 * @param {string} [country]
 * @param {string} [region]  — область / республика для уточнения
 */
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

    renderAllPanels(apiData, cityName, country, region);
    showWeather();
  } catch (error) {
    showError(`Не удалось загрузить погоду: ${error.message}`);
    console.error('[app] loadWeather error:', error);
  }
}

/**
 * Отрисовать все панели на основе данных API.
 */
function renderAllPanels(apiData, cityName, country, region = '') {
  const todayDateStr  = new Date().toISOString().slice(0, 10);
  const current       = parseCurrentWeather(apiData);
  const hourly        = parseHourlyForDate(apiData, todayDateStr);
  const dailyFull     = parseDailyForecast(apiData);
  const todayDaily    = dailyFull.find(d => d.date === todayDateStr) ?? dailyFull[0];

  renderCurrentWeather(current, cityName, country, region);
  renderTodayPanel(current, hourly, todayDaily);
  renderWeekPanel(dailyFull);
  renderMonthPanel(dailyFull);
}

// ===== ГЕОЛОКАЦИЯ =====

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
  // admin1 — регион из Open-Meteo Geocoding (область, республика)
  loadWeather(city.latitude, city.longitude, city.name, city.country, city.admin1 ?? '');
}

function handleSearchKeydown(event) {
  if (event.key === 'Escape') {
    clearSearchSuggestions();
  }
}

// ===== ВКЛАДКИ =====

function handleTabChange(tabName) {
  // Вкладки уже отрисованы при загрузке, переключение — чисто UI
  // Если понадобится lazy-load данных — добавить здесь
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

/**
 * При загрузке страницы тихо запрашиваем геолокацию.
 * Если пользователь уже давал разрешение — погода появится сразу.
 * Если браузер покажет запрос — ждём ответа.
 * Если отказ или ошибка — просто остаёмся на экране приветствия, не пугаем.
 */
async function requestWeatherOnLoad() {
  try {
    const { latitude, longitude }   = await getCurrentPosition();
    const { name, country, region } = await reverseGeocode(latitude, longitude);
    await loadWeather(latitude, longitude, name, country, region);
    await loadWeather(latitude, longitude, name, country);
  } catch {
    // Молча игнорируем — пользователь сам введёт город или нажмёт кнопку геолокации
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

function init() {
  initTheme();
  bindThemeToggle();
  initTabs(handleTabChange);

  // Поиск
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input',   handleSearchInput);
  searchInput.addEventListener('keydown', handleSearchKeydown);

  // Геолокация по кнопке
  document.getElementById('geoBtn').addEventListener('click', handleGeoRequest);

  // Закрытие подсказок
  document.addEventListener('click', handleDocumentClick);

  // Автоопределение местоположения при старте
  requestWeatherOnLoad();
}

// Запуск
init();