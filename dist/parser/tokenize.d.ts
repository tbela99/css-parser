import type { ParseInfo } from "../@types/index.d.ts";
import { ColorType, EnumToken } from "../ast/types.ts";
import { SourceFile } from "./source.ts";
import { type CssInput } from "./input.ts";
import { type CodeUnits } from "./utils/codes.ts";
import type { AstArena } from "../ast/arena.ts";
export declare const hintsEnum: Set<EnumToken>;
/**
 * field of the token the value of a token is stored in
 */
export declare const enum TokenValueField {
    /**
     * no value
     */
    None = 0,
    /**
     * numeric value
     */
    Number = 1,
    /**
     * name: at-rule
     */
    Name = 2,
    /**
     * string value
     */
    Value = 3,
    /**
     * unit of a dimension, with the numeric value
     */
    Unit = 4
}
/**
 * where the string value of a token is read from
 */
export declare const enum TokenValueKind {
    /**
     * a range of the source
     */
    Source = 0,
    /**
     * a range of the canonical text
     */
    Canonical = 1,
    /**
     * a range of the source that contains escape sequences
     */
    Escaped = 2
}
export declare const enum TokenMap {
    EXCLAMATION = 33,// '!', EXCLAMATION
    QUESTION = 63,// '?', QUESTION MARK
    SLASH = 47,// '/'
    LOWERTHAN = 60,// '<', LESS THAN
    HASH = 35,// '#', HASH
    REVERSE_SOLIDUS = 92,// '\', REVERSE SOLIDUS
    DOUBLE_QUOTE = 34,// '"', DOUBLEQ
    SINGLE_QUOTE = 39,// "'", SINGLEQ
    DOT = 46,// '.', DOT
    AT = 64,// '@', AT
    PIPE = 124,// '|', PIPE
    EQUALS = 61,// '=', EQUALS
    AMPERSAND = 38,// '&', AMPERSAND
    STAR = 42,// '*', STAR
    TILDA = 126,// '~', TILDA
    CARET = 94,// '^', CARET
    DOLLAR = 36,// '$', DOLLAR
    COMMA = 44,// ',', COMMA
    COLON = 58,// ':', COLON
    SEMICOLON = 59,// ';', SEMICOLON
    LEFT_PARENTHESIS = 40,// '(', LEFT PARENTHESIS
    RIGHT_PARENTHESIS = 41,
    LEFT_BRACKETS = 91,// '[', LEFT_BRACKETS
    RIGHT_BRACKETS = 93,// ']', RIGHT_BRACKETS
    LEFT_BRACE = 123,// '{', LEFT_BRACE
    RIGHT_BRACE = 125,
    PLUS = 43,// '+', PLUS
    MINUS = 45,
    GREATERTHAN = 62,// '>', GREATER THAN
    PERCENTAGE = 37
}
/**
 * the parse info of a css input: the input is converted to code units, see {@link Tokenizer.load}. a stream is read
 * by {@link Tokenizer.tokenizeStream}
 * @param input the css: a string, an ArrayBuffer, a view of an ArrayBuffer or a stream
 * @param source the source file of the css
 */
export declare function createParseInfo(input: CssInput | ReadableStream<Uint8Array> | null | undefined, source: SourceFile): ParseInfo;
/**
 * tokenizer class
 */
