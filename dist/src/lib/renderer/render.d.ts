import { AstNode, ErrorDescription, RenderOptions, RenderResult, Token } from "../../@types";
export declare const colorsFunc: string[];
export declare function reduceNumber(val: string | number): string;
export declare function doRender(data: AstNode, options?: RenderOptions): RenderResult;
export declare function renderToken(token: Token, options?: RenderOptions, cache?: {
    [key: string]: any;
}, reducer?: (acc: string, curr: Token) => string, errors?: ErrorDescription[]): string;
