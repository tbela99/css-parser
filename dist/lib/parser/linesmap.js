/**
 * Compute line and column of the offset
 */
class LineMap {
    /**
     * line starts
     */
    lineStarts;
    /**
     * Constructor
     * @param lines
     */
    constructor(lines = []) {
        if (lines.length === 0) {
            lines.push(0);
        }
        this.lineStarts = lines;
    }
    /**
     * Compute line and column of the offset
     * @param offset
     * @returns
     */
    getOffsets(offset) {
        const line = this.search(offset);
        // if (offset < 0 || line < 0) {
        //     return [1, 1];
        // }
        // [line, column]
        return [line + 1, offset - this.lineStarts[line] + 1];
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
     * get line starts
     * @returns
     */
    getLineStarts() {
        return this.lineStarts;
    }
    /**
     * add line start
     */
    addLineStart(lineStart) {
        this.lineStarts.push(lineStart);
    }
}

export { LineMap };
