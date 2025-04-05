import { identity, multiply } from './utils.js';

function translateX(x, from) {
    const matrix = identity();
    matrix[3][0] = x;
    return multiply(from, matrix);
}
function translateY(y, from) {
    const matrix = identity();
    matrix[3][1] = y;
    return multiply(from, matrix);
}
function translateZ(z, from) {
    const matrix = identity();
    matrix[3][2] = z;
    return multiply(from, matrix);
}
function translate(translate, from) {
    const matrix = identity();
    matrix[3][0] = translate[0];
    matrix[3][1] = translate[1] ?? 0;
    matrix[3][2] = translate[2] ?? 0;
    return multiply(from, matrix);
}

export { translate, translateX, translateY, translateZ };
