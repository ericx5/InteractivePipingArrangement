export class TreeCalculator {
  constructor(arrangements) {
    this.arrangements = arrangements;
    this.treeData = null;
    this.timestamps = [];
  }
  
  updateArrangements(arrangements) {
    this.arrangements = arrangements;
    this.treeData = null; // Reset cached data
  }
  
  // Create hierarchical data structure from Gunnerus data
  createTreeNodes() {
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
      name: "1463114",
      version: 1463114,
      children: []
    };
    
    // Create main categories based on arrangement types
    const categories = new Set();
    Object.keys(this.arrangements).forEach(key => {
      const category = key.split('_')[0];
      categories.add(category);
    });

    root.children.push(root3);
    root3.children.push(root4);
    root.children.push(root2);
    
    // Create hierarchy structure
    categories.forEach(category => {
      // Add arrangement nodes
      const versionFiles = Object.keys(this.arrangements).filter(key => key.startsWith(category));
      versionFiles.forEach(file => {
        const arrangementNode = {
          name: file,
          data: this.arrangements[file],
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
              name: `${this.arrangements[file].Name}_r${i}`,
              data: this.arrangements[file],
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

    this.treeData = root;
    return root;
  }
  
  // Get tree data, creating it if needed
  getTreeData() {
    if (!this.treeData) {
      this.createTreeNodes();
    }
    return this.treeData;
  }
  
  // Load timestamps from version files
  async loadTimestampsFromVersions() {
    // This will store our timestamp data
    const timestamps = [];
    
    // Define the files to check
    const versionFiles = [
      './data/versions/CargoHold.json',
      './data/versions/ControlRoom.json',
      './data/versions/Accomodation1.json'
    ];
    
    // Create promises for all file fetches
    const fetchPromises = versionFiles.map(file => 
      fetch(file)
        .then(response => response.json())
        .catch(error => {
          console.error(`Error loading ${file}:`, error);
          return null;
        })
    );
    
    // Process all fetched data
    const results = await Promise.all(fetchPromises);
    results.forEach((data, index) => {
      if (data && data.timestamp) {
        timestamps.push({
          file: versionFiles[index].split('/').pop().replace('.json', ''),
          timestamp: new Date(data.timestamp)
        });
      }
    });
    
    // Sort timestamps chronologically
    timestamps.sort((a, b) => a.timestamp - b.timestamp);
    
    this.timestamps = timestamps;
    return timestamps;
  }
  
  // Get unique dates from timestamps
  getUniqueDates() {
    return [...new Set(this.timestamps.map(item => 
      item.timestamp.toISOString().split('T')[0]
    ))].sort();
  }
  
  // Get unique components from timestamps
  getUniqueComponents() {
    return [...new Set(this.timestamps.map(item => item.file))];
  }
} 