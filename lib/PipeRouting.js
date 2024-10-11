import {GridPos} from "./GridPos.js";
import {StaticGrid} from "./StaticGrid.js";
import {AStarParam, AStarFinder, DiagonalMovement} from "./AStarFinder.js";
import { Heuristic, HeuristicMode } from "./Heuristic.js";

export class PipeRouting {
    constructor() {
        this.DynamicCoeff = 1; // Assuming DynamicCoeff is initialized somewhere in the class
        this._dynamicMatrix = []; // Initialize with your actual dynamic matrix
    }

    async RapidPipeRoutingStart(equipmentsList, startPoint, endPoint, visualization = false, dynamiCoeff = 1) {
        let tempMatrix = this._dynamicMatrix;

        // Initialize variables
        let sumNumofBend = 0;
        let pipeLength = 0;

        
        this.DynamicCoeff = dynamiCoeff;
        tempMatrix = CreateLimitedArea(startPoint, endPoint, equipmentsList, this.DynamicCoeff);

        const originPoint = new GridPos(
            Math.min(startPoint.x, endPoint.x),
            Math.min(startPoint.y, endPoint.y),
            Math.min(startPoint.z, endPoint.z)
        );
        const newStartPoint = new GridPos(
            (startPoint.x - originPoint.x) / this.DynamicCoeff,
            (startPoint.y - originPoint.y) / this.DynamicCoeff,
            (startPoint.z - originPoint.z) / this.DynamicCoeff
        );
        const newEndPoint = new GridPos(
            (endPoint.x - originPoint.x) / this.DynamicCoeff,
            (endPoint.y - originPoint.y) / this.DynamicCoeff,
            (endPoint.z - originPoint.z) / this.DynamicCoeff
        );

        const width = tempMatrix.length;
        const length = tempMatrix[0].length;
        const height = tempMatrix[0][0].length;

        const dynamicResultPathList = [startPoint];

        // Dynamic grid adjustment
        let searchGrid2 = new StaticGrid(width, length, height, tempMatrix);
        const startPos2 = newStartPoint;
        const endPos2 = newEndPoint;

        // Adjust walkable points
        searchGrid2.setWalkableAtPos(startPos2, true);
        searchGrid2.setWalkableAtPos(endPos2, true);
        

        //const jpParam2 = new JumpPointParam(searchGrid2, startPos2, endPos2, EndNodeUnWalkableTreatment.ALLOW, DiagonalMovement.Never, HeuristicMode.EUCLIDEAN);
        const aStarParam = new AStarParam(searchGrid2, startPos2, endPos2, 0.4, DiagonalMovement.Never, HeuristicMode.EUCLIDEAN);
        //const resultPathList = JumpPointFinder.findPath_SYD(jpParam2);
        const resultPathList = AStarFinder.findPathSYD(aStarParam);


        // Expand/modify result path and reset MovableMatrix
        const modifiedResultPathList = resultPathList.map(pos => {
            return new GridPos(
                pos.x * this.DynamicCoeff + originPoint.x,
                pos.y * this.DynamicCoeff + originPoint.y,
                pos.z * this.DynamicCoeff + originPoint.z
            );
        });

        for (let i = 0; i < modifiedResultPathList.length - 1; i++) {
            const resultPathList2 = [];

            // Recalculate if space availability is below threshold
            const DynamicGridThreshold = 20;

            if (false) { // Replace with your condition
                this.DynamicCoeff = 1;

                const startPos = new GridPos(modifiedResultPathList[i].x, modifiedResultPathList[i].y, modifiedResultPathList[i].z);
                const endPos = new GridPos(modifiedResultPathList[i + 1].x, modifiedResultPathList[i + 1].y, modifiedResultPathList[i + 1].z);

                tempMatrix = this.CreateLimitedArea(startPos, endPos, equipmentsList, this.DynamicCoeff);

                const newOriginPoint = new GridPos(
                    Math.min(startPos.x, endPos.x),
                    Math.min(startPos.y, endPos.y),
                    Math.min(startPos.z, endPos.z)
                );

                const newStartPoint = new GridPos(
                    (startPos.x - newOriginPoint.x) / this.DynamicCoeff,
                    (startPos.y - newOriginPoint.y) / this.DynamicCoeff,
                    (startPos.z - newOriginPoint.z) / this.DynamicCoeff
                );
                const newEndPoint = new GridPos(
                    (endPos.x - newOriginPoint.x) / this.DynamicCoeff,
                    (endPos.y - newOriginPoint.y) / this.DynamicCoeff,
                    (endPos.z - newOriginPoint.z) / this.DynamicCoeff
                );

                const width = tempMatrix.length;
                const length = tempMatrix[0].length;
                const height = tempMatrix[0][0].length;

                searchGrid2 = new StaticGrid(width, length, height, tempMatrix);
                const startPos2 = newStartPoint;
                const endPos2 = newEndPoint;

                const searchGrid3 = new StaticGrid(tempMatrix.length, tempMatrix[0].length, tempMatrix[0][0].length, tempMatrix);
                searchGrid3.setWalkableAtPos(startPos2, true);
                searchGrid3.setWalkableAtPos(endPos2, true);

                const jpParam3 = new JumpPointParam(searchGrid3, startPos2, endPos2, EndNodeUnWalkableTreatment.ALLOW, DiagonalMovement.Never, HeuristicMode.EUCLIDEAN);
                const aStarParam3 = new AStarParam(searchGrid3, startPos2, endPos2, 0.3, DiagonalMovement.Never, HeuristicMode.EUCLIDEAN);
                
                resultPathList2.push(...JumpPointFinder.findPath_SYD(jpParam3));
                
                ModelManager.getInstance().processResultPath(resultPathList2, tempMatrix); // Prevent duplicate paths
            } else {
                // Test case visualization
                this.DynamicCoeff = 1;
                resultPathList2.push(modifiedResultPathList[i]);
            }

            resultPathList2.forEach(pos => dynamicResultPathList.push(pos));
        }

        dynamicResultPathList.push(endPoint[j]);

        // Visualization
        if (visualization) {
            const modelManager = ModelManager.getInstance();
            modelManager.ResultPathList.push(dynamicResultPathList);
            modelManager.createPipeLine(dynamicResultPathList, Colors.Red, 0.5); // Add nodes to pipeline and create pipe
        }

        const xoutFile2 = new StreamWriter("PipeNodes_expert.txt", { flags: 'a', encoding: 'utf8' });
        
        let avgFeasibilityIndex = 0;
        let avgSpaceAvailability = 0;
        let avgPressureDrop = 0;

        for (const pos of dynamicResultPathList) {
            avgFeasibilityIndex += pos.FeasibilityIndex;
            avgSpaceAvailability += pos.SpaceAvailability;
            avgPressureDrop += pos.PressureDrop;
        }

        sumNumofBend += dynamicResultPathList[dynamicResultPathList.length - 2].NumofBend;
        avgFeasibilityIndex /= dynamicResultPathList.length;
        avgSpaceAvailability /= dynamicResultPathList.length;
        avgPressureDrop /= dynamicResultPathList.length;
        pipeLength += dynamicResultPathList.length * this.DynamicCoeff;

        console.log(pipeLength, sumNumofBend, avgFeasibilityIndex, avgSpaceAvailability, avgPressureDrop);
        xoutFile2.close();
        

        return [pipeLength, sumNumofBend];
    }
}

