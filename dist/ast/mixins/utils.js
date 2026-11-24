/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.1
	License: MIT
 */
import { EnumToken } from '../types.js';

/**
 * true if the node is a `@mixin` or a `@function` rule, or is located inside one of them.
 * the body of a mixin or a custom function is a template: it is evaluated when the mixin is applied or the function is
 * called, its variables are private variables
 * @param arena
 * @param node
 */
function isInTemplate(arena, node) {
    while (node !== 0) {
        if (arena.dataTypes[node] === EnumToken.AtRuleNodeType &&
            (arena.stringEquals(arena.name[node], "mixin") || arena.stringEquals(arena.name[node], "function"))) {
            return true;
        }
        node = arena.parents[node];
    }
    return false;
}
/**
 * move the last `result` descriptor of a custom function after its conditional rules: there is no early return.
 * `result: 16px; @media (...) { result: 20px }` -> `@media (...) { result: 20px } result: 16px`.
 * the conditional rules are never removed
 * @param arena
 * @param node `@function` rule
 */
function moveResult(arena, node) {
    let last = arena.lastChild[node];
    // the last result
    while (last !== 0 &&
        !(arena.dataTypes[last] === EnumToken.DeclarationNodeType && arena.stringEquals(arena.name[last], "result"))) {
        last = arena.previousSibling[last];
    }
    if (last === 0) {
        return;
    }
    for (let next = arena.nextSibling[last]; next !== 0; next = arena.nextSibling[next]) {
        if (arena.dataTypes[next] === EnumToken.AtRuleNodeType) {
            arena.detach(last);
            arena.appendChild(node, last);
            return;
        }
    }
}

export { isInTemplate, moveResult };
