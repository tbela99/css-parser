/**
 * Compute line and column of the offset
 */
export declare class LineMap {
    /**
     * line starts
     */
    readonly lineStarts: number[];
    /**
     * Constructor
     * @param lines
     */
    constructor(lines?: number[]);
    /**
     * Compute line and column of the offset
     * @param offset
     * @returns
     */
    getOffsets(offset: number): [number, number];
    /**
     * search the greatest index of the value less than or equal to offset
     * @param offset
     * @returns
     */
    search(offset: number): number;
}
