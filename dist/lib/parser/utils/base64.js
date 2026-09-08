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
