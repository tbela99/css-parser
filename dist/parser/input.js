/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.3
	License: MIT
 */
import { nativeBufferClass } from '../printer/writer.js';
import { fromCodes } from './utils/codes.js';

const encoder = new TextEncoder();
/**
 * the code units of a Uint16Array are stored in the platform byte order
 */
const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
const decoder = new TextDecoder();
const empty = new Uint8Array(0);
/**
 * true if the input is an ArrayBuffer or a view of an ArrayBuffer
 * @param input
 */
function isBinaryInput(input) {
    return input instanceof ArrayBuffer || ArrayBuffer.isView(input);
}
/**
 * true if the input is css: a string, an ArrayBuffer or a view of an ArrayBuffer
 * @param input
 */
function isCssInput(input) {
    return typeof input === "string" || isBinaryInput(input);
}
/**
 * the bytes of a binary input
 * @param input
 */
function bytesOf(input) {
    return input instanceof Uint8Array
        ? input
        : input instanceof ArrayBuffer
            ? new Uint8Array(input)
            : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
}
/**
 * the utf-16 code units of a text
 * @param text
 */
function codeUnitsOf(text) {
    const native = nativeBufferClass();
    // node.js: the code units are written by the native encoder (little endian platforms)
    if (native !== null && littleEndian) {
        const buffer = native.allocUnsafeSlow(text.length * 2);
        buffer.write(text, 0, text.length * 2, "utf16le");
        return new Uint16Array(buffer.buffer, buffer.byteOffset, text.length);
    }
    const codes = new Uint16Array(text.length);
    for (let i = 0; i < text.length; i++) {
        codes[i] = text.charCodeAt(i);
    }
    return codes;
}
/**
 * the utf-8 css is read as utf-16 code units when more than 1 byte in 16 is not ascii: the positions of the non
 * ascii characters are recorded, see {@link scanUtf8}
 */
const DENSE_SHIFT = 4;
/**
 * read the bytes of a css that is not ascii, 4 bytes at a time when they are ascii: the positions of the non ascii
 * characters are recorded, they are validated. the text is null when the bytes are read as utf-16 code units:
 *
 * - the bytes are not valid utf-8 (the invalid sequences are replaced by U+FFFD when they are decoded)
 * - they contain characters that are new lines (U+2028, U+2029) or that are lowercased to an ascii letter (KELVIN
 *   SIGN, U+212A)
 * - more than 1 byte in 16 is not ascii
 * @param bytes
 * @param content the decoded text, when it is known
 */
function scanUtf8(bytes, content) {
    const length = bytes.length;
    // the bytes before the first word aligned on 4 bytes are read one at a time
    const base = (4 - (bytes.byteOffset & 3)) & 3;
    const words = base < length
        ? new Uint32Array(bytes.buffer, bytes.byteOffset + base, (length - base) >>> 2)
        : new Uint32Array(0);
    const wordsEnd = base + (words.length << 2);
    const limit = length >>> DENSE_SHIFT;
    const positions = [];
    const deltas = [];
    let delta = 0;
    let i = 0;
    while (i < length) {
        // the ascii words are skipped
        if (i >= base && i < wordsEnd && ((i - base) & 3) === 0) {
            let k = (i - base) >>> 2;
            while (k < words.length && (words[k] & 0x80808080) === 0) {
                k++;
            }
            i = base + (k << 2);
            if (i >= length) {
                break;
            }
        }
        const code = bytes[i];
        if (code < 0x80) {
            i++;
            continue;
        }
        let size;
        if (code >= 0xc2 && code <= 0xdf) {
            if ((bytes[i + 1] & 0xc0) !== 0x80) {
                return null;
            }
            size = 2;
        }
        else if (code >= 0xe0 && code <= 0xef) {
            const next = bytes[i + 1];
            const last = bytes[i + 2];
            if ((next & 0xc0) !== 0x80 ||
                (last & 0xc0) !== 0x80 ||
                (code === 0xe0 && next < 0xa0) ||
                (code === 0xed && next > 0x9f) ||
                // U+2028, U+2029, U+212A
                (code === 0xe2 && ((next === 0x80 && (last === 0xa8 || last === 0xa9)) || (next === 0x84 && last === 0xaa)))) {
                return null;
            }
            size = 3;
        }
        else if (code >= 0xf0 && code <= 0xf4) {
            const next = bytes[i + 1];
            if ((next & 0xc0) !== 0x80 ||
                (bytes[i + 2] & 0xc0) !== 0x80 ||
                (bytes[i + 3] & 0xc0) !== 0x80 ||
                (code === 0xf0 && next < 0x90) ||
                (code === 0xf4 && next > 0x8f)) {
                return null;
            }
            size = 4;
        }
        else {
            return null;
        }
        if (positions.length >= limit) {
            return null;
        }
        // a 4 bytes character is a surrogate pair: 2 code units
        delta += size === 4 ? 2 : size - 1;
        positions.push(i);
        deltas.push(delta);
        i += size;
    }
    return new Utf8Text(bytes, new Int32Array(positions), new Int32Array(deltas), content);
}
/**
 * the text of a utf-8 css that is not ascii, read from its bytes: the tokenizer reads the bytes, the offsets of the
 * tokens are byte offsets. the values of the tokens that are interned as ranges of the source are ascii (see
 * `Tokenizer.internValue()`): {@link charCodeAt} and {@link slice} read the bytes like the methods of a string. the
 * locations of the nodes and the columns of the source maps are utf-16 offsets, see {@link utf16}
 */
