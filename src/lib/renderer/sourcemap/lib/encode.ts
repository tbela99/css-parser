// from https://github.com/Rich-Harris/vlq/tree/master
// credit: Rich Harris
const integer_to_char: { [key: number]: string } = {};

let i = 0;

for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=') {
    integer_to_char[i++] = char;
}

export function encode(value: number | number[]) {
    if (typeof value === 'number') {
        return encode_integer(value);
    }

    let result = '';
    for (let i = 0; i < value.length; i += 1) {
        result += encode_integer(value[i]);
    }

    return result;
}

function encode_integer(num: number): string {
    let result = '';

    if (num < 0) {
        num = (-num << 1) | 1;
    } else {
        num <<= 1;
    }

    do {
        let clamped = num & 31;
        num >>>= 5;

        if (num > 0) {
            clamped |= 32;
        }

        result += integer_to_char[clamped];
    } while (num > 0);

    return result;
}