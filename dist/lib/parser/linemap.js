/**
 * Compute line and column of the offset
 */
class LineMap {
    /**
     * line starts
     */
    lineStarts;
    constructor(lines) {
        this.lineStarts = lines;
    }
    /**
     * Compute line and column of the offset
     * @param offset
     * @returns
     */
    position(offset) {
        const line = this.search(offset);
        const column = offset - this.lineStarts[line];
        // [line, column]
        return [line + 1, column == 0 ? 1 : column];
    }
    /**
     * search the greatest index of the value less than or equal to offset
     * @param offset
     * @returns
     */
    search(offset) {
        // search lineStarts using binary search
        let start = 0;
        let end = this.lineStarts.length - 1;
        let mid = 0;
        let result = -1;
        while (start <= end) {
            mid = start + ((end - start) >>> 1);
            if (this.lineStarts[mid] <= offset) {
                result = mid;
                start = mid + 1;
            }
            else if (this.lineStarts[mid] > offset) {
                end = mid - 1;
            }
        }
        return result;
    }
    /**
     * set line starts
     * @param lines
     */
    setLineStarts(lines) {
        this.lineStarts = lines;
    }
    /**
     * get line starts
     * @returns
     */
    getLineStarts() {
        return this.lineStarts;
    }
}

export { LineMap };
