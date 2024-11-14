import * as THREE from "./three.module.js";
import { OrbitControls } from './OrbitControls.js';
import { DragControls } from './DragControls.js';
import JSON_Data from './GunnerusData.js';
import Connection_Data from './GunnerusConnection.js';
import {PipeRouting} from "./lib/PipeRouting.js";
import * as pdfjsLib from './lib/pdf/pdf.mjs';


var objects = [];

// Read connection data
var connections = Connection_Data["connections"];
var arrangements = JSON_Data["arrangements"];

var startPoints =[];
var endPoints = [];
var diaLists = [];

// This creates a new scene
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.1, 1000 );
 
class arrangedObject {
  constructor(target, object) {
    this.target = target;
    this.object = object;
  }
}

var startBlocks = [];
var endBlocks = [];
const deckHeights = [0, 2.613, 4.287];
BuildDecks(deckHeights);
[startPoints, endPoints, diaLists] = FindSeries(connections, arrangements, diaLists, scene);
RunPDFViewer();

//container should be here, but not overwriting the size of the window, to be fixed
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth/2, window.innerHeight/3 );
renderer.setClearColor( 0xffffff, 0);


var playButton2 = document.createElement("button");
playButton2.innerHTML = "▷ Calculation";
playButton2.style.color = "black";
playButton2.style.fontSize = "15px";
document.getElementById("figure").appendChild(playButton2);
playButton2.onclick = calculationButtonClicked;

//put renderer to "figure" div
document.getElementById("figure").appendChild( renderer.domElement );


//Caling Orbit Controls for Mouse
var orbitControls = new OrbitControls( camera, renderer.domElement );


//This controls the position of the Camera
camera.position.z = 8.0;
camera.position.x = 12;
camera.position.y = -18.5;
camera.rotation.x = 0.8976;
camera.rotation.y = 0.0094;
camera.rotation.z = -0.0119;


//Drag Controls - when see obcte disables OrbitControl		
var dragControls = new DragControls( objects, camera, renderer.domElement );
dragControls.addEventListener( 'dragstart', function (event) { orbitControls.enabled = false; } );
dragControls.addEventListener( 'dragend', function (event) { 
  
  // Find the nearest deck height
  const currentZ = event.object.position.z;
  const nearestDeckHeight = deckHeights.reduce((prev, curr) => {
    return Math.abs(curr - currentZ) < Math.abs(prev - currentZ) ? curr : prev;
  });

  // Calculate the height of the object
  var foundObj = startBlocks.find(startBlocks => startBlocks.object === event.object);
  if (!foundObj) {
    foundObj = endBlocks.find(endBlocks => endBlocks.object === event.object);
  }

  if (foundObj) {
    const height = foundObj.target.max_z - foundObj.target.min_z;
    // Update the object's z position to align bottom with deck
    event.object.position.z = nearestDeckHeight + height/2;
    
    // Update the target's position and z bounds
    foundObj.target.position = event.object.position;
    foundObj.target.min_z = nearestDeckHeight;
    foundObj.target.max_z = nearestDeckHeight + height;
  }
  
  orbitControls.enabled = true;
});



function animate() {
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );

// Call this after scene setup
addClickEventToObjects();


var playButton = document.createElement("button");
playButton.innerHTML = "▷ GA Generation";
playButton.style.color = "green";
playButton.style.fontSize = "15px";
document.getElementById("figure").appendChild(playButton);
playButton.onclick = gaButtonClicked;

function gaButtonClicked() {
  scene.clear();
    objects = [];
    MakeBoxByBlocks(startBlocks, endBlocks, scene);
    MakePipelineByBlocks(startBlocks, endBlocks, diaLists, scene);
  };

  
function calculationButtonClicked() {
  getDataFromBlocks(startBlocks, endBlocks);
  };
  
