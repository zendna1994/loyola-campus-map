// ======================================
// LOYOLA MAP - GOOGLE SHEET VERSION
// ======================================

// MAP INIT
var map = L.map('map', { attributionControl: false })
  .setView([13.0616, 80.2347], 17);

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 19 }
).addTo(map);

map.zoomControl.setPosition('topleft');

// ======================================
// ICONS (USE YOUR GITHUB LINKS)
// ======================================

var icons = {
  department: L.icon({
    iconUrl: 'assets/icons/department.png',
    iconSize: [30, 30]
  }),
  lab: L.icon({
    iconUrl: 'assets/icons/lab.png',
    iconSize: [30, 30]
  }),
  hall: L.icon({
    iconUrl: 'assets/icons/hall.png',
    iconSize: [30, 30]
  }),
  auditorium: L.icon({
    iconUrl: 'assets/icons/auditorium.png',
    iconSize: [30, 30]
  }),
  toilet: L.icon({
    iconUrl: 'assets/icons/toilet.png',
    iconSize: [30, 30]
  }),
  water: L.icon({
    iconUrl: 'assets/icons/water.png',
    iconSize: [30, 30]
  }),
  building: L.icon({
    iconUrl: 'assets/icons/building.png',
    iconSize: [30, 30]
  }),
  gate: L.icon({
    iconUrl: 'assets/icons/gate.png',
    iconSize: [30, 30]
  }),
  parking: L.icon({
    iconUrl: 'assets/icons/parking.png',
    iconSize: [30, 30]
  })
};

// ======================================
// LAYERS
// ======================================
var layers = {};
Object.keys(icons).forEach(type => {
  layers[type] = L.layerGroup().addTo(map);
});

// ======================================
// FETCH GOOGLE SHEET DATA
// ======================================
fetch(SHEET_URL)
  .then(res => res.text())
  .then(csv => {

    var rows = csv.split("\n").slice(1);

    rows.forEach(row => {
      var cols = row.split(",");

      if (cols.length < 8) return;

      var category = cols[0].trim().toLowerCase();
      var name = cols[2].trim();
      var building = cols[3].trim();
      var floor = cols[4].trim();
      var lat = parseFloat(cols[5]);
      var lng = parseFloat(cols[6]);
      var desc = cols[7].trim();

      if (!lat || !lng) return;

      var icon = icons[category] || icons.building;

      var marker = L.marker([lat, lng], { icon: icon })
        .bindPopup(`
          <b>${name}</b><br>
          ${desc}<br>
          <small>${building} | Floor: ${floor}</small>
        `);

      if (layers[category]) {
        marker.addTo(layers[category]);
      }
    });

  });

// ======================================
// FILTER CONTROL
// ======================================
L.control.layers(null, layers, {
  position: 'topright'
}).addTo(map);
