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
// Layer groups
var deptLayer = L.layerGroup().addTo(map);
var labLayer = L.layerGroup().addTo(map);
var hallLayer = L.layerGroup().addTo(map);
// Department
L.marker([13.0639, 80.2335], { icon: deptIcon })
  .bindPopup("<b>Zoology Department</b>")
  .addTo(deptLayer);

// Lab
L.marker([13.0645, 80.2342], { icon: labIcon })
  .bindPopup("<b>Bio-Nexus Hitech Lab</b>")
  .addTo(labLayer);

// Hall
L.marker([13.0652, 80.2328], { icon: hallIcon })
  .bindPopup("<b>Bertram Hall</b>")
  .addTo(hallLayer);

// Layer control
var overlays = {
  "Departments": deptLayer,
  "Labs": labLayer,
  "Halls": hallLayer
};

L.control.layers(null, overlays, {
  position: 'bottomright'
}).addTo(map);
