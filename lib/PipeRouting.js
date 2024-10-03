class RapidPipeRouting {
    constructor() {
        this.DynamicCoeff = 1; // Assuming DynamicCoeff is initialized somewhere in the class
        this._dynamicMatrix = []; // Initialize with your actual dynamic matrix
    }

    async RapidPipeRoutingStart(equipmentsList, startPoint, endPoint, visualization = false, dynamiCoeff = 1) {
        const sw = new Stopwatch(); // Assuming Stopwatch is implemented elsewhere
        sw.start();

        let tempMatrix = this._dynamicMatrix;

        let sumNumofBend = 0;
        let pipeLength = 0;

        // Loop through each starting and ending point
        for (let j = 0; j < startPoint.length; j++) {
            this.DynamicCoeff = dynamiCoeff;
            tempMatrix = this.CreateLimitedArea(startPoint[j], endPoint[j], equipmentsList, this.DynamicCoeff);

            const originPoint = new GridPos(
                Math.min(startPoint[j].x, endPoint[j].x),
                Math.min(startPoint[j].y, endPoint[j].y),
                Math.min(startPoint[j].z, endPoint[j].z)
            );
            const newStartPoint = new GridPos(
                (startPoint[j].x - originPoint.x) / this.DynamicCoeff,
                (startPoint[j].y - originPoint.y) / this.DynamicCoeff,
                (startPoint[j].z - originPoint.z) / this.DynamicCoeff
            );
            const newEndPoint = new GridPos(
                (endPoint[j].x - originPoint.x) / this.DynamicCoeff,
                (endPoint[j].y - originPoint.y) / this.DynamicCoeff,
                (endPoint[j].z - originPoint.z) / this.DynamicCoeff
            );

            const width = tempMatrix.length;
            const length = tempMatrix[0].length;
            const height = tempMatrix[0][0].length;

            const dynamicResultPathList = [startPoint[j]];

            // Dynamic grid adjustment
            let searchGrid2 = new StaticGrid(width, length, height, tempMatrix);
            const startPos2 = newStartPoint;
            const endPos2 = newEndPoint;

            // Adjust walkable points
            searchGrid2.setWalkableAt(startPos2, true);
            searchGrid2.setWalkableAt(endPos2, true);

            const jpParam2 = new JumpPointParam(searchGrid2, startPos2, endPos2, EndNodeUnWalkableTreatment.ALLOW, DiagonalMovement.Never, HeuristicMode.EUCLIDEAN);
            const aStarParam = new AStarParam(searchGrid2, startPos2, endPos2, 0.4, DiagonalMovement.Never, HeuristicMode.EUCLIDEAN);
            const resultPathList = JumpPointFinder.findPath_SYD(jpParam2);

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
                    searchGrid3.setWalkableAt(startPos2, true);
                    searchGrid3.setWalkableAt(endPos2, true);

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
        }

        sw.stop();
        console.log(sw.elapsedMilliseconds.toString());
        // console.log(ModelManager.getInstance().Count);
        return [pipeLength, sumNumofBend];
    }
}
