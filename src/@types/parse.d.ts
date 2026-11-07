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
     * stream
     */
    stream: string;

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
