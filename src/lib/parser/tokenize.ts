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
    Position,
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
    definedPropertySettings,
    generalEnclosedFunc,
    gridTemplateFunc,
    imageFunc,
    mathFuncs,
    supportFunc,
    timelineFunc,
    timingFunc,
    transformFunctions,
    urlFunc,
    whenElseFunc,
} from "../syntax/constants.ts";
import {
    isDigit,
    isHash,
    isHexColor,
    isIdent,
    isNewLine,
    isNumber,
    isPercentage,
    isPseudo,
    isWhiteSpace,
    parseDimension,
} from "../syntax/syntax.ts";
import { getSyntaxConfig } from "../validation/config.ts";

const syntaxDefinitions = getSyntaxConfig();
const SymbolsMapTokens: Record<string, EnumToken> = {
    // 'or': EnumToken.OrTokenType,
    // 'and': EnumToken.AndTokenType,
    // 'not': EnumToken.NotTokenType,
    // 'only': EnumToken.OnlyTokenType,
    "|": EnumToken.Pipe,
    "&": EnumToken.NestingSelectorTokenType,
    "||": EnumToken.ColumnCombinatorTokenType,
    "*": EnumToken.Star,
    "+": EnumToken.Plus,
    "~": EnumToken.Tilda,
    "=": EnumToken.DelimTokenType,
    "~=": EnumToken.IncludeMatchTokenType,
    "^=": EnumToken.StartMatchTokenType,
    "$=": EnumToken.EndMatchTokenType,
    "|=": EnumToken.DashMatchTokenType,
    "*=": EnumToken.ContainMatchTokenType,
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
    ...Object.keys(syntaxDefinitions.syntaxes).reduce(
        (acc, curr) => (curr.endsWith("()") ? ((acc[curr.slice(0, -1)] = EnumToken.FunctionTokenDefType), acc) : acc),
        Object.create(null),
    ),
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
    ...generalEnclosedFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.GeneralEnclosedFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
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
        acc[curr + "("] = EnumToken.TransformFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
    ...whenElseFunc.reduce((acc, curr: string) => {
        acc[curr + "("] = EnumToken.WhenElseFunctionTokenDefType;
        return acc;
    }, Object.create(null)),
};

export const hintsEnum = new Set([
    EnumToken.CommaTokenType,
    EnumToken.ImportantTokenType,
    EnumToken.WhitespaceTokenType,
    EnumToken.SemiColonTokenType,
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
}
export function* consumeString(quoteStr: '"' | "'", buffer: string, parseInfo: ParseInfo): Generator<TokenizeResult> {
    const quote = quoteStr;
    let value;
    // let hasNewLine: boolean = false;

    if (buffer.length > 0) {
        yield yieldResult(buffer, parseInfo);
        buffer = "";
    }

    buffer += quoteStr;

    while ((value = peek(parseInfo))) {
        if (value == "\\") {
            const sequence: string = peek(parseInfo, 6);
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
                const codepoint = parseInt(escapeSequence, 16);

                if (
                    codepoint == 0 ||
                    // leading surrogate
                    (0xd800 <= codepoint && codepoint <= 0xdbff) ||
                    // trailing surrogate
                    (0xdc00 <= codepoint && codepoint <= 0xdfff)
                ) {
                    buffer += String.fromCodePoint(0xfffd);
                } else {
                    buffer += String.fromCodePoint(codepoint);
                }

                next(parseInfo, escapeSequence.length + 1 + (isWhiteSpace(peek(parseInfo)?.charCodeAt(0)) ? 1 : 0));

                continue;
            }

            buffer += next(parseInfo, 2);
            continue;
        }

        if (value == quote) {
            buffer += value;
            yield yieldResult(
                buffer,
                parseInfo,
                /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType,
            );
            next(parseInfo);
            buffer = "";
            return;
        }

        if (isNewLine(value.charCodeAt(0))) {
            yield yieldResult(buffer + next(parseInfo), parseInfo, EnumToken.BadStringTokenType);
            // buffer = "";
            return;
        }

        buffer += value;
        next(parseInfo);
    }

    // if (hasNewLine) {
    //     yield yieldResult(buffer, parseInfo, EnumToken.BadStringTokenType);
    // } else {
    // EOF - 'Unclosed-string' fixed
    yield yieldResult(buffer + quote, parseInfo, EnumToken.StringTokenType);
    // }
}

