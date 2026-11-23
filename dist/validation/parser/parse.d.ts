import type { Position, ValidationToken } from "./types.d.ts";
export declare function trimSyntaxArray(tokens: ValidationToken[]): ValidationToken[];
/**
 * tokenize a syntax definition. the characters are scanned by code: a string is allocated for each token only.
 * the positions are tracked as numbers: `position` is the start of the pending token, `currentPosition` the current
 * character (columns are counted in code points, indexes in utf-16 code units)
 * @param syntax
 * @param position
 * @param currentPosition
 */
export declare function tokenizeSyntax(syntax: string, position?: Position, currentPosition?: Position): ValidationToken[];
/**
 * parse a css value definition syntax (webref)
 * @param syntax
 * @returns
 */
export declare function parseSyntax(syntax: string): ValidationToken[];
export declare function renderSyntax(token: ValidationToken, options?: {
    minify?: boolean;
    indent?: number;
}): string;
