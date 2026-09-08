
/**
 * 
 * @param value 
 * @returns 
 */
export function toBase64(value: string) {
    
    let result: string = '';

    for (const c of new TextEncoder().encode(value)) {
        result += String.fromCharCode(c);
    }

    return btoa(result);
}