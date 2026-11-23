import type { PropertyMapType, Token } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
/**
 * check if a token matches a shorthand property type
 * @param arena
 * @param val
 * @param properties
 */
export declare function matchType(arena: AstArena, val: Token, properties: PropertyMapType): boolean;
