import type { AstNode, ErrorDescription, MinifyFeatureOptions, OptimizedSelector, ParserOptions } from "../../@types/index.d.ts";
/**
 * Apply minification rules to the ast tree
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
 * Optimize selector
 * @param selector
 *
 * @private
 */
export declare function optimizeSelector(selector: string[][]): OptimizedSelector | null;
/**
 * Split selector string
 * @param buffer
 *
 * @internal
 */
export declare function splitRule(buffer: string): string[][];
