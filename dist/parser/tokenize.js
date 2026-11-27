/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.2
	License: MIT
 */
import { EnumToken, ColorType } from '../ast/types.js';
import { validationUnits, pseudoElements, containerFunc, urlFunc, gridTemplateFunc, imageFunc, timelineFunc, supportFunc, timingFunc, colorsFunc, mathFuncs, transformFunctions, whenElseFunc, wildCardFuncs } from '../syntax/constants.js';
import { isNewLine, isWhiteSpace, isLetter, isIdentStart, isIdentCodepoint, isNonPrintable, isDigit, flexUnits, dimensionUnits, resolutionUnits, angleUnits, timeUnits, frequencyUnits } from '../syntax/syntax.js';
import { SourceFile } from './source.js';
import { isCssInput, toCodeUnits } from './input.js';
import { hashRangeLower, lowerAscii } from './utils/codes.js';
import { canonicalStart, canonicalEnd, canonicalCodes, registerCanonical } from './utils/canonical.js';

/**
 * decoded code units of the last value decoded by {@link decodeEscapes}
 */
let decoded = new Uint16Array(256);
/**
 * decode the escape sequences of a range of code units into {@link decoded}: a backslash followed by a new line, or by
 * 1 to 6 hexadecimal digits, and an optional space. a new line is removed, the digits are replaced by the character
 * (U+FFFD for 0, the surrogates and the values larger than U+10FFFF). the other backslashes are kept.
 * no string is created
 * @param codes
 * @param start
 * @param end
 * @returns the number of decoded code units
 */
function decodeEscapes(codes, start, end) {
    // the decoded value is not longer than the value
    if (decoded.length < end - start) {
        decoded = new Uint16Array(end - start);
    }
    const output = decoded;
    let length = 0;
    let i = start;
    while (i < end) {
        const code = codes[i];
        if (code !== 0x5c || i + 1 >= end) {
            output[length++] = code;
            i++;
            continue;
        }
        let next = codes[i + 1];
        // \n \r \f \v U+2028 U+2029: removed
        if (next === 0xa || next === 0xb || next === 0xc || next === 0xd || next === 0x2028 || next === 0x2029) {
            i += 2;
        }
        else if (isHexDigit(next)) {
            let codepoint = 0;
            let k = i + 1;
            while (k < end && k < i + 7 && isHexDigit((next = codes[k]))) {
                codepoint = codepoint * 16 + (next <= 0x39 ? next - 0x30 : (next | 0x20) - 0x57);
                k++;
            }
            i = k;
            if (codepoint === 0 ||
                // surrogates
                (codepoint >= 0xd800 && codepoint <= 0xdfff) ||
                codepoint > 0x10ffff) {
                output[length++] = 0xfffd;
            }
            else if (codepoint > 0xffff) {
                // surrogate pair
                codepoint -= 0x10000;
                output[length++] = 0xd800 + (codepoint >> 10);
                output[length++] = 0xdc00 + (codepoint & 0x3ff);
            }
            else {
                output[length++] = codepoint;
            }
        }
        else {
            // not an escape sequence: the backslash is kept, the next character is read again
            output[length++] = code;
            i++;
            continue;
        }
        // an optional space ends the escape sequence
        if (i < end && codes[i] === 0x20) {
            i++;
        }
    }
    return length;
}
/**
 * the lowercase code units of an ascii string
 * @param str
 */
function lowerCodesOf(str) {
    const codes = new Uint16Array(str.length);
    for (let i = 0; i < str.length; i++) {
        codes[i] = lowerAscii(str.charCodeAt(i));
    }
    return codes;
}
/**
 * hash table of ascii strings keyed by their hash. a range of the code units of the css source is looked up by its
 * hash, without creating a string: the keys are lowercase, the lookups ignore the case (see {@link hashRangeLower}).
 * when the hashes are equal, the code units are compared
 */
class HashTable {
    /**
     * lowercase code units of the keys, by entry
     */
    keys = [];
    /**
     * values, by entry
     */
    values = [];
    /**
     * hash of the keys, by entry
     */
    hashes = [];
    /**
     * entry + 1 by slot, 0 when the slot is empty
     */
    slots = new Int32Array(2048);
    /**
     * the value of a range of code units, ignoring the case
     * @param codes
     * @param start
     * @param end
     */
    get(codes, start, end) {
        const hash = hashRangeLower(codes, start, end);
        if (hash === -1) {
            return undefined;
        }
        const entry = this.slots[this.find(codes, start, end, hash)];
        return entry === 0 ? undefined : this.values[entry - 1];
    }
    /**
     * the value of a key, ignoring the case
     * @param key
     */
    getKey(key) {
        return this.get(lowerCodesOf(key), 0, key.length);
    }
    /**
     * set the value of a key. the key is lowercased
     * @param key
     * @param value
     */
    set(key, value) {
        const codes = lowerCodesOf(key);
        const hash = hashRangeLower(codes, 0, codes.length);
        const slot = this.find(codes, 0, codes.length, hash);
        if (this.slots[slot] === 0) {
            this.keys.push(codes);
            this.values.push(value);
            this.hashes.push(hash);
            this.slots[slot] = this.keys.length;
        }
        else {
            this.values[this.slots[slot] - 1] = value;
        }
    }
    /**
     * slot of a key: the slot of the entry, or the empty slot where it is inserted. the table is never full: it is
     * sized for the static tables of the tokenizer
     * @param codes
     * @param start
     * @param end
     * @param hash hash of the key
     */
    find(codes, start, end, hash) {
        const mask = this.slots.length - 1;
        const length = end - start;
        let slot = hash & mask;
        for (;;) {
            const entry = this.slots[slot];
            if (entry === 0) {
                return slot;
            }
            // the hashes are compared first: the code units are compared when they are equal
            if (this.hashes[entry - 1] === hash) {
                const key = this.keys[entry - 1];
                if (key.length === length) {
                    let k = 0;
                    while (k < length && lowerAscii(codes[start + k]) === key[k]) {
                        k++;
                    }
                    if (k === length) {
                        return slot;
                    }
                }
            }
            slot = (slot + 1) & mask;
        }
    }
}
/**
 * value of a number: the digits are read from the code units of the source, no string is created. the result is the
 * same as parseFloat() (the longest prefix that is a number): the value is exact when it has at most 15 significant
 * digits and a power of 10 between -22 and 22, it is computed with BigInt otherwise (see {@link exactNumber})
 * @param codes the code units of the source
 * @param start
 * @param end
 */
