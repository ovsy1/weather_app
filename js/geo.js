/**
 * geo.js — работа с Geolocation API браузера.
 */

const GEO_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 60_000, // кэшируем позицию на 1 минуту
};

/**
 * Запросить текущие координаты пользователя.
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Геолокация не поддерживается браузером'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude:  position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      (error) => reject(mapGeoError(error)),
      GEO_OPTIONS,
    );
  });
}

/**
 * Перевести код ошибки Geolocation API в понятное сообщение.
 * @param {GeolocationPositionError} error
 * @returns {Error}
 */
function mapGeoError(error) {
  const messages = {
    [error.PERMISSION_DENIED]:  'Доступ к геолокации запрещён',
    [error.POSITION_UNAVAILABLE]: 'Не удалось определить местоположение',
    [error.TIMEOUT]: 'Превышено время ожидания геолокации',
  };
  return new Error(messages[error.code] ?? 'Ошибка геолокации');
}
