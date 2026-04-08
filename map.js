// ======================================
// LOYOLA MAP - FINAL (WITH FLOOR SYSTEM)
// ======================================

// ==========================
// LOGIN SYSTEM
// ==========================
var user = JSON.parse(localStorage.getItem("loyolaUser"));

if (user) {
  document.getElementById("loginScreen").style.display = "none";
}

function login() {
  var name = document.getElementById("name").value;
  var role = document.getElementById("role").value;

  localStorage.setItem("loyolaUser", JSON.stringify({ name, role }));
  document.getElementById("loginScreen").style.display = "none";
}

function editProfile() {
  document.getElementById("loginScreen").style.display = "flex";
}

// ==========================
// MAP INIT
// ==========================
var map = L.map('map', { attributionControl: false })
  .setView([13.0616, 80.2347], 17);

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 19 }
).addTo(map);

map.zoomControl.setPosition('topleft');

// ==========================
// ICONS (USE YOUR LINKS)
// ==========================
var icons = {
  department: L.icon({ iconUrl: 'assets/icons/department.png', iconSize: [30,30] }),
  lab: L.icon({ iconUrl: 'assets/icons/lab.png', iconSize: [30,30] }),
  hall: L.icon({ iconUrl: 'assets/icons/hall.png', iconSize: [30,30] }),
  auditorium: L.icon({ iconUrl: 'assets/icons/auditorium.png', iconSize: [30,30] }),
  toilet: L.icon({ iconUrl: 'assets/icons/toilet.png', iconSize: [30,30] }),
  water: L.icon({ iconUrl: 'assets/icons/water.png', iconSize: [30,30] }),
  building: L.icon({ iconUrl: 'assets/icons/building.png', iconSize: [30,30] }),
  gate: L.icon({ iconUrl: 'assets/icons/gate.png', iconSize: [30,30] }),
  parking: L.icon({ iconUrl: 'assets/icons/parking.png', iconSize: [30,30] })
};

// ==========================
// LAYERS
// ==========================
var layers = {};
Object.keys(icons).forEach(type => {
  layers[type] = L.layerGroup().addTo(map);
});

// ==========================
// STORE ALL LOCATIONS
// ==========================
var allLocations = [];

// ==========================
// FETCH GOOGLE SHEET
// ==========================
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

      // FLOOR FIX (G → ground)
      var rawFloor = cols[4].trim().toUpperCase();
      var floor = rawFloor === "G" ? "ground" : rawFloor;

      var lat = parseFloat(cols[5]);
      var lng = parseFloat(cols[6]);
      var desc = cols[7].trim();

      if (!lat || !lng) return;

      var place = { category, name, building, floor, lat, lng, desc };

      allLocations.push(place);

      addMarker(place);
    });

  });

// ==========================
// ADD MARKER FUNCTION
// ==========================
function addMarker(place) {

  var icon = icons[place.category] || icons.building;

  var marker = L.marker([place.lat, place.lng], { icon })
    .bindPopup(`
      <b>${place.name}</b><br>
      ${place.desc}<br>
      <small>${place.building} | Floor: ${place.floor}</small>
    `);

  if (layers[place.category]) {
    marker.addTo(layers[place.category]);
  }
}

// ==========================
// FLOOR FILTER
// ==========================
function filterFloor(selectedFloor) {

  // clear all layers
  Object.values(layers).forEach(layer => layer.clearLayers());

  allLocations.forEach(place => {

    if (selectedFloor === "all" || place.floor === selectedFloor) {
      addMarker(place);
    }

  });
}

// ==========================
// LOCATE USER
// ==========================
var userMarker;

function locateUser() {
  map.locate({ setView: true, maxZoom: 18 });

  map.on('locationfound', function (e) {
    if (userMarker) map.removeLayer(userMarker);

    userMarker = L.marker(e.latlng)
      .addTo(map)
      .bindPopup("You are here")
      .openPopup();
  });
}

// ==========================
// NEAREST
// ==========================
function findNearest(type) {
  if (!userMarker) return alert("Click Locate first");

  let min = Infinity, nearest;

  allLocations.forEach(p => {
    if (p.category === type) {
      let d = map.distance(userMarker.getLatLng(), [p.lat, p.lng]);
      if (d < min) {
        min = d;
        nearest = p;
      }
    }
  });

  if (nearest) {
    map.setView([nearest.lat, nearest.lng], 18);
  }
}

// ==========================
// VOICE
// ==========================
function startVoice() {
  let r = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  r.start();

  r.onresult = e => {
    let text = e.results[0][0].transcript.toLowerCase();

    allLocations.forEach(p => {
      if (text.includes(p.name.toLowerCase())) {
        map.setView([p.lat, p.lng], 18);
      }
    });
  };
}

// ==========================
// MENU TOGGLE
// ==========================
function toggleMenu() {
  var menu = document.getElementById("menu");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

// ==========================
// AUDIO
// ==========================
var audio = document.getElementById("anthem");

window.onload = () => {
  audio.play().catch(() => {
    document.body.onclick = () => audio.play();
  });
};
