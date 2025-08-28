export class GridPos {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.heuristicStartToEndLen = 0;
        this.startToCurNodeLen = 0;
        this.heuristicCurNodeToEndLen = null;
        this.SpaceAvailability = 0;
        this.FeasibilityIndex = 0;
        this.NumofBend = 0;
        this.PressureDrop = 0;
    }

    static fromNode(node) {
        let gridPos = new GridPos(node.x, node.y, node.z);
        gridPos.heuristicStartToEndLen = node.heuristicStartToEndLen;
        gridPos.startToCurNodeLen = node.startToCurNodeLen;
        gridPos.heuristicCurNodeToEndLen = node.heuristicCurNodeToEndLen;
        gridPos.SpaceAvailability = node.SpaceAvailability;
        gridPos.FeasibilityIndex = node.FeasibilityIndex;
        gridPos.NumofBend = node.NumofBend;
        gridPos.PressureDrop = node.PressureDrop;
        return gridPos;
    }

    distance(b) {
        return Math.sqrt(
            Math.pow(this.x - b.x, 2) + Math.pow(this.y - b.y, 2) + Math.pow(this.z - b.z, 2)
        );
    }

    equals(b) {
        if (b == null) return false;
        return this.x === b.x && this.y === b.y && this.z === b.z;
    }

    getHashCode() {
        return this.x ^ this.y ^ this.z;
    }

    toString() {
        return `(${this.x},${this.y},${this.z})`;
    }

    set(iX, iY, iZ) {
        this.x = iX;
        this.y = iY;
        this.z = iZ;
        return this;
    }

    // Operator overload equivalents
    static subtract(a, b) {
        return new GridPos(a.x - b.x, a.y - b.y, a.z - b.z);
    }

    static add(a, b) {
        return new GridPos(a.x + b.x, a.y + b.y, a.z + b.z);
    }

    static divide(a, divisor) {
        return new GridPos(Math.floor(a.x / divisor), Math.floor(a.y / divisor), Math.floor(a.z / divisor));
    }

    static equals(a, b) {
        if (a === b) return true;
        if (!a || !b) return false;
        return a.x === b.x && a.y === b.y && a.z === b.z;
    }

    static notEquals(a, b) {
        return !(GridPos.equals(a, b));
    }
}
