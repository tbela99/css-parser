import { type NativeBufferClass, nativeBufferClass } from "../printer/writer.ts";
import { fromCodes } from "./utils/codes.ts";

/**
 * css input: the utf-8 encoded css in an ArrayBuffer or in a view of an ArrayBuffer (Uint8Array, Buffer), the preferred
 * input, or a string
 */
export type CssInput = string | ArrayBuffer | ArrayBufferView;

/**
 * the css read by the tokenizer: the code units of the css and its text
 */
export interface CssCodeUnits {
    /**
     * the code units read by the tokenizer:
     *
     * - ascii css: the bytes of the input, without copy
     * - utf-8 css (the {@link text} is a {@link Utf8Text}): the utf-8 bytes of the input, without copy. the offsets of
     *   the tokens are byte offsets
     * - otherwise: the utf-16 code units of the text
     */
    codes: Uint8Array | Uint16Array;
    /**
     * the text the values of the tokens are read from, at the offsets of the code units: the css, or the bytes of a
     * utf-8 css
     */
    text: SourceText;
}

/**
 * the text of a source: the values of the tokens are ranges of the text. a string, or the bytes of a utf-8 css
 */
export type SourceText = string | Utf8Text;

const encoder: TextEncoder = new TextEncoder();
/**
 * the code units of a Uint16Array are stored in the platform byte order
 */
const littleEndian: boolean = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
const decoder: TextDecoder = new TextDecoder();
const empty: Uint8Array = new Uint8Array(0);

/**
 * true if the input is an ArrayBuffer or a view of an ArrayBuffer
 * @param input
 */
export function isBinaryInput(input: unknown): input is ArrayBuffer | ArrayBufferView {
    return input instanceof ArrayBuffer || ArrayBuffer.isView(input);
}

/**
 * true if the input is css: a string, an ArrayBuffer or a view of an ArrayBuffer
 * @param input
 */
export function isCssInput(input: unknown): input is CssInput {
    return typeof input === "string" || isBinaryInput(input);
}

/**
 * the bytes of a binary input
 * @param input
 */
