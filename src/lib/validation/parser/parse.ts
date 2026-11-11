import { EnumToken } from "../../ast/types.ts";

import { LOC } from "../../syntax/constants.ts";
import { ValidationTokenEnum } from "./typedef.ts";
import { isIdent, isIdentStart, isPseudo, parseDimension } from "../../syntax/syntax.ts";
import type {
    Position,
    ValidationAmpersandToken,
    ValidationAtRuleDefinitionToken,
    ValidationAtRuleToken,
    ValidationBlockToken,
    ValidationBracketToken,
    ValidationColumnToken,
    ValidationDeclarationDefinitionToken,
    ValidationDeclarationNameToken,
    ValidationDeclarationToken,
    ValidationDimensionToken,
    ValidationFunctionDefinitionToken,
    ValidationFunctionToken,
    ValidationKeywordToken,
    ValidationNumberToken,
    ValidationOptionalGroupToken,
    ValidationPipeToken,
    ValidationPropertyToken,
    ValidationPseudoClassFunctionToken,
    ValidationPseudoClassToken,
    ValidationRootToken,
    ValidationStringToken,
    ValidationToken,
} from "./types.d.ts";
import type { DimensionToken } from "../../../@types/index.d.ts";

const SymbolsMapTokens: Record<string, ValidationTokenEnum> = {
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

const makeBinaryOp: Map<ValidationTokenEnum, ValidationTokenEnum> = new Map([
    [ValidationTokenEnum.Column, ValidationTokenEnum.ColumnToken],
    [ValidationTokenEnum.Ampersand, ValidationTokenEnum.AmpersandToken],
]);

/**
 * single character symbols, by character code
 */
const symbolTypes: Map<number, ValidationTokenEnum> = new Map();

for (const [key, type] of Object.entries(SymbolsMapTokens)) {
    if (key.length == 1) {
        symbolTypes.set(key.charCodeAt(0), type);
    }
}

/**
 * two characters symbols (the second character code by first character code)
 */
const pairSymbols: Map<number, Array<[number, ValidationTokenEnum]>> = new Map();

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
function pairSymbolType(syntax: string, index: number): ValidationTokenEnum | null {
    if (index + 1 >= syntax.length) {
        return symbolTypes.get(syntax.charCodeAt(index)) ?? null;
    }

    const list = pairSymbols.get(syntax.charCodeAt(index));

    if (list != null) {
        const next: number = syntax.charCodeAt(index + 1);

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
function codePoints(str: string, start: number, end: number): number {
    let count: number = 0;

    for (let k = start; k < end; k++) {
        const code: number = str.charCodeAt(k);

        // a surrogate pair is a single code point
        if (code >= 0xd800 && code <= 0xdbff && k + 1 < end) {
            const low: number = str.charCodeAt(k + 1);

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
function isDigits(str: string): boolean {
    if (str.length == 0) {
        return false;
    }

    for (let k = 0; k < str.length; k++) {
        const code: number = str.charCodeAt(k);

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
function getTokenType(token: string, loc: Position): ValidationToken {
    if (token === "<an+b>") {
        return {
            typ: ValidationTokenEnum.PropertyType,
            val: token.slice(1, -1),
            [LOC]: loc,
        } as ValidationPropertyToken;
    }

    const first: number = token.charCodeAt(0);

    // " or '
    if (first == 34 || first == 39) {
        return {
            typ: ValidationTokenEnum.StringToken,
            val: token,
            [LOC]: loc,
        } as ValidationStringToken;
    }

    // integer, optionally negative: range bounds such as `<integer [-∞,-1]>`
    if (isDigits(token) || (first == 45 && isDigits(token.slice(1)))) {
        return {
            typ: ValidationTokenEnum.Number,
            val: Number(token),
            [LOC]: loc,
        } as ValidationNumberToken;
    }

    let dimension = parseDimension(token);

    if (dimension) {
        // @ts-expect-error
        return {
            typ: ValidationTokenEnum.Dimension,
            unit: EnumToken[dimension.typ],
            val: dimension.val,
            unitText: (dimension as DimensionToken).unit,
            [LOC]: loc,
        } as ValidationDeclarationNameToken;
    }

    if (isPseudo(token)) {
        return {
            typ: ValidationTokenEnum.PseudoClassToken,
            val: token,
            [LOC]: loc,
        } as ValidationPseudoClassToken;
    }

    // @
    if (first == 64 && isIdent(token.slice(1))) {
        return {
            typ: ValidationTokenEnum.AtRule,
            val: token.slice(1),
            [LOC]: loc,
        } as ValidationAtRuleToken;
    }

    return {
        typ: ValidationTokenEnum.Keyword,
        val: token,
        [LOC]: loc,
    } as ValidationKeywordToken;
}

export function trimSyntaxArray(tokens: ValidationToken[]) {
    while (tokens[0]?.typ === ValidationTokenEnum.Whitespace) {
        tokens.shift();
    }

    while (tokens[tokens.length - 1]?.typ === ValidationTokenEnum.Whitespace) {
        tokens.pop();
    }

    let i: number = 0;

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
export function tokenizeSyntax(
    syntax: string,
    position: Position = {
        ind: 0,
        lin: 1,
        col: 0,
    },
    currentPosition: Position = {
        ind: -1,
        lin: 1,
        col: 0,
    },
): ValidationToken[] {
    const tokens: ValidationToken[] = [];
    const length: number = syntax.length;
    let posInd: number = position.ind;
    let posLin: number = position.lin;
    let posCol: number = position.col;
    let curInd: number = currentPosition.ind;
    let curLin: number = currentPosition.lin;
    let curCol: number = currentPosition.col;
    // the buffer is `prefix` + syntax[bufferStart, bufferEnd). the prefix is only used when `<an+b>` interrupts a word
    let prefix: string = "";
    let bufferStart: number = 0;
    let bufferEnd: number = 0;
    let i: number = -1;
    let code: number;
    let type: ValidationTokenEnum | null;

    const bufferLength = (): number => prefix.length + bufferEnd - bufferStart;
    const buffer = (): string =>
        prefix.length == 0 ? syntax.slice(bufferStart, bufferEnd) : prefix + syntax.slice(bufferStart, bufferEnd);
    const append = (index: number): void => {
        if (bufferEnd == bufferStart) {
            bufferStart = index;
        }

        bufferEnd = index + 1;
    };
    const clear = (): void => {
        prefix = "";
        bufferStart = bufferEnd = 0;
    };
    // the location of the token starts at `position`. `position` moves to the current character
    const startToken = (): Position => {
        const loc: Position = { ind: posInd, lin: posLin, col: posCol };

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

            const loc: Position = startToken();

            if (bufferLength() > 0) {
                tokens.push(getTokenType(buffer(), startToken()));
                clear();
            }

            tokens.push({
                typ: type,
                [LOC]: loc,
            } as ValidationToken);
            continue;
        }

        // :
        if (code == 58) {
            if (syntax.charCodeAt(i + 1) == 58) {
                if (
                    isIdentStart(syntax.charCodeAt(i + 2)) ||
                    (syntax.charCodeAt(i + 2) == 45 && isIdentStart(syntax.charCodeAt(i + 3)))
                ) {
                    append(i);
                    append(++i);
                    continue;
                }
            }

            if (
                isIdentStart(syntax.charCodeAt(i + 1)) ||
                (syntax.charCodeAt(i + 1) == 45 && isIdentStart(syntax.charCodeAt(i + 2)))
            ) {
                append(i);
                continue;
            }
        }

        type = symbolTypes.get(code) ?? null;

        if (type != null) {
            if (type === ValidationTokenEnum.Whitespace) {
                let k: number = i;

                while (k + 1 < length && symbolTypes.get(syntax.charCodeAt(k + 1)) === ValidationTokenEnum.Whitespace) {
                    k++;
                }

                if (k != i) {
                    curCol += k - i;
                    curInd += k - i;
                    i = k;
                }
            }

            const loc: Position = startToken();

            if (bufferLength() > 0) {
                tokens.push(getTokenType(buffer(), startToken()));
                clear();
            }

            tokens.push({
                typ: type,
                [LOC]: loc,
            } as ValidationToken);
            continue;
        }

        switch (code) {
            // :
            case 58: {
                // `<ident-token> : <declaration-value>?`, `name: <value>`: the colon is a token
                const loc: Position = startToken();

                if (bufferLength() > 0) {
                    tokens.push(getTokenType(buffer(), startToken()));
                    clear();
                }

                tokens.push({
                    typ: ValidationTokenEnum.Colon,
                    [LOC]: loc,
                } as ValidationToken);
                break;
            }

            // " and '
            case 34:
            case 39:
                {
                    const quote: number = bufferLength() > 0 ? buffer().charCodeAt(0) : code;

                    append(i);

                    while (i + 1 < length) {
                        append(++i);

                        if (syntax.charCodeAt(i) == quote) {
                            break;
                        }
                    }

                    const str: string = buffer();

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
        [LOC]: { ind: posInd, lin: posLin, col: posCol } as Position,
    } as ValidationToken);

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
export function parseSyntax(syntax: string): ValidationToken[] {
    const stack = [] as ValidationToken[];
    let tokens = [] as ValidationToken[];

    let currentToken: ValidationToken;
    let startIndex: number;
    let endIndex: number;

    let iterator = tokenizeSyntax(syntax);

    for (const token of iterator) {
        tokens.push(token!);

        switch (token!.typ) {
            case ValidationTokenEnum.EOF:
                if ((stack.at(-1) as ValidationToken)?.typ == ValidationTokenEnum.PipeToken) {
                    let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                    (stack.at(-1) as ValidationPipeToken).chi.push(
                        trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                    );
                    stack.pop();
                } else if ((stack.at(-1) as ValidationToken)?.typ == ValidationTokenEnum.AmpersandToken) {
                    let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                    (stack.at(-1) as ValidationAmpersandToken).r = trimSyntaxArray(
                        tokens.splice(index + 1, tokens.length - index - 2),
                    );
                    stack.pop();
                } else if ((stack.at(-1) as ValidationToken)?.typ == ValidationTokenEnum.ColumnToken) {
                    let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                    (stack.at(-1) as ValidationColumnToken).chi.push(
                        trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                    );
                    stack.pop();
                }

                tokens.pop();
                break;

            case ValidationTokenEnum.Pipe:
                {
                    while (
                        (stack.at(-1) as ValidationToken)?.typ == ValidationTokenEnum.AmpersandToken ||
                        (stack.at(-1) as ValidationToken)?.typ == ValidationTokenEnum.ColumnToken
                    ) {
                        let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                        if ((stack.at(-1) as ValidationToken)?.typ == ValidationTokenEnum.AmpersandToken) {
                            (stack.at(-1) as ValidationAmpersandToken).r = trimSyntaxArray(
                                tokens.splice(index + 1, tokens.length - index - 2),
                            );
                        } else {
                            (stack.at(-1) as ValidationColumnToken).chi.push(
                                trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                            );
                        }

                        stack.pop();
                    }

                    let index: number = stack.length == 0 ? -1 : tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                    if (stack.at(-1)?.typ != ValidationTokenEnum.PipeToken) {
                        stack.push(
                            Object.assign(token, {
                                typ: ValidationTokenEnum.PipeToken,
                                chi: [trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2))],
                            }) as ValidationPipeToken,
                        );
                        break;
                    }

                    tokens.pop();
                    (stack.at(-1) as ValidationPipeToken).chi.push(
                        trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 1)),
                    );
                }

                break;
            case ValidationTokenEnum.Ampersand:
                {
                    let index: number = stack.length == 0 ? -1 : tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                    if (stack.at(-1)?.typ === makeBinaryOp.get(token!.typ)) {
                        if (token.typ === ValidationTokenEnum.Ampersand) {
                            (stack.at(-1) as ValidationAmpersandToken).r = trimSyntaxArray(
                                tokens.splice(index + 1, tokens.length - index - 2),
                            );

                            stack.pop();

                            stack.push(
                                Object.assign(token, {
                                    typ: makeBinaryOp.get(token!.typ),
                                    l: tokens.splice(index, 1),
                                    r: [],
                                }) as ValidationAmpersandToken,
                            );
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
                    } else {
                        stack.push(
                            Object.assign(token, {
                                typ: makeBinaryOp.get(token!.typ),
                                l: trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                                r: [],
                            }),
                        );
                    }
                }

                break;

            case ValidationTokenEnum.Column:
                {
                    let index: number = stack.length == 0 ? -1 : tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                    if (stack.at(-1)?.typ === makeBinaryOp.get(token!.typ)) {
                        (stack.at(-1) as ValidationColumnToken).chi.push(
                            trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                        );

                        tokens.pop();
                    } else {
                        if (index != -1) {
                            stack.push(
                                Object.assign(token, {
                                    typ: makeBinaryOp.get(token!.typ),
                                    chi: [trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2))],
                                }),
                            );
                        } else {
                            stack.push(
                                Object.assign(token, {
                                    typ: makeBinaryOp.get(token!.typ),
                                    chi: [trimSyntaxArray(tokens.splice(0, tokens.length - 2))],
                                }),
                            );
                        }
                    }
                }

                break;

            case ValidationTokenEnum.OpenParenthesis:
                if (tokens.at(-2)?.typ == ValidationTokenEnum.Keyword) {
                    stack.push(
                        Object.assign(
                            tokens.at(-2) as ValidationToken,
                            {
                                typ: ValidationTokenEnum.Function,
                                chi: [] as ValidationToken[],
                            } as ValidationFunctionToken,
                        ),
                    );
                    tokens.pop();
                    break;
                }

                if (tokens.at(-2)?.typ == ValidationTokenEnum.PseudoClassToken) {
                    stack.push(
                        Object.assign(
                            tokens.at(-2) as ValidationToken,
                            {
                                typ: ValidationTokenEnum.PseudoClassFunctionToken,
                                chi: [] as ValidationToken[],
                            } as ValidationPseudoClassFunctionToken,
                        ),
                    );
                    tokens.pop();
                    break;
                }

                stack.push(token!);
                break;

            case ValidationTokenEnum.CloseParenthesis:
                if ((stack.at(-1) as ValidationToken)?.typ == ValidationTokenEnum.PipeToken) {
                    let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                    (stack.at(-1) as ValidationPipeToken).chi.push(
                        trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                    );
                    stack.pop();
                }

                if (
                    stack.at(-1)?.typ == ValidationTokenEnum.OpenParenthesis ||
                    ((stack.at(-1) as ValidationToken)?.typ == ValidationTokenEnum.PropertyType &&
                        (stack.at(-1) as ValidationPropertyToken).val === "function-token")
                ) {
                    stack.pop();
                }
                // else if ((stack.at(-1) as ValidationToken)?.typ === ValidationTokenEnum.PipeToken) {
                //     let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                //     (stack.at(-1) as ValidationPipeToken).chi.push(
                //         trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                //     );
                //     stack.pop();
                // }
                else if ((stack.at(-1) as ValidationToken)?.typ === ValidationTokenEnum.AmpersandToken) {
                    let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                    (stack.at(-1) as ValidationAmpersandToken).r = trimSyntaxArray(
                        tokens.splice(index + 1, tokens.length - index - 2),
                    );
                    stack.pop();
                }

                if (
                    (stack.at(-1) as ValidationToken)?.typ === ValidationTokenEnum.Function ||
                    (stack.at(-1) as ValidationToken)?.typ === ValidationTokenEnum.PseudoClassFunctionToken
                ) {
                    let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                    tokens.pop();

                    (stack.at(-1) as ValidationFunctionToken | ValidationPseudoClassFunctionToken).chi =
                        trimSyntaxArray(tokens.splice(index + 1, tokens.length));
                    stack.pop();
                }

                break;

            case ValidationTokenEnum.GreaterThan:
                if (tokens[tokens.length - 3]?.typ === ValidationTokenEnum.LessThan) {
                    if (tokens[tokens.length - 2]?.typ === ValidationTokenEnum.Keyword) {
                        Object.assign(tokens[tokens.length - 3], {
                            typ: ValidationTokenEnum.PropertyType,
                            val: (<ValidationKeywordToken>tokens[tokens.length - 2]).val,
                        });

                        if ("range" in tokens[tokens.length - 2]) {
                            tokens[tokens.length - 3].range = tokens[tokens.length - 2].range;
                        }

                        tokens.splice(tokens.length - 2, 2);

                        if ((tokens.at(-1) as ValidationPropertyToken).val == "function-token") {
                            // consume the closing ')'
                            stack.push(tokens.at(-1) as ValidationToken);
                        }
                    } else if (tokens[tokens.length - 2]?.typ === ValidationTokenEnum.StringToken) {
                        Object.assign(tokens[tokens.length - 3], {
                            typ: ValidationTokenEnum.DeclarationType,
                            val: (<ValidationKeywordToken>tokens[tokens.length - 2]).val.slice(1, -1),
                        });
                        tokens.splice(tokens.length - 2, 2);
                    } else if (tokens[tokens.length - 2]?.typ === ValidationTokenEnum.Function) {
                        Object.assign(tokens[tokens.length - 3], {
                            typ: ValidationTokenEnum.FunctionDefinition,
                            val: (<ValidationKeywordToken>tokens[tokens.length - 2]).val,
                        });
                        tokens.splice(tokens.length - 2, 2);
                    }
                }

                break;

            case ValidationTokenEnum.OpenBracket:
                stack.push(token!);
                break;

            case ValidationTokenEnum.CloseBracket:
                while (true) {
                    if ((stack.at(-1) as ValidationToken).typ == ValidationTokenEnum.AmpersandToken) {
                        let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                        (stack.at(-1) as ValidationAmpersandToken).r = trimSyntaxArray(
                            tokens.splice(index + 1, tokens.length - index - 2),
                        );
                        stack.pop();
                        continue;
                    } else if ((stack.at(-1) as ValidationToken).typ == ValidationTokenEnum.ColumnToken) {
                        let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                        (stack.at(-1) as ValidationColumnToken).chi.push(
                            trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                        );
                        stack.pop();
                        continue;
                    }

                    if ((stack.at(-1) as ValidationToken).typ == ValidationTokenEnum.PipeToken) {
                        let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                        (stack.at(-1) as ValidationPipeToken).chi.push(
                            trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                        );
                        stack.pop();
                        continue;
                    }

                    break;
                }

                currentToken = stack.at(-1) as ValidationToken;

                // if (currentToken?.typ !== ValidationTokenEnum.OpenBracket) {
                //     console.debug(JSON.stringify(tokens, null, 1));
                //     throw new SyntaxError(`Unexpected token: ']' at line ${token![LOC].lin}:${token![LOC].col} `);
                // }

                {
                    let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                    // the lower bound of a range may be '-∞': <integer [-∞,-1]>
                    const isNegativeInfinity: boolean =
                        tokens[index + 1]?.typ === ValidationTokenEnum.Keyword &&
                        (tokens[index + 1] as ValidationKeywordToken).val === "-" &&
                        tokens[index + 2]?.typ === ValidationTokenEnum.InfinityToken;

                    if (
                        isNegativeInfinity &&
                        (tokens[index - 2]?.typ === ValidationTokenEnum.Keyword ||
                            tokens[index - 2]?.typ === ValidationTokenEnum.StringToken) &&
                        tokens[index - 1]?.typ === ValidationTokenEnum.Whitespace &&
                        tokens[index + 3]?.typ === ValidationTokenEnum.Comma &&
                        (tokens[index + 4]?.typ === ValidationTokenEnum.Number ||
                            tokens[index + 4]?.typ === ValidationTokenEnum.Dimension ||
                            tokens[index + 4]?.typ === ValidationTokenEnum.InfinityToken) &&
                        tokens[index + 5]?.typ === ValidationTokenEnum.CloseBracket
                    ) {
                        stack.pop();

                        // a null bound is unbounded
                        Object.assign(tokens[index - 2], {
                            range: {
                                min: null,
                                max:
                                    tokens[index + 4]?.typ === ValidationTokenEnum.InfinityToken
                                        ? null
                                        : <ValidationNumberToken>tokens[index + 4],
                            },
                        });

                        tokens.splice(index - 1, 8);
                        break;
                    }

                    if (
                        (tokens[index - 2]?.typ === ValidationTokenEnum.Keyword ||
                            tokens[index - 2]?.typ === ValidationTokenEnum.StringToken) &&
                        tokens[index - 1]?.typ === ValidationTokenEnum.Whitespace &&
                        (tokens[index + 1]?.typ === ValidationTokenEnum.Number ||
                            tokens[index + 1]?.typ === ValidationTokenEnum.Dimension)
                    ) {
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

                        if (
                            tokens[index + 2]?.typ === ValidationTokenEnum.Comma &&
                            (tokens[index + 3]?.typ === tokens[index + 1]?.typ ||
                                tokens[index + 3]?.typ === ValidationTokenEnum.InfinityToken) &&
                            tokens[index + 4]?.typ === ValidationTokenEnum.CloseBracket
                        ) {
                            stack.pop();

                            Object.assign(tokens[index - 2], {
                                range: {
                                    min: <ValidationNumberToken>tokens[index + 1],
                                    max:
                                        tokens[index + 3]?.typ === tokens[index + 1]?.typ
                                            ? <ValidationNumberToken>tokens[index + 3]
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
                endIndex = tokens.indexOf(token!);

                Object.assign(currentToken, {
                    typ: ValidationTokenEnum.Bracket,
                    chi: trimSyntaxArray(tokens.slice(startIndex + 1, endIndex)),
                });

                tokens.splice(startIndex + 1, tokens.length);
                break;

            // {
            case ValidationTokenEnum.OpenCurlyBrace:
                stack.push(token!);
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

                    if ((stack.at(-1) as ValidationToken).typ == ValidationTokenEnum.ColumnToken) {
                        let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                        (stack.at(-1) as ValidationColumnToken).chi.push(
                            trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                        );
                        stack.pop();
                        continue;
                    }

                    if ((stack.at(-1) as ValidationToken)?.typ == ValidationTokenEnum.PipeToken) {
                        let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);

                        (stack.at(-1) as ValidationPipeToken).chi.push(
                            trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)),
                        );
                        stack.pop();
                        continue;
                    }

                    break;
                }

                // if (stack.at(-1)?.typ != ValidationTokenEnum.OpenCurlyBrace) {
                //     throw new SyntaxError(`Unexpected token } as ${token![LOC].lin}:${token![LOC].col}`);
                // }

                {
                    let index: number = tokens.lastIndexOf(stack.at(-1) as ValidationToken);
                    const slice = tokens.slice(index + 1, -1);

                    if (slice.length === 1 || slice.length === 3) {
                        if (slice[0].typ == ValidationTokenEnum.Number) {
                            Object.assign(tokens[index - 1], {
                                match: {
                                    min: slice[0] as ValidationNumberToken,
                                    max: slice[0] as ValidationNumberToken,
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
                                        min: slice[0] as ValidationNumberToken,
                                        max:
                                            slice[2].typ == ValidationTokenEnum.InfinityToken
                                                ? Number.POSITIVE_INFINITY
                                                : (slice[2] as ValidationNumberToken),
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
                (tokens.at(-1) as ValidationToken).isRepeatable = true;
                break;

            case ValidationTokenEnum.QuestionMark:
                tokens.pop();

                // if the previous token is a comma, we wrap them in a virtual group and mark the group as optional
                {
                    let sliceIndex: number = -1;
                    let isGroup: boolean; // = tokens.at(-2)?.typ == ValidationTokenEnum.Comma;

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
                        } as ValidationOptionalGroupToken);
                    } else {
                        (tokens.at(-1) as ValidationToken).isOptional = true;
                    }
                }
                break;

            case ValidationTokenEnum.Comma:
                {
                    let sliceIndex: number = -1;

                    // if (tokens.at(-2)?.isOptional && tokens.at(-2)!.typ !== ValidationTokenEnum.OptionalGroupToken) {
                    //     sliceIndex = tokens.length - 2;
                    // } else

                    if (
                        tokens.at(-2)!.typ == ValidationTokenEnum.Whitespace &&
                        tokens.at(-3)?.isOptional &&
                        tokens.at(-3)!.typ !== ValidationTokenEnum.OptionalGroupToken
                    ) {
                        sliceIndex = tokens.length - 3;
                    }

                    if (sliceIndex != -1) {
                        if (tokens[sliceIndex].isList) {
                            tokens.pop();
                        }

                        tokens.splice(sliceIndex, tokens.length - sliceIndex, {
                            typ: ValidationTokenEnum.OptionalGroupToken,
                            chi: trimSyntaxArray(
                                tokens.slice(sliceIndex).map((t) => {
                                    delete t.isOptional;
                                    return t;
                                }),
                            ),
                            isOptional: true,
                        } as ValidationOptionalGroupToken);
                    }
                }

                break;

            case ValidationTokenEnum.HashMark:
                tokens.pop();
                (tokens.at(-1) as ValidationToken).isList = true;
                break;

            case ValidationTokenEnum.Exclamation:
                tokens.pop();
                (tokens.at(-1) as ValidationToken).isMandatatoryGroup = true;
                break;

            case ValidationTokenEnum.Plus:
                tokens.pop();
                (tokens.at(-1) as ValidationToken).isRepeatableAtLeastOnce = true;
                break;
        }
    }

    if (stack.length > 0) {
        if (stack.at(-1)?.typ == ValidationTokenEnum.PipeToken) {
            let index = tokens.lastIndexOf(stack.at(-1) as ValidationToken);
            (stack.at(-1) as ValidationPipeToken).chi.push(
                trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 1)),
            );

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

export function renderSyntax(
    token: ValidationToken,
    options: { minify?: boolean; indent?: number } = { minify: true, indent: 1 },
): string {
    options.indent ??= 1;
    let glue: string = options.minify ? "" : " ".repeat(options.indent);

    switch (token.typ) {
        case ValidationTokenEnum.InfinityToken:
            // '∞'
            return "\u221e";

        case ValidationTokenEnum.Root:
            return (token as ValidationRootToken).chi.reduce(
                (acc: string, curr: ValidationToken) => acc + renderSyntax(curr, options),
                "",
            );

        case ValidationTokenEnum.Whitespace:
            return " ";

        case ValidationTokenEnum.FunctionDefinition:
            return "<" + (token as ValidationFunctionDefinitionToken).val + "()>";

        case ValidationTokenEnum.HashMark:
            return "#";

        case ValidationTokenEnum.Colon:
            return ":";

        case ValidationTokenEnum.Pipe:
            return `${glue}|${glue}`;

        case ValidationTokenEnum.Column:
            return `${glue}||${glue}`;

        case ValidationTokenEnum.PipeToken:
            return (token as ValidationPipeToken).chi.reduce(
                (acc: string, curr: ValidationToken[]) =>
                    acc +
                    (acc.trim().length > 0 ? `${glue}|${glue}` : "") +
                    curr.reduce((acc, curr) => acc + renderSyntax(curr, options), ""),
                "",
            );

        case ValidationTokenEnum.ColumnToken:
            glue = `${glue}||${glue}`;
            return (token as ValidationColumnToken).chi.reduce(
                (acc: string, curr: ValidationToken[]) =>
                    acc +
                    (acc.length > 0 ? glue : "") +
                    curr.reduce((acc: string, curr: ValidationToken) => acc + renderSyntax(curr, options), ""),
                "",
            );

        case ValidationTokenEnum.AmpersandToken:
            glue = `${glue}&&${glue}`;

            return (
                (token as ValidationAmpersandToken).l.reduce(
                    (acc: string, curr: ValidationToken) => acc + renderSyntax(curr, options),
                    "",
                ) +
                glue +
                (token as ValidationAmpersandToken).r.reduce(
                    (acc: string, curr: ValidationToken) => acc + renderSyntax(curr, options),
                    "",
                )
            );

        case ValidationTokenEnum.Function:
        case ValidationTokenEnum.PseudoClassFunctionToken:
        case ValidationTokenEnum.Parens:
            return (
                (token as ValidationFunctionToken).val +
                "(" +
                (token as ValidationFunctionToken).chi.reduce(
                    (acc: string, curr: ValidationToken) => acc + renderSyntax(curr, options),
                    "",
                ) +
                ")" +
                renderAttributes(token)
            );

        case ValidationTokenEnum.Comma:
            return `,${glue}`;

        case ValidationTokenEnum.Keyword:
            return (token as ValidationKeywordToken).val + renderAttributes(token);

        case ValidationTokenEnum.OpenBracket:
            return `[${glue}`;

        case ValidationTokenEnum.Ampersand:
            return `${glue}&&${glue}`;

        case ValidationTokenEnum.Plus:
            return "+";

        case ValidationTokenEnum.QuestionMark:
            return "?";

        case ValidationTokenEnum.Separator:
            return "/";

        case ValidationTokenEnum.Bracket:
            return (
                `[${glue}` +
                (token as ValidationBracketToken).chi.reduce(
                    (acc: string, curr: ValidationToken) => acc + renderSyntax(curr, options),
                    "",
                ) +
                `${glue}]` +
                renderAttributes(token)
            );

        case ValidationTokenEnum.PropertyType:
        case ValidationTokenEnum.DeclarationType: {
            const q =
                (token as ValidationPropertyToken | ValidationDeclarationToken).typ ===
                ValidationTokenEnum.DeclarationType
                    ? "'"
                    : "";
            return (
                "<" +
                q +
                (token as ValidationPropertyToken).val +
                q +
                ((token as ValidationPropertyToken).range == null
                    ? ""
                    : ` [${
                          (token as ValidationPropertyToken)?.range?.min == null
                              ? "-\u221e"
                              : renderSyntax((token as ValidationPropertyToken)?.range!.min as ValidationToken)
                      },${
                          (token as ValidationPropertyToken)?.range?.max == null
                              ? "\u221e"
                              : renderSyntax((token as ValidationPropertyToken)?.range!.max as ValidationToken)
                      }]`) +
                ">" +
                renderAttributes(token)
            );
        }

        case ValidationTokenEnum.Number:
        case ValidationTokenEnum.PseudoClassToken:
        case ValidationTokenEnum.StringToken:
            return (token as ValidationNumberToken).val + "";

        case ValidationTokenEnum.SemiColon:
            return ";";

        case ValidationTokenEnum.AtRule:
            return "@" + (token as ValidationAtRuleToken).val;

        case ValidationTokenEnum.AtRuleDefinition:
            return (
                "@" +
                (token as ValidationAtRuleDefinitionToken).val +
                ((token as ValidationAtRuleDefinitionToken).prelude == null
                    ? ""
                    : " " +
                      ((token as ValidationAtRuleDefinitionToken).prelude as ValidationToken[]).reduce(
                          (acc: string, curr: ValidationToken) => acc + renderSyntax(curr, options),
                          "",
                      )) +
                ((token as ValidationAtRuleDefinitionToken).chi == null
                    ? ""
                    : " {\n" +
                      ((token as ValidationAtRuleDefinitionToken).chi as ValidationToken[]).reduce(
                          (acc: string, curr: ValidationToken) => acc + renderSyntax(curr, options),
                          "",
                      )
                ).slice(1, -1) +
                "\n}"
            );

        case ValidationTokenEnum.Block:
            return (
                `{${options.minify ? "" : "\n"}` +
                (token as ValidationBlockToken).chi.reduce(
                    (acc: string, t: ValidationToken): string => acc + renderSyntax(t, options),
                    "",
                ) +
                `${options.minify ? "" : "\n"}}`
            );

        case ValidationTokenEnum.DeclarationDefinitionToken:
            return (
                (token as ValidationDeclarationDefinitionToken).nam +
                ": " +
                renderSyntax((token as ValidationDeclarationDefinitionToken).val, options)
            );

        case ValidationTokenEnum.LessThan:
            return "<";

        case ValidationTokenEnum.GreaterThan:
            return ">";

        case ValidationTokenEnum.CloseParenthesis:
            return ")";

        case ValidationTokenEnum.OpenParenthesis:
            return "(";

        case ValidationTokenEnum.DisallowWhitespace:
            return "† ";

        case ValidationTokenEnum.Dimension:
            return (token as ValidationDimensionToken).val + (token as ValidationDimensionToken).unitText;

        case ValidationTokenEnum.OpenCurlyBrace:
            options.indent++;
            return `{${options.minify ? "" : "\n"}}`;

        case ValidationTokenEnum.CloseCurlyBrace:
            options.indent--;
            return `${options.minify ? "" : "\n"}}`;

        case ValidationTokenEnum.DeclarationNameToken:
            return (token as ValidationDeclarationNameToken).val + ":";

        case ValidationTokenEnum.OptionalGroupToken:
            return (token as ValidationOptionalGroupToken).chi.reduce(
                (acc: string, curr: ValidationToken, index: number, array: ValidationToken[]) =>
                    acc +
                    (index == array.length - 1
                        ? curr.typ === ValidationTokenEnum.Comma
                            ? "?,"
                            : renderSyntax(curr, options) + "?"
                        : renderSyntax(curr, options)),
                "",
            );

        default:
            throw new Error("Unhandled token: " + JSON.stringify({ token }, null, 1));
    }
}

function renderAttributes(token: ValidationToken): string {
    let result: string = "";

    if (token.isList) {
        result += "#";
    }

    if (token.isOptional) {
        result += "?";
    }

    if (token.isMandatatoryGroup) {
        result += "!";
    }

    if (token.isRepeatable) {
        result += "*";
    }

    if (token.isRepeatableAtLeastOnce) {
        result += "+";
    }

    if (token.match != null) {
        if (
            token.match.max == null ||
            token.match.max.val === token.match.min.val ||
            Number.isNaN(token.match.max.val)
        ) {
            result += "{" + renderSyntax(token.match.min) + "}";
        } else {
            result +=
                "{" +
                renderSyntax(token.match.min) +
                "," +
                (Number.isFinite(token.match.max.val) ? renderSyntax(token.match.max) : "\u221e") +
                "}";
        }
    }

    return result;
}
