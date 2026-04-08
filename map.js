var map = L.map('map',{attributionControl:false})
.setView([13.0616,80.2347],17);

L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
).addTo(map);

// USER ICON
var userIcon = L.icon({
iconUrl:'https://cdn-icons-png.flaticon.com/512/1946/1946429.png',
iconSize:[38,38]
});

var icons = {
toilet:'assets/icons/toilet.png',
water:'assets/icons/water.png',
hall:'assets/icons/hall.png',
department:'assets/icons/department.png',
lab:'assets/icons/lab.png'
};

var all = [];
var markers = [];
var userMarker;

// LOAD DATA
Promise.all([
fetch(SHEET1).then(r=>r.text()),
fetch(SHEET2).then(r=>r.text()),
fetch(SHEET3).then(r=>r.text()),
fetch(SHEET4).then(r=>r.text())
]).then(data=>{
data.forEach(csv=>{
csv.split("\n").slice(1).forEach(row=>{
let c=row.split(",");
if(c.length<6)return;

let lat=parseFloat(c[c.length-3]);
let lng=parseFloat(c[c.length-2]);
if(!lat||!lng)return;

let obj={
category:(c[0]||"").toLowerCase(),
name:c[2]||"",
building:c[3]||"",
floor:(c[4]=="G")?"ground":(c[4]||""),
room:c[5]||"",
lat,lng
};

all.push(obj);

let icon=L.icon({
iconUrl:icons[obj.category]||icons.hall,
iconSize:[36,36]
});

let popup=`
<div>
<div class="popup-title">${obj.name}</div>
<div class="popup-sub">
${obj.building||""} ${obj.floor?("| "+obj.floor):""} ${obj.room?("| "+obj.room):""}
</div>
</div>
`;

let m=L.marker([lat,lng],{icon}).bindPopup(popup).addTo(map);
markers.push({data:obj,marker:m});
});
});

populateBuildings();
});

// MENU
function toggleMenu(){
let m=document.getElementById("menu");
m.style.display = (m.style.display==="flex")?"none":"flex";
}

// SEARCH
document.getElementById("search").addEventListener("input",function(){
let q=this.value.toLowerCase();

markers.forEach(m=>{
if(m.data.name.toLowerCase().includes(q)){
m.marker.openPopup();
map.setView([m.data.lat,m.data.lng],19);
}
});
});

// BUILDING FILTER
function populateBuildings(){
let set=new Set(all.map(p=>p.building).filter(b=>b));
let sel=document.getElementById("buildingFilter");

sel.innerHTML='<option value="all">All Buildings</option>';

set.forEach(b=>{
let o=document.createElement("option");
o.value=b;
o.text=b;
sel.appendChild(o);
});

sel.onchange=applyFilters;
document.getElementById("floorFilter").onchange=applyFilters;
}

// FILTER
function applyFilters(){
let b=document.getElementById("buildingFilter").value;
let f=document.getElementById("floorFilter").value;

markers.forEach(m=>{
let show=true;

if(b!="all" && m.data.building!=b) show=false;
if(f!="all" && m.data.floor!=f) show=false;

if(show) map.addLayer(m.marker);
else map.removeLayer(m.marker);
});
}

// USER
function locateUser(){
map.locate({setView:true});
map.on('locationfound',e=>{
if(userMarker)map.removeLayer(userMarker);
userMarker=L.marker(e.latlng,{icon:userIcon}).addTo(map).bindPopup("You are here").openPopup();
});
}

// NEAREST
function nearest(type){
if(!userMarker)return;

let u=userMarker.getLatLng();
let min=Infinity,near,nearMarker;

markers.forEach(m=>{
if(m.data.category==type){
let d=map.distance(u,[m.data.lat,m.data.lng]);
if(d<min){
min=d;
near=m.data;
nearMarker=m.marker;
}
}
});

if(nearMarker){
map.setView([near.lat,near.lng],19);
nearMarker.openPopup();
}
}

// AUDIO
var audio=document.getElementById("audio");
function toggleAudio(){
audio.paused?audio.play():audio.pause();
}
