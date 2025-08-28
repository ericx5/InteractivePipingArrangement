export class Visualizer {
  constructor(treeCalculator, containerId) {
    this.treeCalculator = treeCalculator;
    this.containerId = containerId;
    this.width = 800;
    this.height = 800;
    this.svg = null;
  }
  
  // Initialize the SVG container
  initSvg() {
    if (this.svg) return;
    
    this.svg = d3.select(`#${this.containerId}`)
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("transform", "translate(40,0)");
  }
  
  // Create the timeline table
  async createTimelineTable() {
    // Load timestamps first
    await this.treeCalculator.loadTimestampsFromVersions();
    
    // Create a container for the table
    const tableContainer = d3.select(`#${this.containerId}`)
      .append("div")
      .attr("class", "timeline-table-container")
      .style("margin-bottom", "20px")
      .style("overflow-x", "auto");
    
    // Create the table element
    const table = tableContainer.append("table")
      .attr("class", "timeline-table")
      .style("border-collapse", "collapse")
      .style("width", "100%");
    
    // Add table header
    const thead = table.append("thead");
    const headerRow = thead.append("tr");
    
    // Add header cells
    headerRow.append("th")
      .text("Component")
      .style("padding", "8px")
      .style("border", "1px solid #ddd")
      .style("background-color", "#f2f2f2");
    
    // Get unique dates and components
    const allDates = this.treeCalculator.getUniqueDates();
    const components = this.treeCalculator.getUniqueComponents();
    
    // Add date columns to header
    allDates.forEach(date => {
      headerRow.append("th")
        .text(new Date(date).toLocaleDateString())
        .style("padding", "8px")
        .style("border", "1px solid #ddd")
        .style("background-color", "#f2f2f2");
    });
    
    // Add table body
    const tbody = table.append("tbody");
    
    // Create a row for each component
    components.forEach(component => {
      const row = tbody.append("tr");
      
      // Add component name cell
      row.append("td")
        .text(component)
        .style("padding", "8px")
        .style("border", "1px solid #ddd")
        .style("font-weight", "bold");
      
      // Add cells for each date
      allDates.forEach(date => {
        // Check if this component has a version on this date
        const versionOnDate = this.treeCalculator.timestamps.find(item => 
          item.file === component && 
          item.timestamp.toISOString().split('T')[0] === date
        );
        
        const cell = row.append("td")
          .style("padding", "8px")
          .style("border", "1px solid #ddd")
          .style("text-align", "center");
        
        if (versionOnDate) {
          // Add a version marker and make it clickable
          cell.append("div")
            .style("width", "20px")
            .style("height", "20px")
            .style("background-color", "#69b3a2")
            .style("border-radius", "50%")
            .style("margin", "0 auto")
            .style("cursor", "pointer")
            .on("click", () => {
              // When clicked, load this version
              window.handleVersionChange(component);
              
              // Highlight the selected cell
              d3.selectAll(".timeline-table td div")
                .style("background-color", "#69b3a2");
              
              d3.select(d3.event.currentTarget)
                .style("background-color", "#ff7f50");
            });
        }
      });
    });
  }
  
  // Create the hierarchical graph
  createHierarchicalGraph() {
    this.initSvg();
    
    // Get tree data from calculator
    const treeData = this.treeCalculator.getTreeData();
    
    // Create cluster layout
    const cluster = d3.tree().size([this.height, this.width - 100]);
    
    // Create hierarchy
    const root = d3.hierarchy(treeData, d => d.children);
    cluster(root);
    
    // Add links between nodes
    this.svg.selectAll('path')
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
    
    // Create node groups
    const nodes = this.svg.selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", d => `translate(${d.y},${d.x})`);
    
    // Add rects to nodes
    nodes.append("rect")
      .attr("width", 40)
      .attr("height", 14)
      .attr("x", -7)
      .attr("y", -7)
      .style("fill", d => {
        if (d.data.version && d.data.version > 0) {
          return "#ff7f50";
        }
        return d.data.name ? "#69b3a2" : "#404040";
      })
      .attr("stroke", "black")
      .style("stroke-width", 2)
      .on("click", this.showNodeDetails.bind(this))
      .call(d3.drag()
        .on("start", this.dragstarted.bind(this))
        .on("drag", this.dragged.bind(this))
        .on("end", this.dragended.bind(this)));
    
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
    
    // Connect specific nodes
    this.connectNodesByName("1463114", "Accomodation1_r1");
    
    // Create time slider
    this.createTimeSlider(root);
  }
  
  // Create the complete graph view
  async createGraphView() {
    // First create the timeline table
    await this.createTimelineTable();
    
    // Then create the hierarchical graph
    this.createHierarchicalGraph();
  }
  
  // Refresh the visualization
  refreshView() {
    // Clear existing visualization
    d3.select(`#${this.containerId}`).html("");
    
    // Recreate the visualization
    this.svg = null;
    this.createGraphView();
  }
  
  // Node details display
  showNodeDetails(event, d) {
    event.stopPropagation();
    
    this.svg.selectAll(".node-details")
      .style("display", "none");
    
    // Change color of clicked node
    d3.select(event.target)
      .style("fill", "#ff0000");
    
    const detailsText = d3.select(event.target)
      .select(".node-details")
      .style("display", "block");
    
    if (d.data.data) {
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
    
    window.handleVersionChange(d.data.name);
  }
  
  // Drag functions
  dragstarted(event, d) {
    event.sourceEvent.stopPropagation();
    d3.select(this).raise().classed("active", true);
  }
  
  dragged(event, d) {
    d.x = event.y;
    d.y = event.x;
    
    const node = d3.select(this.parentNode);
    node.attr("transform", `translate(${d.y},${d.x})`);
    
    // Update connected paths
    this.svg.selectAll('path')
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
  
  dragended(event, d) {
    d3.select(this).classed("active", false);
  }
  
  // Connect nodes by name
  connectNodesByName(sourceName, targetName) {
    const nodes = d3.hierarchy(this.treeCalculator.getTreeData()).descendants();
    const sourceNode = nodes.find(n => n.data.name === sourceName);
    const targetNode = nodes.find(n => n.data.name === targetName);
    
    if (!sourceNode || !targetNode) {
      console.error('One or both nodes not found:', sourceName, targetName);
      return;
    }
    
    // Add new path connecting the nodes
    this.svg.append('path')
      .attr("d", function() {
        return "M" + sourceNode.y + "," + sourceNode.x
          + "C" + (sourceNode.y + 50) + "," + sourceNode.x
          + " " + (targetNode.y - 50) + "," + targetNode.x
          + " " + targetNode.y + "," + targetNode.x;
      })
      .style("fill", 'none')
      .attr("stroke", '#000')
      .attr("stroke-width", 1.5);
  }
  
  // Create time slider
  createTimeSlider(root) {
    // Create a transparent rectangle that moves horizontally
    const timeSlider = this.svg.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 50)
      .attr("height", this.height)
      .attr("fill", "#4CAF50")
      .attr("opacity", 0.3)
      .attr("cursor", "ew-resize")
      .call(d3.drag()
        .on("start", this.timeSliderDragStarted.bind(this))
        .on("drag", this.timeSliderDragged.bind(this))
        .on("end", this.timeSliderDragEnded.bind(this)));
    
    this.timeValue = 0;
    this.timeSlider = timeSlider;
    
    // Add time labels
    this.svg.append("text")
      .attr("x", 10)
      .attr("y", this.height - 10)
      .text(`Time: ${this.timeValue}%`)
      .attr("class", "time-label");
    
    this.svg.append("text")
      .attr("x", this.width - 60)
      .attr("y", this.height - 10)
      .text("Time: 100%")
      .attr("class", "time-label");
  }
  
  // Time slider drag functions
  timeSliderDragStarted(event) {
    d3.select(this.timeSlider).raise();
    this.timeSlider.attr("opacity", 0.5);
  }
  
  timeSliderDragged(event) {
    const newX = Math.max(0, Math.min(this.width - 3, event.x));
    this.timeSlider.attr("x", newX);
    
    this.timeValue = (newX / this.width * 100).toFixed(1);
    
    this.updateTimeBasedView(this.timeValue, event.x);
  }
  
  timeSliderDragEnded() {
    this.timeSlider.attr("opacity", 0.3);
  }
  
  // Update view based on time
  updateTimeBasedView(timeValue, x) {
    console.log(`Time value: ${timeValue}%`);
    this.findTimeSeriesAndSelect(x);
  }
  
  // Find and select nodes at a specific x position
  findTimeSeriesAndSelect(xPosition) {
    const nodes = this.svg.selectAll("g");
    const errorMargin = 5;
    
    nodes.selectAll(".node-details")
      .style("display", "none");
    
    nodes.each(function(d) {
      if (d) {
        const nodeX = d.y;
        if (Math.abs(nodeX - xPosition) < errorMargin) {
          const event = new Event('click');
          event.stopPropagation = () => {};
          this.showNodeDetails(event, d);
        }
      }
    }.bind(this));
  }
} 