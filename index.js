
import * as THREE from "./three.module.js";
import { OrbitControls } from './OrbitControls.js';
import { DragControls } from './DragControls.js';
import JSON_Data from './GunnerusData.js';
import Connection_Data from './GunnerusConnection.js';
import {PipeRouting} from "./lib/PipeRouting.js";

var objects = [];

// Read connection data
var connections = Connection_Data["connections"];
var arrangements = JSON_Data["arrangements"];

var startPoints =[];
var endPoints = [];
var diaLists = [];

// This creates a new scene
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
 
class arrangedObject {
  constructor(target, object) {
    this.target = target;
    this.object = object;
  }
}

var startBlocks = [];
var endBlocks = [];

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
      scene.add( cube );
      objects.push( cube );

      startBlocks.push(new arrangedObject(target, cube))
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
    scene.add( cube2 );
    objects.push( cube2 );
    
    endBlocks.push(new arrangedObject(target, cube2))
  }

  return [startPoints, endPoints, diaLists];
}

{//creating cylinder between objects
for (let i=0; i<startPoints.length; i++)
  {
    var geometry_cy = new THREE.CylinderGeometry( diaLists[i]/1000, diaLists[i]/1000, Math.abs(startPoints[i].x-endPoints[i].x), 32 );
    var material_cy = new THREE.MeshBasicMaterial( { color: "blue" } );
    var cylinder_x = new THREE.Mesh( geometry_cy, material_cy ); 


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
    var result = pipeRouting.RapidPipeRoutingStart(arrangements, startBlocks[i].target.position, endBlocks[i].target.position);
    var result = 0; //runPipes(startBlocks[i].target.position.x * gridSpace, startBlocks[i].target.position.y * gridSpace, startBlocks[i].target.position.z * gridSpace, endBlocks[i].target.position.x * gridSpace, endBlocks[i].target.position.y * gridSpace, endBlocks[i].target.position.z * gridSpace);

    /*
  for (let j=0; j<result.path.length-1; j++)
  {
    
    var geometry_cy = new THREE.CylinderGeometry( diaLists[i]/1000, diaLists[i]/1000, Math.abs(result.path[j].x-result.path[j+1].x), 32 );
    var material_cy = new THREE.MeshBasicMaterial( { color: "blue" } );
    var cylinder_x = new THREE.Mesh( geometry_cy, material_cy ); 

    //Adding objects to scene
    scene.add( cylinder_x );
    //Adding objects to array
    objects.push( cylinder_x );
    cylinder_x.rotation.z = Math.PI/2
    cylinder_x.position.x = (result.path[j].x + result.path[j+1].x)/2;
    cylinder_x.position.y = result.path[j].y;
    cylinder_x.position.z = result.path[j].z;

    var geometry_cy = new THREE.CylinderGeometry( diaLists[i]/1000, diaLists[i]/1000,Math.abs(result.path[j].y-result.path[j+1].y), 32 );
    var material_cy = new THREE.MeshBasicMaterial( { color: "blue" } );
    var cylinder_y = new THREE.Mesh( geometry_cy, material_cy ); 

    //Adding objects to scene
    scene.add( cylinder_y );

    //Adding objects to array
    objects.push( cylinder_y );
    cylinder_y.rotation.y = Math.PI/2
    cylinder_y.position.x = result.path[j].x
    cylinder_y.position.y = (result.path[j].y + result.path[j+1].y)/2;
    cylinder_y.position.z = result.path[j].z;

    var geometry_cy = new THREE.CylinderGeometry( diaLists[i]/1000, diaLists[i]/1000, Math.abs(result.path[j].z-result.path[j+1].z), 32 );
    var material_cy = new THREE.MeshBasicMaterial( { color: "blue" } );
    var cylinder_z = new THREE.Mesh( geometry_cy, material_cy ); 

    //Adding objects to scene
    scene.add( cylinder_z );
    //Adding objects to array
    objects.push( cylinder_z );
    
    cylinder_z.rotation.x = Math.PI/2
    cylinder_z.position.x = result.path[j].x
    cylinder_z.position.y = result.path[j].y;
    cylinder_z.position.z = (result.path[j].z + result.path[j+1].z)/2;
  }
  */
  }
}

[startPoints, endPoints, diaLists] = FindSeries(connections, arrangements, diaLists, scene);


//MakePipelineByBlocks(startBlocks, endBlocks, diaLists, scene);
MakePipelineByAstar(startBlocks, endBlocks, diaLists, scene);






//container should be here, but not overwriting the size of the window, to be fixed
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth/2, window.innerHeight/3 );
renderer.setClearColor( 0xffffff, 0);

//put renderer to "figure" div
document.getElementById("figure").appendChild( renderer.domElement );


//Caling Orbit Controls for Mouse
var orbitControls = new OrbitControls( camera, renderer.domElement );


//This controls the position of the Camera
camera.position.z = 30;
camera.position.x = 10;
camera.position.y = 10;

//Drag Controls - when see obcte disables OrbitControl		
var dragControls = new DragControls( objects, camera, renderer.domElement );
dragControls.addEventListener( 'dragstart', function (event) { orbitControls.enabled = false; } );
dragControls.addEventListener( 'dragend', function (event) { 
  var foundObj = startBlocks.find(startBlocks => startBlocks.object === event.object);
  console.log(scene)
  if (foundObj) {
    foundObj.target.position = event.object.position;
    } 
    else if (foundObj = endBlocks.find(endBlocks => endBlocks.object === event.object)){
      
    foundObj.target.position = event.object.position;
    }

  orbitControls.enabled = true; 
    
} );



function animate() {
	renderer.render( scene, camera );
  //document.getElementById("results").innerHTML = JSON.stringify(cube.position.x);
}

renderer.setAnimationLoop( animate );

//make a button to play the pipe routing

/*
<input type='button' 
         name='play' 
         value='▷ Pipe routing' 
         style.color='green'
         style.fontSize='15px'
         onclick='playButtonClicked()'/>
  </div>
  */

var playButton = document.createElement("button");
playButton.innerHTML = "▷ Pipe routing";
playButton.style.color = "green";
playButton.style.fontSize = "15px";
document.getElementById("figure").appendChild(playButton);
playButton.onclick = playButtonClicked;
function playButtonClicked() {
scene.clear();
  objects = [];
  MakeBoxByBlocks(startBlocks, endBlocks, scene);
  MakePipelineByBlocks(startBlocks, endBlocks, diaLists, scene);
};
