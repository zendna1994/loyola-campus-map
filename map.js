var map = L.map('map', { attributionControl: false, zoomControl: false }).setView([13.0636, 80.2336], 17);
L.control.zoom({ position: 'topleft' }).addTo(map);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 25, maxNativeZoom: 19 }).addTo(map);

var all = [], markers = [], rooms = [], userMarker = null, currentRouteLine = null;
var activeBldg = '', activeWing = '', tempRoomMarker = null;

// 1. DATA LOADING
Promise.all([
    fetch(SHEET1).then(r=>r.text()), fetch(SHEET2).then(r=>r.text()), 
    fetch(SHEET3).then(r=>r.text()), fetch(SHEET4).then(r=>r.text()), 
    fetch(SHEET5).then(r=>r.text()), fetch(SHEET6).then(r=>r.text())
])
.then(data => {
    data.slice(0,4).forEach((csv, idx) => {
        csv.split("\n").slice(1).forEach(row => {
            let c = row.split(",").map(v => v.trim());
            if(!c[6] || isNaN(parseFloat(c[6]))) return;
            let obj = { cat: c[0], school: (idx===0?c[1]:""), name: c[2], bldg: c[3], floor: c[4], room: c[5], lat: parseFloat(c[6]), lng: parseFloat(c[7]) };
            all.push(obj); createMarker(obj);
        });
    });
    // Zones (Sheet 5)
    data[4].split("\n").slice(1).forEach(row => {
        let c = row.split(",").map(v => v.trim());
        if(c.length < 9) return;
        L.polygon([[c[1],c[2]],[c[3],c[4]],[c[5],c[6]],[c[7],c[8]]], {color: c[9] || '#6C232E', fillOpacity: 0.15}).addTo(map)
         .bindTooltip(c[0], {permanent: true, direction: 'center', className: 'zone-label'});
    });
    // Room Intelligence (Sheet 6)
    data[5].split("\n").slice(1).forEach(row => {
        let c = row.split(",").map(v => v.trim());
        if(!c[0]) return;
        rooms.push({ bldg: c[0], img: c[1], wing: c[2], floor: c[3], room: c[4], lat: parseFloat(c[5]), lng: parseFloat(c[6]), type: c[7], desc: c[8] });
    });
    populateAdvancedFilters();
});

function createMarker(obj) {
    let icon = L.icon({ iconUrl: `assets/icons/${obj.cat.toLowerCase()}.png`, iconSize:[40,40], iconAnchor:[20,40], popupAnchor:[0,-40] });
    let m = L.marker([obj.lat, obj.lng], {icon}).addTo(map);
    
    // Dynamic Popup Content
    let content = `<div class="popup-container"><img src="assets/images/loyola_centenary.png" class="watermark-img">`;
    if(obj.school) content += `<div style="color:var(--zen-gold); font-size:10px; font-weight:700;">${obj.school}</div>`;
    content += `<div class="popup-title">${obj.name || obj.bldg}</div>`;
    
    if(obj.cat.toLowerCase() === 'building') {
        content += `<button onclick="navigateToPoint(${obj.lat},${obj.lng},'${obj.bldg || obj.name}')" class="menu-btn">Navigate</button>`;
        content += `<button onclick="openBuildingPanel('${obj.name || obj.bldg}')" class="menu-btn gold-btn">View Rooms</button>`;
    } else {
        if(obj.bldg && obj.bldg !== "") content += `<div class="popup-sub"><b>Bldg:</b> ${obj.bldg}</div>`;
        if(obj.room && obj.room !== "") content += `<div class="popup-sub"><b>Room:</b> ${obj.room}</div>`;
        content += `<button onclick="navigateToPoint(${obj.lat},${obj.lng},'${obj.name}')" class="menu-btn">Navigate</button>`;
    }
    m.bindPopup(content + `</div>`);
    
    m.on('click', () => { m.openPopup(); });
    markers.push({data: obj, marker: m});
}

function startLiveTracking() {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.watchPosition(pos => {
        let latlng = [pos.coords.latitude, pos.coords.longitude];
        if(!userMarker) {
            userMarker = L.marker(latlng, {
                icon: L.icon({iconUrl:'assets/icons/user.png', iconSize:[45,45]})
            }).addTo(map).bindPopup("<b>You are here</b>");
            map.setView(latlng, 18);
        } else { 
            userMarker.setLatLng(latlng); 
        }
        if(currentRouteLine) updateNavigationStats();
    }, err => console.log(err), {enableHighAccuracy: true});
}

function navigateToPoint(lat, lng, name) {
    if (!userMarker) return alert("Please Start Live Tracking first!");
    if (currentRouteLine) map.removeLayer(currentRouteLine);
    currentRouteLine = L.polyline([userMarker.getLatLng(), [lat, lng]], {color: '#6C232E', weight: 5, dashArray: '10, 10'}).addTo(map);
    map.fitBounds(currentRouteLine.getBounds(), {padding: [100,100]});
    document.getElementById("route-panel").style.display = "block";
    updateNavigationStats(name);
}

function updateNavigationStats(targetName = "") {
    let start = userMarker.getLatLng();
    let end = currentRouteLine.getLatLngs()[1];
    let dist = map.distance(start, end);
    let time = Math.round(dist / 80);
    document.getElementById("route-stats").innerHTML = `<b>To:</b> ${targetName || 'Destination'}<br>🚶 ${Math.round(dist)}m (${time < 1 ? '<1' : time} min)`;
}

