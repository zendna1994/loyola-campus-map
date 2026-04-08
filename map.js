// =========================================
// LOYOLA CAMPUS MAP - ZEN ENGINE
// =========================================

// 1. CREATE MAP & CONFIGURE VIEW
// SetView coordinates focused on Loyola College, Chennai
var map = L.map('map', {
  attributionControl: false,
  zoomControl: true
}).setView([13.061592, 80.234699], 17);

// 2. HIGH-RES SATELLITE TILE (Esri World Imagery)
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    maxZoom: 19,
    crossOrigin: true
  }
).addTo(map);

// 3. UI POSITIONING
// Move zoom controls to bottom-right to keep the clean "ZEN" look
map.zoomControl.setPosition('bottomright');

// 4. GLOBAL ACCESS
window.loyolaMap = map;

// =========================================
// 🎵 ZEN AUDIO SYSTEM (Anthem Controller)
// =========================================

var audio = document.getElementById("anthem");
var btn = document.getElementById("audioBtn");

/**
 * Handle Audio Logic for Browser Autoplay Restrictions
 */
function handleAudioInit() {
  audio.play().then(() => {
    btn.innerHTML = "🔊 Audio ON";
    btn.classList.add('playing'); // Can be used for CSS animations
  }).catch(() => {
    // If browser blocks autoplay, show "OFF" and wait for first click
    btn.innerHTML = "🔇 OFF";
    
    // Start on first body interaction
    const startAudioOnce = () => {
      audio.play();
      btn.innerHTML = "🔊 ON";
      document.body.removeEventListener("click", startAudioOnce);
      document.body.removeEventListener("touchstart", startAudioOnce);
    };

    document.body.addEventListener("click", startAudioOnce);
    document.body.addEventListener("touchstart", startAudioOnce);
  });
}

// Initialize audio on load
window.addEventListener("load", handleAudioInit);

/**
 * Manual Toggle Control
 */
btn.onclick = function (e) {
  e.stopPropagation(); // Prevents map clicks from triggering audio logic
  if (audio.paused) {
    audio.play();
    this.innerHTML = "🔊 ON";
  } else {
    audio.pause();
    this.innerHTML = "🔇 OFF";
  }
};
