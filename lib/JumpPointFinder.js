const IterationType = {
    LOOP: 'LOOP',
    RECURSIVE: 'RECURSIVE'
};

const EndNodeUnWalkableTreatment = {
    ALLOW: 'ALLOW',
    DISALLOW: 'DISALLOW'
};

class JumpPointParam extends ParamBase {
    constructor(grid, startPos, endPos, endNodeUnWalkable = EndNodeUnWalkableTreatment.ALLOW, diagonalMovement = DiagonalMovement.Always, mode = HeuristicMode.EUCLIDEAN) {
        super(grid, startPos, endPos, diagonalMovement, mode);
        this.CurEndNodeUnWalkableTreatment = endNodeUnWalkable;
        this.openList = new IntervalHeap();
        this.CurIterationType = IterationType.LOOP;
    }

    // Deprecated constructor - only for backward compatibility
    static deprecated(grid, startPos, endPos, allowEndNodeUnWalkable = true, crossCorner = true, crossAdjacentPoint = true, mode = HeuristicMode.EUCLIDEAN) {
        const diagonalMovement = Util.getDiagonalMovement(crossCorner, crossAdjacentPoint);
        const endNodeTreatment = allowEndNodeUnWalkable ? EndNodeUnWalkableTreatment.ALLOW : EndNodeUnWalkableTreatment.DISALLOW;
        return new JumpPointParam(grid, startPos, endPos, endNodeTreatment, diagonalMovement, mode);
    }

    // Another deprecated constructor variant
    static deprecatedWithoutPos(grid, allowEndNodeUnWalkable = true, crossCorner = true, crossAdjacentPoint = true, mode = HeuristicMode.EUCLIDEAN) {
        const diagonalMovement = Util.getDiagonalMovement(crossCorner, crossAdjacentPoint);
        const endNodeTreatment = allowEndNodeUnWalkable ? EndNodeUnWalkableTreatment.ALLOW : EndNodeUnWalkableTreatment.DISALLOW;
        return new JumpPointParam(grid, null, null, endNodeTreatment, diagonalMovement, mode);
    }

    // Deprecated constructor - variant with diagonal movement
    static deprecatedWithDiagonal(grid, startPos, endPos, allowEndNodeUnWalkable = true, diagonalMovement = DiagonalMovement.Always, mode = HeuristicMode.EUCLIDEAN) {
        const endNodeTreatment = allowEndNodeUnWalkable ? EndNodeUnWalkableTreatment.ALLOW : EndNodeUnWalkableTreatment.DISALLOW;
        return new JumpPointParam(grid, startPos, endPos, endNodeTreatment, diagonalMovement, mode);
    }

    // Deprecated constructor without startPos and endPos
    static deprecatedWithoutPosWithDiagonal(grid, allowEndNodeUnWalkable = true, diagonalMovement = DiagonalMovement.Always, mode = HeuristicMode.EUCLIDEAN) {
        const endNodeTreatment = allowEndNodeUnWalkable ? EndNodeUnWalkableTreatment.ALLOW : EndNodeUnWalkableTreatment.DISALLOW;
        return new JumpPointParam(grid, null, null, endNodeTreatment, diagonalMovement, mode);
    }

    // Copy constructor
    static fromExisting(param) {
        const newParam = new JumpPointParam(param.grid, param.startPos, param.endPos, param.CurEndNodeUnWalkableTreatment, param.diagonalMovement, param.mode);
        newParam.openList = new IntervalHeap();
        newParam.openList.addAll(param.openList);
        newParam.CurIterationType = param.CurIterationType;
        return newParam;
    }

    // Resets the param
    _reset(startPos, endPos, searchGrid = null) {
        this.openList = new IntervalHeap();
    }

    // Deprecated property: AllowEndNodeUnWalkable
    get AllowEndNodeUnWalkable() {
        return this.CurEndNodeUnWalkableTreatment === EndNodeUnWalkableTreatment.ALLOW;
    }

    set AllowEndNodeUnWalkable(value) {
        this.CurEndNodeUnWalkableTreatment = value ? EndNodeUnWalkableTreatment.ALLOW : EndNodeUnWalkableTreatment.DISALLOW;
    }

    // Deprecated property: UseRecursive
    get UseRecursive() {
        return this.CurIterationType === IterationType.RECURSIVE;
    }

    set UseRecursive(value) {
        this.CurIterationType = value ? IterationType.RECURSIVE : IterationType.LOOP;
    }
}

class JumpPointFinder {
    static getFullPath(routeFound) {
        if (!routeFound) return null;
        
        let consecutiveGridList = [];
        if (routeFound.length > 1) {
            consecutiveGridList.push(new GridPos(routeFound[0]));
        }

        for (let routeTrav = 0; routeTrav < routeFound.length - 1; routeTrav++) {
            let fromGrid = new GridPos(routeFound[routeTrav]);
            let toGrid = routeFound[routeTrav + 1];
            let dX = toGrid.x - fromGrid.x;
            let dY = toGrid.y - fromGrid.y;
            let dZ = toGrid.z - fromGrid.z;

            let nDX = 0, nDY = 0, nDZ = 0;
            if (dX !== 0) nDX = dX / Math.abs(dX);
            if (dY !== 0) nDY = dY / Math.abs(dY);
            if (dZ !== 0) nDZ = dZ / Math.abs(dZ);

            while (!fromGrid.equals(toGrid)) {
                fromGrid.x += nDX;
                fromGrid.y += nDY;
                fromGrid.z += nDZ;
                consecutiveGridList.push(new GridPos(fromGrid));
            }
        }
        return consecutiveGridList;
    }

