import { IntervalHeap } from './IntervalHeap.js';
import { PathfindingNode } from './PathfindingNode.js';
export class AStarParam {
    constructor(grid, startNode, endNode, weight, diagonalMovement = DiagonalMovement.Always, mode = HeuristicMode.EUCLIDEAN) {
        this.grid = grid;
        this.startNode = startNode;
        this.endNode = endNode;
        this.weight = weight;
        this.diagonalMovement = diagonalMovement;
        this.mode = mode;
    }

    static fromGridAndWeight(grid, weight, diagonalMovement = DiagonalMovement.Always, mode = HeuristicMode.EUCLIDEAN) {
        return new AStarParam(grid, null, null, weight, diagonalMovement, mode);
    }

    reset(startPos, endPos, searchGrid = null) {
        // Implement reset logic if needed
    }
}

export const DiagonalMovement = Object.freeze({
    Always: 'Always',
    Never: 'Never',
    IfAtLeastOneWalkable: 'IfAtLeastOneWalkable',
    OnlyWhenNoObstacles: 'OnlyWhenNoObstacles'
});

const w1 = 1;
const w2 = 1;
const w3 = 1;
let overlappedPath = 1;
let maxStartToCurNodeLen=1;
let maxheuristicCurNodeToEnd=1;
let maxNumofBend=1;
let maxSpaceAvailability=1;

export class AStarFinder {
    static findPath(param) {
        const openList = new IntervalHeap(); // Assuming IntervalHeap is implemented elsewhere
        const startNode = param.startNode;
        const endNode = param.endNode;
        const heuristic = param.heuristicFunc;
        const grid = param.grid;
        const diagonalMovement = param.diagonalMovement;
        const weight = param.weight;

        startNode.startToCurNodeLen = 0;
        startNode.heuristicStartToEndLen = 0;

        openList.add(startNode);
        startNode.isOpened = true;

        while (openList.count() !== 0) {
            const node = openList.deleteMin();
            node.isClosed = true;

            if (node === endNode) {
                return PathfindingNode.backtrace(endNode); // Assuming Node.backtrace is implemented elsewhere
            }

            const neighbors = grid.getNeighbors(node, diagonalMovement);

            for (const neighbor of neighbors) {
                if (neighbor.isClosed) continue;

                const x = neighbor.x;
                const y = neighbor.y;
                const z = neighbor.z;
                const ng = node.startToCurNodeLen + (x - node.x === 0 || y - node.y === 0 
                    ? (z - node.z === 0 ? 1 : Math.sqrt(2)) 
                    : (z - node.z === 0 ? Math.sqrt(2) : Math.sqrt(3))
                );

                if (!neighbor.isOpened || ng < neighbor.startToCurNodeLen) {
                    neighbor.startToCurNodeLen = ng;
                    if (neighbor.heuristicCurNodeToEndLen == null) {
                        neighbor.heuristicCurNodeToEndLen = weight * (
                            Math.abs(x - endNode.x)+ 
                            Math.abs(y - endNode.y)+ 
                            Math.abs(z - endNode.z)
                        );
                    }
                    neighbor.heuristicStartToEndLen = neighbor.startToCurNodeLen + neighbor.heuristicCurNodeToEndLen;

                    neighbor.parent = node;
                    if (!neighbor.isOpened) {
                        openList.add(neighbor);
                        neighbor.isOpened = true;
                    }
                }
            }
        }
        return [];
    }

    static findPathDijkstra(param) {
        const openList = [];
        const startNode = param.startNode;
        const endNode = param.endNode;
        const heuristic = param.heuristicFunc;
        const grid = param.grid;
        const diagonalMovement = param.diagonalMovement;

        startNode.startToCurNodeLen = 0;
        startNode.heuristicStartToEndLen = 0;

        openList.push(startNode);
        startNode.isOpened = true;

        while (openList.length !== 0) {
            const node = this.deleteMin(openList);
            node.isClosed = true;

            if (node === endNode) {
                return PathfindingNode.backtrace(endNode);
            }

            const neighbors = grid.getNeighbors(node, diagonalMovement);

            for (const neighbor of neighbors) {
                if (neighbor.isClosed) continue;

                const x = neighbor.x;
                const y = neighbor.y;
                const z = neighbor.z;
                const ng = node.startToCurNodeLen + (x - node.x === 0 || y - node.y === 0 
                    ? (z - node.z === 0 ? 1 : Math.sqrt(2)) 
                    : (z - node.z === 0 ? Math.sqrt(2) : Math.sqrt(3))
                );

                if (!neighbor.isOpened || ng < neighbor.startToCurNodeLen) {
                    ModelManager.getInstance().count++;
                    neighbor.startToCurNodeLen = ng;
                    neighbor.parent = node;
                    neighbor.depth = node.depth + 1;
                    neighbor.numOfBend = node.numOfBend;
                    neighbor.numOfSerialStraightNodes = node.calculateNumOfSerialStraightNodes(neighbor);

                    neighbor.heuristicCurNodeToEndLen = heuristic(
                        Math.abs(x - endNode.x), 
                        Math.abs(y - endNode.y), 
                        Math.abs(z - endNode.z)
                    );

                    // Add logic for managing neighbor's properties as needed
                    neighbor.heuristicStartToEndLen = 
                    w1 *
                    (neighbor.startToCurNodeLen - overlappedPath / maxStartToCurNodeLen) +
                    w1 * neighbor.heuristicCurNodeToEndLen.Value /
                    maxheuristicCurNodeToEnd +
                    w2 * neighbor.NumofBend / maxNumofBend -
                    + w3 * neighbor.SpaceAvailability / maxSpaceAvailability;
                    // Calculate heuristic based on weights
                    //...

                    if (!neighbor.isOpened) {
                        openList.push(neighbor);
                        neighbor.isOpened = true;
                    }
                }
            }
        }
        return [];
    }

