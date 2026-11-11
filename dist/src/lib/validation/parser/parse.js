/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { EnumToken } from '../../ast/types.js';
import { LOC } from '../../syntax/constants.js';
import { ValidationTokenEnum } from './typedef.js';
import { isIdentStart, parseDimension, isPseudo, isIdent } from '../../syntax/syntax.js';

const SymbolsMapTokens = {
    "&&": ValidationTokenEnum.Ampersand,
    "|": ValidationTokenEnum.Pipe,
    "† ": ValidationTokenEnum.DisallowWhitespace,
    "||": ValidationTokenEnum.Column,
    "*": ValidationTokenEnum.Star,
    ",": ValidationTokenEnum.Comma,
    "/": ValidationTokenEnum.Separator,
    "+": ValidationTokenEnum.Plus,
    ";": ValidationTokenEnum.SemiColon,
    "(": ValidationTokenEnum.OpenParenthesis,
    ")": ValidationTokenEnum.CloseParenthesis,
    "[": ValidationTokenEnum.OpenBracket,
    "]": ValidationTokenEnum.CloseBracket,
    "{": ValidationTokenEnum.OpenCurlyBrace,
    "}": ValidationTokenEnum.CloseCurlyBrace,
    "?": ValidationTokenEnum.QuestionMark,
    "!": ValidationTokenEnum.Exclamation,
    "#": ValidationTokenEnum.HashMark,
    "<": ValidationTokenEnum.LessThan,
    ">": ValidationTokenEnum.GreaterThan,
    " ": ValidationTokenEnum.Whitespace,
    "\t": ValidationTokenEnum.Whitespace,
    "\r": ValidationTokenEnum.Whitespace,
    "\n": ValidationTokenEnum.Whitespace,
    "\f": ValidationTokenEnum.Whitespace,
    // '∞'
    "\u221e": ValidationTokenEnum.InfinityToken,
};
const makeBinaryOp = new Map([
    [ValidationTokenEnum.Column, ValidationTokenEnum.ColumnToken],
    [ValidationTokenEnum.Ampersand, ValidationTokenEnum.AmpersandToken],
]);
/**
 * single character symbols, by character code
 */
const symbolTypes = new Map();
for (const [key, type] of Object.entries(SymbolsMapTokens)) {
    if (key.length == 1) {
        symbolTypes.set(key.charCodeAt(0), type);
    }
}
/**
 * two characters symbols (the second character code by first character code)
 */
const pairSymbols = new Map();
for (const [key, type] of Object.entries(SymbolsMapTokens)) {
    if (key.length == 2) {
        const list = pairSymbols.get(key.charCodeAt(0)) ?? [];
        list.push([key.charCodeAt(1), type]);
        pairSymbols.set(key.charCodeAt(0), list);
    }
}
/**
 * symbol made of the character at index and the next one. at the end of the string, a single character symbol
 * @param syntax
 * @param index
 */
function pairSymbolType(syntax, index) {
    if (index + 1 >= syntax.length) {
        return symbolTypes.get(syntax.charCodeAt(index)) ?? null;
    }
    const list = pairSymbols.get(syntax.charCodeAt(index));
    if (list != null) {
        const next = syntax.charCodeAt(index + 1);
        for (let k = 0; k < list.length; k++) {
            if (list[k][0] == next) {
                return list[k][1];
            }
        }
    }
    return null;
}
/**
 * number of code points of a range of a string
 * @param str
 * @param start
 * @param end
 */
function codePoints(str, start, end) {
    let count = 0;
    for (let k = start; k < end; k++) {
        const code = str.charCodeAt(k);
        // a surrogate pair is a single code point
        if (code >= 0xd800 && code <= 0xdbff && k + 1 < end) {
            const low = str.charCodeAt(k + 1);
            if (low >= 0xdc00 && low <= 0xdfff) {
                k++;
            }
        }
        count++;
    }
    return count;
}
/**
 * true if the string is made of ascii digits
 * @param str
 */
function isDigits(str) {
    if (str.length == 0) {
        return false;
    }
    for (let k = 0; k < str.length; k++) {
        const code = str.charCodeAt(k);
        if (code < 48 || code > 57) {
            return false;
        }
    }
    return true;
}
/**
 * build a token from a buffered string
 * @param token
 * @param loc
 */
