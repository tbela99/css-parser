export declare class IterableWeakSet<T> {
    #private;
    constructor(iterable?: Iterable<any>);
    has(value: any): boolean;
    delete(value: any): boolean;
    add(value: any): this;
    [Symbol.iterator](): IterableIterator<any>;
}