function parseNumber(codes, start, end) {
    let i = start;
    let code = codes[i];
    let negative = false;
    if (code === 0x2d || code === 0x2b) {
        negative = code === 0x2d;
        code = codes[++i];
    }
    const digitsStart = i;
    let mantissa = 0;
    let count = 0;
    let digits = 0;
    let decimals = -1;
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
        }
        else if (code === 0x2e && decimals === -1) {
            decimals = 0;
        }
        else {
            break;
        }
    }
    if (count === 0) {
        return NaN;
    }
    const digitsEnd = i;
    // power of 10 of the value: minus the number of decimals, plus the exponent
    let exponent = decimals > 0 ? -decimals : 0;
    // exponent: `1e3`, `1.5E-2`. ignored when it has no digit (the prefix before `e` is the number)
    if (i < end && (code === 0x65 || code === 0x45)) {
        let k = i + 1;
        let sign = 1;
        let value = 0;
        if (k < end && (codes[k] === 0x2d || codes[k] === 0x2b)) {
            sign = codes[k] === 0x2d ? -1 : 1;
            k++;
        }
        if (k < end && codes[k] >= 0x30 && codes[k] <= 0x39) {
            for (; k < end && (code = codes[k]) >= 0x30 && code <= 0x39; k++) {
                // larger exponents are Infinity or 0
                if (value < 100000) {
                    value = value * 10 + (code - 0x30);
                }
            }
            exponent += sign * value;
        }
    }
    if (mantissa === 0) {
        return negative ? -0 : 0;
    }
    if (digits > 15 || exponent > 22 || exponent < -22) {
        const value = exactNumber(codes, digitsStart, digitsEnd, exponent);
        return negative ? -value : value;
    }
    // the mantissa (less than 2^53) and 10^exponent are exact: the product or the division is correctly rounded like
    // parseFloat()
    const value = exponent > 0 ? mantissa * powersOf10[exponent] : exponent < 0 ? mantissa / powersOf10[-exponent] : mantissa;
    return negative ? -value : value;
}
/**
 * correctly rounded value of `digits * 10^exponent`, computed with BigInt. the digits may contain a dot, it is ignored
 * (the exponent takes the decimals into account)
 * @param codes
 * @param start start of the digits
 * @param end end of the digits
 * @param exponent power of 10
 */
function exactNumber(codes, start, end, exponent) {
    let mantissa = 0n;
    let chunk = 0;
    let chunkDigits = 0;
    let digits = 0;
    for (let i = start; i < end; i++) {
        const code = codes[i];
        if (code === 0x2e) {
            continue;
        }
        chunk = chunk * 10 + (code - 0x30);
        chunkDigits++;
        if (digits > 0 || code !== 0x30) {
            digits++;
        }
        if (chunkDigits === 15) {
            mantissa = mantissa * 1000000000000000n + BigInt(chunk);
            chunk = 0;
            chunkDigits = 0;
        }
    }
    if (chunkDigits > 0) {
        mantissa = mantissa * 10n ** BigInt(chunkDigits) + BigInt(chunk);
    }
    if (exponent >= 0) {
        return digits + exponent > 310 ? Infinity : Number(mantissa * 10n ** BigInt(exponent));
    }
    if (digits + exponent < -330) {
        return 0;
    }
    // the quotient has at least 64 bits: the lowest bit marks an inexact division, the rounding of Number() is correct
    let shift = Math.max(0, Math.ceil((1 - exponent - digits) * 3.321928094887362) + 66);
    const divisor = 10n ** BigInt(-exponent);
    const scaled = mantissa << BigInt(shift);
    let quotient = scaled / divisor;
    if (quotient * divisor !== scaled) {
        quotient |= 1n;
    }
    // subnormal result: rounded to a multiple of 2^-1074 (rounding the quotient then scaling would round twice)
    if (shift > 1074) {
        const drop = BigInt(shift - 1074);
        let units = quotient >> drop;
        const remainder = quotient - (units << drop);
        const half = 1n << (drop - 1n);
        // round half to even
        if (remainder > half || (remainder === half && (units & 1n) === 1n)) {
            units++;
        }
        // the result is exact: less than 2^53 units of 2^-1074
        if (units < 9007199254740992n) {
            return Number(units) * 2 ** -1074;
        }
    }
    let value = Number(quotient);
    // value * 2^-shift: exact, the powers of 2 are exact
    while (shift > 1000) {
        value *= 2 ** -1e3;
        shift -= 1000;
    }
    return value * 2 ** -shift;
}
const powersOf10 = [
    1, 1e1, 1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e13, 1e14, 1e15, 1e16, 1e17, 1e18, 1e19, 1e20,
    1e21, 1e22,
];
/**
 * token type of a symbol, unit or function name (the name followed by `(`), ignoring the case
 */
const symbolTable = new HashTable();
/**
 * units and function names of each token type, by lowercase name: the spelling of the first matching item
 */
const itemTable = new HashTable();
/**
 * symbols, units and function names: the definitions of {@link symbolTable}. only used to build the table
 */
