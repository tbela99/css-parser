import { isWhiteSpace, isPseudo, isAtKeyword, isFunction, isNumber, isDimension, parseDimension, isPercentage, isIdent, isHash, isNewLine, isIdentStart, isHexColor } from './utils/syntax.js';
import { renderToken } from '../renderer/renderer.js';
import { COLORS_NAMES } from '../renderer/utils/color.js';

const funcLike = ['Start-parens', 'Func', 'UrlFunc', 'Pseudo-class-func'];
function tokenize(iterator, errors, options, offsetInd = 0, offsetLin = 1, offsetCol = 0) {
    let ind = -1;
    let lin = offsetLin;
    let col = offsetCol;
    const tokens = [];
    const src = options.src;
    const stack = [];
    const ast = {
        typ: "StyleSheet",
        chi: []
    };
    const position = {
        ind: Math.max(ind, 0),
        lin: lin,
        col: Math.max(col, 1)
    };
    let value;
    let buffer = '';
    let total = iterator.length;
    let map = new Map;
    let context = ast;
    if (options.location) {
        ast.loc = {
            sta: {
                ind: ind + offsetInd,
                lin: lin,
                col: col
            },
            src: ''
        };
    }
    function getType(val) {
        if (val === '') {
            throw new Error('empty string?');
        }
        if (val == ':') {
            return { typ: 'Colon' };
        }
        if (val == ')') {
            return { typ: 'End-parens' };
        }
        if (val == '(') {
            return { typ: 'Start-parens' };
        }
        if (val == '=') {
            return { typ: 'Delim', val };
        }
        if (val == ';') {
            return { typ: 'Semi-colon' };
        }
        if (val == ',') {
            return { typ: 'Comma' };
        }
        if (val == '<') {
            return { typ: 'Lt' };
        }
        if (val == '>') {
            return { typ: 'Gt' };
        }
        if (isPseudo(val)) {
            return val.endsWith('(') ? {
                typ: 'Pseudo-class-func',
                val: val.slice(0, -1),
                chi: []
            }
                : {
                    typ: 'Pseudo-class',
                    val
                };
        }
        if (isAtKeyword(val)) {
            return {
                typ: 'At-rule',
                val: val.slice(1)
            };
        }
        if (isFunction(val)) {
            val = val.slice(0, -1);
            return {
                typ: val == 'url' ? 'UrlFunc' : 'Func',
                val,
                chi: []
            };
        }
        if (isNumber(val)) {
            return {
                typ: 'Number',
                val
            };
        }
        if (isDimension(val)) {
            return parseDimension(val);
        }
        if (isPercentage(val)) {
            return {
                typ: 'Perc',
                val: val.slice(0, -1)
            };
        }
        if (val == 'currentColor') {
            return {
                typ: 'Color',
                val,
                kin: 'lit'
            };
        }
        if (isIdent(val)) {
            return {
                typ: 'Iden',
                val
            };
        }
        if (val.charAt(0) == '#' && isHash(val)) {
            return {
                typ: 'Hash',
                val
            };
        }
        if ('"\''.includes(val.charAt(0))) {
            return {
                typ: 'Unclosed-string',
                val
            };
        }
        return {
            typ: 'Literal',
            val
        };
    }
    // consume and throw away
    function consume(open, close) {
        let count = 1;
        let chr;
        while (true) {
            chr = next();
            if (chr == '\\') {
                if (next() === '') {
                    break;
                }
                continue;
            }
            else if (chr == '/' && peek() == '*') {
                next();
                while (true) {
                    chr = next();
                    if (chr === '') {
                        break;
                    }
                    if (chr == '*' && peek() == '/') {
                        next();
                        break;
                    }
                }
            }
            else if (chr == close) {
                count--;
            }
            else if (chr == open) {
                count++;
            }
            if (chr === '' || count == 0) {
                break;
            }
        }
    }
    function parseNode(tokens) {
        let i = 0;
        let loc;
        for (i = 0; i < tokens.length; i++) {
            if (tokens[i].typ == 'Comment') {
                // @ts-ignore
                context.chi.push(tokens[i]);
                const position = map.get(tokens[i]);
                loc = {
                    sta: position,
                    src
                };
                if (options.location) {
                    tokens[i].loc = loc;
                }
            }
            else if (tokens[i].typ != 'Whitespace') {
                break;
            }
        }
        tokens = tokens.slice(i);
        const delim = tokens.pop();
        while (['Whitespace', 'Bad-string', 'Bad-comment'].includes(tokens[tokens.length - 1]?.typ)) {
            tokens.pop();
        }
        if (tokens.length == 0) {
            return null;
        }
        if (tokens[0]?.typ == 'At-rule') {
            const atRule = tokens.shift();
            const position = map.get(atRule);
            if (atRule.val == 'charset' && position.ind > 0) {
                errors.push({ action: 'drop', message: 'invalid @charset', location: { src, ...position } });
                return null;
            }
            while (['Whitespace'].includes(tokens[0]?.typ)) {
                tokens.shift();
            }
            if (atRule.val == 'import') {
                // only @charset and @layer are accepted before @import
                if (context.chi.length > 0) {
                    let i = context.chi.length;
                    while (i--) {
                        const type = context.chi[i].typ;
                        if (type == 'Comment') {
                            continue;
                        }
                        if (type != 'AtRule') {
                            errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                            return null;
                        }
                        const name = context.chi[i].nam;
                        if (name != 'charset' && name != 'import' && name != 'layer') {
                            errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                            return null;
                        }
                        break;
                    }
                }
                // @ts-ignore
                if (tokens[0]?.typ != 'String' && tokens[0]?.typ != 'UrlFunc') {
                    errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                    return null;
                }
                // @ts-ignore
                if (tokens[0].typ == 'UrlFunc' && tokens[1]?.typ != 'Url-token' && tokens[1]?.typ != 'String') {
                    errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                    return null;
                }
            }
            if (atRule.val == 'import') {
                // @ts-ignore
                if (tokens[0].typ == 'UrlFunc' && tokens[1].typ == 'Url-token') {
                    tokens.shift();
                    // const token: Token = <UrlToken | StringToken>tokens.shift();
                    // @ts-ignore
                    tokens[0].typ = 'String';
                    // @ts-ignore
                    tokens[0].val = `"${tokens[0].val}"`;
                    // tokens[0] = token;
                }
            }
            // https://www.w3.org/TR/css-nesting-1/#conditionals
            // allowed nesting at-rules
            // there must be a top level rule in the stack
            const node = {
                typ: 'AtRule',
                nam: renderToken(atRule, { removeComments: true }),
                val: tokens.reduce((acc, curr, index, array) => {
                    if (curr.typ == 'Whitespace') {
                        if (array[index + 1]?.typ == 'Start-parens' ||
                            array[index - 1]?.typ == 'End-parens' ||
                            array[index - 1]?.typ == 'Func') {
                            return acc;
                        }
                    }
                    return acc + renderToken(curr, { removeComments: true });
                }, '')
            };
            if (node.nam == 'import') {
                if (options.processImport) {
                    // @ts-ignore
                    let fileToken = tokens[tokens[0].typ == 'UrlFunc' ? 1 : 0];
                    let file = fileToken.typ == 'String' ? fileToken.val.slice(1, -1) : fileToken.val;
                    if (!file.startsWith('data:')) ;
                }
            }
            if (delim.typ == 'Block-start') {
                node.chi = [];
            }
            loc = {
                sta: position,
                src
            };
            if (options.location) {
                node.loc = loc;
            }
            // @ts-ignore
            context.chi.push(node);
            return delim.typ == 'Block-start' ? node : null;
        }
        else {
            // rule
            if (delim.typ == 'Block-start') {
                const position = map.get(tokens[0]);
                if (context.typ == 'Rule') {
                    if (tokens[0]?.typ == 'Iden') {
                        errors.push({ action: 'drop', message: 'invalid nesting rule', location: { src, ...position } });
                        return null;
                    }
                }
                const sel = parseTokens(tokens).map(curr => renderToken(curr, { compress: true }));
                const node = {
                    typ: 'Rule',
                    // @ts-ignore
                    sel: sel.join(''),
                    chi: []
                };
                loc = {
                    sta: position,
                    src
                };
                if (options.location) {
                    node.loc = loc;
                }
                // @ts-ignore
                context.chi.push(node);
                return node;
            }
            else {
                // declaration
                // @ts-ignore
                let name = null;
                // @ts-ignore
                let value = null;
                for (let i = 0; i < tokens.length; i++) {
                    if (tokens[i].typ == 'Comment') {
                        continue;
                    }
                    if (tokens[i].typ == 'Colon') {
                        name = tokens.slice(0, i);
                        value = parseTokens(tokens.slice(i + 1), { parseColor: true });
                    }
                }
                if (name == null) {
                    name = tokens;
                }
                const position = map.get(name[0]);
                if (name.length > 0) {
                    for (let i = 1; i < name.length; i++) {
                        if (name[i].typ != 'Whitespace' && name[i].typ != 'Comment') {
                            errors.push({
                                action: 'drop',
                                message: 'invalid declaration',
                                location: { src, ...position }
                            });
                            return null;
                        }
                    }
                }
                // if (name.length == 0) {
                //
                //     errors.push({action: 'drop', message: 'invalid declaration', location: {src, ...position}});
                //     return null;
                // }
                if (value == null) {
                    errors.push({ action: 'drop', message: 'invalid declaration', location: { src, ...position } });
                    return null;
                }
                if (value.length == 0) {
                    errors.push({ action: 'drop', message: 'invalid declaration', location: { src, ...position } });
                    return null;
                }
                const node = {
                    typ: 'Declaration',
                    // @ts-ignore
                    nam: renderToken(name.shift(), { removeComments: true }),
                    // @ts-ignore
                    val: value
                };
                while (node.val[0]?.typ == 'Whitespace') {
                    node.val.shift();
                }
                if (node.val.length == 0) {
                    errors.push({ action: 'drop', message: 'invalid declaration', location: { src, ...position } });
                    return null;
                }
                loc = {
                    sta: position,
                    src
                };
                if (options.location) {
                    node.loc = loc;
                }
                // @ts-ignore
                context.chi.push(node);
                return null;
            }
        }
    }
    function peek(count = 1) {
        if (count == 1) {
            return iterator.charAt(ind + 1);
        }
        return iterator.slice(ind + 1, ind + count + 1);
    }
    function prev(count = 1) {
        if (count == 1) {
            return ind == 0 ? '' : iterator.charAt(ind - 1);
        }
        return iterator.slice(ind - 1 - count, ind - 1);
    }
    function next(count = 1) {
        let char = '';
        while (count-- > 0 && ind < total) {
            const codepoint = iterator.charCodeAt(++ind);
            if (isNaN(codepoint)) {
                return char;
            }
            char += iterator.charAt(ind);
            if (isNewLine(codepoint)) {
                lin++;
                col = 0;
            }
            else {
                col++;
            }
        }
        return char;
    }
    function pushToken(token) {
        tokens.push(token);
        map.set(token, { ...position, ind: position.ind + offsetInd });
        position.ind = ind;
        position.lin = lin;
        position.col = col == 0 ? 1 : col;
        // }
    }
    function consumeWhiteSpace() {
        let count = 0;
        while (isWhiteSpace(iterator.charAt(count + ind + 1).charCodeAt(0))) {
            count++;
        }
        next(count);
        return count;
    }
    function consumeString(quoteStr) {
        const quote = quoteStr;
        let value;
        let hasNewLine = false;
        if (buffer.length > 0) {
            pushToken(getType(buffer));
            buffer = '';
        }
        buffer += quoteStr;
        while (ind < total) {
            value = peek();
            if (ind >= total) {
                pushToken({ typ: hasNewLine ? 'Bad-string' : 'Unclosed-string', val: buffer });
                break;
            }
            if (value == '\\') {
                // buffer += value;
                if (ind >= total) {
                    // drop '\\' at the end
                    pushToken(getType(buffer));
                    break;
                }
                buffer += next(2);
                continue;
            }
            if (value == quote) {
                buffer += value;
                pushToken({ typ: hasNewLine ? 'Bad-string' : 'String', val: buffer });
                next();
                // i += value.length;
                buffer = '';
                break;
            }
            if (isNewLine(value.charCodeAt(0))) {
                hasNewLine = true;
            }
            if (hasNewLine && value == ';') {
                pushToken({ typ: 'Bad-string', val: buffer });
                buffer = '';
                break;
            }
            buffer += value;
            // i += value.length;
            next();
        }
    }
    while (ind < total) {
        value = next();
        if (ind >= total) {
            if (buffer.length > 0) {
                pushToken(getType(buffer));
                buffer = '';
            }
            break;
        }
        if (isWhiteSpace(value.charCodeAt(0))) {
            if (buffer.length > 0) {
                pushToken(getType(buffer));
                buffer = '';
            }
            while (ind < total) {
                value = next();
                if (ind >= total) {
                    break;
                }
                if (!isWhiteSpace(value.charCodeAt(0))) {
                    break;
                }
            }
            pushToken({ typ: 'Whitespace' });
            buffer = '';
            if (ind >= total) {
                break;
            }
        }
        switch (value) {
            case '/':
                if (buffer.length > 0 && tokens.at(-1)?.typ == 'Whitespace') {
                    pushToken(getType(buffer));
                    buffer = '';
                    if (peek() != '*') {
                        pushToken(getType(value));
                        break;
                    }
                }
                buffer += value;
                if (peek() == '*') {
                    buffer += '*';
                    // i++;
                    next();
                    while (ind < total) {
                        value = next();
                        if (ind >= total) {
                            pushToken({
                                typ: 'Bad-comment', val: buffer
                            });
                            break;
                        }
                        if (value == '\\') {
                            buffer += value;
                            value = next();
                            if (ind >= total) {
                                pushToken({
                                    typ: 'Bad-comment',
                                    val: buffer
                                });
                                break;
                            }
                            buffer += value;
                            continue;
                        }
                        if (value == '*') {
                            buffer += value;
                            value = next();
                            if (ind >= total) {
                                pushToken({
                                    typ: 'Bad-comment', val: buffer
                                });
                                break;
                            }
                            buffer += value;
                            if (value == '/') {
                                pushToken({ typ: 'Comment', val: buffer });
                                buffer = '';
                                break;
                            }
                        }
                        else {
                            buffer += value;
                        }
                    }
                }
                // else {
                //
                //     pushToken(getType(buffer));
                //     buffer = '';
                // }
                break;
            case '<':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                buffer += value;
                value = next();
                if (ind >= total) {
                    break;
                }
                if (peek(3) == '!--') {
                    while (ind < total) {
                        value = next();
                        if (ind >= total) {
                            break;
                        }
                        buffer += value;
                        if (value == '>' && prev(2) == '--') {
                            pushToken({
                                typ: 'CDOCOMM',
                                val: buffer
                            });
                            buffer = '';
                            break;
                        }
                    }
                }
                if (ind >= total) {
                    pushToken({ typ: 'BADCDO', val: buffer });
                    buffer = '';
                }
                break;
            case '\\':
                value = next();
                // EOF
                if (ind + 1 >= total) {
                    // end of stream ignore \\
                    pushToken(getType(buffer));
                    buffer = '';
                    break;
                }
                buffer += value;
                break;
            case '"':
            case "'":
                consumeString(value);
                break;
            case '~':
            case '|':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                buffer += value;
                value = next();
                if (ind >= total) {
                    pushToken(getType(buffer));
                    buffer = '';
                    break;
                }
                if (value == '=') {
                    buffer += value;
                    pushToken({
                        typ: buffer[0] == '~' ? 'Includes' : 'Dash-matches',
                        val: buffer
                    });
                    buffer = '';
                    break;
                }
                pushToken(getType(buffer));
                buffer = value;
                break;
            case '>':
                if (tokens[tokens.length - 1]?.typ == 'Whitespace') {
                    tokens.pop();
                }
                pushToken({ typ: 'Gt' });
                consumeWhiteSpace();
                break;
            case ':':
            case ',':
            case '=':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                if (value == ':' && ':' == peek()) {
                    buffer += value + next();
                    break;
                }
                // if (value == ',' && tokens[tokens.length - 1]?.typ == 'Whitespace') {
                //
                //     tokens.pop();
                // }
                pushToken(getType(value));
                buffer = '';
                while (isWhiteSpace(peek().charCodeAt(0))) {
                    next();
                }
                break;
            case ')':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                pushToken({ typ: 'End-parens' });
                break;
            case '(':
                if (buffer.length == 0) {
                    pushToken({ typ: 'Start-parens' });
                }
                else {
                    buffer += value;
                    pushToken(getType(buffer));
                    buffer = '';
                    const token = tokens[tokens.length - 1];
                    if (token.typ == 'UrlFunc' /* && token.chi == 'url' */) {
                        // consume either string or url token
                        let whitespace = '';
                        value = peek();
                        while (isWhiteSpace(value.charCodeAt(0))) {
                            whitespace += value;
                        }
                        if (whitespace.length > 0) {
                            next(whitespace.length);
                        }
                        value = peek();
                        if (value == '"' || value == "'") {
                            consumeString(next());
                            let token = tokens[tokens.length - 1];
                            if (['String', 'Literal'].includes(token.typ) && /^(["']?)[a-zA-Z0-9_/-][a-zA-Z0-9_/:.-]+(\1)$/.test(token.val)) {
                                if (token.typ == 'String') {
                                    token.val = token.val.slice(1, -1);
                                }
                                // @ts-ignore
                                // token.typ = 'Url-token';
                            }
                            break;
                        }
                        else {
                            buffer = '';
                            do {
                                let cp = value.charCodeAt(0);
                                // EOF -
                                if (cp == null) {
                                    pushToken({ typ: 'Bad-url-token', val: buffer });
                                    break;
                                }
                                // ')'
                                if (cp == 0x29 || cp == null) {
                                    if (buffer.length == 0) {
                                        pushToken({ typ: 'Bad-url-token', val: '' });
                                    }
                                    else {
                                        pushToken({ typ: 'Url-token', val: buffer });
                                    }
                                    if (cp != null) {
                                        pushToken(getType(next()));
                                    }
                                    break;
                                }
                                if (isWhiteSpace(cp)) {
                                    whitespace = next();
                                    while (true) {
                                        value = peek();
                                        cp = value.charCodeAt(0);
                                        if (isWhiteSpace(cp)) {
                                            whitespace += value;
                                            continue;
                                        }
                                        break;
                                    }
                                    if (cp == null || cp == 0x29) {
                                        continue;
                                    }
                                    // bad url token
                                    buffer += next(whitespace.length);
                                    do {
                                        value = peek();
                                        cp = value.charCodeAt(0);
                                        if (cp == null || cp == 0x29) {
                                            break;
                                        }
                                        buffer += next();
                                    } while (true);
                                    pushToken({ typ: 'Bad-url-token', val: buffer });
                                    continue;
                                }
                                buffer += next();
                                value = peek();
                            } while (true);
                            buffer = '';
                        }
                    }
                }
                break;
            case '[':
            case ']':
            case '{':
            case '}':
            case ';':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                pushToken(getBlockType(value));
                let node = null;
                if (value == '{' || value == ';') {
                    node = parseNode(tokens);
                    if (node != null) {
                        stack.push(node);
                        // @ts-ignore
                        context = node;
                    }
                    else if (value == '{') {
                        // node == null
                        // consume and throw away until the closing '}' or EOF
                        consume('{', '}');
                    }
                    tokens.length = 0;
                    map.clear();
                }
                else if (value == '}') {
                    node = parseNode(tokens);
                    const previousNode = stack.pop();
                    // @ts-ignore
                    context = stack[stack.length - 1] || ast;
                    // if (options.location && context != root) {
                    // @ts-ignore
                    // context.loc.end = {ind, lin, col: col == 0 ? 1 : col}
                    // }
                    // @ts-ignore
                    if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                        context.chi.pop();
                    }
                    tokens.length = 0;
                    map.clear();
                    buffer = '';
                }
                // @ts-ignore
                // if (node != null && options.location && ['}', ';'].includes(value) && context.chi[context.chi.length - 1].loc.end == null) {
                // @ts-ignore
                // context.chi[context.chi.length - 1].loc.end = {ind, lin, col};
                // }
                break;
            case '!':
                if (buffer.length > 0) {
                    pushToken(getType(buffer));
                    buffer = '';
                }
                const important = peek(9);
                if (important == 'important') {
                    if (tokens[tokens.length - 1]?.typ == 'Whitespace') {
                        tokens.pop();
                    }
                    pushToken({ typ: 'Important' });
                    next(9);
                    buffer = '';
                    break;
                }
                buffer = '!';
                break;
            default:
                buffer += value;
                break;
        }
    }
    if (buffer.length > 0) {
        pushToken(getType(buffer));
    }
    if (tokens.length > 0) {
        parseNode(tokens);
    }
    // pushToken({typ: 'EOF'});
    return ast;
}
function parseTokens(tokens, options = {}) {
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (tokens[i].typ == 'Colon' && i) {
            const typ = tokens[i + 1]?.typ;
            if (typ != null) {
                if (typ == 'Func') {
                    tokens[i + 1].val = ':' + tokens[i + 1].val;
                    tokens[i + 1].typ = 'Pseudo-class-func';
                }
                else if (typ == 'Iden') {
                    tokens[i + 1].val = ':' + tokens[i + 1].val;
                    tokens[i + 1].typ = 'Pseudo-class';
                }
                if (typ == 'Func' || typ == 'Iden') {
                    tokens.splice(i, 1);
                    i--;
                    continue;
                }
            }
        }
        if (t.typ == 'Attr-start') {
            let k = i;
            let inAttr = 1;
            while (++k < tokens.length) {
                if (tokens[k].typ == 'Attr-end') {
                    inAttr--;
                }
                else if (tokens[k].typ == 'Attr-start') {
                    inAttr++;
                }
                if (inAttr == 0) {
                    break;
                }
            }
            Object.assign(t, { typ: 'Attr', chi: tokens.splice(i + 1, k - i) });
            // @ts-ignore
            if (t.chi.at(-1).typ == 'Attr-end') {
                // @ts-ignore
                t.chi.pop();
                // @ts-ignore
                if (t.chi.length > 1) {
                    /*(<AttrToken>t).chi =*/
                    // @ts-ignore
                    parseTokens(t.chi, options);
                }
                // @ts-ignore
                t.chi.forEach(val => {
                    if (val.typ == 'String') {
                        const slice = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, { typ: 'Iden', val: slice });
                        }
                    }
                });
            }
            continue;
        }
        if (funcLike.includes(t.typ)) {
            let parens = 1;
            let k = i;
            while (++k < tokens.length) {
                if (tokens[k].typ == 'Colon') {
                    const typ = tokens[k + 1]?.typ;
                    if (typ != null) {
                        if (typ == 'Iden') {
                            tokens[k + 1].typ = 'Pseudo-class';
                            tokens[k + 1].val = ':' + tokens[k + 1].val;
                        }
                        else if (typ == 'Func') {
                            tokens[k + 1].typ = 'Pseudo-class-func';
                            tokens[k + 1].val = ':' + tokens[k + 1].val;
                        }
                        if (typ == 'Func' || typ == 'Iden') {
                            tokens.splice(k, 1);
                            k--;
                            continue;
                        }
                    }
                }
                if (funcLike.includes(tokens[k].typ)) {
                    parens++;
                }
                else if (tokens[k].typ == 'End-parens') {
                    parens--;
                }
                if (parens == 0) {
                    break;
                }
            }
            // @ts-ignore
            t.chi = tokens.splice(i + 1, k - i);
            // @ts-ignore
            if (t.chi.at(-1)?.typ == 'End-parens') {
                // @ts-ignore
                t.chi.pop();
            }
            // @ts-ignore
            if (options.parseColor && ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'device-cmyk'].includes(t.val)) {
                let isColor = true;
                // @ts-ignore
                for (const v of t.chi) {
                    if (v.typ == 'Func' && v.val == 'var') {
                        isColor = false;
                        break;
                    }
                }
                if (!isColor) {
                    continue;
                }
                // @ts-ignore
                t.typ = 'Color';
                // @ts-ignore
                t.kin = t.val;
                // @ts-ignore
                let m = t.chi.length;
                while (m-- > 0) {
                    // @ts-ignore
                    if (t.chi[m].typ == 'Literal') {
                        // @ts-ignore
                        if (t.chi[m + 1]?.typ == 'Whitespace') {
                            // @ts-ignore
                            t.chi.splice(m + 1, 1);
                        }
                        // @ts-ignore
                        if (t.chi[m - 1]?.typ == 'Whitespace') {
                            // @ts-ignore
                            t.chi.splice(m - 1, 1);
                            m--;
                        }
                    }
                }
            }
            else if (t.typ == 'UrlFunc') {
                // @ts-ignore
                if (t.chi[0]?.typ == 'String') {
                    // @ts-ignore
                    const value = t.chi[0].val.slice(1, -1);
                    if (/^[/%.a-zA-Z0-9_-]+$/.test(value)) {
                        // @ts-ignore
                        t.chi[0].typ = 'Url-token';
                        // @ts-ignore
                        t.chi[0].val = value;
                    }
                }
            }
            // @ts-ignore
            if (t.chi.length > 0) {
                // @ts-ignore
                parseTokens(t.chi, options);
            }
            continue;
        }
        if (options.parseColor) {
            if (t.typ == 'Iden') {
                // named color
                const value = t.val.toLowerCase();
                if (COLORS_NAMES[value] != null) {
                    Object.assign(t, {
                        typ: 'Color',
                        val: COLORS_NAMES[value].length < value.length ? COLORS_NAMES[value] : value,
                        kin: 'hex'
                    });
                }
                continue;
            }
            if (t.typ == 'Hash' && isHexColor(t.val)) {
                // hex color
                // @ts-ignore
                t.typ = 'Color';
                // @ts-ignore
                t.kin = 'hex';
                continue;
            }
        }
    }
    return tokens;
}
function getBlockType(chr) {
    if (chr == ';') {
        return { typ: 'Semi-colon' };
    }
    if (chr == '{') {
        return { typ: 'Block-start' };
    }
    if (chr == '}') {
        return { typ: 'Block-end' };
    }
    if (chr == '[') {
        return { typ: 'Attr-start' };
    }
    if (chr == ']') {
        return { typ: 'Attr-end' };
    }
    throw new Error(`unhandled token: '${chr}'`);
}

export { tokenize };
