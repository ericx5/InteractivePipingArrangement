export class IntervalHeap {
    constructor() {
        this.heap = [];
    }

    // Helper methods to find left and right children and the parent
    leftChild(index) {
        return 2 * index + 1;
    }

    rightChild(index) {
        return 2 * index + 2;
    }

    parent(index) {
        return Math.floor((index - 1) / 2);
    }

    // Swap two elements in the heap
    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    // Add a new element to the heap
    add(value) {
        this.heap.push(value);
        this.heapifyUp(this.heap.length - 1);
    }

    // Heapify upwards after adding a new element
    heapifyUp(index) {
        while (index > 0) {
            const parentIndex = this.parent(index);
            if (this.heap[index] < this.heap[parentIndex]) {
                this.swap(index, parentIndex);
                index = parentIndex;
            } else {
                break;
            }
        }
    }

    // Delete and return the minimum element (root)
    deleteMin() {
        if (this.heap.length === 0) {
            throw new Error("Heap is empty.");
        }

        const min = this.heap[0];
        const last = this.heap.pop();

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.heapifyDown(0);
        }

        return min;
    }

    // Heapify downwards after removing the root element
    heapifyDown(index) {
        const length = this.heap.length;

        while (true) {
            const left = this.leftChild(index);
            const right = this.rightChild(index);
            let smallest = index;

            if (left < length && this.heap[left] < this.heap[smallest]) {
                smallest = left;
            }

            if (right < length && this.heap[right] < this.heap[smallest]) {
                smallest = right;
            }

            if (smallest === index) break;

            this.swap(index, smallest);
            index = smallest;
        }
    }

    // Return the number of elements in the heap
    count() {
        return this.heap.length;
    }

    // Print the heap (for debugging)
    printHeap() {
        console.log(this.heap);
    }
}
