// Define Loyola College bounds (approx area)
var southWest = L.latLng(13.0605, 80.2295);
var northEast = L.latLng(13.0675, 80.2385);
var bounds = L.latLngBounds(southWest, northEast);

// Initialize map
var map = L.map('map', {
  maxBounds: bounds,
  maxBoundsViscosity: 1.0, // Strong restriction
  minZoom: 16,
  maxZoom: 19
}).setView([13.0643, 80.2337], 17);

// Tile layer (you can change later)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Fit map exactly to Loyola bounds
map.fitBounds(bounds);

// Test marker
L.marker([13.0643, 80.2337])
  .addTo(map)
  .bindPopup("Loyola College Campus")
  .openPopup();
