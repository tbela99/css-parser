import type { SourceMapObject } from "../@types/index.d.ts";
import { SourceMap } from "../printer/sourcemap.ts";
import { LineMap } from "./linesmap.ts";
/**
 * Source file helper class
 */
export declare class SourceFile {
    /**
     * Source file ID
     */
    readonly id: number;
    /**
     * Source file path
     */
    readonly file: string | null;
    /**
     * Line map
     */
    readonly lineStarts: LineMap;
    /**
     * Source file content
     */
    content: string;
    private inputSourceMap;
    /**
     * Constructor
     * @param content
     * @param lines
     * @param file
     */
    constructor(content: string, lines: number[], file?: string | null);
    /**
     * Update source content
     * @param content
     */
    append(content: string): void;
    /**
     * set input source map
     * @param inputSourceMap
     */
    setInputSourceMap(inputSourceMap: SourceMapObject | string | null): void;
    /**
     * return input source map
     * @returns
     */
    getInputSourceMap(): SourceMap | null;
}
