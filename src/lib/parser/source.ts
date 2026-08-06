import { LineMap } from "./linemap.ts";

/**
 * Source file helper class
 */
export class SourceFile {

    /**
     * Source file ID
     */
    readonly id: number;
    /**
     * Source file content
     */
    private content: string;
    /**
     * Source file path
     */
    readonly file: string | null;
    /**
     * Line map
     */
    private lineStarts: LineMap;

    /**
     * Constructor
     * @param id 
     * @param content 
     * @param lines 
     * @param file 
     */
    constructor(id: number, content: string, lines: number[], file: string | null = null) {
        this.id = id;
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

    getFileName(): string | null {
        
        return this.file;
    }

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
     * set line starts
     * @param lines 
     */
    setLineStarts(lines: number[]) {
        this.lineStarts.setLineStarts(lines);
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
