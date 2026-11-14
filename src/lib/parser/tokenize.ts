import type { ParseInfo } from "../../@types/index.d.ts";
import { ColorType, EnumToken } from "../ast/types.ts";
import {
    colorsFunc,
    containerFunc,
    gridTemplateFunc,
    imageFunc,
    mathFuncs,
    pseudoElements,
    supportFunc,
    timelineFunc,
    timingFunc,
    transformFunctions,
    urlFunc,
    validationUnits,
    whenElseFunc,
    wildCardFuncs,
} from "../syntax/constants.ts";
import {
    angleUnits,
    dimensionUnits,
    flexUnits,
    frequencyUnits,
    isDigit,
    isIdentCodepoint,
    isIdentStart,
    isLetter,
    isNewLine,
    isNonPrintable,
    isWhiteSpace,
    resolutionUnits,
    timeUnits,
} from "../syntax/syntax.ts";
import { SourceFile } from "./source.ts";
import { type CssInput, isCssInput, toCodeUnits } from "./input.ts";

const SymbolsMapTokens: Record<string, EnumToken> = Object.create(null);
const SymbolsMapTokensLower: Record<string, EnumToken> = Object.create(null);

// Regex for escape sequence decoding - compile once, reuse many times
const ESCAPE_SEQUENCE_REGEX = /\\((\n|\r|\f|\v|\u2028|\u2029|([0-9a-fA-F]{1,6})) ?)/gms;

function decodeEscapeSequences(value: string): string {
    return value.replace(ESCAPE_SEQUENCE_REGEX, (_, sequence) => {
        // \n \r \f \v
        switch (sequence.charCodeAt(0)) {
            case 0xa:
            case 0xb:
            case 0xc:
            case 0xd:
            case 0x2028:
            case 0x2029:
                return "";
        }

        const codepoint = parseInt(sequence, 16);

        if (
            codepoint === 0 ||
            // leading surrogate
            (0xd800 <= codepoint && codepoint <= 0xdbff) ||
            // trailing surrogate
            (0xdc00 <= codepoint && codepoint <= 0xdfff) ||
            codepoint > 0x10ffff
        ) {
            return "\uFFFD";
        }

        return String.fromCodePoint(codepoint);
    });
}

/**
 * the code units of a string
 * @param str
 */
function codesOf(str: string): Uint16Array {
    const codes: Uint16Array = new Uint16Array(str.length);

    for (let i: number = 0; i < str.length; i++) {
        codes[i] = str.charCodeAt(i);
    }

    return codes;
}

/**
 * hash table of ascii strings, looked up by a range of the code units of the css source without allocating a string.
 * the keys are lowercase, the lookups ignore the case of ascii letters
 */
class RangeTable<T> {
    private keys: Uint16Array[] = [];
    private values: T[] = [];
    private slots: Int32Array = new Int32Array(1024).fill(-1);

    /**
     * hash of a range of code units, ascii letters are lowercased. -1 when the range contains a non ascii character
     * @param codes
     * @param start
     * @param end
     */
    private static hash(codes: ArrayLike<number>, start: number, end: number): number {
        let hash: number = 0x811c9dc5;

        for (let i = start; i < end; i++) {
            let code: number = codes[i];

            if (code > 0x7f) {
                return -1;
            }

            if (code >= 65 && code <= 90) {
                code += 32;
            }

            hash = Math.imul(hash ^ code, 0x01000193);
        }

        return hash >>> 0;
    }

    /**
     * the value of a range of code units
     * @param codes
     * @param start
     * @param end
     */
    get(codes: ArrayLike<number>, start: number, end: number): T | undefined {
        const hash: number = RangeTable.hash(codes, start, end);

        if (hash === -1) {
            return undefined;
        }

        const index: number = this.slots[this.find(codes, start, end, hash)];

        return index === -1 ? undefined : this.values[index];
    }

    /**
     * the value of a key
     * @param key
     */
    getKey(key: string): T | undefined {
        return this.get(codesOf(key), 0, key.length);
    }

    set(key: string, value: T): void {
        const codes: Uint16Array = codesOf(key);
        const slot: number = this.find(codes, 0, codes.length, RangeTable.hash(codes, 0, codes.length));

        if (this.slots[slot] === -1) {
            this.slots[slot] = this.keys.length;
            this.keys.push(codes);
            this.values.push(value);
        } else {
            this.values[this.slots[slot]] = value;
        }
    }

    /**
     * slot of a key. the table is never full: it is sized for the static tables of the tokenizer
     * @param codes
     * @param start
     * @param end
     * @param hash
     */
    private find(codes: ArrayLike<number>, start: number, end: number, hash: number): number {
        const mask: number = this.slots.length - 1;
        const length: number = end - start;
        let slot: number = hash & mask;

        for (;;) {
            const index: number = this.slots[slot];

            if (index === -1) {
                return slot;
            }

            const key: Uint16Array = this.keys[index];

            if (key.length === length) {
                let k: number = 0;

                while (k < length) {
                    let code: number = codes[start + k];

                    if (code >= 65 && code <= 90) {
                        code += 32;
                    }

                    if (code !== key[k]) {
                        break;
                    }

                    k++;
                }

                if (k === length) {
                    return slot;
                }
            }

            slot = (slot + 1) & mask;
        }
    }
}

/**
 * value of a number: the digits are read from the code units of the source without creating a string when the result
 * is exact (at most 15 significant digits, no exponent), parseFloat() otherwise
 * @param codes the code units of the source
 * @param text the text of the source
 * @param start
 * @param end
 */
function parseNumber(codes: Uint8Array | Uint16Array, text: string, start: number, end: number): number {
    let i: number = start;
    let code: number = codes[i];
    let negative: boolean = false;

    if (code === 0x2d || code === 0x2b) {
        negative = code === 0x2d;
        code = codes[++i];
    }

    let mantissa: number = 0;
    let count: number = 0;
    let digits: number = 0;
    let decimals: number = -1;

    for (; i < end; code = codes[++i]) {
        if (code >= 0x30 && code <= 0x39) {
            mantissa = mantissa * 10 + (code - 0x30);
            count++;

            if (mantissa > 0) {
                digits++;
            }

            if (decimals >= 0) {
                decimals++;
            }
        } else if (code === 0x2e && decimals === -1) {
            decimals = 0;
        } else {
            break;
        }
    }

    // exponent, too many digits or not a number: the (correctly rounded) result of parseFloat()
    if (i !== end || count === 0 || digits > 15 || decimals > 22 || decimals === 0) {
        return parseFloat(text.slice(start, end));
    }

    // mantissa and 10^decimals are exact: the division is correctly rounded like parseFloat()
    const value: number = decimals > 0 ? mantissa / powersOf10[decimals] : mantissa;

    return negative ? -value : value;
}

const powersOf10: number[] = [
    1, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15, 1e16, 1e17, 1e18, 1e19, 1e20,
    1e21, 1e22,
];

/**
 * token type of a symbol, unit or function name (the name followed by `(`), ignoring the case
 */
const symbolTable: RangeTable<EnumToken> = new RangeTable();

/**
 * units and function names of each token type, by lowercase name: the spelling of the first matching item
 */
const itemTable: RangeTable<Map<EnumToken, string>> = new RangeTable();

function assignTokenMap(entries: string[], tokenType: EnumToken, suffix: string = "", lowercase: boolean = false) {
    for (const entry of entries) {
        const key = (lowercase ? entry.toLowerCase() : entry) + suffix;
        SymbolsMapTokens[key] = tokenType;
        SymbolsMapTokensLower[key.toLowerCase()] = tokenType;

        let items: Map<EnumToken, string> | undefined = itemTable.getKey(entry);

        if (items == null) {
            items = new Map();
            itemTable.set(entry.toLowerCase(), items);
        }

        // the first item wins, like a search of the array
        if (!items.has(tokenType)) {
            items.set(tokenType, entry);
        }
    }
}

