import { AstNode, AstRule, ErrorDescription, MinifyOptions, ParserOptions } from "../../@types";
export declare const combinators: string[];
export declare function minify(ast: AstNode, options?: ParserOptions | MinifyOptions, recursive?: boolean, errors?: ErrorDescription[], nestingContent?: boolean, context?: {
    [key: string]: any;
}): AstNode;
export declare function reduceSelector(selector: string[][]): {
    match: boolean;
    optimized: string[];
    selector: string[][];
    reducible: boolean;
} | null;
export declare function hasDeclaration(node: AstRule): boolean;
export declare function splitRule(buffer: string): string[][];