const symbolDefinitions = new Map();
function assignTokenMap(entries, tokenType, suffix = "", lowercase = false) {
    for (const entry of entries) {
        const key = (lowercase ? entry.toLowerCase() : entry) + suffix;
        symbolDefinitions.set(key, tokenType);
        let items = itemTable.getKey(entry);
        if (items == null) {
            items = new Map();
            itemTable.set(entry.toLowerCase(), items);
        }
        // the first item wins, like a search of the array. the spelling is a range of the canonical text
        if (!items.has(tokenType)) {
            items.set(tokenType, registerCanonical(entry));
        }
    }
}
symbolDefinitions.set("+", EnumToken.Plus);
symbolDefinitions.set("=", EnumToken.DelimTokenType);
symbolDefinitions.set("|", EnumToken.PipeTokenType);
symbolDefinitions.set("||", EnumToken.ColumnCombinatorTokenType);
symbolDefinitions.set("|=", EnumToken.DashMatchTokenType);
symbolDefinitions.set("&", EnumToken.NestingSelectorTokenType);
symbolDefinitions.set("*", EnumToken.Star);
symbolDefinitions.set("*=", EnumToken.ContainMatchTokenType);
symbolDefinitions.set("~", EnumToken.Tilda);
symbolDefinitions.set("~=", EnumToken.IncludeMatchTokenType);
symbolDefinitions.set("^=", EnumToken.StartMatchTokenType);
symbolDefinitions.set("$=", EnumToken.EndMatchTokenType);
symbolDefinitions.set(",", EnumToken.Comma);
symbolDefinitions.set(":", EnumToken.ColonTokenType);
symbolDefinitions.set("::", EnumToken.DoubleColonTokenType);
symbolDefinitions.set(";", EnumToken.SemiColonTokenType);
symbolDefinitions.set("(", EnumToken.StartParensTokenType);
symbolDefinitions.set(")", EnumToken.EndParensTokenType);
symbolDefinitions.set("[", EnumToken.AttrStartTokenType);
symbolDefinitions.set("]", EnumToken.AttrEndTokenType);
symbolDefinitions.set("{", EnumToken.BlockStartTokenType);
symbolDefinitions.set("}", EnumToken.BlockEndTokenType);
symbolDefinitions.set("<=", EnumToken.LteTokenType);
symbolDefinitions.set(">", EnumToken.GtTokenType);
symbolDefinitions.set(">=", EnumToken.GteTokenType);
symbolDefinitions.set(" ", EnumToken.Whitespace);
symbolDefinitions.set("\t", EnumToken.Whitespace);
symbolDefinitions.set("\r", EnumToken.Whitespace);
symbolDefinitions.set("\n", EnumToken.Whitespace);
symbolDefinitions.set("\f", EnumToken.Whitespace);
assignTokenMap(flexUnits, EnumToken.FlexTokenType);
assignTokenMap(dimensionUnits, EnumToken.LengthTokenType);
assignTokenMap(resolutionUnits, EnumToken.ResolutionTokenType);
assignTokenMap(angleUnits, EnumToken.AngleTokenType);
assignTokenMap(timeUnits, EnumToken.TimeTokenType);
assignTokenMap(frequencyUnits, EnumToken.FrequencyTokenType);
// the units of the other dimensions are rendered in their canonical spelling: `6DB` is rendered `6dB`
for (const unit of validationUnits) {
    let items = itemTable.getKey(unit);
    if (items == null) {
        items = new Map();
        itemTable.set(unit.toLowerCase(), items);
    }
    if (!items.has(EnumToken.DimensionTokenType)) {
        items.set(EnumToken.DimensionTokenType, registerCanonical(unit));
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
// the table is keyed by the hash of the lowercase symbols
for (const [key, type] of symbolDefinitions) {
    symbolTable.set(key, type);
}
symbolDefinitions.clear();
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
/**
 * field of the token the value of a token is stored in
 */
var TokenValueField;
(function (TokenValueField) {
    /**
     * no value
     */
    TokenValueField[TokenValueField["None"] = 0] = "None";
    /**
     * numeric value
     */
    TokenValueField[TokenValueField["Number"] = 1] = "Number";
    /**
     * name: at-rule
     */
    TokenValueField[TokenValueField["Name"] = 2] = "Name";
    /**
     * string value
     */
    TokenValueField[TokenValueField["Value"] = 3] = "Value";
    /**
     * unit of a dimension, with the numeric value
     */
    TokenValueField[TokenValueField["Unit"] = 4] = "Unit";
})(TokenValueField || (TokenValueField = {}));
/**
 * where the string value of a token is read from
 */
var TokenValueKind;
(function (TokenValueKind) {
    /**
     * a range of the source
     */
    TokenValueKind[TokenValueKind["Source"] = 0] = "Source";
    /**
     * a range of the canonical text
     */
    TokenValueKind[TokenValueKind["Canonical"] = 1] = "Canonical";
    /**
     * a range of the source that contains escape sequences
     */
    TokenValueKind[TokenValueKind["Escaped"] = 2] = "Escaped";
})(TokenValueKind || (TokenValueKind = {}));
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
    const codes = parseInfo.codes;
    if (end > parseInfo.length) {
        end = parseInfo.length;
    }
    if (end - start <= 0) {
        return null;
    }
    // the range is looked up by its hash: no string is created
    return symbolTable.get(codes, start, end) ?? null;
}
/**
 * spelling of a unit or a function name of the given token type, ignoring the case: a range of the canonical text
 * (see {@link registerCanonical}), -1 when the name is not known
 * @param type
 * @param parseInfo
 * @param start
 * @param end
 */
function findItem(type, parseInfo, start, end) {
    if (end - start <= 0) {
        return -1;
    }
    return itemTable.get(parseInfo.codes, start, end)?.get(type) ?? -1;
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
    codepoint === undefined ||
        isWhiteSpace(codepoint) ||
        codepoint === 123 /* TokenMap.LEFT_BRACE */ ||
        codepoint === 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
        codepoint === 59 /* TokenMap.SEMICOLON */ ||
        codepoint === 33 /* TokenMap.EXCLAMATION */ ||
        codepoint === 125 /* TokenMap.RIGHT_BRACE */ ||
        codepoint === 47 /* TokenMap.SLASH */ ||
        codepoint === 42 /* TokenMap.STAR */ ||
        codepoint === 44 /* TokenMap.COMMA */ ||
        (isDimension && codepoint === 43 /* TokenMap.PLUS */));
}
/**
 * the parse info of a css input: the input is converted to code units, see {@link Tokenizer.load}. a stream is read
 * by {@link Tokenizer.tokenizeStream}
 * @param input the css: a string, an ArrayBuffer, a view of an ArrayBuffer or a stream
 * @param source the source file of the css
 */