SymbolsMapTokens["+"] = EnumToken.Plus;
SymbolsMapTokens["="] = EnumToken.DelimTokenType;
SymbolsMapTokens["|"] = EnumToken.PipeTokenType;
SymbolsMapTokens["||"] = EnumToken.ColumnCombinatorTokenType;
SymbolsMapTokens["|="] = EnumToken.DashMatchTokenType;
SymbolsMapTokens["&"] = EnumToken.NestingSelectorTokenType;
SymbolsMapTokens["*"] = EnumToken.Star;
SymbolsMapTokens["*="] = EnumToken.ContainMatchTokenType;
SymbolsMapTokens["~"] = EnumToken.Tilda;
SymbolsMapTokens["~="] = EnumToken.IncludeMatchTokenType;
SymbolsMapTokens["^="] = EnumToken.StartMatchTokenType;
SymbolsMapTokens["$="] = EnumToken.EndMatchTokenType;
SymbolsMapTokens[","] = EnumToken.Comma;
SymbolsMapTokens[":"] = EnumToken.ColonTokenType;
SymbolsMapTokens["::"] = EnumToken.DoubleColonTokenType;
SymbolsMapTokens[";"] = EnumToken.SemiColonTokenType;
SymbolsMapTokens["("] = EnumToken.StartParensTokenType;
SymbolsMapTokens[")"] = EnumToken.EndParensTokenType;
SymbolsMapTokens["["] = EnumToken.AttrStartTokenType;
SymbolsMapTokens["]"] = EnumToken.AttrEndTokenType;
SymbolsMapTokens["{"] = EnumToken.BlockStartTokenType;
SymbolsMapTokens["}"] = EnumToken.BlockEndTokenType;
SymbolsMapTokens["<="] = EnumToken.LteTokenType;
SymbolsMapTokens[">"] = EnumToken.GtTokenType;
SymbolsMapTokens[">="] = EnumToken.GteTokenType;
SymbolsMapTokens[" "] = EnumToken.Whitespace;
SymbolsMapTokens["\t"] = EnumToken.Whitespace;
SymbolsMapTokens["\r"] = EnumToken.Whitespace;
SymbolsMapTokens["\n"] = EnumToken.Whitespace;
SymbolsMapTokens["\f"] = EnumToken.Whitespace;

assignTokenMap(flexUnits, EnumToken.FlexTokenType);
assignTokenMap(dimensionUnits, EnumToken.LengthTokenType);
assignTokenMap(resolutionUnits, EnumToken.ResolutionTokenType);
assignTokenMap(angleUnits, EnumToken.AngleTokenType);
assignTokenMap(timeUnits, EnumToken.TimeTokenType);
assignTokenMap(frequencyUnits, EnumToken.FrequencyTokenType);

// the units of the other dimensions are rendered in their canonical spelling: `6DB` is rendered `6dB`
for (const unit of validationUnits) {
    let items: Map<EnumToken, string> | undefined = itemTable.getKey(unit);

    if (items == null) {
        items = new Map();
        itemTable.set(unit.toLowerCase(), items);
    }

    if (!items.has(EnumToken.DimensionTokenType)) {
        items.set(EnumToken.DimensionTokenType, unit);
    }
}
assignTokenMap(pseudoElements, EnumToken.PseudoElementTokenType);
assignTokenMap(containerFunc, EnumToken.ContainerFunctionTokenDefType, "(");
assignTokenMap(urlFunc, EnumToken.UrlFunctionTokenDefType, "(");
assignTokenMap(gridTemplateFunc, EnumToken.GridTemplateFuncTokenDefType, "(");
assignTokenMap(imageFunc, EnumToken.ImageFunctionTokenDefType, "(");
assignTokenMap(timelineFunc, EnumToken.TimelineFunctionTokenDefType, "(");
assignTokenMap(supportFunc, EnumToken.SupportsFunctionTokenDefType, "(");
assignTokenMap(timingFunc, EnumToken.TimingFunctionTokenDefType, "(");
assignTokenMap(colorsFunc, EnumToken.ColorFunctionTokenDefType, "(");
assignTokenMap(mathFuncs, EnumToken.MathFunctionTokenDefType, "(");
assignTokenMap(transformFunctions, EnumToken.TransformFunctionTokenDefType, "(", true);
assignTokenMap(whenElseFunc, EnumToken.WhenElseFunctionTokenDefType, "(");
assignTokenMap(wildCardFuncs, EnumToken.WildCardFunctionTokenDefType, "(");

for (const key of Object.keys(SymbolsMapTokens)) {
    symbolTable.set(key.toLowerCase(), SymbolsMapTokens[key]);
}

// do not capture the value
export const hintsEnum = new Set([
    EnumToken.CommaTokenType,
    EnumToken.ImportantTokenType,
    EnumToken.SemiColonTokenType,
    EnumToken.BlockStartTokenType,
    EnumToken.BlockEndTokenType,
    EnumToken.StartParensTokenType,
    EnumToken.EndParensTokenType,
    EnumToken.ColonTokenType,
    EnumToken.EOFTokenType,
]) as Set<EnumToken>;

export const enum TokenMap {
    EXCLAMATION = 33, // '!', EXCLAMATION
    QUESTION = 63, // '?', QUESTION MARK
    SLASH = 47, // '/'
    LOWERTHAN = 60, // '<', LESS THAN
    HASH = 35, // '#', HASH
    REVERSE_SOLIDUS = 92, // '\', REVERSE SOLIDUS
    DOUBLE_QUOTE = 34, // '"', DOUBLEQ
    SINGLE_QUOTE = 39, // "'", SINGLEQ
    DOT = 46, // '.', DOT
    AT = 64, // '@', AT
    PIPE = 124, // '|', PIPE
    EQUALS = 61, // '=', EQUALS
    AMPERSAND = 38, // '&', AMPERSAND
    STAR = 42, // '*', STAR
    TILDA = 126, // '~', TILDA
    CARET = 94, // '^', CARET
    DOLLAR = 36, // '$', DOLLAR
    COMMA = 44, // ',', COMMA
    COLON = 58, // ':', COLON
    SEMICOLON = 59, // ';', SEMICOLON
    LEFT_PARENTHESIS = 40, // '(', LEFT PARENTHESIS
    RIGHT_PARENTHESIS = 41,
    LEFT_BRACKETS = 91, // '[', LEFT_BRACKETS
    RIGHT_BRACKETS = 93, // ']', RIGHT_BRACKETS
    LEFT_BRACE = 123, // '{', LEFT_BRACE
    RIGHT_BRACE = 125,
    PLUS = 43, // '+', PLUS
    MINUS = 45,
    GREATERTHAN = 62, // '>', GREATER THAN
    PERCENTAGE = 37, // '%', PERCENTAGE
}

function getSymbolHint(parseInfo: ParseInfo, start: number, end: number): EnumToken | null {
    const codes: Uint8Array | Uint16Array = parseInfo.codes;

    if (end > parseInfo.length) {
        end = parseInfo.length;
    }

    if (end - start <= 0) {
        return null;
    }

    // ascii names are looked up without allocating a string
    const type: EnumToken | undefined = symbolTable.get(codes, start, end);

    if (type !== undefined) {
        return type;
    }

    for (let i = start; i < end; i++) {
        // the unicode case mapping of toLowerCase() may produce ascii letters
        if (codes[i] > 0x7f) {
            const value: string = parseInfo.stream.slice(start, end);

            return SymbolsMapTokens[value] ?? SymbolsMapTokensLower[value.toLowerCase()] ?? null;
        }
    }

    return null;
}

/**
 * spelling of a unit or a function name of the given token type, ignoring the case
 * @param type
 * @param parseInfo
 * @param start
 * @param end
 */
function findItem(type: EnumToken, parseInfo: ParseInfo, start: number, end: number): string | null {
    if (end - start <= 0) {
        return null;
    }

    return itemTable.get(parseInfo.codes, start, end)?.get(type) ?? null;
}

