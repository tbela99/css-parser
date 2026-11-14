/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const nonAscii = /[^\x00-\x7f]/;
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
        return { codes: nonAscii.test(input) ? codeUnitsOf(input) : encoder.encode(input), text: input };
    }
    const bytes = bytesOf(input);
    const text = decoder.decode(bytes);
    // the text of an ascii input has a character for each byte. the byte order mark is removed by the decoder
    if (text.length === bytes.length && !nonAscii.test(text)) {
        return { codes: bytes, text };
    }
    return { codes: codeUnitsOf(text), text };
}

export { isBinaryInput, isCssInput, toCodeUnits };
