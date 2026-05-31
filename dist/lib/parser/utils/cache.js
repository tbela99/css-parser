/**
 *
 * @param fn
 * @returns
 */
function memoize(fn) {
    const cache = new Map();
    return function (...args) {
        const key = args.join();
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}

export { memoize };
