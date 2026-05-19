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
  } catch (error) {
    showError(`Не удалось загрузить погоду: ${error.message}`);
    console.error('[app] loadWeather error:', error);
  }
}

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
