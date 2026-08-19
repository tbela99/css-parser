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
    isNewLine,
    isNumber,
    isPercentage,
    isPseudo,
    isURLToken,
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
    const quote = next(parseInfo);
    let value: string;
    let buffer: string = quote;

    const result: Array<TokenizeResult> = [];

    while ((value = parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset))) {
        if (value == "\\") {
            if ("\\" == parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset + 1)) {
                buffer += next(parseInfo, 2);
                continue;
            }

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

                next(
                    parseInfo,
                    escapeSequence.length +
                        1 +
                        (isWhiteSpace(
                            parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset)?.charCodeAt(0),
                        )
                            ? 1
                            : 0),
                );

                continue;
            }

            buffer += next(parseInfo, 2);
            continue;
        }

        if (value == quote) {
            buffer += value;
            result.push(
                yieldResult(
                    buffer,
                    parseInfo,
                    /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType,
                ),
            );
            next(parseInfo);
            buffer = "";
            return result;
        }

        if (isNewLine(value.charCodeAt(0))) {
            result.push(yieldResult(buffer + next(parseInfo), parseInfo, EnumToken.BadStringTokenType));

            return result;
        }

        buffer += value;
        next(parseInfo);
    }

    // EOF - 'Unclosed-string' fixed
    result.push(yieldResult(buffer + quote, parseInfo, EnumToken.StringTokenType));
    return result;
}

