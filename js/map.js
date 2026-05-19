/**
 * map.js — интерактивная карта погоды.
 * Яндекс Карты JavaScript API + тайлы OpenWeatherMap.
 */

const YANDEX_KEY = 'd02b99bd-3cc7-43c9-a074-b2238748bd6c';
const OWM_KEY    = 'd80b88112680b7aa1ee468f262cf870a';

const LAYERS = [
  { id: 'precipitation_new', label: '🌧 Осадки' },
  { id: 'temp_new',          label: '🌡 Температура' },
  { id: 'wind_new',          label: '💨 Ветер' },
  { id: 'clouds_new',        label: '☁ Облачность' },
];

let mapInstance    = null;
let activeLayer    = null;
let currentLayerId = 'precipitation_new';
let ymapsReady     = false;

export function initMap(lat, lng) {
  renderMapUI();

  if (!window.ymaps) {
    loadYmaps(() => createMap(lat, lng));
  } else if (!ymapsReady) {
    window.ymaps.ready(() => { ymapsReady = true; createMap(lat, lng); });
  } else {
    createMap(lat, lng);
  }
}

export function updateMapCenter(lat, lng) {
  if (mapInstance) mapInstance.setCenter([lat, lng]);
}

// ===== ВНУТРЕННИЕ ФУНКЦИИ =====

function renderMapUI() {
  const panel = document.getElementById('panelMap');
  if (!panel || panel.querySelector('.map-wrapper')) return;

  panel.innerHTML = `
    <div class="map-layer-switcher" id="mapLayerSwitcher">
      ${LAYERS.map(l => `
        <button class="map-layer-btn ${l.id === currentLayerId ? 'map-layer-btn--active' : ''}"
          data-layer="${l.id}">${l.label}</button>
      `).join('')}
    </div>
    <div class="map-wrapper">
      <div id="weatherMap"></div>
    </div>
  `;

  document.getElementById('mapLayerSwitcher').addEventListener('click', e => {
    const btn = e.target.closest('[data-layer]');
    if (!btn) return;
    switchLayer(btn.dataset.layer);
    document.querySelectorAll('.map-layer-btn').forEach(b => b.classList.remove('map-layer-btn--active'));
    btn.classList.add('map-layer-btn--active');
  });
}

function loadYmaps(cb) {
  const script = document.createElement('script');
  script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_KEY}&lang=ru_RU`;
  script.onload = () => {
    window.ymaps.ready(() => { ymapsReady = true; cb(); });
  };
  document.head.appendChild(script);
}

function createMap(lat, lng) {
  if (mapInstance) {
    mapInstance.destroy();
    mapInstance = null;
  }

  mapInstance = new ymaps.Map('weatherMap', {
    center: [lat, lng],
    zoom: 6,
    controls: ['zoomControl'],
  }, {
    suppressMapOpenBlock: true,
  });

  // Маркер города
  const marker = new ymaps.Placemark([lat, lng], {}, {
    preset: 'islands#blueDotIcon',
  });
  mapInstance.geoObjects.add(marker);

  addWeatherLayer(currentLayerId);
}

function addWeatherLayer(layerId) {
  if (activeLayer && mapInstance) {
    mapInstance.layers.remove(activeLayer);
    activeLayer = null;
  }
  currentLayerId = layerId;
  if (!mapInstance) return;

  activeLayer = new ymaps.Layer(
    `https://tile.openweathermap.org/map/${layerId}/{z}/{x}/{y}.png?appid=${OWM_KEY}`,
    { tileTransparent: true, opacity: 0.7 }
  );
  mapInstance.layers.add(activeLayer);
}

function switchLayer(layerId) {
  if (layerId === currentLayerId) return;
  addWeatherLayer(layerId);
}
