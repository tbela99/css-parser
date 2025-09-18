import type {Position} from "./ast.d.ts";

export declare interface PropertyListOptions {

    removeDuplicateDeclarations?: boolean | string | string[];
    computeShorthand?: boolean;
}

/**
 * parse info
 */
export declare interface ParseInfo {

    /**
     * read buffer
     */
    buffer: string;
    /**
     * stream
     */
    stream: string;
    /**
     * last token position
     */
    position: Position;
    /**
     * current parsing position
     */
    currentPosition: Position;
}