    static deleteMin(openList) {
        let bestIndex = 0;
        let bestNode = openList[0];

        for (let i = 0; i < openList.length; i++) {
            if (openList[i].depth < bestNode.depth ||
                (openList[i].depth === bestNode.depth && openList[i].heuristicStartToEndLen < bestNode.heuristicStartToEndLen)) {
                bestNode = openList[i];
                bestIndex = i;
            }
        }
        openList.splice(bestIndex, 1);
        return bestNode;
    }

    static findPathSYD(param) {
        let openList = new IntervalHeap();
        let startNode = param.startNode;
        let endNode = param.endNode;
        let heuristic = param.heuristicFunc;
        const grid = param.grid;
        const diagonalMovement = param.diagonalMovement;
        let weight = param.weight;

        startNode.startToCurNodeLen = 0;
        startNode.heuristicStartToEndLen = 0;

        openList.add(startNode);
        startNode.isOpened = true;

        while (openList.count() !== 0) {
            const node = openList.deleteMin();
            node.isClosed = true;


            if (node.x == endNode.x && node.y == endNode.y && node.z == endNode.z) {
                return PathfindingNode.backtrace(node);
            }

            let neighbors = grid.getNeighbors(node, diagonalMovement);

            for (let neighbor of neighbors) {
                if (neighbor.isClosed) continue;

                const x = neighbor.x;
                const y = neighbor.y;
                const z = neighbor.z;
                const ng = node.startToCurNodeLen + (x - node.x === 0 || y - node.y === 0 
                    ? (z - node.z === 0 ? 1 : Math.sqrt(2)) 
                    : (z - node.z === 0 ? Math.sqrt(2) : Math.sqrt(3))
                );

                if (!neighbor.isOpened || ng < neighbor.startToCurNodeLen) {
                    neighbor.startToCurNodeLen = ng;
                    neighbor.parent = node;
                    neighbor.numOfBend = node.numOfBend;
                    neighbor.numOfSerialStraightNodes = 0;//node.calculateNumOfSerialStraightNodes(neighbor);

                    /*
                    neighbor.heuristicCurNodeToEndLen = heuristic(
                        Math.abs(x - endNode.x), 
                        Math.abs(y - endNode.y), 
                        Math.abs(z - endNode.z)
                    );
                    */
                    neighbor.heuristicCurNodeToEndLen = (
                        Math.abs(x - endNode.x)*Math.abs(x - endNode.x)+
                        Math.abs(y - endNode.y)*Math.abs(y - endNode.y)+ 
                        Math.abs(z - endNode.z)*Math.abs(z - endNode.z)
                    );

                    // Add logic for neighbor properties management
                    neighbor.heuristicStartToEndLen = 
                    w1 *
                    (neighbor.startToCurNodeLen - overlappedPath / maxStartToCurNodeLen) +
                    w1 * neighbor.heuristicCurNodeToEndLen /
                    maxheuristicCurNodeToEnd +
                    w2 * neighbor.NumofBend / maxNumofBend -
                    + w3 * neighbor.SpaceAvailability / maxSpaceAvailability;
                    


                    if (!neighbor.isOpened) {
                        openList.add(neighbor);
                        neighbor.isOpened = true;
                    }
                }
            }
        }
        return [];
    }

    static findPathGreedySYD(param) {
        const openList = new IntervalHeap();
        const startNode = param.startNode;
        const endNode = param.endNode;
        const heuristic = param.heuristicFunc;
        const grid = param.grid;
        const diagonalMovement = param.diagonalMovement;
        const weight = param.weight;

        startNode.startToCurNodeLen = 0;
        startNode.heuristicStartToEndLen = 0;

        openList.add(startNode);
        startNode.isOpened = true;

        while (openList.count() !== 0) {
            const node = openList.deleteMin();
            node.isClosed = true;

            if (node === endNode) {
                return PathfindingNode.backtrace(endNode);
            }

            const neighbors = grid.getNeighbors(node, diagonalMovement);

            for (const neighbor of neighbors) {
                if (neighbor.isClosed) continue;

                const x = neighbor.x;
                const y = neighbor.y;
                const z = neighbor.z;
                const ng = node.startToCurNodeLen + (x - node.x === 0 || y - node.y === 0 
                    ? (z - node.z === 0 ? 1 : Math.sqrt(2)) 
                    : (z - node.z === 0 ? Math.sqrt(2) : Math.sqrt(3))
                );

                if (!neighbor.isOpened || ng < neighbor.startToCurNodeLen) {
                    neighbor.startToCurNodeLen = ng;
                    neighbor.parent = node;
                    neighbor.numOfBend = node.numOfBend;
                    neighbor.numOfSerialStraightNodes = node.calculateNumOfSerialStraightNodes(neighbor);

                    /*
                    neighbor.heuristicCurNodeToEndLen = heuristic(
                        Math.abs(x - endNode.x), 
                        Math.abs(y - endNode.y), 
                        Math.abs(z - endNode.z)
                    );
                    */
                    neighbor.heuristicCurNodeToEndLen = (
                        Math.abs(x - endNode.x)+
                        Math.abs(y - endNode.y)+ 
                        Math.abs(z - endNode.z)
                    );

                    neighbor.heuristicStartToEndLen = neighbor.heuristicCurNodeToEndLen;

                    if (!neighbor.isOpened) {
                        openList.add(neighbor);
                        neighbor.isOpened = true;
                    }
                }
            }
        }
        return [];
    }
}
