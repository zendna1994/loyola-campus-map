// 1. INITIALIZE MAP
var map = L.map('map', { 
    attributionControl: false 
}).setView([13.0645, 80.2335], 17);

// 2. SATELLITE LAYER
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19
}).addTo(map);

map.zoomControl.setPosition('bottomright');

// 3. ICON DEFINITIONS
var iconSet = {
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
};

var icons = {
  department: L.icon({ ...iconSet, iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png' }),
  lab: L.icon({ ...iconSet, iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png' }),
  hall: L.icon({ ...iconSet, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png' }),
  toilet: L.icon({ ...iconSet, iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }),
  water: L.icon({ ...iconSet, iconUrl: 'https://cdn-icons-png.flaticon.com/512/728/728093.png' })
};

// 4. ADD MARKERS FROM DATA.JS
locations.forEach(function (place) {
  var selectedIcon = icons[place.type] || icons.department;
  L.marker([place.lat, place.lng], { icon: selectedIcon })
    .addTo(map)
    .bindPopup(`
      <div style="text-align: left;">
        <b style="color: #23365D; font-size: 14px;">${place.name}</b><br>
        <span style="color: #666; font-size: 11px;">${place.description}</span>
      </div>
    `);
});

// 5. AUDIO SYSTEM
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
  e.stopPropagation(); // Stop map from clicking when button is pressed
  if (audio.paused) {
    audio.play();
    btn.innerHTML = "🔊 ON";
  } else {
    audio.pause();
    btn.innerHTML = "🔇 OFF";
  }
};
