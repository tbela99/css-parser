export function dasherize(value: string) {
    return value.replace(/([A-Z])/g, (all, one) => `-${one.toLowerCase()}`);
}

export function camelize(value: string) {
    return value.replace(/-([a-z])/g, (all, one) => one.toUpperCase());
}

export function equalsIgnoreCase(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        let ca = a.charCodeAt(i);
        let cb = b.charCodeAt(i);

        // Normalize A-Z to a-z
        if (ca >= 65 && ca <= 90) ca += 32;
        if (cb >= 65 && cb <= 90) cb += 32;

        if (ca !== cb) return false;
    }
    return true;
}
