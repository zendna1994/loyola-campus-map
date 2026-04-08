var map = L.map('map', {
  zoomControl: false
}).setView([13.061592, 80.234699], 17);

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles © Esri',
    maxZoom: 19
  }
).addTo(map);

L.control.zoom({
  position: 'bottomright'
}).addTo(map);

window.loyolaMap = map;
