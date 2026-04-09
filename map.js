// ================= INITIALIZE MAP =================
var map = L.map('map', {
    attributionControl: false,
    zoomControl: false
}).setView([13.0636, 80.2336], 17);

L.control.zoom({ position: 'topleft' }).addTo(map);

L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 25, maxNativeZoom: 19 }
).addTo(map);

// ================= GLOBAL VARIABLES =================
var all = [], markers = [], rooms = [];
var userMarker = null, currentRouteLine = null;
var activeBldg = '', activeWing = '', tempRoomMarker = null;
var watchID = null;

// ================= 1. DATA LOADING (SHEETS 1-6) =================
Promise.all([
    fetch(SHEET1).then(r => r.text()), fetch(SHEET2).then(r => r.text()),
    fetch(SHEET3).then(r => r.text()), fetch(SHEET4).then(r => r.text()),
    fetch(SHEET5).then(r => r.text()), fetch(SHEET6).then(r => r.text())
])
.then(data => {
    // ---------- MARKERS (Sheets 1–4: Campus & School Grouping) ----------
    data.slice(0, 4).forEach((csv, idx) => {
        csv.split("\n").slice(1).forEach(row => {
            let c = row.split(",").map(v => v.trim());
            if (c.length < 8) return;

            let obj = {
                cat: c[0],
                school: (idx === 0 ? c[1] : ""), // School grouping logic
                name: c[2],
                bldg: c[3],
                floor: c[4],
                room: c[5],
                lat: parseFloat(c[6]),
                lng: parseFloat(c[7])
            };

            if (!isNaN(obj.lat) && !isNaN(obj.lng)) {
                all.push(obj);
                createMarker(obj);
            }
        });
    });

    // ---------- ZONES (Sheet 5: Named Square Landmarks) ----------
    data[4].split("\n").slice(1).forEach(row => {
        let c = row.split(",").map(v => v.trim());
        if (c.length < 10) return;

        let poly = L.polygon([
            [parseFloat(c[1]), parseFloat(c[2])],
            [parseFloat(c[3]), parseFloat(c[4])],
            [parseFloat(c[5]), parseFloat(c[6])],
            [parseFloat(c[7]), parseFloat(c[8])]
        ], {
            color: c[9],
            fillOpacity: 0.2,
            weight: 2
        }).addTo(map);

        poly.bindTooltip(c[0], {
            permanent: true,
            direction: 'center',
            className: 'zone-label'
        });
    });

    // ---------- ROOMS (Sheet 6: Building Internal Directory) ----------
    data[5].split("\n").slice(1).forEach(row => {
        let c = row.split(",").map(v => v.trim());
        if (c.length < 7) return;

        rooms.push({
            bldg: c[0],
            wing: c[1],
            floor: c[2],
            room: c[3],
            lat: parseFloat(c[4]),
            lng: parseFloat(c[5]),
            type: c[6]
        });
    });

    populateAdvancedFilters();
})
.catch(err => console.error("Critical Data Load Error:", err));

// ================= 2. MARKER & POPUP ENGINE =================
function createMarker(obj) {
    let icon = L.icon({
        iconUrl: `assets/icons/${obj.cat.toLowerCase()}.png`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });

    let m = L.marker([obj.lat, obj.lng], { icon }).addTo(map);

    m.on('click', () => {
        if (obj.cat.toLowerCase() === 'building') {
            openBuildingPanel(obj.name || obj.bldg);
        } else {
            let schoolTag = obj.school
                ? `<div style="color:var(--zen-gold); font-size:9px; font-weight:700; margin-bottom:2px;">${obj.school}</div>`
                : "";

            m.bindPopup(`
                <div class="popup-container">
                    <img src="assets/images/loyola_centenary.png" class="watermark-img">
                    ${schoolTag}
                    <div class="popup-title">${obj.name}</div>
                    <div class="popup-sub"><b>Bldg:</b> ${obj.bldg} | <b>Room:</b> ${obj.room}</div>
                    <button onclick="navigateToPoint(${obj.lat},${obj.lng},'${obj.name}')"
                        class="cancel-btn" style="background:var(--zen-blue); color:white; border-radius:8px;">
                        Navigate
                    </button>
                </div>
            `).openPopup();
        }
    });

    markers.push({ data: obj, marker: m });
}

