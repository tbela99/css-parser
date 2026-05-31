import type { Position, ValidationToken } from "./types.d.ts";
export declare function trimSyntaxArray(tokens: ValidationToken[]): ValidationToken[];
export declare function tokenizeSyntax(syntax: string, position?: Position, currentPosition?: Position): Generator<ValidationToken>;
export declare function parseSyntax(syntax: string): ValidationToken[];
export declare function renderSyntax(token: ValidationToken, options?: {
    minify?: boolean;
    indent?: number;
}): string;
