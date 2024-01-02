export declare class IterableWeakMap<K, V> {
    #private;
    constructor(iterable?: Iterable<[any, V]>);
    has(key: any): boolean;
    set(key: any, value: V): this;
    get(key: any): V | undefined;
    delete(key: any): boolean;
    [Symbol.iterator](): IterableIterator<[K, V]>;
}