export function getTokenType(val: string, hint?: EnumToken): Token {
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

    if (hint != null) {
        token = Object.defineProperty({ typ: hint }, "val", {
            ...definedPropertySettings,
            value: val,
            enumerable: !hintsEnum.has(hint),
        }) as Token;
    } else {
        // if (v == 'currentcolor' || v == 'transparent' /* || v in COLORS_NAMES */) {
        //     token = <ColorToken>{
        //         typ: EnumToken.ColorTokenType,
        //         val: v,
        //         kin: ColorType.LIT
        //     };
        // }

        if (val.charAt(0) == "@" && isIdent(val.slice(1))) {
            token = {
                typ: EnumToken.AtRuleTokenType,
                nam: val.slice(1),
            } as Token;
        } else if (val.charAt(0) == "." && isIdent(val.slice(1))) {
            token = {
                typ: EnumToken.ClassSelectorTokenType,
                val,
            };
        } else if (val.charAt(0) == "#") {
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
        } else if ("\"'".includes(val.charAt(0))) {
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

    return token;
}

export function yieldResult(val: string, parseInfo: ParseInfo, hint?: EnumToken): TokenizeResult {
    const token: Token = getTokenType(val, hint) as Token;

    Object.defineProperty(token, "loc", {
        ...definedPropertySettings,
        value: {
            src: parseInfo.src,
            sta: { ...parseInfo.position },
            end: { ...parseInfo.currentPosition },
        },
    });
    parseInfo.position.ind = parseInfo.currentPosition.ind;
    parseInfo.position.lin = parseInfo.currentPosition.lin;
    parseInfo.position.col = Math.max(parseInfo.currentPosition.col, 1);

    if (token.loc!.end.col == 0) {
        token.loc!.end.col = 1;
    }

    return { token, bytesIn: parseInfo.currentPosition.ind + 1 };
}

export function match(parseInfo: ParseInfo, input: string): boolean {
    const position = parseInfo.currentPosition.ind - parseInfo.offset;
    return parseInfo.stream.slice(position + 1, position + input.length + 1) == input;
}

export function peek(parseInfo: ParseInfo, count: number = 1): string {
    if (count == 1) {
        return parseInfo.stream.charAt(parseInfo.currentPosition.ind - parseInfo.offset + 1);
    }

    const position = parseInfo.currentPosition.ind - parseInfo.offset;
    return parseInfo.stream.slice(position + 1, position + count + 1);
}

export function prev(parseInfo: ParseInfo): string {
    return parseInfo.offset == parseInfo.currentPosition.ind
        ? parseInfo.buffer.slice(-1)
        : parseInfo.stream.charAt(parseInfo.currentPosition.ind - parseInfo.offset - 1);
}

export function next(parseInfo: ParseInfo, count: number = 1): string {
    let char: string = "";
    let chr: string = "";
    let position = parseInfo.currentPosition.ind - parseInfo.offset;

    while (count-- && (chr = parseInfo.stream.charAt(position + 1))) {
        char += chr;
        const codepoint: number = parseInfo.stream.charCodeAt(++position);
        ++parseInfo.currentPosition.ind;

        if (isNewLine(codepoint)) {
            parseInfo.currentPosition.lin++;
            parseInfo.currentPosition.col = 0;
        } else {
            parseInfo.currentPosition.col++;
        }
    }

    return char;
}

/**
 * tokenize css string
 * @param parseInfo
 * @param yieldEOFToken
 */
export function* tokenize(parseInfo: ParseInfo | string, yieldEOFToken: boolean = true): Generator<TokenizeResult> {
    if (typeof parseInfo == "string") {
        parseInfo = {
            stream: parseInfo,
            buffer: "",
            acc: "",
            src: "",
            offset: 0,
            position: { ind: 0, lin: 1, col: 1 },
            currentPosition: { ind: -1, lin: 1, col: 0 },
        };
    }

    let value: string;
    let nextValue: string;
    let buffer: string = parseInfo.buffer;
    let charCode: number;

    parseInfo.buffer = "";
    parseInfo.acc += parseInfo.stream;

    while ((value = next(parseInfo))) {
        nextValue = peek(parseInfo);

        if ((value === "-" || value === "+") && !isNumber(nextValue.charAt(0))) {
            if (value === "+") {
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo);
                    buffer = "";
                }

                yield yieldResult(value, parseInfo);
                continue;
            }

            buffer += value;
            continue;
        }

        if (SymbolsMapTokens[value] === EnumToken.WhitespaceTokenType) {
            if (buffer.length > 0) {
                yield yieldResult(buffer, parseInfo);
                buffer = "";
            }

            while (SymbolsMapTokens[peek(parseInfo)] == EnumToken.WhitespaceTokenType) {
                value += next(parseInfo);
            }

            yield yieldResult(value, parseInfo, EnumToken.WhitespaceTokenType);
            continue;
        }

        if (value + nextValue in SymbolsMapTokens) {
            if (buffer.length > 0) {
                yield yieldResult(buffer, parseInfo);
                buffer = "";
            }

            yield yieldResult(value + next(parseInfo), parseInfo, SymbolsMapTokens[value + nextValue]);
            continue;
        }

        if (buffer + value in SymbolsMapTokens) {
            yield yieldResult(buffer + (value === "(" ? "" : value), parseInfo, SymbolsMapTokens[buffer + value]);
            buffer = "";
            continue;
        }

        if (value === "(") {
            if (buffer[0] === ":" && isPseudo(buffer)) {
                yield yieldResult(buffer, parseInfo, EnumToken.PseudoClassFunctionTokenDefType);
                buffer = "";
                continue;
            } else if (isIdent(buffer)) {
                yield yieldResult(buffer, parseInfo, EnumToken.FunctionTokenDefType);
                buffer = "";
                continue;
            }
        }

        if (value in SymbolsMapTokens) {
            if (buffer.length > 0) {
                yield yieldResult(buffer, parseInfo);
                buffer = "";
            }

            yield yieldResult(value, parseInfo, SymbolsMapTokens[value]);
            continue;
        }

        charCode = value.charCodeAt(0);

        switch (charCode) {
            case TokenMap.EXCLAMATION:
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo);
                    buffer = "";
                }

                if (match(parseInfo, "important")) {
                    yield yieldResult(value + next(parseInfo, 9), parseInfo, EnumToken.ImportantTokenType);
                    buffer = "";
                }

                break;

            case TokenMap.SLASH:
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo);

                    buffer = "";
                }

                if (!match(parseInfo, "*")) {
                    yield yieldResult(value, parseInfo, SymbolsMapTokens[value]);
                    break;
                }

                buffer += value + next(parseInfo);

                while ((value = next(parseInfo))) {
                    if (value == "*") {
                        buffer += value;

                        if (match(parseInfo, "/")) {
                            yield yieldResult(buffer + next(parseInfo), parseInfo, EnumToken.CommentTokenType);
                            buffer = "";
                            break;
                        }
                    } else {
                        buffer += value;
                    }
                }

                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo, EnumToken.BadCommentTokenType);
                    buffer = "";
                }

                break;

            case TokenMap.LOWERTHAN:
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo);
                    buffer = "";
                }

                if (match(parseInfo, "=")) {
                    yield yieldResult(value + next(parseInfo), parseInfo, EnumToken.LteTokenType);
                    break;
                }

                buffer += value;

                if (match(parseInfo, "!--")) {
                    buffer += next(parseInfo, 3);

                    while ((value = next(parseInfo))) {
                        buffer += value;
                        if (value == "-" && match(parseInfo, "->")) {
                            break;
                        }
                    }

                    if (value === "") {
                        yield yieldResult(buffer, parseInfo, EnumToken.BadCdoTokenType);
                    } else {
                        yield yieldResult(buffer + next(parseInfo, 2), parseInfo, EnumToken.CDOCOMMTokenType);
                    }

                    buffer = "";
                }

                break;

            case TokenMap.HASH:
                if (buffer.length > 0) {
                    yield yieldResult(buffer, parseInfo);
                    buffer = "";
                }

                buffer += value;
                break;

            case TokenMap.REVERSE_SOLIDUS:
                // EOF
                if (!(value = next(parseInfo))) {
                    // end of stream ignore \\
                    if (buffer.length > 0) {
                        yield yieldResult(buffer, parseInfo);
                        buffer = "";
                    }

                    break;
                }

                buffer += prev(parseInfo) + value;
                break;

            case TokenMap.SINGLE_QUOTE:
            case TokenMap.DOUBLE_QUOTE:
                yield* consumeString(value as '"' | "'", buffer, parseInfo);
                buffer = "";
                break;

            case TokenMap.DOT:
                const codepoint = peek(parseInfo).charCodeAt(0);

                if (!isDigit(codepoint) && buffer !== "") {
                    yield yieldResult(buffer, parseInfo);
                    buffer = value;
                    break;
                }

                buffer += value;
                break;
            default:
                buffer += value;
                break;
        }
    }

    if (yieldEOFToken) {
        if (buffer.length > 0) {
            yield yieldResult(buffer, parseInfo);
        }

        yield yieldResult("", parseInfo, EnumToken.EOFTokenType);
    } else {
        parseInfo.buffer = buffer;
    }
}