/**
 * true if the character is a hexadecimal digit
 * @param codepoint
 */
function isHexDigit(codepoint: number): boolean {
    return (
        (codepoint >= 0x30 && codepoint <= 0x39) ||
        (codepoint >= 0x41 && codepoint <= 0x46) ||
        (codepoint >= 0x61 && codepoint <= 0x66)
    );
}

/**
 * true if the character may follow a numeric token: the end of the stream, a whitespace, `)`, `;`, `!`
 * (`0!important`), `}`, `/`, `*`, `,`, and `+` after a dimension (`2n+1`)
 * @param codepoint
 * @param isDimension
 */
function isNumericTokenEnd(codepoint: number, isDimension: boolean): boolean {
    return (
        // eof
        codepoint === undefined ||
        isWhiteSpace(codepoint) ||
        codepoint === TokenMap.RIGHT_PARENTHESIS ||
        codepoint === TokenMap.SEMICOLON ||
        codepoint === TokenMap.EXCLAMATION ||
        codepoint === TokenMap.RIGHT_BRACE ||
        codepoint === TokenMap.SLASH ||
        codepoint === TokenMap.STAR ||
        codepoint === TokenMap.COMMA ||
        (isDimension && codepoint === TokenMap.PLUS)
    );
}

/**
 * the parse info of a css input: the input is converted to code units, see {@link Tokenizer.load}. a stream is read
 * by {@link Tokenizer.tokenizeStream}
 * @param input the css: a string, an ArrayBuffer, a view of an ArrayBuffer or a stream
 * @param source the source file of the css
 */
export function createParseInfo(
    input: CssInput | ReadableStream<Uint8Array> | null | undefined,
    source: SourceFile,
): ParseInfo {
    const parseInfo: ParseInfo = {
        stream: "",
        codes: new Uint8Array(0),
        length: 0,
        source,
        offset: 0,
        time: 0,
        position: 0,
        currentPosition: 0,
    };

    if (!(input instanceof ReadableStream)) {
        Tokenizer.load(parseInfo, input);
    }

    return parseInfo;
}

/**
 * tokenizer class
 */
export class Tokenizer {
    /**
     * token type
     */
    typ: EnumToken | null = null;
    /**
     * token kind
     */
    public kin: ColorType | null = null;
    /**
     * token name
     */
    public nam: string | null = null;
    /**
     * token value
     */
    public val: number | string | null = null;
    /**
     * token unit
     */
    public unit: string | null = null;
    /**
     * source id
     */
    public srcId: number | null = null;
    /**
     * token start
     */
    public sta: number | null = null;
    /**
     * token end
     */
    public end: number | null = null;
    /**
     * bytes in
     */
    public bytesIn: number | null = null;
    /**
     * decode string
     */
    public decodeString: boolean | null = null;
    /**
     * token slice
     */
    public slice: number | null = null;
    /**
     * source file
     */
    public source: SourceFile | null = null;
    /**
     * the identifier read by the last call of consumeIdentToken() has non ascii characters: they may be new lines
     * (U+2028, U+2029)
     */
    private identNonAscii: boolean = false;
    /**
     * token hint
     */
    private hint: EnumToken | null = null;
    private state: EnumToken | null = null;

    private readonly parseInfo: ParseInfo;

    /**
     * @param parseInfo the parse info, or the css: a string, an ArrayBuffer or a view of an ArrayBuffer
     * @param input a stream of css
     */
    constructor(
        parseInfo: ParseInfo | CssInput,
        private input: ReadableStream<Uint8Array> | null = null,
    ) {
        if (isCssInput(parseInfo)) {
            this.parseInfo = createParseInfo(parseInfo, new SourceFile("", [], ""));
        } else {
            // the parse info of a stream is loaded by tokenizeStream()
            if (parseInfo.codes == null && input == null) {
                Tokenizer.load(parseInfo, parseInfo.stream);
            }

            this.parseInfo = parseInfo;
        }
    }

    /**
     * set the css read by the tokenizer: the code units of the css (an ascii ArrayBuffer is read without copy) and its
     * text, the content of the source file
     * @param parseInfo
     * @param input
     */
    static load(parseInfo: ParseInfo, input: CssInput | null | undefined): void {
        const { codes, text } = toCodeUnits(input);

        parseInfo.codes = codes;
        parseInfo.length = codes.length;
        parseInfo.stream = text;

        if (parseInfo.source.content === "") {
            parseInfo.source.content = text;
        }
    }

    /**
     * id of the source file being tokenized
     */
    get sourceId(): number {
        return (this.parseInfo as ParseInfo).source.id;
    }

    /**
     * length of the css input, in code units. 0 when the input is a stream
     */
    get streamLength(): number {
        return (this.parseInfo as ParseInfo).length;
    }

    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeString(parseInfo: ParseInfo): this {
        const quote: number = this.advanceCode(parseInfo);
        let charCode: number;
        let decodeSegments: boolean = false;

        while ((charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) !== undefined) {
            if (charCode === TokenMap.REVERSE_SOLIDUS) {
                if (charCode === parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + 1]) {
                    this.advance(parseInfo, 2);

                    continue;
                }

                charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + 1];

                // \n \r \f \v
                if (
                    charCode === 0xa ||
                    charCode === 0xb ||
                    charCode === 0xc ||
                    charCode === 0xd ||
                    charCode === 0x2028 ||
                    charCode === 0x2029
                ) {
                    this.advance(parseInfo, 2);
                    decodeSegments = true;
                    continue;
                }

                const sequence: string = this.peek(parseInfo, 7);
                let escapeSequence: string = "";
                let codepoint: number;
                let i;

                for (i = 1; i < sequence.length; i++) {
                    codepoint = sequence.charCodeAt(i);

                    if (
                        codepoint === 0x20 ||
                        (codepoint >= 0x61 && codepoint <= 0x66) ||
                        (codepoint >= 0x41 && codepoint <= 0x46) ||
                        (codepoint >= 0x30 && codepoint <= 0x39)
                    ) {
                        escapeSequence += sequence[i];

                        if (codepoint === 0x20) {
                            break;
                        }

                        continue;
                    }

                    break;
                }

                if (escapeSequence.trimEnd().length > 0) {
                    const length: number =
                        escapeSequence.length +
                        1 +
                        (isWhiteSpace(parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) ? 1 : 0);

                    decodeSegments = true;
                    this.advance(parseInfo, length);
                    continue;
                }

                this.advance(parseInfo, 2);
                continue;
            }

            if (charCode === quote) {
                this.advanceCode(parseInfo);

                return this.makeToken(
                    parseInfo,
                    /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType,
                    null,
                    decodeSegments,
                    //),
                );
            }

            if (isNewLine(charCode)) {
                this.advanceCode(parseInfo);
                return this.makeToken(parseInfo, EnumToken.BadStringTokenType);
            }