function bytesOf(input: ArrayBuffer | ArrayBufferView): Uint8Array {
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
function codeUnitsOf(text: string): Uint16Array {
    const native: NativeBufferClass | null = nativeBufferClass();

    // node.js: the code units are written by the native encoder (little endian platforms)
    if (native !== null && littleEndian) {
        const buffer = native.allocUnsafeSlow(text.length * 2);

        buffer.write(text, 0, text.length * 2, "utf16le");
        return new Uint16Array(buffer.buffer, buffer.byteOffset, text.length);
    }

    const codes: Uint16Array = new Uint16Array(text.length);

    for (let i: number = 0; i < text.length; i++) {
        codes[i] = text.charCodeAt(i);
    }

    return codes;
}

/**
 * the utf-8 css is read as utf-16 code units when more than 1 byte in 16 is not ascii: the positions of the non
 * ascii characters are recorded, see {@link scanUtf8}
 */
const DENSE_SHIFT: number = 4;

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
function scanUtf8(bytes: Uint8Array, content: string | null): Utf8Text | null {
    const length: number = bytes.length;
    // the bytes before the first word aligned on 4 bytes are read one at a time
    const base: number = (4 - (bytes.byteOffset & 3)) & 3;
    const words: Uint32Array =
        base < length
            ? new Uint32Array(bytes.buffer, bytes.byteOffset + base, (length - base) >>> 2)
            : new Uint32Array(0);
    const wordsEnd: number = base + (words.length << 2);
    const limit: number = length >>> DENSE_SHIFT;
    const positions: number[] = [];
    const deltas: number[] = [];
    let delta: number = 0;
    let i: number = 0;

    while (i < length) {
        // the ascii words are skipped
        if (i >= base && i < wordsEnd && ((i - base) & 3) === 0) {
            let k: number = (i - base) >>> 2;

            while (k < words.length && (words[k] & 0x80808080) === 0) {
                k++;
            }

            i = base + (k << 2);

            if (i >= length) {
                break;
            }
        }

        const code: number = bytes[i];

        if (code < 0x80) {
            i++;
            continue;
        }

        let size: number;

        if (code >= 0xc2 && code <= 0xdf) {
            if ((bytes[i + 1] & 0xc0) !== 0x80) {
                return null;
            }

            size = 2;
        } else if (code >= 0xe0 && code <= 0xef) {
            const next: number = bytes[i + 1];
            const last: number = bytes[i + 2];

            if (
                (next & 0xc0) !== 0x80 ||
                (last & 0xc0) !== 0x80 ||
                (code === 0xe0 && next < 0xa0) ||
                (code === 0xed && next > 0x9f) ||
                // U+2028, U+2029, U+212A
                (code === 0xe2 && ((next === 0x80 && (last === 0xa8 || last === 0xa9)) || (next === 0x84 && last === 0xaa)))
            ) {
                return null;
            }

            size = 3;
        } else if (code >= 0xf0 && code <= 0xf4) {
            const next: number = bytes[i + 1];

            if (
                (next & 0xc0) !== 0x80 ||
                (bytes[i + 2] & 0xc0) !== 0x80 ||
                (bytes[i + 3] & 0xc0) !== 0x80 ||
                (code === 0xf0 && next < 0x90) ||
                (code === 0xf4 && next > 0x8f)
            ) {
                return null;
            }

            size = 4;
        } else {
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
export class Utf8Text {
    /**
     * @param bytes the valid utf-8 bytes of the css
     * @param positions the offsets of the non ascii characters, in increasing order
     * @param deltas the number of bytes minus the number of utf-16 code units of the non ascii characters, up to the
     * character at the same index in the positions (included)
     * @param decoded the text of the css, null when it is decoded when it is read (see {@link content})
     */
    constructor(
        readonly bytes: Uint8Array,
        private readonly positions: Int32Array = new Int32Array(0),
        private readonly deltas: Int32Array = new Int32Array(0),
        private decoded: string | null = null,
    ) {}

    /**
     * the text of the bytes of a utf-8 css (see `StringTable.import()`): the positions of the non ascii characters are
     * computed again
     * @param bytes
     */
    static from(bytes: Uint8Array): Utf8Text {
        return scanUtf8(bytes, null) ?? new Utf8Text(bytes);
    }

    /**
     * true if the bytes are ascii
     */
    get isAscii(): boolean {
        return this.positions.length === 0;
    }

    /**
     * the number of bytes
     */
    get length(): number {
        return this.bytes.length;
    }

    /**
     * the byte at an offset, NaN after the end
     * @param offset
     */
    charCodeAt(offset: number): number {
        return this.bytes[offset] ?? NaN;
    }

    /**
     * the string of a range of ascii bytes
     * @param start
     * @param end
     */
    slice(start: number, end: number): string {
        return fromCodes(this.bytes, start, end);
    }

    /**
     * the text of the css
     */
    get content(): string {
        return (this.decoded ??= decoder.decode(this.bytes));
    }

    /**
     * index of the first non ascii character at or after an offset (the number of non ascii characters before it)
     * @param offset
     */
    private search(offset: number): number {
        const positions: Int32Array = this.positions;
        let low: number = 0;
        let high: number = positions.length;

        while (low < high) {
            const middle: number = (low + high) >>> 1;

            if (positions[middle] < offset) {
                low = middle + 1;
            } else {
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
    hasNonAscii(start: number, end: number): boolean {
        const index: number = this.search(start);

        return index < this.positions.length && this.positions[index] < end;
    }

    /**
     * the utf-16 offset of a byte offset (the offset of a character)
     * @param offset
     */
    utf16(offset: number): number {
        const index: number = this.search(offset);

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
export function toCodeUnits(input: CssInput | null | undefined): CssCodeUnits {
    if (input == null || input === "") {
        return { codes: empty, text: "" };
    }

    if (typeof input === "string") {
        // an ascii string has a byte for each code unit: the encoded string is the code units
        const bytes: Uint8Array = encoder.encode(input);

        if (bytes.length === input.length) {
            return { codes: bytes, text: input };
        }

        const text: Utf8Text | null = scanUtf8(bytes, input);

        return text !== null ? { codes: bytes, text } : { codes: codeUnitsOf(input), text: input };
    }

    let bytes: Uint8Array = bytesOf(input);

    // the byte order mark is removed, like the decoder does
    if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        bytes = bytes.subarray(3);
    }

    const text: Utf8Text | null = scanUtf8(bytes, null);

    if (text === null) {
        const decoded: string = decoder.decode(bytes);

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
const streamSizes: WeakMap<object, number> = new WeakMap();

/**
 * record the size of the css of a stream, in bytes: the parser allocates the code units and the arena once, like for
 * an ArrayBuffer, instead of growing them as the stream is read. 0: the size is not known
 * @param stream
 * @param size
 */
export function setStreamSize<T extends object>(stream: T, size: number): T {
    if (size > 0) {
        streamSizes.set(stream, size);
    }

    return stream;
}

/**
 * the size of the css of a stream, in bytes, see {@link setStreamSize}. 0: the size is not known
 * @param stream
 */
export function getStreamSize(stream: object | null | undefined): number {
    return stream == null ? 0 : (streamSizes.get(stream) ?? 0);
}

/**
 * the size of the body of a response: its content length, 0 when it is not known or when the body is compressed (the
 * content length is the size of the compressed body)
 * @param response
 */
export function responseSize(response: Response): number {
    if (response.headers.get("content-encoding") != null) {
        return 0;
    }

    const length: number = Number(response.headers.get("content-length"));

    return Number.isFinite(length) && length > 0 ? length : 0;
}
