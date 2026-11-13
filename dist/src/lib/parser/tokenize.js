/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { EnumToken, ColorType } from '../ast/types.js';
import { validationUnits, pseudoElements, containerFunc, urlFunc, gridTemplateFunc, imageFunc, timelineFunc, supportFunc, timingFunc, colorsFunc, mathFuncs, transformFunctions, whenElseFunc, wildCardFuncs } from '../syntax/constants.js';
import { isWhiteSpace, isNewLine, isDigit, isLetter, isIdentStart, isIdentCodepoint, isNonPrintable, flexUnits, dimensionUnits, resolutionUnits, angleUnits, timeUnits, frequencyUnits } from '../syntax/syntax.js';
import { SourceFile } from './source.js';

const SymbolsMapTokens = Object.create(null);
const SymbolsMapTokensLower = Object.create(null);
// Regex for escape sequence decoding - compile once, reuse many times
const ESCAPE_SEQUENCE_REGEX = /\\((\n|\r|\f|\v|\u2028|\u2029|([0-9a-fA-F]{1,6})) ?)/gms;
function decodeEscapeSequences(value) {
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
/**
 * hash table of ascii strings, looked up by a range of the css source without allocating a string.
 * the keys are lowercase, the lookups ignore the case of ascii letters
 */
class RangeTable {
    keys = [];
    values = [];
    slots = new Int32Array(1024).fill(-1);
    /**
     * hash of a range of a string, ascii letters are lowercased. -1 when the range contains a non ascii character
     * @param str
     * @param start
     * @param end
     */
    static hash(str, start, end) {
        let hash = 0x811c9dc5;
        for (let i = start; i < end; i++) {
            let code = str.charCodeAt(i);
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
    get(str, start, end) {
        const hash = RangeTable.hash(str, start, end);
        if (hash == -1) {
            return undefined;
        }
        const index = this.slots[this.find(str, start, end, hash)];
        return index == -1 ? undefined : this.values[index];
    }
    set(key, value) {
        const slot = this.find(key, 0, key.length, RangeTable.hash(key, 0, key.length));
        if (this.slots[slot] == -1) {
            this.slots[slot] = this.keys.length;
            this.keys.push(key);
            this.values.push(value);
        }
        else {
            this.values[this.slots[slot]] = value;
        }
    }
    /**
     * slot of a key. the table is never full: it is sized for the static tables of the tokenizer
     * @param str
     * @param start
     * @param end
     * @param hash
     */
    find(str, start, end, hash) {
        const mask = this.slots.length - 1;
        const length = end - start;
        let slot = hash & mask;
        for (;;) {
            const index = this.slots[slot];
            if (index == -1) {
                return slot;
            }
            const key = this.keys[index];
            if (key.length == length) {
                let k = 0;
                while (k < length) {
                    let code = str.charCodeAt(start + k);
                    if (code >= 65 && code <= 90) {
                        code += 32;
                    }
                    if (code != key.charCodeAt(k)) {
                        break;
                    }
                    k++;
                }
                if (k == length) {
                    return slot;
                }
            }
            slot = (slot + 1) & mask;
        }
    }
}
/**
 * value of a number: the digits are read from the source without creating a string when the result is exact
 * (at most 15 significant digits, no exponent), parseFloat() otherwise
 * @param stream
 * @param start
 * @param end
 */
function parseNumber(stream, start, end) {
    let i = start;
    let code = stream.charCodeAt(i);
    let negative = false;
    if (code == 0x2d || code == 0x2b) {
        negative = code == 0x2d;
        code = stream.charCodeAt(++i);
    }
    let mantissa = 0;
    let count = 0;
    let digits = 0;
    let decimals = -1;
    for (; i < end; code = stream.charCodeAt(++i)) {
        if (code >= 0x30 && code <= 0x39) {
            mantissa = mantissa * 10 + (code - 0x30);
            count++;
            if (mantissa > 0) {
                digits++;
            }
            if (decimals >= 0) {
                decimals++;
            }
        }
        else if (code == 0x2e && decimals == -1) {
            decimals = 0;
        }
        else {
            break;
        }
    }
    // exponent, too many digits or not a number: the (correctly rounded) result of parseFloat()
    if (i != end || count == 0 || digits > 15 || decimals > 22 || decimals == 0) {
        return parseFloat(stream.slice(start, end));
    }
    // mantissa and 10^decimals are exact: the division is correctly rounded like parseFloat()
    const value = decimals > 0 ? mantissa / powersOf10[decimals] : mantissa;
    return negative ? -value : value;
}
const powersOf10 = [
    1, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15, 1e16, 1e17, 1e18, 1e19, 1e20,
    1e21, 1e22,
];
/**
 * token type of a symbol, unit or function name (the name followed by `(`), ignoring the case
 */
const symbolTable = new RangeTable();
/**
 * units and function names of each token type, by lowercase name: the spelling of the first matching item
 */
const itemTable = new RangeTable();
function assignTokenMap(entries, tokenType, suffix = "", lowercase = false) {
    for (const entry of entries) {
        const key = (lowercase ? entry.toLowerCase() : entry) + suffix;
        SymbolsMapTokens[key] = tokenType;
        SymbolsMapTokensLower[key.toLowerCase()] = tokenType;
        let items = itemTable.get(entry, 0, entry.length);
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
    let items = itemTable.get(unit, 0, unit.length);
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
    TokenMap[TokenMap["QUESTION"] = 63] = "QUESTION";
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
    const stream = parseInfo.stream;
    if (end > stream.length) {
        end = stream.length;
    }
    if (end - start <= 0) {
        return null;
    }
    // ascii names are looked up without allocating a string
    const type = symbolTable.get(stream, start, end);
    if (type !== undefined) {
        return type;
    }
    for (let i = start; i < end; i++) {
        // the unicode case mapping of toLowerCase() may produce ascii letters
        if (stream.charCodeAt(i) > 0x7f) {
            const value = stream.slice(start, end);
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
function findItem(type, parseInfo, start, end) {
    if (end - start <= 0) {
        return null;
    }
    return itemTable.get(parseInfo.stream, start, end)?.get(type) ?? null;
}
/**
 * true if the character is a hexadecimal digit
 * @param codepoint
 */
function isHexDigit(codepoint) {
    return ((codepoint >= 0x30 && codepoint <= 0x39) ||
        (codepoint >= 0x41 && codepoint <= 0x46) ||
        (codepoint >= 0x61 && codepoint <= 0x66));
}
/**
 * true if the character may follow a numeric token: the end of the stream, a whitespace, `)`, `;`, `!`
 * (`0!important`), `}`, `/`, `*`, `,`, and `+` after a dimension (`2n+1`)
 * @param codepoint
 * @param isDimension
 */
function isNumericTokenEnd(codepoint, isDimension) {
    return (
    // eof
    codepoint != codepoint ||
        isWhiteSpace(codepoint) ||
        codepoint == 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
        codepoint == 59 /* TokenMap.SEMICOLON */ ||
        codepoint == 33 /* TokenMap.EXCLAMATION */ ||
        codepoint == 125 /* TokenMap.RIGHT_BRACE */ ||
        codepoint == 47 /* TokenMap.SLASH */ ||
        codepoint == 42 /* TokenMap.STAR */ ||
        codepoint == 44 /* TokenMap.COMMA */ ||
        (isDimension && codepoint == 43 /* TokenMap.PLUS */));
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
     * the identifier read by the last call of consumeIdentToken() has non ascii characters: they may be new lines
     * (U+2028, U+2029)
     */
    identNonAscii = false;
    /**
     * token hint
     */
    hint = null;
    state = null;
    constructor(parseInfo, input = null) {
        this.parseInfo = parseInfo;
        this.input = input;
        this.parseInfo =
            typeof parseInfo == "string"
                ? {
                    stream: parseInfo,
                    source: new SourceFile(parseInfo, [], ""),
                    offset: 0,
                    time: 0,
                    position: 0,
                    currentPosition: 0,
                }
                : parseInfo;
    }
    /**
     * id of the source file being tokenized
     */
    get sourceId() {
        return this.parseInfo.source.id;
    }
    /**
     * length of the css input. 0 when the input is a stream
     */
    get streamLength() {
        const stream = this.parseInfo.stream;
        return typeof stream == "string" ? stream.length : 0;
    }
    /**
     *
     * @param parseInfo
     * @returns
     */
    consumeString(parseInfo) {
        const quote = this.advanceCode(parseInfo);
        let charCode;
        let decodeSegments = false;
        while ((charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode) {
            if (charCode == 92 /* TokenMap.REVERSE_SOLIDUS */) {
                if (charCode == parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1)) {
                    this.advance(parseInfo, 2);
                    continue;
                }
                charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1);
                // \n \r \f \v
                if (charCode == 0xa ||
                    charCode == 0xb ||
                    charCode == 0xc ||
                    charCode == 0xd ||
                    charCode == 0x2028 ||
                    charCode == 0x2029) {
                    this.advance(parseInfo, 2);
                    decodeSegments = true;
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
                        (isWhiteSpace(parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset))
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
                this.advanceCode(parseInfo);
                return this.makeToken(parseInfo, 
                /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType, null, decodeSegments);
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
    consumeStringAsURLToken(parseInfo) {
        const quote = this.advanceCode(parseInfo);
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
                        (isWhiteSpace(parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset))
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
                this.advanceCode(parseInfo);
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
                        // this.advance(parseInfo, k);
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
                /* hasNewLine ? EnumToken.BadStringTokenType : */ EnumToken.StringTokenType, null, decodeSegments);
                // return result;
            }
            if (isNewLine(charCode)) {
                // bad string
                this.advanceCode(parseInfo);
                while ((charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode) {
                    if (charCode == 92 /* TokenMap.REVERSE_SOLIDUS */) {
                        this.advance(parseInfo, 2);
                        continue;
                    }
                    if (charCode == 41 /* TokenMap.RIGHT_PARENTHESIS */) {
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
    consumeUnicodeRangeToken(parseInfo) {
        const stream = parseInfo.stream;
        const start = parseInfo.currentPosition - parseInfo.offset;
        let position = start + 2;
        let count = 0;
        let wildcards = 0;
        let codepoint;
        if (stream.charCodeAt(start + 1) != 43 /* TokenMap.PLUS */) {
            return 0;
        }
        while (count < 6) {
            codepoint = stream.charCodeAt(position);
            if (wildcards == 0 && isHexDigit(codepoint)) {
                count++;
                position++;
            }
            else if (codepoint == 63 /* TokenMap.QUESTION */) {
                wildcards++;
                count++;
                position++;
            }
            else {
                break;
            }
        }
        if (count == 0) {
            return 0;
        }
        // the end of the range
        if (wildcards == 0 &&
            stream.charCodeAt(position) == 45 /* TokenMap.MINUS */ &&
            isHexDigit(stream.charCodeAt(position + 1))) {
            position++;
            count = 0;
            while (count < 6 && isHexDigit(stream.charCodeAt(position))) {
                count++;
                position++;
            }
        }
        codepoint = stream.charCodeAt(position);
        if (
        // eof
        codepoint != codepoint ||
            isWhiteSpace(codepoint) ||
            codepoint == 44 /* TokenMap.COMMA */ ||
            codepoint == 59 /* TokenMap.SEMICOLON */ ||
            codepoint == 125 /* TokenMap.RIGHT_BRACE */ ||
            codepoint == 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
            codepoint == 33 /* TokenMap.EXCLAMATION */) {
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
    consumeNumericToken(parseInfo) {
        const stream = parseInfo.stream;
        const offset = parseInfo.currentPosition - parseInfo.offset;
        let position = offset;
        let hasDigits = false;
        let codepoint = stream.charCodeAt(position);
        this.slice = null;
        this.hint = null;
        // '+' '-'
        if (codepoint == 43 /* TokenMap.PLUS */ || codepoint == 45 /* TokenMap.MINUS */) {
            position++;
        }
        // integer part
        while (isDigit(stream.charCodeAt(position))) {
            position++;
            hasDigits = true;
        }
        // decimal part
        if (stream.charCodeAt(position) == 46 /* TokenMap.DOT */ && isDigit(stream.charCodeAt(position + 1))) {
            position++;
            while (isDigit(stream.charCodeAt(position))) {
                position++;
            }
            hasDigits = true;
        }
        if (!hasDigits) {
            return 0;
        }
        // exponent: 'E' 'e', followed by a digit or a sign and a digit
        codepoint = stream.charCodeAt(position);
        if (codepoint == 0x45 || codepoint == 0x65) {
            let k = position + 1;
            if (stream.charCodeAt(k) == 43 /* TokenMap.PLUS */ || stream.charCodeAt(k) == 45 /* TokenMap.MINUS */) {
                k++;
            }
            if (isDigit(stream.charCodeAt(k))) {
                position = k;
                while (isDigit(stream.charCodeAt(position))) {
                    position++;
                }
            }
        }
        codepoint = stream.charCodeAt(position);
        // percentage
        if (codepoint == 37 /* TokenMap.PERCENTAGE */) {
            const slice = position;
            if (!isNumericTokenEnd(stream.charCodeAt(++position), false)) {
                return 0;
            }
            this.slice = slice;
            this.hint = EnumToken.PercentageTokenType;
            return position - offset;
        }
        // dimension: a unit, or a dashed ident (user defined unit)
        if (isLetter(codepoint) || (codepoint == 45 /* TokenMap.MINUS */ && stream.charCodeAt(position + 1) == 45 /* TokenMap.MINUS */)) {
            const slice = position;
            while (position < stream.length) {
                codepoint = stream.charCodeAt(++position);
                if (!isLetter(codepoint) && codepoint != 45 /* TokenMap.MINUS */) {
                    break;
                }
            }
            if (!isNumericTokenEnd(stream.charCodeAt(position), true)) {
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
    consumeIdentToken(parseInfo) {
        let position = parseInfo.currentPosition - parseInfo.offset;
        let offset = position;
        this.identNonAscii = false;
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
                if (codepoint > 0x7f) {
                    this.identNonAscii = true;
                }
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
        // inlined: this.peekCharCode(parseInfo)
        while (isWhiteSpace(parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset))) {
            this.advanceCode(parseInfo);
        }
        // inlined: this.peekCharCode(parseInfo)
        charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset);
        if (charCode == 34 /* TokenMap.DOUBLE_QUOTE */ || charCode == 39 /* TokenMap.SINGLE_QUOTE */) {
            return this.consumeStringAsURLToken(parseInfo);
        }
        do {
            this.advanceCode(parseInfo);
            // inlined: this.peekCharCode(parseInfo)
            charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset);
        } while (
        // !(value === "/" && this.match(parseInfo, "/*") &&
        charCode !== 41 /* TokenMap.RIGHT_PARENTHESIS */ &&
            !isWhiteSpace(charCode) &&
            parseInfo.currentPosition < endPosition);
        if (charCode !== 41 /* TokenMap.RIGHT_PARENTHESIS */) {
            let k = 1;
            while (k < endPosition) {
                charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + k);
                if (isWhiteSpace(charCode)) {
                    k++;
                    continue;
                }
                break;
            }
            if (charCode != charCode || (charCode != 41 /* TokenMap.RIGHT_PARENTHESIS */ && !isIdentStart(charCode))) {
                this.advance(parseInfo, k);
                return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
            }
        }
        return this.makeToken(parseInfo, 
        // parseInfo.position < parseInfo.currentPosition
        // inlined: this.peekCharCode(parseInfo)
        (charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) != charCode ||
            !this.isURLToken(parseInfo)
            ? EnumToken.BadUrlTokenType
            : EnumToken.UrlTokenTokenType);
    }
    /**
     *
     * @param parseInfo
     * @param hint
     * @param slice
     * @param decodeSegments
     * @returns
     */
    makeToken(parseInfo, hint, slice, decodeSegments) {
        let val = null;
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
            let isList = false;
            let hasUnit = false;
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
            const isHint = hintsEnum.has(hint);
            if (isList) {
                val = findItem(hint, parseInfo, hasUnit ? slice : parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset);
            }
            else if (hint == EnumToken.NumberTokenType || hint == EnumToken.WhitespaceTokenType) ;
            else if (!isHint) {
                // the canonical spelling of a known unit: `6DB` is rendered `6dB`
                val =
                    (hint == EnumToken.DimensionTokenType
                        ? findItem(EnumToken.DimensionTokenType, parseInfo, slice ?? parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset)
                        : null) ??
                        parseInfo.stream.slice(slice ?? parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset);
            }
            if (this.decodeString) {
                val = decodeEscapeSequences(val);
            }
            if (isHint) {
                this.typ = hint;
            }
            else {
                this.typ = hint;
                if (hasUnit || hint == EnumToken.PercentageTokenType || hint == EnumToken.DimensionTokenType) {
                    this.val = parseNumber(parseInfo.stream, parseInfo.position - parseInfo.offset, slice);
                    if (hint != EnumToken.PercentageTokenType) {
                        this.unit = val;
                        if (val.startsWith("--")) {
                            this.typ = EnumToken.UserDefinedDimensionTokenType;
                        }
                    }
                }
                else if (hint == EnumToken.NumberTokenType) {
                    this.val = parseNumber(parseInfo.stream, slice ?? parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset);
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
            if (decodeSegments) {
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
     * true if the text of the token being read equals the input, ignoring the case. the token text starts at
     * parseInfo.position: `0!important` is the number `0` followed by `!important`
     * @param parseInfo
     * @param input
     * @returns
     */
    equalsIgnoreCase(parseInfo, input) {
        let position = parseInfo.position - parseInfo.offset;
        if (parseInfo.currentPosition - parseInfo.position != input.length) {
            return false;
        }
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
        // compare the character codes: no single character strings
        for (let i = 0; i < input.length; i++) {
            if (parseInfo.stream.charCodeAt(position + i) != input.charCodeAt(i)) {
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
    peek(parseInfo, count = 1) {
        if (count == 1) {
            return parseInfo.stream.charAt(parseInfo.currentPosition - parseInfo.offset);
        }
        const position = parseInfo.currentPosition - parseInfo.offset;
        return parseInfo.stream.slice(position, position + count);
    }
    /**
     * move forward by count characters (at most to the end of the stream) and record the new lines. the characters
     * are read from the stream: no string is created
     * @param parseInfo
     * @param count
     */
    advance(parseInfo, count = 1) {
        const stream = parseInfo.stream;
        const position = parseInfo.currentPosition - parseInfo.offset;
        const remaining = stream.length - position;
        const length = count < remaining ? (count > 0 ? count : 0) : remaining > 0 ? remaining : 0;
        const lineStarts = parseInfo.source.lineStarts.lineStarts;
        let codepoint;
        for (let i = 0; i < length; i++) {
            codepoint = stream.charCodeAt(position + i);
            if (codepoint == 0xa || // \n
                codepoint == 0xb || // \v
                codepoint == 0xc || // \f
                codepoint == 0xd || // \r
                codepoint == 0x2028 || // \u2028
                codepoint == 0x2029 // \u2029
            ) {
                // \r\n: a single line start
                if (codepoint == 0xa && i > 0 && stream.charCodeAt(position + i - 1) == 0xd) ;
                else {
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
    skip(parseInfo, count) {
        const remaining = parseInfo.stream.length - (parseInfo.currentPosition - parseInfo.offset);
        parseInfo.currentPosition += count < remaining ? count : remaining > 0 ? remaining : 0;
    }
    /**
     * move forward over the identifier read by consumeIdentToken(): the new lines are recorded when it has non ascii
     * characters, see {@link advance}
     * @param parseInfo
     * @param count
     */
    skipIdent(parseInfo, count) {
        if (this.identNonAscii) {
            this.advance(parseInfo, count);
        }
        else {
            this.skip(parseInfo, count);
        }
    }
    /**
     * move forward by one character and return its code (NaN at the end of the stream). new lines are recorded
     * like {@link advance}
     * @param parseInfo
     */
    advanceCode(parseInfo) {
        const position = parseInfo.currentPosition - parseInfo.offset;
        const codepoint = parseInfo.stream.charCodeAt(position);
        if (codepoint != codepoint) {
            return codepoint;
        }
        if (codepoint == 0xa || // \n
            codepoint == 0xb || // \v
            codepoint == 0xc || // \f
            codepoint == 0xd || // \r
            codepoint == 0x2028 ||
            codepoint == 0x2029) {
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
     * @param input
     * @returns
     */
    startsWith(parseInfo, input) {
        let i = 0;
        let j = input.length;
        // compare the character codes: no single character strings
        while (i < j) {
            if (parseInfo.stream.charCodeAt(parseInfo.position - parseInfo.offset + i) != input.charCodeAt(i)) {
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
        // inlined: this.peekCharCode(parseInfo)
        while ((charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset)) == charCode) {
            if (this.state === EnumToken.UrlFunctionTokenDefType) {
                this.state = null;
                return this.consumeURLToken(parseInfo, endPosition);
            }
            if (parseInfo.position == parseInfo.currentPosition) {
                // `U+0025-00FF`
                if (charCode == 0x55 || charCode == 0x75) {
                    tokensCount = this.consumeUnicodeRangeToken(parseInfo);
                    if (tokensCount > 0) {
                        this.skip(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, EnumToken.UniCodeRange);
                    }
                }
                if (charCode == 45 /* TokenMap.MINUS */ ||
                    charCode == 43 /* TokenMap.PLUS */ ||
                    charCode == 46 /* TokenMap.DOT */ ||
                    isDigit(charCode)) {
                    tokensCount = this.consumeNumericToken(parseInfo);
                    if (tokensCount > 0) {
                        // the range of an invalid exponent may contain new lines
                        this.advance(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, this.hint ?? EnumToken.NumberTokenType, this.slice);
                    }
                }
                if (isIdentStart(charCode) || charCode == 45 /* TokenMap.MINUS */) {
                    tokensCount = this.consumeIdentToken(parseInfo);
                    if (tokensCount > 0) {
                        this.skipIdent(parseInfo, tokensCount);
                        // inlined: this.peekCharCode(parseInfo)
                        charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset);
                        // do not match function
                        if (40 /* TokenMap.LEFT_PARENTHESIS */ != charCode) {
                            return this.makeToken(parseInfo, this.startsWith(parseInfo, "--")
                                ? EnumToken.DashedIdenTokenType
                                : EnumToken.IdenTokenType);
                        }
                    }
                }
                if (charCode == 64 /* TokenMap.AT */) {
                    this.skip(parseInfo, 1);
                    // inlined: this.peekCharCode(parseInfo)
                    charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset);
                    // match at-rule
                    // inlined: this.peekCharCode(parseInfo)
                    if (charCode == 45 /* TokenMap.MINUS */ ||
                        isIdentStart(parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset))) {
                        // consume '@'
                        parseInfo.position = parseInfo.currentPosition;
                        tokensCount = this.consumeIdentToken(parseInfo);
                        if (tokensCount > 0) {
                            this.skipIdent(parseInfo, tokensCount);
                            return this.makeToken(parseInfo, EnumToken.AtRuleTokenType);
                        }
                    }
                }
                if (charCode == 35 /* TokenMap.HASH */) {
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
                case 61 /* TokenMap.EQUALS */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.DelimTokenType);
                // '+' or '-'
                case 43 /* TokenMap.PLUS */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    this.skip(parseInfo, 1);
                    charCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset);
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
                case 45 /* TokenMap.MINUS */:
                    if (parseInfo.position == parseInfo.currentPosition) {
                        nextCharCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset + 1);
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
                case 123 /* TokenMap.LEFT_BRACE */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.BlockStartTokenType);
                // '}'
                case 125 /* TokenMap.RIGHT_BRACE */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.BlockEndTokenType);
                // '('
                case 40 /* TokenMap.LEFT_PARENTHESIS */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        // if (
                        //     parseInfo.stream[parseInfo.position - parseInfo.offset] === ":" &&
                        //     this.isPseudo(parseInfo)
                        //) {
                        //     this.skip(parseInfo, 1);
                        //     return this.makeToken(parseInfo, EnumToken.PseudoClassFunctionTokenDefType);
                        // } else
                        if (this.isIdentToken(parseInfo)) {
                            const hint = this.startsWith(parseInfo, "--")
                                ? EnumToken.CustomFunctionTokenDefType
                                : (getSymbolHint(parseInfo, parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset + 1) ?? EnumToken.FunctionTokenDefType);
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
                case 41 /* TokenMap.RIGHT_PARENTHESIS */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.EndParensTokenType);
                // '['
                case 91 /* TokenMap.LEFT_BRACKETS */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.AttrStartTokenType);
                // ']'
                case 93 /* TokenMap.RIGHT_BRACKETS */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.AttrEndTokenType);
                case 59 /* TokenMap.SEMICOLON */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.SemiColonTokenType);
                case 58 /* TokenMap.COLON */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    this.skip(parseInfo, 1);
                    // inlined: this.peekCharCode(parseInfo)
                    if (parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset) == 58 /* TokenMap.COLON */) {
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
                    nextCharCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset);
                    while (nextCharCode == 0x20 ||
                        (nextCharCode >= 0x9 && nextCharCode <= 0xd) ||
                        nextCharCode == 0x2028 ||
                        nextCharCode == 0x2029) {
                        this.advanceCode(parseInfo);
                        // inlined: this.peekCharCode(parseInfo)
                        nextCharCode = parseInfo.stream.charCodeAt(parseInfo.currentPosition - parseInfo.offset);
                    }
                    return this.makeToken(parseInfo, EnumToken.WhitespaceTokenType);
                case 44 /* TokenMap.COMMA */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.CommaTokenType);
                case 36 /* TokenMap.DOLLAR */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    if (this.match(parseInfo, "$=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.EndMatchTokenType);
                    }
                    this.skip(parseInfo, 1);
                    break;
                case 126 /* TokenMap.TILDA */:
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
                case 94 /* TokenMap.CARET */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    if (this.match(parseInfo, "^=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.StartMatchTokenType);
                    }
                    this.skip(parseInfo, 1);
                    break;
                case 42 /* TokenMap.STAR */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    if (this.match(parseInfo, "*=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.ContainMatchTokenType);
                    }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.Star);
                case 38 /* TokenMap.AMPERSAND */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.NestingSelectorTokenType);
                case 124 /* TokenMap.PIPE */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    // '||'
                    if (this.match(parseInfo, "||")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.ColumnCombinatorTokenType);
                    }
                    else if (this.match(parseInfo, "|=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.DashMatchTokenType);
                    }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.PipeTokenType);
                case 33 /* TokenMap.EXCLAMATION */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    if (this.match(parseInfo, "!important")) {
                        this.skip(parseInfo, 10);
                        return this.makeToken(parseInfo, EnumToken.ImportantTokenType);
                    }
                    this.skip(parseInfo, 1);
                    break;
                case 47 /* TokenMap.SLASH */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    if (!this.match(parseInfo, "/*")) {
                        this.skip(parseInfo, 1);
                        return this.makeToken(parseInfo, getSymbolHint(parseInfo, parseInfo.position - parseInfo.offset, parseInfo.currentPosition - parseInfo.offset));
                    }
                    this.skip(parseInfo, 2);
                    while ((charCode = this.advanceCode(parseInfo)) == charCode) {
                        if (charCode == 42 /* TokenMap.STAR */) {
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
                case 62 /* TokenMap.GREATERTHAN */:
                    // if (parseInfo.position < parseInfo.currentPosition) {
                    //     return this.makeToken(parseInfo);
                    // }
                    if (this.match(parseInfo, ">=")) {
                        this.skip(parseInfo, 2);
                        return this.makeToken(parseInfo, EnumToken.GteTokenType);
                    }
                    this.skip(parseInfo, 1);
                    return this.makeToken(parseInfo, EnumToken.GtTokenType);
                case 60 /* TokenMap.LOWERTHAN */:
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
                        while ((charCode = this.advanceCode(parseInfo)) == charCode) {
                            if (charCode == 45 /* TokenMap.MINUS */ && this.match(parseInfo, "->")) {
                                break;
                            }
                        }
                        if (parseInfo.currentPosition >= endPosition) {
                            return this.makeToken(parseInfo, EnumToken.BadCdoTokenType);
                        }
                        else {
                            this.skip(parseInfo, 2);
                            return this.makeToken(parseInfo, EnumToken.CDOCOMMTokenType);
                        }
                    }
                    {
                        const startPosition = parseInfo.position - parseInfo.offset;
                        let offset = 1;
                        let charCode = parseInfo.stream.charCodeAt(startPosition + offset);
                        if (isLetter(charCode)) {
                            charCode = parseInfo.stream.charCodeAt(++offset + startPosition);
                            while (offset < endPosition && (charCode == 45 /* TokenMap.MINUS */ || isLetter(charCode))) {
                                charCode = parseInfo.stream.charCodeAt(++offset + startPosition);
                            }
                            if (offset > 1 && charCode == 62 /* TokenMap.GREATERTHAN */) {
                                this.skip(parseInfo, offset);
                                return this.makeToken(parseInfo, EnumToken.CssTypeTokenType);
                            }
                        }
                    }
                    break;
                case 35 /* TokenMap.HASH */:
                    if (parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
                    }
                    this.skip(parseInfo, 1);
                    break;
                case 92 /* TokenMap.REVERSE_SOLIDUS */:
                    // a new line may follow the backslash
                    this.advance(parseInfo);
                    // EOF
                    // end of stream ignore \\
                    if (!this.peek(parseInfo) && parseInfo.position < parseInfo.currentPosition) {
                        return this.makeToken(parseInfo);
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
                        // if (parseInfo.position < parseInfo.currentPosition) {
                        //     return this.makeToken(parseInfo);
                        // }
                        this.skip(parseInfo, 1);
                        let tokensCount = this.consumeIdentToken(parseInfo);
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
    async tokenizeStream() {
        const decoder = new TextDecoder("utf-8");
        const reader = this.input.getReader();
        let parseInfo = this.parseInfo;
        parseInfo.stream = "";
        while (true) {
            const { done, value } = await reader.read();
            const stream = ArrayBuffer.isView(value) ? decoder.decode(value, { stream: true }) : value;
            if (!done) {
                // inlined: parseInfo.source.append(stream as string)
                parseInfo.source.content += stream;
            }
            else {
                break;
            }
        }
        // inlined: parseInfo.source.getContent()
        parseInfo.stream = parseInfo.source.content;
        return this; // .next();
    }
}

export { TokenMap, Tokenizer, hintsEnum };
