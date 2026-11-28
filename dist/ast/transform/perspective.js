/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.3
	License: MIT
 */
import { setIdentity, multiplyInto } from './utils.js';

/**
 * the perspective matrix. the function multiplies the matrix it receives in place: `from = from × perspective`
 */
const matrix = new Float64Array(16);
/**
 * @param x distance, `null` for `none`
 * @param from
 */
function perspective(x, from) {
    setIdentity(matrix);
    matrix[2 * 4 + 3] = x === null ? 0 : x === 0 ? Number.NEGATIVE_INFINITY : -1 / x;
    return multiplyInto(from, matrix, from);
}

export { perspective };
