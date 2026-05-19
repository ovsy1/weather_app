/**
 * api.js — все запросы к Open-Meteo и Geocoding API
 * Единственное место, где знают об эндпоинтах и параметрах.
 */

const GEOCODING_BASE_URL = 'https://geocoding-api.open-meteo.com/v1';
const WEATHER_BASE_URL   = 'https://api.open-meteo.com/v1';

// Параметры погоды, которые запрашиваем всегда
const CURRENT_PARAMS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'weather_code',
  'surface_pressure',
  'wind_speed_10m',
  'wind_direction_10m',
  'cloud_cover',
  'visibility',
  'uv_index',
].join(',');

const HOURLY_PARAMS = [
  'temperature_2m',
  'precipitation_probability',
  'weather_code',
  'wind_speed_10m',
  'relative_humidity_2m',
].join(',');

const DAILY_PARAMS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
  'uv_index_max',
].join(',');

/**
 * Базовый fetch с обработкой ошибок.
 * @param {string} url
 * @returns {Promise<object>}
 */
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Поиск городов по строке запроса.
 * @param {string} query
 * @param {number} [count=6]
 * @returns {Promise<Array>}
 */
export async function searchCities(query, count = 6) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `${GEOCODING_BASE_URL}/search?name=${encodeURIComponent(trimmed)}&count=${count}&language=ru&format=json`;
  const data = await fetchJson(url);
  return data.results ?? [];
}

/**
 * Получить название города по координатам (reverse geocoding).
 * Open-Meteo не поддерживает reverse, используем их же geocoding
 * через временное решение — просто возвращаем координаты как есть.
 * Для человекочитаемого имени используем nominatim.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{name: string, country: string}>}
 */
export async function reverseGeocode(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru&zoom=14&addressdetails=1`;
  const data = await fetchJson(url);

  const address = data.address ?? {};

  // Nominatim возвращает разные поля в зависимости от типа населённого пункта.
  // Берём максимально точное: city_district и suburb пропускаем — это районы,
  // а не самостоятельные города. Ищем реальный населённый пункт.
  const cityName =
    address.town         ??   // малый/средний город (Октябрьский, Стерлитамак)
    address.village      ??   // посёлок, деревня
    address.hamlet       ??   // хутор
    address.suburb       ??   // пригород (fallback)
    address.city         ??   // крупный город — только если ничего точнее нет
    address.municipality ??
    address.county       ??
    'Текущее место';

  const region  = address.state ?? '';
  const country = address.country ?? '';

  return { name: cityName, region, country };
}

/**
 * Загрузить полный набор погодных данных для координат.
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} [forecastDays=16]  — количество дней прогноза, макс. 16 на бесплатном плане
 * @returns {Promise<object>}
 */
export async function fetchWeatherData(latitude, longitude, forecastDays = 16) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current:      CURRENT_PARAMS,
    hourly:       HOURLY_PARAMS,
    daily:        DAILY_PARAMS,
    forecast_days: forecastDays,
    timezone:     'auto',
    // wind_speed_unit не указываем — Open-Meteo отдаёт км/ч по умолчанию,
    // конвертируем в м/с сами в weather.js
  });

  const url = `${WEATHER_BASE_URL}/forecast?${params}`;
  return fetchJson(url);
}