function FindNearestWall(startPoint, endPoint) {
    const centerPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        y: (startPoint.y + endPoint.y) / 2,
        z: (startPoint.z + endPoint.z) / 2
    };

    let minimumDistance = Number.MAX_SAFE_INTEGER;

    const erzVariable = [0, 0,0];
    
    // Find the minimum distance to a wall along the z-axis
    for (let i = 0; i < erzVariable.length; i++) {
        let distance = Math.abs(centerPoint.z - erzVariable[i]);
        if (distance < minimumDistance) {
            minimumDistance = distance;
        }
    }

    let wallGridPos = { x: 0, y: 0, z: minimumDistance };

    // Check distances along the y-axis
    /*
    if (Math.abs(centerPoint.y - MovableMatrixLength) < minimumDistance) {
        minimumDistance = Math.abs(centerPoint.y - MovableMatrixLength);
        wallGridPos = { x: 0, y: minimumDistance, z: 0 };
    } else if (Math.abs(centerPoint.y) < minimumDistance) {
        minimumDistance = Math.abs(centerPoint.y);
        wallGridPos = { x: 0, y: minimumDistance, z: 0 };
    }
    */
    return wallGridPos;
}

function CreateLimitedArea(startPoint, endPoint, equipments, dynamicCoeff) {
    const margin = 10;
    const nearestWall = FindNearestWall(startPoint, endPoint);

    const width = Math.max(Math.abs(startPoint.x - endPoint.x) / dynamicCoeff + margin, nearestWall.x);
    const length = Math.max(Math.abs(startPoint.y - endPoint.y) / dynamicCoeff + margin, nearestWall.y);
    const height = Math.max(Math.abs(startPoint.z - endPoint.z) / dynamicCoeff + margin, nearestWall.z);
    
    let tempMatrix = new Array(~~width);

    const originPoint = {
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        z: Math.min(startPoint.z, endPoint.z)
    };

    for (let widthTrav = 0; widthTrav < width; widthTrav++) {
        tempMatrix[widthTrav] = new Array(~~length);
        for (let lengthTrav = 0; lengthTrav < length; lengthTrav++) {
            tempMatrix[widthTrav][lengthTrav] = new Array(~~height).fill(true);
        }
    }

    var dynamicEquipments = [];

    for (let i = 0; i < equipments.length; i++) {
        if (ModelManager.GetInstance().CheckExposedtoEquipment(startPoint, equipments[i]) ||
            ModelManager.GetInstance().CheckExposedtoEquipment(endPoint, equipments[i])) {
            continue;
        }

        let newEquipment = Object.assign({}, equipments[i]);
        dynamicEquipments.push(newEquipment);

        let lastEquipment = dynamicEquipments[dynamicEquipments.length - 1];
        lastEquipment.MinX = (equipments[i].MinX - originPoint.x) / dynamicCoeff;
        lastEquipment.MaxX = (equipments[i].MaxX - originPoint.x) / dynamicCoeff;
        lastEquipment.MinY = (equipments[i].MinY - originPoint.y) / dynamicCoeff;
        lastEquipment.MaxY = (equipments[i].MaxY - originPoint.y) / dynamicCoeff;
        lastEquipment.MinZ = (equipments[i].MinZ - originPoint.z) / dynamicCoeff;
        lastEquipment.MaxZ = (equipments[i].MaxZ - originPoint.z) / dynamicCoeff;

        for (let widthTrav = Math.max(0, Math.floor(lastEquipment.MinX)); widthTrav < Math.min(width, lastEquipment.MaxX); widthTrav++) {
            for (let lengthTrav = Math.max(0, Math.floor(lastEquipment.MinY)); lengthTrav < Math.min(length, lastEquipment.MaxY); lengthTrav++) {
                for (let heightTrav = Math.max(0, Math.floor(lastEquipment.MinZ)); heightTrav < Math.min(height, lastEquipment.MaxZ); heightTrav++) {
                    tempMatrix[widthTrav][lengthTrav][heightTrav] = false;
                }
            }
        }
    }

    return tempMatrix;
}

function GetPipeSpaceAvailability(neighbor, PathListList) {
    const distanceX = Math.min(Math.abs(MovableMatrixWidth - neighbor.x), Math.abs(-MovableMatrixWidth - neighbor.x));
    const distanceY = Math.min(Math.abs(MovableMatrixLength - neighbor.x), Math.abs(-MovableMatrixLength - neighbor.x));
    const erzVariable = [0, 0,0];
    const distanceZ = Math.min(
        Math.min(Math.abs(erzVariable[0] - neighbor.z), Math.abs(erzVariable[1] - neighbor.z)),
        Math.abs(erzVariable[2] - neighbor.z)
    );

    let spaceAvailability = 0;
    let minDistance = Math.min(distanceX, distanceY, distanceZ);

    /*
    for (let i = 0; i < PathListList.length; i++) {
        for (let j = 0; j < PathListList[i].length; j++) {
            let distance = neighbor.Distance(PathListList[i][j]);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
    }
    */

    spaceAvailability = minDistance;

    return spaceAvailability;
}



