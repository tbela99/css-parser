import type {Position} from "./ast.d.ts";

export declare interface PropertyListOptions {

    removeDuplicateDeclarations?: boolean;
    computeShorthand?: boolean;
}

export declare interface ParseInfo {

    buffer: string;
    stream: string;
    position: Position;
    currentPosition: Position;
}
