// =========================================
// LOYOLA MAP - FINAL SMART SYSTEM 🔥
// =========================================

// MAP INIT
var map = L.map('map', { attributionControl: false })
  .setView([13.062472, 80.233185], 17);

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 19 }
).addTo(map);

map.zoomControl.setPosition('bottomright');

// =========================================
// ICONS
// =========================================
var iconConfig = {
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
};

var icons = {
  department: L.icon({ ...iconConfig, iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png' }),
  lab: L.icon({ ...iconConfig, iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png' }),
  hall: L.icon({ ...iconConfig, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png' }),
  toilet: L.icon({ ...iconConfig, iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }),
  water: L.icon({ ...iconConfig, iconUrl: 'https://cdn-icons-png.flaticon.com/512/728/728093.png' })
};

// =========================================
// LAYERS
// =========================================
var layers = {
  department: L.layerGroup().addTo(map),
  lab: L.layerGroup().addTo(map),
  hall: L.layerGroup().addTo(map),
  toilet: L.layerGroup().addTo(map),
  water: L.layerGroup().addTo(map)
};

// =========================================
// USER DATA (LOCAL STORAGE)
// =========================================
var userData = JSON.parse(localStorage.getItem("loyolaUser")) || {
  name: "",
  saved: []
};

// =========================================
// ROUTE
// =========================================
var userMarker, routeLine;

function drawRoute(lat, lng) {
  if (!userMarker) return alert("Click Locate Me first");

  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(
    [userMarker.getLatLng(), [lat, lng]],
    { color: "#D4A64A", weight: 4, dashArray: "6,8" }
  ).addTo(map);

  map.fitBounds(routeLine.getBounds());
}

// =========================================
// MARKERS
// =========================================
locations.forEach(function (place) {

  var type = place.type.toLowerCase();

  var marker = L.marker([place.lat, place.lng], {
    icon: icons[type]
  }).bindPopup(`
    <b>${place.name}</b><br>
    ${place.description}<br><br>
    <button onclick="drawRoute(${place.lat},${place.lng})">🧭 Navigate</button>
    <button onclick="savePlace('${place.name}')">⭐ Save</button>
  `);

  marker.on("click", () => drawRoute(place.lat, place.lng));

  if (layers[type]) marker.addTo(layers[type]);
});

// FILTER UI
L.control.layers(null, {
  "Departments": layers.department,
  "Labs": layers.lab,
  "Halls": layers.hall,
  "Toilets": layers.toilet,
  "Water": layers.water
}).addTo(map);

// =========================================
// LOCATION
// =========================================
function locateUser() {
  map.locate({ setView: true, maxZoom: 18 });

  map.on('locationfound', e => {
    if (userMarker) map.removeLayer(userMarker);

    userMarker = L.circleMarker(e.latlng, {
      radius: 8,
      fillColor: "#4A90E2",
      color: "#fff",
      weight: 2,
      fillOpacity: 0.8
    }).addTo(map).bindPopup("You are here").openPopup();
  });
}

// =========================================
// SAVE PLACE
// =========================================
function savePlace(name) {
  userData.saved.push(name);
  localStorage.setItem("loyolaUser", JSON.stringify(userData));
  alert("Saved: " + name);
}

// =========================================
// NEAREST
// =========================================
function findNearest(type) {
  if (!userMarker) return alert("Enable location first");

  let min = Infinity, nearest;

  locations.forEach(p => {
    if (p.type === type) {
      let d = map.distance(userMarker.getLatLng(), [p.lat, p.lng]);
      if (d < min) { min = d; nearest = p; }
    }
  });

  if (nearest) map.setView([nearest.lat, nearest.lng], 18);
}

// =========================================
// 🎤 VOICE COMMAND
// =========================================
function startVoice() {
  const recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recog.start();

  recog.onresult = e => {
    let text = e.results[0][0].transcript.toLowerCase();

    locations.forEach(p => {
      if (text.includes(p.name.toLowerCase())) {
        drawRoute(p.lat, p.lng);
      }
    });
  };
}

// =========================================
// AUDIO
// =========================================
var audio = document.getElementById("anthem");
var btn = document.getElementById("audioBtn");

window.onload = () => {
  audio.play().catch(() => {
    document.body.onclick = () => audio.play();
  });
};

btn.onclick = e => {
  e.stopPropagation();
  audio.paused ? audio.play() : audio.pause();
  btn.innerHTML = audio.paused ? "🔇 OFF" : "🔊 ON";
};
