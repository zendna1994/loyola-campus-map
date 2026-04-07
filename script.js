// Define image size (IMPORTANT — adjust if needed)
var imageWidth = 1080;
var imageHeight = 1516;

// Create map using simple coordinate system
var map = L.map('map', {
  crs: L.CRS.Simple,
  minZoom: -2
});

// Define image bounds
var bounds = [[0, 0], [imageHeight, imageWidth]];

// Add image overlay
var image = L.imageOverlay('campus.png', bounds).addTo(map);

// Fit map to image
map.fitBounds(bounds);

// Example marker (center of image)
L.marker([800, 600])
  .addTo(map)
  .bindPopup("Center of Loyola Campus")
  .openPopup();
