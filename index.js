import * as THREE from "./three.module.js";
import { OrbitControls } from './OrbitControls.js';
import { DragControls } from './DragControls.js';
import Gunnerus_Data from './data/GunnerusData.js';
import SimpleBlock_Data from './SimpleBlockData.js';
import Connection_Data from './data/GunnerusConnection.js';
import {PipeRouting} from "./lib/PipeRouting.js";
import * as pdfjsLib from './lib/pdf/pdf.mjs';
import { STLLoader } from './STLLoader.js'


var objects = [];

// Read connection data
var connections = Connection_Data["connections"];
var arrangements = Gunnerus_Data["arrangements"];

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
buildDecks(deckHeights);
[startPoints, endPoints, diaLists] = FindSeries(connections, arrangements, diaLists, scene);
runPDFViewer();

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

initializeControls();

createMenus();

createGraphView();

//revisionData = getRevisionData();

// Call this after creating import/export buttons
//createVersionSliders();

input3DModels();

function createGraphView()
{
  // set the dimensions and margins of the graph
  const width = 800;
  const height = 800;

  // append the svg object to the body of the page
  const svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(40,0)");

  // Create hierarchical data structure from Gunnerus data
  function createHierarchy() {
    const root = {
      name: "Gunnerus",
      children: []
    };

    // Create main categories based on arrangement types
    const categories = new Set();
    Object.keys(arrangements).forEach(key => {
      const category = key.split('_')[0];
      categories.add(category);
    });

    // Create hierarchy structure
    categories.forEach(category => {

      // Add arrangement nodes
      const versionFiles = Object.keys(arrangements).filter(key => key.startsWith(category));
      versionFiles.forEach(file => {
        const arrangementNode = {
          name: file,
          data: arrangements[file],
          children: []
        };

        // Define version data for each arrangement
        const versionData = {
          'CargoHold': 2,
          'ControlRoom': 2,
          'Accomodation1': 1
        };

        // Add version nodes in a chain
        if (versionData[file]) {
          let currentNode = arrangementNode;
          for (let i = 1; i <= versionData[file]; i++) {
            const versionNode = {
              name: `${arrangements[file].Name}_r${i}`,
              data: arrangements[file],
              version: i,
              children: []
            };
            
            currentNode.children = [versionNode];
            currentNode = versionNode;
          }
        }

        root.children.push(arrangementNode);
      });
    });

    return root;
  }

  // Create cluster layout with the hierarchical data
  const cluster = d3.tree().size([height, width - 100]);


  const root = d3.hierarchy(createHierarchy(), d => d.children);
  cluster(root);

  // Add links between nodes
  svg.selectAll('path')
    .data(root.descendants().slice(1))
    .join('path')
    .attr("d", function(d) {
      return "M" + d.y + "," + d.x
        + "C" + (d.parent.y + 50) + "," + d.x
        + " " + (d.parent.y + 150) + "," + d.parent.x
        + " " + d.parent.y + "," + d.parent.x;
    })
    .style("fill", 'none')
    .attr("stroke", '#ccc');

  // Create node groups
  const nodes = svg.selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  // Add circles to nodes
  nodes.append("circle")
    .attr("r", 7)
    .style("fill", d => {
      // Change color if version is greater than 0
      if (d.data.version && d.data.version > 0) {
        return "#ff7f50"; // Coral color for version > 0
      }
      return d.name ? "#69b3a2" : "#404040";
    })
    .attr("stroke", "black")
    .style("stroke-width", 2)
    .on("click", showNodeDetails)
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  // Update node details function to show arrangement data
  function showNodeDetails(event, d) {
    event.stopPropagation();
    
    nodes.selectAll(".node-details")
      .style("display", "none");
    
    const detailsText = d3.select(event.target.parentNode)
      .select(".node-details")
      .style("display", "block");
    
    if (d.data.data) { // If node has arrangement data
      const arrangement = d.data.data;
      detailsText.text(`Name: ${d.data.name}
                       Position: (${arrangement.position?.x || 0}, ${arrangement.position?.y || 0}, ${arrangement.position?.z || 0})
                       Volume: ${((arrangement.max_x - arrangement.min_x) * 
                                (arrangement.max_y - arrangement.min_y) * 
                                (arrangement.max_z - arrangement.min_z)).toFixed(2)} m³`);
    } else {
      detailsText.text(`Name: ${d.data.name}
                       Type: ${d.children ? 'Category' : 'Component'}
                       No. of Versions: ${d.children?.length || 0}`);
    }

    
    handleVersionChange(d.data.name);
  }

  // Keep existing drag functions
  function dragstarted(event, d) {
    event.sourceEvent.stopPropagation();
    d3.select(this).raise().classed("active", true);
  }

  function dragged(event, d) {
    d.x = event.y;
    d.y = event.x;
    
    const node = d3.select(this.parentNode);
    node.attr("transform", `translate(${d.y},${d.x})`);
    
    // Update connected paths
    svg.selectAll('path')
      .attr("d", function(p) {
        if (p.parent === d) {
          return "M" + p.y + "," + p.x
            + "C" + (d.y + 50) + "," + p.x
            + " " + (d.y + 150) + "," + d.x
            + " " + d.y + "," + d.x;
        } else if (p === d && p.parent) {
          return "M" + d.y + "," + d.x
            + "C" + (p.parent.y + 50) + "," + d.x
            + " " + (p.parent.y + 150) + "," + p.parent.x
            + " " + p.parent.y + "," + p.parent.x;
        }
        return this.getAttribute("d");
      });
  }

  function dragended(event, d) {
    d3.select(this).classed("active", false);
  }

  // Add labels
  nodes.append("text")
    .attr("dx", "-1.2em")
    .attr("dy", "1.5em")
    .text(d => d.data.name)
    .style("font-size", "12px")
    .style("font-family", "Arial");

  // Add detail text containers
  nodes.append("text")
    .attr("class", "node-details")
    .attr("dx", "-1.2em")
    .attr("dy", "3em")
    .style("font-size", "10px")
    .style("font-family", "Arial")
    .style("fill", "#666")
    .style("display", "none");
}

