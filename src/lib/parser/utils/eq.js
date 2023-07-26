export function eq(a, b) {
    if ((typeof a != 'object') || typeof b != 'object') {
        return a === b;
    }
    const k1 = Object.keys(a);
    const k2 = Object.keys(b);
    return k1.length == k2.length &&
        k1.every((key) => {
            return eq(a[key], b[key]);
        });
}
