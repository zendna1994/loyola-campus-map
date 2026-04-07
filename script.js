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
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
  iconSize: [30, 30]
});

var labIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png',
  iconSize: [30, 30]
});

var hallIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png',
  iconSize: [30, 30]
});

// 4. MARKERS (ADD HERE — PART 3)
L.marker([13.063712,80.233659], { icon: deptIcon })
  .addTo(map)
  .bindPopup("<b>Zoology Department</b><br>Advanced Zoology & Biotechnology");

L.marker([13.063584,80.233114], { icon: labIcon })
  .addTo(map)
  .bindPopup("<b>Bio-Nexus Hitech Lab</b>");

L.marker([13.062464,80.233241], { icon: hallIcon })
  .addTo(map)
  .bindPopup("<b>Bertram Hall</b>");
