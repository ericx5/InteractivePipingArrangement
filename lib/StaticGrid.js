import {BaseGrid} from "./BaseGrid.js";
import {PathfindingNode} from "./PathfindingNode.js";

export class StaticGrid{
    constructor(width, length, height, matrix = null) {
        __proto__: BaseGrid;
        this.width = width;
        this.length = length;
        this.height = height;
        this.minX = 0;
        this.minY = 0;
        this.minZ = 0;
        this.maxX = width - 1;
        this.maxY = length - 1;
        this.maxZ = height - 1;
        this.nodes = this.buildNodes(width, length, height, matrix);
    }

    // Copy constructor for StaticGrid
    static from(grid) {
        let matrix = [];
        for (let x = 0; x < grid.width; x++) {
            matrix[x] = [];
            for (let y = 0; y < grid.length; y++) {
                matrix[x][y] = [];
                for (let z = 0; z < grid.height; z++) {
                    matrix[x][y][z] = grid.isWalkableAt(x, y, z);
                }
            }
        }
        return new StaticGrid(grid.width, grid.length, grid.height, matrix);
    }

    buildNodes(width, length, height, matrix) {
        let nodes = [];
        for (let x = 0; x < width; x++) {
            nodes[x] = [];
            for (let y = 0; y < length; y++) {
                nodes[x][y] = [];
                for (let z = 0; z < height; z++) {
                    nodes[x][y][z] = new PathfindingNode(x, y, z);
                }
            }
        }

        if (!matrix) {
            return nodes;
        }

        if (matrix.length !== width || matrix[0].length !== length || matrix[0][0].length !== height) {
            throw new Error("Matrix size does not fit");
        }

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < length; y++) {
                for (let z = 0; z < height; z++) {
                    nodes[x][y][z].walkable = matrix[x][y][z];
                }
            }
        }

        return nodes;
    }

    getNodeAt(x, y, z) {
        return this.nodes[x][y][z];
    }

    isWalkableAt(x, y, z) {
        return this.isInside(x, y, z) && this.nodes[x][y][z].walkable;
    }

    setWalkableAt(x, y, z, walkable) {
        this.nodes[Math.floor(x)][Math.floor(y)][Math.floor(z)].walkable = walkable;
        return true;
    }

    isInside(x, y, z) {
        return (x >= 0 && x < this.width) && (y >= 0 && y < this.length) && (z >= 0 && z < this.height);
    }

    // Overloaded method with position object
    getNodeAtPos(pos) {
        return this.getNodeAt(pos.x, pos.y, pos.z);
    }

    isWalkableAtPos(pos) {
        return this.isWalkableAt(pos.x, pos.y, pos.z);
    }

    setWalkableAtPos(pos, walkable) {
        return this.setWalkableAt(pos.x, pos.y, pos.z, walkable);
    }

    reset(matrix = null) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.length; y++) {
                for (let z = 0; z < this.height; z++) {
                    this.nodes[x][y][z].reset();
                }
            }
        }

        if (!matrix) return;

        if (matrix.length !== this.width || matrix[0].length !== this.length || matrix[0][0].length !== this.height) {
            throw new Error("Matrix size does not fit");
        }

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.length; y++) {
                for (let z = 0; z < this.height; z++) {
                    this.nodes[x][y][z].walkable = matrix[x][y][z];
                }
            }
        }
    }

    clone() {
        const newGrid = new StaticGrid(this.width, this.length, this.height, null);
        const newNodes = [];

        for (let x = 0; x < this.width; x++) {
            newNodes[x] = [];
            for (let y = 0; y < this.length; y++) {
                newNodes[x][y] = [];
                for (let z = 0; z < this.height; z++) {
                    newNodes[x][y][z] = new PathfindingNode(x, y, z, this.nodes[x][y][z].walkable);
                }
            }
        }

        newGrid.nodes = newNodes;
        return newGrid;
    }
}
