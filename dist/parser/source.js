/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.3
	License: MIT
 */
import { SourceMap } from '../printer/sourcemap.js';
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
     * the text the tokens are read from: the offsets of the tokens are offsets of the text. utf-8 css: the bytes of the
     * css (a {@link Utf8Text}), the offsets are byte offsets
     */
    text;
    inputSourceMap = null;
    /**
     * Constructor
     * @param content
     * @param lines
     * @param file
     */
    constructor(content, lines, file = null) {
        this.id = sourceId++;
        this.text = content;
        this.file = file;
        this.lineStarts = new LineMap(lines);
    }
    /**
     * Source file content
     */
    get content() {
        return typeof this.text === "string" ? this.text : this.text.content;
    }
    set content(content) {
        this.setText(content);
    }
    /**
     * set the text the tokens are read from, see {@link text}
     * @param text
     */
    setText(text) {
        this.text = text;
        this.lineStarts.utf8 = typeof text === "string" ? null : text;
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
