// Enum for HeuristicMode
export const HeuristicMode = Object.freeze({
    MANHATTAN: 'MANHATTAN',
    EUCLIDEAN: 'EUCLIDEAN',
    CHEBYSHEV: 'CHEBYSHEV',
});

// Heuristic class
export class Heuristic {
    // Manhattan distance
    static Manhattan(iDx, iDy, iDz) {
        return iDx + iDy + iDz;
    }

    // Euclidean distance
    static Euclidean(iDx, iDy, iDz) {
        const tFdx = iDx;
        const tFdy = iDy;
        const tFdz = iDz;
        return Math.sqrt(tFdx * tFdx + tFdy * tFdy + tFdz * tFdz);
    }

    // Chebyshev distance
    static Chebyshev(iDx, iDy, iDz) {
        return Math.max(iDx, Math.max(iDy, iDz));
    }
}
