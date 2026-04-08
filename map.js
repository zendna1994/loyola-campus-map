// =========================================
// LOYOLA CAMPUS MAP - ZEN ENGINE V2 (FIXED)
// =========================================

// 1. INITIALIZE MAP
var map = L.map('map', {
  attributionControl: false
}).setView([13.062472, 80.233185], 17);

// 2. SATELLITE TILE
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 19 }
).addTo(map);

// 3. ZOOM POSITION
map.zoomControl.setPosition('bottomright');


// =========================================
// 🎨 ICONS (FIXED)
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
  water: L.icon({ ...iconConfig, iconUrl: 'https://cdn-icons-png.flaticon.com/512/728/728093.png' }) // ✅ FIXED
};


// =========================================
// 🎛 LAYERS
// =========================================
var layers = {
  department: L.layerGroup().addTo(map),
  lab: L.layerGroup().addTo(map),
  hall: L.layerGroup().addTo(map),
  toilet: L.layerGroup().addTo(map),
  water: L.layerGroup().addTo(map)
};


// =========================================
// 📍 LOAD DATA
// =========================================
locations.forEach(function (place) {

  var typeKey = place.type.toLowerCase();
  var selectedIcon = icons[typeKey] || icons.department;

  var marker = L.marker([place.lat, place.lng], {
    icon: selectedIcon
  }).bindPopup(
    "<b>" + place.name + "</b><br>" + place.description
  );

  if (layers[typeKey]) {
    marker.addTo(layers[typeKey]);
  }
});


// =========================================
// 🎛 FILTER CONTROL
// =========================================
L.control.layers(null, {
  "Departments": layers.department,
  "Labs": layers.lab,
  "Halls": layers.hall,
  "Toilets": layers.toilet,
  "Water": layers.water
}, {
  position: 'topright'
}).addTo(map);


// =========================================
// 📍 LOCATION
// =========================================
var userMarker;

function locateUser() {
  map.locate({ setView: true, maxZoom: 18 });

  map.on('locationfound', function (e) {
    if (userMarker) map.removeLayer(userMarker);

    userMarker = L.circleMarker(e.latlng, {
      radius: 8,
      fillColor: "#4A90E2",
      color: "#fff",
      weight: 2,
      fillOpacity: 0.8
    }).addTo(map)
      .bindPopup("<b>You are here</b>")
      .openPopup();
  });
}


// =========================================
// 📏 NEAREST
// =========================================
function findNearest(type) {
  if (!userMarker) {
    alert("Click Locate Me first");
    return;
  }

  var userLatLng = userMarker.getLatLng();
  var nearest = null;
  var minDist = Infinity;

  locations.forEach(function (place) {
    if (place.type.toLowerCase() === type) {
      var dist = map.distance(userLatLng, [place.lat, place.lng]);
      if (dist < minDist) {
        minDist = dist;
        nearest = place;
      }
    }
  });

  if (nearest) {
    map.setView([nearest.lat, nearest.lng], 18);
  }
}


// =========================================
// 🎵 AUDIO
// =========================================
var audio = document.getElementById("anthem");
var btn = document.getElementById("audioBtn");

window.addEventListener("load", function () {
  audio.play().catch(() => {
    document.body.addEventListener("click", function start() {
      audio.play();
      document.body.removeEventListener("click", start);
    });
  });
});

btn.onclick = function (e) {
  e.stopPropagation();

  if (audio.paused) {
    audio.play();
    btn.innerHTML = "🔊 ON";
  } else {
    audio.pause();
    btn.innerHTML = "🔇 OFF";
  }
};
