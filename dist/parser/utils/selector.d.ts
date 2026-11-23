import type { AstKeyframesRule, AstNode, AstRule, Token, ErrorDescription, ParserOptions } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 * parse selector
 * @param arena
 * @param tokens
 * @param context parent node id
 * @param options
 * @param errors
 */
export declare function parseSelector(arena: AstArena, tokens: Token[], context: AstNode | null, options: ParserOptions, errors: ErrorDescription[]): AstRule | AstKeyframesRule;
