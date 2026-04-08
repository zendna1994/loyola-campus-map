// ===============================
// LOYOLA CAMPUS MAP - BASE MODULE
// ===============================

// 1. CREATE MAP
var map = L.map('map').setView([13.061592, 80.234699], 17);

// 2. SATELLITE TILE
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles © Esri',
    maxZoom: 19
  }
).addTo(map);

// 3. FIX ZOOM CONTROL POSITION
map.zoomControl.setPosition('bottomright');

// 4. GLOBAL ACCESS
window.loyolaMap = map;


// ===============================
// 🎵 AUDIO SYSTEM
// ===============================

var audio = document.getElementById("anthem");
var btn = document.getElementById("audioBtn");

// Try autoplay (may be blocked until user clicks)
window.onload = function () {
  audio.play().catch(() => {
    console.log("Autoplay blocked. User interaction needed.");
  });
};

// Toggle button
btn.onclick = function () {
  if (audio.paused) {
    audio.play();
    btn.innerHTML = "🔊 Audio ON";
  } else {
    audio.pause();
    btn.innerHTML = "🔇 Audio OFF";
  }
};
