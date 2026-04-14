// Define the framing points
var topPoint = [13.063649, 80.234012];
var bottomPoint = [13.063007, 80.234039];

// Initialize the map
var map = L.map('map', { attributionControl: false, zoomControl: false });

// Frame the map to fit exactly between those two points
map.fitBounds([topPoint, bottomPoint]);

L.control.zoom({ position: 'topleft' }).addTo(map);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 25, maxNativeZoom: 19 }).addTo(map);

var all = [], markers = [], rooms = [], userMarker = null, currentRouteLine = null, navTargetName = "";
var activeBldg = '', activeWing = '', tempRoomMarker = null;

// ================= AUDIO AUTOPLAY ON FIRST INTERACTION =================
function unlockAudio() {
    let audio = document.getElementById("audio");
    let btn = document.getElementById("audioBtn");
    if (audio.paused) {
        audio.play().catch(e => console.log("Audio waiting..."));
        btn.innerHTML = "🔊 Audio ON";
    }
}
document.addEventListener('pointerdown', unlockAudio, { once: true });
document.addEventListener('touchstart', unlockAudio, { once: true });
document.addEventListener('click', unlockAudio, { once: true });

// ================= DATA LOADING =================
Promise.all([
    fetch(SHEET1).then(r=>r.text()), fetch(SHEET2).then(r=>r.text()), 
    fetch(SHEET3).then(r=>r.text()), fetch(SHEET4).then(r=>r.text()), 
    fetch(SHEET5).then(r=>r.text()), fetch(SHEET6).then(r=>r.text())
]).then(data => {
    // Process Markers (Sheets 1-4)
    data.slice(0,4).forEach((csv, idx) => {
        csv.split("\n").slice(1).forEach(row => {
            let c = row.split(",");
            if(!c[6] || isNaN(parseFloat(c[6]))) return;
            let obj = { cat: c[0].trim(), school: (idx===0?c[1].trim():""), name: c[2].trim(), bldg: c[3].trim(), floor: c[4].trim(), room: c[5].trim(), lat: parseFloat(c[6]), lng: parseFloat(c[7]), desc: c[8] ? c[8].trim() : '' };
            all.push(obj); createMarker(obj);
        });
    });

    // Zones (Sheet 5)
    data[4].split("\n").slice(1).forEach(row => {
        let c = row.split(",");
        if(c.length < 9) return;
        let poly = L.polygon([[c[1],c[2]],[c[3],c[4]],[c[5],c[6]],[c[7],c[8]]], {color: c[9] || '#6C232E', fillOpacity: 0.15}).addTo(map)
         .bindPopup(`<b>Zone: ${c[0].trim()}</b><br>${c[10] ? c[10].trim() : ""}`);
        
        let centerLat = (parseFloat(c[1]) + parseFloat(c[5])) / 2; 
        let centerLng = (parseFloat(c[2]) + parseFloat(c[6])) / 2;
        all.push({ cat: 'zone', name: c[0].trim(), bldg: c[0].trim(), lat: centerLat, lng: centerLng });
    });

    // Indoor Intelligence (Sheet 6 CSV Data Parser)
    data[5].split("\n").slice(1).forEach(row => {
        let c = row.split(",");
        if(c.length < 7 || !c[0] || c[0].trim() === "") return;
        
        let imageUrl = c[1] && c[1].trim() !== "" ? c[1].trim() : 'assets/images/loyola_centenary.jpg';
        
        rooms.push({ 
            bldg: c[0].trim(), 
            img: imageUrl, 
            wing: c[2] ? c[2].trim() : 'Main', 
            floor: c[3] ? c[3].trim() : 'G', 
            room: c[4] ? c[4].trim() : '', 
            lat: parseFloat(c[5]), 
            lng: parseFloat(c[6]), 
            type: c[7] ? c[7].trim() : 'Classroom',
            desc: c[8] ? c[8].trim() : ''
        });
    });
    populateAdvancedFilters();
});

