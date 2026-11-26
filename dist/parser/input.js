/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.2
	License: MIT
 */
import { nativeBufferClass } from '../printer/writer.js';

const encoder = new TextEncoder();
/**
 * the code units of a Uint16Array are stored in the platform byte order
 */
const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
const decoder = new TextDecoder();
/**
 * true if the bytes are ascii. the bytes are read 4 at a time when they are aligned: 5 times faster than a regular
 * expression on the decoded text
 * @param bytes
 */
function isAscii(bytes) {
    const length = bytes.length;
    let bits = 0;
    let i = 0;
    if ((bytes.byteOffset & 3) === 0) {
        const words = new Uint32Array(bytes.buffer, bytes.byteOffset, length >>> 2);
        for (let k = 0; k < words.length; k++) {
            bits |= words[k];
        }
        if ((bits & 0x80808080) !== 0) {
            return false;
        }
        i = words.length << 2;
    }
    for (; i < length; i++) {
        bits |= bytes[i];
    }
    return (bits & 0x80) === 0;
}
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
 * convert the css input to code units: the tokenizer reads the code units. a string is encoded to an ArrayBuffer.
 * an ascii input is read from its bytes: the code units are the bytes. the other inputs are decoded (utf-8) to
 * utf-16 code units: the positions of the tokens are utf-16 positions, like the positions in a string
 * @param input
 */
function toCodeUnits(input) {
    if (input == null || input === "") {
        return { codes: empty, text: "" };
    }
    if (typeof input === "string") {
        // an ascii string has a byte for each code unit: the encoded string is the code units
        const bytes = encoder.encode(input);
        return { codes: bytes.length === input.length ? bytes : codeUnitsOf(input), text: input };
    }
    const bytes = bytesOf(input);
    const text = decoder.decode(bytes);
    // the text of an ascii input has a character for each byte. the byte order mark is removed by the decoder
    if (text.length === bytes.length && isAscii(bytes)) {
        return { codes: bytes, text };
    }
    return { codes: codeUnitsOf(text), text };
}

export { isBinaryInput, isCssInput, toCodeUnits };
