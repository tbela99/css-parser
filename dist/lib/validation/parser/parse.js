import { ValidationTokenEnum } from './types.js';
import { isIdent, isPseudo } from '../../syntax/syntax.js';
import { getTokenType as getTokenType$1 } from '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { EnumToken } from '../../ast/types.js';
import '../../ast/minify.js';
import '../../ast/walk.js';
import '../../renderer/color/utils/constants.js';
import '../../renderer/sourcemap/lib/encode.js';

const skipped = [
    ValidationTokenEnum.Star,
    ValidationTokenEnum.HashMark,
    ValidationTokenEnum.AtLeastOnce,
    ValidationTokenEnum.Exclamation,
    ValidationTokenEnum.QuestionMark,
    ValidationTokenEnum.OpenCurlyBrace
];
const objectProperties = {
    enumerable: false,
    writable: true,
    configurable: true
};
function* tokenize(syntax, position = { ind: 0, lin: 1, col: 0 }, currentPosition = {
    ind: -1,
    lin: 1,
    col: 0
}) {
    let i = -1;
    let buffer = '';
    while (++i < syntax.length) {
        let chr = syntax.charAt(i);
        move(currentPosition, chr);
        switch (chr) {
            case '∞':
                if (buffer.length > 0) {
                    yield getTokenType(buffer, position, currentPosition);
                }
                yield getTokenType(chr, position, currentPosition);
                buffer = '';
                break;
            case '\\':
                if (buffer.length > 0) {
                    yield getTokenType(buffer, position, currentPosition);
                    buffer = '';
                }
                buffer += chr;
                chr = syntax.charAt(++i);
                buffer += chr;
                move(currentPosition, chr);
                break;
            case ';':
                if (buffer.length > 0) {
                    yield getTokenType(buffer, position, currentPosition);
                    buffer = '';
                }
                yield getTokenType(chr, position, currentPosition);
                buffer = '';
                break;
            case ':':
                if (isIdent(buffer)) {
                    yield Object.defineProperty({
                        typ: ValidationTokenEnum.DeclarationNameToken,
                        val: buffer
                    }, 'pos', { ...objectProperties, value: { ...position } });
                    buffer = '';
                    move(currentPosition, chr);
                    break;
                }
                buffer += chr;
                break;
            case '"':
            case "'":
                if (buffer.length > 0) {
                    yield getTokenType(buffer, position, currentPosition);
                    buffer = '';
                }
                buffer += chr;
                while (i + 1 < syntax.length) {
                    chr = syntax.charAt(++i);
                    buffer += chr;
                    move(currentPosition, chr);
                    if (chr == '\\') {
                        chr = syntax.charAt(++i);
                        buffer += chr;
                        move(currentPosition, chr);
                        continue;
                    }
                    if (chr == buffer.charAt(0)) {
                        break;
                    }
                }
                // check for type "<property>" or "<'property'>"
                if (buffer.at(1) == '<' && buffer.at(-2) == '>') {
                    yield Object.defineProperty({
                        typ: ValidationTokenEnum.Character,
                        val: chr
                    }, 'pos', { ...objectProperties, value: { ...position } });
                    position = { ...currentPosition };
                    move(currentPosition, chr);
                    buffer = buffer.slice(1, -1);
                    yield* tokenize(buffer, position, currentPosition);
                    yield Object.defineProperty({
                        typ: ValidationTokenEnum.Character,
                        val: chr
                    }, 'pos', { ...objectProperties, value: { ...position } });
                    position = { ...currentPosition };
                    move(currentPosition, chr);
                    buffer = '';
                    break;
                }
                yield getTokenType(buffer, position, currentPosition);
                buffer = '';
                break;
            case '<':
                buffer += chr;
                while (i + 1 < syntax.length) {
                    chr = syntax.charAt(++i);
                    buffer += chr;
                    move(currentPosition, chr);
                    if (chr == '>') {
                        break;
                    }
                }
                yield getTokenType(buffer, position, currentPosition);
                buffer = '';
                break;
            case ' ':
            case '\t':
            case '\n':
            case '\r':
            case '\f':
            case '|':
            case '#':
            case '+':
            case ',':
            case '[':
            case ']':
            case '(':
            case ')':
            case '*':
            case '{':
            case '}':
            case '?':
            case '!':
            case '&':
                if (buffer.length > 0) {
                    yield getTokenType(buffer, position, currentPosition);
                }
                if (chr == '|' || chr == '&') {
                    if (syntax.charAt(i + 1) == chr) {
                        move(currentPosition, chr);
                        yield getTokenType(chr + chr, position, currentPosition);
                        i++;
                        buffer = '';
                        continue;
                    }
                }
                Object.assign(position, currentPosition);
                yield getTokenType(chr, position, currentPosition);
                buffer = '';
                break;
            default:
                buffer += chr;
                break;
        }
    }
    if (buffer.length > 0) {
        yield getTokenType(buffer, position, currentPosition);
    }
}
function parseSyntax(syntax) {
    const root = Object.defineProperty({
        typ: ValidationTokenEnum.Root,
        chi: []
    }, 'pos', { ...objectProperties, value: { ind: 0, lin: 1, col: 0 } });
    // return minify(doParseSyntax(syntaxes, tokenize(syntaxes), root)) as ValidationRootToken;
    return minify(doParseSyntax(syntax, tokenize(syntax), root));
}
function matchParens(syntax, iterator) {
    let item;
    let func = null;
    let items = [];
    let match = 0;
    while ((item = iterator.next()) && !item.done) {
        switch (item.value.typ) {
            case ValidationTokenEnum.OpenParenthesis:
                if (match > 0) {
                    func.chi.push(item.value);
                }
                else if (match == 0) {
                    func = items.at(-1);
                    if (func == null || func.val == null || func.val === '') {
                        func = Object.defineProperty({
                            typ: ValidationTokenEnum.Parens,
                            val: '',
                            chi: []
                        }, 'pos', { ...objectProperties, value: item.value.pos });
                        items.push(func);
                    }
                    else {
                        // @ts-ignore
                        func.typ = func.typ == ValidationTokenEnum.PseudoClassToken ? ValidationTokenEnum.PseudoClassFunctionToken : ValidationTokenEnum.Function;
                        func.chi = [];
                    }
                }
                match++;
                break;
            case ValidationTokenEnum.CloseParenthesis:
                match--;
                if (match > 0) {
                    func.chi.push(item.value);
                }
                break;
            default:
                if (match > 0) {
                    func.chi.push(item.value);
                }
                else {
                    items.push(item.value);
                }
                break;
        }
    }
    for (const item of items) {
        if ('chi' in item) {
            // @ts-ignore
            item.chi = matchParens(syntax, item.chi[Symbol.iterator]());
        }
    }
    return items;
}
function matchBrackets(syntax, iterator) {
    let item;
    let bracket = null;
    let items = [];
    let match = 0;
    while ((item = iterator.next()) && !item.done) {
        switch (item.value.typ) {
            case ValidationTokenEnum.OpenBracket:
                if (match > 0) {
                    bracket.chi.push(item.value);
                }
                else if (match == 0) {
                    bracket = Object.defineProperty({
                        typ: ValidationTokenEnum.Bracket,
                        chi: []
                    }, 'pos', { ...objectProperties, value: item.value.pos });
                    items.push(bracket);
                }
                match++;
                break;
            case ValidationTokenEnum.CloseBracket:
                match--;
                if (match > 0) {
                    bracket.chi.push(item.value);
                }
                break;
            default:
                if (match > 0) {
                    bracket.chi.push(item.value);
                }
                else {
                    items.push(item.value);
                }
                break;
        }
    }
    for (const item of items) {
        if ('chi' in item) {
            // @ts-ignore
            item.chi = matchBrackets(syntax, item.chi[Symbol.iterator]());
        }
    }
    return items;
}
function matchCurlBraces(syntax, iterator) {
    let item;
    let block = null;
    let items = [];
    let match = 0;
    while ((item = iterator.next()) && !item.done) {
        switch (item.value.typ) {
            case ValidationTokenEnum.OpenCurlyBrace:
                if (match > 0) {
                    block.chi.push(item.value);
                }
                else if (match == 0) {
                    block = Object.defineProperty({
                        typ: ValidationTokenEnum.Block,
                        chi: []
                    }, 'pos', { ...objectProperties, value: item.value.pos });
                    items.push(block);
                }
                match++;
                break;
            case ValidationTokenEnum.CloseCurlyBrace:
                match--;
                if (match > 0) {
                    block.chi.push(item.value);
                }
                break;
            default:
                if (match > 0) {
                    block.chi.push(item.value);
                }
                else {
                    items.push(item.value);
                }
                if ('chi' in item.value) {
                    // @ts-ignore
                    item.value.chi = matchCurlBraces(syntax, item.value.chi[Symbol.iterator]());
                }
                break;
        }
    }
    let it;
    let i = 0;
    for (; i < items.length; i++) {
        it = items[i];
        if (i > 0 && it.typ == ValidationTokenEnum.Block && it.chi[0]?.typ == ValidationTokenEnum.Number) {
            items[i - 1].occurence = {
                min: +it.chi[0].val,
                max: it.chi[2]?.typ == ValidationTokenEnum.InfinityToken ? Number.POSITIVE_INFINITY : +(it.chi[2] ?? it.chi[0]).val
            };
            items.splice(i--, 1);
            continue;
        }
        if ('chi' in it) {
            // @ts-ignore
            it.chi = matchBrackets(syntax, it.chi[Symbol.iterator]());
        }
    }
    return items;
}
function matchAtRule(syntax, iterator) {
    const children = [];
    let item;
    let token = null;
    while ((item = iterator.next()) && !item.done) {
        if (item.value.typ == ValidationTokenEnum.AtRule || item.value.typ == ValidationTokenEnum.AtRuleDefinition) {
            token = Object.defineProperty({
                ...item.value,
                typ: ValidationTokenEnum.AtRuleDefinition
            }, 'pos', { ...objectProperties, value: item.value.pos });
            children.push(token);
            item = iterator.next();
            if (item.done) {
                // @ts-ignore
                token.typ = ValidationTokenEnum.AtRule;
                break;
            }
            if (item.value.typ != ValidationTokenEnum.Whitespace) {
                console.error('unexpected token', item.value);
            }
            item = iterator.next();
            if (item.done) {
                break;
            }
            if (item.value.typ == ValidationTokenEnum.Pipe) {
                // @ts-ignore
                token.typ = ValidationTokenEnum.AtRule;
                children.push(item.value);
                continue;
            }
            if (item.value.typ != ValidationTokenEnum.OpenCurlyBrace) {
                if (!('prelude' in token)) {
                    token.prelude = [];
                }
                token.prelude.push(item.value);
            }
            let braces = 0;
            let previousItem = item.value;
            while ((item = iterator.next()) && !item.done) {
                if (item.value.typ == ValidationTokenEnum.DeclarationNameToken) {
                    iterator.next();
                    const t = Object.defineProperty({
                        typ: ValidationTokenEnum.DeclarationDefinitionToken,
                        nam: item.value.val,
                        val: iterator.next().value
                    }, 'pos', {
                        ...objectProperties,
                        value: item.value.pos
                    });
                    if (braces > 0) {
                        token.chi.push(t);
                    }
                    else {
                        token.prelude.push(t);
                    }
                    previousItem = t;
                    continue;
                }
                if (item.value.typ == ValidationTokenEnum.OpenCurlyBrace) {
                    previousItem = item.value;
                    continue;
                }
                if (item.value.typ == ValidationTokenEnum.Whitespace && previousItem?.typ == ValidationTokenEnum.OpenCurlyBrace) {
                    braces++;
                    if (braces == 1) {
                        previousItem = item.value;
                        continue;
                    }
                }
                if (previousItem?.typ == ValidationTokenEnum.Whitespace && item.value.typ == ValidationTokenEnum.CloseCurlyBrace) {
                    braces--;
                    if (braces == 0) {
                        break;
                    }
                }
                if (braces == 0) {
                    if (!('prelude' in token)) {
                        token.prelude = [];
                    }
                    token.prelude.push(item.value);
                }
                else {
                    if (!('chi' in token)) {
                        token.chi = [];
                    }
                    token.chi.push(item.value);
                }
                previousItem = item.value;
            }
            if ('prelude' in token) {
                if (token?.prelude?.length == 1 && token.prelude[0].typ == ValidationTokenEnum.Whitespace) {
                    delete token.prelude;
                }
                else {
                    const t = { typ: ValidationTokenEnum.Root, chi: token.prelude };
                    doParseSyntax(syntax, t.chi[Symbol.iterator](), t);
                    token.prelude = t.chi;
                    minify(token.prelude);
                }
            }
            // @ts-ignore
            if (token?.chi?.length > 0) {
                minify(doParseSyntax(syntax, token.chi[Symbol.iterator](), token));
            }
        }
        else {
            children.push(item.value);
        }
    }
    return children;
}
function matchToken(syntax, iterator, validationToken) {
    if (iterator.length == 0) {
        return [];
    }
    if (Array.isArray(iterator[0])) {
        const result = [];
        for (let i = 0; i < iterator.length; i++) {
            result.push(matchToken(syntax, iterator[i], validationToken));
        }
        return result;
    }
    let children = [];
    let token = null;
    let i;
    if (validationToken == ValidationTokenEnum.Ampersand) {
        // @ts-ignore
        children = [...iterator];
        let offsetL;
        let offsetR;
        for (i = 0; i < children.length; i++) {
            if (children[i].typ == ValidationTokenEnum.Ampersand) {
                offsetR = i + 1;
                offsetL = i - 1;
                while (offsetR < children.length - 1 && children[offsetR].typ == ValidationTokenEnum.Whitespace) {
                    offsetR++;
                }
                while (offsetR + 1 < children.length && skipped.includes(children[offsetR + 1].typ)) {
                    offsetR++;
                }
                while (offsetL > 0 && (children[offsetL].typ == ValidationTokenEnum.Whitespace || skipped.includes(children[offsetL].typ))) {
                    offsetL--;
                }
                token = Object.defineProperty({
                    typ: ValidationTokenEnum.AmpersandToken,
                    l: children.slice(offsetL, i),
                    r: children.slice(i + 1, offsetR + 1)
                }, 'pos', { ...objectProperties, value: children[i].pos });
                i = offsetL;
                children.splice(offsetL, offsetR - offsetL + 1, token);
            }
            else if ('chi' in children[i]) {
                // @ts-ignore
                children[i].chi = matchToken(syntax, children[i].chi, validationToken);
            }
            else if ('l' in children[i]) {
                // @ts-ignore
                children[i].l = matchToken(syntax, children[i].l, validationToken);
                // @ts-ignore
                children[i].r = matchToken(syntax, children[i].r, validationToken);
            }
        }
        return children;
    }
    let item;
    for (i = 0; i < iterator.length; i++) {
        item = iterator[i];
        if (item.typ == validationToken) {
            if (item.typ == ValidationTokenEnum.Pipe) {
                token = Object.defineProperty({
                    typ: ValidationTokenEnum.PipeToken,
                    chi: [matchToken(syntax, children.slice(), validationToken)], //.concat(matchToken(syntaxes, children.slice()[Symbol.iterator]() as Iterator<ValidationTokenIteratorValue>, validationToken), matchToken(syntaxes, iterator, validationToken)),
                    // @ts-ignore
                    // l: matchToken(syntaxes, children.slice()[Symbol.iterator](), validationToken),
                    // r: matchToken(syntaxes, iterator, validationToken)
                }, 'pos', {
                    ...objectProperties,
                    value: item.pos
                });
                children.length = 0;
                while ((item = iterator[++i]) != null) {
                    if (item.typ == ValidationTokenEnum.Pipe) {
                        token.chi.push(matchToken(syntax, children.slice(), validationToken));
                        children.length = 0;
                    }
                    else {
                        children.push(item);
                    }
                }
                if (children.length > 0) {
                    token.chi.push(matchToken(syntax, children.slice(), validationToken));
                }
                token.chi.sort((a, b) => {
                    if (a.some((t) => t.isList)) {
                        return -1;
                    }
                    if (b.some((t) => t.isList)) {
                        return 1;
                    }
                    if (a.some((t) => t.occurence != null)) {
                        return -1;
                    }
                    if (b.some((t) => t.occurence != null)) {
                        return -1;
                    }
                    if (a.some((t) => t.isRepeatableGroup)) {
                        return -1;
                    }
                    if (b.some((t) => t.isRepeatableGroup)) {
                        return 1;
                    }
                    if (a.some((t) => t.isRepeatable)) {
                        return -1;
                    }
                    if (b.some((t) => t.isRepeatable)) {
                        return 1;
                    }
                    if (a.some((t) => t.isOptional)) {
                        return 1;
                    }
                    if (b.some((t) => t.isOptional)) {
                        return -1;
                    }
                    return 0;
                });
                children = [token];
            }
            else {
                token = Object.defineProperty({
                    typ: ValidationTokenEnum.ColumnToken,
                    l: matchToken(syntax, children.slice(), validationToken),
                    r: matchToken(syntax, iterator.slice(i + 1), validationToken)
                }, 'pos', {
                    ...objectProperties,
                    value: item.pos
                });
                i = iterator.length;
            }
            children.length = 0;
            children.push(token);
            while ((item = iterator[++i]) != null) {
                children.push(item);
                if ('chi' in item) {
                    // @ts-ignore
                    item.chi = matchToken(syntax, item.chi, validationToken);
                }
                else if ('l' in item) {
                    // @ts-ignore
                    item.l = matchToken(syntax, item.l, validationToken);
                    // @ts-ignore
                    item.r = matchToken(syntax, item.r, validationToken);
                }
            }
            // @ts-ignore
            return children;
        }
        else {
            // @ts-ignore
            children.push(item);
            if ('chi' in item) {
                // @ts-ignore
                item.chi = matchToken(syntax, item.chi, validationToken);
            }
            else if ('l' in item) {
                item.l = matchToken(syntax, item.l, validationToken);
                // @ts-ignore
                item.r = matchToken(syntax, item.r, validationToken);
            }
        }
    }
    return children;
}
function parseSyntaxTokens(syntax, iterator) {
    const items = [];
    let item;
    let i;
    while ((item = iterator.next()) && !item.done) {
        if (Array.isArray(item.value)) {
            // @ts-ignore
            item.value = parseSyntaxTokens(syntax, item.value[Symbol.iterator]());
        }
        switch (item.value.typ) {
            case ValidationTokenEnum.Star:
            case ValidationTokenEnum.HashMark:
            case ValidationTokenEnum.AtLeastOnce:
            case ValidationTokenEnum.Exclamation:
            case ValidationTokenEnum.QuestionMark:
            case ValidationTokenEnum.OpenCurlyBrace:
                i = items.length;
                while (i--) {
                    if (items[i].typ != ValidationTokenEnum.Whitespace) {
                        break;
                    }
                }
                if (item.value.typ == ValidationTokenEnum.Exclamation) {
                    items[i].isRepeatableGroup = true;
                }
                else if (item.value.typ == ValidationTokenEnum.QuestionMark) {
                    items[i].isOptional = true;
                }
                else if (item.value.typ == ValidationTokenEnum.Star) {
                    items[i].isRepeatable = true;
                }
                else if (item.value.typ == ValidationTokenEnum.AtLeastOnce) {
                    items[i].atLeastOnce = true;
                }
                else if (item.value.typ == ValidationTokenEnum.HashMark) {
                    items[i].isList = true;
                }
                else if (item.value.typ == ValidationTokenEnum.OpenCurlyBrace) {
                    items[i].occurence = {
                        min: 0,
                        max: null
                    };
                    while ((item = iterator.next()) && !item.done) {
                        if (item.value.typ == ValidationTokenEnum.Number) {
                            // @ts-ignore
                            if (items[i].occurence.min == 0) {
                                // @ts-ignore
                                items[i].occurence.min = items[i].occurence.max = +item.value.val;
                            }
                            else {
                                // @ts-ignore
                                items[i].occurence.max = +item.value.val;
                            }
                        }
                        if (item.value.typ == ValidationTokenEnum.CloseCurlyBrace) {
                            break;
                        }
                    }
                }
                break;
            case ValidationTokenEnum.Pipe:
                item.value.chi = item.value.chi.map((t) => parseSyntaxTokens(syntax, t[Symbol.iterator]()));
                items.push(item.value);
                break;
            default:
                items.push(item.value);
                break;
        }
    }
    for (i = 0; i < items.length; i++) {
        if ('chi' in items[i]) {
            // @ts-ignore
            items[i].chi = parseSyntaxTokens(syntax, items[i].chi[Symbol.iterator]());
        }
        else if ('l' in items[i]) {
            // @ts-ignore
            items[i].l = parseSyntaxTokens(syntax, items[i].l[Symbol.iterator]());
            // @ts-ignore
            items[i].r = parseSyntaxTokens(syntax, items[i].r[Symbol.iterator]());
        }
        if (items[i].typ != ValidationTokenEnum.Bracket && (items[i].isOptional || items[i].isRepeatable)) {
            let k = i;
            while (--k > 0) {
                if (items[k].typ == ValidationTokenEnum.Whitespace) {
                    continue;
                }
                if (items[k].typ == ValidationTokenEnum.Comma) {
                    const wrapper = Object.defineProperty({
                        typ: ValidationTokenEnum.Bracket,
                        chi: items.slice(k, i + 1)
                    }, 'pos', { ...objectProperties, value: items[k].pos });
                    if (items[i].isOptional) {
                        wrapper.isOptional = true;
                        delete items[i].isOptional;
                    }
                    if (items[i].isRepeatable) {
                        wrapper.isRepeatable = true;
                        delete items[i].isRepeatable;
                    }
                    items.splice(k, i - k + 1, wrapper);
                    i = k - 1;
                }
                break;
            }
            // }
        }
    }
    return items;
}
function doParseSyntax(syntax, iterator, context) {
    context.chi = matchParens(syntax, iterator);
    // @ts-ignore
    context.chi = matchAtRule(syntax, context.chi[Symbol.iterator]());
    // @ts-ignore
    context.chi = matchBrackets(syntax, context.chi[Symbol.iterator]());
    // @ts-ignore
    context.chi = matchCurlBraces(syntax, context.chi[Symbol.iterator]());
    // @ts-ignore
    context.chi = matchToken(syntax, context.chi, ValidationTokenEnum.Pipe);
    // @ts-ignore
    context.chi = matchToken(syntax, context.chi, ValidationTokenEnum.Column);
    // @ts-ignore
    context.chi = matchToken(syntax, context.chi, ValidationTokenEnum.Ampersand);
    // @ts-ignore
    context.chi = parseSyntaxTokens(syntax, context.chi[Symbol.iterator]());
    return context;
}
function getTokenType(token, position, currentPosition) {
    const pos = { ...position };
    Object.assign(position, currentPosition);
    // '∞'
    if (token == '\u221e') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.InfinityToken,
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token.charAt(0) == '"' || token.charAt(0) == "'") {
        return Object.defineProperty({
            typ: ValidationTokenEnum.StringToken,
            val: token
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == ';') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.SemiColon
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token.match(/^\s+$/)) {
        return Object.defineProperty({
            typ: ValidationTokenEnum.Whitespace,
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token.match(/^\d+$/)) {
        return Object.defineProperty({
            typ: ValidationTokenEnum.Number,
            val: Number(token)
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (isPseudo(token)) {
        return Object.defineProperty({
            typ: ValidationTokenEnum.PseudoClassToken,
            val: token
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '!') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.Exclamation
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '#') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.HashMark
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '/') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.Separator
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '+') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.AtLeastOnce
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '|') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.Pipe
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '&&') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.Ampersand
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '||') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.Column
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == ',') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.Comma
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '[') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.OpenBracket
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == ']') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.CloseBracket
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '(') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.OpenParenthesis
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == ')') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.CloseParenthesis
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '{') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.OpenCurlyBrace
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '}') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.CloseCurlyBrace
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '*') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.Star
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token == '?') {
        return Object.defineProperty({
            typ: ValidationTokenEnum.QuestionMark
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token.startsWith("<'")) {
        return Object.defineProperty({
            typ: ValidationTokenEnum.DeclarationType,
            val: token.slice(2, -2)
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token.startsWith('<')) {
        // <number [1,1000]>
        // <length [0,∞]>
        let match = token.match(/<([a-z0-9-]+)(\s+\[([0-9]+[a-zA-Z]*),(([0-9]+[a-zA-Z]*)|∞)\])?>/);
        if (match == null) {
            let match = token.match(/<([a-zA-Z0-9-]+)\(\)>/);
            if (match != null) {
                return Object.defineProperty({
                    typ: ValidationTokenEnum.ValidationFunctionDefinition,
                    val: match[1]
                }, 'pos', { ...objectProperties, value: pos });
            }
            throw new Error('invalid token at position: ' + position.lin + ':' + position.col + ' ' + token);
        }
        if (match[2] != null) {
            const type = getTokenType$1(match[3]);
            return Object.defineProperty({
                typ: ValidationTokenEnum.PropertyType,
                val: match[1],
                unit: EnumToken[type.typ],
                range: [+type.val, match[4] == '\u221e' ? null : +match[4]]
            }, 'pos', { ...objectProperties, value: pos });
        }
        return Object.defineProperty({
            typ: ValidationTokenEnum.PropertyType,
            val: token.slice(1, -1)
        }, 'pos', { ...objectProperties, value: pos });
    }
    if (token.startsWith('@') && isIdent(token.slice(1))) {
        return Object.defineProperty({
            typ: ValidationTokenEnum.AtRule,
            val: token.slice(1)
        }, 'pos', { ...objectProperties, value: pos });
    }
    return Object.defineProperty({
        typ: ValidationTokenEnum.Keyword,
        val: token
    }, 'pos', { ...objectProperties, value: pos });
}
function move(position, chr) {
    for (const c of chr) {
        position.col++;
        position.ind += c.length;
    }
    return position;
}
function renderSyntax(token, parent) {
    let glue;
    switch (token.typ) {
        case ValidationTokenEnum.InfinityToken:
            // '∞'
            return '\u221e';
        case ValidationTokenEnum.Root:
            return token.chi.reduce((acc, curr) => acc + renderSyntax(curr), '');
        case ValidationTokenEnum.Whitespace:
            return ' ';
        case ValidationTokenEnum.ValidationFunctionDefinition:
            return '<' + token.val + '()>';
        case ValidationTokenEnum.HashMark:
            return '#';
        case ValidationTokenEnum.Pipe:
            return '|';
        case ValidationTokenEnum.Column:
            return '||';
        case ValidationTokenEnum.PipeToken:
            return token.chi.reduce((acc, curr) => acc + (acc.trim().length > 0 ? '|' : '') + curr.reduce((acc, curr) => acc + renderSyntax(curr), ''), '');
        case ValidationTokenEnum.ColumnToken:
        case ValidationTokenEnum.AmpersandToken:
            glue = token.typ == ValidationTokenEnum.ColumnToken ? '||' : '&&';
            return token.l.reduce((acc, curr) => acc + renderSyntax(curr), '') +
                glue +
                token.r.reduce((acc, curr) => acc + renderSyntax(curr), '');
        case ValidationTokenEnum.Function:
        case ValidationTokenEnum.PseudoClassFunctionToken:
        case ValidationTokenEnum.Parens:
            return token.val + '(' + token.chi.reduce((acc, curr) => acc + renderSyntax(curr), '') + ')' + renderAttributes(token);
        case ValidationTokenEnum.Comma:
            return ',';
        case ValidationTokenEnum.Keyword:
            return token.val + renderAttributes(token);
        case ValidationTokenEnum.OpenBracket:
            return '[';
        case ValidationTokenEnum.Ampersand:
            return '&&';
        case ValidationTokenEnum.QuestionMark:
            return '?';
        case ValidationTokenEnum.Separator:
            return '/';
        case ValidationTokenEnum.Bracket:
            return '[' + token.chi.reduce((acc, curr) => acc + renderSyntax(curr), '') + ']' + renderAttributes(token);
        case ValidationTokenEnum.PropertyType:
            return '<' + token.val + (Array.isArray(token.range) ? `[${token?.range?.[0]}, ${token?.range?.[1] ?? '\u221e'}]` : '') + '>' + renderAttributes(token);
        case ValidationTokenEnum.DeclarationType:
            return "<'" + token.val + "'>" + renderAttributes(token);
        case ValidationTokenEnum.Number:
        case ValidationTokenEnum.PseudoClassToken:
        case ValidationTokenEnum.StringToken:
            return token.val + '';
        case ValidationTokenEnum.SemiColon:
            return ';';
        case ValidationTokenEnum.AtRule:
            return '@' + token.val;
        case ValidationTokenEnum.AtRuleDefinition:
            return '@' + token.val +
                (token.prelude == null ? '' : ' ' + token.prelude.reduce((acc, curr) => acc + renderSyntax(curr), '')) +
                (token.chi == null ? '' : ' {\n' + token.chi.reduce((acc, curr) => acc + renderSyntax(curr), '')).slice(1, -1) + '\n}';
        case ValidationTokenEnum.Block:
            return '{' + token.chi.reduce((acc, t) => acc + renderSyntax(t), '') + '}';
        case ValidationTokenEnum.DeclarationDefinitionToken:
            return token.nam + ': ' + renderSyntax(token.val);
        // case ValidationTokenEnum.ColumnArrayToken:
        //
        //     return (token as ValidationColumnArrayToken).chi.reduce((acc: string, curr: ValidationToken) => acc + (acc.trim().length > 0 ? '||' : '') + renderSyntax(curr), '');
        default:
            throw new Error('Unhandled token: ' + JSON.stringify({ token }, null, 1));
    }
}
function renderAttributes(token) {
    let result = '';
    if (token.isList) {
        result += '#';
    }
    if (token.isOptional) {
        result += '?';
    }
    if (token.isRepeatableGroup) {
        result += '!';
    }
    if (token.isRepeatable) {
        result += '*';
    }
    if (token.atLeastOnce) {
        result += '+';
    }
    if (token.occurence != null) {
        if (token.occurence.max == null || token.occurence.max == token.occurence.min || Number.isNaN(token.occurence.max)) {
            result += '{' + token.occurence.min + '}';
        }
        else {
            result += '{' + token.occurence.min + ',' + (Number.isFinite(token.occurence.max) ? token.occurence.max : '\u221e') + '}';
        }
    }
    return result;
}
function minify(ast) {
    if (Array.isArray(ast)) {
        // @ts-ignore
        while (ast.length > 0 && ast[0].typ == ValidationTokenEnum.Whitespace) {
            // @ts-ignore
            ast.shift();
        }
        while (ast.length > 0 && ast.at(-1).typ == ValidationTokenEnum.Whitespace) {
            ast.pop();
        }
        for (let i = 0; i < ast.length; i++) {
            minify(ast[i]);
            if (ast[i].typ == ValidationTokenEnum.Whitespace && ast[i + 1]?.typ == ValidationTokenEnum.Whitespace) {
                ast.splice(i + 1, 1);
                i--;
                continue;
            }
            if (ast[i].typ == ValidationTokenEnum.Separator) {
                if (ast[i + 1]?.typ == ValidationTokenEnum.Whitespace) {
                    ast.splice(i + 1, 1);
                }
                if (ast[i - 1]?.typ == ValidationTokenEnum.Whitespace) {
                    ast.splice(--i, 1);
                }
            }
        }
        return ast;
    }
    if ('l' in ast) {
        minify(ast.l);
    }
    if ('r' in ast) {
        minify(ast.r);
    }
    if ('chi' in ast) {
        minify(ast.chi);
    }
    if ('prelude' in ast) {
        minify(ast.prelude);
    }
    return ast;
}

export { parseSyntax, renderSyntax };
