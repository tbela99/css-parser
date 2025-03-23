function translateX(x, matrix) {
    matrix[3][0] = x;
    return matrix;
}
function translateY(y, matrix) {
    matrix[3][1] = y;
    return matrix;
}
function translateZ(z, matrix) {
    matrix[3][2] = z;
    return matrix;
}
function translate(translate, matrix) {
    matrix[3][0] = translate[0];
    matrix[3][1] = translate[1] ?? 0;
    matrix[3][2] = translate[2] ?? 0;
    return matrix;
}

export { translate, translateX, translateY, translateZ };
