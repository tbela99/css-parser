/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.6.10
	License: MIT
 */
import { identity, multiply } from './utils.js';

function perspective(x, from) {
    const matrix = identity();
    // @ts-ignore
    matrix[2 * 4 + 3] = typeof x == "object" && x.val == "none" ? 0 : x == 0 ? Number.NEGATIVE_INFINITY : -1 / x;
    return multiply(from, matrix);
}

export { perspective };