function RunPDFViewer()
{
  
var url = './resources/General-Arrangement.pdf';

// Loaded via <script> tag, create shortcut to access PDF.js exports.
pdfjsLib.GlobalWorkerOptions.workerSrc = './lib/pdf/pdf.worker.mjs';

var pdfDoc = null,
pageNum = 1,
pageRendering = false,
pageNumPending = null,
scale = 0.8,
canvas = document.getElementById('the-canvas'),
ctx = canvas.getContext('2d');

/**
* Get page info from document, resize canvas accordingly, and render page.
* @param num Page number.
*/
function renderPage(num) {
pageRendering = true;
// Using promise to fetch the page
pdfDoc.getPage(num).then(function(page) {
var viewport = page.getViewport({scale: scale});
canvas.height = viewport.height;
canvas.width = viewport.width;

// Render PDF page into canvas context
var renderContext = {
  canvasContext: ctx,
  viewport: viewport
};
var renderTask = page.render(renderContext);

// Wait for rendering to finish
renderTask.promise.then(function() {
  pageRendering = false;
  if (pageNumPending !== null) {
    // New page rendering is pending
    renderPage(pageNumPending);
    pageNumPending = null;
  }
});
});

// Update page counters
document.getElementById('page_num').textContent = num;
}

/**
* If another page rendering in progress, waits until the rendering is
* finised. Otherwise, executes rendering immediately.
*/
function queueRenderPage(num) {
if (pageRendering) {
pageNumPending = num;
} else {
renderPage(num);
}
}

/**
* Displays previous page.
*/
function onPrevPage() {
if (pageNum <= 1) {
return;
}
pageNum--;
queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage);

/**
* Displays next page.
*/
function onNextPage() {
if (pageNum >= pdfDoc.numPages) {
return;
}
pageNum++;
queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage);

/**
* Asynchronously downloads PDF.
*/
pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
pdfDoc = pdfDoc_;
document.getElementById('page_count').textContent = pdfDoc.numPages;

// Initial/first page rendering
renderPage(pageNum);
});
}


function MakePipelineByBlocks(startBlocks, endBlocks, diaLists,scene)
{
//creating cylinder between objects
for (let i=0; i<startBlocks.length; i++)
  {
    var geometry_cy = new THREE.CylinderGeometry( diaLists[i]/1000, diaLists[i]/1000, Math.abs(startBlocks[i].target.position.x-endBlocks[i].target.position.x), 32 );
    var material_cy = new THREE.MeshBasicMaterial( { color: "blue" } );
    var cylinder_x = new THREE.Mesh( geometry_cy, material_cy ); 

    startPoints[i] = startBlocks[i].target.position;
    endPoints[i] = endBlocks[i].target.position;
    //Adding objects to scene
    scene.add( cylinder_x );
    //Adding objects to array
    objects.push( cylinder_x );
    cylinder_x.rotation.z = Math.PI/2
    cylinder_x.position.x = (startPoints[i].x + endPoints[i].x)/2;
    cylinder_x.position.y = startPoints[i].y;
    cylinder_x.position.z = startPoints[i].z;

    var geometry_cy = new THREE.CylinderGeometry( diaLists[i]/1000, diaLists[i]/1000, Math.abs(startPoints[i].y-endPoints[i].y), 32 );
    var material_cy = new THREE.MeshBasicMaterial( { color: "blue" } );
    var cylinder_y = new THREE.Mesh( geometry_cy, material_cy ); 

    //Adding objects to scene
    scene.add( cylinder_y );

    //Adding objects to array
    objects.push( cylinder_y );
    cylinder_y.rotation.y = Math.PI/2
    cylinder_y.position.x = endPoints[i].x
    cylinder_y.position.y = (startPoints[i].y + endPoints[i].y)/2;
    cylinder_y.position.z = startPoints[i].z;

    var geometry_cy = new THREE.CylinderGeometry( diaLists[i]/1000, diaLists[i]/1000, Math.abs(startPoints[i].z-endPoints[i].z), 32 );
    var material_cy = new THREE.MeshBasicMaterial( { color: "blue" } );
    var cylinder_z = new THREE.Mesh( geometry_cy, material_cy ); 

    //Adding objects to scene
    scene.add( cylinder_z );
    //Adding objects to array
    objects.push( cylinder_z );
    
    cylinder_z.rotation.x = Math.PI/2
    cylinder_z.position.x = endPoints[i].x
    cylinder_z.position.y = endPoints[i].y;
    cylinder_z.position.z = (startPoints[i].z + endPoints[i].z)/2;

  }
}