function getTokenType(token, loc) {
    if (token === "<an+b>") {
        return {
            typ: ValidationTokenEnum.PropertyType,
            val: token.slice(1, -1),
            [LOC]: loc,
        };
    }
    const first = token.charCodeAt(0);
    // " or '
    if (first == 34 || first == 39) {
        return {
            typ: ValidationTokenEnum.StringToken,
            val: token,
            [LOC]: loc,
        };
    }
    // integer, optionally negative: range bounds such as `<integer [-∞,-1]>`
    if (isDigits(token) || (first == 45 && isDigits(token.slice(1)))) {
        return {
            typ: ValidationTokenEnum.Number,
            val: Number(token),
            [LOC]: loc,
        };
    }
    let dimension = parseDimension(token);
    if (dimension) {
        // @ts-expect-error
        return {
            typ: ValidationTokenEnum.Dimension,
            unit: EnumToken[dimension.typ],
            val: dimension.val,
            unitText: dimension.unit,
            [LOC]: loc,
        };
    }
    if (isPseudo(token)) {
        return {
            typ: ValidationTokenEnum.PseudoClassToken,
            val: token,
            [LOC]: loc,
        };
    }
    // @
    if (first == 64 && isIdent(token.slice(1))) {
        return {
            typ: ValidationTokenEnum.AtRule,
            val: token.slice(1),
            [LOC]: loc,
        };
    }
    return {
        typ: ValidationTokenEnum.Keyword,
        val: token,
        [LOC]: loc,
    };
}
function trimSyntaxArray(tokens) {
    while (tokens[0]?.typ === ValidationTokenEnum.Whitespace) {
        tokens.shift();
    }
    while (tokens[tokens.length - 1]?.typ === ValidationTokenEnum.Whitespace) {
        tokens.pop();
    }
    let i = 0;
    for (; i < tokens.length; i++) {
        if (tokens[i].typ === ValidationTokenEnum.Comma) {
            if (i + 1 < tokens.length && tokens[i + 1].typ === ValidationTokenEnum.Whitespace) {
                tokens.splice(i + 1, 1);
            }
            if (i > 0 && tokens[i - 1].typ === ValidationTokenEnum.Whitespace) {
                tokens.splice(--i, 1);
            }
        }
    }
    return tokens;
}
/**
 * tokenize a syntax definition. the characters are scanned by code: a string is allocated for each token only.
 * the positions are tracked as numbers: `position` is the start of the pending token, `currentPosition` the current
 * character (columns are counted in code points, indexes in utf-16 code units)
 * @param syntax
 * @param position
 * @param currentPosition
 */
