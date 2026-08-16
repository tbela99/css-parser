/**
 * Compute line and column of the offset
 */
export class LineMap {
    /**
     * line starts
     */
    readonly lineStarts: number[];

    /**
     * Constructor
     * @param lines
     */
    constructor(lines: number[] = []) {
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
    getOffsets(offset: number): [number, number] {
        const line: number = this.search(offset);

        if (offset < 0 || line < 0) {
            return [1, 1];
        }

        const column: number = offset - this.lineStarts[line] + 1;
        // [line, column]
        return [line + 1, column == 0 ? 1 : column];
    }

    /**
     * search the greatest index of the value less than or equal to offset
     * @param offset
     * @returns
     */
    search(offset: number): number {
        // search lineStarts using binary search
        let start: number = 0;
        let end: number = this.lineStarts.length - 1;
        let mid: number = 0;
        let result: number = -1;

        while (start <= end) {
            mid = start + ((end - start) >>> 1);

            if (this.lineStarts[mid] <= offset) {
                result = mid;
                start = mid + 1;
            } else if (this.lineStarts[mid] > offset) {
                end = mid - 1;
            }
        }
        return result;
    }

    /**
     * get line starts
     * @returns
     */
    getLineStarts(): number[] {
        return this.lineStarts;
    }

    /**
     * add line start
     */
    addLineStart(lineStart: number) {
        this.lineStarts.push(lineStart);
    }

    /**
     * clone the linemap
     * @returns
     */
    clone(): LineMap {
        return new LineMap(this.lineStarts.slice());
    }
}