function MakePipelineByAstar(startBlocks, endBlocks, diaLists, scene)
{
var gridSpace = 10;
//creating cylinder between objects
for (let i=0; i<startBlocks.length; i++)
{
    //app.js에서 export된 function runPipes을 실행
    var pipeRouting = new PipeRouting();
    var value = pipeRouting.RapidPipeRoutingStart(arrangements, startBlocks[i].target.position, endBlocks[i].target.position);

    //get (x,y,z) from result
    value.then((result)=>{
    for (let j=0; j<result.length-1; j++)
    {
      var geometry_cy = new THREE.CylinderGeometry( diaLists[i]/1000, diaLists[i]/1000, Math.abs(result[j].x-result[j+1].x), 32 );
      var material_cy = new THREE.MeshBasicMaterial( { color: "blue" } );
      var cylinder_x = new THREE.Mesh( geometry_cy, material_cy ); 

      //Adding objects to scene
      scene.add( cylinder_x );
      //Adding objects to array
      objects.push( cylinder_x );
      cylinder_x.rotation.z = Math.PI/2
      cylinder_x.position.x = (result[j].x + result[j+1].x)/2;
      cylinder_x.position.y = result[j].y;
      cylinder_x.position.z = result[j].z;

      var geometry_cy = new THREE.CylinderGeometry( diaLists[i]/1000, diaLists[i]/1000,Math.abs(result[j].y-result[j+1].y), 32 );
      var material_cy = new THREE.MeshBasicMaterial( { color: "blue" } );
      var cylinder_y = new THREE.Mesh( geometry_cy, material_cy ); 

      //Adding objects to scene
      scene.add( cylinder_y );

      //Adding objects to array
      objects.push( cylinder_y );
      cylinder_y.rotation.y = Math.PI/2
      cylinder_y.position.x = result[j].x
      cylinder_y.position.y = (result[j].y + result[j+1].y)/2;
      cylinder_y.position.z = result[j].z;

      var geometry_cy = new THREE.CylinderGeometry( diaLists[i]/1000, diaLists[i]/1000, Math.abs(result[j].z-result[j+1].z), 32 );
      var material_cy = new THREE.MeshBasicMaterial( { color: "blue" } );
      var cylinder_z = new THREE.Mesh( geometry_cy, material_cy ); 

      //Adding objects to scene
      scene.add( cylinder_z );
      //Adding objects to array
      objects.push( cylinder_z );
      
      cylinder_z.rotation.x = Math.PI/2
      cylinder_z.position.x = result[j].x
      cylinder_z.position.y = result[j].y;
      cylinder_z.position.z = (result[j].z + result[j+1].z)/2;
    }
  });
  }
}