function createParseInfo(input, source) {
    const parseInfo = {
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
class Tokenizer {
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
     * numeric value of the number, dimension and percentage tokens
     */
    num = 0;
    /**
     * field of the token the value is stored in: the numeric value ({@link num}), the name of an at-rule, the string
     * value, the unit of a dimension (with the numeric value)
     */
    field = 0 /* TokenValueField.None */;
    /**
     * where the string value is read from: a range of the source, a range of the canonical text (the spelling of a
     * known unit or function name) or a range of the source that contains escape sequences
     */
    valueKind = 0 /* TokenValueKind.Source */;
    /**
     * start of the string value: in the code units of the source, or in the canonical text
     */
    valueStart = 0;
    /**
     * end of the string value: in the code units of the source, or in the canonical text
     */
    valueEnd = 0;
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
    parseInfo;
    /**
     * true when the whole css is in {@link ParseInfo.codes}: the input is not a stream, or the stream is read to its end
     */
    streamDone = true;
    /**
     * the last call of {@link next} reached the end of the code units read from the stream: the token may continue in
     * the next chunk. no token is returned, the stream must be read ({@link read}) before {@link next} is called again
     */
    waiting = false;
    /**
     * reader of the stream
     */
    reader = null;
    /**
     * decoder of the chunks of the stream: a character can be split between two chunks
     */
    decoder = null;
    /**
     * the code units read from the stream: {@link ParseInfo.codes} is a view of its first {@link ParseInfo.length}
     * code units. the buffer doubles when it is full, the code units are copied once per doubling
     */
    buffer = new Uint8Array(0);
    /**
     * @param parseInfo the parse info, or the css: a string, an ArrayBuffer or a view of an ArrayBuffer
     * @param input a stream of css
     */
    constructor(parseInfo, input = null) {
        this.input = input;
        if (input != null) {
            this.streamDone = false;
        }
        if (isCssInput(parseInfo)) {
            this.parseInfo = createParseInfo(parseInfo, new SourceFile("", [], ""));
        }
        else {
            // the code units of a stream are appended chunk by chunk, see read()
            if (parseInfo.codes == null && input == null) {
                Tokenizer.load(parseInfo, parseInfo.source.content);
            }
            this.parseInfo = parseInfo;
        }
    }
    /**
     * set the css read by the tokenizer: the code units of the css (an ascii ArrayBuffer is read without copy). the
     * text of the css is the content of the source file: the offsets of the tokens are offsets of the content
     * @param parseInfo
     * @param input
     */
    static load(parseInfo, input) {
        const { codes, text } = toCodeUnits(input);
        parseInfo.codes = codes;
        parseInfo.length = codes.length;
        parseInfo.source.content = text;
    }
    /**
     * id of the source file being tokenized
     */
    get sourceId() {
        return this.parseInfo.source.id;
    }
    /**
     * length of the css input, in code units. 0 when the input is a stream
     */
    get streamLength() {
        return this.parseInfo.length;
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
        while ((charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) !== undefined) {
            if (charCode === 92 /* TokenMap.REVERSE_SOLIDUS */) {
                if (charCode === parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + 1]) {
                    this.advance(parseInfo, 2);
                    continue;
                }
                charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + 1];
                // \n \r \f \v
                if (charCode === 0xa ||
                    charCode === 0xb ||
                    charCode === 0xc ||
                    charCode === 0xd ||
                    charCode === 0x2028 ||
                    charCode === 0x2029) {
                    this.advance(parseInfo, 2);
                    decodeSegments = true;
                    continue;
                }
                // the escape sequence: up to 6 hexadecimal digits, followed by an optional space
                const escapeLength = this.escapeSequenceLength(parseInfo);
                if (escapeLength > 0) {
                    const length = escapeLength +
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
        while ((charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) !== undefined) {
            if (charCode === 92 /* TokenMap.REVERSE_SOLIDUS */) {
                if (charCode === parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + 1]) {
                    this.advance(parseInfo, 2);
                    continue;
                }
                // the escape sequence: up to 6 hexadecimal digits, followed by an optional space
                const escapeLength = this.escapeSequenceLength(parseInfo);
                if (escapeLength > 0) {
                    const length = escapeLength +
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
                let k = 1;
                let end = parseInfo.length - parseInfo.offset;
                let position = parseInfo.currentPosition - parseInfo.offset;
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
                    if (charCode !== 41 /* TokenMap.RIGHT_PARENTHESIS */) {
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
                while ((charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) !== undefined) {
                    if (charCode === 92 /* TokenMap.REVERSE_SOLIDUS */) {
                        this.advance(parseInfo, 2);
                        continue;
                    }
                    if (charCode === 41 /* TokenMap.RIGHT_PARENTHESIS */) {
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
        const codes = parseInfo.codes;
        const start = parseInfo.currentPosition - parseInfo.offset;
        let position = start + 2;
        let count = 0;
        let wildcards = 0;
        let codepoint;
        if (codes[start + 1] !== 43 /* TokenMap.PLUS */) {
            return 0;
        }
        while (count < 6) {
            codepoint = codes[position];
            if (wildcards === 0 && isHexDigit(codepoint)) {
                count++;
                position++;
            }
            else if (codepoint === 63 /* TokenMap.QUESTION */) {
                wildcards++;
                count++;
                position++;
            }
            else {
                break;
            }
        }
        if (count === 0) {
            return 0;
        }
        // the end of the range
        if (wildcards === 0 && codes[position] === 45 /* TokenMap.MINUS */ && isHexDigit(codes[position + 1])) {
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
            codepoint === 44 /* TokenMap.COMMA */ ||
            codepoint === 59 /* TokenMap.SEMICOLON */ ||
            codepoint === 125 /* TokenMap.RIGHT_BRACE */ ||
            codepoint === 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
            codepoint === 33 /* TokenMap.EXCLAMATION */) {
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
        const codes = parseInfo.codes;
        const offset = parseInfo.currentPosition - parseInfo.offset;
        let position = offset;
        let hasDigits = false;
        let codepoint = codes[position];
        this.slice = null;
        this.hint = null;
        // '+' '-'
        if (codepoint === 43 /* TokenMap.PLUS */ || codepoint === 45 /* TokenMap.MINUS */) {
            position++;
        }
        // integer part
        while (isDigit(codes[position])) {
            position++;
            hasDigits = true;
        }
        // decimal part
        if (codes[position] === 46 /* TokenMap.DOT */ && isDigit(codes[position + 1])) {
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
            let k = position + 1;
            if (codes[k] === 43 /* TokenMap.PLUS */ || codes[k] === 45 /* TokenMap.MINUS */) {
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
        if (codepoint === 37 /* TokenMap.PERCENTAGE */) {
            const slice = position;
            if (!isNumericTokenEnd(codes[++position], false)) {
                return 0;
            }
            this.slice = slice;
            this.hint = EnumToken.PercentageTokenType;
            return position - offset;
        }
        // dimension: a unit, or a dashed ident (user defined unit)
        if (isLetter(codepoint) || (codepoint === 45 /* TokenMap.MINUS */ && codes[position + 1] === 45 /* TokenMap.MINUS */)) {
            const slice = position;
            while (position < parseInfo.length) {
                codepoint = codes[++position];
                if (!isLetter(codepoint) && codepoint !== 45 /* TokenMap.MINUS */) {
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
    consumeIdentToken(parseInfo) {
        let position = parseInfo.currentPosition - parseInfo.offset;
        let offset = position;
        this.identNonAscii = false;
        let codepoint = parseInfo.codes[position];
        if (!isIdentStart(codepoint) && codepoint !== 45 /* TokenMap.MINUS */) {
            return 0;
        }
        if (codepoint === 45 /* TokenMap.MINUS */) {
            position++;
            codepoint = parseInfo.codes[position];
            if (!isIdentStart(codepoint) && codepoint !== 45 /* TokenMap.MINUS */) {
                return 0;
            }
        }
        while ((codepoint = parseInfo.codes[position]) !== undefined) {
            if (codepoint === 92 /* TokenMap.REVERSE_SOLIDUS */) {
                // eof
                if ((codepoint = parseInfo.codes[position + 1]) === undefined) {
                    return 0;
                }
                // \n \r \f \v
                if (codepoint === 0xa ||
                    codepoint === 0xb ||
                    codepoint === 0xc ||
                    codepoint === 0xd ||
                    codepoint === 0x2028 ||
                    codepoint === 0x2029) {
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
    consumeColor(parseInfo) {
        let position = parseInfo.currentPosition - parseInfo.offset;
        let offset = position;
        let codepoint = parseInfo.codes[position];
        if (codepoint !== 35 /* TokenMap.HASH */) {
            return 0;
        }
        position++;
        let count = 0;
        while (true) {
            codepoint = parseInfo.codes[position];
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
        if (count !== 3 && count !== 4 && count !== 6 && count !== 8) {
            return 0;
        }
        codepoint = parseInfo.codes[position];
        if (codepoint === undefined ||
            isWhiteSpace(codepoint) ||
            codepoint === 41 /* TokenMap.RIGHT_PARENTHESIS */ ||
            codepoint === 59 /* TokenMap.SEMICOLON */ ||
            codepoint === 125 /* TokenMap.RIGHT_BRACE */ ||
            codepoint === 44 /* TokenMap.COMMA */) {
            return position - offset;
        }
        return 0;
    }
    consumeURLToken(parseInfo, endPosition) {
        let charCode;
        // consume an <url>
        // inlined: this.peekCharCode(parseInfo)
        while (isWhiteSpace(parseInfo.codes[parseInfo.currentPosition - parseInfo.offset])) {
            this.advanceCode(parseInfo);
        }
        // inlined: this.peekCharCode(parseInfo)
        charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];
        if (charCode === 34 /* TokenMap.DOUBLE_QUOTE */ || charCode === 39 /* TokenMap.SINGLE_QUOTE */) {
            return this.consumeStringAsURLToken(parseInfo);
        }
        do {
            this.advanceCode(parseInfo);
            // inlined: this.peekCharCode(parseInfo)
            charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];
        } while (
        // !(value === "/" && this.match(parseInfo, "/*") &&
        charCode !== 41 /* TokenMap.RIGHT_PARENTHESIS */ &&
            !isWhiteSpace(charCode) &&
            parseInfo.currentPosition < endPosition);
        if (charCode !== 41 /* TokenMap.RIGHT_PARENTHESIS */) {
            let k = 1;
            while (k < endPosition) {
                charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + k];
                if (isWhiteSpace(charCode)) {
                    k++;
                    continue;
                }
                break;
            }
            if (charCode === undefined || (charCode !== 41 /* TokenMap.RIGHT_PARENTHESIS */ && !isIdentStart(charCode))) {
                this.advance(parseInfo, k);
                return this.makeToken(parseInfo, EnumToken.BadUrlTokenType);
            }
        }
        return this.makeToken(parseInfo, 
        // parseInfo.position < parseInfo.currentPosition
        // inlined: this.peekCharCode(parseInfo)
        (charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset]) === undefined ||
            !this.isURLToken(parseInfo)
            ? EnumToken.BadUrlTokenType
            : EnumToken.UrlTokenTokenType);
    }
    /**
     * set the current token: its type, its numeric value and the range of its string value (see {@link field} and
     * {@link valueKind}). no string is created
     * @param parseInfo
     * @param hint token type
     * @param slice start of the unit of a dimension, or of the value
     * @param decodeSegments the value contains escape sequences
     * @returns
     */
    makeToken(parseInfo, hint, slice, decodeSegments) {
        const start = parseInfo.position - parseInfo.offset;
        const end = parseInfo.currentPosition - parseInfo.offset;
        // the spelling of a known unit or function: a range of the canonical text, -1 otherwise
        let canonical = -1;
        let valueStart = start;
        let hasValue = false;
        this.typ = null;
        this.kin = null;
        this.num = 0;
        this.field = 0 /* TokenValueField.None */;
        this.slice = null;
        this.hint = null;
        if (slice) {
            this.slice = slice;
        }
        if (hint != null) {
            // the spelling of units and function names is looked up in the tables
            let isList = false;
            let hasUnit = false;
            switch (hint) {
                case EnumToken.TransformFunctionTokenDefType:
                case EnumToken.ColorFunctionTokenDefType:
                case EnumToken.ContainerFunctionTokenDefType:
                case EnumToken.UrlFunctionTokenDefType:
                case EnumToken.GridTemplateFuncTokenDefType:
                case EnumToken.ImageFunctionTokenDefType:
                case EnumToken.TimelineFunctionTokenDefType:
                case EnumToken.SupportsFunctionTokenDefType:
                case EnumToken.TimingFunctionTokenDefType:
                case EnumToken.MathFunctionTokenDefType:
                case EnumToken.WhenElseFunctionTokenDefType:
                case EnumToken.WildCardFunctionTokenDefType:
                    isList = true;
                    break;
                case EnumToken.FrequencyTokenType:
                case EnumToken.ResolutionTokenType:
                case EnumToken.LengthTokenType:
                case EnumToken.FlexTokenType:
                case EnumToken.AngleTokenType:
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
                valueStart = hasUnit ? slice : start;
                canonical = findItem(hint, parseInfo, valueStart, end);
                hasValue = canonical !== -1;
            }
            else if (hint === EnumToken.NumberTokenType || hint === EnumToken.WhitespaceTokenType) ;
            else if (!isHint) {
                valueStart = slice ?? start;
                // the canonical spelling of a known unit: `6DB` is rendered `6dB`
                canonical =
                    hint === EnumToken.DimensionTokenType
                        ? findItem(EnumToken.DimensionTokenType, parseInfo, valueStart, end)
                        : -1;
                hasValue = true;
            }
            this.typ = hint;
            if (!isHint) {
                if (hasUnit || hint === EnumToken.PercentageTokenType || hint === EnumToken.DimensionTokenType) {
                    this.num = parseNumber(parseInfo.codes, start, slice);
                    if (hint !== EnumToken.PercentageTokenType) {
                        this.field = hasValue ? 4 /* TokenValueField.Unit */ : 1 /* TokenValueField.Number */;
                        // a dashed ident: a user defined unit. the canonical units are not dashed idents
                        if (canonical === -1 &&
                            parseInfo.codes[valueStart] === 0x2d &&
                            parseInfo.codes[valueStart + 1] === 0x2d) {
                            this.typ = EnumToken.UserDefinedDimensionTokenType;
                        }
                    }
                    else {
                        this.field = 1 /* TokenValueField.Number */;
                    }
                }
                else if (hint === EnumToken.NumberTokenType) {
                    this.num = parseNumber(parseInfo.codes, slice ?? start, end);
                    this.field = 1 /* TokenValueField.Number */;
                }
                else if (hint === EnumToken.AtRuleTokenType) {
                    this.field = hasValue ? 2 /* TokenValueField.Name */ : 0 /* TokenValueField.None */;
                }
                else {
                    this.field = hasValue ? 3 /* TokenValueField.Value */ : 0 /* TokenValueField.None */;
                    if (hint === EnumToken.ColorTokenType) {
                        this.kin = ColorType.HEX;
                    }
                }
            }
        }
        else if (this.equalsIgnoreCase(parseInfo, "!important")) {
            this.typ = EnumToken.ImportantTokenType;
        }
        if (this.typ == null) {
            valueStart = start;
            hasValue = true;
            this.typ = EnumToken.LiteralTokenType;
            this.field = 3 /* TokenValueField.Value */;
        }
        if (hasValue) {
            if (canonical !== -1) {
                this.valueKind = 1 /* TokenValueKind.Canonical */;
                this.valueStart = canonicalStart(canonical);
                this.valueEnd = canonicalEnd(canonical);
            }
            else {
                // the escape sequences are decoded when the value is interned
                this.valueKind = decodeSegments ? 2 /* TokenValueKind.Escaped */ : 0 /* TokenValueKind.Source */;
                this.valueStart = valueStart;
                this.valueEnd = end;
            }
        }
        this.srcId = parseInfo.source.id;
        this.sta = parseInfo.position;
        this.end = parseInfo.currentPosition;
        this.bytesIn = parseInfo.currentPosition;
        parseInfo.position = parseInfo.currentPosition;
        return this;
    }
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
    internValue(arena, sourceIndex) {
        switch (this.valueKind) {
            case 1 /* TokenValueKind.Canonical */:
                return arena.internRange(canonicalCodes(), this.valueStart, this.valueEnd, -2 /* StringSource.Canonical */);
            case 2 /* TokenValueKind.Escaped */: {
                // the buffer may be reallocated by the decoder: it is read after the decoding
                const length = decodeEscapes(this.parseInfo.codes, this.valueStart, this.valueEnd);
                return arena.internRange(decoded, 0, length, -1 /* StringSource.Pool */);
            }
            default:
                return arena.internRange(this.parseInfo.codes, this.valueStart, this.valueEnd, sourceIndex < 0 ? -1 /* StringSource.Pool */ : sourceIndex);
        }
    }
    /**
     * content of the source being tokenized: the offsets of the tokens are offsets of the content
     */
    get content() {
        return this.parseInfo.source.content;
    }
    /**
     * code units of the source being tokenized
     */
    get codes() {
        return this.parseInfo.codes;
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
        if (parseInfo.currentPosition - parseInfo.position !== input.length) {
            return false;
        }
        let ca;
        let cb;
        for (let i = 0; i < input.length; i++) {
            ca = parseInfo.codes[position + i];
            cb = input.charCodeAt(i);
            // Normalize A-Z to a-z
            if (ca >= 65 && ca <= 90)
                ca += 32;
            if (cb >= 65 && cb <= 90)
                cb += 32;
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
    match(parseInfo, input) {
        let position = parseInfo.currentPosition - parseInfo.offset;
        // compare the character codes: no single character strings
        for (let i = 0; i < input.length; i++) {
            if (parseInfo.codes[position + i] !== input.charCodeAt(i)) {
                return false;
            }
        }
        return true;
    }
    /**
     * length of the escape sequence that follows the backslash at the current position: the hexadecimal digits (6
     * characters at most, the space included) followed by an optional space. 0 when there is no hexadecimal digit.
     * the code units are read: no string is created
     * @param parseInfo
     */
    escapeSequenceLength(parseInfo) {
        const codes = parseInfo.codes;
        const position = parseInfo.currentPosition - parseInfo.offset;
        const limit = parseInfo.length - position < 7 ? parseInfo.length - position : 7;
        let digits = 0;
        let length = 0;
        for (let i = 1; i < limit; i++) {
            const codepoint = codes[position + i];
            if (codepoint === 0x20) {
                length++;
                break;
            }
            if (!isHexDigit(codepoint)) {
                break;
            }
            digits++;
            length++;
        }
        return digits > 0 ? length : 0;
    }
    /**
     * move forward by count characters (at most to the end of the stream) and record the new lines. the code units are
     * read: no string is created
     * @param parseInfo
     * @param count
     */
    advance(parseInfo, count = 1) {
        const codes = parseInfo.codes;
        const position = parseInfo.currentPosition - parseInfo.offset;
        const remaining = parseInfo.length - position;
        const length = count < remaining ? (count > 0 ? count : 0) : remaining > 0 ? remaining : 0;
        const lineStarts = parseInfo.source.lineStarts.lineStarts;
        let codepoint;
        for (let i = 0; i < length; i++) {
            codepoint = codes[position + i];
            if (codepoint === 0xa || // \n
                codepoint === 0xb || // \v
                codepoint === 0xc || // \f
                codepoint === 0xd || // \r
                codepoint === 0x2028 || // \u2028
                codepoint === 0x2029 // \u2029
            ) {
                // \r\n: a single line start, at the \n
                if (codepoint !== 0xd || codes[position + i + 1] !== 0xa) {
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
        const remaining = parseInfo.length - (parseInfo.currentPosition - parseInfo.offset);
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
        const codepoint = parseInfo.codes[position];
        // the end of the stream: NaN
        if (codepoint === undefined) {
            return NaN;
        }
        if (codepoint === 0xa || // \n
            codepoint === 0xb || // \v
            codepoint === 0xc || // \f
            // \r\n: a single line start, at the \n
            (codepoint === 0xd && parseInfo.codes[position + 1] !== 0xa) ||
            codepoint === 0x2028 ||
            codepoint === 0x2029) {
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
        let codepoint = parseInfo.codes[i];
        // -
        if (codepoint === 0x2d) {
            let nextCodepoint;
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
        if (codepoint === 92 /* TokenMap.REVERSE_SOLIDUS */) {
            codepoint = parseInfo.codes[i + 1];
            // a code unit
            i++;
        }
        while (i < j) {
            i++;
            codepoint = parseInfo.codes[i];
            if (codepoint === 92 /* TokenMap.REVERSE_SOLIDUS */) {
                i++;
                codepoint = parseInfo.codes[i];
                i++;
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
    isURLToken(parseInfo) {
        let i = parseInfo.position - parseInfo.offset;
        let c;
        while (++i < parseInfo.currentPosition) {
            c = parseInfo.codes[i];
            // single quote or double quote or start parenthesis or close parenthesis
            if (isNonPrintable(c) || c === 0x27 || c === 0x22 || c === 0x28 || c === 0x29) {
                return false;
            }
            // valid escape
            if (c === 92 /* TokenMap.REVERSE_SOLIDUS */) {
                i++;
                if (i >= parseInfo.currentPosition) {
                    return false;
                }
                c = parseInfo.codes[i];
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
    done() {
        return this.typ === EnumToken.EOF;
    }
    /**
     * read the next token. when the input is a stream that is not read to its end, a token that ends near the end of
     * the code units read so far may continue in the next chunk (an identifier, a number, a string, a comment, ...): the
     * token is not returned, {@link waiting} is true and the stream must be read ({@link read}) before the next call
     */
    next() {
        if (this.streamDone) {
            return this.nextToken();
        }
        const parseInfo = this.parseInfo;
        const position = parseInfo.position;
        const currentPosition = parseInfo.currentPosition;
        const state = this.state;
        const lineStarts = parseInfo.source.lineStarts.lineStarts;
        const lineCount = lineStarts.length;
        this.nextToken();
        // the tokenizer reads at most a few code units after the end of a token: the token is complete when the
        // stream has more code units after it
        if (parseInfo.currentPosition + STREAM_LOOKAHEAD > parseInfo.length) {
            parseInfo.position = position;
            parseInfo.currentPosition = currentPosition;
            this.state = state;
            lineStarts.length = lineCount;
            this.typ = null;
            this.waiting = true;
        }
        return this;
    }
    /**
     * read the next token from the code units of the input
     */
    nextToken() {
        const parseInfo = this.parseInfo;
        this.source = parseInfo.source;
        let charCode;
        let nextCharCode;
        // const result: TokenizeResult[] = [];
        // allow 10 characters buffer for the streaming parser to avoid incomplete tokens
        const endPosition = parseInfo.length - 1;
        let tokensCount;
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
                if (charCode === 45 /* TokenMap.MINUS */ ||
                    charCode === 43 /* TokenMap.PLUS */ ||
                    charCode === 46 /* TokenMap.DOT */ ||
                    isDigit(charCode)) {
                    tokensCount = this.consumeNumericToken(parseInfo);
                    if (tokensCount > 0) {
                        // the range of an invalid exponent may contain new lines
                        this.advance(parseInfo, tokensCount);
                        return this.makeToken(parseInfo, this.hint ?? EnumToken.NumberTokenType, this.slice);
                    }
                }
                if (isIdentStart(charCode) || charCode === 45 /* TokenMap.MINUS */) {
                    tokensCount = this.consumeIdentToken(parseInfo);
                    if (tokensCount > 0) {
                        this.skipIdent(parseInfo, tokensCount);
                        // inlined: this.peekCharCode(parseInfo)
                        charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];
                        // do not match function
                        if (40 /* TokenMap.LEFT_PARENTHESIS */ !== charCode) {
                            return this.makeToken(parseInfo, this.startsWith(parseInfo, "--")
                                ? EnumToken.DashedIdenTokenType
                                : EnumToken.IdenTokenType);
                        }
                    }
                }
                if (charCode === 64 /* TokenMap.AT */) {
                    this.skip(parseInfo, 1);
                    // inlined: this.peekCharCode(parseInfo)
                    charCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];
                    // match at-rule
                    // inlined: this.peekCharCode(parseInfo)
                    if (charCode === 45 /* TokenMap.MINUS */ ||
                        isIdentStart(parseInfo.codes[parseInfo.currentPosition - parseInfo.offset])) {
                        // consume '@'
                        parseInfo.position = parseInfo.currentPosition;
                        tokensCount = this.consumeIdentToken(parseInfo);
                        if (tokensCount > 0) {
                            this.skipIdent(parseInfo, tokensCount);
                            return this.makeToken(parseInfo, EnumToken.AtRuleTokenType);
                        }
                    }
                }
                if (charCode === 35 /* TokenMap.HASH */) {
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
                case 45 /* TokenMap.MINUS */:
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
                    if (parseInfo.codes[parseInfo.currentPosition - parseInfo.offset] === 58 /* TokenMap.COLON */) {
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
                    while (nextCharCode === 0x20 ||
                        (nextCharCode >= 0x9 && nextCharCode <= 0xd) ||
                        nextCharCode === 0x2028 ||
                        nextCharCode === 0x2029) {
                        this.advanceCode(parseInfo);
                        // inlined: this.peekCharCode(parseInfo)
                        nextCharCode = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset];
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
                    while ((charCode = this.advanceCode(parseInfo)) === charCode) {
                        if (charCode === 42 /* TokenMap.STAR */) {
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
                        while ((charCode = this.advanceCode(parseInfo)) === charCode) {
                            if (charCode === 45 /* TokenMap.MINUS */ && this.match(parseInfo, "->")) {
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
                        let charCode = parseInfo.codes[startPosition + offset];
                        if (isLetter(charCode)) {
                            charCode = parseInfo.codes[++offset + startPosition];
                            while (offset < endPosition && (charCode === 45 /* TokenMap.MINUS */ || isLetter(charCode))) {
                                charCode = parseInfo.codes[++offset + startPosition];
                            }
                            if (offset > 1 && charCode === 62 /* TokenMap.GREATERTHAN */) {
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
                    if (parseInfo.codes[parseInfo.currentPosition - parseInfo.offset] === undefined &&
                        parseInfo.position < parseInfo.currentPosition) {
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
                    const codepoint = parseInfo.codes[parseInfo.currentPosition - parseInfo.offset + 1];
                    if (isIdentStart(codepoint) || codepoint === 45 /* TokenMap.MINUS */) {
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
     * start reading the stream: the first chunk is read. the next chunks are read when the tokenizer reaches the end
     * of the code units read so far, see {@link next} and {@link read}
     */
    async tokenizeStream() {
        if (!this.streamDone && this.reader == null) {
            await this.read();
        }
        return this;
    }
    /**
     * read the next chunk of the stream and append it to the css: the text of the source file and the code units.
     * the code units stay a view of the bytes while the css is ascii, they are utf-16 code units otherwise
     */
    async read() {
        if (this.streamDone) {
            this.waiting = false;
            return;
        }
        if (this.reader == null) {
            this.reader = this.input.getReader();
            this.decoder = new TextDecoder("utf-8");
        }
        // the chunks are appended together: at least 64 KB, or half of the css read so far. the text of the css is copied
        // when it is read after a chunk is appended (a string is not appended in place): the batches grow with the css,
        // the text is copied a few times instead of once per chunk
        const batch = Math.max(STREAM_BATCH, this.parseInfo.length >> 1);
        const texts = [];
        let length = 0;
        while (length < batch) {
            const { done, value } = await this.reader.read();
            if (done) {
                // the end of a character split between the last chunks
                texts.push(this.decoder.decode());
                this.streamDone = true;
                this.reader.releaseLock();
                break;
            }
            const text = typeof value === "string" ? value : this.decoder.decode(value, { stream: true });
            texts.push(text);
            length += text.length;
        }
        const text = texts.length === 1 ? texts[0] : texts.join("");
        if (text.length > 0) {
            this.append(text);
        }
        this.waiting = false;
    }
    /**
     * append the text of a chunk to the css
     * @param text
     */
    append(text) {
        const parseInfo = this.parseInfo;
        const length = parseInfo.length;
        const required = length + text.length;
        parseInfo.source.content += text;
        if (required > this.buffer.length) {
            let capacity = this.buffer.length > 0 ? this.buffer.length * 2 : 1 << 16;
            while (capacity < required) {
                capacity *= 2;
            }
            const buffer = this.buffer instanceof Uint8Array ? new Uint8Array(capacity) : new Uint16Array(capacity);
            buffer.set(this.buffer.subarray(0, length));
            this.buffer = buffer;
        }
        let ascii = false;
        if (this.buffer instanceof Uint8Array) {
            // an ascii text has a byte for each character
            const { read, written } = streamEncoder.encodeInto(text, this.buffer.subarray(length, required));
            ascii = read === text.length && written === text.length;
            if (!ascii) {
                // the css is not ascii: the code units are utf-16 code units from now on
                const buffer = new Uint16Array(this.buffer.length);
                buffer.set(this.buffer.subarray(0, length));
                this.buffer = buffer;
            }
        }
        if (!ascii) {
            const buffer = this.buffer;
            for (let i = 0; i < text.length; i++) {
                buffer[length + i] = text.charCodeAt(i);
            }
        }
        parseInfo.length = required;
        parseInfo.codes = this.buffer.subarray(0, required);
    }
}
/**
 * number of code units the tokenizer may read after the end of a token (escape sequences, unicode ranges, `<!--`,
 * ...): a token read from a stream is complete when the stream has more code units after it, see {@link Tokenizer.next}
 */
const STREAM_LOOKAHEAD = 32;
/**
 * minimum number of code units appended to the css when a stream is read, see {@link Tokenizer.read}
 */
const STREAM_BATCH = 1 << 16;
/**
 * encoder of the chunks of a stream, see {@link Tokenizer.append}
 */
const streamEncoder = new TextEncoder();

export { TokenMap, TokenValueField, TokenValueKind, Tokenizer, createParseInfo, hintsEnum };
