import * as THREE from "./three.module.js";
import { OrbitControls } from './OrbitControls.js';
import { DragControls } from './DragControls.js';
import Gunnerus_Data from './data/GunnerusData.js';
import SimpleBlock_Data from './data/SimpleBlockData.js';
import Connection_Data from './data/GunnerusConnection.js';
import SimpleBlockConnection_Data from './data/SimpleBlockConnection.js';
import {PipeRouting} from "./lib/PipeRouting.js";
import * as pdfjsLib from './lib/pdf/pdf.mjs';
import { STLLoader } from './STLLoader.js'

// Make handleCaseChange globally accessible immediately
window.handleCaseChange = function(value) {
  console.log("Case changed to:", value.value);
  try {
    if (value.value === "case2") {
      main("Gunnerus");
    } else if (value.value === "case1") {
      main("SimpleBlock");
    }
  } catch (error) {
    console.error("Error in handleCaseChange:", error);
  }
};

main("SimpleBlock");

if (case2.checked)
  main("Gunnerus");
else
  main("SimpleBlock");

function main(vessel)
{


    var objects = [];

    // Read connection data
    var connections = Connection_Data["connections"];
    var arrangements = Gunnerus_Data["arrangements"];

    if (vessel == "SimpleBlock")
      {
        arrangements = SimpleBlock_Data["arrangements"];
        connections = SimpleBlockConnection_Data["connections"];
      }

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
    let renderer;
    try {
      // Check if WebGL is available
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        throw new Error('WebGL not supported');
      }
      
      renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      });
      renderer.setSize( window.innerWidth/2, window.innerHeight/3 );
      renderer.setClearColor( 0xffffff, 0);
    } catch (error) {
      console.error("WebGL not supported, trying Canvas renderer:", error);
      try {
        renderer = new THREE.CanvasRenderer();
        renderer.setSize( window.innerWidth/2, window.innerHeight/3 );
        renderer.setClearColor( 0xffffff, 0);
      } catch (fallbackError) {
        console.error("No renderer available:", fallbackError);
        alert("Your browser doesn't support WebGL or Canvas rendering. Please try a different browser.");
        return;
      }
    }

  //put renderer to "figure" div
  document.getElementById("figure").appendChild( renderer.domElement );

  initializeControls();


  if (vessel == "Gunnerus")
      {
      var dataBaseAddress = './data/versions/Gunnerus/'
      createDataBase(dataBaseAddress).then(database => {
        console.log('Database loaded:', database);
        // Store database globally or use it as needed
        window.gunnerusDatabase = database;
      }).catch(error => {
        console.error('Error loading Gunnerus database:', error);
      });
      createGraphView();
      createMenus();
    input3DModels();
  }
  else
      {
      var dataBaseAddress = './data/versions/Simple/'
      var database2 = {};
      createDataBase(dataBaseAddress).then(database => {
        console.log('Database loaded:', database);
        database2 = database;
      }).catch(error => {
        console.error('Error loading Simple database:', error);
      });
      console.log(database2)
      createGraphView();
      createMenus();
  }

  async function createDataBase(dataBaseAddress)
  {
    try {
      // Get list of files in database directory
      const response = await fetch(dataBaseAddress);
      const html = await response.text();
      
      // Parse directory listing HTML to get file names
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const files = Array.from(doc.querySelectorAll('a'))
        .map(a => a.href)
        .filter(href => href.endsWith('.json'))
        .map(href => href.split('/').pop());
      
      console.log('Available data files:', files);
      
      var database = {};

      // Load all files concurrently using Promise.all
      const filePromises = files.map(async file => {
        try {
          const fileResponse = await fetch(dataBaseAddress + file);
          const data = await fileResponse.json();
          return { file, data };
        } catch (error) {
          console.error(`Error loading file ${file}:`, error);
          return { file, data: null };
        }
      });

      const fileResults = await Promise.all(filePromises);
      
      // Combine all data into a single database object
      fileResults.forEach(({ file, data }) => {
        if (data) {
          // Merge data into database object
          Object.assign(database, data);
        }
      });

      return database;
      
    } catch (error) {
      console.error('Error reading database directory:', error);
      return {};
    }
  }



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
    function createTreeNodes() {
      
      const root = {
        name: "Gunnerus",
        children: []
      };

      const root2 = {
        name: "Compartment",
        children: []
      };

      const root3 = {
        name: "Revisions",
        children: []
      };
      const root4 = {
        name: "GA Versions",
        children: []
      };
      const root5 = {
        name: "1463114",
        version: 1463114,
        children: []
      };
      
      const root6 = {
        name: "156821B6",
        version: 1568216,
        children: []
      };
      
      // Create main categories based on arrangement types
      const categories = new Set();
      Object.keys(arrangements).forEach(key => {
        const category = key.split('_')[0];
        categories.add(category);
      });

      root.children.push(root3)
      root3.children.push(root4)
      root4.children.push(root5)
      root5.children.push(root6)
      root.children.push(root2)
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
            'Accomodation1': 2,
            'EngineRoom': 2
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

          root2.children.push(arrangementNode);
        });
      });

      return root;
    }

    // Create cluster layout with the hierarchical data
    const cluster = d3.tree().size([height, width - 100]);


    const root = d3.hierarchy(createTreeNodes(), d => d.children);
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
      .attr("stroke", '#000')  // Red color for custom connections
      .attr("stroke-width", 1.5)

    // Create node groups
    const nodes = svg.selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", d => `translate(${d.y},${d.x})`);

    // Add rects to nodes (change to squares)
    nodes.append("rect")
      .attr("width", 40)  // Width of square
      .attr("height", 14) // Height of square
      .attr("x", -7)      // Center the square horizontally
      .attr("y", -7)      // Center the square vertically
      .style("fill", d => {
        // Change color if version is greater than 0
        if (d.data.version && d.data.version > 0) {
          return "#ff7f50"; // Coral color for version > 0
        }
        return d.name ? "#69b3a2" : "#404040";
      })
      .attr("stroke", "black")
      .style("stroke-width", 2)
      .on("click", showNodeDetails);

      //dragging is disabled for now
      /*
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged) 
        .on("end", dragended));*/

        
    
    //connectNodesByName("1463114", "CargoHold_r1")
    //connectNodesByName("1463114", "ControlRoom_r1")
    //connectNodesByName("1463114", "Accomodation1_r1")

    // Update node details function to show arrangement data
    function showNodeDetails(event, d) {
      event.stopPropagation();
      
      nodes.selectAll(".node-details")
        .style("display", "none");

      // Change color of clicked node
      d3.select(event.target)
        .style("fill", "#ff0000"); // Change to red when selected
      // Check if clicked node is a child of GA Versions
      const isGAVersionChild = d.parent && d.parent.data.name === "GA Versions";
      
      if (isGAVersionChild) {
        // Get all nodes with "r1" in their name
        nodes.selectAll("rect")
          .each(function(node) {
            if (node.data.name && node.data.name.includes("r1")) {
              handleVersionChange(node.data.name);
            }
          });
          
          return;
      }


      // Change other blocks to coral if they meet version condition
      /*
      d3.selectAll("rect")
        .filter(d => d.data.version && d.data.version > 0 && event.target !== this)
        .style("fill", "#ff7f50");
        */
      

      const detailsText = d3.select(event.target) //event.target.parentNodes
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


    function findTimeSeriesAndSelect(xPosition) {
      // Get all nodes
      const nodes = d3.selectAll("g");
      const errorMargin = 5;
      
      // Clear previous selections
      nodes.selectAll(".node-details")
        .style("display", "none");
      
      // Find and highlight nodes with similar x position
      nodes.each(function(d) {
        if (d) {  // Check if node data exists
          const nodeX = d.y;  // In D3 tree layout, x and y are swapped
          if (Math.abs(nodeX - xPosition) < errorMargin) {
            // Trigger showNodeDetails for matching nodes
            const event = new Event('click');
            event.stopPropagation = () => {};  // Mock stopPropagation
            showNodeDetails(event, d);
          }
        }
      });
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


    // Add this new function inside createGraphView
    function connectNodesByName(sourceName, targetName) {
      const nodes = root.descendants();
      const sourceNode = nodes.find(n => n.data.name === sourceName);
      const targetNode = nodes.find(n => n.data.name === targetName);
      
      if (!sourceNode || !targetNode) {
        console.error('One or both nodes not found:', sourceName, targetName);
        return;
      }

      // Add new path connecting the nodes
      svg.append('path')
        .attr("d", function() {
          return "M" + sourceNode.y + "," + sourceNode.x
            + "C" + (sourceNode.y + 50) + "," + sourceNode.x
            + " " + (targetNode.y - 50) + "," + targetNode.x
            + " " + targetNode.y + "," + targetNode.x;
        })
        .style("fill", 'none')
        .attr("stroke", '#000')  // Red color for custom connections
        .attr("stroke-width", 1.5)
        
    }

    // Make the function accessible outside createGraphView
    window.connectGraphNodes = function(sourceName, targetName) {
      connectNodesByName(sourceName, targetName);
    };

    // Add this new function inside createGraphView
    function addNewNode(nodeName, parentName, nodeData = {}) {
      // Find the parent node in the hierarchy
      const parentNode = root.descendants().find(n => n.data.name === parentName);
      
      if (!parentNode) {
        console.error('Parent node not found:', parentName);
        return;
      }

      // Create new node data
      const newNodeData = {
        name: nodeName,
        data: nodeData,
        children: []
      };

      // Add new node to parent's children
      if (!parentNode.data.children) {
        parentNode.data.children = [];
      }
      parentNode.data.children.push(newNodeData);

      // Recompute the layout
      cluster(root);

      // Remove existing visualization
      svg.selectAll('path').remove();
      svg.selectAll('g').remove();

      // Redraw links
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
        .attr("stroke", '#000')
        .attr("stroke-width", 1.5);

      // Redraw nodes
      const nodes = svg.selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);

      // Redraw rectangles
      nodes.append("rect")
        .attr("width", 40)
        .attr("height", 14)
        .attr("x", -7)
        .attr("y", -7)
        .style("fill", d => {
          if (d.data.version && d.data.version > 0) {
            return "#ff7f50";
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

      // Redraw labels
      nodes.append("text")
        .attr("dx", "-1.2em")
        .attr("dy", "1.5em")
        .text(d => d.data.name)
        .style("font-size", "12px")
        .style("font-family", "Arial");

      // Redraw detail containers
      nodes.append("text")
        .attr("class", "node-details")
        .attr("dx", "-1.2em")
        .attr("dy", "3em")
        .style("font-size", "10px")
        .style("font-family", "Arial")
        .style("fill", "#666")
        .style("display", "none");
    }

    // Make the function accessible outside createGraphView
    window.addGraphNode = function(nodeName, parentName, nodeData = {}) {
      addNewNode(nodeName, parentName, nodeData);
    };

    // Create a transparent rectangle that moves horizontally
    const timeSlider = svg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 50)  // Width of the vertical line
      .attr("height", height)  // Full height of the SVG
      .attr("fill", "#4CAF50")  // Green color
      .attr("opacity", 0.3)
      .attr("cursor", "ew-resize")  // Show horizontal resize cursor
      .call(d3.drag()
        .on("start", timeSliderDragStarted)
        .on("drag", timeSliderDragged)
        .on("end", timeSliderDragEnded));

    var timeValue=0;

    function timeSliderDragStarted(event) {
      d3.select(this).raise();  // Bring to front
      timeSlider.attr("opacity", 0.5);  // Make more visible while dragging
    }

    function timeSliderDragged(event) {
      // Constrain horizontal movement within SVG bounds
      const newX = Math.max(0, Math.min(width - 3, event.x));
      timeSlider.attr("x", newX);
      
      // Optional: Calculate and display time value based on position
      timeValue = (newX / width * 100).toFixed(1);
      // You could update a time display here if needed
      
      // Optional: Trigger any time-based updates to your 3D view
      updateTimeBasedView(timeValue, event.x);
    }

    function timeSliderDragEnded() {
      timeSlider.attr("opacity", 0.3);  // Restore original opacity
    }

    // Optional: Function to update 3D view based on time value
    function updateTimeBasedView(timeValue, x) {
      // Add your logic here to update the 3D view based on the time value
      console.log(`Time value: ${timeValue}%`);
      findTimeSeriesAndSelect(x);
    }

    // Optional: Add time labels
    svg.append("text")
      .attr("x", 10)
      .attr("y", height - 10)
      .text(`Time: ${timeValue}%`)
      .attr("class", "time-label");

    svg.append("text")
      .attr("x", width - 60)
      .attr("y", height - 10)
      .text("Time: 100%")
      .attr("class", "time-label");

    // Add these style rules to your CSS
    const style = document.createElement('style');
    style.textContent = `
      .time-label {
        font-size: 12px;
        font-family: Arial;
        fill: #666;
      }
    `;
    document.head.appendChild(style);

    // Make the timeSlider accessible to other functions if needed
    window.timeSlider = timeSlider;
  }

  function input3DModels(width = null, height = null, shiplength=150, midsection_mask_points = null, profile_mask_points = null) {
    const loader = new STLLoader();
    const modelPath = './3D_models/STL/Gunnerus/';
    
    // Log the dimensions if provided
    if (width && height) {
      console.log(`input3DModels called with dimensions: ${width} x ${height}`);
    }
    
    // Log mask points if provided
    if (midsection_mask_points) {
      console.log(`Mask points received: ${midsection_mask_points}`);
    }
    
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
                
                // If dimensions are provided, you can use them to scale or position the model
                if (midsection_mask_points) {                    
                    // Parse mask points: "x1,y1;x2,y2;x3,y3;..." format
                    const pointStrings = midsection_mask_points.split(';');
                    const points = [];
                    
                    for (const pointStr of pointStrings) {
                        const coords = pointStr.split(',').map(Number);
                        if (coords.length === 2) {
                            points.push([coords[0], coords[1]]);
                        }
                    }
                    if (profile_mask_points) {
                        const pointStrings = profile_mask_points.split(';');
                        const points2 = [];
                        
                        for (const pointStr of pointStrings) {
                            const coords = pointStr.split(',').map(Number);
                    
                        if (coords.length === 2) {
                            points2.push([coords[0], coords[1]]);
                        }
                    }
                  }
                    
                    
                    if (points.length >= 3) {
                        // Create a polyhedron from polygon points
                        const maskPolyhedron = createMaskPolyhedronFromPoints(points, profile_mask_points, shiplength);
                        scene.clear();
                        scene.add(maskPolyhedron);
                        objects.push(maskPolyhedron);
                        
                        console.log(`Created polyhedron from ${points.length} midsection points and ${profile_mask_points ? profile_mask_points.length : 0} profile points`);
                        
                        // Calculate Block Coefficient (Cb) after model is built
                        const cbResult = calculateBlockCoefficient(maskPolyhedron, shiplength, width, height);
                        displayCbResult(cbResult);
                    } else {
                        console.error('Invalid mask points format. Expected at least 3 points in format: "x1,y1;x2,y2;x3,y3;..."');
                    }
                }
                else if (width && height) {
                    // Example: scale model based on image dimensions
                    const scaleFactor = Math.min(width, height) / 1000; // Normalize to reasonable scale
                    mesh.scale.set(scaleFactor, width/1000, height/1000);
                    console.log(`Model scaled with factor: ${scaleFactor} based on image dimensions ${width} x ${height}`);
                    scene.clear();
                    const cube = makeCube(150, width/10, height/10, mesh.position, "red");
                    scene.add(cube);
                    objects.push(cube);
                }
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

  // Make input3DModels globally accessible
  window.input3DModels = input3DModels;

  function createMenus()
  {
    var playButton = document.createElement("button");
    playButton.innerHTML = "▷ Pipe Generation";
    playButton.style.color = "green";
    playButton.style.fontSize = "15px";
    document.getElementById("figure").appendChild(playButton);
    playButton.onclick = gaButtonClicked;


    var playButton2 = document.createElement("button");
    playButton2.innerHTML = "▷ Calculation";
    playButton2.style.color = "black";
    playButton2.style.fontSize = "15px";
    document.getElementById("menus").appendChild(playButton2);
    playButton2.onclick = calculationButtonClicked;

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
    if (!renderer) {
      console.error("Renderer not initialized");
      return;
    }

    try {
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
    } catch (error) {
      console.error("Error initializing controls:", error);
    }
  }

  function animate() {
    if (renderer && scene && camera) {
      try {
        renderer.render( scene, camera );
      } catch (error) {
        console.error("Error in animation loop:", error);
      }
    }
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
          { name: 'Accomodation1', versions: 2 },
          { name: 'EngineRoom', versions: 2 }
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

  function makeCube(length, width, height, position, color) {
    const geometry = new THREE.BoxGeometry(length, width, height);
    const material = new THREE.MeshBasicMaterial({color: color});
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(position.x, position.y, position.z);
    return cube;
  }


  function createMaskPolyhedronFromPoints(points, points2, length) {

    
    // Calculate center position from all points
    let centerX = 0, centerY = 0;
    for (const [x, y] of points) {
      centerX += x;
      centerY += y;
    }
    centerX /= points.length;
    centerY /= points.length;
    const centerZ = 0;
    
    
    // Create a shape from the polygon points
    const shape = new THREE.Shape();

    console.log(points);
    
    // Move to the first point
    shape.moveTo(points[0][0] - centerX, points[0][1] - centerY);
    
    // Add lines to all other points
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i][0] - centerX, points[i][1] - centerY);
    }
    
    // Close the shape
    shape.lineTo(points[0][0] - centerX, points[0][1] - centerY);
    
    // Create extruded geometry from the shape
    const extrudeSettings = {
      depth: length,
      bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Create a semi-transparent material with a distinct color
    const material = new THREE.MeshPhongMaterial({
      color: 0x00ff00, // Green color
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    
    // Create the mesh
    const polyhedron = new THREE.Mesh(geometry, material);
    
    // Position the polyhedron at the calculated center
    polyhedron.position.set(centerX, centerY, centerZ);
    
    // Add wireframe outline for better visibility
    const wireframeGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    wireframe.position.set(centerX, centerY, centerZ);
    
    // Group the solid polyhedron and wireframe together
    const group = new THREE.Group();
    group.add(polyhedron);
    group.add(wireframe);
    
    return group;
  }

  function handleVersionChange(fileName) {
      // Create the path to the version file
      //const filePath = `./data/versions/${fileName.replace(' ', '_')}_r${version}.json`;
      const filePath = `./data/versions/Gunnerus/${fileName}.json`;
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

  // Image pagination system
  window.imagePages = [];
  window.currentImagePage = 0;

  function initializeImagePagination() {
      // Add event listeners for image pagination buttons
      const prevButton = document.getElementById('prev');
      const nextButton = document.getElementById('next');
      
      if (prevButton) {
          prevButton.addEventListener('click', () => previousImagePage());
      }
      if (nextButton) {
          nextButton.addEventListener('click', () => nextImagePage());
      }
      
      updateImagePaginationDisplay();
  }

  // Make functions globally accessible
  window.initializeImagePagination = initializeImagePagination;
  window.addCurrentCanvasToPages = addCurrentCanvasToPages;
  window.addImageToPages = addImageToPages;
  window.previousImagePage = previousImagePage;
  window.nextImagePage = nextImagePage;
  window.displayImagePage = displayImagePage;
  window.updateImagePaginationDisplay = updateImagePaginationDisplay;

  function addCurrentCanvasToPages() {
      const canvas = document.getElementById('the-canvas');
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
          return;
      }

      // Get current canvas content as data URL
      const dataURL = canvas.toDataURL('image/png');
      
      // Add to pages if not already there
      if (imagePages.length === 0 || 
          imagePages[imagePages.length - 1].dataURL !== dataURL) {
          imagePages.push({
              type: 'canvas',
              dataURL: dataURL,
              width: canvas.width,
              height: canvas.height,
              timestamp: Date.now()
          });
          currentImagePage = imagePages.length - 1;
          updateImagePaginationDisplay();
          console.log(`Added canvas page: ${canvas.width}x${canvas.height}`);
      }
  }

  function addImageToPages(type, data, width, height) {
      let pageData;
      
      if (type === 'base64') {
          pageData = {
              type: 'base64',
              data: data,
              width: width,
              height: height,
              timestamp: Date.now()
          };
      } else if (type === 'file') {
          pageData = {
              type: 'file',
              file: data,
              width: width,
              height: height,
              timestamp: Date.now()
          };
      }

      if (pageData) {
          imagePages.push(pageData);
          currentImagePage = imagePages.length - 1;
          updateImagePaginationDisplay();
      }
  }

  function previousImagePage() {
      if (currentImagePage > 0) {
          currentImagePage--;
          displayImagePage(currentImagePage);
      }
  }

  function nextImagePage() {
      if (currentImagePage < imagePages.length - 1) {
          currentImagePage++;
          displayImagePage(currentImagePage);
      }
  }

  function displayImagePage(pageIndex) {
      if (pageIndex < 0 || pageIndex >= imagePages.length) {
          return;
      }

      const canvas = document.getElementById('the-canvas');
      if (!canvas) {
          return;
      }

      const page = imagePages[pageIndex];
      const ctx = canvas.getContext('2d');

      // Function to calculate scaled dimensions while maintaining aspect ratio
      function calculateScaledDimensions(originalWidth, originalHeight, maxWidth = 800, maxHeight = 600) {
          let { width, height } = { width: originalWidth, height: originalHeight };
          
          // Scale down if image is too large
          if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = width * ratio;
              height = height * ratio;
          }
          
          return { width, height };
      }

      // Function to display image with proper scaling
      function displayImage(img, originalWidth, originalHeight) {
          const { width, height } = calculateScaledDimensions(originalWidth, originalHeight);
          
          // Set canvas size to match the scaled image dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Clear canvas and draw the image
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, width, height);
          
          console.log(`Displaying image: ${width}x${height} (original: ${originalWidth}x${originalHeight})`);
      }

      if (page.type === 'canvas') {
          // Display canvas data URL
          const img = new Image();
          img.onload = () => {
              displayImage(img, page.width, page.height);
          };
          img.src = page.dataURL;
      } else if (page.type === 'base64') {
          // Display base64 data
          const img = new Image();
          img.onload = () => {
              displayImage(img, page.width, page.height);
          };
          img.src = 'data:image/png;base64,' + page.data;
      } else if (page.type === 'file') {
          // Display file data
          const img = new Image();
          img.onload = () => {
              displayImage(img, page.width, page.height);
          };
          const objectURL = URL.createObjectURL(page.file);
          img.src = objectURL;
      }

      updateImagePaginationDisplay();
  }

  function updateImagePaginationDisplay() {
      const pageNumElement = document.getElementById('page_num');
      const pageCountElement = document.getElementById('page_count');
      const prevButton = document.getElementById('prev');
      const nextButton = document.getElementById('next');

      if (pageNumElement) {
          pageNumElement.textContent = imagePages.length > 0 ? currentImagePage + 1 : 0;
      }
      if (pageCountElement) {
          pageCountElement.textContent = imagePages.length;
      }
      if (prevButton) {
          prevButton.disabled = currentImagePage <= 0;
      }
      if (nextButton) {
          nextButton.disabled = currentImagePage >= imagePages.length - 1;
      }

      // Update page info display
      if (imagePages.length > 0 && currentImagePage >= 0 && currentImagePage < imagePages.length) {
          const currentPage = imagePages[currentImagePage];
          console.log(`Current page: ${currentImagePage + 1}/${imagePages.length} - Size: ${currentPage.width}x${currentPage.height}`);
      }
  }

  // Initialize image pagination when the page loads
  initializeImagePagination();
      
}

