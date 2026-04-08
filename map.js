// ===============================
// LOYOLA CAMPUS MAP - BASE MODULE
// ===============================

// 1. CREATE MAP
var map = L.map('map', {
  zoomControl: true
}).setView([13.0643, 80.2337], 17);

// --------------------------------
// 🔧 CHANGE THIS ONLY IF NEEDED
// Center coordinates of campus
// Format: [latitude, longitude]
// --------------------------------


// 2. ADD SATELLITE TILE (CLEAN)
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles © Esri',
    maxZoom: 20
  }
).addTo(map);


// 3. OPTIONAL CLEAN UI SETTINGS
map.zoomControl.setPosition('bottomright');


// 4. GLOBAL MAP ACCESS (IMPORTANT FOR NEXT MODULES)
window.loyolaMap = map;


// ===============================
// END OF MODULE 1
// ===============================
