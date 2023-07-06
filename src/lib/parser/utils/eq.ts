export function eq(a: { [key: string]: any }, b: { [key: string]: any }): boolean {

    if ((typeof a != 'object') || typeof b != 'object') {

        return a === b;
    }

    const k1: string[] = Object.keys(a);
    const k2: string[] = Object.keys(b);

    return k1.length == k2.length &&
        k1.every((key) => {

            return eq(a[key], b[key])
        });
}