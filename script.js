// Create map (simple coordinate system)
var map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2
});

// Image size (adjust if needed)
var width = 1080;
var height = 1516;

// Define bounds
var bounds = [[0, 0], [height, width]];

// Add image
var image = L.imageOverlay('campus.png', bounds).addTo(map);

// Fit to image
map.fitBounds(bounds);

// Test marker
L.marker([800, 600])
  .addTo(map)
  .bindPopup("Test Location")
  .openPopup();
