import { LineMap } from "./linesmap.ts";
import type {SourceLocation} from "../../@types/ast.d.ts";
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
    private content: string;

    /**
     * Constructor
     * @param id 
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
     * @param lines 
     */
    append(content: string) {
        this.content += content;
    }

    /**
     * get file name
     * @returns 
     */
    getFileName(): string | null {
        
        return this.file;
    }

    /**
     * get content
     * @returns 
     */
    getContent(): string {
        return this.content;
    }

    /**
     * get text
     * @param start 
     * @param length 
     * @returns 
     */
    getText(start: number, length: number): string {
        return this.content.slice(start, start + length);
    }

    /**
     * Compute line and column of the offset
     * @param offset 
     * @returns 
     */
    getOffsets(offset: number): [number, number] {
        return this.lineStarts.getOffsets(offset);
    }

    /**
     * get source location
     * @param offset 
     * @returns 
     */
    getSourceLocation(offset: number): [string | null, number, number] {
        return [this.file, ...  this.getOffsets(offset)];
    }

    /**
     * get line starts
     * @returns 
     */
    getLineStarts(): number[] {
        return this.lineStarts.getLineStarts();
    }
    
    /**
     * add line start
     * @param lineStart 
     */
    addLineStart(lineStart: number) {
        this.lineStarts.addLineStart(lineStart);
    }
}
