var map = L.map('map', { attributionControl: false, zoomControl: false }).setView([13.0636, 80.2336], 17);
L.control.zoom({ position: 'topleft' }).addTo(map);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 25, maxNativeZoom: 19 }).addTo(map);

var all = [], markers = [], userMarker = null, currentRouteLine = null;
var watchID = null;
var audio = document.getElementById("audio");

// --- AUDIO AUTOPLAY WORKAROUND ---
function initAudioOnInteraction() {
    audio.play().then(() => {
        document.getElementById("audioBtn").innerHTML = "🔊 Audio ON";
    }).catch(() => {
        // Wait for first user click to start
        document.body.addEventListener('click', () => {
            audio.play();
            document.getElementById("audioBtn").innerHTML = "🔊 Audio ON";
        }, { once: true });
    });
}
initAudioOnInteraction();

// --- DATA & ADVANCED FILTER ---
Promise.all([fetch(SHEET1).then(r=>r.text()), fetch(SHEET2).then(r=>r.text()), fetch(SHEET3).then(r=>r.text()), fetch(SHEET4).then(r=>r.text())])
.then(data => {
    data.forEach((csv, idx) => {
        csv.split("\n").slice(1).forEach(row => {
            let c = row.split(",").map(v => v.trim());
            if(c.length < 7) return;
            let obj = { cat: c[0], school: (idx===0?c[1]:""), name: c[2], bldg: c[3], floor: c[4], room: c[5], lat: parseFloat(c[6]), lng: parseFloat(c[7]), desc: c[8] };
            if(!isNaN(obj.lat)) { all.push(obj); createMarker(obj); }
        });
    });
    initAdvancedFilters();
});

function createMarker(obj) {
    let icon = L.icon({ iconUrl: `assets/icons/${obj.cat.toLowerCase()}.png`, iconSize:[40,40], iconAnchor:[20,40], popupAnchor:[0,-40] });
    let popup = `<div class="popup-container"><img src="assets/images/loyola_centenary.png" class="watermark-img"><b>${obj.name||obj.bldg}</b><br><small>${obj.bldg||""}</small><br><button onclick="startNavigation([${obj.lat}, ${obj.lng}], '${obj.name||obj.bldg}')" style="width:100%; background:#23365D; color:white; border:none; padding:5px; border-radius:4px; margin-top:8px; cursor:pointer;">NAVIGATE</button></div>`;
    let m = L.marker([obj.lat, obj.lng], {icon}).bindPopup(popup).addTo(map);
    markers.push({data: obj, marker: m});
}

function initAdvancedFilters() {
    let schools = [...new Set(all.map(i => i.school).filter(s => s))];
    let cats = [...new Set(all.map(i => i.cat).filter(c => c))];
    
    let schoolGroup = document.getElementById("filter-schools");
    let catGroup = document.getElementById("filter-cats");

    schools.forEach(s => schoolGroup.innerHTML += `<option value="s:${s}">${s}</option>`);
    cats.forEach(c => catGroup.innerHTML += `<option value="c:${c}">${c.toUpperCase()}</option>`);

    document.getElementById("advFilter").onchange = function(e) {
        let val = e.target.value;
        markers.forEach(m => {
            let show = false;
            if(val === "all") show = true;
            else if(val.startsWith("s:")) show = (m.data.school === val.split(":")[1]);
            else if(val.startsWith("c:")) show = (m.data.cat === val.split(":")[1]);
            
            if(show) map.addLayer(m.marker); else map.removeLayer(m.marker);
        });
    };
}

// --- NAVIGATION & LIVE TRACKING ---
function startNavigation(destLatLng, name) {
    // 1. Get User Location First
    navigator.geolocation.getCurrentPosition((pos) => {
        const userPos = [pos.coords.latitude, pos.coords.longitude];
        
        // 2. Set user marker
        if(!userMarker) {
            userMarker = L.marker(userPos, { icon: L.icon({iconUrl:'https://cdn-icons-png.flaticon.com/128/4874/4874722.png', iconSize:[40,40]}) }).addTo(map);
        } else {
            userMarker.setLatLng(userPos);
        }

        // 3. Draw Path
        if(currentRouteLine) map.removeLayer(currentRouteLine);
        currentRouteLine = L.polyline([userPos, destLatLng], {color: '#6C232E', weight: 5, dashArray: '10, 10'}).addTo(map);
        map.fitBounds(currentRouteLine.getBounds(), {padding: [100,100]});

        // 4. Show Panel
        document.getElementById("route-panel").style.display = "block";
        updateRouteStats(userPos, destLatLng, name);

        // 5. START LIVE TRACKING ONLY NOW
        startLiveTracking(destLatLng, name);
    }, () => alert("Enable GPS to navigate."));
}

function startLiveTracking(dest, name) {
    if(watchID) navigator.geolocation.clearWatch(watchID);
    watchID = navigator.geolocation.watchPosition((pos) => {
        let newPos = [pos.coords.latitude, pos.coords.longitude];
        userMarker.setLatLng(newPos);
        currentRouteLine.setLatLngs([newPos, dest]);
        updateRouteStats(newPos, dest, name);
    }, null, { enableHighAccuracy: true });
}

function updateRouteStats(start, end, name) {
    let d = map.distance(start, end);
    document.getElementById("route-stats").innerHTML = `<b>To:</b> ${name}<br>🚶 ${Math.round(d)}m (${Math.round(d/80)} min)`;
}

function clearNavigation() {
    if(currentRouteLine) map.removeLayer(currentRouteLine);
    if(watchID) navigator.geolocation.clearWatch(watchID);
    document.getElementById("route-panel").style.display = "none";
    currentRouteLine = null; watchID = null;
}

// --- UTILS ---
function toggleMenu() {
    let m = document.getElementById("menu");
    m.style.display = (m.style.display === "flex") ? "none" : "flex";
}

function toggleAudio() {
    if (audio.paused) { audio.play(); document.getElementById("audioBtn").innerHTML = "🔊 Audio ON"; }
    else { audio.pause(); document.getElementById("audioBtn").innerHTML = "🔇 Audio OFF"; }
}

function nearest(cat) {
    navigator.geolocation.getCurrentPosition((pos) => {
        let u = [pos.coords.latitude, pos.coords.longitude];
        let min = Infinity, near = null;
        markers.forEach(m => {
            if(m.data.cat.toLowerCase() === cat.toLowerCase()) {
                let d = map.distance(u, [m.data.lat, m.data.lng]);
                if(d < min) { min = d; near = m; }
            }
        });
        if(near) { map.setView([near.data.lat, near.data.lng], 19); near.marker.openPopup(); }
    });
}
