// Initialize map centered near Loyola College Chennai
var map = L.map('map').setView([13.0643, 80.2337], 17);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Test marker
L.marker([13.0643, 80.2337])
  .addTo(map)
  .bindPopup("Loyola College")
  .openPopup();
