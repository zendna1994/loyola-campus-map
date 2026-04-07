// 1. Create map
var map = L.map('map').setView([13.0643, 80.2337], 17);

// 2. Satellite layer
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles © Esri',
    maxZoom: 19
  }
).addTo(map);

// 3. ICONS (ADD HERE)
var deptIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/1570/1570896.png',
  iconSize: [30, 30]
});

var labIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/3483/3483663.png',
  iconSize: [30, 30]
});

var hallIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/16841/16841560.png',
  iconSize: [30, 30]
});

// 4. MARKERS (ADD HERE — PART 3)
L.marker([13.06,80.23], { icon: deptIcon })
  .addTo(map)
  .bindPopup("<b>Zoology Department</b><br>Advanced Zoology & Biotechnology");

L.marker([13.06,80.233], { icon: labIcon })
  .addTo(map)
  .bindPopup("<b>Bio-Nexus Hitech Lab</b>");

L.marker([13.06,80.23], { icon: hallIcon })
  .addTo(map)
  .bindPopup("<b>Bertram Hall</b>");