// ================= 3. BUILDING INTELLIGENCE (ELEVATOR PANEL) =================
function openBuildingPanel(bName) {
    activeBldg = bName;

    let bldgRooms = rooms.filter(r => r.bldg === bName);
    let wingSet = [...new Set(bldgRooms.map(r => r.wing))];

    activeWing = wingSet[0];

    document.getElementById('panel-overlay').style.display = 'flex';
    document.getElementById('bldg-name-title').innerText = bName.toUpperCase();

    updateWingUI(wingSet);
    renderFloors();
}

function updateWingUI(wingSet) {
    let wContainer = document.getElementById('wing-options');
    wContainer.innerHTML = wingSet.map(w =>
        `<div class="wing-btn ${w === activeWing ? 'active' : ''}" onclick="switchWing('${w}')">${w}</div>`
    ).join('');
}

function switchWing(wing) {
    activeWing = wing;
    document.querySelectorAll('.wing-btn').forEach(b => {
        b.classList.remove('active');
        if (b.innerText === wing) b.classList.add('active');
    });
    renderFloors();
}

function renderFloors() {
    let wingRooms = rooms.filter(r => r.bldg === activeBldg && r.wing === activeWing);
    let floorSet = [...new Set(wingRooms.map(r => r.floor))].sort((a, b) => b - a);

    let container = document.getElementById('floor-stack');
    container.innerHTML = floorSet.map(f => `
        <div class="floor-row">
            <div class="floor-label">${f}</div>
            <div class="room-scroll">
                ${wingRooms.filter(r => r.floor === f).map(r => `
                    <div class="classroom" id="room-${r.room.replace(/\s+/g, '')}" 
                         onclick="selectRoom(${r.lat}, ${r.lng}, '${r.room}')">
                        ${r.room}<span>${r.type.toUpperCase()}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// ================= 4. BUILDING INTERNAL SEARCH (WING-AWARE) =================
function toggleInnerSearch() {
    let b = document.getElementById('inner-search-box');
    b.style.display = (b.style.display === 'block' ? 'none' : 'block');
}

function searchInBuilding() {
    let q = document.getElementById('room-search').value.toUpperCase();
    let match = rooms.find(r => r.bldg === activeBldg && r.room.toUpperCase() === q);

    if (match) {
        if (match.wing !== activeWing) switchWing(match.wing);
        setTimeout(() => {
            let el = document.getElementById(`room-${q.replace(/\s+/g, '')}`);
            if (el) {
                document.querySelectorAll('.classroom').forEach(r => r.classList.remove('highlight'));
                el.classList.add('highlight');
                el.scrollIntoView({ inline: 'center', behavior: 'smooth' });
            }
        }, 300);
    }
}

function selectRoom(lat, lng, rName) {
    closePanel();
    map.setView([lat, lng], 20);
    if (tempRoomMarker) map.removeLayer(tempRoomMarker);
    tempRoomMarker = L.circleMarker([lat, lng], { radius: 12, color: '#D4A64A', fillOpacity: 0.6 }).addTo(map);
    
    L.popup().setLatLng([lat, lng]).setContent(`
        <b>Room: ${rName}</b><br>
        <button onclick="navigateToPoint(${lat},${lng},'${rName}')" class="cancel-btn" style="background:var(--zen-blue); color:white; padding:5px 10px; border-radius:5px; border:none; margin-top:5px;">Navigate</button>
    `).openOn(map);
}

// ================= 5. LIVE TRACKING & NAVIGATION =================
function startLiveTracking() {
    if (!navigator.geolocation) return alert("Geolocation not supported");

    watchID = navigator.geolocation.watchPosition(pos => {
        let latlng = [pos.coords.latitude, pos.coords.longitude];

        if (!userMarker) {
            userMarker = L.marker(latlng, {
                icon: L.icon({ iconUrl: 'https://cdn-icons-png.flaticon.com/128/4874/4874722.png', iconSize: [40, 40] })
            }).addTo(map);
            map.setView(latlng, 18);
        } else {
            userMarker.setLatLng(latlng);
        }

        if (currentRouteLine) {
            let latlngs = currentRouteLine.getLatLngs();
            currentRouteLine.setLatLngs([latlng, latlngs[1]]);
        }
    }, err => console.error(err), { enableHighAccuracy: true });
}

function navigateToPoint(lat, lng, name) {
    if (!userMarker) return alert("Please press loacte me first!");

    if (currentRouteLine) map.removeLayer(currentRouteLine);
    currentRouteLine = L.polyline([userMarker.getLatLng(), [lat, lng]], {
        color: '#6C232E', weight: 4, dashArray: '10, 10'
    }).addTo(map);

    map.fitBounds(currentRouteLine.getBounds(), { padding: [100, 100] });
    document.getElementById("route-panel").style.display = "block";
    document.getElementById("route-stats").innerHTML = `<b>Dest:</b> ${name}<br>Tracking movement...`;
}

function clearNavigation() {
    if (currentRouteLine) map.removeLayer(currentRouteLine);
    document.getElementById("route-panel").style.display = "none";
    currentRouteLine = null;
}

// ================= 6. GLOBAL SEARCH (SCHOOLS & DEPTS) =================
function showSuggestions() {
    let q = document.getElementById("search").value.toLowerCase();
    let box = document.getElementById("suggestions-box");
    if (q.length < 2) { box.style.display = "none"; return; }

    let matches = all.filter(i =>
        (i.name || "").toLowerCase().includes(q) ||
        (i.school || "").toLowerCase().includes(q)
    ).slice(0, 5);

    box.innerHTML = matches.map(m => `
        <div class="suggestion-item" onclick="handleSearchSelect(${m.lat},${m.lng},'${m.name}')">
            <span>${m.name}</span>
            <span style="font-size:9px; color:var(--zen-maroon); font-weight:700;">${m.school || m.cat.toUpperCase()}</span>
        </div>
    `).join('');
    box.style.display = "block";
}

function handleSearchSelect(lat, lng, name) {
    document.getElementById("suggestions-box").style.display = "none";
    map.setView([lat, lng], 19);
    navigateToPoint(lat, lng, name);
}

// ================= 7. FILTERS & UI TOOLS =================
function populateAdvancedFilters() {
    let catSet = new Set(all.map(p => p.cat).filter(Boolean));
    let bldgSet = new Set(all.map(p => p.bldg).filter(Boolean));

    let catSel = document.getElementById("categoryFilter");
    let bldgSel = document.getElementById("buildingFilter");

    catSel.innerHTML = '<option value="all">All Categories</option>';
    bldgSel.innerHTML = '<option value="all">All Buildings</option>';

    catSet.forEach(c => catSel.innerHTML += `<option value="${c}">${c.toUpperCase()}</option>`);
    bldgSet.forEach(b => bldgSel.innerHTML += `<option value="${b}">${b}</option>`);

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

function toggleAudio() {
    let audio = document.getElementById("audio");
    let btn = document.getElementById("audioBtn");
    if (audio.paused) { audio.play(); btn.innerHTML = "🔊 Audio ON"; } 
    else { audio.pause(); btn.innerHTML = "🔇 Audio OFF"; }
}

function toggleMenu() {
    let m = document.getElementById("menu");
    m.style.display = (m.style.display === "flex") ? "none" : "flex";
}

function closePanel() {
    document.getElementById('panel-overlay').style.display = 'none';
    document.getElementById('inner-search-box').style.display = 'none';
}

function openHelpWizard() {
    let choice = prompt("\nWelome to Loyola College Digital Campus Map 🙏\n\nWhat do you need? \n1. Find Dept/School \n2. Nearest Restroom/Water \n3. Exit Gates\nEnter respective number alone.");
    if (choice == "1") {
        let dept = prompt("Enter Name:");
        let found = all.find(i => (i.name || "").toLowerCase().includes(dept.toLowerCase()) || (i.school || "").toLowerCase().includes(dept.toLowerCase()));
        if (found) handleSearchSelect(found.lat, found.lng, found.name);
    } else if (choice == "2") {
        let fac = prompt("Type 'toilet' or 'water': for search");
        nearest(fac);
    } else if (choice == "3") { nearest('gate'); }
}
