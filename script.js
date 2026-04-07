// Loyola College center
var map = L.map('map').setView([13.0643, 80.2337], 17);

// Satellite tiles (clean)
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles © Esri',
    maxZoom: 19
  }
).addTo(map);

// Optional: remove zoom control (clean UI)
map.zoomControl.setPosition('bottomright');

// Test marker
L.marker([13.0643, 80.2337])
  .addTo(map)
  .bindPopup("Loyola College Campus")
  .openPopup();
