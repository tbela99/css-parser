/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.2.1
	License: MIT
 */
import { setIdentity, multiplyInto } from './utils.js';

/**
 * the skew matrix. the functions multiply the matrix they receive in place: `from = from × skew`. angles in radian
 */
const matrix = new Float64Array(16);
function skewX(x, from) {
    setIdentity(matrix);
    matrix[4] = Math.tan(x);
    return multiplyInto(from, matrix, from);
}
function skewY(y, from) {
    setIdentity(matrix);
    matrix[1] = Math.tan(y);
    return multiplyInto(from, matrix, from);
}
/**
 * @param x
 * @param y ignored if undefined
 * @param from
 */
function skew(x, y, from) {
    setIdentity(matrix);
    matrix[4] = Math.tan(x);
    if (y !== undefined) {
        matrix[1] = Math.tan(y);
    }
    return multiplyInto(from, matrix, from);
}

export { skew, skewX, skewY };
