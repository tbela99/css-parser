import { SourceFile } from "../lib/parser/source.ts";

/**
 * property list options
 */
export declare interface PropertyListOptions {
    /**
     * remove duplicate declarations
     */
    removeDuplicateDeclarations?: boolean | string | string[];
    /**
     * compute shorthand
     */
    computeShorthand?: boolean;
}

/**
 * parse info
 */
export declare interface ParseInfo {
    /**
     * the text of the css. the css input (a string, an ArrayBuffer or a view of an ArrayBuffer) is converted by the
     * tokenizer
     */
    stream: string;

    /**
     * the utf-16 code units of the css, read by the tokenizer. the code units of an ascii ArrayBuffer are its bytes
     */
    codes: Uint8Array | Uint16Array;

    /**
     * the number of code units: the length of a typed array is a getter
     */
    length: number;

    /**
     * Source file
     */
    source: SourceFile;

    /**
     * last token position
     */
    position: number;

    /**
     * current parsing position
     */
    currentPosition: number;

    /**
     * offset
     */
    offset: number;

    /**
     * tokenizing time
     */
    time: number;
}
