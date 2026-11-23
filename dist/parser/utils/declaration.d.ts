import type { AstDeclaration, AstNode, ErrorDescription, ParserOptions, Token } from "../../../@types/index.d.ts";
import { type AstArena } from "../../ast/arena.ts";
/**
 * Parse declaration
 * @param arena
 * @param tokens
 * @param parent parent node id or at-rule token
 * @param options
 * @param errors
 */
export declare function parseDeclaration(arena: AstArena, tokens: Token[], parent: AstNode | Token | null, options: ParserOptions, errors: ErrorDescription[]): AstDeclaration;