// ================= MARKERS & POPUPS =================
function createMarker(obj) {
    let isBldg = obj.cat.toLowerCase() === 'building';
    let size = isBldg ? [56, 56] : [38, 38]; 
    let anchor = isBldg ? [28, 56] : [19, 38];
    let pAnchor = isBldg ? [0, -56] : [0, -38];
    
    let icon = L.icon({ iconUrl: `assets/icons/${obj.cat.toLowerCase()}.png`, iconSize: size, iconAnchor: anchor, popupAnchor: pAnchor });
    let m = L.marker([obj.lat, obj.lng], {icon}).addTo(map);
    
    m.on('click', () => {
        let content = `<div class="popup-container"><img src="assets/images/loyola_centenary.png" class="watermark-img">`;
        
        if(obj.school && obj.school.trim() !== "") content += `<div style="color:var(--zen-gold); font-size:10px; font-weight:700; margin-bottom:2px;">${obj.school}</div>`;
        content += `<div class="popup-title">${obj.name || obj.bldg}</div>`;
        
        if(isBldg) {
            content += `<button onclick="navigateToPoint(${obj.lat},${obj.lng},'${obj.bldg || obj.name}')" class="menu-btn zen-red-btn" style="margin-bottom:4px; padding:6px;">Navigate</button>`;
            content += `<button onclick="openBuildingPanel('${obj.bldg || obj.name}')" class="menu-btn gold-btn" style="padding:6px;">View Rooms</button>`;
        } else {
            if(obj.bldg && obj.bldg.trim() !== "") content += `<div class="popup-sub"><b>Bulding:</b> ${obj.bldg}</div>`;
            if(obj.floor && obj.floor.trim() !== "") content += `<div class="popup-sub"><b>Floor:</b> ${obj.floor}</div>`; // Added Floor visibility
            if(obj.room && obj.room.trim() !== "") content += `<div class="popup-sub"><b>Room no.:</b> ${obj.room}</div>`;
            if(obj.desc && obj.desc.trim() !== "") content += `<div class="popup-sub"><b>Desc.:</b> ${obj.desc}</div>`;
            content += `<button onclick="navigateToPoint(${obj.lat},${obj.lng},'${obj.name}')" class="menu-btn zen-red-btn" style="margin-top:6px; padding:6px;">Navigate</button>`;
        }
        m.bindPopup(content + `</div>`).openPopup();
    });
    markers.push({data: obj, marker: m});
}

// ================= BUILDING INTELLIGENCE =================
function openBuildingPanel(bName) {
    activeBldg = bName.trim().toLowerCase();
    
    let bldgRooms = rooms.filter(r => r.bldg.toLowerCase() === activeBldg);
    if(bldgRooms.length === 0) return alert("Building Structure data is not available for: " + bName);
    
    let wingSet = [...new Set(bldgRooms.map(r => r.wing))].filter(w => w);
    activeWing = wingSet[0] || "Main";

    document.getElementById('panel-overlay').style.display = 'flex';
    document.getElementById('bldg-name-title').innerText = bName.toUpperCase();
    document.getElementById('bldg-hero').style.backgroundImage = `url('${bldgRooms[0].img}')`;
    
    let wContainer = document.getElementById('wing-options');
    wContainer.innerHTML = wingSet.map(w => `<div class="wing-btn ${w===activeWing?'active':''}" onclick="switchWing('${w}')">${w}</div>`).join('');
    
    renderFloors();
}

function switchWing(wing) {
    activeWing = wing;
    document.querySelectorAll('.wing-btn').forEach(b => {
        b.classList.remove('active');
        if(b.innerText === wing) b.classList.add('active');
    });
    renderFloors();
}

