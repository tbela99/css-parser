import type { SourceMapObject } from "../@types/index.d.ts";
import { SourceMap } from "../printer/sourcemap.ts";
import { LineMap } from "./linesmap.ts";
import type { SourceText } from "./input.ts";

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
     * the text the tokens are read from: the offsets of the tokens are offsets of the text. utf-8 css: the bytes of the
     * css (a {@link Utf8Text}), the offsets are byte offsets
     */
    text: SourceText;
    private inputSourceMap: SourceMap | null = null;

    /**
     * Constructor
     * @param content
     * @param lines
     * @param file
     */
    constructor(content: string, lines: number[], file: string | null = null) {
        this.id = sourceId++;
        this.text = content;
        this.file = file;
        this.lineStarts = new LineMap(lines);
    }

    /**
     * Source file content
     */
    get content(): string {
        return typeof this.text === "string" ? this.text : this.text.content;
    }

    set content(content: string) {
        this.setText(content);
    }

    /**
     * set the text the tokens are read from, see {@link text}
     * @param text
     */
    setText(text: SourceText): void {
        this.text = text;
        this.lineStarts.utf8 = typeof text === "string" ? null : text;
    }

    /**
     * Update source content
     * @param content
     */
    append(content: string): void {
        this.content += content;
    }

    /**
     * set input source map
     * @param inputSourceMap
     */
    setInputSourceMap(inputSourceMap: SourceMapObject | string | null): void {
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
