/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.6.9
	License: MIT
 */
import { identity, multiply } from './utils.js';

function scaleX(x, from) {
    const matrix = identity();
    matrix[0] = x;
    return multiply(from, matrix);
}
function scaleY(y, from) {
    const matrix = identity();
    matrix[4 + 1] = y;
    return multiply(from, matrix);
}
function scaleZ(z, from) {
    const matrix = identity();
    matrix[2 * 4 + 2] = z;
    return multiply(from, matrix);
}
function scale(x, y, from) {
    const matrix = identity();
    matrix[0] = x;
    matrix[4 + 1] = y;
    return multiply(from, matrix);
}
function scale3d(x, y, z, from) {
    const matrix = identity();
    matrix[0] = x;
    matrix[4 + 1] = y;
    matrix[2 * 4 + 2] = z;
    return multiply(from, matrix);
}

export { scale, scale3d, scaleX, scaleY, scaleZ };