function MakeBoxByBlocks(startBlocks, endBlocks,scene)
{
  for (let i=0; i<startBlocks.length; i++)
  {      
    var target = startBlocks[i].target;
      //create start block
      var geometry_cube = new THREE.BoxGeometry( target.max_x - target.min_x, target.max_y - target.min_y, target.max_z - target.min_z );
      var material = new THREE.MeshBasicMaterial( { color: target.color, 
      opacity: 0.5, transparent: true} );
      var cube = new THREE.Mesh( geometry_cube, material );
      
      //set position of the block
      cube.position.x = target.position.x;
      cube.position.y = target.position.y;
      cube.position.z = target.position.z;
      scene.add( cube );
      objects.push( cube );

      target = endBlocks[i].target;  
      var geometry_cube2 = new THREE.BoxGeometry( target.max_x - target.min_x, target.max_y - target.min_y, target.max_z - target.min_z );
      var material_c2 = new THREE.MeshBasicMaterial( {color: target.color,  opacity: 0.5, transparent: true} );
      var cube2 = new THREE.Mesh( geometry_cube2, material_c2 );

        //set position of the block
      cube2.position.x = target.position.x;
      cube2.position.y = target.position.y;
      cube2.position.z = target.position.z;
      scene.add( cube2 );
      objects.push( cube2 );
  }
}
function FindSeries(connections, arrangements, diaLists, scene)
{
  for (let i=0; i<connections.length; i++)
  {
    var startName = connections[i].start;
    var endName = connections[i].end;
    diaLists.push(connections[i].diameter)

    //find start block
    if (arrangements.hasOwnProperty(startName))
    {
      var target = arrangements[startName];
      
      
      startPoints.push(new THREE.Vector3((target.min_x + target.max_x)/2, (target.min_y + target.max_y)/2, (target.min_z + target.max_z)/2));
      
      //create start block
      var geometry_cube = new THREE.BoxGeometry( target.max_x - target.min_x, target.max_y - target.min_y, target.max_z - target.min_z );
      var material = new THREE.MeshBasicMaterial( { color: target.color, 
      opacity: 0.5, transparent: true} );
      var cube = new THREE.Mesh( geometry_cube, material );
      
      //set position of the block
      cube.position.x = (target.min_x + target.max_x)/2;
      cube.position.y = (target.min_y + target.max_y)/2;
      cube.position.z = (target.min_z + target.max_z)/2;
      target.position = cube.position;
      target.Name = startName;

      startBlocks.push(new arrangedObject(target, cube))
      
      scene.add( cube );
      objects.push( cube );
    }

    //find end block
    if (arrangements.hasOwnProperty(endName))
    {
      var target = arrangements[endName];
      
      endPoints.push(new THREE.Vector3((target.min_x + target.max_x)/2, (target.min_y + target.max_y)/2, (target.min_z + target.max_z)/2));
    }
    
    var geometry_cube2 = new THREE.BoxGeometry( target.max_x - target.min_x, target.max_y - target.min_y, target.max_z - target.min_z );
    var material_c2 = new THREE.MeshBasicMaterial( { color: target.color, opacity: 0.5, transparent: true} );
    var cube2 = new THREE.Mesh( geometry_cube2, material_c2 );

      //set position of the block
    cube2.position.x = (target.min_x + target.max_x)/2;
    cube2.position.y = (target.min_y + target.max_y)/2;
    cube2.position.z = (target.min_z + target.max_z)/2;
    target.position = cube2.position;
    target.Name = endName;
    
    endBlocks.push(new arrangedObject(target, cube2))

    scene.add( cube2 );
    objects.push( cube2 );
  }

  return [startPoints, endPoints, diaLists];
}

function GridGeometry(width = 1, height = 1, wSeg = 1, hSeg = 1, lExt = [0, 0]){
	
  let seg = new THREE.Vector2(width / wSeg, height / hSeg);
  let hlfSeg = seg.clone().multiplyScalar(0.5);
  
  let pts = [];
  
  for(let y = 0; y <= hSeg; y++){
  	pts.push(
    	new THREE.Vector2(0, y * seg.y),
      new THREE.Vector2(width + (hlfSeg.x * lExt[0]), y * seg.y)
    )
  }
  
  for(let x = 0; x <= wSeg; x++){
  	pts.push(
    	new THREE.Vector2(x * seg.x, 0),
      new THREE.Vector2(x * seg.x, height + (hlfSeg.y * lExt[1]))
    )
  }
  
  return new THREE.BufferGeometry().setFromPoints(pts);
  
}

function BuildDecks(deckHeights)
{
  let deck1 = GridGeometry(30, 10, 10, 10, [0, 1]);
  deck1.rotateX(Math.PI * 1);
  let m1 = new THREE.LineBasicMaterial({color: "black", transparent: true, opacity: 0.5});
  let grid1 = new THREE.LineSegments(deck1, m1);
  grid1.position.set(0, 5, deckHeights[0]);
  scene.add(grid1);

  let deck2 = GridGeometry(30, 10, 10, 10, [0, 1]);
  deck2.rotateX(Math.PI * 1);
  let m2 = new THREE.LineBasicMaterial({color: "black", transparent: true, opacity: 0.5});
  let grid2 = new THREE.LineSegments(deck2, m2);
  grid2.position.set(0, 5, deckHeights[1]);
  scene.add(grid2);

  let deck3 = GridGeometry(30, 10, 10, 10, [0, 1]);
  deck3.rotateX(Math.PI * 1);
  let m3 = new THREE.LineBasicMaterial({color: "black", transparent: true, opacity: 0.5});
  let grid3 = new THREE.LineSegments(deck3, m3);
  grid3.position.set(0, 5, deckHeights[2]);
  scene.add(grid3);

}

