// =========================================
// ZEN-DNA: LOYOLA CAMPUS MAP ENGINE
// =========================================

// 1. INITIALIZE MAP (Unrestricted Zoom)
var map = L.map('map', {
  attributionControl: false,
  minZoom: 0,
  maxZoom: 25 // Maximum allowed zoom for deep inspection
}).setView([13.0616, 80.2347], 17);

// 2. SATELLITE TILE (With Native Zoom Stretching)
// maxNativeZoom 19 prevents the map from disappearing when zooming deep
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    maxZoom: 25,
    maxNativeZoom: 19
  }
).addTo(map);

map.zoomControl.setPosition('bottomright');

// 3. ICON CONFIGURATIONS
var userIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/128/4874/4874722.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38]
});

var icons = {
  toilet: 'assets/icons/toilet.png',
  water: 'assets/icons/water.png',
  hall: 'assets/icons/hall.png',
  auditorium: 'assets/icons/auditorium.png',
  building: 'assets/icons/building.png',
  gate: 'assets/icons/gate.png',
  ground: 'assets/icons/ground.png',
  unit: 'assets/icons/unit.png',
  parking: 'assets/icons/parking.png',
  department: 'assets/icons/department.png',
  lab: 'assets/icons/lab.png'
};

// 4. DATA STORAGE
var all = [];
var markers = [];
var userMarker;

// 5. LOAD DATA FROM GOOGLE SHEETS (CSV)
Promise.all([
  fetch(SHEET1).then(r => r.text()),
  fetch(SHEET2).then(r => r.text()),
  fetch(SHEET3).then(r => r.text()),
  fetch(SHEET4).then(r => r.text())
]).then(data => {
  data.forEach(csv => {
    csv.split("\n").slice(1).forEach(row => {
      let c = row.split(",");
      if (c.length < 6) return;

      let lat = parseFloat(c[c.length - 3]);
      let lng = parseFloat(c[c.length - 2]);
      if (!lat || !lng) return;

      let obj = {
        category: (c[0] || "").toLowerCase().trim(),
        name: c[2] || "Unnamed Location",
        building: c[3] || "",
        floor: (c[4] == "G") ? "ground" : (c[4] || ""),
        room: c[5] || "",
        lat, lng
      };

      all.push(obj);

      // Create Zen-Styled Marker
      let icon = L.icon({
        iconUrl: icons[obj.category] || icons.hall,
        iconSize: [50, 50],
        iconAnchor: [25, 50],
        popupAnchor: [0, -50]
      });

      let popup = `
        <div style="font-family: 'Poppins', sans-serif;">
          <div style="color:#23365D; font-weight:700; border-bottom:2px solid #6C232E; margin-bottom:5px;">${obj.name}</div>
          <div style="font-size:11px; color:#666;">
            ${obj.building || ""} ${obj.floor ? ("| Floor: " + obj.floor) : ""} ${obj.room ? ("| Room: " + obj.room) : ""}
          </div>
        </div>
      `;

      let m = L.marker([lat, lng], { icon }).bindPopup(popup).addTo(map);
      markers.push({ data: obj, marker: m });
    });
  });

  populateBuildings();
});

// 6. SEARCH SYSTEM
document.getElementById("search").addEventListener("input", function () {
  let q = this.value.toLowerCase();
  markers.forEach(m => {
    if (m.data.name.toLowerCase().includes(q) && q.length > 2) {
      map.setView([m.data.lat, m.data.lng], 19);
      m.marker.openPopup();
    }
  });
});

// 7. FILTER SYSTEM
function populateBuildings() {
  let set = new Set(all.map(p => p.building).filter(b => b));
  let sel = document.getElementById("buildingFilter");

  sel.innerHTML = '<option value="all">All Buildings</option>';
  set.forEach(b => {
    let o = document.createElement("option");
    o.value = b; o.text = b;
    sel.appendChild(o);
  });

  sel.onchange = applyFilters;
  document.getElementById("floorFilter").onchange = applyFilters;
}

function applyFilters() {
  let b = document.getElementById("buildingFilter").value;
  let f = document.getElementById("floorFilter").value;

  markers.forEach(m => {
    let show = true;
    if (b != "all" && m.data.building != b) show = false;
    if (f != "all" && m.data.floor != f) show = false;

    if (show) map.addLayer(m.marker);
    else map.removeLayer(m.marker);
  });
}

// 8. GEOLOCATION
function locateUser() {
  map.locate({ setView: true, maxZoom: 18 });
  map.on('locationfound', e => {
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.marker(e.latlng, { icon: userIcon }).addTo(map).bindPopup("<b>You are here</b>").openPopup();
  });
}

// 9. NEAREST FACILITY
function nearest(type) {
  if (!userMarker) {
    alert("Please click 'Locate Me' first");
    return;
  }

  let u = userMarker.getLatLng();
  let min = Infinity, nearMarker;

  markers.forEach(m => {
    if (m.data.category == type.toLowerCase()) {
      let d = map.distance(u, [m.data.lat, m.data.lng]);
      if (d < min) {
        min = d;
        nearMarker = m;
      }
    }
  });

  if (nearMarker) {
    map.setView([nearMarker.data.lat, nearMarker.data.lng], 20); // Deep zoom to found location
    nearMarker.marker.openPopup();
  } else {
    alert("No " + type + " found nearby.");
  }
}

// 10. MENU & AUDIO
function toggleMenu() {
  let m = document.getElementById("menu");
  m.style.display = (m.style.display === "flex") ? "none" : "flex";
}

var audio = document.getElementById("audio");
function toggleAudio() {
  if (audio.paused) {
    audio.play();
    document.getElementById("audioBtn").innerHTML = "🔊 Audio ON";
  } else {
    audio.pause();
    document.getElementById("audioBtn").innerHTML = "🔇 Audio OFF";
  }
}
