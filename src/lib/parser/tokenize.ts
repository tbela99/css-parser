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

const SymbolsMapTokens: Record<string, EnumToken> = Object.create(null);

// Regex for escape sequence decoding - compile once, reuse many times
const ESCAPE_SEQUENCE_REGEX = /\\([0-9a-fA-F]{1,6})(?:\s)?/g;

function decodeEscapeSequences(value: string): string {
    return value.replace(ESCAPE_SEQUENCE_REGEX, (_, sequence) => {
        const codepoint = parseInt(sequence, 16);

        if (
            codepoint == 0 ||
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

function assignTokenMap(entries: string[], tokenType: EnumToken, suffix: string = "", lowercase: boolean = false) {
    for (const entry of entries) {
        SymbolsMapTokens[(lowercase ? entry.toLowerCase() : entry) + suffix] = tokenType;
    }
}

SymbolsMapTokens[""] = EnumToken.DelimTokenType;
SymbolsMapTokens["+"] = EnumToken.Plus;
SymbolsMapTokens["="] = EnumToken.DelimTokenType;
SymbolsMapTokens["|"] = EnumToken.Pipe;
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

const SymbolsMapTokensKeys = Object.keys(SymbolsMapTokens);

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
    const len: number = end - start;
    const keysLength = SymbolsMapTokensKeys.length;

    // Early exit for impossible lengths
    if (len < 0) return null;

    for (let i = 0; i < keysLength; i++) {
        const key = SymbolsMapTokensKeys[i];
        if (key.length !== len) continue;

        // Match character by character
        let match = true;

        for (let j = 0; j < len; j++) {
            let ca = key.charCodeAt(j);
            let cb = parseInfo.stream.charCodeAt(start + j);

            // Normalize A-Z to a-z
            if (ca >= 65 && ca <= 90) ca += 32;
            if (cb >= 65 && cb <= 90) cb += 32;

            if (ca !== cb) {
                match = false;
                break;
            }
        }

        if (match) {
            return SymbolsMapTokens[key];
        }
    }

    return null;
}

function searchArray(array: string[], parseInfo: ParseInfo, start: number, end: number): string | null {
    const len: number = end - start;

    // Early exit for impossible lengths
    if (len < 0) return null;

    // Use a simple linear search optimized with length pre-filtering
    let i: number = array.length;

    while (i--) {
        if (array[i].length !== len) continue;

        // Match character by character
        let match = true;
        const arrayItem = array[i];

        for (let j: number = 0; j < len; j++) {
            let ca = arrayItem.charCodeAt(j);
            let cb = parseInfo.stream.charCodeAt(start + j);

            // Normalize A-Z to a-z
            if (ca >= 65 && ca <= 90) ca += 32;
            if (cb >= 65 && cb <= 90) cb += 32;

            if (ca != cb) {
                match = false;
                break;
            }
        }

        if (match) {
            return arrayItem;
        }
    }

    return null;
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
     * token hint
     */
    private hint: EnumToken | null = null;
    private state: EnumToken | null = null;

    constructor(
        private parseInfo: ParseInfo,
        private input: ReadableStream<Uint8Array> | null = null,
    ) {
        if (typeof this.parseInfo == "string") {
            if (typeof parseInfo == "string") {
                this.parseInfo = {
                    stream: parseInfo,
                    source: new SourceFile(parseInfo, [], ""),
                    offset: 0,
                    time: 0,
                    position: 0,
                    currentPosition: 0,
                };
            }
        }
    }

    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeString(parseInfo: ParseInfo): this {
        const quote: number = this.advance(parseInfo).charCodeAt(0);
        let charCode: number;
        let decodeSegments: boolean = false;

        while ((charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode) {
            if (charCode == TokenMap.REVERSE_SOLIDUS) {
                if (charCode == parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1)) {
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
                        codepoint == 0x20 ||
                        (codepoint >= 0x61 && codepoint <= 0x66) ||
                        (codepoint >= 0x41 && codepoint <= 0x46) ||
                        (codepoint >= 0x30 && codepoint <= 0x39)
                    ) {
                        escapeSequence += sequence[i];

                        if (codepoint == 0x20) {
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
                        (isWhiteSpace(
                            parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset)?.charCodeAt(0),
                        )
                            ? 1
                            : 0);

                    decodeSegments = true;
                    this.advance(parseInfo, length);
                    continue;
                }

                this.advance(parseInfo, 2);
                continue;
            }

            if (charCode == quote) {
                this.advance(parseInfo);
                return this.makeToken(
                    parseInfo,
                    /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType,
                    decodeSegments ? { decodeSegments } : null,
                    // ),
                );
            }

            if (isNewLine(charCode)) {
                this.advance(parseInfo);
                return this.makeToken(parseInfo, EnumToken.BadStringTokenType);
            }

            this.advance(parseInfo);
        }

        // EOF - 'Unclosed-string' fixed
        return this.makeToken(parseInfo, EnumToken.StringTokenType);
        // return result;
    }

    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeURLToken(parseInfo: ParseInfo): this {
        const quote: number = this.advance(parseInfo).charCodeAt(0);
        let charCode: number;
        let decodeSegments: boolean = false;

        while ((charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode) {
            if (charCode == TokenMap.REVERSE_SOLIDUS) {
                if (charCode == parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1)) {
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
                        codepoint == 0x20 ||
                        (codepoint >= 0x61 && codepoint <= 0x66) ||
                        (codepoint >= 0x41 && codepoint <= 0x46) ||
                        (codepoint >= 0x30 && codepoint <= 0x39)
                    ) {
                        escapeSequence += sequence[i];

                        if (codepoint == 0x20) {
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
                        (isWhiteSpace(
                            parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset)?.charCodeAt(0),
                        )
                            ? 1
                            : 0);

                    decodeSegments = true;

                    this.advance(parseInfo, length);

                    continue;
                }

                this.advance(parseInfo, 2);
                continue;
            }

            if (charCode == quote) {
                this.advance(parseInfo);

                let k: number = 1;
                let end: number = parseInfo.stream.length - parseInfo.offset;
                let position: number = parseInfo.currentPosition - parseInfo.offset;

                while (position + k < end) {
                    charCode = parseInfo.stream.charCodeAt(position);

                    // NaN != NaN
                    if (charCode != charCode) {
                        this.advance(parseInfo, k);
                        return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
                    }

                    if (isWhiteSpace(charCode)) {
                        this.advance(parseInfo, k);
                        k++;
                        continue;
                    }

                    if (charCode != TokenMap.RIGHT_PARENTHESIS) {
                        this.advance(parseInfo, k);
                        return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
                    }
                    break;
                }

                // consume until the ')'
                return this.makeToken(
                    parseInfo,
                    /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType,
                    decodeSegments ? { decodeSegments } : null,
                );
                // return result;
            }

            if (isNewLine(charCode)) {
                // bad string
                this.advance(parseInfo);

                while (
                    (charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode
                ) {
                    if (charCode == TokenMap.REVERSE_SOLIDUS) {
                        this.advance(parseInfo, 2);
                        continue;
                    }

                    if (charCode == TokenMap.RIGHT_PARENTHESIS) {
                        return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
                    }

                    this.advance(parseInfo);
                }

                return this.makeToken(parseInfo, EnumToken.BadStringTokenType);
            }

            this.advance(parseInfo);
        }

        // EOF - bad url token
        return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
        // return result;
    }

    /**
     * consume number, dimension, or percentage
     * @param parseInfo
     * @returns
     */
    consumeNumericToken(parseInfo: ParseInfo): number {
        let position: number = parseInfo.currentPosition - parseInfo.offset;
        let offset: number = position;
        let hasDigits: boolean = false;
        let hasLetter: boolean = false;
        let hasPercent: boolean = false;

        let codepoint: number = parseInfo.stream.charCodeAt(position) as number;

        this.slice = null;
        this.hint = null;

        // '+' '-'
        if (codepoint == 0x2b || codepoint == 0x2d) {
            position++;
        }

        // consume digits
        while (position < parseInfo.stream.length) {
            codepoint = parseInfo.stream.charCodeAt(position) as number;

            if (isDigit(codepoint)) {
                hasDigits = true;
                position++;
                continue;
            }

            // '.' 'E' 'e'
            if (codepoint == 0x2e || codepoint == 0x45 || codepoint == 0x65) {
                position++;
                break;
            }

            if (
                isWhiteSpace(codepoint) ||
                codepoint == TokenMap.RIGHT_PARENTHESIS ||
                codepoint == TokenMap.SEMICOLON ||
                codepoint == TokenMap.RIGHT_BRACE ||
                codepoint == TokenMap.SLASH ||
                codepoint == TokenMap.STAR ||
                codepoint == TokenMap.COMMA
            ) {
                return !hasDigits ? 0 : position - offset;
            }

            if (codepoint == TokenMap.PERCENTAGE) {
                hasPercent = true;
                break;
            }

            if (isLetter(codepoint)) {
                hasLetter = true;
                break;
            }

            return 0;
        }

        if (!hasLetter && !hasPercent) {
            // '.'
            if (codepoint == 0x2e) {
                codepoint = parseInfo.stream.charCodeAt(position) as number;

                if (codepoint != codepoint) {
                    return !hasDigits ? 0 : position - offset;
                }

                if (
                    isWhiteSpace(codepoint) ||
                    codepoint == TokenMap.RIGHT_PARENTHESIS ||
                    codepoint == TokenMap.SEMICOLON ||
                    codepoint == TokenMap.RIGHT_BRACE ||
                    codepoint == TokenMap.SLASH ||
                    codepoint == TokenMap.STAR ||
                    codepoint == TokenMap.COMMA
                ) {
                    return !hasDigits ? 0 : position - offset;
                }

                if (!isDigit(codepoint)) {
                    if (!hasDigits) {
                        return 0;
                    }

                    if (codepoint == TokenMap.PERCENTAGE) {
                        hasPercent = true;
                    } else if (isLetter(codepoint)) {
                        hasLetter = true;
                    } else {
                        return 0;
                    }
                } else {
                    position++;
                    hasDigits = true;
                }
            }

            if (!hasLetter && !hasPercent) {
                while (position + 1 <= parseInfo.stream.length) {
                    codepoint = parseInfo.stream.charCodeAt(position) as number;

                    if (isDigit(codepoint)) {
                        position++;
                        continue;
                    }

                    if (!hasDigits) {
                        return 0;
                    }

                    // 'E' 'e'
                    if (codepoint == 0x45 || codepoint == 0x65) {
                        position++;
                        break;
                    }

                    if (
                        isWhiteSpace(codepoint) ||
                        codepoint == TokenMap.RIGHT_PARENTHESIS ||
                        codepoint == TokenMap.SEMICOLON ||
                        codepoint == TokenMap.RIGHT_BRACE ||
                        codepoint == TokenMap.SLASH ||
                        codepoint == TokenMap.STAR ||
                        codepoint == TokenMap.COMMA
                    ) {
                        return position - offset;
                    }

                    if (isLetter(codepoint)) {
                        hasLetter = true;
                        break;
                    }

                    if (codepoint == TokenMap.PERCENTAGE) {
                        hasPercent = true;
                        break;
                    }

                    return 0;
                }
                // 'E' 'e' - 'em'
                if ((codepoint == 0x45 || codepoint == 0x65) && hasDigits && !hasLetter && !hasPercent) {
                    if (isLetter(parseInfo.stream.charCodeAt(position) as number)) {
                        hasLetter = true;
                    }
                }

                if (!hasLetter && !hasPercent) {
                    // 'E' 'e'
                    if (codepoint == 0x45 || codepoint == 0x65) {
                        codepoint = parseInfo.stream.charCodeAt(position + 1) as number;

                        // '+' '-'
                        if (codepoint == 0x2b || codepoint == 0x2d) {
                            position++;
                        }

                        codepoint = position = parseInfo.stream.charCodeAt(position + 1) as number;

                        if (!isDigit(codepoint)) {
                            if (!hasDigits) {
                                return 0;
                            }
                            if (isLetter(codepoint)) {
                                hasLetter = true;
                            } else if (codepoint == TokenMap.PERCENTAGE) {
                                hasPercent = true;
                            } else {
                                return 0;
                            }
                        }
                    }

                    if (!hasLetter && !hasPercent) {
                        while (++position < parseInfo.stream.length) {
                            codepoint = parseInfo.stream.charCodeAt(position) as number;

                            // eof
                            if (codepoint != codepoint) {
                                break;
                            }

                            if (isDigit(codepoint)) {
                                position++;
                                continue;
                            }

                            if (!hasDigits) {
                                return 0;
                            }

                            if (
                                isWhiteSpace(codepoint) ||
                                codepoint == TokenMap.RIGHT_PARENTHESIS ||
                                codepoint == TokenMap.SEMICOLON ||
                                codepoint == TokenMap.RIGHT_BRACE ||
                                codepoint == TokenMap.SLASH ||
                                codepoint == TokenMap.STAR ||
                                codepoint == TokenMap.COMMA
                            ) {
                                return position - offset;
                            } else if (isLetter(codepoint)) {
                                hasLetter = true;
                                break;
                            } else if (codepoint == TokenMap.PERCENTAGE) {
                                hasPercent = true;
                                break;
                            } else {
                                return 0;
                            }
                        }

                        if (!hasLetter && !hasPercent) {
                            return position - offset;
                        }
                    }
                }
            }
        }

        if (!hasDigits) {
            return 0;
        }

        if (hasPercent) {
            const slice = position;

            codepoint = parseInfo.stream.charCodeAt(++position) as number;

            if (
                codepoint != codepoint ||
                isWhiteSpace(codepoint) ||
                codepoint == TokenMap.RIGHT_PARENTHESIS ||
                codepoint == TokenMap.SEMICOLON ||
                codepoint == TokenMap.RIGHT_BRACE ||
                codepoint == TokenMap.SLASH ||
                codepoint == TokenMap.STAR ||
                codepoint == TokenMap.COMMA
            ) {
                this.slice = slice;
                this.hint = EnumToken.PercentageTokenType;
                return position - offset;
            }

            return 0;
        }

        if (hasLetter) {
            codepoint = parseInfo.stream.charCodeAt(position - 1) as number;

            // 'E' 'e'
            const slice = codepoint == 0x45 || codepoint == 0x65 ? position - 1 : position;

            while (position + 1 <= parseInfo.stream.length) {
                codepoint = parseInfo.stream.charCodeAt(++position) as number;

                if (!isLetter(codepoint)) {
                    break;
                }
            }

            if (
                codepoint != codepoint ||
                isWhiteSpace(codepoint) ||
                codepoint == TokenMap.RIGHT_PARENTHESIS ||
                codepoint == TokenMap.SEMICOLON ||
                codepoint == TokenMap.RIGHT_BRACE ||
                codepoint == TokenMap.PLUS ||
                codepoint == TokenMap.SLASH ||
                codepoint == TokenMap.STAR ||
                codepoint == TokenMap.COMMA
            ) {
                this.slice = slice;
                this.hint = getSymbolHint(parseInfo, slice, position) ?? EnumToken.DimensionTokenType;
                return position - offset;
            }

            return 0;
        }

        return 0;
    }

    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeIdentToken(parseInfo: ParseInfo): number {
        let position: number = parseInfo.currentPosition - parseInfo.offset;
        let offset: number = position;

        let codepoint: number = parseInfo.stream.charCodeAt(position);

        if (!isIdentStart(codepoint) && codepoint != TokenMap.MINUS) {
            return 0;
        }

        if (codepoint == TokenMap.MINUS) {
            position++;
            codepoint = parseInfo.stream.charCodeAt(position);

            if (!isIdentStart(codepoint) && codepoint != TokenMap.MINUS) {
                return 0;
            }
        }

        while ((codepoint = parseInfo.stream.charCodeAt(position)) == codepoint) {
            if (codepoint == TokenMap.REVERSE_SOLIDUS) {
                // eof
                if ((codepoint = parseInfo.stream.charCodeAt(position + 1)) != codepoint) {
                    // this.next(parseInfo, position);
                    return 0;
                }

                // \n \r \f \v
                if (
                    codepoint == 0xa ||
                    codepoint == 0xb ||
                    codepoint == 0xc ||
                    codepoint == 0xd ||
                    codepoint == 0x2028 ||
                    codepoint == 0x2029
                ) {
                    return 0;
                }

                position += 2;
                continue;
            }

            if (codepoint == 0x2d || isIdentCodepoint(codepoint)) {
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

                if (codepoint != codepoint || isWhiteSpace(codepoint)) {
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

        let codepoint: number = parseInfo.stream.charCodeAt(position);

        if (codepoint != TokenMap.HASH) {
            return 0;
        }

        position++;

        let count: number = 0;

        while (true) {
            codepoint = parseInfo.stream.charCodeAt(position);

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

        if (count != 3 && count != 4 && count != 6 && count != 8) {
            return 0;
        }

        codepoint = parseInfo.stream.charCodeAt(position);

        if (
            codepoint != codepoint ||
            isWhiteSpace(codepoint) ||
            codepoint == TokenMap.RIGHT_PARENTHESIS ||
            codepoint == TokenMap.SEMICOLON ||
            codepoint == TokenMap.RIGHT_BRACE ||
            codepoint == TokenMap.COMMA
        ) {
            return position - offset;
        }

        return 0;
    }

    parseURLToken(parseInfo: ParseInfo, endPosition: number): this {
        let charCode: number;

        // consume an <url>
        while (isWhiteSpace(this.peek(parseInfo).charCodeAt(0))) {
            this.advance(parseInfo);
        }

        charCode = this.peek(parseInfo).charCodeAt(0);

        if (charCode == TokenMap.DOUBLE_QUOTE || charCode == TokenMap.SINGLE_QUOTE) {
            return this.consumeURLToken(parseInfo);
        }

        do {
            this.advance(parseInfo);
            charCode = this.peek(parseInfo).charCodeAt(0);
        } while (
            // !(value === "/" && this.match(parseInfo, "/*") &&
            charCode !== TokenMap.RIGHT_PARENTHESIS &&
            parseInfo.currentPosition < endPosition
        );

        // if (parseInfo.position < parseInfo.currentPosition) {
        return this.makeToken(
            parseInfo,
            // parseInfo.position < parseInfo.currentPosition
            (charCode = this.peek(parseInfo).charCodeAt(0)) != charCode || !this.isURLToken(parseInfo)
                ? EnumToken.BadUrlTokenType
                : EnumToken.UrlTokenTokenType,
        );
        // }
    }
    /**
     *
     * @param parseInfo
     * @param hint
     * @param options
     * @returns
     */
    makeToken(
        parseInfo: ParseInfo,
        hint?: EnumToken | null,
        options?: { decodeSegments?: boolean; slice?: number | null; sign?: "+" | "-" | null } | null,
    ): this {
        let val: string | null = null;

        this.typ = null;
        this.nam = null;
        this.val = null;
        this.unit = null;
        this.kin = null;
        this.decodeString = null;
        this.slice = null;
        this.hint = null;

        if (options?.slice) {
            this.slice = options.slice;
        }

        if (options?.decodeSegments) {
            this.decodeString = true;
        }

        if (hint != null) {
            let array: string[] | null = null;
            let hasUnit: boolean = false;

            switch (hint) {
                case EnumToken.TransformFunctionTokenDefType:
                    array = transformFunctions;
                    break;
                case EnumToken.ColorFunctionTokenDefType:
                    array = colorsFunc;
                    break;
                case EnumToken.ContainerFunctionTokenDefType:
                    array = containerFunc;
                    break;
                case EnumToken.UrlFunctionTokenDefType:
                    array = urlFunc;
                    break;
                case EnumToken.GridTemplateFuncTokenDefType:
                    array = gridTemplateFunc;
                    break;
                case EnumToken.ImageFunctionTokenDefType:
                    array = imageFunc;
                    break;
                case EnumToken.TimelineFunctionTokenDefType:
                    array = timelineFunc;
                    break;
                // case EnumToken.GeneralEnclosedFunctionTokenDefType:
                //     searchArray = generalEnclosedFunc;
                //     break;
                case EnumToken.SupportsFunctionTokenDefType:
                    array = supportFunc;
                    break;
                case EnumToken.TimingFunctionTokenDefType:
                    array = timingFunc;
                    break;
                case EnumToken.MathFunctionTokenDefType:
                    array = mathFuncs;
                    break;
                case EnumToken.WhenElseFunctionTokenDefType:
                    array = whenElseFunc;
                    break;
                case EnumToken.WildCardFunctionTokenDefType:
                    array = wildCardFuncs;
                    break;
                case EnumToken.FrequencyTokenType:
                    array = frequencyUnits;
                    hasUnit = true;
                    break;
                case EnumToken.ResolutionTokenType:
                    array = resolutionUnits;
                    hasUnit = true;
                    break;
                case EnumToken.LengthTokenType:
                    array = dimensionUnits;
                    hasUnit = true;
                    break;
                case EnumToken.FlexTokenType:
                    array = flexUnits;
                    hasUnit = true;
                    break;
                case EnumToken.AngleTokenType:
                    array = angleUnits;
                    hasUnit = true;
                    break;
                case EnumToken.TimeTokenType:
                    array = timeUnits;
                    hasUnit = true;
                    break;
                case EnumToken.DimensionTokenType:
                    hasUnit = true;
                    break;
            }

            if (array != null) {
                val = searchArray(
                    array,
                    parseInfo,
                    hasUnit ? (options?.slice as number) : parseInfo.position - parseInfo.offset,
                    parseInfo.currentPosition - parseInfo.offset,
                ) as string;
            } else if (!hintsEnum.has(hint)) {
                val = parseInfo.stream.slice(
                    (options?.slice as number) ?? parseInfo.position - parseInfo.offset,
                    parseInfo.currentPosition - parseInfo.offset,
                );
            }

            if (this.decodeString) {
                val = decodeEscapeSequences(val as string);
            }

            if (hintsEnum.has(hint)) {
                this.typ = hint;
            } else {
                this.typ = hint;

                if (hasUnit || hint == EnumToken.PercentageTokenType || hint == EnumToken.DimensionTokenType) {
                    this.val = parseFloat(
                        parseInfo.stream.slice(parseInfo.position - parseInfo.offset, options?.slice as number),
                    );

                    if (hint != EnumToken.PercentageTokenType) {
                        this.unit = val;
                    }
                } else if (hint == EnumToken.NumberTokenType) {
                    this.val = parseFloat(val as string);
                } else if (hint == EnumToken.AtRuleTokenType) {
                    this.nam = val;
                } else {
                    this.val = val;

                    if (hint == EnumToken.ColorTokenType) {
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

            if (options?.decodeSegments) {
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
     *
     * @param parseInfo
     * @param input
     * @returns
     */
    equalsIgnoreCase(parseInfo: ParseInfo, input: string): boolean {
        let position: number = parseInfo.currentPosition - parseInfo.offset;

        let ca: number;
        let cb: number;

        for (let i: number = 0; i < input.length; i++) {
            ca = parseInfo.stream.charCodeAt(position + i);
            cb = input.charCodeAt(i);

            // Normalize A-Z to a-z
            if (ca >= 65 && ca <= 90) ca += 32;
            if (cb >= 65 && cb <= 90) cb += 32;

            if (ca != cb) {
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

        for (let i: number = 0; i < input.length; i++) {
            if (parseInfo.stream[position + i] != input.charAt(i)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get the current character code without creating a string
     * @param parseInfo
     * @returns charCode at current position
     */
    peekCharCode(parseInfo: ParseInfo): number {
        return parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset);
    }

    /**
     *
     * @param parseInfo
     * @param count
     * @returns
     */
    peek(parseInfo: ParseInfo, count: number = 1): string {
        if (count == 1) {
            return parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset);
        }

        const position = parseInfo.currentPosition - parseInfo.offset;
        return parseInfo.stream.slice(position, position + count);
    }

    /**
     *
     * @param parseInfo
     * @param count
     * @returns
     */
    advance(parseInfo: ParseInfo, count: number = 1): string {
        let position = parseInfo.currentPosition - parseInfo.offset;

        let char: string =
            count == 1 ? parseInfo.stream.charAt(position) : parseInfo.stream.slice(position, position + count);
        let i: number = 0;
        let codepoint: number;
        const lineStarts = parseInfo.source.lineStarts.lineStarts;

        for (; i < char.length; i++) {
            codepoint = char.charCodeAt(i);

            if (
                codepoint == 0xa || // \n
                codepoint == 0xb || // \v
                codepoint == 0xc || // \f
                codepoint == 0xd || // \r
                codepoint == 0x2028 || // \u2028
                codepoint == 0x2029 // \u2029
            ) {
                // \r\n
                if (codepoint == 0xa && i > 0 && char.charCodeAt(i - 1) == 0xd) {
                    // nope
                } else {
                    lineStarts.push(position + parseInfo.offset + i);
                }
            }
        }

        parseInfo.currentPosition += char.length;
        return char;
    }

    /**
     *
     * @param parseInfo
     * @param start
     * @param end
     * @returns
     */
    isIdentToken(parseInfo: ParseInfo, start?: number, end?: number): boolean {
        let j: number = parseInfo.currentPosition - parseInfo.offset;
        let i: number = parseInfo.position - parseInfo.offset;

        if (start != null) {
            if (end == null) {
                if (start < 0) {
                    j += start;
                } else {
                    i += start;
                }
            } else {
                if (end < 0) {
                    j += end;
                } else {
                    j = parseInfo.position + end;
                }
            }
        }

        j--;

        let codepoint: number = parseInfo.stream.charCodeAt(i) as number;

        // -
        if (codepoint == 0x2d) {
            let nextCodepoint: number;

            // NaN != NaN
            if ((nextCodepoint = parseInfo.stream.charCodeAt(i + 1)) != nextCodepoint) {
                return false;
            }

            if (!isIdentStart(nextCodepoint) && nextCodepoint != 0x2d) {
                return false;
            }

            codepoint = nextCodepoint;
            i++;
        }

        if (codepoint !== 0x2d && !isIdentStart(codepoint)) {
            return false;
        }

        if (codepoint == TokenMap.REVERSE_SOLIDUS) {
            codepoint = parseInfo.stream.charCodeAt(i + 1) as number;

            i += String.fromCodePoint(codepoint).length;
        }

        while (i < j) {
            i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
            codepoint = parseInfo.stream.charCodeAt(i) as number;

            if (codepoint == TokenMap.REVERSE_SOLIDUS) {
                i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
                codepoint = parseInfo.stream.charCodeAt(i) as number;
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
     * @returns
     */
    isPseudo(parseInfo: ParseInfo): boolean {
        let position: number = parseInfo.currentPosition - parseInfo.offset;
        let endPosition: number = parseInfo.currentPosition - parseInfo.offset;
        return (parseInfo.stream.charAt(position) == ":" &&
            parseInfo.stream.charAt(endPosition - 1) == "(" &&
            (parseInfo.stream.charAt(position + 1) == ":"
                ? this.isIdentToken(parseInfo, 2, -1)
                : this.isIdentToken(parseInfo, 1, -1))) ||
            parseInfo.stream.charAt(position + 1) == ":"
            ? this.isIdentToken(parseInfo, 2)
            : this.isIdentToken(parseInfo, 1);
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

        while (i < j) {
            if (parseInfo.stream.charAt(parseInfo.position - parseInfo.offset + i) != input.charAt(i)) {
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
            c = parseInfo.stream.charCodeAt(i) as number;

            // single quote or double quote or start parenthesis or close parenthesis
            if (isNonPrintable(c) || c == 0x27 || c == 0x22 || c == 0x28 || c == 0x29) {
                return false;
            }

            // valid escape
            if (c == TokenMap.REVERSE_SOLIDUS) {
                i++;

                if (i >= parseInfo.currentPosition) {
                    return false;
                }

                c = parseInfo.stream.charCodeAt(i) as number;

                // c is not '\n' or '\r' or '\f'
                if (c == 0x6e || c == 0x72 || c == 0x66) {
                    return false;
                }

                continue;
            }

            // is white space
            if (c == 0x20 || c == 0x09) {
                break;
            }
        }

        return i == parseInfo.currentPosition;
    }

    done(): boolean {
        return this.typ === EnumToken.EOF;
    }

    /**
     * Tokenize CSS string
     * @param parseInfo
     * @param yieldEOFToken
     */
    next(/* parseInfo: ParseInfo | string, yieldEOFToken: boolean = true */): this {
        const parseInfo: ParseInfo = this.parseInfo as ParseInfo;

        this.source = parseInfo.source;

        let charCode: number;
        let nextCharCode: number;

        // const result: TokenizeResult[] = [];
        // allow 10 characters buffer for the streaming parser to avoid incomplete tokens
        const endPosition: number = parseInfo.stream.length - 1; // yieldEOFToken ? parseInfo.stream.length - 1 : parseInfo.stream.length - 10;
        let tokensCount: number;

        // NaN is not equal to NaN
        while ((charCode = this.peekCharCode(parseInfo)) == charCode) {
            if (this.state === EnumToken.UrlFunctionTokenDefType) {
                this.state = null;
                return this.parseURLToken(parseInfo, endPosition);
                continue;
            }

            if (parseInfo.position == parseInfo.currentPosition) {
                if (
                    charCode == TokenMap.MINUS ||
                    charCode == TokenMap.PLUS ||
                    charCode == TokenMap.DOT ||
                    isDigit(charCode)
                ) {
                    tokensCount = this.consumeNumericToken(parseInfo);

                    if (tokensCount > 0) {
                        this.advance(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, this.hint ?? EnumToken.NumberTokenType, {
                            slice: this.slice,
                            sign: charCode == TokenMap.MINUS ? "-" : charCode == TokenMap.PLUS ? "+" : null,
                        });
                        continue;
                    }
                }

                if (isIdentStart(charCode) || charCode == TokenMap.MINUS) {
                    tokensCount = this.consumeIdentToken(parseInfo);

                    if (tokensCount > 0) {
                        this.advance(parseInfo, tokensCount);

                        charCode = this.peek(parseInfo).charCodeAt(0);

                        // do not match function
                        if (TokenMap.LEFT_PARENTHESIS != charCode) {
                            return this.makeToken(
                                parseInfo,
                                this.startsWith(parseInfo, "--")
                                    ? EnumToken.DashedIdenTokenType
                                    : EnumToken.IdenTokenType,
                            );
                            continue;
                        }
                    }
                }

                if (charCode == TokenMap.AT) {
                    this.advance(parseInfo);

                    charCode = this.peek(parseInfo).charCodeAt(0);

                    // match at-rule
                    if (charCode == TokenMap.MINUS || isIdentStart(this.peek(parseInfo).charCodeAt(0))) {
                        // consume '@'
                        parseInfo.position = parseInfo.currentPosition;
                        tokensCount = this.consumeIdentToken(parseInfo);

                        if (tokensCount > 0) {
                            this.advance(parseInfo, tokensCount);

                            return this.makeToken(parseInfo, EnumToken.AtRuleTokenType);
                            continue;
                        }
                    }
                }

                if (charCode == TokenMap.HASH) {
                    tokensCount = this.consumeColor(parseInfo);

                    if (tokensCount > 0) {
                        this.advance(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, EnumToken.ColorTokenType);
                        continue;
                    }

                    this.advance(parseInfo);

                    tokensCount = this.consumeIdentToken(parseInfo);

                    if (tokensCount > 0) {
                        this.advance(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, EnumToken.HashTokenType);
                        continue;
                    }
                }
            }
            // EOF
            switch (charCode) {
                case TokenMap.EQUALS:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.DelimTokenType);
                    break;

                // '+' or '-'
                case TokenMap.PLUS:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);

                    charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset);

                    if (isDigit(charCode)) {
                        tokensCount = this.consumeNumericToken(parseInfo);

                        if (tokensCount > 0) {
                            this.advance(parseInfo, tokensCount);
                            return this.makeToken(parseInfo, this.hint ?? EnumToken.NumberTokenType, {
                                slice: this.slice,
                                sign: "+",
                            });
                            break;
                        }
                    }

                    return this.makeToken(parseInfo, EnumToken.Plus);
                    break;

                case TokenMap.MINUS:
                    if (parseInfo.position == parseInfo.currentPosition) {
                        nextCharCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1);

                        // not a number
                        if (isWhiteSpace(nextCharCode)) {
                            this.advance(parseInfo);

                            return this.makeToken(parseInfo, EnumToken.Sub);
                            break;
                        }

                        if (
                            charCode == TokenMap.MINUS &&
                            (nextCharCode == TokenMap.MINUS || isIdentStart(nextCharCode))
                        ) {
                            this.advance(parseInfo);

                            tokensCount = this.consumeIdentToken(parseInfo);

                            if (tokensCount > 0) {
                                this.advance(parseInfo, tokensCount);
                                return this.makeToken(parseInfo, EnumToken.IdenTokenType);
                                continue;
                            }
                        }
                    }

                    this.advance(parseInfo);
                    break;

                // '{'
                case TokenMap.LEFT_BRACE:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.BlockStartTokenType);
                    break;
                // '}'
                case TokenMap.RIGHT_BRACE:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.BlockEndTokenType);
                    break;

                // '('
                case TokenMap.LEFT_PARENTHESIS:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        if (
                            parseInfo.stream[parseInfo.position - parseInfo.offset] === ":" &&
                            this.isPseudo(parseInfo)
                        ) {
                            this.advance(parseInfo);
                            return this.makeToken(parseInfo, EnumToken.PseudoClassFunctionTokenDefType);

                            break;
                        } else if (this.isIdentToken(parseInfo)) {
                            const hint: EnumToken = this.startsWith(parseInfo, "--")
                                ? EnumToken.CustomFunctionTokenDefType
                                : (getSymbolHint(
                                      parseInfo,
                                      parseInfo.position - parseInfo.offset,
                                      parseInfo.currentPosition - parseInfo.offset + 1,
                                  ) ?? EnumToken.FunctionTokenDefType);

                            this.makeToken(parseInfo, hint);
                            this.advance(parseInfo);

                            // consume '('
                            parseInfo.position = parseInfo.currentPosition;

                            if (hint === EnumToken.UrlFunctionTokenDefType) {
                                this.state = hint;
                            }

                            return this;
                            break;
                        }
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.StartParensTokenType);

                    break;

                // ')'
                case TokenMap.RIGHT_PARENTHESIS:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.EndParensTokenType);
                    break;

                // '['
                case TokenMap.LEFT_BRACKETS:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.AttrStartTokenType);
                    break;
                // ']'
                case TokenMap.RIGHT_BRACKETS:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.AttrEndTokenType);
                    break;

                case TokenMap.SEMICOLON:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.SemiColonTokenType);
                    break;

                case TokenMap.COLON:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);

                    if (this.peek(parseInfo).charCodeAt(0) == TokenMap.COLON) {
                        this.advance(parseInfo);

                        return this.makeToken(parseInfo, EnumToken.DoubleColonTokenType);
                        break;
                    }

                    return this.makeToken(parseInfo, EnumToken.ColonTokenType);
                    break;

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

                    this.advance(parseInfo);
                    nextCharCode = parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset).charCodeAt(0);

                    while (
                        nextCharCode == 0x20 ||
                        (nextCharCode >= 0x9 && nextCharCode <= 0xd) ||
                        nextCharCode == 0x2028 ||
                        nextCharCode == 0x2029
                    ) {
                        this.advance(parseInfo);
                        nextCharCode = parseInfo.stream
                            .charAt(parseInfo.currentPosition - parseInfo.offset)
                            .charCodeAt(0);
                    }

                    return this.makeToken(parseInfo, EnumToken.WhitespaceTokenType);

                    break;

                case TokenMap.COMMA:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.CommaTokenType);
                    break;

                case TokenMap.DOLLAR:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    if (this.match(parseInfo, "$=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.EndMatchTokenType);
                        break;
                    }

                    this.advance(parseInfo);
                    break;

                case TokenMap.TILDA:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    if (this.match(parseInfo, "~=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.IncludeMatchTokenType);
                        break;
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.Tilda);

                    break;

                // case '^':
                case TokenMap.CARET:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    if (this.match(parseInfo, "^=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.StartMatchTokenType);
                        break;
                    }

                    this.advance(parseInfo);
                    break;

                case TokenMap.STAR:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    if (this.match(parseInfo, "*=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.ContainMatchTokenType);
                        break;
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.Star);

                    break;

                case TokenMap.AMPERSAND:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.NestingSelectorTokenType);

                    break;

                case TokenMap.PIPE:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    // '||'
                    if (this.match(parseInfo, "||")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.ColumnCombinatorTokenType);
                        break;
                    } else if (this.match(parseInfo, "|=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.DashMatchTokenType);
                        break;
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.Pipe);

                    break;

                case TokenMap.EXCLAMATION:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    if (this.match(parseInfo, "!important")) {
                        this.advance(parseInfo, 10);
                        return this.makeToken(parseInfo, EnumToken.ImportantTokenType);

                        break;
                    }

                    this.advance(parseInfo);
                    break;

                case TokenMap.SLASH:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    if (!this.match(parseInfo, "/*")) {
                        this.advance(parseInfo);
                        return this.makeToken(
                            parseInfo,

                            getSymbolHint(
                                parseInfo,
                                parseInfo.position - parseInfo.offset,
                                parseInfo.currentPosition - parseInfo.offset,
                            ),
                        );
                        break;
                    }

                    this.advance(parseInfo, 2);

                    while ((charCode = this.advance(parseInfo).charCodeAt(0)) == charCode) {
                        if (charCode == TokenMap.STAR) {
                            if (this.match(parseInfo, "/")) {
                                this.advance(parseInfo);
                                return this.makeToken(parseInfo, EnumToken.CommentTokenType);

                                break;
                            }
                        }
                    }

                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo, EnumToken.BadCommentTokenType);
                    }

                    break;

                case TokenMap.GREATERTHAN:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    if (this.match(parseInfo, ">=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.GteTokenType);
                        break;
                    }

                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.GtTokenType);

                    break;

                case TokenMap.LOWERTHAN:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    if (this.match(parseInfo, "<=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.LteTokenType);
                        break;
                    }

                    this.advance(parseInfo);

                    if (this.match(parseInfo, "!--")) {
                        this.advance(parseInfo, 3);

                        while ((charCode = this.advance(parseInfo).charCodeAt(0)) == charCode) {
                            if (charCode == TokenMap.MINUS && this.match(parseInfo, "->")) {
                                break;
                            }
                        }

                        if (parseInfo.currentPosition >= endPosition) {
                            return this.makeToken(parseInfo, EnumToken.BadCdoTokenType);
                        } else {
                            this.advance(parseInfo, 2);
                            return this.makeToken(parseInfo, EnumToken.CDOCOMMTokenType);
                        }
                    }

                    break;

                case TokenMap.HASH:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    this.advance(parseInfo);
                    break;

                case TokenMap.REVERSE_SOLIDUS:
                    // if (!yieldEOFToken && parseInfo.stream.length == parseInfo.currentPosition - parseInfo.offset + 1) {
                    //     break;
                    // }

                    this.advance(parseInfo);

                    // EOF
                    if (!this.peek(parseInfo)) {
                        // if (!yieldEOFToken) {
                        //     break;
                        // }

                        // end of stream ignore \\
                        if (parseInfo.position < parseInfo.currentPosition) {
                            return this.makeToken(parseInfo);
                        }

                        break;
                    }

                    this.advance(parseInfo);
                    break;

                case TokenMap.SINGLE_QUOTE:
                case TokenMap.DOUBLE_QUOTE:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }

                    return this.consumeString(parseInfo);
                    break;

                case TokenMap.DOT:
                    const codepoint = parseInfo.stream
                        .charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1);

                    if (isIdentStart(codepoint) || codepoint == TokenMap.MINUS) {
                        this.advance(parseInfo);
                        let tokensCount: number = this.consumeIdentToken(parseInfo);

                        if (tokensCount > 0) {
                            this.advance(parseInfo, tokensCount);
                            return this.makeToken(parseInfo, EnumToken.ClassSelectorTokenType);
                            break;
                        }
                    }

                    if (!isDigit(codepoint) && parseInfo.position !== parseInfo.currentPosition) {
                        this.makeToken(parseInfo);
                        this.advance(parseInfo, 2);
                        return this;
                        break;
                    }

                    this.advance(parseInfo);
                    break;
                default:
                    this.advance(parseInfo);
                    break;
            }

            // if (!yieldEOFToken && endPosition <= parseInfo.currentPosition - parseInfo.offset + 1) {
            //     break;
            // }
        }

        // if (yieldEOFToken) {
        if (parseInfo.position < parseInfo.currentPosition) {
            return this.makeToken(parseInfo);
        }

        return this.makeToken(parseInfo, EnumToken.EOFTokenType);
        // }
    }

    /**
     * tokenize readable stream
     * @param input
     * @param parseInfo
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
                parseInfo.source.append(stream as string);
            } else {
                break;
            }
        }

        parseInfo.stream = parseInfo.source.getContent();
        return this; // .next();
    }
}
