var map = L.map('map',{attributionControl:false})
.setView([13.0624,80.2331],17);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}).addTo(map);

map.zoomControl.setPosition('bottomright');

var layers = {
department:L.layerGroup().addTo(map),
lab:L.layerGroup().addTo(map),
hall:L.layerGroup().addTo(map),
toilet:L.layerGroup().addTo(map),
water:L.layerGroup().addTo(map)
};

var userMarker, routeLine;

// LOGIN
function login(){
localStorage.setItem("user", document.getElementById("username").value);
document.getElementById("loginScreen").style.display="none";
}

// MARKERS
locations.forEach(p=>{
var m=L.marker([p.lat,p.lng]).bindPopup(`
<b>${p.name}</b><br>${p.description}<br>
<button onclick="drawRoute(${p.lat},${p.lng})">Navigate</button>
`);
layers[p.type].addLayer(m);
});

// ROUTE
function drawRoute(lat,lng){
if(!userMarker) return alert("Locate first");

if(routeLine) map.removeLayer(routeLine);

routeLine=L.polyline([userMarker.getLatLng(),[lat,lng]],{color:"#D4A64A"}).addTo(map);
map.fitBounds(routeLine.getBounds());
}

// LOCATION
function locateUser(){
map.locate({setView:true});
map.on('locationfound',e=>{
if(userMarker) map.removeLayer(userMarker);
userMarker=L.marker(e.latlng).addTo(map).bindPopup("You").openPopup();
});
}

// NEAREST
function findNearest(type){
if(!userMarker) return;

let min=999,near;

locations.forEach(p=>{
if(p.type===type){
let d=map.distance(userMarker.getLatLng(),[p.lat,p.lng]);
if(d<min){min=d;near=p;}
}
});

if(near) map.setView([near.lat,near.lng],18);
}

// FLOOR FILTER
function filterFloor(f){
Object.values(layers).forEach(l=>l.clearLayers());

locations.forEach(p=>{
if(f==="all"||p.floor===f){
var m=L.marker([p.lat,p.lng]).bindPopup(p.name);
layers[p.type].addLayer(m);
}
});
}

// VOICE
function startVoice(){
let r=new(window.SpeechRecognition||window.webkitSpeechRecognition)();
r.start();
r.onresult=e=>{
let t=e.results[0][0].transcript.toLowerCase();
locations.forEach(p=>{
if(t.includes(p.name.toLowerCase())){
drawRoute(p.lat,p.lng);
}
});
};
}

// AUDIO
var a=document.getElementById("anthem");
var b=document.getElementById("audioBtn");

window.onload=()=>a.play().catch(()=>document.body.onclick=()=>a.play());

b.onclick=()=>{a.paused?a.play():a.pause()};
