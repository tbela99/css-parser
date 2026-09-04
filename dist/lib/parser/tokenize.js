import { EnumToken, ColorType } from '../ast/types.js';
import { wildCardFuncs, whenElseFunc, mathFuncs, timingFunc, supportFunc, timelineFunc, imageFunc, gridTemplateFunc, urlFunc, containerFunc, colorsFunc, transformFunctions, pseudoElements } from '../syntax/constants.js';
import { isWhiteSpace, isNewLine, isDigit, isLetter, isIdentStart, isIdentCodepoint, isNonPrintable, timeUnits, angleUnits, flexUnits, dimensionUnits, resolutionUnits, frequencyUnits } from '../syntax/syntax.js';
import { SourceFile } from './source.js';

const SymbolsMapTokens = Object.create(null);
// Regex for escape sequence decoding - compile once, reuse many times
const ESCAPE_SEQUENCE_REGEX = /\\([0-9a-fA-F]{1,6})(?:\s)?/g;
function decodeEscapeSequences(value) {
    return value.replace(ESCAPE_SEQUENCE_REGEX, (_, sequence) => {
        const codepoint = parseInt(sequence, 16);
        if (codepoint == 0 ||
            // leading surrogate
            (0xd800 <= codepoint && codepoint <= 0xdbff) ||
            // trailing surrogate
            (0xdc00 <= codepoint && codepoint <= 0xdfff) ||
            codepoint > 0x10ffff) {
            return "\uFFFD";
        }
        return String.fromCodePoint(codepoint);
    });
}
function assignTokenMap(entries, tokenType, suffix = "", lowercase = false) {
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
const hintsEnum = new Set([
    EnumToken.CommaTokenType,
    EnumToken.ImportantTokenType,
    EnumToken.SemiColonTokenType,
    EnumToken.BlockStartTokenType,
    EnumToken.BlockEndTokenType,
    EnumToken.StartParensTokenType,
    EnumToken.EndParensTokenType,
    EnumToken.ColonTokenType,
    EnumToken.EOFTokenType,
]);
var TokenMap;
(function (TokenMap) {
    TokenMap[TokenMap["EXCLAMATION"] = 33] = "EXCLAMATION";
    TokenMap[TokenMap["SLASH"] = 47] = "SLASH";
    TokenMap[TokenMap["LOWERTHAN"] = 60] = "LOWERTHAN";
    TokenMap[TokenMap["HASH"] = 35] = "HASH";
    TokenMap[TokenMap["REVERSE_SOLIDUS"] = 92] = "REVERSE_SOLIDUS";
    TokenMap[TokenMap["DOUBLE_QUOTE"] = 34] = "DOUBLE_QUOTE";
    TokenMap[TokenMap["SINGLE_QUOTE"] = 39] = "SINGLE_QUOTE";
    TokenMap[TokenMap["DOT"] = 46] = "DOT";
    TokenMap[TokenMap["AT"] = 64] = "AT";
    TokenMap[TokenMap["PIPE"] = 124] = "PIPE";
    TokenMap[TokenMap["EQUALS"] = 61] = "EQUALS";
    TokenMap[TokenMap["AMPERSAND"] = 38] = "AMPERSAND";
    TokenMap[TokenMap["STAR"] = 42] = "STAR";
    TokenMap[TokenMap["TILDA"] = 126] = "TILDA";
    TokenMap[TokenMap["CARET"] = 94] = "CARET";
    TokenMap[TokenMap["DOLLAR"] = 36] = "DOLLAR";
    TokenMap[TokenMap["COMMA"] = 44] = "COMMA";
    TokenMap[TokenMap["COLON"] = 58] = "COLON";
    TokenMap[TokenMap["SEMICOLON"] = 59] = "SEMICOLON";
    TokenMap[TokenMap["LEFT_PARENTHESIS"] = 40] = "LEFT_PARENTHESIS";
    TokenMap[TokenMap["RIGHT_PARENTHESIS"] = 41] = "RIGHT_PARENTHESIS";
    TokenMap[TokenMap["LEFT_BRACKETS"] = 91] = "LEFT_BRACKETS";
    TokenMap[TokenMap["RIGHT_BRACKETS"] = 93] = "RIGHT_BRACKETS";
    TokenMap[TokenMap["LEFT_BRACE"] = 123] = "LEFT_BRACE";
    TokenMap[TokenMap["RIGHT_BRACE"] = 125] = "RIGHT_BRACE";
    TokenMap[TokenMap["PLUS"] = 43] = "PLUS";
    TokenMap[TokenMap["MINUS"] = 45] = "MINUS";
    TokenMap[TokenMap["GREATERTHAN"] = 62] = "GREATERTHAN";
    TokenMap[TokenMap["PERCENTAGE"] = 37] = "PERCENTAGE";
})(TokenMap || (TokenMap = {}));
function getSymbolHint(parseInfo, start, end) {
    const len = end - start;
    const keysLength = SymbolsMapTokensKeys.length;
    // Early exit for impossible lengths
    if (len < 0)
        return null;
    for (let i = 0; i < keysLength; i++) {
        const key = SymbolsMapTokensKeys[i];
        if (key.length !== len)
            continue;
        // Match character by character
        let match = true;
        for (let j = 0; j < len; j++) {
            let ca = key.charCodeAt(j);
            let cb = parseInfo.stream.charCodeAt(start + j);
            // Normalize A-Z to a-z
            if (ca >= 65 && ca <= 90)
                ca += 32;
            if (cb >= 65 && cb <= 90)
                cb += 32;
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
function searchArray(array, parseInfo, start, end) {
    const len = end - start;
    // Early exit for impossible lengths
    if (len < 0)
        return null;
    // Use a simple linear search optimized with length pre-filtering
    let i = array.length;
    while (i--) {
        if (array[i].length !== len)
            continue;
        // Match character by character
        let match = true;
        const arrayItem = array[i];
        for (let j = 0; j < len; j++) {
            let ca = arrayItem.charCodeAt(j);
            let cb = parseInfo.stream.charCodeAt(start + j);
            // Normalize A-Z to a-z
            if (ca >= 65 && ca <= 90)
                ca += 32;
            if (cb >= 65 && cb <= 90)
                cb += 32;
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
class Tokenizer {
    parseInfo;
    input;
    /**
     * token type
     */
    typ = null;
    /**
     * token kind
     */
    kin = null;
    /**
     * token name
     */
    nam = null;
    /**
     * token value
     */
    val = null;
    /**
     * token unit
     */
    unit = null;
    /**
     * source id
     */
    srcId = null;
    /**
     * token start
     */
    sta = null;
    /**
     * token end
     */
    end = null;
    /**
     * bytes in
     */
    bytesIn = null;
    /**
     * decode string
     */
    decodeString = null;
    /**
     * token slice
     */
    slice = null;
    /**
     * source file
     */
    source = null;
    /**
     * token hint
     */
    hint = null;
    state = null;
    constructor(parseInfo, input = null) {
        this.parseInfo = parseInfo;
        this.input = input;
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
    consumeString(parseInfo) {
        const quote = this.advance(parseInfo).charCodeAt(0);
        let charCode;
        let decodeSegments = false;
        while ((charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode) {
            if (charCode == 92 /* TokenMap.REVERSE_SOLIDUS */) {
                if (charCode == parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1)) {
                    this.advance(parseInfo, 2);
                    continue;
                }
                const sequence = this.peek(parseInfo, 7);
                let escapeSequence = "";
                let codepoint;
                let i;
                for (i = 1; i < sequence.length; i++) {
                    codepoint = sequence.charCodeAt(i);
                    if (codepoint == 0x20 ||
                        (codepoint >= 0x61 && codepoint <= 0x66) ||
                        (codepoint >= 0x41 && codepoint <= 0x46) ||
                        (codepoint >= 0x30 && codepoint <= 0x39)) {
                        escapeSequence += sequence[i];
                        if (codepoint == 0x20) {
                            break;
                        }
                        continue;
                    }
                    break;
                }
                if (escapeSequence.trimEnd().length > 0) {
                    const length = escapeSequence.length +
                        1 +
                        (isWhiteSpace(parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset)?.charCodeAt(0))
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
                return this.makeToken(parseInfo, 
                /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType, decodeSegments ? { decodeSegments } : null);
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
    consumeStringAsURLToken(parseInfo) {
        const quote = this.advance(parseInfo).charCodeAt(0);
        let charCode;
        let decodeSegments = false;
        while ((charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode) {
            if (charCode == 92 /* TokenMap.REVERSE_SOLIDUS */) {
                if (charCode == parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1)) {
                    this.advance(parseInfo, 2);
                    continue;
                }
                const sequence = this.peek(parseInfo, 7);
                let escapeSequence = "";
                let codepoint;
                let i;
                for (i = 1; i < sequence.length; i++) {
                    codepoint = sequence.charCodeAt(i);
                    if (codepoint == 0x20 ||
                        (codepoint >= 0x61 && codepoint <= 0x66) ||
                        (codepoint >= 0x41 && codepoint <= 0x46) ||
                        (codepoint >= 0x30 && codepoint <= 0x39)) {
                        escapeSequence += sequence[i];
                        if (codepoint == 0x20) {
                            break;
                        }
                        continue;
                    }
                    break;
                }
                if (escapeSequence.trimEnd().length > 0) {
                    const length = escapeSequence.length +
                        1 +
                        (isWhiteSpace(parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset)?.charCodeAt(0))
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
                let k = 1;
                let end = parseInfo.stream.length - parseInfo.offset;
                let position = parseInfo.currentPosition - parseInfo.offset;
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
                    if (charCode != 41 /* TokenMap.RIGHT_PARENTHESIS */) {
                        this.advance(parseInfo, k);
                        return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
                    }
                    break;
                }
                // consume until the ')'
                return this.makeToken(parseInfo, 
                /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType, decodeSegments ? { decodeSegments } : null);
                // return result;
            }
            if (isNewLine(charCode)) {
                // bad string
                this.advance(parseInfo);
                while ((charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode) {
                    if (charCode == 92 /* TokenMap.REVERSE_SOLIDUS */) {
                        this.advance(parseInfo, 2);
                        continue;
                    }
                    if (charCode == 41 /* TokenMap.RIGHT_PARENTHESIS */) {
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
    consumeNumericToken(parseInfo) {
        let position = parseInfo.currentPosition - parseInfo.offset;
        let offset = position;
        let hasDigits = false;
        let hasLetter = false;
        let hasPercent = false;
        let codepoint = parseInfo.stream.charCodeAt(position);
        this.slice = null;
        this.hint = null;
        // '+' '-'
        if (codepoint == 0x2b || codepoint == 0x2d) {
            position++;
        }
        // consume digits
        while (position < parseInfo.stream.length) {
            codepoint = parseInfo.stream.charCodeAt(position);
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
            if (isWhiteSpace(codepoint) ||
                codepoint == 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
                codepoint == 59 /* TokenMap.SEMICOLON */ ||
                codepoint == 125 /* TokenMap.RIGHT_BRACE */ ||
                codepoint == 47 /* TokenMap.SLASH */ ||
                codepoint == 42 /* TokenMap.STAR */ ||
                codepoint == 44 /* TokenMap.COMMA */) {
                return !hasDigits ? 0 : position - offset;
            }
            if (codepoint == 37 /* TokenMap.PERCENTAGE */) {
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
                codepoint = parseInfo.stream.charCodeAt(position);
                if (codepoint != codepoint) {
                    return !hasDigits ? 0 : position - offset;
                }
                if (isWhiteSpace(codepoint) ||
                    codepoint == 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
                    codepoint == 59 /* TokenMap.SEMICOLON */ ||
                    codepoint == 125 /* TokenMap.RIGHT_BRACE */ ||
                    codepoint == 47 /* TokenMap.SLASH */ ||
                    codepoint == 42 /* TokenMap.STAR */ ||
                    codepoint == 44 /* TokenMap.COMMA */) {
                    return !hasDigits ? 0 : position - offset;
                }
                if (!isDigit(codepoint)) {
                    if (!hasDigits) {
                        return 0;
                    }
                    if (codepoint == 37 /* TokenMap.PERCENTAGE */) {
                        hasPercent = true;
                    }
                    else if (isLetter(codepoint)) {
                        hasLetter = true;
                    }
                    else {
                        return 0;
                    }
                }
                else {
                    position++;
                    hasDigits = true;
                }
            }
            if (!hasLetter && !hasPercent) {
                while (position + 1 <= parseInfo.stream.length) {
                    codepoint = parseInfo.stream.charCodeAt(position);
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
                    if (isWhiteSpace(codepoint) ||
                        codepoint == 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
                        codepoint == 59 /* TokenMap.SEMICOLON */ ||
                        codepoint == 125 /* TokenMap.RIGHT_BRACE */ ||
                        codepoint == 47 /* TokenMap.SLASH */ ||
                        codepoint == 42 /* TokenMap.STAR */ ||
                        codepoint == 44 /* TokenMap.COMMA */) {
                        return position - offset;
                    }
                    if (isLetter(codepoint)) {
                        hasLetter = true;
                        break;
                    }
                    if (codepoint == 37 /* TokenMap.PERCENTAGE */) {
                        hasPercent = true;
                        break;
                    }
                    return 0;
                }
                // 'E' 'e' - 'em'
                if ((codepoint == 0x45 || codepoint == 0x65) && hasDigits && !hasLetter && !hasPercent) {
                    if (isLetter(parseInfo.stream.charCodeAt(position))) {
                        hasLetter = true;
                    }
                }
                if (!hasLetter && !hasPercent) {
                    // 'E' 'e'
                    if (codepoint == 0x45 || codepoint == 0x65) {
                        codepoint = parseInfo.stream.charCodeAt(position + 1);
                        // '+' '-'
                        if (codepoint == 0x2b || codepoint == 0x2d) {
                            position++;
                        }
                        codepoint = position = parseInfo.stream.charCodeAt(position + 1);
                        if (!isDigit(codepoint)) {
                            if (!hasDigits) {
                                return 0;
                            }
                            if (isLetter(codepoint)) {
                                hasLetter = true;
                            }
                            else if (codepoint == 37 /* TokenMap.PERCENTAGE */) {
                                hasPercent = true;
                            }
                            else {
                                return 0;
                            }
                        }
                    }
                    if (!hasLetter && !hasPercent) {
                        while (++position < parseInfo.stream.length) {
                            codepoint = parseInfo.stream.charCodeAt(position);
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
                            if (isWhiteSpace(codepoint) ||
                                codepoint == 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
                                codepoint == 59 /* TokenMap.SEMICOLON */ ||
                                codepoint == 125 /* TokenMap.RIGHT_BRACE */ ||
                                codepoint == 47 /* TokenMap.SLASH */ ||
                                codepoint == 42 /* TokenMap.STAR */ ||
                                codepoint == 44 /* TokenMap.COMMA */) {
                                return position - offset;
                            }
                            else if (isLetter(codepoint)) {
                                hasLetter = true;
                                break;
                            }
                            else if (codepoint == 37 /* TokenMap.PERCENTAGE */) {
                                hasPercent = true;
                                break;
                            }
                            else {
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
            codepoint = parseInfo.stream.charCodeAt(++position);
            if (codepoint != codepoint ||
                isWhiteSpace(codepoint) ||
                codepoint == 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
                codepoint == 59 /* TokenMap.SEMICOLON */ ||
                codepoint == 125 /* TokenMap.RIGHT_BRACE */ ||
                codepoint == 47 /* TokenMap.SLASH */ ||
                codepoint == 42 /* TokenMap.STAR */ ||
                codepoint == 44 /* TokenMap.COMMA */) {
                this.slice = slice;
                this.hint = EnumToken.PercentageTokenType;
                return position - offset;
            }
            return 0;
        }
        if (hasLetter) {
            codepoint = parseInfo.stream.charCodeAt(position - 1);
            // 'E' 'e'
            const slice = codepoint == 0x45 || codepoint == 0x65 ? position - 1 : position;
            while (position + 1 <= parseInfo.stream.length) {
                codepoint = parseInfo.stream.charCodeAt(++position);
                if (!isLetter(codepoint)) {
                    break;
                }
            }
            if (codepoint != codepoint ||
                isWhiteSpace(codepoint) ||
                codepoint == 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
                codepoint == 59 /* TokenMap.SEMICOLON */ ||
                codepoint == 125 /* TokenMap.RIGHT_BRACE */ ||
                codepoint == 43 /* TokenMap.PLUS */ ||
                codepoint == 47 /* TokenMap.SLASH */ ||
                codepoint == 42 /* TokenMap.STAR */ ||
                codepoint == 44 /* TokenMap.COMMA */) {
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
    consumeIdentToken(parseInfo) {
        let position = parseInfo.currentPosition - parseInfo.offset;
        let offset = position;
        let codepoint = parseInfo.stream.charCodeAt(position);
        if (!isIdentStart(codepoint) && codepoint != 45 /* TokenMap.MINUS */) {
            return 0;
        }
        if (codepoint == 45 /* TokenMap.MINUS */) {
            position++;
            codepoint = parseInfo.stream.charCodeAt(position);
            if (!isIdentStart(codepoint) && codepoint != 45 /* TokenMap.MINUS */) {
                return 0;
            }
        }
        while ((codepoint = parseInfo.stream.charCodeAt(position)) == codepoint) {
            if (codepoint == 92 /* TokenMap.REVERSE_SOLIDUS */) {
                // eof
                if ((codepoint = parseInfo.stream.charCodeAt(position + 1)) != codepoint) {
                    // this.next(parseInfo, position);
                    return 0;
                }
                // \n \r \f \v
                if (codepoint == 0xa ||
                    codepoint == 0xb ||
                    codepoint == 0xc ||
                    codepoint == 0xd ||
                    codepoint == 0x2028 ||
                    codepoint == 0x2029) {
                    return 0;
                }
                position += 2;
                continue;
            }
            if (codepoint == 0x2d || isIdentCodepoint(codepoint)) {
                position++;
            }
            else {
                switch (codepoint) {
                    case 58 /* TokenMap.COLON */:
                    case 123 /* TokenMap.LEFT_BRACE */:
                    case 125 /* TokenMap.RIGHT_BRACE */:
                    case 40 /* TokenMap.LEFT_PARENTHESIS */:
                    case 41 /* TokenMap.RIGHT_PARENTHESIS */:
                    case 91 /* TokenMap.LEFT_BRACKETS */:
                    case 93 /* TokenMap.RIGHT_BRACKETS */:
                    case 59 /* TokenMap.SEMICOLON */:
                    case 33 /* TokenMap.EXCLAMATION */:
                    case 47 /* TokenMap.SLASH */:
                    case 35 /* TokenMap.HASH */:
                    case 42 /* TokenMap.STAR */:
                    case 61 /* TokenMap.EQUALS */:
                    case 126 /* TokenMap.TILDA */:
                    case 124 /* TokenMap.PIPE */:
                    case 94 /* TokenMap.CARET */:
                    case 36 /* TokenMap.DOLLAR */:
                    case 44 /* TokenMap.COMMA */:
                    case 62 /* TokenMap.GREATERTHAN */:
                    case 46 /* TokenMap.DOT */:
                    case 43 /* TokenMap.PLUS */:
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
    consumeColor(parseInfo) {
        let position = parseInfo.currentPosition - parseInfo.offset;
        let offset = position;
        let codepoint = parseInfo.stream.charCodeAt(position);
        if (codepoint != 35 /* TokenMap.HASH */) {
            return 0;
        }
        position++;
        let count = 0;
        while (true) {
            codepoint = parseInfo.stream.charCodeAt(position);
            // 'a-f0-9' 'A-F0-9'
            if ((codepoint >= 0x30 && codepoint <= 0x39) ||
                (codepoint >= 0x61 && codepoint <= 0x66) ||
                (codepoint >= 0x41 && codepoint <= 0x46)) {
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
        if (codepoint != codepoint ||
            isWhiteSpace(codepoint) ||
            codepoint == 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
            codepoint == 59 /* TokenMap.SEMICOLON */ ||
            codepoint == 125 /* TokenMap.RIGHT_BRACE */ ||
            codepoint == 44 /* TokenMap.COMMA */) {
            return position - offset;
        }
        return 0;
    }
    consumeURLToken(parseInfo, endPosition) {
        let charCode;
        // consume an <url>
        while (isWhiteSpace(this.peekCharCode(parseInfo))) {
            this.advance(parseInfo);
        }
        charCode = this.peekCharCode(parseInfo);
        if (charCode == 34 /* TokenMap.DOUBLE_QUOTE */ || charCode == 39 /* TokenMap.SINGLE_QUOTE */) {
            return this.consumeStringAsURLToken(parseInfo);
        }
        do {
            this.advance(parseInfo);
            charCode = this.peekCharCode(parseInfo);
        } while (
        // !(value === "/" && this.match(parseInfo, "/*") &&
        charCode !== 41 /* TokenMap.RIGHT_PARENTHESIS */ &&
            parseInfo.currentPosition < endPosition);
        // if (parseInfo.position < parseInfo.currentPosition) {
        return this.makeToken(parseInfo, 
        // parseInfo.position < parseInfo.currentPosition
        (charCode = this.peekCharCode(parseInfo)) != charCode || !this.isURLToken(parseInfo)
            ? EnumToken.BadUrlTokenType
            : EnumToken.UrlTokenTokenType);
        // }
    }
    /**
     *
     * @param parseInfo
     * @param hint
     * @param options
     * @returns
     */
    makeToken(parseInfo, hint, options) {
        let val = null;
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
            let array = null;
            let hasUnit = false;
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
                val = searchArray(array, parseInfo, hasUnit ? options?.slice : parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset);
            }
            else if (!hintsEnum.has(hint)) {
                val = parseInfo.stream.slice(options?.slice ?? parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset);
            }
            if (this.decodeString) {
                val = decodeEscapeSequences(val);
            }
            if (hintsEnum.has(hint)) {
                this.typ = hint;
            }
            else {
                this.typ = hint;
                if (hasUnit || hint == EnumToken.PercentageTokenType || hint == EnumToken.DimensionTokenType) {
                    this.val = parseFloat(parseInfo.stream.slice(parseInfo.position - parseInfo.offset, options?.slice));
                    if (hint != EnumToken.PercentageTokenType) {
                        this.unit = val;
                    }
                }
                else if (hint == EnumToken.NumberTokenType) {
                    this.val = parseFloat(val);
                }
                else if (hint == EnumToken.AtRuleTokenType) {
                    this.nam = val;
                }
                else {
                    this.val = val;
                    if (hint == EnumToken.ColorTokenType) {
                        this.kin = ColorType.HEX;
                    }
                }
            }
        }
        else {
            if (this.equalsIgnoreCase(parseInfo, "!important")) {
                this.typ = EnumToken.ImportantTokenType;
            }
        }
        if (this.typ == null) {
            val = parseInfo.stream.slice(parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset);
            if (options?.decodeSegments) {
                val = decodeEscapeSequences(val);
                this.decodeString = true;
            }
            this.typ = EnumToken.LiteralTokenType;
            this.val = val;
        }
        this.srcId = parseInfo.source.id;
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
    equalsIgnoreCase(parseInfo, input) {
        let position = parseInfo.currentPosition - parseInfo.offset;
        let ca;
        let cb;
        for (let i = 0; i < input.length; i++) {
            ca = parseInfo.stream.charCodeAt(position + i);
            cb = input.charCodeAt(i);
            // Normalize A-Z to a-z
            if (ca >= 65 && ca <= 90)
                ca += 32;
            if (cb >= 65 && cb <= 90)
                cb += 32;
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
    match(parseInfo, input) {
        let position = parseInfo.currentPosition - parseInfo.offset;
        for (let i = 0; i < input.length; i++) {
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
    peekCharCode(parseInfo) {
        return parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset);
    }
    /**
     *
     * @param parseInfo
     * @param count
     * @returns
     */
    peek(parseInfo, count = 1) {
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
    advance(parseInfo, count = 1) {
        let position = parseInfo.currentPosition - parseInfo.offset;
        let char = count == 1 ? parseInfo.stream.charAt(position) : parseInfo.stream.slice(position, position + count);
        let i = 0;
        let codepoint;
        const lineStarts = parseInfo.source.lineStarts.lineStarts;
        for (; i < char.length; i++) {
            codepoint = char.charCodeAt(i);
            if (codepoint == 0xa || // \n
                codepoint == 0xb || // \v
                codepoint == 0xc || // \f
                codepoint == 0xd || // \r
                codepoint == 0x2028 || // \u2028
                codepoint == 0x2029 // \u2029
            ) {
                // \r\n
                if (codepoint == 0xa && i > 0 && char.charCodeAt(i - 1) == 0xd) ;
                else {
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
    isIdentToken(parseInfo /* , start?: number, end?: number */) {
        let j = parseInfo.currentPosition - parseInfo.offset;
        let i = parseInfo.position - parseInfo.offset;
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
        let codepoint = parseInfo.stream.charCodeAt(i);
        // -
        if (codepoint == 0x2d) {
            let nextCodepoint;
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
        if (codepoint == 92 /* TokenMap.REVERSE_SOLIDUS */) {
            codepoint = parseInfo.stream.charCodeAt(i + 1);
            i += String.fromCodePoint(codepoint).length;
        }
        while (i < j) {
            i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
            codepoint = parseInfo.stream.charCodeAt(i);
            if (codepoint == 92 /* TokenMap.REVERSE_SOLIDUS */) {
                i += codepoint < 0x80 ? 1 : String.fromCodePoint(codepoint).length;
                codepoint = parseInfo.stream.charCodeAt(i);
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
    // isPseudo(parseInfo: ParseInfo): boolean {
    //     let position: number = parseInfo.currentPosition - parseInfo.offset;
    //     let endPosition: number = parseInfo.currentPosition - parseInfo.offset;
    //     return (parseInfo.stream.charAt(position) == ":" &&
    //         parseInfo.stream.charAt(endPosition - 1) == "(" &&
    //         (parseInfo.stream.charAt(position + 1) == ":"
    //             ? this.isIdentToken(parseInfo, 2, -1)
    //             : this.isIdentToken(parseInfo, 1, -1))) ||
    //         parseInfo.stream.charAt(position + 1) == ":"
    //         ? this.isIdentToken(parseInfo, 2)
    //         : this.isIdentToken(parseInfo, 1);
    // }
    /**
     *
     * @param parseInfo
     * @param input
     * @returns
     */
    startsWith(parseInfo, input) {
        let i = 0;
        let j = input.length;
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
    isURLToken(parseInfo) {
        let i = parseInfo.position - parseInfo.offset;
        let c;
        while (++i < parseInfo.currentPosition) {
            c = parseInfo.stream.charCodeAt(i);
            // single quote or double quote or start parenthesis or close parenthesis
            if (isNonPrintable(c) || c == 0x27 || c == 0x22 || c == 0x28 || c == 0x29) {
                return false;
            }
            // valid escape
            if (c == 92 /* TokenMap.REVERSE_SOLIDUS */) {
                i++;
                if (i >= parseInfo.currentPosition) {
                    return false;
                }
                c = parseInfo.stream.charCodeAt(i);
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
    done() {
        return this.typ === EnumToken.EOF;
    }
    /**
     * Tokenize CSS string
     * @param parseInfo
     * @param yieldEOFToken
     */
    next( /* parseInfo: ParseInfo | string, yieldEOFToken: boolean = true */) {
        const parseInfo = this.parseInfo;
        this.source = parseInfo.source;
        let charCode;
        let nextCharCode;
        // const result: TokenizeResult[] = [];
        // allow 10 characters buffer for the streaming parser to avoid incomplete tokens
        const endPosition = parseInfo.stream.length - 1; // yieldEOFToken ? parseInfo.stream.length - 1 : parseInfo.stream.length - 10;
        let tokensCount;
        // NaN is not equal to NaN
        while ((charCode = this.peekCharCode(parseInfo)) == charCode) {
            if (this.state === EnumToken.UrlFunctionTokenDefType) {
                this.state = null;
                return this.consumeURLToken(parseInfo, endPosition);
            }
            if (parseInfo.position == parseInfo.currentPosition) {
                if (charCode == 45 /* TokenMap.MINUS */ ||
                    charCode == 43 /* TokenMap.PLUS */ ||
                    charCode == 46 /* TokenMap.DOT */ ||
                    isDigit(charCode)) {
                    tokensCount = this.consumeNumericToken(parseInfo);
                    if (tokensCount > 0) {
                        this.advance(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, this.hint ?? EnumToken.NumberTokenType, {
                            slice: this.slice,
                            sign: charCode == 45 /* TokenMap.MINUS */ ? "-" : charCode == 43 /* TokenMap.PLUS */ ? "+" : null,
                        });
                    }
                }
                if (isIdentStart(charCode) || charCode == 45 /* TokenMap.MINUS */) {
                    tokensCount = this.consumeIdentToken(parseInfo);
                    if (tokensCount > 0) {
                        this.advance(parseInfo, tokensCount);
                        charCode = this.peekCharCode(parseInfo);
                        // do not match function
                        if (40 /* TokenMap.LEFT_PARENTHESIS */ != charCode) {
                            return this.makeToken(parseInfo, this.startsWith(parseInfo, "--")
                                ? EnumToken.DashedIdenTokenType
                                : EnumToken.IdenTokenType);
                        }
                    }
                }
                if (charCode == 64 /* TokenMap.AT */) {
                    this.advance(parseInfo);
                    charCode = this.peekCharCode(parseInfo);
                    // match at-rule
                    if (charCode == 45 /* TokenMap.MINUS */ || isIdentStart(this.peekCharCode(parseInfo))) {
                        // consume '@'
                        parseInfo.position = parseInfo.currentPosition;
                        tokensCount = this.consumeIdentToken(parseInfo);
                        if (tokensCount > 0) {
                            this.advance(parseInfo, tokensCount);
                            return this.makeToken(parseInfo, EnumToken.AtRuleTokenType);
                        }
                    }
                }
                if (charCode == 35 /* TokenMap.HASH */) {
                    tokensCount = this.consumeColor(parseInfo);
                    if (tokensCount > 0) {
                        this.advance(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, EnumToken.ColorTokenType);
                    }
                    this.advance(parseInfo);
                    tokensCount = this.consumeIdentToken(parseInfo);
                    if (tokensCount > 0) {
                        this.advance(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, EnumToken.HashTokenType);
                    }
                }
            }
            // EOF
            switch (charCode) {
                case 61 /* TokenMap.EQUALS */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.DelimTokenType);
                // '+' or '-'
                case 43 /* TokenMap.PLUS */:
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
                        }
                    }
                    return this.makeToken(parseInfo, EnumToken.Plus);
                case 45 /* TokenMap.MINUS */:
                    if (parseInfo.position == parseInfo.currentPosition) {
                        nextCharCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1);
                        // not a number
                        if (isWhiteSpace(nextCharCode)) {
                            this.advance(parseInfo);
                            return this.makeToken(parseInfo, EnumToken.Sub);
                        }
                        if (charCode == 45 /* TokenMap.MINUS */ &&
                            (nextCharCode == 45 /* TokenMap.MINUS */ || isIdentStart(nextCharCode))) {
                            this.advance(parseInfo);
                            tokensCount = this.consumeIdentToken(parseInfo);
                            if (tokensCount > 0) {
                                this.advance(parseInfo, tokensCount);
                                return this.makeToken(parseInfo, EnumToken.IdenTokenType);
                            }
                        }
                    }
                    this.advance(parseInfo);
                    break;
                // '{'
                case 123 /* TokenMap.LEFT_BRACE */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.BlockStartTokenType);
                // '}'
                case 125 /* TokenMap.RIGHT_BRACE */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.BlockEndTokenType);
                // '('
                case 40 /* TokenMap.LEFT_PARENTHESIS */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        // if (
                        //     parseInfo.stream[parseInfo.position - parseInfo.offset] === ":" &&
                        //     this.isPseudo(parseInfo)
                        // ) {
                        //     this.advance(parseInfo);
                        //     return this.makeToken(parseInfo, EnumToken.PseudoClassFunctionTokenDefType);
                        // } else
                        if (this.isIdentToken(parseInfo)) {
                            const hint = this.startsWith(parseInfo, "--")
                                ? EnumToken.CustomFunctionTokenDefType
                                : (getSymbolHint(parseInfo, parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset + 1) ?? EnumToken.FunctionTokenDefType);
                            this.makeToken(parseInfo, hint);
                            this.advance(parseInfo);
                            // consume '('
                            parseInfo.position = parseInfo.currentPosition;
                            if (hint === EnumToken.UrlFunctionTokenDefType) {
                                this.state = hint;
                            }
                            return this;
                        }
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.StartParensTokenType);
                // ')'
                case 41 /* TokenMap.RIGHT_PARENTHESIS */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.EndParensTokenType);
                // '['
                case 91 /* TokenMap.LEFT_BRACKETS */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.AttrStartTokenType);
                // ']'
                case 93 /* TokenMap.RIGHT_BRACKETS */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.AttrEndTokenType);
                case 59 /* TokenMap.SEMICOLON */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.SemiColonTokenType);
                case 58 /* TokenMap.COLON */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    if (this.peekCharCode(parseInfo) == 58 /* TokenMap.COLON */) {
                        this.advance(parseInfo);
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
                    this.advance(parseInfo);
                    nextCharCode = parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset).charCodeAt(0);
                    while (nextCharCode == 0x20 ||
                        (nextCharCode >= 0x9 && nextCharCode <= 0xd) ||
                        nextCharCode == 0x2028 ||
                        nextCharCode == 0x2029) {
                        this.advance(parseInfo);
                        nextCharCode = parseInfo.stream
                            .charAt(parseInfo.currentPosition - parseInfo.offset)
                            .charCodeAt(0);
                    }
                    return this.makeToken(parseInfo, EnumToken.WhitespaceTokenType);
                case 44 /* TokenMap.COMMA */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.CommaTokenType);
                case 36 /* TokenMap.DOLLAR */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    if (this.match(parseInfo, "$=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.EndMatchTokenType);
                    }
                    this.advance(parseInfo);
                    break;
                case 126 /* TokenMap.TILDA */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    if (this.match(parseInfo, "~=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.IncludeMatchTokenType);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.Tilda);
                // case '^':
                case 94 /* TokenMap.CARET */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    if (this.match(parseInfo, "^=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.StartMatchTokenType);
                    }
                    this.advance(parseInfo);
                    break;
                case 42 /* TokenMap.STAR */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    if (this.match(parseInfo, "*=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.ContainMatchTokenType);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.Star);
                case 38 /* TokenMap.AMPERSAND */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.NestingSelectorTokenType);
                case 124 /* TokenMap.PIPE */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    // '||'
                    if (this.match(parseInfo, "||")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.ColumnCombinatorTokenType);
                    }
                    else if (this.match(parseInfo, "|=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.DashMatchTokenType);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.Pipe);
                case 33 /* TokenMap.EXCLAMATION */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    if (this.match(parseInfo, "!important")) {
                        this.advance(parseInfo, 10);
                        return this.makeToken(parseInfo, EnumToken.ImportantTokenType);
                    }
                    this.advance(parseInfo);
                    break;
                case 47 /* TokenMap.SLASH */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    if (!this.match(parseInfo, "/*")) {
                        this.advance(parseInfo);
                        return this.makeToken(parseInfo, getSymbolHint(parseInfo, parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset));
                    }
                    this.advance(parseInfo, 2);
                    while ((charCode = this.advance(parseInfo).charCodeAt(0)) == charCode) {
                        if (charCode == 42 /* TokenMap.STAR */) {
                            if (this.match(parseInfo, "/")) {
                                this.advance(parseInfo);
                                return this.makeToken(parseInfo, EnumToken.CommentTokenType);
                            }
                        }
                    }
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo, EnumToken.BadCommentTokenType);
                    }
                    break;
                case 62 /* TokenMap.GREATERTHAN */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    if (this.match(parseInfo, ">=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.GteTokenType);
                    }
                    this.advance(parseInfo);
                    return this.makeToken(parseInfo, EnumToken.GtTokenType);
                case 60 /* TokenMap.LOWERTHAN */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    if (this.match(parseInfo, "<=")) {
                        this.advance(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.LteTokenType);
                    }
                    this.advance(parseInfo);
                    if (this.match(parseInfo, "!--")) {
                        this.advance(parseInfo, 3);
                        while ((charCode = this.advance(parseInfo).charCodeAt(0)) == charCode) {
                            if (charCode == 45 /* TokenMap.MINUS */ && this.match(parseInfo, "->")) {
                                break;
                            }
                        }
                        if (parseInfo.currentPosition >= endPosition) {
                            return this.makeToken(parseInfo, EnumToken.BadCdoTokenType);
                        }
                        else {
                            this.advance(parseInfo, 2);
                            return this.makeToken(parseInfo, EnumToken.CDOCOMMTokenType);
                        }
                    }
                    break;
                case 35 /* TokenMap.HASH */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.advance(parseInfo);
                    break;
                case 92 /* TokenMap.REVERSE_SOLIDUS */:
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
                case 39 /* TokenMap.SINGLE_QUOTE */:
                case 34 /* TokenMap.DOUBLE_QUOTE */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    return this.consumeString(parseInfo);
                case 46 /* TokenMap.DOT */:
                    const codepoint = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1);
                    if (isIdentStart(codepoint) || codepoint == 45 /* TokenMap.MINUS */) {
                        if (parseInfo.position < parseInfo.currentPosition) {
                            return this.makeToken(parseInfo);
                        }
                        this.advance(parseInfo);
                        let tokensCount = this.consumeIdentToken(parseInfo);
                        if (tokensCount > 0) {
                            this.advance(parseInfo, tokensCount);
                            return this.makeToken(parseInfo, EnumToken.ClassSelectorTokenType);
                        }
                    }
                    if (!isDigit(codepoint) && parseInfo.position !== parseInfo.currentPosition) {
                        this.makeToken(parseInfo);
                        this.advance(parseInfo, 2);
                        return this;
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
    async tokenizeStream() {
        const decoder = new TextDecoder("utf-8");
        const reader = this.input.getReader();
        let parseInfo = this.parseInfo;
        parseInfo.stream = "";
        while (true) {
            const { done, value } = await reader.read();
            const stream = ArrayBuffer.isView(value) ? decoder.decode(value, { stream: true }) : value;
            if (!done) {
                parseInfo.source.append(stream);
            }
            else {
                break;
            }
        }
        parseInfo.stream = parseInfo.source.getContent();
        return this; // .next();
    }
}

export { TokenMap, Tokenizer, hintsEnum };
