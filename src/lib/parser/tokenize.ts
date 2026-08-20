import type {
    AngleToken,
    ColorToken,
    DimensionToken,
    FlexToken,
    FrequencyToken,
    HashToken,
    LengthToken,
    NumberToken,
    ParseInfo,
    PercentageToken,
    ResolutionToken,
    TimeToken,
    Token,
    TokenizeResult,
    UnclosedStringToken,
} from "../../@types/index.d.ts";
import { ColorType, EnumToken } from "../ast/types.ts";
import {
    colorsFunc,
    containerFunc,
    gridTemplateFunc,
    imageFunc,
    LOC,
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
    isDigit,
    isHash,
    isHexColor,
    isIdent,
    isIdentCodepoint,
    isIdentStart,
    isNewLine,
    isNonPrintable,
    isNumber,
    isPercentage,
    isWhiteSpace,
    parseDimension,
} from "../syntax/syntax.ts";
import { SourceFile } from "./source.ts";
import { equalsIgnoreCase } from "./utils/text.ts";

export const SymbolsMapTokens: Record<string, EnumToken> = {
    "+": EnumToken.Plus,
    "=": EnumToken.DelimTokenType,
    "|": EnumToken.Pipe,
    "||": EnumToken.ColumnCombinatorTokenType,
    "|=": EnumToken.DashMatchTokenType,
    "&": EnumToken.NestingSelectorTokenType,
    "*": EnumToken.Star,
    "*=": EnumToken.ContainMatchTokenType,
    "~": EnumToken.Tilda,
    "~=": EnumToken.IncludeMatchTokenType,
    "^=": EnumToken.StartMatchTokenType,
    "$=": EnumToken.EndMatchTokenType,
    ",": EnumToken.Comma,
    ":": EnumToken.ColonTokenType,
    "::": EnumToken.DoubleColonTokenType,
    ";": EnumToken.SemiColonTokenType,
    "(": EnumToken.StartParensTokenType,
    ")": EnumToken.EndParensTokenType,
    "[": EnumToken.AttrStartTokenType,
    "]": EnumToken.AttrEndTokenType,
    "{": EnumToken.BlockStartTokenType,
    "}": EnumToken.BlockEndTokenType,
    "<=": EnumToken.LteTokenType,
    ">": EnumToken.GtTokenType,
    ">=": EnumToken.GteTokenType,
    " ": EnumToken.Whitespace,
    "\t": EnumToken.Whitespace,
    "\r": EnumToken.Whitespace,
    "\n": EnumToken.Whitespace,
    "\f": EnumToken.Whitespace,
    ...pseudoElements.reduce((acc, curr: string) => {
        acc[curr] = EnumToken.PseudoElementTokenType;
        return acc;
    }, Object.create(null)),
    ...containerFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.ContainerFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...urlFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.UrlFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...gridTemplateFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.GridTemplateFuncTokenDefType;
        return acc;
    }, Object.create(null)),
    ...imageFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.ImageFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...timelineFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.TimelineFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    // ...generalEnclosedFunc.reduce((acc, curr: string) => {
    //     acc[curr + "("] = EnumToken.GeneralEnclosedFunctionTokenDefType;
    //     return acc;
    // }, Object.create(null)),
    ...supportFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.SupportsFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...timingFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.TimingFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...colorsFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.ColorFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...mathFuncs.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.MathFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...transformFunctions.reduce((acc, curr: string) => {
        acc[curr.toLowerCase() + "("] = EnumToken.TransformFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...whenElseFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.WhenElseFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...wildCardFuncs.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.WildCardFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
};

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
}
export function consumeString(parseInfo: ParseInfo): Array<TokenizeResult> {
    const quote: number = next(parseInfo).charCodeAt(0);
    let charCode: number;
    let decodeSegments: boolean = false;

    const result: Array<TokenizeResult> = [];

    while ((charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode) {
        if (charCode == TokenMap.REVERSE_SOLIDUS) {
            if (charCode == parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1)) {
                next(parseInfo, 2);
                continue;
            }

            const sequence: string = peek(parseInfo, 7);
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
                // const codepoint = parseInt(escapeSequence, 16);

                // TODO set decode flag ON
                // if (
                //     codepoint == 0 ||
                //     // leading surrogate
                //     (0xd800 <= codepoint && codepoint <= 0xdbff) ||
                //     // trailing surrogate
                //     (0xdc00 <= codepoint && codepoint <= 0xdfff)
                // ) {
                //     buffer += String.fromCodePoint(0xfffd);
                // } else {
                //     buffer += String.fromCodePoint(codepoint);
                // }

                const length: number =
                    escapeSequence.length +
                    1 +
                    (isWhiteSpace(parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset)?.charCodeAt(0))
                        ? 1
                        : 0);

                decodeSegments = true;

                next(parseInfo, length);

                continue;
            }

            next(parseInfo, 2);
            continue;
        }

        if (charCode == quote) {
            next(parseInfo);
            result.push(
                yieldResult(
                    parseInfo,
                    /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType,
                    decodeSegments ? { decodeSegments } : null,
                ),
            );

            return result;
        }

        if (isNewLine(charCode)) {
            next(parseInfo);
            result.push(yieldResult(parseInfo, EnumToken.BadStringTokenType));

            return result;
        }

        next(parseInfo);
    }

    // EOF - 'Unclosed-string' fixed
    result.push(yieldResult(parseInfo, EnumToken.StringTokenType));
    return result;
}

