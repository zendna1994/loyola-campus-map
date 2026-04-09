var map = L.map('map', { attributionControl: false, zoomControl: false }).setView([13.0636, 80.2336], 17);
L.control.zoom({ position: 'topleft' }).addTo(map);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 25, maxNativeZoom: 19 }).addTo(map);

var all = [], markers = [], userMarker, currentRouteLine;

// 1. DATA LOADING
Promise.all([fetch(SHEET1).then(r=>r.text()), fetch(SHEET2).then(r=>r.text()), fetch(SHEET3).then(r=>r.text()), fetch(SHEET4).then(r=>r.text())])
.then(data => {
    data.forEach((csv, idx) => {
        csv.split("\n").slice(1).forEach(row => {
            let c = row.split(",").map(v => v.trim());
            if(c.length < 7) return;
            
            // Unified Mapping based on your new sheet formats
            let obj = (idx === 0) ? 
                { cat: c[0], school: c[1], name: c[2], bldg: c[3], floor: c[4], room: c[5], lat: parseFloat(c[6]), lng: parseFloat(c[7]), desc: c[8] } :
                { cat: c[0], type: c[1], name: c[2], bldg: c[3], floor: c[4], room: c[5], lat: parseFloat(c[6]), lng: parseFloat(c[7]), desc: c[8] };

            if(!isNaN(obj.lat)) {
                all.push(obj);
                createMarker(obj);
            }
        });
    });
    populateBuildings();
});

function createMarker(obj) {
    let icon = L.icon({ iconUrl: `assets/icons/${obj.cat.toLowerCase()}.png`, iconSize:[40,40], iconAnchor:[20,40], popupAnchor:[0,-40] });
    let popup = `
        <div class="popup-container">
            <img src="assets/images/loyola_centenary.png" class="watermark-img">
            <div class="popup-title">${obj.name || obj.bldg}</div>
            <div class="popup-sub" style="position:relative; z-index:1;">
                ${obj.bldg ? "Bldg: "+obj.bldg+"<br>" : ""}
                ${obj.room ? "Room: "+obj.room : ""}
            </div>
            <button onclick="navigateToPoint(${obj.lat}, ${obj.lng}, '${obj.name || obj.bldg}')" style="width:100%; margin-top:8px; background:#23365D; color:white; border:none; border-radius:4px; cursor:pointer;">Navigate</button>
        </div>`;
    let m = L.marker([obj.lat, obj.lng], {icon}).bindPopup(popup).addTo(map);
    markers.push({data: obj, marker: m});
}

// 2. LIVE TRACKING
function locateUser() {
    map.locate({setView: true, watch: true, enableHighAccuracy: true});
    map.on('locationfound', e => {
        if (!userMarker) {
            userMarker = L.marker(e.latlng, { icon: L.icon({iconUrl:'https://cdn-icons-png.flaticon.com/128/4874/4874722.png', iconSize:[40,40]}) }).addTo(map);
        } else {
            userMarker.setLatLng(e.latlng);
        }
        if (currentRouteLine) updateNavigationLine(e.latlng);
    });
}

// 3. NAVIGATION ENGINE
function navigateToPoint(lat, lng, name) {
    if (!userMarker) return alert("Click 'Locate Me' first!");
    let start = userMarker.getLatLng();
    let end = [lat, lng];

    if (currentRouteLine) map.removeLayer(currentRouteLine);
    currentRouteLine = L.polyline([start, end], {color: '#6C232E', weight: 4, dashArray: '10, 10'}).addTo(map);
    map.fitBounds(currentRouteLine.getBounds(), {padding: [50,50]});

    let dist = map.distance(start, end);
    document.getElementById("route-panel").style.display = "block";
    document.getElementById("route-stats").innerHTML = `<b>Dest:</b> ${name}<br>🚶 ${Math.round(dist)}m (${Math.round(dist/80)} min)`;
}

function updateNavigationLine(newPos) {
    let dest = currentRouteLine.getLatLngs()[1];
    currentRouteLine.setLatLngs([newPos, dest]);
}

function clearNavigation() {
    if(currentRouteLine) map.removeLayer(currentRouteLine);
    document.getElementById("route-panel").style.display = "none";
}

// 4. SMART SEARCH
function showSuggestions() {
    let q = document.getElementById("search").value.toLowerCase();
    let box = document.getElementById("suggestions-box");
    if(q.length < 2) { box.style.display = "none"; return; }
    
    let matches = all.filter(i => (i.name||"").toLowerCase().includes(q) || (i.bldg||"").toLowerCase().includes(q)).slice(0,5);
    box.innerHTML = matches.map(m => `<div class="suggestion-item" onclick="navigateToPoint(${m.lat},${m.lng},'${m.name||m.bldg}')"><span>${m.name||m.bldg}</span><span style="color:#6C232E; font-size:9px;">${m.cat}</span></div>`).join('');
    box.style.display = "block";
}

// 5. HELP WIZARD
function openHelpWizard() {
    let choice = prompt("What do you need? \n1. Find Department \n2. Nearest Restroom/Water \n3. Exit Gates");
    if(choice == "1") {
        let school = prompt("Enter School (e.g., Life Sciences):");
        let found = all.find(i => i.school && i.school.toLowerCase().includes(school.toLowerCase()));
        if(found) navigateToPoint(found.lat, found.lng, found.name);
    } else if(choice == "2") { nearest('toilet'); }
    else if(choice == "3") { nearest('gate'); }
}

function toggleMenu() {
    let m = document.getElementById("menu");
    m.style.display = (m.style.display === "flex") ? "none" : "flex";
}

function nearest(cat) {
    if(!userMarker) return alert("Locate yourself first!");
    let u = userMarker.getLatLng(), min = Infinity, near;
    markers.forEach(m => {
        if(m.data.cat.toLowerCase() === cat) {
            let d = map.distance(u, [m.data.lat, m.data.lng]);
            if(d < min) { min = d; near = m; }
        }
    });
    if(near) { map.setView([near.data.lat, near.data.lng], 19); near.marker.openPopup(); }
}