export declare class Tokenizer {
    private input;
    /**
     * token type
     */
    typ: EnumToken | null;
    /**
     * token kind
     */
    kin: ColorType | null;
    /**
     * numeric value of the number, dimension and percentage tokens
     */
    num: number;
    /**
     * field of the token the value is stored in: the numeric value ({@link num}), the name of an at-rule, the string
     * value, the unit of a dimension (with the numeric value)
     */
    field: TokenValueField;
    /**
     * where the string value is read from: a range of the source, a range of the canonical text (the spelling of a
     * known unit or function name) or a range of the source that contains escape sequences
     */
    valueKind: TokenValueKind;
    /**
     * start of the string value: in the code units of the source, or in the canonical text
     */
    valueStart: number;
    /**
     * end of the string value: in the code units of the source, or in the canonical text
     */
    valueEnd: number;
    /**
     * source id
     */
    srcId: number | null;
    /**
     * token start
     */
    sta: number | null;
    /**
     * token end
     */
    end: number | null;
    /**
     * bytes in
     */
    bytesIn: number | null;
    /**
     * token slice
     */
    slice: number | null;
    /**
     * source file
     */
    source: SourceFile | null;
    /**
     * the identifier read by the last call of consumeIdentToken() has non ascii characters: they may be new lines
     * (U+2028, U+2029)
     */
    private identNonAscii;
    /**
     * token hint
     */
    private hint;
    private state;
    private readonly parseInfo;
    /**
     * @param parseInfo the parse info, or the css: a string, an ArrayBuffer or a view of an ArrayBuffer
     * @param input a stream of css
     */
    constructor(parseInfo: ParseInfo | CssInput, input?: ReadableStream<Uint8Array> | null);
    /**
     * set the css read by the tokenizer: the code units of the css (an ascii ArrayBuffer is read without copy). the
     * text of the css is the content of the source file: the offsets of the tokens are offsets of the content
     * @param parseInfo
     * @param input
     */
    static load(parseInfo: ParseInfo, input: CssInput | null | undefined): void;
    /**
     * id of the source file being tokenized
     */
    get sourceId(): number;
    /**
     * length of the css input, in code units. 0 when the input is a stream
     */
    get streamLength(): number;
    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeString(parseInfo: ParseInfo): this;
    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeStringAsURLToken(parseInfo: ParseInfo): this;
    /**
     * consume a unicode range: `U+` followed by one to six hexadecimal digits or `?` (the `?` are the last
     * characters), optionally followed by `-` and one to six hexadecimal digits: `U+0025-00FF`, `U+4??`.
     * the range is followed by the end of the stream, a whitespace, `,`, `;`, `}`, `)` or `!`: `u+a{` is a selector
     * @param parseInfo
     * @returns the length of the token, 0 if it is not a unicode range
     */
    consumeUnicodeRangeToken(parseInfo: ParseInfo): number;
    /**
     * consume number, dimension, or percentage. the number is `[+-]? digits? [. digits]? [(e|E) [+-]? digits]?`:
     * `1.5e2`, `1e-3`, `.5e1`. the exponent requires a digit: `2em` is the number `2` and the unit `em`.
     * the token is followed by the end of the stream, a whitespace, `)`, `;`, `!`, `}`, `/`, `*`, `,` (and `+` after
     * a dimension: `2n+1`): otherwise it is not a numeric token
     * @param parseInfo
     * @returns the length of the token, 0 if it is not a numeric token
     */
    consumeNumericToken(parseInfo: ParseInfo): number;
    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeIdentToken(parseInfo: ParseInfo): number;
    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeColor(parseInfo: ParseInfo): number;
    consumeURLToken(parseInfo: ParseInfo, endPosition: number): this;
    /**
     * set the current token: its type, its numeric value and the range of its string value (see {@link field} and
     * {@link valueKind}). no string is created
     * @param parseInfo
     * @param hint token type
     * @param slice start of the unit of a dimension, or of the value
     * @param decodeSegments the value contains escape sequences
     * @returns
     */
    makeToken(parseInfo: ParseInfo, hint?: EnumToken | null, slice?: number | null, decodeSegments?: boolean): this;
    /**
     * id of the string value of the current token in the arena (see {@link AstArena.internRange}). no string is
     * created:
     *
     * - a range of the source: the arena stores the source index and the offsets. without a source index (the tokens
     *   have no location, see `parseString()`), the code units are copied to the string pool of the arena
     * - a range of the canonical text: the arena stores the offsets
     * - a value with escape sequences: the decoded code units are copied to the string pool of the arena
     *
     * @param arena
     * @param sourceIndex index of the source in the arena, -1 when the tokens have no location
     */
    internValue(arena: AstArena, sourceIndex: number): number;
    /**
     * content of the source being tokenized: the offsets of the tokens are offsets of the content
     */
    get content(): string;
    /**
     * code units of the source being tokenized
     */
    get codes(): CodeUnits;
    /**
     * true if the text of the token being read equals the input, ignoring the case. the token text starts at
     * parseInfo.position: `0!important` is the number `0` followed by `!important`
     * @param parseInfo
     * @param input
     * @returns
     */
    equalsIgnoreCase(parseInfo: ParseInfo, input: string): boolean;
    /**
     *
     * @param parseInfo
     * @param input
     * @returns
     */
    match(parseInfo: ParseInfo, input: string): boolean;
    /**
     * length of the escape sequence that follows the backslash at the current position: the hexadecimal digits (6
     * characters at most, the space included) followed by an optional space. 0 when there is no hexadecimal digit.
     * the code units are read: no string is created
     * @param parseInfo
     */
    escapeSequenceLength(parseInfo: ParseInfo): number;
    /**
     * move forward by count characters (at most to the end of the stream) and record the new lines. the code units are
     * read: no string is created
     * @param parseInfo
     * @param count
     */
    advance(parseInfo: ParseInfo, count?: number): void;
    /**
     * move forward over characters that are not new lines (ascii identifiers, numbers, colors, punctuation):
     * no string is created and the characters are not read again. see {@link advance}
     * @param parseInfo
     * @param count
     */
    skip(parseInfo: ParseInfo, count: number): void;
    /**
     * move forward over the identifier read by consumeIdentToken(): the new lines are recorded when it has non ascii
     * characters, see {@link advance}
     * @param parseInfo
     * @param count
     */
    skipIdent(parseInfo: ParseInfo, count: number): void;
    /**
     * move forward by one character and return its code (NaN at the end of the stream). new lines are recorded
     * like {@link advance}
     * @param parseInfo
     */
    advanceCode(parseInfo: ParseInfo): number;
    /**
     *
     * @param parseInfo
     * @returns
     */
    isIdentToken(parseInfo: ParseInfo): boolean;
    /**
     *
     * @param parseInfo
     * @param input
     * @returns
     */
    startsWith(parseInfo: ParseInfo, input: string): boolean;
    /**
     *
     * @param parseInfo
     * @returns
     */
    isURLToken(parseInfo: ParseInfo): boolean;
    done(): boolean;
    /**
     * Tokenize CSS string
     */
    next(): this;
    /**
     * tokenize readable stream
     */
    tokenizeStream(): Promise<this>;
}
