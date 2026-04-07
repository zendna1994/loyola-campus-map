// Define Loyola College bounds (tighter box)
var bounds = L.latLngBounds(
  [13.0605, 80.2295],  // South-West
  [13.0675, 80.2385]   // North-East
);

// Initialize map
var map = L.map('map', {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0, // Makes edges solid
  minZoom: 16,
  maxZoom: 19,
  zoomControl: true
});

// Force map inside bounds immediately
map.fitBounds(bounds);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  noWrap: true, // Prevent infinite world scroll
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// EXTRA FORCE: reset if user tries to escape
map.on('drag', function () {
  map.panInsideBounds(bounds, { animate: false });
});

// Test marker
L.marker([13.0643, 80.2337])
  .addTo(map)
  .bindPopup("Loyola College Campus")
  .openPopup();