function openBuildingPanel(bName) {
    activeBldg = bName;
    let bldgRooms = rooms.filter(r => r.bldg === bName);
    if(bldgRooms.length === 0) return alert("No indoor data for this building yet.");
    
    let wingSet = [...new Set(bldgRooms.map(r => r.wing))].filter(w => w);
    activeWing = wingSet[0] || "Main";

    document.getElementById('panel-overlay').style.display = 'flex';
    document.getElementById('bldg-name-title').innerText = bName.toUpperCase();
    document.getElementById('bldg-hero').style.backgroundImage = `url('${bldgRooms[0].img || ""}')`;
    
    let wContainer = document.getElementById('wing-options');
    wContainer.innerHTML = wingSet.map(w => `<div class="wing-btn ${w===activeWing?'active':''}" onclick="switchWing('${w}')">${w}</div>`).join('');
    renderFloors();
}

function renderFloors() {
    let wingRooms = rooms.filter(r => r.bldg === activeBldg && r.wing === activeWing);
    let floorSet = [...new Set(wingRooms.map(r => r.floor))].sort().reverse();
    let container = document.getElementById('floor-stack');
    container.innerHTML = floorSet.map(f => `
        <div class="floor-row">
            <div class="floor-label">${f}</div>
            <div class="room-scroll">
                ${wingRooms.filter(r => r.floor === f).map(r => `
                    <div class="classroom" id="room-${r.room}" onclick="selectRoom(${r.lat}, ${r.lng}, '${r.room}')">
                        ${r.room}<span>${r.type || "ROOM"}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function selectRoom(lat, lng, rName) {
    closePanel();
    map.setView([lat, lng], 20);
    if(tempRoomMarker) map.removeLayer(tempRoomMarker);
    tempRoomMarker = L.circleMarker([lat, lng], {radius: 12, color: 'var(--zen-gold)', fillOpacity: 0.6}).addTo(map);
    L.popup().setLatLng([lat, lng]).setContent(`<div class="popup-container"><b>Room: ${rName}</b><br><button onclick="navigateToPoint(${lat},${lng},'${rName}')" class="menu-btn">Navigate</button></div>`).openOn(map);
}

function populateAdvancedFilters() {
    let catSet = new Set(all.map(p => p.cat).filter(c => c));
    let bldgSet = new Set(all.map(p => p.bldg).filter(b => b));
    let catSel = document.getElementById("categoryFilter");
    let bldgSel = document.getElementById("buildingFilter");
    
    catSel.innerHTML = '<option value="all">All Categories</option>';
    catSet.forEach(c => { 
        let name = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
        catSel.innerHTML += `<option value="${c}">${name}</option>`; 
    });
    
    bldgSel.innerHTML = '<option value="all">All Buildings</option>';
    bldgSet.forEach(b => { bldgSel.innerHTML += `<option value="${b}">${b}</option>`; });
    catSel.onchange = bldgSel.onchange = applyFilters;
}

function applyFilters() {
    let c = document.getElementById("categoryFilter").value;
    let b = document.getElementById("buildingFilter").value;
    markers.forEach(m => {
        let match = (c === "all" || m.data.cat === c) && (b === "all" || m.data.bldg === b);
        if (match) map.addLayer(m.marker); else map.removeLayer(m.marker);
    });
}

function showSuggestions() {
    let q = document.getElementById("search").value.toLowerCase();
    let box = document.getElementById("suggestions-box");
    if(q.length < 2) { box.style.display = "none"; return; }
    let matches = all.filter(i => (i.name||"").toLowerCase().includes(q) || (i.school||"").toLowerCase().includes(q)).slice(0,5);
    box.innerHTML = matches.map(m => `<div class="suggestion-item" onclick="handleSearchSelect(${m.lat},${m.lng},'${m.name}')"><span>${m.name}</span><span style="font-size:9px; color:var(--zen-maroon); font-weight:700;">${m.school || m.cat.toUpperCase()}</span></div>`).join('');
    box.style.display = "block";
}

function handleSearchSelect(lat, lng, name) { 
    document.getElementById("suggestions-box").style.display = "none"; 
    map.setView([lat, lng], 19); 
    navigateToPoint(lat, lng, name); 
}

function toggleAudio() {
    let audio = document.getElementById("audio");
    let btn = document.getElementById("audioBtn");
    if (audio.paused) { audio.play(); btn.innerHTML = "🔊 Audio ON"; } else { audio.pause(); btn.innerHTML = "🔇 Audio OFF"; }
}

function toggleMenu() { let m = document.getElementById("menu"); m.style.display = (m.style.display === "flex") ? "none" : "flex"; }
function closePanel() { document.getElementById('panel-overlay').style.display = 'none'; }
function clearNavigation() { if(currentRouteLine) map.removeLayer(currentRouteLine); document.getElementById("route-panel").style.display = "none"; currentRouteLine = null; }

function nearest(cat) {
    if (!userMarker) return alert("Locate yourself first!");
    let u = userMarker.getLatLng(), min = Infinity, near = null;
    markers.forEach(m => {
        if (m.data.cat.toLowerCase() === cat.toLowerCase()) {
            let d = map.distance(u, [m.data.lat, m.data.lng]);
            if (d < min) { min = d; near = m; }
        }
    });
    if (near) { map.setView([near.data.lat, near.data.lng], 19); near.marker.openPopup(); }
        }
