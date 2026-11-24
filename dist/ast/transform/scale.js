/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.1
	License: MIT
 */
import { setIdentity, multiplyInto } from './utils.js';

/**
 * the scale matrix. the functions multiply the matrix they receive in place: `from = from × scale`
 */
const matrix = new Float64Array(16);
function scaleX(x, from) {
    setIdentity(matrix);
    matrix[0] = x;
    return multiplyInto(from, matrix, from);
}
function scaleY(y, from) {
    setIdentity(matrix);
    matrix[4 + 1] = y;
    return multiplyInto(from, matrix, from);
}
function scaleZ(z, from) {
    setIdentity(matrix);
    matrix[2 * 4 + 2] = z;
    return multiplyInto(from, matrix, from);
}
function scale(x, y, from) {
    setIdentity(matrix);
    matrix[0] = x;
    matrix[4 + 1] = y;
    return multiplyInto(from, matrix, from);
}
function scale3d(x, y, z, from) {
    setIdentity(matrix);
    matrix[0] = x;
    matrix[4 + 1] = y;
    matrix[2 * 4 + 2] = z;
    return multiplyInto(from, matrix, from);
}

export { scale, scale3d, scaleX, scaleY, scaleZ };
