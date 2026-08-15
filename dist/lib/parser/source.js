import { SourceMap } from '../renderer/sourcemap/sourcemap.js';
import { LineMap } from './linesmap.js';

/**
 * Source file ID
 */
let sourceId = 0;
/**
 * Source file helper class
 */
class SourceFile {
    inputSourceMap = null;
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
     */
    append(content) {
        this.content += content;
    }
    /**
     * get file name
     * @returns
     */
    getFileName() {
        return this.file;
    }
    /**
     * get content
     * @returns
     */
    getContent() {
        return this.content;
    }
    /**
     * get text
     * @param start
     * @param length
     * @returns
     */
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
     * get source location
     * @param offset
     * @returns
     */
    getSourceLocation(offset) {
        return [this.file, ...this.getOffsets(offset)];
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
    /**
     * set input source map
     * @param inputSourceMap
     */
    setInputSourceMap(inputSourceMap) {
        this.inputSourceMap = inputSourceMap == null ? null : new SourceMap(inputSourceMap);
    }
    /**
     * return input source map
     * @returns
     */
    getInputSourceMap() {
        return this.inputSourceMap;
    }
}

export { SourceFile };
