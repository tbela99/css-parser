import {StringIterableIterator, StringIteratorResult} from "../../@types";

export function stringIterator(str: string, bufferSize: number = 10): StringIterableIterator {

    const iterator : IterableIterator<string> = str[Symbol.iterator]();

    let current: number = 0;
    const prev: number[] = [];

    const iter: StringIterableIterator = <StringIterableIterator>{

        next(count: number = 1): StringIteratorResult {

            const res: StringIteratorResult = {value: '', done: false};

            while (count-- > 0) {

                const result = iterator.next();

                if (!result.done) {

                    prev.push(current);

                    if (bufferSize > 0 && prev.length > bufferSize) {

                        prev.shift();
                    }

                    res.value += result.value;
                    current += result.value.length;
                } else {

                    return res.value === '' ? result : res;
                }
            }

            return res;
        },

        peek(count: number = 1): string {

            let chr: string = '';
            let curr: number = current;

            while (count-- > 0) {

                const codepoint = str.codePointAt(curr);

                if (codepoint == null) {

                    return chr;
                }

                const c: string = String.fromCodePoint(codepoint);

                chr += c;
                curr += c.length;
            }

            return chr;
        },

        prev(count: number = 1): string {

            return prev.slice(-Math.min(count, str.length) - 1, -1).reduce((acc, curr) => acc + String.fromCodePoint(<number>str.codePointAt(curr)), '');
        },

        [Symbol.iterator]() {

            return iter
        }
    };

    return iter;
}