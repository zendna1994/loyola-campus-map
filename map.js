// =========================================
// ZEN-DNA: LOYOLA CAMPUS MAP ENGINE (FINAL)
// =========================================

// 1. INITIALIZE MAP (Zoom controls moved to Top-Left)
var map = L.map('map', {
  attributionControl: false,
  zoomControl: false, // Disabling default to move it
  minZoom: 0,
  maxZoom: 25 
}).setView([13.0636, 80.2336], 17);

// Add Zoom Control to Top Left
L.control.zoom({ position: 'topleft' }).addTo(map);

// 2. SATELLITE TILE (With Native Zoom Stretching)
L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 25, maxNativeZoom: 19 }
).addTo(map);

// 3. ICON CONFIGURATION (Unified size)
var iconSizeConfig = {
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
};

var icons = {
  department: 'assets/icons/department.png',
  lab: 'assets/icons/lab.png',
  unit: 'assets/icons/unit.png',
  toilet: 'assets/icons/toilet.png',
  water: 'assets/icons/water.png',
  hall: 'assets/icons/hall.png',
  auditorium: 'assets/icons/auditorium.png',
  parking: 'assets/icons/parking.png',
  xerox: 'assets/icons/xerox.png',
  shop: 'assets/icons/shop.png',
  smartroom: 'assets/icons/smartroom.png',
  clubroom: 'assets/icons/clubroom.png'
};

var all = [];
var markers = [];
var userMarker;

// 4. DATA LOADING (Updated: All Sheets follow the same Index)
Promise.all([
  fetch(SHEET1).then(r => r.text()),
  fetch(SHEET2).then(r => r.text()),
  fetch(SHEET3).then(r => r.text()),
  fetch(SHEET4).then(r => r.text())
]).then(data => {
  data.forEach((csv) => {
    let rows = csv.split("\n").slice(1);
    rows.forEach(row => {
      let c = row.split(",").map(val => val.trim());
      if (c.length < 8) return; // Skip invalid rows

      // NEW UNIFIED FORMAT (Category[0], Type[1], Name[2], Bldg[3], Floor[4], Room[5], Lat[6], Lng[7], Desc[8])
      let obj = {
        category: c[0].toLowerCase(),
        type: c[1],
        name: c[2],
        building: c[3],
        floor: c[4],
        room: c[5],
        lat: parseFloat(c[6]),
        lng: parseFloat(c[7]),
        desc: c[8]
      };

      if (!obj.lat || !obj.lng || isNaN(obj.lat)) return;

      all.push(obj);

      let icon = L.icon({
        iconUrl: icons[obj.category] || 'assets/icons/building.png',
        ...iconSizeConfig
      });

      let popupContent = `
        <div class="popup-container">
          <div class="popup-title">${obj.name || "Unnamed"}</div>
          <div class="popup-sub">
            ${obj.building ? "<b>Bldg:</b> " + obj.building + "<br>" : ""}
            ${obj.floor ? "<b>Floor:</b> " + obj.floor + " " : ""}
            ${obj.room ? "| <b>Room:</b> " + obj.room : ""}<br>
            <i style="color:#D4A64A;">${obj.desc || ""}</i>
          </div>
        </div>
      `;

      let m = L.marker([obj.lat, obj.lng], { icon }).bindPopup(popupContent).addTo(map);
      markers.push({ data: obj, marker: m });
    });
  });
  populateBuildings();
});

// 5. MENU TOGGLE (Fixed "Options" function)
function toggleMenu() {
  let m = document.getElementById("menu");
  // Toggle between flex and none
  if (m.style.display === "flex") {
    m.style.display = "none";
  } else {
    m.style.display = "flex";
  }
}

// 6. SEARCH & FILTERS
document.getElementById("search").addEventListener("input", function() {
  let q = this.value.toLowerCase();
  markers.forEach(m => {
    if (m.data.name.toLowerCase().includes(q) && q.length > 2) {
      map.setView([m.data.lat, m.data.lng], 19);
      m.marker.openPopup();
    }
  });
});

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
    if (b !== "all" && m.data.building !== b) show = false;
    if (f !== "all" && m.data.floor !== f) show = false;

    if (show) map.addLayer(m.marker);
    else map.removeLayer(m.marker);
  });
}

// 7. USER LOCATION & NEAREST
function locateUser() {
  map.locate({setView: true, maxZoom: 18});
  map.on('locationfound', e => {
    if (userMarker) map.removeLayer(userMarker);
    let uIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/128/4874/4874722.png',
        ...iconSizeConfig
    });
    userMarker = L.marker(e.latlng, {icon: uIcon}).addTo(map).bindPopup("You are here").openPopup();
  });
}

function nearest(type) {
  if (!userMarker) return alert("Please click 'Locate Me' first");
  let u = userMarker.getLatLng();
  let min = Infinity, near;

  markers.forEach(m => {
    if (m.data.category === type.toLowerCase()) {
      let d = map.distance(u, [m.data.lat, m.data.lng]);
      if (d < min) { min = d; near = m; }
    }
  });

  if (near) {
    map.setView([near.data.lat, near.data.lng], 20);
    near.marker.openPopup();
  }
}

// 8. AUDIO
function toggleAudio() {
  let audio = document.getElementById("audio");
  let btn = document.getElementById("audioBtn");
  if (audio.paused) {
    audio.play();
    btn.innerHTML = "🔊 Audio ON";
  } else {
    audio.pause();
    btn.innerHTML = "🔇 Audio OFF";
  }
}