            this.advanceCode(parseInfo);
        }

        // EOF - 'Unclosed-string' fixed
        return this.makeToken(parseInfo, EnumToken.StringTokenType, null, decodeSegments);
        // return result;
    }

    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeStringAsURLToken(parseInfo: ParseInfo): this {
        const quote: number = this.advanceCode(parseInfo);
        let charCode: number;
        let decodeSegments: boolean = false;

        while ((charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) !== undefined) {
            if (charCode === TokenMap.REVERSE_SOLIDUS) {
                if (charCode === parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + 1]) {
                    this.advance(parseInfo, 2);
                    continue;
                }

                const sequence: string = this.peek(parseInfo, 7);
                let escapeSequence: string = "";
                let codepoint: number;
                let i;

                for (i = 1; i < sequence.length; i++) {
                    codepoint = sequence.charCodeAt(i);

                    if (
                        codepoint === 0x20 ||
                        (codepoint >= 0x61 && codepoint <= 0x66) ||
                        (codepoint >= 0x41 && codepoint <= 0x46) ||
                        (codepoint >= 0x30 && codepoint <= 0x39)
                    ) {
                        escapeSequence += sequence[i];

                        if (codepoint === 0x20) {
                            break;
                        }

                        continue;
                    }

                    break;
                }

                if (escapeSequence.trimEnd().length > 0) {
                    const length: number =
                        escapeSequence.length +
                        1 +
                        (isWhiteSpace(parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) ? 1 : 0);

                    decodeSegments = true;

                    this.advance(parseInfo, length);

                    continue;
                }

                this.advance(parseInfo, 2);
                continue;
            }

            if (charCode === quote) {
                this.advanceCode(parseInfo);

                let k: number = 1;
                let end: number = parseInfo.length - parseInfo.offset;
                let position: number = parseInfo.currentPosition - parseInfo.offset;

                while (position + k < end) {
                    charCode = parseInfo.codes[position];

                    // the end of the stream
                    if (charCode === undefined) {
                        this.advance(parseInfo, k);
                        return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
                    }

                    if (isWhiteSpace(charCode)) {
                        // this.advance(parseInfo, k);
                        k++;
                        continue;
                    }

                    if (charCode !== TokenMap.RIGHT_PARENTHESIS) {
                        this.advance(parseInfo, k);
                        return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
                    }
                    break;
                }

                // consume until the ')'
                return this.makeToken(
                    parseInfo,
                    /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType,
                    null,
                    decodeSegments,
                );
                // return result;
            }

            if (isNewLine(charCode)) {
                // bad string
                this.advanceCode(parseInfo);

                while ((charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) !== undefined) {
                    if (charCode === TokenMap.REVERSE_SOLIDUS) {
                        this.advance(parseInfo, 2);
                        continue;
                    }

                    if (charCode === TokenMap.RIGHT_PARENTHESIS) {
                        return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
                    }

                    this.advanceCode(parseInfo);
                }

                return this.makeToken(parseInfo, EnumToken.BadStringTokenType);
            }

            this.advanceCode(parseInfo);
        }

        // EOF - bad url token
        return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
        // return result;
    }

    /**
     * consume a unicode range: `U+` followed by one to six hexadecimal digits or `?` (the `?` are the last
     * characters), optionally followed by `-` and one to six hexadecimal digits: `U+0025-00FF`, `U+4??`.
     * the range is followed by the end of the stream, a whitespace, `,`, `;`, `}`, `)` or `!`: `u+a{` is a selector
     * @param parseInfo
     * @returns the length of the token, 0 if it is not a unicode range
     */
    consumeUnicodeRangeToken(parseInfo: ParseInfo): number {
        const codes: Uint8Array | Uint16Array = parseInfo.codes;
        const start: number = parseInfo.currentPosition - parseInfo.offset;
        let position: number = start + 2;
        let count: number = 0;
        let wildcards: number = 0;
        let codepoint: number;

        if (codes[start + 1] !== TokenMap.PLUS) {
            return 0;
        }

        while (count < 6) {
            codepoint = codes[position];

            if (wildcards === 0 && isHexDigit(codepoint)) {
                count++;
                position++;
            } else if (codepoint === TokenMap.QUESTION) {
                wildcards++;
                count++;
                position++;
            } else {
                break;
            }
        }

        if (count === 0) {
            return 0;
        }

        // the end of the range
        if (wildcards === 0 && codes[position] === TokenMap.MINUS && isHexDigit(codes[position + 1])) {
            position++;
            count = 0;

            while (count < 6 && isHexDigit(codes[position])) {
                count++;
                position++;
            }
        }

        codepoint = codes[position];

        if (
            // eof
            codepoint === undefined ||
            isWhiteSpace(codepoint) ||
            codepoint === TokenMap.COMMA ||
            codepoint === TokenMap.SEMICOLON ||
            codepoint === TokenMap.RIGHT_BRACE ||
            codepoint === TokenMap.RIGHT_PARENTHESIS ||
            codepoint === TokenMap.EXCLAMATION
        ) {
            return position - start;
        }

        return 0;
    }

    /**
     * consume number, dimension, or percentage. the number is `[+-]? digits? [. digits]? [(e|E) [+-]? digits]?`:
     * `1.5e2`, `1e-3`, `.5e1`. the exponent requires a digit: `2em` is the number `2` and the unit `em`.
     * the token is followed by the end of the stream, a whitespace, `)`, `;`, `!`, `}`, `/`, `*`, `,` (and `+` after
     * a dimension: `2n+1`): otherwise it is not a numeric token
     * @param parseInfo
     * @returns the length of the token, 0 if it is not a numeric token
     */
    consumeNumericToken(parseInfo: ParseInfo): number {
        const codes: Uint8Array | Uint16Array = parseInfo.codes;
        const offset: number = parseInfo.currentPosition - parseInfo.offset;
        let position: number = offset;
        let hasDigits: boolean = false;
        let codepoint: number = codes[position];

        this.slice = null;
        this.hint = null;

        // '+' '-'
        if (codepoint === TokenMap.PLUS || codepoint === TokenMap.MINUS) {
            position++;
        }

        // integer part
        while (isDigit(codes[position])) {
            position++;
            hasDigits = true;
        }

        // decimal part
        if (codes[position] === TokenMap.DOT && isDigit(codes[position + 1])) {
            position++;

            while (isDigit(codes[position])) {
                position++;
            }

            hasDigits = true;
        }

        if (!hasDigits) {
            return 0;
        }

        // exponent: 'E' 'e', followed by a digit or a sign and a digit
        codepoint = codes[position];

        if (codepoint === 0x45 || codepoint === 0x65) {
            let k: number = position + 1;

            if (codes[k] === TokenMap.PLUS || codes[k] === TokenMap.MINUS) {
                k++;
            }

            if (isDigit(codes[k])) {
                position = k;

                while (isDigit(codes[position])) {
                    position++;
                }
            }
        }

        codepoint = codes[position];

        // percentage
        if (codepoint === TokenMap.PERCENTAGE) {
            const slice: number = position;

            if (!isNumericTokenEnd(codes[++position], false)) {
                return 0;
            }

            this.slice = slice;
            this.hint = EnumToken.PercentageTokenType;
            return position - offset;
        }

        // dimension: a unit, or a dashed ident (user defined unit)
        if (isLetter(codepoint) || (codepoint === TokenMap.MINUS && codes[position + 1] === TokenMap.MINUS)) {
            const slice: number = position;

            while (position < parseInfo.length) {
                codepoint = codes[++position];

                if (!isLetter(codepoint) && codepoint !== TokenMap.MINUS) {
                    break;
                }
            }

            if (!isNumericTokenEnd(codes[position], true)) {
                return 0;
            }

            this.slice = slice;
            this.hint = getSymbolHint(parseInfo, slice, position) ?? EnumToken.DimensionTokenType;
            return position - offset;
        }

        // number
        return isNumericTokenEnd(codepoint, false) ? position - offset : 0;
    }

    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeIdentToken(parseInfo: ParseInfo): number {
        let position: number = parseInfo.currentPosition - parseInfo.offset;
        let offset: number = position;

        this.identNonAscii = false;

        let codepoint: number = parseInfo.codes[position];

        if (!isIdentStart(codepoint) && codepoint !== TokenMap.MINUS) {
            return 0;
        }

        if (codepoint === TokenMap.MINUS) {
            position++;
            codepoint = parseInfo.codes[position];

            if (!isIdentStart(codepoint) && codepoint !== TokenMap.MINUS) {
                return 0;
            }
        }

        while ((codepoint = parseInfo.codes[position]) !== undefined) {
            if (codepoint === TokenMap.REVERSE_SOLIDUS) {
                // eof
                if ((codepoint = parseInfo.codes[position + 1]) === undefined) {
                    return 0;
                }

                // \n \r \f \v
                if (
                    codepoint === 0xa ||
                    codepoint === 0xb ||
                    codepoint === 0xc ||
                    codepoint === 0xd ||
                    codepoint === 0x2028 ||
                    codepoint === 0x2029
                ) {
                    return 0;
                }

                position += 2;
                continue;
            }

            if (codepoint === 0x2d || isIdentCodepoint(codepoint)) {
                if (codepoint > 0x7f) {
                    this.identNonAscii = true;
                }

                position++;
            } else {
                switch (codepoint) {
                    case TokenMap.COLON:
                    case TokenMap.LEFT_BRACE:
                    case TokenMap.RIGHT_BRACE:
                    case TokenMap.LEFT_PARENTHESIS:
                    case TokenMap.RIGHT_PARENTHESIS:
                    case TokenMap.LEFT_BRACKETS:
                    case TokenMap.RIGHT_BRACKETS:
                    case TokenMap.SEMICOLON:
                    case TokenMap.EXCLAMATION:
                    case TokenMap.SLASH:
                    case TokenMap.HASH:
                    case TokenMap.STAR:
                    case TokenMap.EQUALS:
                    case TokenMap.TILDA:
                    case TokenMap.PIPE:
                    case TokenMap.CARET:
                    case TokenMap.DOLLAR:
                    case TokenMap.COMMA:
                    case TokenMap.GREATERTHAN:
                    case TokenMap.DOT:
                    case TokenMap.PLUS:
                        return position - offset;
                }

                if (codepoint === undefined || isWhiteSpace(codepoint)) {
                    return position - offset;
                }

                return 0;
            }
        }

        return position - offset;
    }

    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeColor(parseInfo: ParseInfo) {
        let position: number = parseInfo.currentPosition - parseInfo.offset;
        let offset: number = position;

        let codepoint: number = parseInfo.codes[position];

        if (codepoint !== TokenMap.HASH) {
            return 0;
        }

        position++;

        let count: number = 0;

        while (true) {
            codepoint = parseInfo.codes[position];

            // 'a-f0-9' 'A-F0-9'
            if (
                (codepoint >= 0x30 && codepoint <= 0x39) ||
                (codepoint >= 0x61 && codepoint <= 0x66) ||
                (codepoint >= 0x41 && codepoint <= 0x46)
            ) {
                position++;
                count++;
                continue;
            }

            break;
        }

        if (count !== 3 && count !== 4 && count !== 6 && count !== 8) {
            return 0;
        }

        codepoint = parseInfo.codes[position];

        if (
            codepoint === undefined ||
            isWhiteSpace(codepoint) ||
            codepoint === TokenMap.RIGHT_PARENTHESIS ||
            codepoint === TokenMap.SEMICOLON ||
            codepoint === TokenMap.RIGHT_BRACE ||
            codepoint === TokenMap.COMMA
        ) {
            return position - offset;
        }

        return 0;
    }

    consumeURLToken(parseInfo: ParseInfo, endPosition: number): this {
        let charCode: number;

        // consume an <url>
        // inlined: this.peekCharCode(parseInfo)
        while (isWhiteSpace(parseInfo.codes[parseInfo.currentPosition - parseInfo.offset])) {
            this.advanceCode(parseInfo);
        }

        // inlined: this.peekCharCode(parseInfo)
        charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];

        if (charCode === TokenMap.DOUBLE_QUOTE || charCode === TokenMap.SINGLE_QUOTE) {
            return this.consumeStringAsURLToken(parseInfo);
        }

        do {
            this.advanceCode(parseInfo);
            // inlined: this.peekCharCode(parseInfo)
            charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];
        } while (
            // !(value === "/" && this.match(parseInfo, "/*") &&
            charCode !== TokenMap.RIGHT_PARENTHESIS &&
            !isWhiteSpace(charCode) &&
            parseInfo.currentPosition < endPosition
        );

        if (charCode !== TokenMap.RIGHT_PARENTHESIS) {
            let k: number = 1;

            while (k < endPosition) {
                charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + k];
                if (isWhiteSpace(charCode)) {
                    k++;
                    continue;
                }
                break;
            }

            if (charCode === undefined || (charCode !== TokenMap.RIGHT_PARENTHESIS && !isIdentStart(charCode))) {
                this.advance(parseInfo, k);
                return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
            }
        }

        return this.makeToken(
            parseInfo,
            // parseInfo.position < parseInfo.currentPosition
            // inlined: this.peekCharCode(parseInfo)
            (charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) === undefined ||
                !this.isURLToken(parseInfo)
                ? EnumToken.BadUrlTokenType
                : EnumToken.UrlTokenTokenType,
        );
    }
    /**
     *
     * @param parseInfo
     * @param hint
     * @param slice
     * @param decodeSegments
     * @returns
     */
    makeToken(parseInfo: ParseInfo, hint?: EnumToken | null, slice?: number | null, decodeSegments?: boolean): this {
        let val: string | null = null;

        this.typ = null;
        this.nam = null;
        this.val = null;
        this.unit = null;
        this.kin = null;
        this.decodeString = null;
        this.slice = null;
        this.hint = null;

        if (slice) {
            this.slice = slice;
        }

        if (decodeSegments) {
            this.decodeString = true;
        }

        if (hint != null) {
            // the spelling of units and function names is looked up in the tables
            let isList: boolean = false;
            let hasUnit: boolean = false;

            switch (hint) {
                case EnumToken.TransformFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.ColorFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.ContainerFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.UrlFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.GridTemplateFuncTokenDefType:
                    isList = true;
                    break;
                case EnumToken.ImageFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.TimelineFunctionTokenDefType:
                    isList = true;
                    break;
                // case EnumToken.GeneralEnclosedFunctionTokenDefType:
                //     searchArray = generalEnclosedFunc;
                //     break;
                case EnumToken.SupportsFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.TimingFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.MathFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.WhenElseFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.WildCardFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.FrequencyTokenType:
                    isList = true;
                    hasUnit = true;
                    break;
                case EnumToken.ResolutionTokenType:
                    isList = true;
                    hasUnit = true;
                    break;
                case EnumToken.LengthTokenType:
                    isList = true;
                    hasUnit = true;
                    break;
                case EnumToken.FlexTokenType:
                    isList = true;
                    hasUnit = true;
                    break;
                case EnumToken.AngleTokenType:
                    isList = true;
                    hasUnit = true;
                    break;
                case EnumToken.TimeTokenType:
                    isList = true;
                    hasUnit = true;
                    break;
                case EnumToken.DimensionTokenType:
                    hasUnit = true;
                    break;
            }

            const isHint: boolean = hintsEnum.has(hint);

            if (isList) {
                val = findItem(
                    hint,
                    parseInfo,
                    hasUnit ? (slice as number) : parseInfo.position - parseInfo.offset,
                    parseInfo.currentPosition - parseInfo.offset,
                ) as string;
            } else if (hint === EnumToken.NumberTokenType || hint === EnumToken.WhitespaceTokenType) {
                // the number is read from the source below. the whitespace is rendered as a single space: the text
                // is not kept
            } else if (!isHint) {
                // the canonical spelling of a known unit: `6DB` is rendered `6dB`
                val =
                    (hint === EnumToken.DimensionTokenType
                        ? findItem(
                              EnumToken.DimensionTokenType,
                              parseInfo,
                              (slice as number) ?? parseInfo.position - parseInfo.offset,
                              parseInfo.currentPosition - parseInfo.offset,
                          )
                        : null) ??
                    parseInfo.stream.slice(
                        (slice as number) ?? parseInfo.position - parseInfo.offset,
                        parseInfo.currentPosition - parseInfo.offset,
                    );
            }

            if (this.decodeString) {
                val = decodeEscapeSequences(val as string);
            }

            if (isHint) {
                this.typ = hint;
            } else {
                this.typ = hint;

                if (hasUnit || hint === EnumToken.PercentageTokenType || hint === EnumToken.DimensionTokenType) {
                    this.val = parseNumber(
                        parseInfo.codes,
                        parseInfo.stream,
                        parseInfo.position - parseInfo.offset,
                        slice as number,
                    );

                    if (hint !== EnumToken.PercentageTokenType) {
                        this.unit = val;

                        if (val!.startsWith("--")) {
                            this.typ = EnumToken.UserDefinedDimensionTokenType;
                        }
                    }
                } else if (hint === EnumToken.NumberTokenType) {
                    this.val = parseNumber(
                        parseInfo.codes,
                        parseInfo.stream,
                        (slice as number) ?? parseInfo.position - parseInfo.offset,
                        parseInfo.currentPosition - parseInfo.offset,
                    );
                } else if (hint === EnumToken.AtRuleTokenType) {
                    this.nam = val;
                } else {
                    this.val = val;

                    if (hint === EnumToken.ColorTokenType) {
                        this.kin = ColorType.HEX;
                    }
                }
            }
        } else {
            if (this.equalsIgnoreCase(parseInfo, "!important")) {
                this.typ = EnumToken.ImportantTokenType;
            }
        }

        if (this.typ == null) {
            val = parseInfo.stream.slice(
                parseInfo.position - parseInfo.offset,
                parseInfo.currentPosition - parseInfo.offset,
            );

            if (decodeSegments) {
                val = decodeEscapeSequences(val);
                this.decodeString = true;
            }

            this.typ = EnumToken.LiteralTokenType;
            this.val = val;
        }

        this.srcId = parseInfo.source.id as number;
        this.sta = parseInfo.position;
        this.end = parseInfo.currentPosition;
        this.bytesIn = parseInfo.currentPosition;

        parseInfo.position = parseInfo.currentPosition;
        return this;
    }

    /**
     * true if the text of the token being read equals the input, ignoring the case. the token text starts at
     * parseInfo.position: `0!important` is the number `0` followed by `!important`
     * @param parseInfo
     * @param input
     * @returns
     */
    equalsIgnoreCase(parseInfo: ParseInfo, input: string): boolean {
        let position: number = parseInfo.position - parseInfo.offset;

        if (parseInfo.currentPosition - parseInfo.position !== input.length) {
            return false;
        }

        let ca: number;
        let cb: number;

        for (let i: number = 0; i < input.length; i++) {
            ca = parseInfo.codes[position + i];
            cb = input.charCodeAt(i);

            // Normalize A-Z to a-z
            if (ca >= 65 && ca <= 90) ca += 32;
            if (cb >= 65 && cb <= 90) cb += 32;

            if (ca !== cb) {
                return false;
            }
        }

        return true;
    }

    /**
     *
     * @param parseInfo
     * @param input
     * @returns
     */
    match(parseInfo: ParseInfo, input: string): boolean {
        let position: number = parseInfo.currentPosition - parseInfo.offset;

        // compare the character codes: no single character strings
        for (let i: number = 0; i < input.length; i++) {
            if (parseInfo.codes[position + i] !== input.charCodeAt(i)) {
                return false;
            }
        }

        return true;
    }

    /**
     *
     * @param parseInfo
     * @param count
     * @returns
     */
    peek(parseInfo: ParseInfo, count: number = 1): string {
        if (count === 1) {
            return parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset);
        }

        const position = parseInfo.currentPosition - parseInfo.offset;
        return parseInfo.stream.slice(position, position + count);
    }

    /**
     * move forward by count characters (at most to the end of the stream) and record the new lines. the code units are
     * read: no string is created
     * @param parseInfo
     * @param count
     */
    advance(parseInfo: ParseInfo, count: number = 1): void {
        const codes: Uint8Array | Uint16Array = parseInfo.codes;
        const position: number = parseInfo.currentPosition - parseInfo.offset;
        const remaining: number = parseInfo.length - position;
        const length: number = count < remaining ? (count > 0 ? count : 0) : remaining > 0 ? remaining : 0;
        const lineStarts = parseInfo.source.lineStarts.lineStarts;
        let codepoint: number;

        for (let i: number = 0; i < length; i++) {
            codepoint = codes[position + i];

            if (
                codepoint === 0xa || // \n
                codepoint === 0xb || // \v
                codepoint === 0xc || // \f
                codepoint === 0xd || // \r
                codepoint === 0x2028 || // \u2028
                codepoint === 0x2029 // \u2029
            ) {
                // \r\n: a single line start
                if (codepoint === 0xa && i > 0 && codes[position + i - 1] === 0xd) {
                    // nope
                } else {
                    lineStarts.push(position + parseInfo.offset + i);
                }
            }
        }

        parseInfo.currentPosition += length;
    }

    /**
     * move forward over characters that are not new lines (ascii identifiers, numbers, colors, punctuation):
     * no string is created and the characters are not read again. see {@link advance}
     * @param parseInfo
     * @param count
     */
    skip(parseInfo: ParseInfo, count: number): void {
        const remaining: number = parseInfo.length - (parseInfo.currentPosition - parseInfo.offset);

        parseInfo.currentPosition += count < remaining ? count : remaining > 0 ? remaining : 0;
    }

    /**
     * move forward over the identifier read by consumeIdentToken(): the new lines are recorded when it has non ascii
     * characters, see {@link advance}
     * @param parseInfo
     * @param count
     */
    skipIdent(parseInfo: ParseInfo, count: number): void {
        if (this.identNonAscii) {
            this.advance(parseInfo, count);
        } else {
            this.skip(parseInfo, count);
        }
    }

    /**
     * move forward by one character and return its code (NaN at the end of the stream). new lines are recorded
     * like {@link advance}
     * @param parseInfo
     */
    advanceCode(parseInfo: ParseInfo): number {
        const position: number = parseInfo.currentPosition - parseInfo.offset;
        const codepoint: number = parseInfo.codes[position];

        // the end of the stream: NaN
        if (codepoint === undefined) {
            return NaN;
        }

        if (
            codepoint === 0xa || // \n
            codepoint === 0xb || // \v
            codepoint === 0xc || // \f
            codepoint === 0xd || // \r
            codepoint === 0x2028 ||
            codepoint === 0x2029
        ) {
            parseInfo.source.lineStarts.lineStarts.push(position + parseInfo.offset);
        }

        parseInfo.currentPosition++;
        return codepoint;
    }

    /**
     *
     * @param parseInfo
     * @returns
     */
    isIdentToken(parseInfo: ParseInfo /* , start?: number, end?: number */): boolean {
        let j: number = parseInfo.currentPosition - parseInfo.offset;
        let i: number = parseInfo.position - parseInfo.offset;

        // if (start != null) {
        //     if (end == null) {
        //         if (start < 0) {
        //             j += start;
        //         } else {
        //             i += start;
        //         }
        //     } else {
        //         if (end < 0) {
        //             j += end;
        //         } else {
        //             j = parseInfo.position + end;
        //         }
        //     }
        // }

        j--;

        let codepoint: number = parseInfo.codes[i] as number;

        // -
        if (codepoint === 0x2d) {
            let nextCodepoint: number;

            // the end of the stream
            if ((nextCodepoint = parseInfo.codes[i + 1]) === undefined) {
                return false;
            }

            if (!isIdentStart(nextCodepoint) && nextCodepoint !== 0x2d) {
                return false;
            }

            codepoint = nextCodepoint;
            i++;
        }

        if (codepoint !== 0x2d && !isIdentStart(codepoint)) {
            return false;
        }

        if (codepoint === TokenMap.REVERSE_SOLIDUS) {
            codepoint = parseInfo.codes[i + 1] as number;

            i += String.fromCodePoint(codepoint).length;
        }

        while (i < j) {
            i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
            codepoint = parseInfo.codes[i] as number;

            if (codepoint === TokenMap.REVERSE_SOLIDUS) {
                i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
                codepoint = parseInfo.codes[i] as number;
                i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;

                continue;
            }

            if (codepoint !== 0x2d && !isIdentCodepoint(codepoint)) {
                return false;
            }
        }

        return true;
    }

    /**
     *
     * @param parseInfo
     * @param input
     * @returns
     */
    startsWith(parseInfo: ParseInfo, input: string): boolean {
        let i: number = 0;
        let j: number = input.length;

        // compare the character codes: no single character strings
        while (i < j) {
            if (parseInfo.codes[parseInfo.position - parseInfo.offset + i] !== input.charCodeAt(i)) {
                return false;
            }
            i++;
        }

        return true;
    }

    /**
     *
     * @param parseInfo
     * @returns
     */
    isURLToken(parseInfo: ParseInfo): boolean {
        let i: number = parseInfo.position - parseInfo.offset;
        let c: number;

        while (++i < parseInfo.currentPosition) {
            c = parseInfo.codes[i] as number;

            // single quote or double quote or start parenthesis or close parenthesis
            if (isNonPrintable(c) || c === 0x27 || c === 0x22 || c === 0x28 || c === 0x29) {
                return false;
            }

            // valid escape
            if (c === TokenMap.REVERSE_SOLIDUS) {
                i++;

                if (i >= parseInfo.currentPosition) {
                    return false;
                }

                c = parseInfo.codes[i] as number;

                // c is not '\n' or '\r' or '\f'
                if (c === 0x6e || c === 0x72 || c === 0x66) {
                    return false;
                }

                continue;
            }

            // is white space
            if (c === 0x20 || c === 0x09) {
                break;
            }
        }

        return i === parseInfo.currentPosition;
    }

    done(): boolean {
        return this.typ === EnumToken.EOF;
    }

    /**
     * Tokenize CSS string
     */
    next(/* parseInfo: ParseInfo | string, yieldEOFToken: boolean = true */): this {
        const parseInfo: ParseInfo = this.parseInfo as ParseInfo;

        this.source = parseInfo.source;

        let charCode: number;
        let nextCharCode: number;

        // const result: TokenizeResult[] = [];
        // allow 10 characters buffer for the streaming parser to avoid incomplete tokens
        const endPosition: number = parseInfo.length - 1;
        let tokensCount: number;

        // the code units are undefined after the end of the stream
        while ((charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) !== undefined) {
            if (this.state === EnumToken.UrlFunctionTokenDefType) {
                this.state = null;
                return this.consumeURLToken(parseInfo, endPosition);
            }

            if (parseInfo.position === parseInfo.currentPosition) {
                // `U+0025-00FF`
                if (charCode === 0x55 || charCode === 0x75) {
                    tokensCount = this.consumeUnicodeRangeToken(parseInfo);

                    if (tokensCount > 0) {
                        this.skip(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, EnumToken.UniCodeRange);
                    }
                }

                if (
                    charCode === TokenMap.MINUS ||
                    charCode === TokenMap.PLUS ||
                    charCode === TokenMap.DOT ||
                    isDigit(charCode)
                ) {
                    tokensCount = this.consumeNumericToken(parseInfo);

                    if (tokensCount > 0) {
                        // the range of an invalid exponent may contain new lines
                        this.advance(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, this.hint ?? EnumToken.NumberTokenType, this.slice);
                    }
                }

                if (isIdentStart(charCode) || charCode === TokenMap.MINUS) {
                    tokensCount = this.consumeIdentToken(parseInfo);

                    if (tokensCount > 0) {
                        this.skipIdent(parseInfo, tokensCount);

                        // inlined: this.peekCharCode(parseInfo)
                        charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];

                        // do not match function
                        if (TokenMap.LEFT_PARENTHESIS !== charCode) {
                            return this.makeToken(
                                parseInfo,
                                this.startsWith(parseInfo, "--")
                                    ? EnumToken.DashedIdenTokenType
                                    : EnumToken.IdenTokenType,
                            );
                        }
                    }
                }

                if (charCode === TokenMap.AT) {
                    this.skip(parseInfo, 1);

                    // inlined: this.peekCharCode(parseInfo)
                    charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];

                    // match at-rule
                    // inlined: this.peekCharCode(parseInfo)
                    if (
                        charCode === TokenMap.MINUS ||
                        isIdentStart(parseInfo.codes[parseInfo.currentPosition - parseInfo.offset])
                    ) {
                        // consume '@'
                        parseInfo.position = parseInfo.currentPosition;
                        tokensCount = this.consumeIdentToken(parseInfo);

                        if (tokensCount > 0) {
                            this.skipIdent(parseInfo, tokensCount);

                            return this.makeToken(parseInfo, EnumToken.AtRuleTokenType);
                        }
                    }
                }

                if (charCode === TokenMap.HASH) {
                    tokensCount = this.consumeColor(parseInfo);

                    if (tokensCount > 0) {
                        this.skip(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, EnumToken.ColorTokenType);
                    }

                    this.skip(parseInfo, 1);

                    tokensCount = this.consumeIdentToken(parseInfo);

                    if (tokensCount > 0) {
                        this.skipIdent(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, EnumToken.HashTokenType);
                    }
                }
            }
            // EOF
            switch (charCode) {
                case TokenMap.EQUALS:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.DelimTokenType);

                // '+' or '-'
                case TokenMap.PLUS:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    this.skip(parseInfo, 1);

                    charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];

                    // if (isDigit(charCode)) {
                    //     tokensCount = this.consumeNumericToken(parseInfo);

                    //     if (tokensCount > 0) {
                    //         this.skip(parseInfo, tokensCount);
                    //         return this.makeToken(parseInfo, this.hint ?? EnumToken.NumberTokenType, {
                    //             slice: this.slice,
                    //             sign: "+",
                    //         });
                    //     }
                    // }

                    return this.makeToken(parseInfo, EnumToken.Plus);

                case TokenMap.MINUS:
                    if (parseInfo.position === parseInfo.currentPosition) {
                        nextCharCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + 1];

                        // not a number
                        if (isWhiteSpace(nextCharCode)) {
                            this.skip(parseInfo, 1);

                            return this.makeToken(parseInfo, EnumToken.Sub);
                        }

                        // if (
                        //     charCode == TokenMap.MINUS &&
                        //     (nextCharCode == TokenMap.MINUS || isIdentStart(nextCharCode))
                        //) {
                        //     this.skip(parseInfo, 1);

                        //     tokensCount = this.consumeIdentToken(parseInfo);

                        //     if (tokensCount > 0) {
                        //         this.skip(parseInfo, tokensCount);
                        //         return this.makeToken(parseInfo, EnumToken.IdenTokenType);
                        //     }
                        // }
                    }

                    this.skip(parseInfo, 1);
                    break;

                // '{'
                case TokenMap.LEFT_BRACE:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.BlockStartTokenType);

                // '}'
                case TokenMap.RIGHT_BRACE:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.BlockEndTokenType);

                // '('
                case TokenMap.LEFT_PARENTHESIS:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        // if (
                        //     parseInfo.stream[parseInfo.position - parseInfo.offset] === ":" &&
                        //     this.isPseudo(parseInfo)
                        //) {
                        //     this.skip(parseInfo, 1);
                        //     return this.makeToken(parseInfo, EnumToken.PseudoClassFunctionTokenDefType);

                        // } else
                        if (this.isIdentToken(parseInfo)) {
                            const hint: EnumToken = this.startsWith(parseInfo, "--")
                                ? EnumToken.CustomFunctionTokenDefType
                                : (getSymbolHint(
                                      parseInfo,
                                      parseInfo.position - parseInfo.offset,
                                      parseInfo.currentPosition - parseInfo.offset + 1,
                                  ) ?? EnumToken.FunctionTokenDefType);

                            this.makeToken(parseInfo, hint);
                            this.skip(parseInfo, 1);

                            // consume '('
                            parseInfo.position = parseInfo.currentPosition;

                            if (hint === EnumToken.UrlFunctionTokenDefType) {
                                this.state = hint;
                            }

                            return this;
                        }
                    }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.StartParensTokenType);

                // ')'
                case TokenMap.RIGHT_PARENTHESIS:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.EndParensTokenType);

                // '['
                case TokenMap.LEFT_BRACKETS:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.AttrStartTokenType);

                // ']'
                case TokenMap.RIGHT_BRACKETS:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.AttrEndTokenType);

                case TokenMap.SEMICOLON:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.SemiColonTokenType);

                case TokenMap.COLON:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    this.skip(parseInfo, 1);

                    // inlined: this.peekCharCode(parseInfo)
                    if (parseInfo.codes[parseInfo.currentPosition - parseInfo.offset] === TokenMap.COLON) {
                        this.skip(parseInfo, 1);

                        return this.makeToken(parseInfo, EnumToken.DoubleColonTokenType);
                    }

                    return this.makeToken(parseInfo, EnumToken.ColonTokenType);

                // \n \r \f \v \t space
                case 0x9:
                case 0x20:
                case 0xa:
                case 0xb:
                case 0xc:
                case 0xd:
                case 0x2028:
                case 0x2029:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advanceCode(parseInfo);
                    // inlined: this.peekCharCode(parseInfo)
                    nextCharCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];

                    while (
                        nextCharCode === 0x20 ||
                        (nextCharCode >= 0x9 && nextCharCode <= 0xd) ||
                        nextCharCode === 0x2028 ||
                        nextCharCode === 0x2029
                    ) {
                        this.advanceCode(parseInfo);
                        // inlined: this.peekCharCode(parseInfo)
                        nextCharCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];
                    }

                    return this.makeToken(parseInfo, EnumToken.WhitespaceTokenType);

                case TokenMap.COMMA:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.CommaTokenType);

                case TokenMap.DOLLAR:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    if (this.match(parseInfo, "$=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.EndMatchTokenType);
                    }

                    this.skip(parseInfo, 1);
                    break;

                case TokenMap.TILDA:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    if (this.match(parseInfo, "~=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.IncludeMatchTokenType);
                    }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.Tilda);

                // case '^':
                case TokenMap.CARET:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    if (this.match(parseInfo, "^=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.StartMatchTokenType);
                    }

                    this.skip(parseInfo, 1);
                    break;

                case TokenMap.STAR:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    if (this.match(parseInfo, "*=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.ContainMatchTokenType);
                    }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.Star);

                case TokenMap.AMPERSAND:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.NestingSelectorTokenType);

                case TokenMap.PIPE:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    // '||'
                    if (this.match(parseInfo, "||")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.ColumnCombinatorTokenType);
                    } else if (this.match(parseInfo, "|=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.DashMatchTokenType);
                    }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.PipeTokenType);

                case TokenMap.EXCLAMATION:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    if (this.match(parseInfo, "!important")) {
                        this.skip(parseInfo, 10);
                        return this.makeToken(parseInfo, EnumToken.ImportantTokenType);
                    }

                    this.skip(parseInfo, 1);
                    break;

                case TokenMap.SLASH:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    if (!this.match(parseInfo, "/*")) {
                        this.skip(parseInfo, 1);
                        return this.makeToken(
                            parseInfo,

                            getSymbolHint(
                                parseInfo,
                                parseInfo.position - parseInfo.offset,
                                parseInfo.currentPosition - parseInfo.offset,
                            ),
                        );
                    }

                    this.skip(parseInfo, 2);

                    while ((charCode = this.advanceCode(parseInfo)) === charCode) {
                        if (charCode === TokenMap.STAR) {
                            if (this.match(parseInfo, "/")) {
                                this.skip(parseInfo, 1);
                                return this.makeToken(parseInfo, EnumToken.CommentTokenType);
                            }
                        }
                    }

                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo, EnumToken.BadCommentTokenType);
                    }

                    break;

                case TokenMap.GREATERTHAN:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }

                    if (this.match(parseInfo, ">=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.GteTokenType);
                    }

                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.GtTokenType);

                case TokenMap.LOWERTHAN:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    if (this.match(parseInfo, "<=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.LteTokenType);
                    }

                    this.skip(parseInfo, 1);

                    if (this.match(parseInfo, "!--")) {
                        this.skip(parseInfo, 3);

                        while ((charCode = this.advanceCode(parseInfo)) === charCode) {
                            if (charCode === TokenMap.MINUS && this.match(parseInfo, "->")) {
                                break;
                            }
                        }

                        if (parseInfo.currentPosition >= endPosition) {
                            return this.makeToken(parseInfo, EnumToken.BadCdoTokenType);
                        } else {
                            this.skip(parseInfo, 2);
                            return this.makeToken(parseInfo, EnumToken.CDOCOMMTokenType);
                        }
                    }

                    {
                        const startPosition: number = parseInfo.position - parseInfo.offset;
                        let offset: number = 1;
                        let charCode: number = parseInfo.codes[startPosition + offset];

                        if (isLetter(charCode)) {
                            charCode = parseInfo.codes[++offset + startPosition];

                            while (offset < endPosition && (charCode === TokenMap.MINUS || isLetter(charCode))) {
                                charCode = parseInfo.codes[++offset + startPosition];
                            }

                            if (offset > 1 && charCode === TokenMap.GREATERTHAN) {
                                this.skip(parseInfo, offset);
                                return this.makeToken(parseInfo, EnumToken.CssTypeTokenType);
                            }
                        }
                    }

                    break;

                case TokenMap.HASH:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.skip(parseInfo, 1);
                    break;

                case TokenMap.REVERSE_SOLIDUS:
                    // a new line may follow the backslash
                    this.advance(parseInfo);

                    // EOF
                    // end of stream ignore \\
                    if (!this.peek(parseInfo) && parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    break;

                case TokenMap.SINGLE_QUOTE:
                case TokenMap.DOUBLE_QUOTE:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    return this.consumeString(parseInfo);

                case TokenMap.DOT:
                    const codepoint = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + 1];

                    if (isIdentStart(codepoint) || codepoint === TokenMap.MINUS) {
                        // if (parseInfo.position < parseInfo.currentPosition) {
                        //     return this.makeToken(parseInfo);
                        // }

                        this.skip(parseInfo, 1);
                        let tokensCount: number = this.consumeIdentToken(parseInfo);

                        if (tokensCount > 0) {
                            this.skipIdent(parseInfo, tokensCount);
                            return this.makeToken(parseInfo, EnumToken.ClassSelectorTokenType);
                        }
                    }

                    // if (!isDigit(codepoint) && parseInfo.position !== parseInfo.currentPosition) {
                    //     this.makeToken(parseInfo);
                    //     this.skip(parseInfo, 2);
                    //     return this;
                    // }

                    // the dot, or the character that follows it (U+2028 / U+2029 are identifier characters)
                    this.advanceCode(parseInfo);
                    break;
                default:
                    this.skip(parseInfo, 1);
                    break;
            }
        }

        if (parseInfo.position < parseInfo.currentPosition) {
            return this.makeToken(parseInfo);
        }

        return this.makeToken(parseInfo, EnumToken.EOFTokenType);
    }

    /**
     * tokenize readable stream
     */
    async tokenizeStream(): Promise<this> {
        const decoder = new TextDecoder("utf-8");
        const reader = this.input!.getReader();

        let parseInfo: ParseInfo = this.parseInfo as ParseInfo;

        parseInfo.stream = "";

        while (true) {
            const { done, value } = await reader.read();
            const stream = ArrayBuffer.isView(value) ? decoder.decode(value, { stream: true }) : value;

            if (!done) {
                // inlined: parseInfo.source.append(stream as string)
                parseInfo.source.content += stream as string;
            } else {
                break;
            }
        }

        Tokenizer.load(parseInfo, parseInfo.source.content);
        return this; // .next();
    }
}
