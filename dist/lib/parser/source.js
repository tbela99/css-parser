import { LineMap } from './linemap.js';

let sourceId = 0;
/**
 * Source file helper class
 */
class SourceFile {
    /**
     * Source file ID
     */
    id;
    /**
     * Source file path
     */
    file;
    /**
     * Line map
     */
    lineStarts;
    /**
     * Source file content
     */
    content;
    /**
     * Constructor
     * @param id
     * @param content
     * @param lines
     * @param file
     */
    constructor(content, lines, file = null) {
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
    append(content) {
        this.content += content;
    }
    getFileName() {
        return this.file;
    }
    getText(start, length) {
        return this.content.slice(start, start + length);
    }
    /**
     * Compute line and column of the offset
     * @param offset
     * @returns
     */
    getOffsets(offset) {
        return this.lineStarts.getOffsets(offset);
    }
    /**
     * set line starts
     * @param lines
     */
    setLineStarts(lines) {
        this.lineStarts.setLineStarts(lines);
    }
    /**
     * get line starts
     * @returns
     */
    getLineStarts() {
        return this.lineStarts.getLineStarts();
    }
    /**
     * add line start
     * @param lineStart
     */
    addLineStart(lineStart) {
        this.lineStarts.addLineStart(lineStart);
    }
}

export { SourceFile };
