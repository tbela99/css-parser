/**
 *
 * @param fn
 * @returns
 */
export function memoize(fn: Function) {
    const buckets = new Map<number, Map<any, any>>();

    return function (...args: any[]) {
        const n = args.length;
        let bucket = buckets.get(n);
        if (bucket == null) {
            bucket = new Map();
            buckets.set(n, bucket);
        }
        if (n === 1) {
            const key = args[0];
            const value = bucket.get(key);
            if (value != null) return bucket.get(key);
            const result = fn(key);
            bucket.set(key, result);
            return result;
        }

        let node = bucket;
        for (let i = 0; i < n; i++) {
            const key = args[i];
            const next = node.get(key);
            if (next == null) {
                const newNode = new Map();
                node.set(key, newNode);
                node = newNode;
            } else {
                node = next;
            }
        }

        const last = n === 0 ? undefined : args[n - 1];

        const value = node.get(last);
        if (value != null) return value;
        const result = fn(...args);
        node.set(last, result);
        return result;
    };
}
