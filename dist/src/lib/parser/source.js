/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { SourceMap } from '../printer/sourcemap/sourcemap.js';
import { LineMap } from './linesmap.js';

/**
 * Source file ID
 */
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
    inputSourceMap = null;
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