/**
 * tokenize readable stream
 * @param input
 */
export async function* tokenizeStream(input: ReadableStream<Uint8Array>): AsyncGenerator<TokenizeResult> {
    const parseInfo: ParseInfo = {
        stream: "",
        buffer: "",
        acc: "",
        src: "",
        offset: 0,
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 },
    };

    const decoder = new TextDecoder("utf-8");
    const reader = input.getReader();

    while (true) {
        const { done, value } = await reader.read();
        const stream = ArrayBuffer.isView(value) ? decoder.decode(value, { stream: true }) : value;

        if (!done) {
            if (parseInfo.stream.length > 2) {
                parseInfo.stream = parseInfo.stream.slice(-2) + stream;
                parseInfo.offset = parseInfo.currentPosition.ind - 1;
            } else {
                parseInfo.stream = stream as string;
                parseInfo.offset = Math.max(0, parseInfo.currentPosition.ind);
            }
        }

        yield* tokenize(parseInfo, done);

        if (done) {
            break;
        }
    }
}

/**
 * Update position
 * @param position
 * @param str
 */
export function move(position: Position, str: string) {
    let i: number = 0;

    for (; i < str.length; i++) {
        if (isNewLine(str[i].charCodeAt(0))) {
            position.lin++;
            position.col = 0;
        } else {
            position.col++;
        }
    }
}
