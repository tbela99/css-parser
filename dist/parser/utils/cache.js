/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.2
	License: MIT
 */
/**
 * memoize a function by its arguments (compared with `Map` semantics). the `null` and `undefined` results are cached
 * too: an unknown name is looked up once
 * @param fn
 * @returns
 */
function memoize(fn) {
    const buckets = new Map();
    return function (...args) {
        const n = args.length;
        let bucket = buckets.get(n);
        if (bucket == null) {
            bucket = new Map();
            buckets.set(n, bucket);
        }
        if (n === 1) {
            const key = args[0];
            let value = bucket.get(key);
            if (value === undefined && !bucket.has(key)) {
                value = fn(key);
                bucket.set(key, value);
            }
            return value;
        }
        // the maps of the first arguments, then the results by last argument
        let node = bucket;
        for (let i = 0; i < n - 1; i++) {
            const key = args[i];
            let next = node.get(key);
            if (next == null) {
                next = new Map();
                node.set(key, next);
            }
            node = next;
        }
        const last = n === 0 ? undefined : args[n - 1];
        let value = node.get(last);
        if (value === undefined && !node.has(last)) {
            value = fn(...args);
            node.set(last, value);
        }
        return value;
    };
}

export { memoize };
