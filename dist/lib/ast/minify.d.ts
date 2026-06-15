import type { AstNode, ErrorDescription, MinifyFeatureOptions, ParserOptions } from "../../@types/index.d.ts";
/**
 * apply minification rules to the ast tree
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 *
 * @private
 */
export declare function minify(ast: AstNode, options: ParserOptions | MinifyFeatureOptions, recursive: boolean, errors?: ErrorDescription[], nestingContent?: boolean): AstNode;
/**
 * split selector string
 * @param buffer
 *
 * @internal
 */
export declare function splitRule(buffer: string): string[][];
