import type { Utf8Text } from "./input.ts";

/**
 * Compute line and column of the offset
 */
export class LineMap {
    /**
     * utf-8 css: the offsets are byte offsets, the columns are utf-16 columns
     */
    utf8: Utf8Text | null = null;

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
        const column: number =
            this.utf8 === null
                ? offset - this.lineStarts[line]
                : this.utf8.utf16(offset) - this.utf8.utf16(this.lineStarts[line]);

        // [line, column]
        return [line + 1, line === 0 ? column + 1 : column];
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
}