    static findPath_SYD(iParam) {
        let tOpenList = iParam.openList;
        let tStartNode = iParam.StartNode;
        let tEndNode = iParam.EndNode;
        let tNode;
        let revertEndNodeWalkable = false;

        // Set the `g` and `f` value of the start node to 0
        tStartNode.startToCurNodeLen = 0;
        tStartNode.heuristicStartToEndLen = 0;

        // Push the start node into the open list
        tOpenList.add(tStartNode);
        tStartNode.isOpened = true;

        if (iParam.CurEndNodeUnWalkableTreatment === EndNodeUnWalkableTreatment.ALLOW && !iParam.SearchGrid.isWalkableAt(tEndNode.x, tEndNode.y, tEndNode.z)) {
            iParam.SearchGrid.setWalkableAt(tEndNode.x, tEndNode.y, tEndNode.z, true);
            revertEndNodeWalkable = true;
        }

        // While the open list is not empty
        while (tOpenList.length > 0) {
            // Pop the position of the node which has the minimum `f` value
            tNode = tOpenList.deleteMin();
            tNode.isClosed = true;

            if (tNode.equals(tEndNode)) {
                if (revertEndNodeWalkable) {
                    iParam.SearchGrid.setWalkableAt(tEndNode.x, tEndNode.y, tEndNode.z, false);
                }
                return Node.backtrace(tNode); // Rebuilding path
            }

            JumpPointFinder.identifySuccessors_SYD(iParam, tNode);
        }

        if (revertEndNodeWalkable) {
            iParam.SearchGrid.setWalkableAt(tEndNode.x, tEndNode.y, tEndNode.z, false);
        }

        // Failed to find the path
        return [];
    }

    static identifySuccessors_SYD(iParam, iNode) {
        const tHeuristic = iParam.HeuristicFunc;
        const tOpenList = iParam.openList;
        const tEndX = iParam.EndNode.x;
        const tEndY = iParam.EndNode.y;
        const tEndZ = iParam.EndNode.z;
        let tNeighbor, tJumpPoint, tJumpNode;

        const tNeighbors = JumpPointFinder.findNeighbors(iParam, iNode);
        for (let i = 0; i < tNeighbors.length; i++) {
            tNeighbor = tNeighbors[i];

            // Check if jump should be done recursively or with a loop
            if (iParam.CurIterationType === IterationType.RECURSIVE) {
                tJumpPoint = JumpPointFinder.jump(iParam, tNeighbor.x, tNeighbor.y, tNeighbor.z, iNode.x, iNode.y, iNode.z);
            } else {
                tJumpPoint = JumpPointFinder.jumpLoop(iParam, tNeighbor.x, tNeighbor.y, tNeighbor.z, iNode.x, iNode.y, iNode.z);
            }

            if (tJumpPoint !== null) {
                tJumpNode = iParam.SearchGrid.getNodeAt(tJumpPoint.x, tJumpPoint.y, tJumpPoint.z);
                if (tJumpNode === null && iParam.EndNode.equals(tJumpPoint)) {
                    tJumpNode = iParam.SearchGrid.getNodeAt(tJumpPoint);
                }

                if (tJumpNode.isClosed) continue;

                // Include distance, as parent may not be immediately adjacent:
                const tCurNodeToJumpNodeLen = tHeuristic(Math.abs(tJumpPoint.x - iNode.x), Math.abs(tJumpPoint.y - iNode.y), Math.abs(tJumpPoint.z - iNode.z));
                const tStartToJumpNodeLen = iNode.startToCurNodeLen + tCurNodeToJumpNodeLen;

                if (!tJumpNode.isOpened || tStartToJumpNodeLen < tJumpNode.startToCurNodeLen) {
                    tJumpNode.parent = iNode;
                    tJumpNode.NumofBend = iNode.NumofBend;
                    tJumpNode.NumofSerialStraightNodes = iNode.calculateNumofSerialStraightNodes(tJumpNode);
                    tJumpNode.startToCurNodeLen = tStartToJumpNodeLen;

                    // Calculate heuristic length and feasibility index
                    tJumpNode.heuristicCurNodeToEndLen = tJumpNode.heuristicCurNodeToEndLen || tHeuristic(Math.abs(tJumpPoint.x - tEndX), Math.abs(tJumpPoint.y - tEndY), Math.abs(tJumpPoint.z - tEndZ));
                    const overlappedPath = ModelManager.getInstance().findOverlappedPipe(tJumpNode);
                    tJumpNode.SpaceAvailability = ModelManager.getInstance().getPipeSpaceAvailability(tJumpNode);
                    tJumpNode.FeasibilityIndex = 0;

                    // Calculate heuristicStartToEndLen using weights from ModelManager
                    const w1 = ModelManager.getInstance().w1;
                    const w2 = ModelManager.getInstance().w2;
                    const w3 = ModelManager.getInstance().w3;
                    const w4 = ModelManager.getInstance().w4;
                    tJumpNode.heuristicStartToEndLen =
                        w1 * (tJumpNode.startToCurNodeLen - overlappedPath / 1000) +
                        w1 * tJumpNode.heuristicCurNodeToEndLen / 1000 +
                        w2 * tJumpNode.NumofBend / 50 -
                        w4 * tJumpNode.FeasibilityIndex / 500 -
                        w3 * tJumpNode.SpaceAvailability / 1000;

                    if (!tJumpNode.isOpened) {
                        tOpenList.add(tJumpNode);
                        tJumpNode.isOpened = true;
                    }
                }
            }
        }
    }

    static calculateStraightPipeLength(Node) {
        return Node.NumofSerialStraightNodes * ModelManager.gridUnitLength;
    }
}
