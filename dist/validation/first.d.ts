/**
 * First token sets of the validation syntaxes.
 *
 * The alternatives of a syntax (`<length> | auto | <color>`) and the operands of the unordered syntaxes (`||`, `&&`)
 * were matched one after the other, in order, until one of them matched. The first token of a value already tells which
 * alternatives may match: `auto` can only match the `auto` keyword and the syntaxes that accept any identifier, `10px`
 * the syntaxes that accept a length. The first token set of a syntax is computed once, from the syntax and from the
 * syntaxes it references (`<'border-width'>`, `<line-width>`, ...): the references are resolved when the set is
 * computed, they do not cost anything when a value is matched. The alternatives of a syntax are indexed by the first
 * token they accept: the alternatives that cannot match a token are found with a hash lookup and are not matched.
 *
 * The sets over-approximate the tokens accepted by the matcher: a syntax whose first tokens are not known exactly (a
 * built-in type with a complex check: `<declaration-value>`, `<an+b>`, the selectors, ...) accepts any token. The
 * tokens that may match any syntax (`var()`, `env()`, the math functions, the css wide keywords) are not looked up:
 * all the alternatives are matched. A syntax that may match no token is always matched.
 *
 * @module
 * @internal
 */
import type { Token } from "../@types/index.d.ts";
import type { AstArena } from "../ast/arena.ts";
import type { ValidationToken } from "./parser/types.d.ts";
/**
 * true if the syntax may match no token: `<a>?`, `<a>*`, `[ <a>? <b>? ]`, `[ [ and <a> ]* | [ or <a> ]* ]`
 * @param syntax
 */
export declare function isNullable(syntax: ValidationToken): boolean;
/**
 * the alternatives of a syntax (`<a> | <b> | <c>`) that may match the first token of a value, in order. the other
 * alternatives cannot match the value. null when all the alternatives may match
 * @param arena
 * @param alternatives
 * @param token the first token of the value
 */
export declare function matchingAlternatives(arena: AstArena, alternatives: ValidationToken[][], token: Token | null): number[] | null;
/**
 * true if a sequence of syntaxes may match tokens starting with a token. a sequence that does not accept the token
 * matches no token
 * @param arena
 * @param syntaxes
 * @param token
 */
export declare function mayStartWith(arena: AstArena, syntaxes: ValidationToken[], token: Token | null): boolean;
