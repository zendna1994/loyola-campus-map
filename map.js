// ===============================
// 📍 LOCATION DATA
// ===============================
var locations = [
  {
    name: "Advanced Zoology & Biotechnology",
    type: "Department",
    lat: 13.063672,
    lng: 80.233664,
    description: "Department Office"
  },
  {
    name: "Bio-Nexus Hitech Lab",
    type: "Lab",
    lat: 13.06155,
    lng: 80.23485,
    description: "250 PhD commemorating Lab"
  },
  {
    name: "Bertram Hall",
    type: "Auditorium",
    lat: 13.062472,
    lng: 80.233185,
    description: "Library Building"
  }
];

// ===============================
// 🗺️ MAP ENGINE
// ===============================
var map = L.map('map', {
  attributionControl: false
}).setView([13.061592, 80.234699], 17);

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 19 }
).addTo(map);

map.zoomControl.setPosition('bottomright');

// ===============================
// 🎨 ZEN ICONS
// ===============================
var iconTemplate = {
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
};

var icons = {
  department: L.icon({ ...iconTemplate, iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png' }),
  lab: L.icon({ ...iconTemplate, iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png' }),
  hall: L.icon({ ...iconTemplate, iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png' }),
  toilet: L.icon({ ...iconTemplate, iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }),
  water: L.icon({ ...iconTemplate, iconUrl: 'https://cdn-icons-png.flaticon.com/512/728/728093.png' })
};

// ===============================
// 📍 RENDER MARKERS
// ===============================
locations.forEach(function (place) {
  var selectedIcon = icons[place.type] || icons.department;

  L.marker([place.lat, place.lng], { icon: selectedIcon })
    .addTo(map)
    .bindPopup(`
      <div style="font-family: 'Poppins', sans-serif; text-align: left;">
        <b style="color: #23365D;">${place.name}</b><br>
        <span style="font-size: 11px; color: #666;">${place.description}</span>
      </div>
    `);
});

// ===============================
// 🎵 AUDIO SYSTEM
// ===============================
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
    this.innerHTML = "🔊 ON";
  } else {
    audio.pause();
    this.innerHTML = "🔇 OFF";
  }
};
