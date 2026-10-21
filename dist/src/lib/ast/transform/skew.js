/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.6.10
	License: MIT
 */
import { identity, multiply } from './utils.js';

function skewX(x, from) {
    const matrix = identity();
    matrix[4] = Math.tan(x);
    return multiply(from, matrix);
}
function skewY(y, from) {
    const matrix = identity();
    matrix[1] = Math.tan(y);
    return multiply(from, matrix);
}
// convert angle to radian
function skew(values, from) {
    const matrix = identity();
    matrix[4] = Math.tan(values[0]);
    if (values.length > 1) {
        matrix[1] = Math.tan(values[1]);
    }
    return multiply(from, matrix);
}

export { skew, skewX, skewY };
