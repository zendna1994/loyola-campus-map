// INITIALIZE
var map = L.map('map', { attributionControl: false, zoomControl: false }).setView([13.0636, 80.2336], 17);
L.control.zoom({ position: 'topleft' }).addTo(map);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 25, maxNativeZoom: 19 }).addTo(map);

var all = [], markers = [], userMarker = null, currentRouteLine = null;
var watchID = null;

// 1. DATA LOADING
Promise.all([fetch(SHEET1).then(r=>r.text()), fetch(SHEET2).then(r=>r.text()), fetch(SHEET3).then(r=>r.text()), fetch(SHEET4).then(r=>r.text())])
.then(data => {
    data.forEach((csv, idx) => {
        csv.split("\n").slice(1).forEach(row => {
            let c = row.split(",").map(v => v.trim());
            if(c.length < 7) return;
            
            let obj = { cat: c[0], type: (idx===0?c[1]:c[1]), name: c[2], bldg: c[3], floor: c[4], room: c[5], lat: parseFloat(c[6]), lng: parseFloat(c[7]), desc: c[8], school: (idx===0?c[1]:"") };

            if(!isNaN(obj.lat)) {
                all.push(obj);
                createMarker(obj);
            }
        });
    });
    populateAdvancedFilters();
});

// Autoplay Audio - Browsers require a user click first. 
// This listener plays the audio on the very first click anywhere on the page.
document.addEventListener('click', function() {
    let audio = document.getElementById("audio");
    let btn = document.getElementById("audioBtn");
    if (audio.paused && btn.innerHTML === "🔊 Audio OFF") {
        audio.play().catch(e => console.log("Autoplay waiting for more interaction"));
        btn.innerHTML = "🔊 Audio ON";
    }
}, { once: true });

function createMarker(obj) {
    let iconUrl = `assets/icons/${obj.cat.toLowerCase()}.png`;
    let icon = L.icon({ iconUrl: iconUrl, iconSize:[40,40], iconAnchor:[20,40], popupAnchor:[0,-40] });
    
    let popup = `
        <div class="popup-container">
            <img src="assets/images/loyola_centenary.png" class="watermark-img">
            <div class="popup-title">${obj.name || obj.bldg}</div>
            <div class="popup-sub">
                ${obj.bldg ? "<b>Bldg:</b> "+obj.bldg+"<br>" : ""}
                ${obj.room ? "<b>Room:</b> "+obj.room : ""}
            </div>
            <button onclick="navigateToPoint(${obj.lat}, ${obj.lng}, '${obj.name || obj.bldg}')" style="width:100%; margin-top:8px; background:#23365D; color:white; border:none; border-radius:4px; cursor:pointer; padding:5px; font-family:Poppins;">Navigate</button>
        </div>`;
    
    let m = L.marker([obj.lat, obj.lng], {icon}).bindPopup(popup).addTo(map);
    markers.push({data: obj, marker: m});
}

