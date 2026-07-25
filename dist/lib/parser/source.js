import { LineMap } from './linemap.js';

/**
 * Source file helper class
 */
class SourceFile {
    /**
     * Source file ID
     */
    id;
    /**
     * Source file content
     */
    content;
    /**
     * Source file path
     */
    file;
    /**
     * Line map
     */
    lineStarts;
    /**
     * Constructor
     * @param id
     * @param content
     * @param lines
     * @param file
     */
    constructor(id, content, lines, file = null) {
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
    updateContent(content, lines) {
        this.content = content;
        this.lineStarts = new LineMap(lines);
    }
    getFile() {
        return this.file;
    }
    /**
     * Compute line and column of the offset
     * @param offset
     * @returns
     */
    position(offset) {
        return this.lineStarts.position(offset);
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
}

export { SourceFile };
