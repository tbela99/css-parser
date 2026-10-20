/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 1.6.8
	License: MIT
 */
/**
 *
 * @param value
 * @returns
 */
function toBase64(value) {
    let result = '';
    for (const c of new TextEncoder().encode(value)) {
        result += String.fromCharCode(c);
    }
    return btoa(result);
}

export { toBase64 };
