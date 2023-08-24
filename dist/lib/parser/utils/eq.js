function eq(a, b) {
    if (a == null || b == null) {
        return a == b;
    }
    if (typeof a != 'object' || typeof b != 'object') {
        return a === b;
    }
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
        return false;
    }
    if (Array.isArray(a)) {
        if (a.length != b.length) {
            return false;
        }
        let i = 0;
        for (; i < a.length; i++) {
            if (!eq(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }
    const k1 = Object.keys(a);
    const k2 = Object.keys(b);
    if (k1.length != k2.length) {
        return false;
    }
    let key;
    for (key of k1) {
        if (!(key in b) || !eq(a[key], b[key])) {
            return false;
        }
    }
    return true;
}

export { eq };
