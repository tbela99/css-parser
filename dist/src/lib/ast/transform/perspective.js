/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { identity, multiply } from './utils.js';

function perspective(x, from) {
    const matrix = identity();
    matrix[2 * 4 + 3] = x == "none" ? 0 : x == 0 ? Number.NEGATIVE_INFINITY : -1 / x;
    return multiply(from, matrix);
}

export { perspective };
