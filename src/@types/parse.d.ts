import { SourceFile } from "../parser/source.ts";
import type { Utf8Text } from "../parser/input.ts";

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
     * the code units of the css, read by the tokenizer: the bytes of an ascii or utf-8 css (see {@link utf8}), the
     * utf-16 code units otherwise
     */
    codes: Uint8Array | Uint16Array;

    /**
     * the number of code units: the length of a typed array is a getter
     */
    length: number;

    /**
     * the code units are the utf-8 bytes of a css that is not ascii (the text of the css), null otherwise: the
     * offsets of the tokens are byte offsets
     */
    utf8: Utf8Text | null;

    /**
     * Source file
     * @ignore
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
