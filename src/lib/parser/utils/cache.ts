

/**
 * 
 * @param fn
 * @returns 
 */
export function memoize(fn: Function) {
    const cache = new Map<string, any>();

    return function (...args: any[]) {
        const key = args.flat().join();

        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}