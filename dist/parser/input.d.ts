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
/**
 * true if the input is an ArrayBuffer or a view of an ArrayBuffer
 * @param input
 */
export declare function isBinaryInput(input: unknown): input is ArrayBuffer | ArrayBufferView;
/**
 * true if the input is css: a string, an ArrayBuffer or a view of an ArrayBuffer
 * @param input
 */
export declare function isCssInput(input: unknown): input is CssInput;
/**
 * convert the css input to code units: the tokenizer reads the code units. a string is encoded to an ArrayBuffer.
 * an ascii input is read from its bytes: the code units are the bytes. the other inputs are decoded (utf-8) to
 * utf-16 code units: the positions of the tokens are utf-16 positions, like the positions in a string
 * @param input
 */
export declare function toCodeUnits(input: CssInput | null | undefined): CssCodeUnits;
