/**
 * comfort.js — вычисление «Комфортного индекса» прогулки.
 * Формула: на базе температуры, влажности, ветра, осадков.
 */

/**
 * Рассчитать комфортный индекс и вернуть описание.
 * @param {object} current — parseCurrentWeather()
 * @returns {{ score: number, label: string, emoji: string, color: string, detail: string }}
 */
export function computeComfortIndex(current) {
  const { temperature, humidity, windSpeed, precipitation, weatherCode } = current;

  let score = 100;

  // === Температура ===
  // Идеал 16–24°C
  if (temperature < -15) score -= 50;
  else if (temperature < -5) score -= 30;
  else if (temperature < 5)  score -= 15;
  else if (temperature < 10) score -= 8;
  else if (temperature >= 16 && temperature <= 24) score += 5;
  else if (temperature > 30) score -= 20;
  else if (temperature > 27) score -= 10;

  // === Влажность ===
  // Идеал 30–60%
  if (humidity > 90) score -= 20;
  else if (humidity > 75) score -= 10;
  else if (humidity < 20) score -= 8;

  // === Ветер ===
  // Идеал < 5 м/с
  if (windSpeed > 20) score -= 30;
  else if (windSpeed > 15) score -= 20;
  else if (windSpeed > 10) score -= 12;
  else if (windSpeed > 7)  score -= 6;
  else if (windSpeed > 5)  score -= 3;

  // === Осадки ===
  if (precipitation > 5) score -= 25;
  else if (precipitation > 1) score -= 15;
  else if (precipitation > 0.1) score -= 8;

  // === Код погоды: гроза/шторм ===
  if (weatherCode >= 95) score -= 30;
  else if (weatherCode >= 80) score -= 10;

  score = Math.max(0, Math.min(100, score));

  // === Вердикт ===
  let label, emoji, color, detail;

  if (score >= 75) {
    label  = 'Отлично для прогулки';
    emoji  = '🌟';
    color  = '#22c55e';
    detail = buildDetail(temperature, humidity, windSpeed, precipitation);
  } else if (score >= 55) {
    label  = 'Неплохо, но возьми куртку';
    emoji  = '🧥';
    color  = '#84cc16';
    detail = buildDetail(temperature, humidity, windSpeed, precipitation);
  } else if (score >= 40) {
    label  = 'Захвати зонт';
    emoji  = '☂️';
    color  = '#eab308';
    detail = buildDetail(temperature, humidity, windSpeed, precipitation);
  } else if (score >= 25) {
    label  = 'Лучше одеться потеплее';
    emoji  = '🥶';
    color  = '#f97316';
    detail = buildDetail(temperature, humidity, windSpeed, precipitation);
  } else {
    label  = 'Лучше остаться дома';
    emoji  = '🏠';
    color  = '#ef4444';
    detail = buildDetail(temperature, humidity, windSpeed, precipitation);
  }

  return { score, label, emoji, color, detail };
}

function buildDetail(temp, humidity, wind, precip) {
  const parts = [];
  if (temp < 5) parts.push('холодно');
  else if (temp > 28) parts.push('жарко');
  if (humidity > 80) parts.push('высокая влажность');
  if (wind > 10) parts.push(`сильный ветер ${wind} м/с`);
  if (precip > 0.1) parts.push('идут осадки');
  return parts.length ? parts.join(', ') : 'комфортные условия';
}