function input3DModels() {
  const loader = new STLLoader();
  const modelPath = './3D_models/STL/Gunnerus/';
  
  const material = new THREE.MeshPhongMaterial({
      color: 0x808080,
      specular: 0x111111,
      shininess: 200,
      transparent: true,
      opacity: 0.7
  });

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const modelFiles = ['gunnerus.stl'];

  modelFiles.forEach(filename => {
      loader.load(
          modelPath + filename,
          function (geometry) {
              const mesh = new THREE.Mesh(geometry, material);
              
              // Center the model
              geometry.computeBoundingBox();
              const center = geometry.boundingBox.getCenter(new THREE.Vector3());
              geometry.center();
              
              // Rotate 90 degrees around Z axis
              mesh.rotation.z = - Math.PI / 2;
              
              // Move half of model's length in X direction
              geometry.computeBoundingBox();
              const length = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
              mesh.position.x = 2.0 * length;
              mesh.position.z = 4.287 * 2;
              
              scene.add(mesh);
              objects.push(mesh);
          },
          function (xhr) {
              console.log((xhr.loaded / xhr.total * 100) + '% loaded');
          },
          function (error) {
              console.error('Error loading STL:', error);
          }
      );
  });
}

function createMenus()
{
  var playButton = document.createElement("button");
  playButton.innerHTML = "▷ GA Generation";
  playButton.style.color = "green";
  playButton.style.fontSize = "15px";
  document.getElementById("figure").appendChild(playButton);
  playButton.onclick = gaButtonClicked;


  // Add these buttons after your existing buttons
  var importButton = document.createElement("button");
  importButton.innerHTML = "Import JSON";
  importButton.style.cssText = `
      color: black;
      font-size: 15px;
      float: right;
      margin-left: 10px;
  `;
  importButton.onclick = importJSON;

  var exportButton = document.createElement("button");
  exportButton.innerHTML = "Export JSON";
  exportButton.style.cssText = `
      color: black;
      font-size: 15px;
      float: right;
  `;
  exportButton.onclick = exportJSON;

  document.getElementById("menus").appendChild(importButton);
  document.getElementById("menus").appendChild(exportButton);
}

function initializeControls()
{
  


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

renderer.setAnimationLoop( animate );

// Call this after scene setup
addClickEventToObjects();
}

function animate() {
	renderer.render( scene, camera );
}

