// ===============================
// 📍 LOCATION DATA (Must be defined)
// ===============================
var locations = [
  {
    name: "Advanced Zoology & Biotech",
    type: "department",
    lat: 13.0618,
    lng: 80.2345,
    description: "ZEN - DNA HQ"
  },
  {
    name: "Molecular Biology Lab",
    type: "lab",
    lat: 13.0615,
    lng: 80.2348,
    description: "Main Research Facility"
  },
  {
    name: "Bertram Hall",
    type: "hall",
    lat: 13.0622,
    lng: 80.2340,
    description: "Examination & Events Hall"
  }
  // Add more points here following the same structure
];

// ===============================
// 🗺️ MAP INITIALIZATION
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
// 🎨 ICONS (Refined Sizes)
// ===============================
var icons = {
  department: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/190/190411.png',
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
  }),
  lab: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1046/1046857.png',
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
  }),
  hall: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png',
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
  }),
  toilet: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
  }),
  water: L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/728/728093.png',
    iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32]
  })
};

// ===============================
// 📍 ADD MARKERS FROM DATA
// ===============================
locations.forEach(function (place) {
  // Use the icon from the list, or fallback to 'department' if type is wrong
  var selectedIcon = icons[place.type] || icons.department;

  L.marker([place.lat, place.lng], { icon: selectedIcon })
    .addTo(map)
    .bindPopup(`
      <div style="font-family: 'Poppins', sans-serif;">
        <b style="color: #23365D; font-size: 14px;">${place.name}</b><br>
        <span style="color: #666; font-size: 12px;">${place.description}</span>
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
    document.body.addEventListener("click", function startOnce() {
      audio.play();
      btn.innerHTML = "🔊 ON";
      document.body.removeEventListener("click", startOnce);
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
