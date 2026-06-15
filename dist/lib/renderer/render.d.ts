import type { AstNode, ErrorDescription, RenderOptions, RenderResult, Token } from "../../@types/index.d.ts";
/**
 * render ast
 * @param data
 * @param options
 * @param mapping
 * @private
 */
export declare function doRender(data: AstNode, options?: RenderOptions, mapping?: {
    mapping: Record<string, string>;
    importMapping: Record<string, Record<string, string>> | null;
} | null): RenderResult;
/**
 * render ast token
 * @param token
 * @param options
 * @private
 */
export declare function renderToken(token: Token, options?: RenderOptions, cache?: {
    [key: string]: any;
}, reducer?: (acc: string, curr: Token) => string, errors?: ErrorDescription[]): string;
/**
 * Remove whitespace tokens that are not needed
 * @param values
 *
 * @internal
 */
export declare function filterValues(values: Token[]): Token[];