export function yieldResult(
    parseInfo: ParseInfo,
    hint?: EnumToken,
    options?: { decodeSegments: boolean } | null,
): TokenizeResult {
    let val: string = parseInfo.stream.slice(
        parseInfo.position - parseInfo.offset,
        parseInfo.currentPosition - parseInfo.offset,
    );

    let token: Token | null = null;
    let dimension:
        | DimensionToken
        | LengthToken
        | AngleToken
        | FlexToken
        | TimeToken
        | ResolutionToken
        | FrequencyToken
        | null;

    if (options?.decodeSegments) {
        val = val.replace(/\\([0-9a-fA-F]{1,6})(?:\s)?/g, (_, sequence) => {
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

    if (hint != null) {
        let searchArray: string[] | null = null;

        switch (hint) {
            case EnumToken.TransformFunctionTokenDefType:
                searchArray = transformFunctions;
                break;
            case EnumToken.ColorFunctionTokenDefType:
                searchArray = colorsFunc;
                break;
            case EnumToken.ContainerFunctionTokenDefType:
                searchArray = containerFunc;
                break;
            case EnumToken.UrlFunctionTokenDefType:
                searchArray = urlFunc;
                break;
            case EnumToken.GridTemplateFuncTokenDefType:
                searchArray = gridTemplateFunc;
                break;
            case EnumToken.ImageFunctionTokenDefType:
                searchArray = imageFunc;
                break;
            case EnumToken.TimelineFunctionTokenDefType:
                searchArray = timelineFunc;
                break;
            // case EnumToken.GeneralEnclosedFunctionTokenDefType:
            //     searchArray = generalEnclosedFunc;
            //     break;
            case EnumToken.SupportsFunctionTokenDefType:
                searchArray = supportFunc;
                break;
            case EnumToken.TimingFunctionTokenDefType:
                searchArray = timingFunc;
                break;
            case EnumToken.MathFunctionTokenDefType:
                searchArray = mathFuncs;
                break;
            case EnumToken.WhenElseFunctionTokenDefType:
                searchArray = whenElseFunc;
                break;
            case EnumToken.WildCardFunctionTokenDefType:
                searchArray = wildCardFuncs;
                break;
        }

        if (searchArray != null) {
            val = searchArray.find((v: string): boolean => equalsIgnoreCase(v, val)) as string;
        }

        token = hintsEnum.has(hint) ? ({ typ: hint } as Token) : ({ typ: hint, val } as Token);
    } else {
        let slice: string = val.slice(1);
        const chr: string = val.charAt(0);

        if (chr == "!" && equalsIgnoreCase("!important", val)) {
            token = {
                typ: EnumToken.ImportantTokenType,
            } as Token;
        } else if (chr == "@" && isIdent(slice)) {
            token = {
                typ: EnumToken.AtRuleTokenType,
                nam: slice,
            } as Token;
        } else if (chr == "." && isIdent(slice)) {
            token = {
                typ: EnumToken.ClassSelectorTokenType,
                val,
            };
        } else if (chr == "#") {
            if (isHexColor(val)) {
                token = <ColorToken>{
                    typ: EnumToken.ColorTokenType,
                    val: val,
                    kin: ColorType.HEX,
                };
            } else if (isHash(val)) {
                token = <HashToken>{
                    typ: EnumToken.HashTokenType,
                    val: val,
                };
            }
        } else if ("\"'".includes(chr)) {
            token = <UnclosedStringToken>{
                typ: EnumToken.UnclosedStringTokenType,
                val: val,
            };
        } else if (isNumber(val)) {
            token =
                val[0] === "-" || val[0] === "+"
                    ? {
                          typ: EnumToken.NumberTokenType,
                          sign: val[0],
                          val: +val,
                      }
                    : <NumberToken>{
                          typ: EnumToken.NumberTokenType,
                          val: +val,
                      };
        } else if (isPercentage(val)) {
            token = <PercentageToken>{
                typ: EnumToken.PercentageTokenType,
                val: +val.slice(0, -1),
            };
        } else if ((dimension = parseDimension(val))) {
            token = dimension;
        } else if (isIdent(val)) {
            token = {
                typ: val.startsWith("--") ? EnumToken.DashedIdenTokenType : EnumToken.IdenTokenType,
                val,
            } as Token;
        }
    }

    if (token == null) {
        token = {
            typ: EnumToken.LiteralTokenType,
            val,
        };
    }

    // return token;
    token[LOC] = {
        srcId: parseInfo.source.id as number,
        sta: parseInfo.position,
        end: parseInfo.currentPosition,
    };

    parseInfo.position = parseInfo.currentPosition;

    return { token, bytesIn: parseInfo.currentPosition };
}

export function match(parseInfo: ParseInfo, input: string): boolean {
    let position: number = parseInfo.currentPosition - parseInfo.offset;

    for (let i: number = 0; i < input.length; i++) {
        if (parseInfo.stream[position + i] != input.charAt(i)) {
            return false;
        }
    }

    return true;
}

export function peek(parseInfo: ParseInfo, count: number = 1): string {
    if (count == 1) {
        return parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset);
    }

    const position = parseInfo.currentPosition - parseInfo.offset;
    return parseInfo.stream.slice(position, position + count);
}

export function next(parseInfo: ParseInfo, count: number = 1): string {
    let position = parseInfo.currentPosition - parseInfo.offset;

    let char: string =
        count == 1 ? parseInfo.stream.charAt(position) : parseInfo.stream.slice(position, position + count);
    let i: number = 0;
    let codepoint: number;

    for (; i < char.length; i++) {
        codepoint = char[i].charCodeAt(0);

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
                parseInfo.source.lineStarts.lineStarts.push(position + i);
            }
        }
    }

    parseInfo.currentPosition += char.length;
    return char;
}
function isIdentToken(parseInfo: ParseInfo, start?: number, end?: number): boolean {
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

        if ((nextCodepoint = parseInfo.stream.charCodeAt(i + 1)) != nextCodepoint) {
            return false;
        }

        if (isDigit(nextCodepoint)) {
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

        // if (!isIdentCodepoint(codepoint)) {
        //     return false;
        // }
        i += String.fromCodePoint(codepoint).length;

        // if (i < j) {
        //     codepoint = name.charCodeAt(i) as number;

        //     if (!isIdentCodepoint(codepoint)) {
        //         return false;
        //     }
        // }
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

function isPseudo(parseInfo: ParseInfo): boolean {
    let position: number = parseInfo.currentPosition - parseInfo.offset;
    let endPosition: number = parseInfo.currentPosition - parseInfo.offset;
    return (parseInfo.stream.charAt(position) == ":" &&
        parseInfo.stream.charAt(endPosition - 1) == "(" &&
        (parseInfo.stream.charAt(position + 1) == ":"
            ? isIdentToken(parseInfo, 2, -1)
            : isIdentToken(parseInfo, 1, -1))) ||
        parseInfo.stream.charAt(position + 1) == ":"
        ? isIdentToken(parseInfo, 2)
        : isIdentToken(parseInfo, 1);
}

function startsWith(parseInfo: ParseInfo, input: string): boolean {
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

function isURLToken(parseInfo: ParseInfo): boolean {
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

/**
 * Tokenize CSS string
 * @param parseInfo
 * @param yieldEOFToken
 */
export function tokenize(parseInfo: ParseInfo | string, yieldEOFToken: boolean = true): Array<TokenizeResult> {
    if (typeof parseInfo == "string") {
        parseInfo = {
            stream: parseInfo,
            source: new SourceFile(parseInfo, [], ""),
            offset: 0,
            time: 0,
            position: 0,
            currentPosition: 0,
        };
    }

    let charCode: number;
    let nextCharCode: number;

    const startTime: number = performance.now();
    const result: TokenizeResult[] = [];
    // allow 10 characters buffer for the streaming parser to avoid incomplete tokens
    const endPosition: number = parseInfo.stream.length - 1;

    // NaN is not equal to NaN
    while ((charCode = peek(parseInfo).charCodeAt(0)) == charCode) {
        switch (charCode) {
            case TokenMap.EQUALS:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.DelimTokenType));
                break;

            // '+' or '-'
            case TokenMap.PLUS:
            case TokenMap.MINUS:
                nextCharCode = peek(parseInfo).charCodeAt(0);

                // not a number
                if (charCode === TokenMap.PLUS && !(nextCharCode >= 0x30 && nextCharCode <= 0x39)) {
                    if (parseInfo.position < parseInfo.currentPosition) {
                        result.push(yieldResult(parseInfo));
                    }

                    next(parseInfo);

                    result.push(
                        yieldResult(
                            parseInfo,
                            SymbolsMapTokens[
                                parseInfo.stream
                                    .slice(
                                        parseInfo.position - parseInfo.offset,
                                        parseInfo.currentPosition - parseInfo.offset,
                                    )
                                    .toLowerCase()
                            ],
                        ),
                    );
                    break;
                }

                next(parseInfo);

                break;

            // '{'
            case TokenMap.LEFT_BRACE:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.BlockStartTokenType));
                break;
            // '}'
            case TokenMap.RIGHT_BRACE:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.BlockEndTokenType));
                break;

            // '('
            case TokenMap.LEFT_PARENTHESIS:
                if (parseInfo.position < parseInfo.currentPosition) {
                    if (parseInfo.stream[parseInfo.position - parseInfo.offset] === ":" && isPseudo(parseInfo)) {
                        next(parseInfo);
                        result.push(yieldResult(parseInfo, EnumToken.PseudoClassFunctionTokenDefType));

                        break;
                    } else if (isIdentToken(parseInfo)) {
                        const hint: EnumToken = startsWith(parseInfo, "--")
                            ? EnumToken.CustomFunctionTokenDefType
                            : (SymbolsMapTokens[
                                  parseInfo.stream
                                      .slice(
                                          parseInfo.position - parseInfo.offset,
                                          parseInfo.currentPosition - parseInfo.offset,
                                      )
                                      .toLowerCase() + "("
                              ] ?? EnumToken.FunctionTokenDefType);

                        result.push(yieldResult(parseInfo, hint));
                        next(parseInfo);

                        // consume '('
                        parseInfo.position = parseInfo.currentPosition;

                        if (hint === EnumToken.UrlFunctionTokenDefType) {
                            // consume an <url>
                            while (isWhiteSpace(peek(parseInfo).charCodeAt(0))) {
                                next(parseInfo);
                            }

                            charCode = peek(parseInfo).charCodeAt(0);

                            let values: Array<TokenizeResult> | null = null;

                            if (charCode == TokenMap.DOUBLE_QUOTE || charCode == TokenMap.SINGLE_QUOTE) {
                                values = consumeString(parseInfo);
                            } else {
                                do {
                                    next(parseInfo);
                                    // value = peek(parseInfo);
                                    charCode = peek(parseInfo).charCodeAt(0);
                                } while (
                                    // !(value === "/" && match(parseInfo, "/*") &&
                                    charCode !== TokenMap.RIGHT_PARENTHESIS &&
                                    parseInfo.currentPosition < endPosition
                                );
                            }

                            if (values != null) {
                                // NaN is not equal to NaN
                                if ((charCode = peek(parseInfo).charCodeAt(0)) != charCode) {
                                    for (let i = 0; i < values.length; i++) {
                                        values[i].token.typ = EnumToken.BadUrlTokenType;
                                    }
                                }

                                result.push(...values);
                            } else if (parseInfo.position < parseInfo.currentPosition) {
                                result.push(
                                    yieldResult(
                                        parseInfo,
                                        // parseInfo.position < parseInfo.currentPosition
                                        (charCode = peek(parseInfo).charCodeAt(0)) != charCode || !isURLToken(parseInfo)
                                            ? EnumToken.BadUrlTokenType
                                            : EnumToken.UrlTokenTokenType,
                                    ),
                                );
                            }
                        }

                        break;
                    }
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.StartParensTokenType));

                break;

            // ')'
            case TokenMap.RIGHT_PARENTHESIS:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.EndParensTokenType));
                break;

            // '['
            case TokenMap.LEFT_BRACKETS:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.AttrStartTokenType));
                break;
            // ']'
            case TokenMap.RIGHT_BRACKETS:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.AttrEndTokenType));
                break;

            case TokenMap.SEMICOLON:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.SemiColonTokenType));
                break;

            case TokenMap.COLON:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);

                if (peek(parseInfo).charCodeAt(0) == TokenMap.COLON) {
                    next(parseInfo);
                    result.push(yieldResult(parseInfo, EnumToken.DoubleColonTokenType));
                    break;
                }

                result.push(yieldResult(parseInfo, EnumToken.ColonTokenType));
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
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                nextCharCode = parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset).charCodeAt(0);

                while (
                    nextCharCode == 0x20 ||
                    (nextCharCode >= 0x9 && nextCharCode <= 0xd) ||
                    nextCharCode == 0x2028 ||
                    nextCharCode == 0x2029
                ) {
                    next(parseInfo);
                    nextCharCode = parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset).charCodeAt(0);
                }

                result.push(yieldResult(parseInfo, EnumToken.WhitespaceTokenType));

                break;

            case TokenMap.COMMA:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.CommaTokenType));
                break;

            case TokenMap.DOLLAR:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                if (match(parseInfo, "$=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.EndMatchTokenType));
                    break;
                }

                next(parseInfo);
                break;

            case TokenMap.TILDA:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                if (match(parseInfo, "~=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.IncludeMatchTokenType));
                    break;
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.Tilda));

                break;

            // case '^':
            case TokenMap.CARET:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                if (match(parseInfo, "^=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.StartMatchTokenType));
                    break;
                }

                next(parseInfo);
                break;

            case TokenMap.STAR:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                if (match(parseInfo, "*=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.ContainMatchTokenType));
                    break;
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.Star));

                break;

            case TokenMap.AMPERSAND:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.NestingSelectorTokenType));

                break;

            case TokenMap.PIPE:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                // '||'
                if (match(parseInfo, "||")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.ColumnCombinatorTokenType));
                    break;
                } else if (match(parseInfo, "|=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.DashMatchTokenType));
                    break;
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.Pipe));

                break;

            case TokenMap.EXCLAMATION:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                if (match(parseInfo, "!important")) {
                    next(parseInfo, 10);
                    result.push(yieldResult(parseInfo, EnumToken.ImportantTokenType));

                    break;
                }

                next(parseInfo);
                break;

            case TokenMap.SLASH:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                if (!match(parseInfo, "/*")) {
                    next(parseInfo);
                    result.push(
                        yieldResult(
                            parseInfo,
                            SymbolsMapTokens[parseInfo.stream.slice(parseInfo.position, parseInfo.currentPosition)],
                        ),
                    );
                    break;
                }

                next(parseInfo, 2);

                while ((charCode = next(parseInfo).charCodeAt(0)) == charCode) {
                    if (charCode == TokenMap.STAR) {
                        if (match(parseInfo, "/")) {
                            next(parseInfo);
                            result.push(yieldResult(parseInfo, EnumToken.CommentTokenType));

                            break;
                        }
                    }
                    // else {
                    // buffer += value;
                    // }
                }

                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo, EnumToken.BadCommentTokenType));
                }

                break;

            case TokenMap.GREATERTHAN:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                if (match(parseInfo, ">=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.GteTokenType));
                    break;
                }

                next(parseInfo);
                result.push(yieldResult(parseInfo, EnumToken.GtTokenType));

                break;

            case TokenMap.LOWERTHAN:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                if (match(parseInfo, "<=")) {
                    next(parseInfo, 2);
                    result.push(yieldResult(parseInfo, EnumToken.LteTokenType));
                    break;
                }

                next(parseInfo);

                if (match(parseInfo, "!--")) {
                    next(parseInfo, 3);

                    while ((charCode = next(parseInfo).charCodeAt(0)) == charCode) {
                        if (charCode == TokenMap.MINUS && match(parseInfo, "->")) {
                            break;
                        }
                    }

                    if (parseInfo.currentPosition >= endPosition) {
                        result.push(yieldResult(parseInfo, EnumToken.BadCdoTokenType));
                    } else {
                        next(parseInfo, 2);
                        result.push(yieldResult(parseInfo, EnumToken.CDOCOMMTokenType));
                    }
                }

                break;

            case TokenMap.HASH:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                next(parseInfo);
                break;

            case TokenMap.REVERSE_SOLIDUS:
                if (!yieldEOFToken && parseInfo.stream.length == parseInfo.currentPosition - parseInfo.offset + 1) {
                    break;
                }

                next(parseInfo);

                // EOF
                if (!peek(parseInfo)) {
                    if (!yieldEOFToken) {
                        break;
                    }

                    // end of stream ignore \\
                    if (parseInfo.position < parseInfo.currentPosition) {
                        result.push(yieldResult(parseInfo));
                    }

                    break;
                }

                next(parseInfo);
                break;

            case TokenMap.SINGLE_QUOTE:
            case TokenMap.DOUBLE_QUOTE:
                if (parseInfo.position < parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                }

                result.push(...consumeString(parseInfo));
                break;

            case TokenMap.DOT:
                const codepoint = parseInfo.stream
                    .charAt(parseInfo.currentPosition - parseInfo.offset + 1)
                    .charCodeAt(0);

                if (!isDigit(codepoint) && parseInfo.position !== parseInfo.currentPosition) {
                    result.push(yieldResult(parseInfo));
                    next(parseInfo, 2);
                    break;
                }

                next(parseInfo);
                break;
            default:
                next(parseInfo);
                break;
        }

        if (!yieldEOFToken && endPosition <= parseInfo.currentPosition - parseInfo.offset + 1) {
            break;
        }
    }

    if (yieldEOFToken) {
        if (parseInfo.position < parseInfo.currentPosition) {
            result.push(yieldResult(parseInfo));
        }

        result.push(yieldResult(parseInfo, EnumToken.EOFTokenType));
    }

    parseInfo.time += performance.now() - startTime;
    return result;
}

/**
 * tokenize readable stream
 * @param input
 * @param parseInfo
 */
export async function* tokenizeStream(
    input: ReadableStream<Uint8Array>,
    parseInfo: ParseInfo,
): AsyncGenerator<TokenizeResult> {
    const decoder = new TextDecoder("utf-8");
    const reader = input.getReader();

    parseInfo.stream = "";

    while (true) {
        const { done, value } = await reader.read();
        const stream = ArrayBuffer.isView(value) ? decoder.decode(value, { stream: true }) : value;

        if (!done) {
            parseInfo.source.append(stream as string);

            parseInfo.stream = (parseInfo.stream.slice(parseInfo.position - parseInfo.offset) + stream) as string;

            parseInfo.offset = parseInfo.offset = parseInfo.position;
        } else {
            parseInfo.stream = "";
        }

        yield* tokenize(parseInfo, done);

        if (done) {
            break;
        }
    }
}
