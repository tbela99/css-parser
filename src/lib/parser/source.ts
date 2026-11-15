import type { SourceMapObject } from "../../@types/index.d.ts";
import { SourceMap } from "../printer/sourcemap/sourcemap.ts";
import { LineMap } from "./linesmap.ts";

/**
 * Source file ID
 */
let sourceId: number = 0;

/**
 * Source file helper class
 */
export class SourceFile {
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
    private inputSourceMap: SourceMap | null = null;

    /**
     * Constructor
     * @param content
     * @param lines
     * @param file
     */
    constructor(content: string, lines: number[], file: string | null = null) {
        this.id = sourceId++;
        this.content = content;
        this.file = file;
        this.lineStarts = new LineMap(lines);
    }

    /**
     * Update source content
     * @param content
     */
    append(content: string) {
        this.content += content;
    }

    /**
     * set input source map
     * @param inputSourceMap
     */
    setInputSourceMap(inputSourceMap: SourceMapObject | string | null) {
        this.inputSourceMap = inputSourceMap == null ? null : new SourceMap(inputSourceMap as SourceMapObject | string);
    }

    /**
     * return input source map
     * @returns
     */
    getInputSourceMap(): SourceMap | null {
        return this.inputSourceMap;
    }
}
