// =========================================
// ZEN-DNA: LOYOLA CAMPUS MAP ENGINE (V3)
// =========================================

var map = L.map('map', {
  attributionControl: false,
  minZoom: 0,
  maxZoom: 25 
}).setView([13.0636, 80.2336], 17);

L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 25, maxNativeZoom: 19 }
).addTo(map);

map.zoomControl.setPosition('bottomright');

// 1. ICON CONFIGURATION (Enlarged to 50x50 as discussed)
var iconSizeConfig = {
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50]
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

// 2. DATA LOADING WITH MULTI-FORMAT LOGIC
Promise.all([
  fetch(SHEET1).then(r => r.text()),
  fetch(SHEET2).then(r => r.text()),
  fetch(SHEET3).then(r => r.text()),
  fetch(SHEET4).then(r => r.text())
]).then(data => {
  data.forEach((csv, index) => {
    let rows = csv.split("\n").slice(1);
    rows.forEach(row => {
      let c = row.split(",").map(val => val.trim());
      if (c.length < 5) return;

      let obj = {};

      // Mapping Logic based on Sheet Index
      if (index === 0) { // Sheet 1: Dept Format
        obj = {
          category: c[0], name: c[4], building: c[3], 
          floor: c[5], room: c[6], lat: parseFloat(c[7]), 
          lng: parseFloat(c[8]), desc: c[9]
        };
      } else { // Sheets 2, 3, 4: Standard Format
        obj = {
          category: c[0], name: c[2], building: c[3], 
          floor: c[4], room: c[5], lat: parseFloat(c[6]), 
          lng: parseFloat(c[7]), desc: c[8]
        };
      }

      if (!obj.lat || !obj.lng) return;

      all.push(obj);

      // Create Marker
      let icon = L.icon({
        iconUrl: icons[obj.category.toLowerCase()] || 'assets/icons/building.png',
        ...iconSizeConfig
      });

      // CLEAN POPUP LOGIC (No 'undefined' text)
      let popupContent = `
        <div style="font-family: 'Poppins', sans-serif;">
          <div style="color:#23365D; font-weight:700; border-bottom:2px solid #6C232E; margin-bottom:5px;">
            ${obj.name || ""}
          </div>
          <div style="font-size:11px; color:#666; line-height:1.4;">
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

// 3. FILTER & SEARCH FUNCTIONS
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

// 4. USER UTILITIES
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
  if (!userMarker) return alert("Please Locate Me first!");
  let u = userMarker.getLatLng();
  let min = Infinity, near;

  markers.forEach(m => {
    if (m.data.category.toLowerCase() == type.toLowerCase()) {
      let d = map.distance(u, [m.data.lat, m.data.lng]);
      if (d < min) { min = d; near = m; }
    }
  });

  if (near) {
    map.setView([near.data.lat, near.data.lng], 20);
    near.marker.openPopup();
  }
            }
