/**
 * helpers shared by the minification features
 *
 * @module
 * @internal
 */
import type { AstNode } from "../../../@types/index.js";
import type { AstArena } from "../arena.ts";
/**
 * true if the node is a `@mixin` or a `@function` rule, or is located inside one of them.
 * the body of a mixin or a custom function is a template: it is evaluated when the mixin is applied or the function is
 * called, its variables are private variables
 * @param arena
 * @param node
 */
export declare function isInTemplate(arena: AstArena, node: AstNode): boolean;
/**
 * move the last `result` descriptor of a custom function after its conditional rules: there is no early return.
 * `result: 16px; @media (...) { result: 20px }` -> `@media (...) { result: 20px } result: 16px`.
 * the conditional rules are never removed
 * @param arena
 * @param node `@function` rule
 */
export declare function moveResult(arena: AstArena, node: AstNode): void;
