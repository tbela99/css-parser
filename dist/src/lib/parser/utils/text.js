/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0
	License: MIT
 */
/**
 *
 * @param value
 * @returns
 */
function dasherize(value) {
    return value.replace(/[A-Z]/g, (one) => `-${one.toLowerCase()}`);
}
/**
 *
 * @param value
 * @returns
 */
function camelize(value) {
    return value.replace(/-[a-z]/g, (match) => match[1].toUpperCase());
}
/**
 * lowercase string, like String.prototype.toLowerCase(). the string is returned when it has no ascii uppercase and
 * no non ascii character: no new string is created
 * @param value
 */
function lowercase(value) {
    for (let i = 0; i < value.length; i++) {
        const code = value.charCodeAt(i);
        if ((code >= 65 && code <= 90) || code > 0x7f) {
            return value.toLowerCase();
        }
    }
    return value;
}
/**
 *
 * @param a
 * @param b
 * @returns
 */
function equalsIgnoreCase(a, b) {
    if (a.length !== b.length)
        return false;
    let ca;
    let cb;
    for (let i = 0; i < a.length; i++) {
        ca = a.charCodeAt(i);
        cb = b.charCodeAt(i);
        // Normalize A-Z to a-z
        if (ca >= 65 && ca <= 90)
            ca += 32;
        if (cb >= 65 && cb <= 90)
            cb += 32;
        if (ca !== cb)
            return false;
    }
    return true;
}

export { camelize, dasherize, equalsIgnoreCase, lowercase };
