
    var levelWidth = 10;
    var levelHeight = 10;
    var graph;
    var astar = new AStar();
    var options = {diagonal: false, heuristic: "euclidean", animate: "true", heightFactor: 0.5};
    var showPathInfo = false;
    var levelJson;
    var graphOptions = {random: false, fullRandom: false, wallPercentage: 0};
    var testStartDimension = 10;
    var testEndDimension = 15;

    init();

    function pathfinding() {
        var startTime = new Date();
        var result = astar.process(graph.node, graph.startNode, graph.endNode, options);
        var endTime = new Date();

        result.time = endTime-startTime;

        //console.log("Time: " + result.time + " ms");
        analysis(result);
        
        return result;
        
    }

    function pathfinding(graph) {
        var startTime = new Date();
        var result = astar.process(graph.node, graph.startNode, graph.endNode, graphOptions);
        var endTime = new Date();

        result.time = endTime-startTime;

        //console.log("Time: " + result.time + " ms");
        //analysis(result);
        
        graph.printPath(result.path);

        /*
        $("#pathLength").html("path length: " + result.path.length + "<br/>");
        $("#traversedNodes").html("traversed Nodes: " + result.traversedNodes + "<br/>");
        $("#time").html("time: " + result.time + " ms" + "<br/>");
        */
        
        return result;
        
    }
    function analysis(result) {
        if (showPathInfo)
            graph.showPathInfo(result.path);
        
        graph.printPath(result.path);

        $("#pathLength").html("path length: " + result.path.length + "<br/>");
        $("#traversedNodes").html("traversed Nodes: " + result.traversedNodes + "<br/>");
        $("#time").html("time: " + result.time + " ms" + "<br/>");
    }

    function init() {

        
        var levelWidth = 10;
        var levelHeight = 10;
        var graph;
        var astar;
        var options = {diagonal: false, heuristic: "euclidean", animate: "true", heightFactor: 0.5};
        var showPathInfo = false;
        var levelJson;
        var graphOptions = {random: false, fullRandom: false, wallPercentage: 0};
        var testStartDimension = 10;
        var testEndDimension = 15;

        graph = new Graph();
        graph.init();
        //graph.generate(levelWidth,levelHeight);
        //graph.printGraph();
        graphOptions.random = false;
        astar = new AStar();
        console.log("init");

    }


    function runSpecifiedTests(){
        var warmup = 20;
        var repetitions = 50;
        var result;
        var timeAverage;
        var test = $("#test");

        var testResults = "";

        console.log("running specified test...");

        for (var i=0; i<graph.testEndNodes.length; i++) {
            levelWidth = i;
            levelHeight = i;
            console.log("path to: " + graph.testEndNodes[i].x + " "
                                    + graph.testEndNodes[i].y + " "
                                    + graph.testEndNodes[i].z + " ");

            //generate level and test if path exists
            console.log("testing level...");
            graph.clear();
            graph.startNode = graph.startNode;
            graph.endNode = graph.testEndNodes[i];
            result = pathfinding();

            if (result.path.length != 0){
                timeAverage = 0;
                for (var j=0; j<repetitions+warmup; j++) {
                    //console.log("repetition " + j);
                    graph.clear();
                    result = pathfinding();

                    if (j > warmup-1) {
                        timeAverage += result.time;
                    }
                }
                timeAverage = timeAverage/repetitions;
                console.log("path length: " + result.path.length);
                console.log("traversed elements: " + result.traversedNodes);
                console.log("average time: " + timeAverage);
                //test.append(result.traversedNodes + "    " + timeAverage + "\n");
                testResults += result.path.length + "\t" + result.traversedNodes + "\t" + timeAverage + "\r\n";
            } else {
                console.log("skipping node, not accessable")
            }
        }
        console.log("TESTRESULTS:\n" + testResults);
    }

    function runTestsOnCurrentLevel() {
        var warmup = 20;
        var startDimension = testStartDimension;
        var endDimension = testEndDimension;
        var repetitions = 50;
        var result;
        var timeAverage;
        var test = $("#test");

        var testEvery = 5;
        var testResults = "";

        graph.startNode = graph.node[0][0][graph.leftLowerCornerHeight];

        for (var i=0; i<levelWidth; i+=testEvery) {
            //get height
            for (var h = 15; h>=0; h--){
                if (graph.node[i][i][h]) {
                    graph.endNode = graph.node[i][i][h];
                    break;
                }
            }
            console.log(graph.endNode);
            graph.clear();
            result = pathfinding();
            console.log(result.path);
            if (result.path.length !== 0){
                console.log("testing node[" + i + "][" + i + "][" + graph.endNode.z + "]");

                timeAverage = 0;
                for (var j=0; j<repetitions+warmup; j++) {
                    //console.log("repetition " + j);
                    graph.clear();
                    result = pathfinding();

                    if (j > warmup-1) {
                        timeAverage += result.time;
                    }
                }
                timeAverage = timeAverage/repetitions;
                console.log("path length: " + result.path.length);
                console.log("traversed elements: " + result.traversedNodes);
                console.log("average time: " + timeAverage);
                //test.append(result.traversedNodes + "    " + timeAverage + "\n");
                testResults += result.path.length + "\t" + result.traversedNodes + "\t" + timeAverage + "\r\n";
            }
        }
        console.log("TESTRESULTS:\n" + testResults);
    }

    function runTests() {
        var warmup = 20;
        var startDimension = testStartDimension;
        var endDimension = testEndDimension;
        var repetitions = 50;
        var result;
        var timeAverage;
        var test = $("#test");

        var testEvery = 5;
        var testResults = "";

        for (var i=startDimension; i<=endDimension; i+=testEvery) {
            levelWidth = i;
            levelHeight = i;
            console.log(i + "x" + i + " Level:");

            //generate level and test if path exists
            do {
                console.log("generating level...");
                graph.clear();
                graph.generateLevel(levelWidth, levelHeight, graphOptions);
                graph.startNode = graph.node[0][0][graph.leftLowerCornerHeight];
                graph.endNode = graph.node[i-1][i-1][graph.rightUpperCornerHeight];
                result = pathfinding();

                if (result.path.length === 0) {
                    graph.startNode = graph.node[i-1][0][graph.leftUpperCornerHeight];
                    graph.endNode = graph.node[0][i-1][graph.rightLowerCornerHeight];
                    result = pathfinding(); 
                }
            } while (result.path.length === 0);

            timeAverage = 0;
            for (var j=0; j<repetitions+warmup; j++) {
                //console.log("repetition " + j);
                graph.clear();
                result = pathfinding();

                if (j > warmup-1) {
                    timeAverage += result.time;
                }
            }
            timeAverage = timeAverage/repetitions;
            console.log("path length: " + result.path.length);
            console.log("traversed elements: " + result.traversedNodes);
            console.log("average time: " + timeAverage);
            //test.append(result.traversedNodes + "    " + timeAverage + "\n");
            testResults += result.path.length + "\t" + result.traversedNodes + "\t" + timeAverage + "\r\n";

        }
        console.log("TESTRESULTS:\n" + testResults);
    }



 function runPipes(start_x, start_y, start_z, end_x, end_y, end_z) {
    var result;
    var levelWidth = 10;
    var levelHeight = 10;
    var graph;
    var astar;
    var options = {diagonal: false, heuristic: "euclidean", animate: "true", heightFactor: 0.5};
    var showPathInfo = false;
    var levelJson;
    var graphOptions = {random: false, fullRandom: false, wallPercentage: 0};
    var testStartDimension = 10;
    var testEndDimension = 15;
    var gridSpace = 1;

    graph = new Graph();
    graph.init();
    //graph.generate(levelWidth,levelHeight);
    //graph.printGraph();
    graphOptions.random = false;
    astar = new AStar();

    
    console.log(start_x, start_y, start_z, end_x, end_y, end_z);

    var length = Math.max(1,Math.floor(Math.abs(end_x-start_x)));
    var width = Math.max(1,Math.floor(Math.abs(end_y-start_y)));
    var height = Math.max(1,Math.floor(Math.abs(end_z-start_z)));
    graph.clear();
    graph.generateGrid(length, width, height, graphOptions, gridSpace);
    
    graph.startNode = graph.node[0][0][0];
    graph.endNode = graph.node[length-1][width-1][height-1];

    console.log(graph);

    result = pathfinding(graph);

    
    //Add length to x, width to y, height to z for result.path
    for (var i = 0; i < result.path.length; i++) {
        result.path[i].x = result.path[i].x + Math.min(start_x, end_x);
        result.path[i].y = result.path[i].y + Math.min(start_y, end_y);
        result.path[i].z = result.path[i].z + Math.min(start_z, end_z);
    }

    console.log("path length: " + result.path.length);
    console.log("traversed elements: " + result.traversedNodes);
    console.log("average time: " + result.time);

    return result;

    
}
function $(id) {
    return document.getElementById(id);
  }