function gaButtonClicked() {
  scene.clear();
    objects = [];
    MakeBoxByBlocks(startBlocks, endBlocks, scene);
    MakePipelineByBlocks(startBlocks, endBlocks, diaLists, scene);
  };

  
function calculationButtonClicked() {
  getDataFromBlocks(startBlocks, endBlocks);
  };
  
function runPDFViewer()
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

function buildDecks(deckHeights)
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


// Add this after import/export buttons
function createVersionSliders(revisionData) {
  
    const slidersContainer = document.createElement('div');
    slidersContainer.style.cssText = `
        margin-top: 10px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 5px;
    `;

    // This would normally come from scanning your data directory
    // For now, we'll hardcode the data files we know about
    const dataFiles = [
        { name: 'CargoHold', versions: 2 },
        { name: 'ControlRoom', versions: 2 },
        { name: 'Accomodation1', versions: 1 }
    ];

    dataFiles.forEach(file => {
        const sliderContainer = document.createElement('div');
        sliderContainer.style.cssText = `
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        const label = document.createElement('label');
        label.textContent = `${file.name}: `;
        label.style.width = '150px';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = file.versions;
        slider.value = '0';
        slider.style.flex = '1';

        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = slider.value;
        valueDisplay.style.width = '30px';

        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
            handleVersionChange(file.name, this.value);
        });

        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(valueDisplay);
        slidersContainer.appendChild(sliderContainer);
    });


    document.getElementById("menus").appendChild(slidersContainer);

}

function handleVersionChange(fileName) {
    // Create the path to the version file
    //const filePath = `./data/versions/${fileName.replace(' ', '_')}_r${version}.json`;
    const filePath = `./data/versions/${fileName}.json`;
    console.log(fileName)
    // Fetch the new version data
    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            // Update the relevant data structures based on file type
            if (data.arrangements) {
                // Update only the specific component's arrangements
                Object.keys(data.arrangements).forEach(key => {
                    arrangements[key] = data.arrangements[key];
                });
            }
            if (data.connections) {
                // Update connections that involve this component
                connections = connections.map(conn => {
                    if (conn.start.includes(fileName) || conn.end.includes(fileName)) {
                        const newConn = data.connections.find(c => 
                            c.start === conn.start && c.end === conn.end
                        );
                        return newConn || conn;
                    }
                    return conn;
                });
            }

            // Rebuild the scene with new data
            scene.clear();
            objects = [];
            startBlocks = [];
            endBlocks = [];
            startPoints = [];
            endPoints = [];
            diaLists = [];
            
            buildDecks(deckHeights);
            [startPoints, endPoints, diaLists] = FindSeries(connections, arrangements, diaLists, scene);
        })
        .catch(error => {
            console.error(`Error loading version of ${fileName}:`, error);
            alert(`Failed to load version of ${fileName}`);
        });
}


// Add these new functions
function importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json, .js';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const jsonData = JSON.parse(event.target.result);
                // Update the data structures
                if (jsonData.arrangements && jsonData.connections) {
                    arrangements = jsonData.arrangements;
                    connections = jsonData.connections;
                    
                    // Reset and rebuild the scene
                    scene.clear();
                    objects = [];
                    startBlocks = [];
                    endBlocks = [];
                    startPoints = [];
                    endPoints = [];
                    diaLists = [];
                    
                    buildDecks(deckHeights);
                    [startPoints, endPoints, diaLists] = FindSeries(connections, arrangements, diaLists, scene);
                }
            } catch (error) {
                console.error('Error parsing JSON:', error);
                alert('Invalid JSON file');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function exportJSON() {
    const exportData = {
        arrangements: arrangements,
        connections: connections
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pipeline_data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Export the function to make it globally accessible
window.caseSelected = function(value) {
    scene.clear();
    objects = [];
    startBlocks = [];
    endBlocks = [];
    startPoints = [];
    endPoints = [];
    diaLists = [];
    
    if (value === "gunnerus") {
        connections = Connection_Data["connections"];
        arrangements = Gunnerus_Data["arrangements"];
    } else {
        connections = Connection_Data["connections"]; // Update with SimpleBlock connections
        arrangements = SimpleBlock_Data["arrangements"];
    }
    
    buildDecks(deckHeights);
    [startPoints, endPoints, diaLists] = FindSeries(connections, arrangements, diaLists, scene);
    input3DModels();
    initializeControls();
};


