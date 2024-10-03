class Node {
    constructor(iX, iY, iZ, iWalkable = null) {
        this.x = iX;
        this.y = iY;
        this.z = iZ;
        this.walkable = (iWalkable !== null ? iWalkable : false);
        this.heuristicStartToEndLen = 0;
        this.startToCurNodeLen = 0;
        this.NumofSerialStraightNodes = 0;
        this.NumofBend = 0;
        this.heuristicCurNodeToEndLen = null;
        this.isOpened = false;
        this.isClosed = false;
        this.parent = null;
        this.Depth = 0;
        this.PressureDrop = 0;
        this.SpaceAvailability = 0;
        this.FeasibilityIndex = 0;
        this.Diameter = 0.5;
    }

    // Copy constructor
    clone(node) {
        this.x = node.x;
        this.y = node.y;
        this.z = node.z;
        this.walkable = node.walkable;
        this.heuristicStartToEndLen = node.heuristicStartToEndLen;
        this.startToCurNodeLen = node.startToCurNodeLen;
        this.heuristicCurNodeToEndLen = node.heuristicCurNodeToEndLen;
        this.isOpened = node.isOpened;
        this.isClosed = node.isClosed;
        this.parent = node.parent;
        this.NumofSerialStraightNodes = node.NumofSerialStraightNodes;
        this.NumofBend = node.NumofBend;
        this.Depth = node.Depth;
    }

    // Distance method
    distance(b) {
        return Math.sqrt(Math.pow(this.x - b.x, 2) + Math.pow(this.y - b.y, 2) + Math.pow(this.z - b.z, 2));
    }

    // Reset method
    reset(iWalkable = null) {
        this.walkable = (iWalkable !== null ? iWalkable : this.walkable);
        this.heuristicStartToEndLen = 0;
        this.startToCurNodeLen = 0;
        this.heuristicCurNodeToEndLen = null;
        this.isOpened = false;
        this.isClosed = false;
        this.parent = null;
        this.NumofSerialStraightNodes = 0;
        this.NumofBend = 0;
        this.Depth = 0;
    }

    // Compare method
    compareTo(iObj) {
        const result = this.heuristicStartToEndLen - iObj.heuristicStartToEndLen;
        return result > 0 ? 1 : (result === 0 ? 0 : -1);
    }

    // Backtrace static method
    static backtrace(iNode) {
        const path = [{ x: iNode.x, y: iNode.y, z: iNode.z }];
        while (iNode.parent) {
            iNode = iNode.parent;
            path.push({ x: iNode.x, y: iNode.y, z: iNode.z });
        }
        return path.reverse();
    }

    // Equality methods
    equals(obj) {
        if (obj === null) return false;
        return this.x === obj.x && this.y === obj.y && this.z === obj.z;
    }

    // Operators for equality
    static equals(a, b) {
        if (a === b) return true;
        if (!a || !b) return false;
        return a.x === b.x && a.y === b.y && a.z === b.z;
    }

    static notEquals(a, b) {
        return !Node.equals(a, b);
    }

    // Calculate number of serial straight nodes
    calculateNumofSerialStraightNodes(tJumpNode) {
        if (!this.parent) {
            return 0;
        } else {
            const pnode = Object.assign({}, this);
            const ppnode = Object.assign({}, this.parent);

            const A = { x: pnode.x - tJumpNode.x, y: pnode.y - tJumpNode.y, z: pnode.z - tJumpNode.z };
            const B = { x: ppnode.x - pnode.x, y: ppnode.y - pnode.y, z: ppnode.z - pnode.z };

            const angle = this.angleBetween(A, B);
            if (angle < 0.1) {
                this.NumofSerialStraightNodes++;
                return this.NumofSerialStraightNodes;
            } else {
                tJumpNode.NumofBend++;
                return 0;
            }
        }
    }

    // Helper method for calculating angle between vectors
    angleBetween(vec1, vec2) {
        const dotProduct = vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z;
        const magnitudeA = Math.sqrt(vec1.x * vec1.x + vec1.y * vec1.y + vec1.z * vec1.z);
        const magnitudeB = Math.sqrt(vec2.x * vec2.x + vec2.y * vec2.y + vec2.z * vec2.z);
        return Math.acos(dotProduct / (magnitudeA * magnitudeB));
    }
}
