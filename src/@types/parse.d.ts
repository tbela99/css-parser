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
     * source file or url
     */
    src: string;

    /**
     * read buffer
     */
    buffer: string;
    /**
     * stream
     */
    stream: string;

    /**
     * the accumulated css string
     */
    // acc: string;
    
    /**
     * last token position
     */
    position: Position;
    /**
     * current parsing position
     */
    currentPosition: Position;

    /**
     * offset
     */
    offset: number;

    /**
     * tokenizing time
     */
    time: number;
}
