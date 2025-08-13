import { identity, multiply } from './utils.js';

/**
 * angle in radian
 * @param angle
 * @param x
 * @param y
 * @param z
 * @param from
 */
function rotate3D(angle, x, y, z, from) {
    const matrix = identity();
    const sc = Math.sin(angle / 2) * Math.cos(angle / 2);
    const sq = Math.sin(angle / 2) * Math.sin(angle / 2);
    const norm = Math.sqrt(x * x + y * y + z * z);
    const unit = norm === 0 ? 0 : 1 / norm;
    x *= unit;
    y *= unit;
    z *= unit;
    matrix[0 * 4 + 0] = 1 - 2 * (y * y + z * z) * sq;
    matrix[0 * 4 + 1] = 2 * (x * y * sq + z * sc);
    matrix[0 * 4 + 2] = 2 * (x * z * sq - y * sc);
    matrix[1 * 4 + 0] = 2 * (x * y * sq - z * sc);
    matrix[1 * 4 + 1] = 1 - 2 * (x * x + z * z) * sq;
    matrix[1 * 4 + 2] = 2 * (y * z * sq + x * sc);
    matrix[2 * 4 + 0] = 2 * (x * z * sq + y * sc);
    matrix[2 * 4 + 1] = 2 * (y * z * sq - x * sc);
    matrix[2 * 4 + 2] = 1 - 2 * (x * x + y * y) * sq;
    return multiply(from, matrix);
}
function rotate(angle, from) {
    const matrix = identity();
    matrix[0 * 4 + 0] = Math.cos(angle);
    matrix[0 * 4 + 1] = Math.sin(angle);
    matrix[1 * 4 + 0] = -Math.sin(angle);
    matrix[1 * 4 + 1] = Math.cos(angle);
    return multiply(from, matrix);
}

export { rotate, rotate3D };