function tokenizeSyntax(syntax, position = {
    ind: 0,
    lin: 1,
    col: 0,
}, currentPosition = {
    ind: -1,
    lin: 1,
    col: 0,
}) {
    const tokens = [];
    const length = syntax.length;
    let posInd = position.ind;
    let posLin = position.lin;
    let posCol = position.col;
    let curInd = currentPosition.ind;
    let curLin = currentPosition.lin;
    let curCol = currentPosition.col;
    // the buffer is `prefix` + syntax[bufferStart, bufferEnd). the prefix is only used when `<an+b>` interrupts a word
    let prefix = "";
    let bufferStart = 0;
    let bufferEnd = 0;
    let i = -1;
    let code;
    let type;
    const bufferLength = () => prefix.length + bufferEnd - bufferStart;
    const buffer = () => prefix.length == 0 ? syntax.slice(bufferStart, bufferEnd) : prefix + syntax.slice(bufferStart, bufferEnd);
    const append = (index) => {
        if (bufferEnd == bufferStart) {
            bufferStart = index;
        }
        bufferEnd = index + 1;
    };
    const clear = () => {
        prefix = "";
        bufferStart = bufferEnd = 0;
    };
    // the location of the token starts at `position`. `position` moves to the current character
    const startToken = () => {
        const loc = { ind: posInd, lin: posLin, col: posCol };
        posInd = curInd;
        posLin = curLin;
        posCol = curCol;
        return loc;
    };
    while (++i < length) {
        code = syntax.charCodeAt(i);
        curCol++;
        curInd++;
        // <an+b>
        if (code == 60 && syntax.startsWith("an+b>", i + 1)) {
            if (bufferLength() > 0) {
                prefix = buffer();
                bufferStart = bufferEnd = 0;
            }
            tokens.push(getTokenType("<an+b>", startToken()));
            curCol += 5;
            curInd += 5;
            i += 5;
            continue;
        }
        type = pairSymbolType(syntax, i);
        if (type != null) {
            if (i + 1 < length) {
                i++;
                curCol++;
                curInd++;
            }
            const loc = startToken();
            if (bufferLength() > 0) {
                tokens.push(getTokenType(buffer(), startToken()));
                clear();
            }
            tokens.push({
                typ: type,
                [LOC]: loc,
            });
            continue;
        }
        // :
        if (code == 58) {
            if (syntax.charCodeAt(i + 1) == 58) {
                if (isIdentStart(syntax.charCodeAt(i + 2)) ||
                    (syntax.charCodeAt(i + 2) == 45 && isIdentStart(syntax.charCodeAt(i + 3)))) {
                    append(i);
                    append(++i);
                    continue;
                }
            }
            if (isIdentStart(syntax.charCodeAt(i + 1)) ||
                (syntax.charCodeAt(i + 1) == 45 && isIdentStart(syntax.charCodeAt(i + 2)))) {
                append(i);
                continue;
            }
        }
        type = symbolTypes.get(code) ?? null;
        if (type != null) {
            if (type === ValidationTokenEnum.Whitespace) {
                let k = i;
                while (k + 1 < length && symbolTypes.get(syntax.charCodeAt(k + 1)) === ValidationTokenEnum.Whitespace) {
                    k++;
                }
                if (k != i) {
                    curCol += k - i;
                    curInd += k - i;
                    i = k;
                }
            }
            const loc = startToken();
            if (bufferLength() > 0) {
                tokens.push(getTokenType(buffer(), startToken()));
                clear();
            }
            tokens.push({
                typ: type,
                [LOC]: loc,
            });
            continue;
        }
        switch (code) {
            // :
            case 58: {
                // `<ident-token> : <declaration-value>?`, `name: <value>`: the colon is a token
                const loc = startToken();
                if (bufferLength() > 0) {
                    tokens.push(getTokenType(buffer(), startToken()));
                    clear();
                }
                tokens.push({
                    typ: ValidationTokenEnum.Colon,
                    [LOC]: loc,
                });
                break;
            }
            // " and '
            case 34:
            case 39:
                {
                    const quote = bufferLength() > 0 ? buffer().charCodeAt(0) : code;
                    append(i);
                    while (i + 1 < length) {
                        append(++i);
                        if (syntax.charCodeAt(i) == quote) {
                            break;
                        }
                    }
                    const str = buffer();
                    tokens.push(getTokenType(str, startToken()));
                    curCol += codePoints(str, 0, str.length);
                    curInd += str.length;
                    clear();
                }
                break;
            default:
                append(i);
                break;
        }
    }
    if (bufferLength() > 0) {
        tokens.push(getTokenType(buffer(), startToken()));
    }
    tokens.push({
        typ: ValidationTokenEnum.EOF,
        [LOC]: { ind: posInd, lin: posLin, col: posCol },
    });
    position.ind = posInd;
    position.lin = posLin;
    position.col = posCol;
    currentPosition.ind = curInd;
    currentPosition.lin = curLin;
    currentPosition.col = curCol;
    return tokens;
}
/**
 * parse a css value definition syntax (webref)
 * @param syntax
 * @returns
 */