// 2. FIXED LIVE TRACKING
function startLiveTracking() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    // Start watching position
    watchID = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const latlng = [latitude, longitude];

            if (!userMarker) {
                userMarker = L.marker(latlng, { 
                    icon: L.icon({iconUrl:'https://cdn-icons-png.flaticon.com/128/4874/4874722.png', iconSize:[40,40]}) 
                }).addTo(map).bindPopup("You are here");
                map.setView(latlng, 18);
            } else {
                userMarker.setLatLng(latlng);
            }

            if (currentRouteLine) {
                let dest = currentRouteLine.getLatLngs()[1];
                currentRouteLine.setLatLngs([latlng, dest]);
                updateRouteStats(latlng, dest);
            }
        },
        (err) => { 
            console.error(err);
            alert("Please enable GPS/Location permissions to use this feature."); 
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// 3. NAVIGATION
function navigateToPoint(lat, lng, name) {
    if (!userMarker) {
        alert("Please start Live Tracking first!");
        return;
    }
    let start = userMarker.getLatLng();
    let end = [lat, lng];

    if (currentRouteLine) map.removeLayer(currentRouteLine);
    currentRouteLine = L.polyline([start, end], {color: '#6C232E', weight: 4, dashArray: '10, 10'}).addTo(map);
    
    map.fitBounds(currentRouteLine.getBounds(), {padding: [100,100]});
    updateRouteStats(start, end, name);
    document.getElementById("route-panel").style.display = "block";
}

function updateRouteStats(start, end, name) {
    let dist = map.distance(start, end);
    let time = Math.round(dist / 80);
    let nameStr = name ? `<b>Dest:</b> ${name}<br>` : "";
    document.getElementById("route-stats").innerHTML = `${nameStr}🚶 ${Math.round(dist)}m (${time < 1 ? '< 1' : time} min walk)`;
}

function clearNavigation() {
    if(currentRouteLine) map.removeLayer(currentRouteLine);
    document.getElementById("route-panel").style.display = "none";
    currentRouteLine = null;
}

// 4. SMART SEARCH
function showSuggestions() {
    let q = document.getElementById("search").value.toLowerCase();
    let box = document.getElementById("suggestions-box");
    if(q.length < 2) { box.style.display = "none"; return; }
    
    let matches = all.filter(i => (i.name||"").toLowerCase().includes(q) || (i.bldg||"").toLowerCase().includes(q)).slice(0,5);
    box.innerHTML = matches.map(m => `
        <div class="suggestion-item" onclick="navigateToPoint(${m.lat},${m.lng},'${m.name||m.bldg}')">
            <span>${m.name||m.bldg}</span>
            <span style="color:#6C232E; font-size:9px;">${m.cat.toUpperCase()}</span>
        </div>`).join('');
    box.style.display = "block";
}

// 5. TOOLS & ADVANCED FILTERS
function toggleMenu() {
    let m = document.getElementById("menu");
    m.style.display = (m.style.display === "flex") ? "none" : "flex";
}

function populateAdvancedFilters() {
    let catSet = new Set(all.map(p => p.cat).filter(c => c));
    let bldgSet = new Set(all.map(p => p.bldg).filter(b => b));

    let catSel = document.getElementById("categoryFilter");
    let bldgSel = document.getElementById("buildingFilter");

    catSel.innerHTML = '<option value="all">All Categories</option>';
    bldgSel.innerHTML = '<option value="all">All Buildings</option>';

    catSet.forEach(c => { catSel.innerHTML += `<option value="${c}">${c.toUpperCase()}</option>`; });
    bldgSet.forEach(b => { bldgSel.innerHTML += `<option value="${b}">${b}</option>`; });

    catSel.onchange = applyAdvancedFilters;
    bldgSel.onchange = applyAdvancedFilters;
}

function applyAdvancedFilters() {
    let selCat = document.getElementById("categoryFilter").value;
    let selBldg = document.getElementById("buildingFilter").value;

    markers.forEach(m => {
        let matchCat = (selCat === "all" || m.data.cat === selCat);
        let matchBldg = (selBldg === "all" || m.data.bldg === selBldg);

        if (matchCat && matchBldg) {
            map.addLayer(m.marker);
        } else {
            map.removeLayer(m.marker);
        }
    });
}

function nearest(cat) {
    if(!userMarker) return alert("Locate yourself first!");
    let u = userMarker.getLatLng(), min = Infinity, near = null;
    markers.forEach(m => {
        if(m.data.cat.toLowerCase() === cat.toLowerCase()) {
            let d = map.distance(u, [m.data.lat, m.data.lng]);
            if(d < min) { min = d; near = m; }
        }
    });
    if(near) { map.setView([near.data.lat, near.data.lng], 19); near.marker.openPopup(); }
    else { alert("No " + cat + " found in database."); }
}

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

function openHelpWizard() {
    let choice = prompt("What do you need? \n1. Find Department \n2. Facility (Restroom/Water) \n3. Exit Gates");
    if(choice == "1") {
        let dept = prompt("Enter Department or School name:");
        if(!dept) return;
        let found = all.find(i => (i.name||"").toLowerCase().includes(dept.toLowerCase()) || (i.school||"").toLowerCase().includes(dept.toLowerCase()));
        if(found) navigateToPoint(found.lat, found.lng, found.name);
        else alert("Department not found.");
    } else if(choice == "2") {
        let fac = prompt("Type 'toilet' or 'water':");
        if(fac) nearest(fac);
    } else if(choice == "3") { nearest('gate'); }
}
