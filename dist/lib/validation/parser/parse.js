import { EnumToken } from '../../ast/types.js';
import { isIdentStart, isIdent, parseDimension, isPseudo } from '../../syntax/syntax.js';
import { ValidationTokenEnum } from './typedef.js';

const objectProperties = {
    enumerable: false,
    writable: true,
    configurable: true,
};
const SymbolsMapTokens = {
    "&&": ValidationTokenEnum.Ampersand,
    "|": ValidationTokenEnum.Pipe,
    "† ": ValidationTokenEnum.DisallowWhitespace,
    "||": ValidationTokenEnum.Column,
    "*": ValidationTokenEnum.Star,
    ",": ValidationTokenEnum.Comma,
    "/": ValidationTokenEnum.Separator,
    "+": ValidationTokenEnum.Plus,
    ":": ValidationTokenEnum.Colon,
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
function move(position, chr) {
    for (const c of chr) {
        position.col++;
        position.ind += c.length;
    }
    return position;
}
function getTokenType(token, position, currentPosition) {
    const pos = { ...position };
    Object.assign(position, currentPosition);
    if (token === "<an+b>") {
        return Object.defineProperty({
            typ: ValidationTokenEnum.PropertyType,
            val: token.slice(1, -1),
        }, "pos", { ...objectProperties, value: pos });
    }
    if (token.charAt(0) == '"' || token.charAt(0) == "'") {
        return Object.defineProperty({
            typ: ValidationTokenEnum.StringToken,
            val: token,
        }, "pos", { ...objectProperties, value: pos });
    }
    if (token.match(/^\d+$/)) {
        return Object.defineProperty({
            typ: ValidationTokenEnum.Number,
            val: Number(token),
        }, "pos", { ...objectProperties, value: pos });
    }
    let dimension = parseDimension(token);
    if (dimension) {
        // @ts-expect-error
        return Object.defineProperty({
            typ: ValidationTokenEnum.Dimension,
            unit: EnumToken[dimension.typ],
            val: dimension.val,
            unitText: dimension.unit,
        }, "pos", { ...objectProperties, value: pos });
    }
    if (isPseudo(token)) {
        return Object.defineProperty({
            typ: ValidationTokenEnum.PseudoClassToken,
            val: token,
        }, "pos", { ...objectProperties, value: pos });
    }
    if (token.startsWith("@") && isIdent(token.slice(1))) {
        return Object.defineProperty({
            typ: ValidationTokenEnum.AtRule,
            val: token.slice(1),
        }, "pos", { ...objectProperties, value: pos });
    }
    return Object.defineProperty({
        typ: ValidationTokenEnum.Keyword,
        val: token,
    }, "pos", { ...objectProperties, value: pos });
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
function* tokenizeSyntax(syntax, position = {
    ind: 0,
    lin: 1,
    col: 0,
}, currentPosition = {
    ind: -1,
    lin: 1,
    col: 0,
}) {
    let i = -1;
    let buffer = "";
    let pos;
    while (++i < syntax.length) {
        let chr = syntax.charAt(i);
        move(currentPosition, chr);
        if (chr === "<" && "an+b>" === syntax.slice(i + 1, i + 6)) {
            if (buffer.length > 0) {
                yield getTokenType(buffer, position, currentPosition);
                buffer = "";
            }
            yield getTokenType("<an+b>", position, currentPosition);
            move(currentPosition, "an+b>");
            i += 5;
            continue;
        }
        if (chr + syntax.charAt(i + 1) in SymbolsMapTokens) {
            chr += syntax.charAt(++i);
            move(currentPosition, syntax.charAt(i));
            pos = { ...position };
            Object.assign(position, currentPosition);
            if (buffer.length > 0) {
                yield getTokenType(buffer, position, currentPosition);
                buffer = "";
            }
            yield Object.defineProperty({
                typ: SymbolsMapTokens[chr],
            }, "pos", { ...objectProperties, value: pos });
            continue;
        }
        if (chr === ':' && (isIdentStart(syntax.charCodeAt(i + 1)) || (syntax.charAt(i + 1) === '-') && isIdentStart(syntax.charCodeAt(i + 2)))) {
            buffer += chr;
            continue;
        }
        if (chr in SymbolsMapTokens) {
            if (SymbolsMapTokens[chr] === ValidationTokenEnum.Whitespace) {
                let ch;
                let k = i;
                while ((ch = syntax.charAt(k + 1)) &&
                    ch in SymbolsMapTokens &&
                    SymbolsMapTokens[ch] === ValidationTokenEnum.Whitespace) {
                    k++;
                }
                if (k != i) {
                    move(currentPosition, syntax.slice(i + 1, k + 1));
                    i = k;
                }
            }
            pos = { ...position };
            Object.assign(position, currentPosition);
            if (buffer.length > 0) {
                yield getTokenType(buffer, position, currentPosition);
                buffer = "";
            }
            yield Object.defineProperty({
                typ: SymbolsMapTokens[chr],
            }, "pos", { ...objectProperties, value: pos });
            continue;
        }
        switch (chr) {
            case "\\":
                if (buffer.length > 0) {
                    yield getTokenType(buffer, position, currentPosition);
                    buffer = "";
                }
                buffer += chr;
                chr = syntax.charAt(++i);
                buffer += chr;
                move(currentPosition, chr);
                break;
            case ":":
                if (isIdent(buffer)) {
                    yield Object.defineProperty({
                        typ: ValidationTokenEnum.DeclarationNameToken,
                        val: buffer,
                    }, "pos", { ...objectProperties, value: { ...position } });
                    buffer = "";
                    move(currentPosition, chr);
                    break;
                }
                buffer += chr;
                break;
            case '"':
            case "'":
                if (buffer.length > 0) {
                    yield getTokenType(buffer, position, currentPosition);
                    buffer = "";
                }
                buffer += chr;
                while (i + 1 < syntax.length) {
                    chr = syntax.charAt(++i);
                    buffer += chr;
                    if (chr == "\\") {
                        chr = syntax.charAt(++i);
                        buffer += chr;
                        // move(currentPosition, chr);
                        continue;
                    }
                    if (chr == buffer.charAt(0)) {
                        break;
                    }
                }
                yield getTokenType(buffer, position, currentPosition);
                move(currentPosition, buffer);
                buffer = "";
                break;
            default:
                buffer += chr;
                break;
        }
    }
    if (buffer.length > 0) {
        yield getTokenType(buffer, position, currentPosition);
    }
    yield Object.defineProperty({
        typ: ValidationTokenEnum.EOF,
    }, "pos", { ...objectProperties, value: { ...position } });
}
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
                        else {
                            stack.at(-1).r = trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2));
                            stack.pop();
                            stack.push(Object.assign(token, {
                                typ: makeBinaryOp.get(token.typ),
                                l: tokens.splice(index, 1),
                                r: [],
                            }));
                        }
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
                        // stack.pop();
                        // stack.push(Object.assign(token, {
                        //     typ: makeBinaryOp.get(token!.typ),
                        //     l: tokens.splice(index, 1),
                        //     r: []
                        // }) as ValidationColumnToken | ValidationAmpersandToken);
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
                else if (stack.at(-1).typ === ValidationTokenEnum.PipeToken) {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                    stack.pop();
                }
                else if (stack.at(-1).typ === ValidationTokenEnum.AmpersandToken) {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    stack.at(-1).r = trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2));
                    stack.pop();
                }
                // else if (stack.at(-1)?.typ === ValidationTokenEnum.OpenParenthesis) {
                //     let currentToken = stack.at(-1);
                //     let index: number = tokens.lastIndexOf(currentToken!);
                //     if (tokens[index - 1]?.typ === ValidationTokenEnum.Keyword) {
                //         Object.assign(tokens[index - 1], {
                //             typ: ValidationTokenEnum.Function,
                //             val: (<ValidationKeywordToken>tokens[index - 1]).val,
                //             chi: tokens.slice(index + 1, tokens.length - 1)
                //         });
                //         tokens.splice(index, tokens.length - index);
                //         stack.pop();
                //     }
                // }
                if (stack.at(-1)?.typ === ValidationTokenEnum.Function ||
                    stack.at(-1)?.typ === ValidationTokenEnum.PseudoClassFunctionToken) {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    tokens.pop();
                    stack.at(-1).chi =
                        trimSyntaxArray(tokens.splice(index + 1, tokens.length));
                    stack.pop();
                    // break;
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
                if (currentToken?.typ !== ValidationTokenEnum.OpenBracket) {
                    console.debug(JSON.stringify(tokens, null, 1));
                    throw new SyntaxError(`Unexpected token: ']' at line ${token.pos.lin}:${token.pos.col} `);
                }
                {
                    let index = tokens.lastIndexOf(stack.at(-1));
                    // "fit-content( <length-percentage [0,∞]> )"
                    if ((tokens[index - 2]?.typ === ValidationTokenEnum.Keyword ||
                        tokens[index - 2]?.typ === ValidationTokenEnum.StringToken) &&
                        tokens[index - 1]?.typ === ValidationTokenEnum.Whitespace &&
                        (tokens[index + 1]?.typ === ValidationTokenEnum.Number ||
                            tokens[index + 1]?.typ === ValidationTokenEnum.Dimension)) {
                        if (tokens[index + 2]?.typ === ValidationTokenEnum.CloseBracket) {
                            stack.pop();
                            Object.assign(tokens[index - 2], {
                                range: {
                                    min: tokens[index + 1],
                                    max: tokens[index + 1],
                                },
                            });
                            tokens.splice(index - 1, 5);
                            break;
                        }
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
                    if (stack.at(-1)?.typ == ValidationTokenEnum.PipeToken) {
                        let index = tokens.lastIndexOf(stack.at(-1));
                        stack.at(-1).chi.push(trimSyntaxArray(tokens.splice(index + 1, tokens.length - index - 2)));
                        stack.pop();
                        continue;
                    }
                    break;
                }
                if (stack.at(-1)?.typ != ValidationTokenEnum.OpenCurlyBrace) {
                    throw new SyntaxError(`Unexpected token } as ${token.pos.lin}:${token.pos.col}`);
                }
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
                                if (slice[1].typ != ValidationTokenEnum.Comma) {
                                    throw new SyntaxError(`Expecting ',' at ${slice[1].pos.lin}:${slice[1].pos.col}`);
                                }
                                if (slice[2].typ != ValidationTokenEnum.Number &&
                                    slice[2].typ != ValidationTokenEnum.InfinityToken) {
                                    throw new SyntaxError(`Expecting number or infinity at ${slice[2].pos.lin}:${slice[2].pos.col}`);
                                }
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
                    let isGroup = tokens.at(-2)?.typ == ValidationTokenEnum.Comma;
                    if (isGroup) {
                        sliceIndex = tokens.length - 2;
                    }
                    else {
                        isGroup = tokens.at(-3)?.typ == ValidationTokenEnum.Comma;
                        if (isGroup) {
                            sliceIndex = tokens.length - 3;
                        }
                    }
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
                    if (tokens.at(-2)?.isOptional && tokens.at(-2).typ !== ValidationTokenEnum.OptionalGroupToken) {
                        sliceIndex = tokens.length - 2;
                    }
                    else if (tokens.at(-2).typ == ValidationTokenEnum.Whitespace &&
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
    // console.debug(JSON.stringify({tokens}, null, 1));
    if (stack.length > 0) {
        throw new SyntaxError(`Unexpected token ${ValidationTokenEnum[stack.at(-1)?.typ]} at ${stack.at(-1)?.pos.lin}:${stack.at(-1)?.pos.col}`);
    }
    return trimSyntaxArray(tokens);
}
function renderSyntax(token, options = { minify: true, indent: 1 }) {
    options.indent ??= 1;
    let glue = options.minify ? "" : " ".repeat(options.indent);
    switch (token.typ) {
        case ValidationTokenEnum.InfinityToken:
            // '∞'
            return "\u221e";
        case ValidationTokenEnum.Root:
            return token.chi.reduce((acc, curr) => acc + renderSyntax(curr, options), "");
        case ValidationTokenEnum.Whitespace:
            return " ";
        case ValidationTokenEnum.FunctionDefinition:
            return "<" + token.val + "()>";
        case ValidationTokenEnum.HashMark:
            return "#";
        case ValidationTokenEnum.Colon:
            return ":";
        case ValidationTokenEnum.Pipe:
            return `${glue}|${glue}`;
        case ValidationTokenEnum.Column:
            return `${glue}||${glue}`;
        case ValidationTokenEnum.PipeToken:
            return token.chi.reduce((acc, curr) => acc +
                (acc.trim().length > 0 ? `${glue}|${glue}` : "") +
                curr.reduce((acc, curr) => acc + renderSyntax(curr, options), ""), "");
        case ValidationTokenEnum.ColumnToken:
            glue = `${glue}||${glue}`;
            return token.chi.reduce((acc, curr) => acc +
                (acc.length > 0 ? glue : "") +
                curr.reduce((acc, curr) => acc + renderSyntax(curr, options), ""), "");
        case ValidationTokenEnum.AmpersandToken:
            glue = `${glue}&&${glue}`;
            return (token.l.reduce((acc, curr) => acc + renderSyntax(curr, options), "") +
                glue +
                token.r.reduce((acc, curr) => acc + renderSyntax(curr, options), ""));
        case ValidationTokenEnum.Function:
        case ValidationTokenEnum.PseudoClassFunctionToken:
        case ValidationTokenEnum.Parens:
            return (token.val +
                "(" +
                token.chi.reduce((acc, curr) => acc + renderSyntax(curr, options), "") +
                ")" +
                renderAttributes(token));
        case ValidationTokenEnum.Comma:
            return `,${glue}`;
        case ValidationTokenEnum.Keyword:
            return token.val + renderAttributes(token);
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
            return (`[${glue}` +
                token.chi.reduce((acc, curr) => acc + renderSyntax(curr, options), "") +
                `${glue}]` +
                renderAttributes(token));
        case ValidationTokenEnum.PropertyType:
        case ValidationTokenEnum.DeclarationType:
            {
                const q = token.typ === ValidationTokenEnum.DeclarationType ? "'" : '';
                return ("<" + q +
                    token.val + q +
                    (token.range == null
                        ? ""
                        : ` [${renderSyntax(token?.range.min)},${token?.range?.max == null
                            ? "\u221e"
                            : renderSyntax(token?.range.max)}]`) +
                    ">" +
                    renderAttributes(token));
            }
        case ValidationTokenEnum.Number:
        case ValidationTokenEnum.PseudoClassToken:
        case ValidationTokenEnum.StringToken:
            return token.val + "";
        case ValidationTokenEnum.SemiColon:
            return ";";
        case ValidationTokenEnum.AtRule:
            return "@" + token.val;
        case ValidationTokenEnum.AtRuleDefinition:
            return ("@" +
                token.val +
                (token.prelude == null
                    ? ""
                    : " " +
                        token.prelude.reduce((acc, curr) => acc + renderSyntax(curr, options), "")) +
                (token.chi == null
                    ? ""
                    : " {\n" +
                        token.chi.reduce((acc, curr) => acc + renderSyntax(curr, options), "")).slice(1, -1) +
                "\n}");
        case ValidationTokenEnum.Block:
            return (`{${options.minify ? "" : "\n"}` +
                token.chi.reduce((acc, t) => acc + renderSyntax(t, options), "") +
                `${options.minify ? "" : "\n"}}`);
        case ValidationTokenEnum.DeclarationDefinitionToken:
            return (token.nam +
                ": " +
                renderSyntax(token.val, options));
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
            return token.val + token.unitText;
        case ValidationTokenEnum.OpenCurlyBrace:
            options.indent++;
            return `{${options.minify ? "" : "\n"}}`;
        case ValidationTokenEnum.CloseCurlyBrace:
            options.indent--;
            return `${options.minify ? "" : "\n"}}`;
        case ValidationTokenEnum.DeclarationNameToken:
            return token.val + ":";
        case ValidationTokenEnum.OptionalGroupToken:
            return token.chi.reduce((acc, curr, index) => acc + renderSyntax(curr, options) + (index === 0 && curr.isList ? "," : ""), ""); // + renderAttributes(token);
        default:
            throw new Error("Unhandled token: " + JSON.stringify({ token }, null, 1));
    }
}
function renderAttributes(token) {
    let result = "";
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
        if (token.match.max == null || token.match.max.val === token.match.min.val || Number.isNaN(token.match.max.val)) {
            result += "{" + renderSyntax(token.match.min) + "}";
        }
        else {
            result +=
                "{" + renderSyntax(token.match.min) + "," + (Number.isFinite(token.match.max.val) ? renderSyntax(token.match.max) : "\u221e") + "}";
        }
    }
    return result;
}

export { parseSyntax, renderSyntax, tokenizeSyntax, trimSyntaxArray };
