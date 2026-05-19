/**
 * weather.js — бизнес-логика: парсинг данных API, WMO коды, форматирование.
 * Здесь нет ни DOM, ни fetch — только чистые функции над данными.
 */

// ===== WMO КОДЫ ПОГОДЫ =====
// https://open-meteo.com/en/docs#weathervariables

const WMO_CONDITIONS = {
  0:  { label: 'Ясно',                  icon: '☀️' },
  1:  { label: 'Преимущественно ясно',  icon: '🌤️' },
  2:  { label: 'Переменная облачность',  icon: '⛅' },
  3:  { label: 'Пасмурно',              icon: '☁️' },
  45: { label: 'Туман',                 icon: '🌫️' },
  48: { label: 'Туман с изморозью',     icon: '🌫️' },
  51: { label: 'Слабая морось',         icon: '🌦️' },
  53: { label: 'Умеренная морось',      icon: '🌦️' },
  55: { label: 'Сильная морось',        icon: '🌧️' },
  56: { label: 'Ледяная морось',        icon: '🌨️' },
  57: { label: 'Сильная ледяная морось',icon: '🌨️' },
  61: { label: 'Слабый дождь',          icon: '🌧️' },
  63: { label: 'Умеренный дождь',       icon: '🌧️' },
  65: { label: 'Сильный дождь',         icon: '🌧️' },
  66: { label: 'Ледяной дождь',         icon: '🌨️' },
  67: { label: 'Сильный ледяной дождь', icon: '🌨️' },
  71: { label: 'Слабый снегопад',       icon: '🌨️' },
  73: { label: 'Умеренный снегопад',    icon: '❄️' },
  75: { label: 'Сильный снегопад',      icon: '❄️' },
  77: { label: 'Снежные зёрна',         icon: '🌨️' },
  80: { label: 'Слабые ливни',          icon: '🌦️' },
  81: { label: 'Умеренные ливни',       icon: '🌧️' },
  82: { label: 'Сильные ливни',         icon: '⛈️' },
  85: { label: 'Слабые снежные ливни',  icon: '🌨️' },
  86: { label: 'Сильные снежные ливни', icon: '🌨️' },
  95: { label: 'Гроза',                 icon: '⛈️' },
  96: { label: 'Гроза с градом',        icon: '⛈️' },
  99: { label: 'Сильная гроза с градом',icon: '⛈️' },
};

const FALLBACK_CONDITION = { label: 'Неизвестно', icon: '🌡️' };

/**
 * Получить описание и иконку по WMO-коду.
 * @param {number} code
 * @returns {{ label: string, icon: string }}
 */
export function getCondition(code) {
  return WMO_CONDITIONS[code] ?? FALLBACK_CONDITION;
}

// ===== НАПРАВЛЕНИЯ ВЕТРА =====

const WIND_DIRECTIONS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];

/**
 * Перевести градусы в сторону света.
 * @param {number} degrees
 * @returns {string}
 */
export function degreesToWindDirection(degrees) {
  const index = Math.round(degrees / 45) % 8;
  return WIND_DIRECTIONS[index];
}

// ===== ДАВЛЕНИЕ =====

/**
 * Перевести гПа в мм рт. ст.
 * @param {number} hPa
 * @returns {number}
 */
export function hPaToMmHg(hPa) {
  return Math.round(hPa * 0.75006);
}

/**
 * Перевести км/ч в м/с (Open-Meteo отдаёт км/ч по умолчанию).
 * @param {number} kmh
 * @returns {number}
 */
function kmhToMs(kmh) {
  return Math.round((kmh / 3.6) * 10) / 10;
}

// ===== ФОРМАТИРОВАНИЕ =====

/**
 * Форматировать температуру с символом градуса.
 * @param {number} temp
 * @returns {string}
 */
export function formatTemp(temp) {
  const rounded = Math.round(temp);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

/**
 * Форматировать время "ЧЧ:ММ" из строки ISO.
 * @param {string} isoString
 * @returns {string}
 */
export function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Форматировать дату в "Пн, 12 июн".
 * @param {string} dateString  — "YYYY-MM-DD"
 * @returns {string}
 */
export function formatDate(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Получить только название дня недели.
 * @param {string} dateString
 * @returns {string}
 */
export function formatWeekday(dateString) {
  const date = new Date(dateString + 'T00:00:00');
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'long' });
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

/**
 * Проверить, является ли строка сегодняшней датой.
 * @param {string} dateString — "YYYY-MM-DD"
 * @returns {boolean}
 */
export function isToday(dateString) {
  const today = new Date().toISOString().slice(0, 10);
  return dateString === today;
}

// ===== ПАРСИНГ ОТВЕТА API =====

/**
 * Извлечь текущие данные погоды из ответа Open-Meteo.
 * @param {object} apiResponse
 * @returns {object}
 */
export function parseCurrentWeather(apiResponse) {
  const current = apiResponse.current;
  const condition = getCondition(current.weather_code);

  return {
    temperature:    Math.round(current.temperature_2m),
    feelsLike:      Math.round(current.apparent_temperature),
    humidity:       current.relative_humidity_2m,
    windSpeed:      kmhToMs(current.wind_speed_10m),
    windDirection:  degreesToWindDirection(current.wind_direction_10m),
    windDegrees:    current.wind_direction_10m,
    pressure:       hPaToMmHg(current.surface_pressure),
    precipitation:  current.precipitation,
    cloudCover:     current.cloud_cover,
    visibility:     Math.round(current.visibility / 1000 * 10) / 10, // в км
    uvIndex:        current.uv_index,
    weatherCode:    current.weather_code,
    icon:           condition.icon,
    description:    condition.label,
    time:           current.time,
  };
}

/**
 * Извлечь почасовые данные для конкретной даты.
 * @param {object} apiResponse
 * @param {string} targetDate — "YYYY-MM-DD"
 * @returns {Array<object>}
 */
export function parseHourlyForDate(apiResponse, targetDate) {
  const { hourly } = apiResponse;

  return hourly.time
    .map((isoTime, index) => ({
      time:                  isoTime,
      temperature:           Math.round(hourly.temperature_2m[index]),
      precipitationProb:     hourly.precipitation_probability[index],
      weatherCode:           hourly.weather_code[index],
      windSpeed:             kmhToMs(hourly.wind_speed_10m[index]),
      humidity:              hourly.relative_humidity_2m[index],
    }))
    .filter(hour => hour.time.startsWith(targetDate));
}

/**
 * Извлечь ежедневный прогноз.
 * @param {object} apiResponse
 * @param {number} [daysCount]  — ограничить количество дней
 * @returns {Array<object>}
 */
export function parseDailyForecast(apiResponse, daysCount) {
  const { daily } = apiResponse;
  const total = daysCount ? Math.min(daysCount, daily.time.length) : daily.time.length;

  return Array.from({ length: total }, (_, index) => {
    const condition = getCondition(daily.weather_code[index]);
    return {
      date:             daily.time[index],
      weatherCode:      daily.weather_code[index],
      icon:             condition.icon,
      description:      condition.label,
      tempMax:          Math.round(daily.temperature_2m_max[index]),
      tempMin:          Math.round(daily.temperature_2m_min[index]),
      precipitationSum: daily.precipitation_sum[index],
      precipProb:       daily.precipitation_probability_max[index],
      windSpeedMax:     kmhToMs(daily.wind_speed_10m_max[index]),
      sunrise:          daily.sunrise[index],
      sunset:           daily.sunset[index],
      uvIndexMax:       daily.uv_index_max[index],
    };
  });
}
