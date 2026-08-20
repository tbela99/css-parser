// from https://github.com/Rich-Harris/vlq/tree/master
// credit: Rich Harris
const integer_to_char: { [key: number]: string } = {};
const char_to_integer: { [key: string]: number } = {};
let i = 0;

for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=') {
    char_to_integer[char] = i;
    integer_to_char[i++] = char;
}

/** 
 * @param {string} str 
 */
export function decode(str: string) {
	/** @type {number[]} */
	let result = [];

	let shift = 0;
	let value = 0;

	for (let i = 0; i < str.length; i += 1) {
		let integer = char_to_integer[str[i]];

		// if (integer === undefined) {
		// 	throw new Error('Invalid character (' + str[i] + ')');
		// }

		const has_continuation_bit = integer & 32;

		integer &= 31;
		value += integer << shift;

		if (has_continuation_bit) {
			shift += 5;
		} else {
			const should_negate = value & 1;
			value >>>= 1;

			if (should_negate) {
				result.push(value === 0 ? -0x80000000 : -value);
			} else {
				result.push(value);
			}

			// reset
			value = shift = 0;
		}
	}

	return result;
}

/**
 * 
 * @param value 
 * @returns 
 */
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