import { type NativeBufferClass, nativeBufferClass } from "../printer/writer.ts";

/**
 * css input: the utf-8 encoded css in an ArrayBuffer or in a view of an ArrayBuffer (Uint8Array, Buffer), the preferred
 * input, or a string
 */
export type CssInput = string | ArrayBuffer | ArrayBufferView;

/**
 * the css read by the tokenizer: the utf-16 code units of the css and its text
 */
export interface CssCodeUnits {
    /**
     * the utf-16 code units of the css. ascii css: the bytes of the input, without copy
     */
    codes: Uint8Array | Uint16Array;
    /**
     * the text of the css: the values of the tokens are read from the text
     */
    text: string;
}

const encoder: TextEncoder = new TextEncoder();
/**
 * the code units of a Uint16Array are stored in the platform byte order
 */
const littleEndian: boolean = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
const decoder: TextDecoder = new TextDecoder();
const nonAscii: RegExp = /[^\x00-\x7f]/;
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
 * convert the css input to code units: the tokenizer reads the code units. a string is encoded to an ArrayBuffer.
 * an ascii input is read from its bytes: the code units are the bytes. the other inputs are decoded (utf-8) to
 * utf-16 code units: the positions of the tokens are utf-16 positions, like the positions in a string
 * @param input
 */
export function toCodeUnits(input: CssInput | null | undefined): CssCodeUnits {
    if (input == null || input === "") {
        return { codes: empty, text: "" };
    }

    if (typeof input === "string") {
        // an ascii string has a byte for each code unit: the encoded string is the code units
        const bytes: Uint8Array = encoder.encode(input);

        return { codes: bytes.length === input.length ? bytes : codeUnitsOf(input), text: input };
    }

    const bytes: Uint8Array = bytesOf(input);
    const text: string = decoder.decode(bytes);

    // the text of an ascii input has a character for each byte. the byte order mark is removed by the decoder
    if (text.length === bytes.length && !nonAscii.test(text)) {
        return { codes: bytes, text };
    }

    return { codes: codeUnitsOf(text), text };
}
