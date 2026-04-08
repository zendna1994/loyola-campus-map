// =========================================
// LOYOLA CAMPUS MAP - ZEN ENGINE V2
// =========================================

// 1. INITIALIZE MAP
// Focus set on Bertram Hall/Library area based on your updated locations
var map = L.map('map', {
  attributionControl: false
}).setView([13.062472, 80.233185], 17);

// 2. SATELLITE TILE
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 19 }
).addTo(map);

// 3. UI POSITIONING
map.zoomControl.setPosition('bottomright');

// =========================================
// 🎨 ICONS (Fixed Anchoring for Precision)
// =========================================
var iconConfig = {
  iconSize: [32, 32],
  iconAnchor: [16, 32], // Points the bottom tip of the icon to the coordinate
  popupAnchor: [0, -32]
};

var icons = {
  department: L.icon({ ...iconConfig, iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png' }),
  lab: L.icon({ ...iconConfig, iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png' }),
  hall: L.icon({ ...iconConfig, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png' }),
  toilet: L.icon({ ...iconConfig, iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }),
  water: L.icon({ ...iconSet, iconUrl: 'https://cdn-icons-png.flaticon.com/512/728/728093.png' })
};

// =========================================
// 🎛 LAYERS & FILTER SYSTEM
// =========================================
var layers = {
  department: L.layerGroup().addTo(map),
  lab: L.layerGroup().addTo(map),
  hall: L.layerGroup().addTo(map),
  toilet: L.layerGroup().addTo(map),
  water: L.layerGroup().addTo(map)
};

// =========================================
// 📍 RENDER MARKERS FROM DATA.JS
// =========================================
locations.forEach(function (place) {
  // Logic to handle case-sensitivity if "Department" vs "department"
  var typeKey = place.type.toLowerCase();
  var selectedIcon = icons[typeKey] || icons.department;

  var marker = L.marker([place.lat, place.lng], {
    icon: selectedIcon
  }).bindPopup(`
      <div style="text-align: left; min-width: 150px;">
        <b style="color: #23365D; font-size: 14px; border-bottom: 2px solid #6C232E; display: block; margin-bottom: 5px;">${place.name}</b>
        <span style="font-size: 11px; color: #666;">${place.description}</span>
      </div>
  `);

  if (layers[typeKey]) {
    marker.addTo(layers[typeKey]);
  }
});

// Add Layer Control (Filter) to Top Right
L.control.layers(null, {
  "<span style='font-family:Poppins; font-size:12px;'>Departments</span>": layers.department,
  "<span style='font-family:Poppins; font-size:12px;'>Labs</span>": layers.lab,
  "<span style='font-family:Poppins; font-size:12px;'>Venues/Halls</span>": layers.hall,
  "<span style='font-family:Poppins; font-size:12px;'>Restrooms</span>": layers.toilet,
  "<span style='font-family:Poppins; font-size:12px;'>Water Points</span>": layers.water
}, {
  position: 'topright',
  collapsed: true // Makes the UI cleaner on mobile
}).addTo(map);

// =========================================
// 🛰️ USER LOCATION & NAVIGATION
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
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map)
      .bindPopup("<b>You are here</b>")
      .openPopup();
  });

  map.on('locationerror', function() {
    alert("Location access denied. Please enable GPS.");
  });
}

function findNearest(type) {
  if (!userMarker) {
    alert("Please enable 'Locate Me' first to find nearby facilities.");
    return;
  }

  var userLatLng = userMarker.getLatLng();
  var nearest = null;
  var minDist = Infinity;

  locations.forEach(function (place) {
    if (place.type.toLowerCase() === type.toLowerCase()) {
      var dist = map.distance(userLatLng, [place.lat, place.lng]);
      if (dist < minDist) {
        minDist = dist;
        nearest = place;
      }
    }
  });

  if (nearest) {
    map.setView([nearest.lat, nearest.lng], 18);
    // Open the popup of the nearest item
    L.popup()
      .setLatLng([nearest.lat, nearest.lng])
      .setContent("<b>Nearest Found:</b><br>" + nearest.name)
      .openOn(map);
  } else {
    alert("No locations of this type found in the database.");
  }
}

// =========================================
// 🎵 AUDIO SYSTEM (ZEN ANTHEM)
// =========================================
var audio = document.getElementById("anthem");
var btn = document.getElementById("audioBtn");

window.addEventListener("load", function () {
  audio.play().then(() => {
    btn.innerHTML = "🔊 ON";
  }).catch(() => {
    btn.innerHTML = "🔇 OFF";
    document.body.addEventListener("click", function start() {
      audio.play();
      btn.innerHTML = "🔊 ON";
      document.body.removeEventListener("click", start);
    }, { once: true });
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
    audio.pause();
    btn.innerHTML = "🔇 OFF";
  }
};
