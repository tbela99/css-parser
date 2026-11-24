/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.0
	License: MIT
 */
import { setIdentity, multiplyInto } from './utils.js';

/**
 * the translation matrix. the functions multiply the matrix they receive in place: `from = from × translation`
 */
const matrix = new Float64Array(16);
function translateX(x, from) {
    setIdentity(matrix);
    matrix[3 * 4] = x;
    return multiplyInto(from, matrix, from);
}
function translateY(y, from) {
    setIdentity(matrix);
    matrix[3 * 4 + 1] = y;
    return multiplyInto(from, matrix, from);
}
function translateZ(z, from) {
    setIdentity(matrix);
    matrix[3 * 4 + 2] = z;
    return multiplyInto(from, matrix, from);
}
/**
 * @param x
 * @param y 0 if undefined
 * @param from
 */
function translate(x, y, from) {
    setIdentity(matrix);
    matrix[3 * 4] = x;
    matrix[3 * 4 + 1] = y ?? 0;
    return multiplyInto(from, matrix, from);
}
/**
 * @param x
 * @param y NaN if undefined
 * @param z NaN if undefined
 * @param from
 */
function translate3d(x, y, z, from) {
    setIdentity(matrix);
    matrix[3 * 4] = x;
    // @ts-ignore undefined is stored as NaN
    matrix[3 * 4 + 1] = y;
    // @ts-ignore undefined is stored as NaN
    matrix[3 * 4 + 2] = z;
    return multiplyInto(from, matrix, from);
}

export { translate, translate3d, translateX, translateY, translateZ };
