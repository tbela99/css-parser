/* Version: 1.6.7 - October 13, 2026 17:01:28 */
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