class Utf8Text {
    bytes;
    positions;
    deltas;
    decoded;
    /**
     * @param bytes the valid utf-8 bytes of the css
     * @param positions the offsets of the non ascii characters, in increasing order
     * @param deltas the number of bytes minus the number of utf-16 code units of the non ascii characters, up to the
     * character at the same index in the positions (included)
     * @param decoded the text of the css, null when it is decoded when it is read (see {@link content})
     */
    constructor(bytes, positions = new Int32Array(0), deltas = new Int32Array(0), decoded = null) {
        this.bytes = bytes;
        this.positions = positions;
        this.deltas = deltas;
        this.decoded = decoded;
    }
    /**
     * the text of the bytes of a utf-8 css (see `StringTable.import()`): the positions of the non ascii characters are
     * computed again
     * @param bytes
     */
    static from(bytes) {
        return scanUtf8(bytes, null) ?? new Utf8Text(bytes);
    }
    /**
     * true if the bytes are ascii
     */
    get isAscii() {
        return this.positions.length === 0;
    }
    /**
     * the number of bytes
     */
    get length() {
        return this.bytes.length;
    }
    /**
     * the byte at an offset, NaN after the end
     * @param offset
     */
    charCodeAt(offset) {
        return this.bytes[offset] ?? NaN;
    }
    /**
     * the string of a range of ascii bytes
     * @param start
     * @param end
     */
    slice(start, end) {
        return fromCodes(this.bytes, start, end);
    }
    /**
     * the text of the css
     */
    get content() {
        return (this.decoded ??= decoder.decode(this.bytes));
    }
    /**
     * index of the first non ascii character at or after an offset (the number of non ascii characters before it)
     * @param offset
     */
    search(offset) {
        const positions = this.positions;
        let low = 0;
        let high = positions.length;
        while (low < high) {
            const middle = (low + high) >>> 1;
            if (positions[middle] < offset) {
                low = middle + 1;
            }
            else {
                high = middle;
            }
        }
        return low;
    }
    /**
     * true if a range of the bytes has non ascii characters
     * @param start
     * @param end
     */
    hasNonAscii(start, end) {
        const index = this.search(start);
        return index < this.positions.length && this.positions[index] < end;
    }
    /**
     * the utf-16 offset of a byte offset (the offset of a character)
     * @param offset
     */
    utf16(offset) {
        const index = this.search(offset);
        return index === 0 ? offset : offset - this.deltas[index - 1];
    }
}
/**
 * convert the css input to code units: the tokenizer reads the code units.
 *
 * - an ascii input is read from its bytes: the code units are the bytes
 * - a utf-8 input is read from its bytes (the text is a {@link Utf8Text}): the input is not decoded, the offsets of
 *   the tokens are byte offsets. a string is encoded
 * - the inputs that are not valid utf-8, or that contain U+2028, U+2029 or U+212A, are decoded to utf-16 code units:
 *   the positions of the tokens are utf-16 positions, like the positions in a string
 * @param input
 */
function toCodeUnits(input) {
    if (input == null || input === "") {
        return { codes: empty, text: "" };
    }
    if (typeof input === "string") {
        // an ascii string has a byte for each code unit: the encoded string is the code units
        const bytes = encoder.encode(input);
        if (bytes.length === input.length) {
            return { codes: bytes, text: input };
        }
        const text = scanUtf8(bytes, input);
        return text !== null ? { codes: bytes, text } : { codes: codeUnitsOf(input), text: input };
    }
    let bytes = bytesOf(input);
    // the byte order mark is removed, like the decoder does
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        bytes = bytes.subarray(3);
    }
    const text = scanUtf8(bytes, null);
    if (text === null) {
        const decoded = decoder.decode(bytes);
        return { codes: codeUnitsOf(decoded), text: decoded };
    }
    // ascii
    if (text.isAscii) {
        return { codes: bytes, text: decoder.decode(bytes) };
    }
    return { codes: bytes, text };
}
/**
 * the size of the css of the streams, in bytes, when it is known (a file, a response with a content length)
 */
const streamSizes = new WeakMap();
/**
 * record the size of the css of a stream, in bytes: the parser allocates the code units and the arena once, like for
 * an ArrayBuffer, instead of growing them as the stream is read. 0: the size is not known
 * @param stream
 * @param size
 */
function setStreamSize(stream, size) {
    if (size > 0) {
        streamSizes.set(stream, size);
    }
    return stream;
}
/**
 * the size of the css of a stream, in bytes, see {@link setStreamSize}. 0: the size is not known
 * @param stream
 */
function getStreamSize(stream) {
    return stream == null ? 0 : (streamSizes.get(stream) ?? 0);
}
/**
 * the size of the body of a response: its content length, 0 when it is not known or when the body is compressed (the
 * content length is the size of the compressed body)
 * @param response
 */
function responseSize(response) {
    if (response.headers.get("content-encoding") != null) {
        return 0;
    }
    const length = Number(response.headers.get("content-length"));
    return Number.isFinite(length) && length > 0 ? length : 0;
}

export { Utf8Text, getStreamSize, isBinaryInput, isCssInput, responseSize, setStreamSize, toCodeUnits };
