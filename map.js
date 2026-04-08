var map = L.map('map',{attributionControl:false})
.setView([13.0616,80.2347],17);

L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
).addTo(map);

// PERSON ICON
var userIcon = L.icon({
iconUrl:'https://cdn-icons-png.flaticon.com/512/1946/1946429.png',
iconSize:[35,35]
});

var icons = {
toilet:'assets/icons/toilet.png',
water:'assets/icons/water.png',
department:'assets/icons/department.png',
lab:'assets/icons/lab.png',
hall:'assets/icons/hall.png'
};

var all=[];

function load(url){
return fetch(url).then(r=>r.text());
}

Promise.all([load(SHEET1),load(SHEET2),load(SHEET3),load(SHEET4)])
.then(data=>{

data.forEach(csv=>{
csv.split("\n").slice(1).forEach(r=>{
let c=r.split(",");
if(c.length<8)return;

let lat=parseFloat(c[c.length-3]);
let lng=parseFloat(c[c.length-2]);
if(!lat||!lng)return;

let name=c[2];
let category=c[0].toLowerCase();
let building=c[3];
let floor=c[4]=="G"?"ground":c[4];

let obj={name,category,building,floor,lat,lng};
all.push(obj);

let icon=L.icon({iconUrl:icons[category]||icons.hall,iconSize:[35,35]});

L.marker([lat,lng],{icon})
.addTo(map)
.bindPopup(name+ "<br>"+building+" | "+floor);
});
});

populateBuildings();
});

// SEARCH
function searchPlace(q){
q=q.toLowerCase();
all.forEach(p=>{
if(p.name.toLowerCase().includes(q)){
map.setView([p.lat,p.lng],19);
}
});
}

// BUILDING FILTER
function populateBuildings(){
let set=new Set(all.map(p=>p.building));
let sel=document.querySelectorAll("select")[0];
set.forEach(b=>{
let o=document.createElement("option");
o.value=b;o.text=b;
sel.appendChild(o);
});
}

function filterBuilding(b){
all.forEach(p=>{
if(b=="all"||p.building==b){
map.setView([p.lat,p.lng],17);
}
});
}

// FLOOR
function filterFloor(f){
all.forEach(p=>{
if(f=="all"||p.floor==f){
map.setView([p.lat,p.lng],17);
}
});
}

// USER
var userMarker;

function locateUser(){
map.locate({setView:true});
map.on('locationfound',e=>{
if(userMarker)map.removeLayer(userMarker);
userMarker=L.marker(e.latlng,{icon:userIcon}).addTo(map);
});
}

// NEAREST
function nearest(type){
if(!userMarker)return;

let u=userMarker.getLatLng();
let min=Infinity,near;

all.forEach(p=>{
if(p.category==type){
let d=map.distance(u,[p.lat,p.lng]);
if(d<min){min=d;near=p;}
}
});

if(near){
map.setView([near.lat,near.lng],19);
L.popup().setLatLng([near.lat,near.lng]).setContent("Nearest "+type).openOn(map);
}
}

// MENU
function toggleMenu(){
let m=document.getElementById("menu");
m.style.display=m.style.display=="flex"?"none":"flex";
}

// PROFILE
function saveProfile(){
localStorage.setItem("user",document.getElementById("name").value);
document.getElementById("login").style.display="none";
}

function editProfile(){
document.getElementById("login").style.display="flex";
}

// AUDIO
var audio=document.getElementById("audio");
function toggleAudio(){
audio.paused?audio.play():audio.pause();
}
