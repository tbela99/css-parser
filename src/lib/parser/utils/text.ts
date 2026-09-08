/**
 * 
 * @param value 
 * @returns 
 */
export function dasherize(value: string) {
    return value.replace(/([A-Z])/g, (all, one) => `-${one.toLowerCase()}`);
}

/**
 * 
 * @param value 
 * @returns 
 */
export function camelize(value: string) {
    return value.replace(/-([a-z])/g, (all, one) => one.toUpperCase());
}

/**
 * 
 * @param a 
 * @param b 
 * @returns 
 */
export function equalsIgnoreCase(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    let ca: number;
    let cb: number;
    for (let i = 0; i < a.length; i++) {
         ca = a.charCodeAt(i);
         cb = b.charCodeAt(i);

        // Normalize A-Z to a-z
        if (ca >= 65 && ca <= 90) ca += 32;
        if (cb >= 65 && cb <= 90) cb += 32;

        if (ca !== cb) return false;
    }
    return true;
}
