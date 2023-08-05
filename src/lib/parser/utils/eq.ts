export function eq(a: { [key: string]: any }, b: { [key: string]: any }): boolean {

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

    const k1: string[] = Object.keys(a);
    const k2: string[] = Object.keys(b);

    if (k1.length != k2.length) {

        return false;
    }

    let key;

    for (key of k1) {

        if (!eq(a[key], b[key])) {

            return false;
        }
    }

    return true;
}