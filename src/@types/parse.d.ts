import { SourceFile } from "../lib/parser/source.ts";

export declare interface PropertyListOptions {
    removeDuplicateDeclarations?: boolean | string | string[];
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
