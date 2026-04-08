// LOGIN
var user = JSON.parse(localStorage.getItem("loyolaUser"));
if (user) document.getElementById("loginScreen").style.display = "none";

function login() {
  var name = document.getElementById("name").value;
  var role = document.getElementById("role").value;
  localStorage.setItem("loyolaUser", JSON.stringify({name, role}));
  document.getElementById("loginScreen").style.display = "none";
}

function editProfile() {
  document.getElementById("loginScreen").style.display = "flex";
}

// MAP
var map = L.map('map',{attributionControl:false})
.setView([13.0616,80.2347],17);

L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
{maxZoom:19}
).addTo(map);

map.zoomControl.setPosition('topleft');

// ICONS
var icons = {
department:L.icon({iconUrl:'assets/icons/department.png',iconSize:[30,30]}),
lab:L.icon({iconUrl:'assets/icons/lab.png',iconSize:[30,30]}),
hall:L.icon({iconUrl:'assets/icons/hall.png',iconSize:[30,30]}),
auditorium:L.icon({iconUrl:'assets/icons/auditorium.png',iconSize:[30,30]}),
toilet:L.icon({iconUrl:'assets/icons/toilet.png',iconSize:[30,30]}),
water:L.icon({iconUrl:'assets/icons/water.png',iconSize:[30,30]}),
building:L.icon({iconUrl:'assets/icons/building.png',iconSize:[30,30]}),
gate:L.icon({iconUrl:'assets/icons/gate.png',iconSize:[30,30]}),
parking:L.icon({iconUrl:'assets/icons/parking.png',iconSize:[30,30]})
};

// LAYERS
var layers = {};
Object.keys(icons).forEach(k=>{
layers[k]=L.layerGroup().addTo(map);
});

// STORE DATA
var allLocations=[];

// FETCH DATA
fetch(SHEET_URL)
.then(r=>r.text())
.then(csv=>{
var rows=csv.split("\n").slice(1);

rows.forEach(row=>{
var c=row.split(",");
if(c.length<8)return;

var category=c[0].trim().toLowerCase();
var name=c[2].trim();
var building=c[3].trim();

var rawFloor=c[4].trim().toUpperCase();
var floor=(rawFloor==="G")?"ground":rawFloor;

var lat=parseFloat(c[5]);
var lng=parseFloat(c[6]);
var desc=c[7].trim();

if(!lat||!lng)return;

var p={category,name,building,floor,lat,lng,desc};
allLocations.push(p);
addMarker(p);
});
});

// ADD MARKER
function addMarker(p){
var icon=icons[p.category]||icons.building;

var m=L.marker([p.lat,p.lng],{icon})
.bindPopup(`<b>${p.name}</b><br>${p.desc}<br><small>${p.building} | ${p.floor}</small>`);

if(layers[p.category]) m.addTo(layers[p.category]);
}

// FLOOR FILTER
function filterFloor(f){
Object.values(layers).forEach(l=>l.clearLayers());
allLocations.forEach(p=>{
if(f==="all"||p.floor===f) addMarker(p);
});
}

// MENU
function toggleMenu(){
var m=document.getElementById("menu");
m.style.display=(m.style.display==="flex")?"none":"flex";
}

// LOCATION
var userMarker;
function locateUser(){
map.locate({setView:true,maxZoom:18});
map.on('locationfound',e=>{
if(userMarker) map.removeLayer(userMarker);
userMarker=L.marker(e.latlng).addTo(map).bindPopup("You are here").openPopup();
});
}

// NEAREST
function findNearest(type){
if(!userMarker)return alert("Click Locate first");
let min=Infinity,n;
allLocations.forEach(p=>{
if(p.category===type){
let d=map.distance(userMarker.getLatLng(),[p.lat,p.lng]);
if(d<min){min=d;n=p;}
}
});
if(n) map.setView([n.lat,n.lng],18);
}

// VOICE
function startVoice(){
let r=new(window.SpeechRecognition||window.webkitSpeechRecognition)();
r.start();
r.onresult=e=>{
let t=e.results[0][0].transcript.toLowerCase();
allLocations.forEach(p=>{
if(t.includes(p.name.toLowerCase())){
map.setView([p.lat,p.lng],18);
}
});
};
}

// AUDIO
var audio=document.getElementById("anthem");
window.onload=()=>{
audio.play().catch(()=>{
document.body.onclick=()=>audio.play();
});
};
