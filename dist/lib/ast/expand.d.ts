import type { AstAtRule, AstNode, AstRule, AstStyleSheet } from "../../@types/index.d.ts";
/**
 * expand css nesting ast nodes
 * @param ast
 *
 * @private
 */
export declare function expand(ast: AstStyleSheet | AstAtRule | AstRule): AstNode;
/**
 * replace compound selector
 * @param input
 * @param replace
 */
export declare function replaceCompound(input: string, replace: string): string;