function getDataFromBlocks(startBlocks, endBlocks) {
  let totalVolume = 0;
  let cog = new THREE.Vector3(0, 0, 0);

  function calculateVolumeAndCOG(blocks) {
    blocks.forEach(block => {
      const target = block.target;
      const volume = (target.max_x - target.min_x) * (target.max_y - target.min_y) * (target.max_z - target.min_z);
      totalVolume += volume;

      // Calculate weighted COG
      cog.x += (target.position.x * volume);
      cog.y += (target.position.y * volume);
      cog.z += (target.position.z * volume);
    });
  }

  calculateVolumeAndCOG(startBlocks);
  calculateVolumeAndCOG(endBlocks);

  // Final COG calculation
  if (totalVolume > 0) {
    cog.x /= totalVolume;
    cog.y /= totalVolume;
    cog.z /= totalVolume;
  }

  console.log("Total Volume:", totalVolume);
  console.log("Center of Gravity:", cog);
}

// Add this after your other UI elements
function createInfoPanel() {
    const panel = document.createElement('div');
    panel.id = 'info-panel';
    panel.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(255, 255, 255, 0.9);
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        min-width: 200px;
        display: none;
    `;

    const table = document.createElement('table');
    table.style.cssText = `
        width: 100%;
        border-collapse: collapse;
    `;
    
    const headerRow = `
        <tr style="background: #f0f0f0;">
            <th style="padding: 8px; text-align: left;">Property</th>
            <th style="padding: 8px; text-align: left;">Value</th>
        </tr>
    `;
    
    table.innerHTML = headerRow + `
        <tr><td colspan="2" id="object-name" style="padding: 8px; font-weight: bold;"></td></tr>
        <tr>
            <td style="padding: 8px;">Position</td>
            <td id="position" style="padding: 8px;"></td>
        </tr>
        <tr>
            <td style="padding: 8px;">Dimensions</td>
            <td id="dimensions" style="padding: 8px;"></td>
        </tr>
        <tr>
            <td style="padding: 8px;">Volume</td>
            <td id="volume" style="padding: 8px;"></td>
        </tr>
        <tr>
            <td style="padding: 8px;">Deck Level</td>
            <td id="deck-level" style="padding: 8px;"></td>
        </tr>
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        position: absolute;
        right: 5px;
        top: 5px;
        border: none;
        background: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
    `;
    closeButton.onclick = () => panel.style.display = 'none';

    panel.appendChild(closeButton);
    panel.appendChild(table);
    document.getElementById('figure').appendChild(panel);
    return panel;
}

// Add click event handling to objects
function addClickEventToObjects() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const infoPanel = createInfoPanel();

    window.addEventListener('click', (event) => {
        // Convert mouse position to normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(objects);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            
            // Find the corresponding block data
            let blockData = startBlocks.find(b => b.object === clickedObject);
            if (!blockData) {
                blockData = endBlocks.find(b => b.object === clickedObject);
            }

            if (blockData) {
                updateInfoPanel(blockData, infoPanel);
            }
        } else {
            infoPanel.style.display = 'none';
        }
    });
}

function updateInfoPanel(blockData, panel) {
    const target = blockData.target;
    const isStartBlock = startBlocks.includes(blockData);
    
    // Calculate dimensions and volume
    const width = target.max_x - target.min_x;
    const height = target.max_y - target.min_y;
    const depth = target.max_z - target.min_z;
    const volume = width * height * depth;

    // Find deck level
    const deckLevel = deckHeights.findIndex(h => 
        Math.abs(h - target.min_z) < 0.1
    ) + 1;

    // Update panel content
    document.getElementById('object-name').textContent = 
        `${target.Name}`;
    document.getElementById('position').textContent = 
        `X: ${target.position.x.toFixed(2)}, Y: ${target.position.y.toFixed(2)}, Z: ${target.position.z.toFixed(2)}`;
    document.getElementById('dimensions').textContent = 
        `${width.toFixed(2)} × ${height.toFixed(2)} × ${depth.toFixed(2)}`;
    document.getElementById('volume').textContent = 
        `${volume.toFixed(2)} m³`;
    document.getElementById('deck-level').textContent = 
        `Deck ${deckLevel}`;

    // Show panel
    panel.style.display = 'block';
}
