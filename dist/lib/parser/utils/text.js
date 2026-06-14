function dasherize(value) {
    return value.replace(/([A-Z])/g, (all, one) => `-${one.toLowerCase()}`);
}
function camelize(value) {
    return value.replace(/-([a-z])/g, (all, one) => one.toUpperCase());
}
function equalsIgnoreCase(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        let ca = a.charCodeAt(i);
        let cb = b.charCodeAt(i);
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

export { camelize, dasherize, equalsIgnoreCase };
