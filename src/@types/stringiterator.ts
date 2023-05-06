export interface StringIteratorResult {
    value: string,
    done: boolean
}

export interface StringIterableIterator {

    next(count?: number): StringIteratorResult;

    peek(count?: number): string;

    prev(count?: number): string;
}