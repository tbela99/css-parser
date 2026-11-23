import type { AstArena } from "../../ast/arena.ts";
/**
 *
 * @param a
 * @param b
 * @returns
 */
export declare function eq(a: any, b: any): boolean;
/**
 * structural equality of two tokens (source location is ignored): same type, name, values, tokens and children.
 * same result as comparing their {@link nodeSignature}
 * @param arena
 * @param a
 * @param b
 */
export declare function eqToken(arena: AstArena, a: number, b: number): boolean;
