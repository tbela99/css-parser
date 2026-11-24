/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.1
	License: MIT
 */
import { setIdentity, multiplyInto } from './utils.js';

/**
 * the rotation matrix. the functions multiply the matrix they receive in place: `from = from × rotation`
 */
const matrix = new Float64Array(16);
/**
 * angle in radian
 * @param angle
 * @param x
 * @param y
 * @param z
 * @param from
 */
function rotate3D(angle, x, y, z, from) {
    setIdentity(matrix);
    const sc = Math.sin(angle / 2) * Math.cos(angle / 2);
    const sq = Math.sin(angle / 2) * Math.sin(angle / 2);
    const norm = Math.sqrt(x * x + y * y + z * z);
    const unit = norm === 0 ? 0 : 1 / norm;
    x *= unit;
    y *= unit;
    z *= unit;
    matrix[0] = 1 - 2 * (y * y + z * z) * sq;
    matrix[1] = 2 * (x * y * sq + z * sc);
    matrix[2] = 2 * (x * z * sq - y * sc);
    matrix[4] = 2 * (x * y * sq - z * sc);
    matrix[4 + 1] = 1 - 2 * (x * x + z * z) * sq;
    matrix[4 + 2] = 2 * (y * z * sq + x * sc);
    matrix[2 * 4] = 2 * (x * z * sq + y * sc);
    matrix[2 * 4 + 1] = 2 * (y * z * sq - x * sc);
    matrix[2 * 4 + 2] = 1 - 2 * (x * x + y * y) * sq;
    return multiplyInto(from, matrix, from);
}
/**
 * angle in radian
 * @param angle
 * @param from
 */
function rotate(angle, from) {
    setIdentity(matrix);
    matrix[0] = Math.cos(angle);
    matrix[1] = Math.sin(angle);
    matrix[4] = -Math.sin(angle);
    matrix[4 + 1] = Math.cos(angle);
    return multiplyInto(from, matrix, from);
}

export { rotate, rotate3D };