export function yieldResult(val: string, parseInfo: ParseInfo, hint?: EnumToken): TokenizeResult {
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

    // console.debug(`Yield result: ${val}, ${hint}`);

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

        if (chr == "@" && isIdent(slice)) {
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

/**
 * Tokenize CSS string
 * @param parseInfo
 * @param yieldEOFToken
 */
export function tokenize(parseInfo: ParseInfo | string, yieldEOFToken: boolean = true): Array<TokenizeResult> {
    if (typeof parseInfo == "string") {
        parseInfo = {
            buffer: "",
            stream: parseInfo,
            source: new SourceFile(parseInfo, [], ""),
            offset: 0,
            time: 0,
            position: 0,
            currentPosition: 0,
        };
    }

    let value: string;
    let buffer: string = parseInfo.buffer;
    let charCode: number;
    let nextCharCode: number;

    const startTime: number = performance.now();
    const result: TokenizeResult[] = [];
    // allow 10 characters buffer for the streaming parser to avoid incomplete tokens
    const endPosition: number = parseInfo.stream.length - 10;

    parseInfo.buffer = "";

    while ((value = peek(parseInfo))) {
        charCode = value.charCodeAt(0);

        switch (charCode) {
            case TokenMap.EQUALS:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.DelimTokenType));
                break;

            // '+' or '-'
            case TokenMap.PLUS:
            case TokenMap.MINUS:
                next(parseInfo);

                if (charCode === TokenMap.PLUS && !isNumber(peek(parseInfo))) {
                    if (buffer.length > 0) {
                        result.push(yieldResult(buffer, parseInfo));
                        buffer = "";
                    }

                    result.push(yieldResult(value, parseInfo, SymbolsMapTokens[value]));
                    break;
                }

                buffer += value;
                break;

            // '{'
            case TokenMap.LEFT_BRACE:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.BlockStartTokenType));
                break;
            // '}'
            case TokenMap.RIGHT_BRACE:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.BlockEndTokenType));
                break;

            // '('
            case TokenMap.LEFT_PARENTHESIS:
                if (buffer.length > 0) {
                    if (buffer[0] === ":" && isPseudo(buffer)) {
                        next(parseInfo);
                        result.push(yieldResult(buffer, parseInfo, EnumToken.PseudoClassFunctionTokenDefType));
                        buffer = "";
                        break;
                    } else if (isIdent(buffer)) {
                        const hint: EnumToken = buffer.startsWith("--")
                            ? EnumToken.CustomFunctionTokenDefType
                            : (SymbolsMapTokens[buffer.toLowerCase() + "("] ?? EnumToken.FunctionTokenDefType);

                        result.push(yieldResult(buffer, parseInfo, hint));
                        next(parseInfo);
                        buffer = "";

                        if (hint === EnumToken.UrlFunctionTokenDefType) {
                            buffer = "";
                            value = peek(parseInfo);

                            // consume an <url>
                            while (isWhiteSpace(peek(parseInfo).charCodeAt(0))) {
                                // buffer += next(parseInfo);
                                next(parseInfo);
                                // charCode = value.charCodeAt(0);
                            }

                            value = peek(parseInfo);

                            let values: Array<TokenizeResult> | null = null;

                            if (value == '"' || value == "'") {
                                values = consumeString(parseInfo);
                            } else {
                                do {
                                    buffer += next(parseInfo);
                                    value = peek(parseInfo);
                                    charCode = value.charCodeAt(0);
                                } while (
                                    // !(value === "/" && match(parseInfo, "/*") &&
                                    value !== ")" &&
                                    value !== ""
                                );
                            }

                            if (values != null) {
                                if (peek(parseInfo) === "") {
                                    for (let i = 0; i < values.length; i++) {
                                        values[i].token.typ = EnumToken.BadUrlTokenType;
                                    }
                                }

                                result.push(...values);
                            } else if (buffer.length > 0) {
                                result.push(
                                    yieldResult(
                                        buffer.trimEnd(),
                                        parseInfo,
                                        // buffer.length > 0
                                        peek(parseInfo) === "" || !isURLToken(buffer)
                                            ? EnumToken.BadUrlTokenType
                                            : EnumToken.UrlTokenTokenType,
                                    ),
                                );
                                buffer = "";
                            }
                        }

                        break;
                    }
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.StartParensTokenType));
                buffer = "";
                break;

            // ')'
            case TokenMap.RIGHT_PARENTHESIS:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.EndParensTokenType));
                break;

            // '['
            case TokenMap.LEFT_BRACKETS:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.AttrStartTokenType));
                break;
            // ']'
            case TokenMap.RIGHT_BRACKETS:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.AttrEndTokenType));
                break;

            case TokenMap.SEMICOLON:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }
                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.SemiColonTokenType));
                break;

            case TokenMap.COLON:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                next(parseInfo);

                if (peek(parseInfo).charCodeAt(0) == TokenMap.COLON) {
                    result.push(yieldResult(value + next(parseInfo), parseInfo, EnumToken.DoubleColonTokenType));
                    break;
                }

                result.push(yieldResult(value, parseInfo, EnumToken.ColonTokenType));
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
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                buffer += next(parseInfo);
                nextCharCode = parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset).charCodeAt(0);

                while (
                    nextCharCode == 0x20 ||
                    (nextCharCode >= 0x9 && nextCharCode <= 0xd) ||
                    nextCharCode == 0x2028 ||
                    nextCharCode == 0x2029
                ) {
                    value += next(parseInfo);
                    nextCharCode = parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset).charCodeAt(0);
                }

                result.push(yieldResult(value, parseInfo, EnumToken.WhitespaceTokenType));
                buffer = "";
                break;

            case TokenMap.COMMA:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.CommaTokenType));
                break;

            case TokenMap.DOLLAR:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                if (match(parseInfo, "$=")) {
                    result.push(yieldResult(next(parseInfo, 2), parseInfo, EnumToken.EndMatchTokenType));
                    break;
                }

                buffer += next(parseInfo);
                break;

            case TokenMap.TILDA:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                if (match(parseInfo, "~=")) {
                    result.push(yieldResult(next(parseInfo, 2), parseInfo, EnumToken.IncludeMatchTokenType));
                    break;
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.Tilda));
                buffer = "";
                break;

            // case '^':
            case TokenMap.CARET:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                if (match(parseInfo, "^=")) {
                    result.push(yieldResult(next(parseInfo, 2), parseInfo, EnumToken.StartMatchTokenType));
                    break;
                }

                buffer += next(parseInfo);
                break;

            case TokenMap.STAR:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                if (match(parseInfo, "*=")) {
                    result.push(yieldResult(next(parseInfo, 2), parseInfo, EnumToken.ContainMatchTokenType));
                    break;
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.Star));
                buffer = "";
                break;

            case TokenMap.AMPERSAND:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.NestingSelectorTokenType));
                buffer = "";
                break;

            case TokenMap.PIPE:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                // '||'
                if (match(parseInfo, "||")) {
                    result.push(yieldResult(next(parseInfo, 2), parseInfo, EnumToken.ColumnCombinatorTokenType));
                    break;
                } else if (match(parseInfo, "|=")) {
                    result.push(yieldResult(next(parseInfo, 2), parseInfo, EnumToken.DashMatchTokenType));
                    break;
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.Pipe));
                buffer = "";
                break;

            case TokenMap.EXCLAMATION:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                if (match(parseInfo, "!important")) {
                    result.push(yieldResult(next(parseInfo, 10), parseInfo, EnumToken.ImportantTokenType));
                    buffer = "";
                    break;
                }

                buffer += next(parseInfo);
                break;

            case TokenMap.SLASH:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                if (!match(parseInfo, "/*")) {
                    result.push(yieldResult(next(parseInfo), parseInfo, SymbolsMapTokens[value]));
                    break;
                }

                buffer += next(parseInfo, 2);

                while ((value = next(parseInfo))) {
                    if (value == "*") {
                        buffer += value;

                        if (match(parseInfo, "/")) {
                            result.push(yieldResult(buffer + next(parseInfo), parseInfo, EnumToken.CommentTokenType));
                            buffer = "";
                            break;
                        }
                    } else {
                        buffer += value;
                    }
                }

                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo, EnumToken.BadCommentTokenType));
                    buffer = "";
                }

                break;

            case TokenMap.GREATERTHAN:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                if (match(parseInfo, ">=")) {
                    result.push(yieldResult(next(parseInfo, 2), parseInfo, EnumToken.GteTokenType));
                    break;
                }

                result.push(yieldResult(next(parseInfo), parseInfo, EnumToken.GtTokenType));
                buffer = "";
                break;

            case TokenMap.LOWERTHAN:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                if (match(parseInfo, "<=")) {
                    result.push(yieldResult(next(parseInfo, 2), parseInfo, EnumToken.LteTokenType));
                    break;
                }

                buffer += next(parseInfo);

                if (match(parseInfo, "!--")) {
                    buffer += next(parseInfo, 3);

                    while ((value = next(parseInfo))) {
                        buffer += value;
                        if (value == "-" && match(parseInfo, "->")) {
                            break;
                        }
                    }

                    if (value === "") {
                        result.push(yieldResult(buffer, parseInfo, EnumToken.BadCdoTokenType));
                    } else {
                        result.push(yieldResult(buffer + next(parseInfo, 2), parseInfo, EnumToken.CDOCOMMTokenType));
                    }

                    buffer = "";
                }

                break;

            case TokenMap.HASH:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                buffer += next(parseInfo);
                break;

            case TokenMap.REVERSE_SOLIDUS:
                next(parseInfo);

                // EOF
                if (!peek(parseInfo)) {
                    // end of stream ignore \\
                    if (buffer.length > 0) {
                        result.push(yieldResult(buffer, parseInfo));
                        buffer = "";
                    }

                    break;
                }

                buffer += value + next(parseInfo);
                break;

            case TokenMap.SINGLE_QUOTE:
            case TokenMap.DOUBLE_QUOTE:
                if (buffer.length > 0) {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = "";
                }

                result.push(...consumeString(parseInfo));
                break;

            case TokenMap.DOT:
                const codepoint = parseInfo.stream
                    .charAt(parseInfo.currentPosition - parseInfo.offset + 1)
                    .charCodeAt(0);

                if (!isDigit(codepoint) && buffer !== "") {
                    result.push(yieldResult(buffer, parseInfo));
                    buffer = next(parseInfo, 2);
                    break;
                }

                buffer += next(parseInfo);
                break;
            default:
                buffer += next(parseInfo);
                break;
        }

        if (!yieldEOFToken && endPosition <= parseInfo.stream.length - parseInfo.currentPosition + parseInfo.offset) {
            break;
        }
    }

    if (yieldEOFToken) {
        if (buffer.length > 0) {
            result.push(yieldResult(buffer, parseInfo));
        }

        result.push(yieldResult("", parseInfo, EnumToken.EOFTokenType));
    } else {
        parseInfo.buffer = buffer;
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

    while (true) {
        const { done, value } = await reader.read();
        const stream = ArrayBuffer.isView(value) ? decoder.decode(value, { stream: true }) : value;

        if (!done) {
            parseInfo.source.append(stream as string);

            if (typeof parseInfo.stream != "string") {
                parseInfo.stream = stream as string;
            } else {
                parseInfo.stream = (parseInfo.stream.slice(parseInfo.currentPosition - parseInfo.offset) +
                    stream) as string;
            }

            parseInfo.offset = parseInfo.currentPosition;
        }

        yield* tokenize(parseInfo, done);

        if (done) {
            break;
        }
    }
}