function renderFloors() {
    let wingRooms = rooms.filter(r => r.bldg.toLowerCase() === activeBldg && r.wing === activeWing);
    
    // This custom sort treats 'G' as 0, putting it at the bottom of the stack
    let floorSet = [...new Set(wingRooms.map(r => r.floor))].sort((a, b) => {
        let valA = a.toUpperCase() === 'G' ? 0 : parseInt(a);
        let valB = b.toUpperCase() === 'G' ? 0 : parseInt(b);
        return valB - valA; // Higher numbers at the top, G at the bottom
    });

    let container = document.getElementById('floor-stack');
    
    container.innerHTML = floorSet.map(f => `
        <div class="floor-row">
            <div class="floor-label">${f}</div>
            <div class="room-scroll">
                ${wingRooms.filter(r => r.floor === f).map(r => `
                    <div class="classroom" onclick="selectRoom('${r.room}')">
                        ${r.room}<span>${r.type.toUpperCase()}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function selectRoom(rName) {
    let r = rooms.find(room => room.room === rName && room.bldg.toLowerCase() === activeBldg);
    if(!r) return;

    closePanel();
    // Use animate: false to guarantee popup opens successfully
    map.setView([r.lat, r.lng], 21, { animate: false }); 
    if(tempRoomMarker) map.removeLayer(tempRoomMarker);
    
    let typeStr = r.type ? r.type.toLowerCase().trim() : 'classroom';
    let customIcon = L.icon({ iconUrl: `assets/icons/${typeStr}.png`, iconSize:[40,40], iconAnchor:[20,40], popupAnchor:[0,-40] });
    
    tempRoomMarker = L.marker([r.lat, r.lng], {icon: customIcon}).addTo(map);
    
    let pContent = `
        <div class="popup-container">
            <img src="assets/images/loyola_centenary.png" class="watermark-img">
            <div class="popup-title">${r.bldg}</div>
            <div class="popup-sub"><b>Room No:</b> ${r.room}</div>
            <div class="popup-sub"><b>Floor:</b> ${r.floor}</div>
            <div class="popup-sub"><b>Type:</b> ${r.type}</div>
            ${r.desc ? `<div class="popup-sub"><b>Desc:</b> ${r.desc}</div>` : ''}
            <button onclick="navigateToPoint(${r.lat},${r.lng},'${r.room}')" class="menu-btn zen-red-btn" style="margin-top:6px; padding:6px;">Navigate Here</button>
        </div>
    `;
    
    tempRoomMarker.bindPopup(pContent).openPopup();
}

// ================= LIVE TRACKING & NAVIGATION =================
function startLiveTracking() {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.watchPosition(pos => {
        let latlng = [pos.coords.latitude, pos.coords.longitude];
        if(!userMarker) {
            userMarker = L.marker(latlng, {icon: L.icon({iconUrl:'assets/icons/user.png', iconSize:[42,42], iconAnchor:[21,21]})}).addTo(map).bindPopup("<b>You are here</b>");
            map.setView(latlng, 18);
        } else { 
            userMarker.setLatLng(latlng); 
        }
        if(currentRouteLine) updateNavigationStats(); 
    }, err => console.log("GPS Error:", err), {enableHighAccuracy: true});
}

function navigateToPoint(lat, lng, name) {
    if (!userMarker) return alert("Press 'Locate Me' to begin navigation.");
    navTargetName = name;
    if (currentRouteLine) map.removeLayer(currentRouteLine);
    
    currentRouteLine = L.polyline([userMarker.getLatLng(), [lat, lng]], {color: '#6C232E', weight: 5, dashArray: '10, 10'}).addTo(map);
    map.fitBounds(currentRouteLine.getBounds(), {padding: [50,50]});
    
    document.getElementById("route-panel").style.display = "block";
    updateNavigationStats();
}

function updateNavigationStats() {
    if(!userMarker || !currentRouteLine) return;
    let start = userMarker.getLatLng();
    let end = currentRouteLine.getLatLngs()[1];
    let dist = map.distance(start, end);
    let time = Math.round(dist / 80); 
    document.getElementById("route-stats").innerHTML = `<b>To:</b> ${navTargetName}<br>🚶 ${Math.round(dist)}m (${time < 1 ? '<1' : time} min)`;
}

function clearNavigation() { 
    if(currentRouteLine) map.removeLayer(currentRouteLine); 
    document.getElementById("route-panel").style.display = "none"; 
    currentRouteLine = null; 
}

// ================= TOOLS & AUTO-POPUPS =================
function nearest(cat, fromHelp = false) {
    if (!userMarker) return alert("Locate yourself first by clicking 'Locate Me'!");
    let u = userMarker.getLatLng(), min = Infinity, near = null;
    
    markers.forEach(m => {
        if (m.data.cat.toLowerCase() === cat.toLowerCase()) {
            let d = map.distance(u, [m.data.lat, m.data.lng]);
            if (d < min) { min = d; near = m; }
        }
    });
    
    if (near) { 
        // If triggered from SOS Help Wizard, show the alert details before navigating
        if(fromHelp) {
            let locDesc = near.data.bldg ? near.data.bldg : "Open Ground";
            let floorDesc = near.data.floor ? ` (Floor: ${near.data.floor})` : "";
            alert(`Nearest ${cat.toUpperCase()} is at: ${locDesc}${floorDesc}.\n\nClick OK to view on map.`);
        }
        
        // Use animate: false to guarantee the popup opens immediately
        map.setView([near.data.lat, near.data.lng], 19, { animate: false }); 
        near.marker.openPopup(); 
    } else {
        alert("No " + cat + " found.");
    }
}

function openHelpWizard() {
    let choice = prompt("Welcome to Loyola College (Autonomous), Chennai - 34\n\nHow can we help you ? \n1. Find Department/Unit \n2. Nearest Restroom/Water \n3. Exit Gate\nEnter respective number for assistance.");
    if (choice == "1") {
        let dept = prompt("Enter Name of tye desired Department/Unit:");
        if(dept) { document.getElementById("search").value = dept; showSuggestions(); }
    } else if (choice == "2") {
        let fac = prompt("Type 'toilet' or 'water' for search:");
        if(fac) nearest(fac.trim().toLowerCase(), true);
    } else if (choice == "3") { 
        nearest('gate', true); 
    }
}

// ================= UI & SEARCH =================
function showSuggestions() {
    let q = document.getElementById("search").value.toLowerCase().trim();
    let box = document.getElementById("suggestions-box");
    if(q.length < 2) { box.style.display = "none"; return; }
    
    let matches = all.filter(i => (i.name||"").toLowerCase().includes(q) || (i.school||"").toLowerCase().includes(q) || (i.bldg||"").toLowerCase().includes(q) || (i.room||"").toLowerCase().includes(q)).slice(0,5);
    box.innerHTML = matches.map(m => `<div class="suggestion-item" onclick="handleSearchSelect(${m.lat},${m.lng},'${m.name || m.room || m.bldg}')"><span>${m.name || m.room || m.bldg}</span><span style="font-size:9px; color:var(--zen-maroon); font-weight:700;">${m.school || m.cat.toUpperCase()}</span></div>`).join('');
    box.style.display = matches.length ? "block" : "none";
}

function handleSearchSelect(lat, lng, name) { 
    document.getElementById("search").value = name;
    document.getElementById("suggestions-box").style.display = "none"; 
    map.setView([lat, lng], 19); 
    navigateToPoint(lat, lng, name); 
}

function toggleAudio() {
    let audio = document.getElementById("audio");
    let btn = document.getElementById("audioBtn");
    if (audio.paused) { audio.play(); btn.innerHTML = "🔊 Audio ON"; } else { audio.pause(); btn.innerHTML = "🔇 Audio OFF"; }
}

function populateAdvancedFilters() {
    let catSet = new Set(all.map(p => p.cat).filter(c => c));
    let bldgSet = new Set(all.map(p => p.bldg).filter(b => b));
    let catSel = document.getElementById("categoryFilter");
    let bldgSel = document.getElementById("buildingFilter");
    catSel.innerHTML = '<option value="all">All Categories</option>';
    catSet.forEach(c => { catSel.innerHTML += `<option value="${c}">${c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()}</option>`; });
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

function toggleMenu() { let m = document.getElementById("menu"); m.style.display = (m.style.display === "flex") ? "none" : "flex"; }
function closePanel() { document.getElementById('panel-overlay').style.display = 'none'; }
function toggleInnerSearch() { let b = document.getElementById('inner-search-box'); b.style.display = (b.style.display==='block'?'none':'block'); }

function searchInBuilding() {
    let q = document.getElementById('room-search').value.toUpperCase();
    let match = rooms.find(r => r.bldg.toLowerCase() === activeBldg && r.room.toUpperCase() === q);
    if(match) {
        if(match.wing !== activeWing) switchWing(match.wing);
        setTimeout(() => {
            document.querySelectorAll('.classroom').forEach(r => r.classList.remove('highlight'));
            let target = Array.from(document.querySelectorAll('.classroom')).find(el => el.innerHTML.includes(q));
            if(target) { target.classList.add('highlight'); target.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'center'}); }
        }, 200);
    }
                      }
