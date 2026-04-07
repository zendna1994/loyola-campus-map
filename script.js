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

// Zoology Department
L.marker([13.063677,80.233606], { icon: deptIcon })
  .addTo(map)
  .bindPopup("<b>Zoology Department</b><br>Advanced Zoology & Biotechnology");

// Bio-Nexus Lab
L.marker([13.063547,80.233069], { icon: labIcon })
  .addTo(map)
  .bindPopup("<b>Bio-Nexus Hitech Lab</b>");

// Bertram Hall
L.marker([13.062448,80.233185], { icon: hallIcon })
  .addTo(map)
  .bindPopup("<b>Bertram Hall</b>");
