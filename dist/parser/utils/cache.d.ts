/**
 * memoize a function by its arguments (compared with `Map` semantics). the `null` and `undefined` results are cached
 * too: an unknown name is looked up once
 * @param fn
 * @returns
 */
export declare function memoize(fn: Function): (...args: any[]) => any;
