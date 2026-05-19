/**
 * facts.js — факты о городах и праздники.
 * Факты о городах: Wikipedia Search API (бесплатно, без ключа).
 * Праздники: date.nager.at (бесплатно, без ключа).
 */

// ===== КЭШ =====
const factCache = new Map();

/**
 * Извлечь первое полное предложение из текста Wikipedia.
 */
function extractFact(text) {
  if (!text) return '';
  const clean = text.replace(/\s*\([^)]*\)/g, '').trim();
  const match = clean.match(/[^.!?]+[.!?]/);
  if (!match) return clean.slice(0, 150).trim();
  return match[0].trim();
}

/**
 * Проверить что статья действительно о городе, а не о топониме/фамилии.
 */
function isCityArticle(data) {
  if (data.type === 'disambiguation') return false;
  const desc = (data.description ?? '').toLowerCase();
  const extract = (data.extract ?? '').toLowerCase();
  if (desc.includes('топоним') || desc.includes('фамилия') || desc.includes('disambiguation')) return false;
  if (extract.startsWith('топоним') || extract.startsWith('фамилия')) return false;
  return true;
}

/**
 * Получить короткий факт о городе через Wikipedia Search API.
 * Один запрос — сразу находим нужную статью.
 * @param {string} cityName
 * @param {string} country
 * @param {string} [region]
 * @returns {Promise<string>}
 */
export async function getCityFact(cityName, country, region = '') {
  const key = `${cityName}|${country}|${region}`;
  if (factCache.has(key)) return factCache.get(key);

  // Формируем поисковый запрос: "Октябрьский город Башкортостан"
  const searchQuery = [cityName, 'город', region].filter(Boolean).join(' ');

  try {
    // Wikipedia Search API — возвращает топ результатов с extract
    const searchUrl = `https://ru.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=3&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error('search failed');

    const searchData = await searchRes.json();
    const results = searchData.query?.search ?? [];

    // Берём первый результат, получаем его summary
    for (const result of results) {
      const title = encodeURIComponent(result.title);
      const summaryUrl = `https://ru.wikipedia.org/api/rest_v1/page/summary/${title}`;

      const summaryRes = await fetch(summaryUrl);
      if (!summaryRes.ok) continue;

      const data = await summaryRes.json();
      if (!isCityArticle(data)) continue;

      const fact = extractFact(data.extract ?? '');
      if (fact) {
        factCache.set(key, fact);
        return fact;
      }
    }
  } catch { /* продолжаем */ }

  // Фолбэк: английская Wikipedia
  try {
    const searchQuery2 = [cityName, region, country].filter(Boolean).join(', ');
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery2)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (isCityArticle(data)) {
        const fact = extractFact(data.extract ?? '');
        if (fact) { factCache.set(key, fact); return fact; }
      }
    }
  } catch { /* ничего */ }

  return '';
}

// ===== ПРАЗДНИКИ =====

const COUNTRY_CODES = {
  'Россия': 'RU', 'Russia': 'RU',
  'США': 'US', 'United States': 'US', 'United States of America': 'US',
  'Германия': 'DE', 'Germany': 'DE',
  'Франция': 'FR', 'France': 'FR',
  'Великобритания': 'GB', 'United Kingdom': 'GB',
  'Япония': 'JP', 'Japan': 'JP',
  'Китай': 'CN', 'China': 'CN',
  'Польша': 'PL', 'Poland': 'PL',
  'Украина': 'UA', 'Ukraine': 'UA',
  'Беларусь': 'BY', 'Belarus': 'BY',
  'Казахстан': 'KZ', 'Kazakhstan': 'KZ',
  'Италия': 'IT', 'Italy': 'IT',
  'Испания': 'ES', 'Spain': 'ES',
  'Швеция': 'SE', 'Sweden': 'SE',
  'Норвегия': 'NO', 'Norway': 'NO',
  'Финляндия': 'FI', 'Finland': 'FI',
  'Канада': 'CA', 'Canada': 'CA',
  'Австралия': 'AU', 'Australia': 'AU',
  'Турция': 'TR', 'Turkey': 'TR',
};

/**
 * Получить праздник на сегодняшнюю дату через date.nager.at.
 * @param {string} dateStr  — "YYYY-MM-DD"
 * @param {string} [country]
 * @returns {Promise<{name: string, fact: string} | null>}
 */
export async function getTodayHoliday(dateStr, country = '') {
  const cacheKey = `holiday|${dateStr}`;
  if (factCache.has(cacheKey)) return factCache.get(cacheKey);

  const [year] = dateStr.split('-');
  const countryCode = COUNTRY_CODES[country] ?? 'RU';

  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
    const res = await fetch(url);
    if (!res.ok) { factCache.set(cacheKey, null); return null; }

    const holidays = await res.json();
    const today = holidays.find(h => h.date === dateStr);
    if (!today) { factCache.set(cacheKey, null); return null; }

    const result = {
      name: today.localName || today.name,
      fact: today.name !== today.localName ? today.name : '',
    };
    factCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}