function parseSyntax(syntax) {
    const stack = [];
    let tokens = [];
    let currentToken;
    let startIndex;
    let endIndex;
    let iterator = tokenizeSyntax(syntax);
    for (const token of iterator) {
        tokens.push(token);
        switch (token.typ) {
            case ValidationTokenEnum.EOF:
                if (stack.at(-1)?.typ == ValidationTokenEnum.PipeToken) {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                    stack.pop();
                }
                else if (stack.at(-1)?.typ == ValidationTokenEnum.AmpersandToken) {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    stack.at(-1).r = trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2));
                    stack.pop();
                }
                else if (stack.at(-1)?.typ == ValidationTokenEnum.ColumnToken) {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                    stack.pop();
                }
                tokens.pop();
                break;
            case ValidationTokenEnum.Pipe:
                {
                    while (stack.at(-1)?.typ == ValidationTokenEnum.AmpersandToken ||
                        stack.at(-1)?.typ == ValidationTokenEnum.ColumnToken) {
                        let index = tokens.lastIndexOf(stack.at(-1));
                        if (stack.at(-1)?.typ == ValidationTokenEnum.AmpersandToken) {
                            stack.at(-1).r = trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2));
                        }
                        else {
                            stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                        }
                        stack.pop();
                    }
                    let index = stack.length == 0 ? -1 : tokens.lastIndexOf(stack.at(-1));
                    if (stack.at(-1)?.typ != ValidationTokenEnum.PipeToken) {
                        stack.push(Object.assign(token, {
                            typ: ValidationTokenEnum.PipeToken,
                            chi: [trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2))],
                        }));
                        break;
                    }
                    tokens.pop();
                    stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 1)));
                }
                break;
            case ValidationTokenEnum.Ampersand:
                {
                    let index = stack.length == 0 ? -1 : tokens.lastIndexOf(stack.at(-1));
                    if (stack.at(-1)?.typ === makeBinaryOp.get(token.typ)) {
                        if (token.typ === ValidationTokenEnum.Ampersand) {
                            stack.at(-1).r = trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2));
                            stack.pop();
                            stack.push(Object.assign(token, {
                                typ: makeBinaryOp.get(token.typ),
                                l: tokens.splice(index, 1),
                                r: [],
                            }));
                        }
                        // else {
                        //     (stack.at(-1) as ValidationAmpersandToken).r = trimSyntaxArray(
                        //         tokens.splice(index + 1, tokens.length - index - 2),
                        //     );
                        //     stack.pop();
                        //     stack.push(
                        //         Object.assign(token, {
                        //             typ: makeBinaryOp.get(token!.typ),
                        //             l: tokens.splice(index, 1),
                        //             r: [],
                        //         }) as ValidationAmpersandToken,
                        //     );
                        // }
                    }
                    else {
                        stack.push(Object.assign(token, {
                            typ: makeBinaryOp.get(token.typ),
                            l: trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                            r: [],
                        }));
                    }
                }
                break;
            case ValidationTokenEnum.Column:
                {
                    let index = stack.length == 0 ? -1 : tokens.lastIndexOf(stack.at(-1));
                    if (stack.at(-1)?.typ === makeBinaryOp.get(token.typ)) {
                        stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                        tokens.pop();
                    }
                    else {
                        if (index != -1) {
                            stack.push(Object.assign(token, {
                                typ: makeBinaryOp.get(token.typ),
                                chi: [trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2))],
                            }));
                        }
                        else {
                            stack.push(Object.assign(token, {
                                typ: makeBinaryOp.get(token.typ),
                                chi: [trimSyntaxArray(tokens.splice(0, tokens.length - 2))],
                            }));
                        }
                    }
                }
                break;
            case ValidationTokenEnum.OpenParenthesis:
                if (tokens.at(-2)?.typ == ValidationTokenEnum.Keyword) {
                    stack.push(Object.assign(tokens.at(-2), {
                        typ: ValidationTokenEnum.Function,
                        chi: [],
                    }));
                    tokens.pop();
                    break;
                }
                if (tokens.at(-2)?.typ == ValidationTokenEnum.PseudoClassToken) {
                    stack.push(Object.assign(tokens.at(-2), {
                        typ: ValidationTokenEnum.PseudoClassFunctionToken,
                        chi: [],
                    }));
                    tokens.pop();
                    break;
                }
                stack.push(token);
                break;
            case ValidationTokenEnum.CloseParenthesis:
                if (stack.at(-1)?.typ == ValidationTokenEnum.PipeToken) {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                    stack.pop();
                }
                if (stack.at(-1)?.typ == ValidationTokenEnum.OpenParenthesis ||
                    (stack.at(-1)?.typ == ValidationTokenEnum.PropertyType &&
                        stack.at(-1).val === "function-token")) {
                    stack.pop();
                }
                // else if ((stack.at(-1) as ValidationToken)?.typ === ValidationTokenEnum.PipeToken) {
                //     let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);
                //     (stack.at(-1) as ValidationPipeToken).chi.push(
                //         trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                //     );
                //     stack.pop();
                // }
                else if (stack.at(-1)?.typ === ValidationTokenEnum.AmpersandToken) {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    stack.at(-1).r = trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2));
                    stack.pop();
                }
                if (stack.at(-1)?.typ === ValidationTokenEnum.Function ||
                    stack.at(-1)?.typ === ValidationTokenEnum.PseudoClassFunctionToken) {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    tokens.pop();
                    stack.at(-1).chi =
                        trimSyntaxArray(tokens.splice(index + 1, tokens.length));
                    stack.pop();
                }
                break;
            case ValidationTokenEnum.GreaterThan:
                if (tokens[tokens.length - 3]?.typ === ValidationTokenEnum.LessThan) {
                    if (tokens[tokens.length - 2]?.typ === ValidationTokenEnum.Keyword) {
                        Object.assign(tokens[tokens.length - 3], {
                            typ: ValidationTokenEnum.PropertyType,
                            val: tokens[tokens.length - 2].val,
                        });
                        if ("range" in tokens[tokens.length - 2]) {
                            tokens[tokens.length - 3].range = tokens[tokens.length - 2].range;
                        }
                        tokens.splice(tokens.length - 2, 2);
                        if (tokens.at(-1).val == "function-token") {
                            // consume the closing ')'
                            stack.push(tokens.at(-1));
                        }
                    }
                    else if (tokens[tokens.length - 2]?.typ === ValidationTokenEnum.StringToken) {
                        Object.assign(tokens[tokens.length - 3], {
                            typ: ValidationTokenEnum.DeclarationType,
                            val: tokens[tokens.length - 2].val.slice(1, -1),
                        });
                        tokens.splice(tokens.length - 2, 2);
                    }
                    else if (tokens[tokens.length - 2]?.typ === ValidationTokenEnum.Function) {
                        Object.assign(tokens[tokens.length - 3], {
                            typ: ValidationTokenEnum.FunctionDefinition,
                            val: tokens[tokens.length - 2].val,
                        });
                        tokens.splice(tokens.length - 2, 2);
                    }
                }
                break;
            case ValidationTokenEnum.OpenBracket:
                stack.push(token);
                break;
            case ValidationTokenEnum.CloseBracket:
                while (true) {
                    if (stack.at(-1).typ == ValidationTokenEnum.AmpersandToken) {
                        let index = tokens.lastIndexOf(stack.at(-1));
                        stack.at(-1).r = trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2));
                        stack.pop();
                        continue;
                    }
                    else if (stack.at(-1).typ == ValidationTokenEnum.ColumnToken) {
                        let index = tokens.lastIndexOf(stack.at(-1));
                        stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                        stack.pop();
                        continue;
                    }
                    if (stack.at(-1).typ == ValidationTokenEnum.PipeToken) {
                        let index = tokens.lastIndexOf(stack.at(-1));
                        stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                        stack.pop();
                        continue;
                    }
                    break;
                }
                currentToken = stack.at(-1);
                // if (currentToken?.typ !== ValidationTokenEnum.OpenBracket) {
                //     console.debug(JSON.stringify(tokens, null, 1));
                //     throw new SyntaxError(`Unexpected token: ']' at line ${token![LOC].lin}:${token![LOC].col} `);
                // }
                {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    // the lower bound of a range may be '-∞': <integer [-∞,-1]>
                    const isNegativeInfinity = tokens[index + 1]?.typ === ValidationTokenEnum.Keyword &&
                        tokens[index + 1].val === "-" &&
                        tokens[index + 2]?.typ === ValidationTokenEnum.InfinityToken;
                    if (isNegativeInfinity &&
                        (tokens[index - 2]?.typ === ValidationTokenEnum.Keyword ||
                            tokens[index - 2]?.typ === ValidationTokenEnum.StringToken) &&
                        tokens[index - 1]?.typ === ValidationTokenEnum.Whitespace &&
                        tokens[index + 3]?.typ === ValidationTokenEnum.Comma &&
                        (tokens[index + 4]?.typ === ValidationTokenEnum.Number ||
                            tokens[index + 4]?.typ === ValidationTokenEnum.Dimension ||
                            tokens[index + 4]?.typ === ValidationTokenEnum.InfinityToken) &&
                        tokens[index + 5]?.typ === ValidationTokenEnum.CloseBracket) {
                        stack.pop();
                        // a null bound is unbounded
                        Object.assign(tokens[index - 2], {
                            range: {
                                min: null,
                                max: tokens[index + 4]?.typ === ValidationTokenEnum.InfinityToken
                                    ? null
                                    : tokens[index + 4],
                            },
                        });
                        tokens.splice(index - 1, 8);
                        break;
                    }
                    if ((tokens[index - 2]?.typ === ValidationTokenEnum.Keyword ||
                        tokens[index - 2]?.typ === ValidationTokenEnum.StringToken) &&
                        tokens[index - 1]?.typ === ValidationTokenEnum.Whitespace &&
                        (tokens[index + 1]?.typ === ValidationTokenEnum.Number ||
                            tokens[index + 1]?.typ === ValidationTokenEnum.Dimension)) {
                        // if (tokens[index + 2]?.typ === ValidationTokenEnum.CloseBracket) {
                        //     stack.pop();
                        //     Object.assign(tokens[index - 2], {
                        //         range: {
                        //             min: <ValidationNumberToken>tokens[index + 1],
                        //             max: <ValidationNumberToken>tokens[index + 1],
                        //         },
                        //     });
                        //     tokens.splice(index - 1, 5);
                        //     break;
                        // }
                        if (tokens[index + 2]?.typ === ValidationTokenEnum.Comma &&
                            (tokens[index + 3]?.typ === tokens[index + 1]?.typ ||
                                tokens[index + 3]?.typ === ValidationTokenEnum.InfinityToken) &&
                            tokens[index + 4]?.typ === ValidationTokenEnum.CloseBracket) {
                            stack.pop();
                            Object.assign(tokens[index - 2], {
                                range: {
                                    min: tokens[index + 1],
                                    max: tokens[index + 3]?.typ === tokens[index + 1]?.typ
                                        ? tokens[index + 3]
                                        : null,
                                },
                            });
                            tokens.splice(index - 1, 7);
                            break;
                        }
                    }
                }
                stack.pop();
                startIndex = tokens.lastIndexOf(currentToken);
                endIndex = tokens.indexOf(token);
                Object.assign(currentToken, {
                    typ: ValidationTokenEnum.Bracket,
                    chi: trimSyntaxArray(tokens.slice(startIndex + 1, endIndex)),
                });
                tokens.splice(startIndex + 1, tokens.length);
                break;
            // {
            case ValidationTokenEnum.OpenCurlyBrace:
                stack.push(token);
                break;
            // }
            case ValidationTokenEnum.CloseCurlyBrace:
                while (true) {
                    // if ((stack.at(-1) as ValidationToken).typ == ValidationTokenEnum.AmpersandToken) {
                    //     let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);
                    //     (stack.at(-1) as ValidationAmpersandToken).r = trimSyntaxArray(
                    //         tokens.splice(index + 1, tokens.length - index - 2),
                    //     );
                    //     stack.pop();
                    //     continue;
                    // } else
                    if (stack.at(-1).typ == ValidationTokenEnum.ColumnToken) {
                        let index = tokens.lastIndexOf(stack.at(-1));
                        stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                        stack.pop();
                        continue;
                    }
                    if (stack.at(-1)?.typ == ValidationTokenEnum.PipeToken) {
                        let index = tokens.lastIndexOf(stack.at(-1));
                        stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                        stack.pop();
                        continue;
                    }
                    break;
                }
                // if (stack.at(-1)?.typ != ValidationTokenEnum.OpenCurlyBrace) {
                //     throw new SyntaxError(`Unexpected token } as ${token![LOC].lin}:${token![LOC].col}`);
                // }
                {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    const slice = tokens.slice(index + 1, -1);
                    if (slice.length === 1 || slice.length === 3) {
                        if (slice[0].typ == ValidationTokenEnum.Number) {
                            Object.assign(tokens[index - 1], {
                                match: {
                                    min: slice[0],
                                    max: slice[0],
                                },
                            });
                            if (slice.length === 3) {
                                // if (slice[1].typ != ValidationTokenEnum.Comma) {
                                //     throw new SyntaxError(`Expecting ',' at ${slice[1][LOC].lin}:${slice[1][LOC].col}`);
                                // }
                                // if (
                                //     slice[2].typ != ValidationTokenEnum.Number &&
                                //     slice[2].typ != ValidationTokenEnum.InfinityToken
                                //) {
                                //     throw new SyntaxError(
                                //         `Expecting number or infinity at ${slice[2][LOC].lin}:${slice[2][LOC].col}`,
                                //     );
                                // }
                                Object.assign(tokens[index - 1], {
                                    match: {
                                        min: slice[0],
                                        max: slice[2].typ == ValidationTokenEnum.InfinityToken
                                            ? Number.POSITIVE_INFINITY
                                            : slice[2],
                                    },
                                });
                            }
                            stack.pop();
                            tokens.length = index;
                            break;
                        }
                    }
                }
                stack.pop();
                break;
            case ValidationTokenEnum.Star:
                tokens.pop();
                tokens.at(-1).isRepeatable = true;
                break;
            case ValidationTokenEnum.QuestionMark:
                tokens.pop();
                // if the previous token is a comma, we wrap them in a virtual group and mark the group as optional
                {
                    let sliceIndex = -1;
                    let isGroup; // = tokens.at(-2)?.typ == ValidationTokenEnum.Comma;
                    // if (isGroup) {
                    //     sliceIndex = tokens.length - 2;
                    // } else
                    // {
                    isGroup = tokens.at(-3)?.typ == ValidationTokenEnum.Comma;
                    if (isGroup) {
                        sliceIndex = tokens.length - 3;
                    }
                    // }
                    if (isGroup) {
                        tokens.splice(sliceIndex, tokens.length - sliceIndex, {
                            typ: ValidationTokenEnum.OptionalGroupToken,
                            chi: trimSyntaxArray(tokens.slice(sliceIndex)),
                            isOptional: true,
                        });
                    }
                    else {
                        tokens.at(-1).isOptional = true;
                    }
                }
                break;
            case ValidationTokenEnum.Comma:
                {
                    let sliceIndex = -1;
                    // if (tokens.at(-2)?.isOptional && tokens.at(-2)!.typ !== ValidationTokenEnum.OptionalGroupToken) {
                    //     sliceIndex = tokens.length - 2;
                    // } else
                    if (tokens.at(-2).typ == ValidationTokenEnum.Whitespace &&
                        tokens.at(-3)?.isOptional &&
                        tokens.at(-3).typ !== ValidationTokenEnum.OptionalGroupToken) {
                        sliceIndex = tokens.length - 3;
                    }
                    if (sliceIndex != -1) {
                        if (tokens[sliceIndex].isList) {
                            tokens.pop();
                        }
                        tokens.splice(sliceIndex, tokens.length - sliceIndex, {
                            typ: ValidationTokenEnum.OptionalGroupToken,
                            chi: trimSyntaxArray(tokens.slice(sliceIndex).map((t) => {
                                delete t.isOptional;
                                return t;
                            })),
                            isOptional: true,
                        });
                    }
                }
                break;
            case ValidationTokenEnum.HashMark:
                tokens.pop();
                tokens.at(-1).isList = true;
                break;
            case ValidationTokenEnum.Exclamation:
                tokens.pop();
                tokens.at(-1).isMandatatoryGroup = true;
                break;
            case ValidationTokenEnum.Plus:
                tokens.pop();
                tokens.at(-1).isRepeatableAtLeastOnce = true;
                break;
        }
    }
    if (stack.length > 0) {
        if (stack.at(-1)?.typ == ValidationTokenEnum.PipeToken) {
            let index = tokens.lastIndexOf(stack.at(-1));
            stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 1)));
            stack.pop();
        }
    }
    // if (stack.length > 0) {
    //     throw new SyntaxError(
    //         `Unexpected token ${ValidationTokenEnum[stack.at(-1)?.typ as ValidationTokenEnum]} at ${
    //             stack.at(-1)?.[LOC]?.lin
    //         }:${stack.at(-1)?.[LOC]?.col}`,
    //     );
    // }
    return trimSyntaxArray(tokens);
}

export { parseSyntax, tokenizeSyntax, trimSyntaxArray };
