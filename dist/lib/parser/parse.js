import { isPseudo, isAtKeyword, isFunction, isNumber, isDimension, parseDimension, isPercentage, isIdent, isHexColor, isHash, isIdentStart, isColor } from './utils/syntax.js';
import { renderToken } from '../renderer/render.js';
import { COLORS_NAMES } from '../renderer/utils/color.js';
import { minify, combinators } from '../ast/minify.js';
import { tokenize } from './tokenize.js';

const urlTokenMatcher = /^(["']?)[a-zA-Z0-9_/.-][a-zA-Z0-9_/:.#?-]+(\1)$/;
const trimWhiteSpace = ['Gt', 'Gte', 'Lt', 'Lte'];
const funcLike = ['Start-parens', 'Func', 'UrlFunc', 'Pseudo-class-func'];
/**
 *
 * @param iterator
 * @param opt
 */
async function parse(iterator, opt = {}) {
    const startTime = performance.now();
    const errors = [];
    const options = {
        src: '',
        sourcemap: false,
        minify: true,
        nestingRules: false,
        resolveImport: false,
        resolveUrls: false,
        removeEmpty: true,
        ...opt
    };
    if (options.resolveImport) {
        options.resolveUrls = true;
    }
    const src = options.src;
    const stack = [];
    const ast = {
        typ: "StyleSheet",
        chi: []
    };
    let tokens = [];
    let map = new Map;
    let bytesIn = 0;
    let context = ast;
    if (options.sourcemap) {
        ast.loc = {
            sta: {
                ind: 0,
                lin: 1,
                col: 1
            },
            src: ''
        };
    }
    async function parseNode(results) {
        let tokens = results.map(mapToken);
        let i;
        let loc;
        for (i = 0; i < tokens.length; i++) {
            if (tokens[i].typ == 'Comment' || tokens[i].typ == 'CDOCOMM') {
                const position = map.get(tokens[i]);
                if (tokens[i].typ == 'CDOCOMM' && context.typ != 'StyleSheet') {
                    errors.push({ action: 'drop', message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`, location: { src, ...position } });
                    continue;
                }
                loc = {
                    sta: position,
                    src
                };
                // @ts-ignore
                context.chi.push(tokens[i]);
                if (options.sourcemap) {
                    tokens[i].loc = loc;
                }
            }
            else if (tokens[i].typ != 'Whitespace') {
                break;
            }
        }
        tokens = tokens.slice(i);
        if (tokens.length == 0) {
            return null;
        }
        let delim = tokens.at(-1);
        if (delim.typ == 'Semi-colon' || delim.typ == 'Block-start' || delim.typ == 'Block-end') {
            tokens.pop();
        }
        else {
            delim = { typ: 'Semi-colon' };
        }
        // @ts-ignore
        while (['Whitespace', 'Bad-string', 'Bad-comment'].includes(tokens.at(-1)?.typ)) {
            tokens.pop();
        }
        if (tokens.length == 0) {
            return null;
        }
        if (tokens[0]?.typ == 'At-rule') {
            const atRule = tokens.shift();
            const position = map.get(atRule);
            if (atRule.val == 'charset' && position.ind > 0) {
                errors.push({ action: 'drop', message: 'parse: invalid @charset', location: { src, ...position } });
                return null;
            }
            // @ts-ignore
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
                    errors.push({ action: 'drop', message: 'parse: invalid @import', location: { src, ...position } });
                    return null;
                }
                // @ts-ignore
                if (tokens[0].typ == 'UrlFunc' && tokens[1]?.typ != 'Url-token' && tokens[1]?.typ != 'String') {
                    errors.push({ action: 'drop', message: 'parse: invalid @import', location: { src, ...position } });
                    return null;
                }
            }
            if (atRule.val == 'import') {
                // @ts-ignore
                if (tokens[0].typ == 'UrlFunc' && tokens[1].typ == 'Url-token') {
                    tokens.shift();
                    // @ts-ignore
                    tokens[0].typ = 'String';
                    // @ts-ignore
                    tokens[0].val = `"${tokens[0].val}"`;
                }
                // @ts-ignore
                if (tokens[0].typ == 'String') {
                    if (options.resolveImport) {
                        const url = tokens[0].val.slice(1, -1);
                        try {
                            // @ts-ignore
                            const root = await options.load(url, options.src).then((src) => {
                                return parse(src, Object.assign({}, options, {
                                    minify: false,
                                    // @ts-ignore
                                    src: options.resolve(url, options.src).absolute
                                }));
                            });
                            bytesIn += root.stats.bytesIn;
                            if (root.ast.chi.length > 0) {
                                context.chi.push(...root.ast.chi);
                            }
                            if (root.errors.length > 0) {
                                errors.push(...root.errors);
                            }
                            return null;
                        }
                        catch (error) {
                            // @ts-ignore
                            errors.push({ action: 'ignore', message: 'parse: ' + error.message, error });
                        }
                    }
                }
            }
            // https://www.w3.org/TR/css-nesting-1/#conditionals
            // allowed nesting at-rules
            // there must be a top level rule in the stack
            const raw = parseTokens(tokens, { minify: options.minify }).reduce((acc, curr) => {
                acc.push(renderToken(curr, { removeComments: true }));
                return acc;
            }, []);
            const node = {
                typ: 'AtRule',
                nam: renderToken(atRule, { removeComments: true }),
                val: raw.join('')
            };
            Object.defineProperty(node, 'raw', { enumerable: false, configurable: true, writable: true, value: raw });
            if (delim.typ == 'Block-start') {
                node.chi = [];
            }
            loc = {
                sta: position,
                src
            };
            if (options.sourcemap) {
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
                const uniq = new Map;
                parseTokens(tokens, { minify: options.minify }).reduce((acc, curr, index, array) => {
                    if (curr.typ == 'Whitespace') {
                        if (trimWhiteSpace.includes(array[index - 1]?.typ) ||
                            trimWhiteSpace.includes(array[index + 1]?.typ) ||
                            combinators.includes(array[index - 1]?.val) ||
                            combinators.includes(array[index + 1]?.val)) {
                            return acc;
                        }
                    }
                    let t = renderToken(curr, { minify: true });
                    if (t == ',') {
                        acc.push([]);
                    }
                    else {
                        acc[acc.length - 1].push(t);
                    }
                    return acc;
                }, [[]]).reduce((acc, curr) => {
                    acc.set(curr.join(''), curr);
                    return acc;
                }, uniq);
                const node = {
                    typ: 'Rule',
                    // @ts-ignore
                    sel: [...uniq.keys()].join(','),
                    chi: []
                };
                let raw = [...uniq.values()];
                Object.defineProperty(node, 'raw', { enumerable: false, configurable: true, writable: true, value: raw });
                loc = {
                    sta: position,
                    src
                };
                if (options.sourcemap) {
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
                        value = parseTokens(tokens.slice(i + 1), {
                            parseColor: true,
                            src: options.src,
                            resolveUrls: options.resolveUrls,
                            resolve: options.resolve,
                            cwd: options.cwd
                        });
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
                                message: 'parse: invalid declaration',
                                location: { src, ...position }
                            });
                            return null;
                        }
                    }
                }
                if (value == null) {
                    errors.push({
                        action: 'drop',
                        message: 'parse: invalid declaration',
                        location: { src, ...position }
                    });
                    return null;
                }
                if (value.length == 0) {
                    errors.push({
                        action: 'drop',
                        message: 'parse: invalid declaration',
                        location: { src, ...position }
                    });
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
                    errors.push({
                        action: 'drop',
                        message: 'parse: invalid declaration',
                        location: { src, ...position }
                    });
                    return null;
                }
                // @ts-ignore
                context.chi.push(node);
                return null;
            }
        }
    }
    function mapToken(token) {
        const node = getTokenType(token.token, token.hint);
        map.set(node, token.position);
        return node;
    }
    const iter = tokenize(iterator);
    let item;
    while (item = iter.next().value) {
        bytesIn = item.bytesIn;
        // parse error
        if (item.hint != null && item.hint.startsWith('Bad-')) {
            // bad token
            continue;
        }
        tokens.push(item);
        if (item.token == ';' || item.token == '{') {
            let node = await parseNode(tokens);
            if (node != null) {
                stack.push(node);
                // @ts-ignore
                context = node;
            }
            else if (item.token == '{') {
                // node == null
                // consume and throw away until the closing '}' or EOF
                let inBlock = 1;
                do {
                    item = iter.next().value;
                    if (item == null) {
                        break;
                    }
                    if (item.token == '{') {
                        inBlock++;
                    }
                    else if (item.token == '}') {
                        inBlock--;
                    }
                } while (inBlock != 0);
            }
            tokens = [];
            map = new Map;
        }
        else if (item.token == '}') {
            await parseNode(tokens);
            const previousNode = stack.pop();
            // @ts-ignore
            context = stack[stack.length - 1] || ast;
            // @ts-ignore
            if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                context.chi.pop();
            }
            tokens = [];
            map = new Map;
        }
    }
    if (tokens.length > 0) {
        await parseNode(tokens);
    }
    while (stack.length > 0 && context != ast) {
        const previousNode = stack.pop();
        // @ts-ignore
        context = stack[stack.length - 1] || ast;
        // @ts-ignore
        if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
            context.chi.pop();
            continue;
        }
        break;
    }
    const endParseTime = performance.now();
    if (options.minify) {
        if (ast.chi.length > 0) {
            minify(ast, options, true, errors);
        }
    }
    const endTime = performance.now();
    return {
        ast,
        errors,
        stats: {
            bytesIn,
            parse: `${(endParseTime - startTime).toFixed(2)}ms`,
            minify: `${(endTime - endParseTime).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`
        }
    };
}
function parseString(src, options = { location: false }) {
    return parseTokens([...tokenize(src)].map(t => {
        const token = getTokenType(t.token, t.hint);
        if (options.location) {
            Object.assign(token, { loc: t.position });
        }
        return token;
    }));
}
function getTokenType(val, hint) {
    if (val === '' && hint == null) {
        throw new Error('empty string?');
    }
    if (hint != null) {
        return ([
            'Whitespace', 'Semi-colon', 'Colon', 'Block-start',
            'Block-start', 'Attr-start', 'Attr-end', 'Start-parens', 'End-parens',
            'Comma', 'Gt', 'Lt', 'Gte', 'Lte', 'EOF'
        ].includes(hint) ? { typ: hint } : { typ: hint, val });
    }
    if (val == ' ') {
        return { typ: 'Whitespace' };
    }
    if (val == ';') {
        return { typ: 'Semi-colon' };
    }
    if (val == '{') {
        return { typ: 'Block-start' };
    }
    if (val == '}') {
        return { typ: 'Block-end' };
    }
    if (val == '[') {
        return { typ: 'Attr-start' };
    }
    if (val == ']') {
        return { typ: 'Attr-end' };
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
    const v = val.toLowerCase();
    if (v == 'currentcolor' || val == 'transparent' || v in COLORS_NAMES) {
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
    if (val.charAt(0) == '#' && isHexColor(val)) {
        return {
            typ: 'Color',
            val,
            kin: 'hex'
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
function parseTokens(tokens, options = {}) {
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.typ == 'Whitespace' && ((i == 0 ||
            i + 1 == tokens.length ||
            ['Comma', 'Gte', 'Lte'].includes(tokens[i + 1].typ)) ||
            (i > 0 &&
                // tokens[i + 1]?.typ != 'Literal' ||
                // funcLike.includes(tokens[i - 1].typ) &&
                // !['var', 'calc'].includes((<FunctionToken>tokens[i - 1]).val)))) &&
                trimWhiteSpace.includes(tokens[i - 1].typ)))) {
            tokens.splice(i--, 1);
            continue;
        }
        if (t.typ == 'Colon') {
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
                    parseTokens(t.chi, t.typ);
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
            if (options.parseColor && t.typ == 'Func' && isColor(t)) {
                // if (isColor) {
                // @ts-ignore
                t.typ = 'Color';
                // @ts-ignore
                t.kin = t.val;
                // @ts-ignore
                let m = t.chi.length;
                while (m-- > 0) {
                    // @ts-ignore
                    if (['Literal'].concat(trimWhiteSpace).includes(t.chi[m].typ)) {
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
                continue;
                // }
            }
            if (t.typ == 'UrlFunc') {
                // @ts-ignore
                if (t.chi[0]?.typ == 'String') {
                    // @ts-ignore
                    const value = t.chi[0].val.slice(1, -1);
                    // @ts-ignore
                    if (t.chi[0].val.slice(1, 5) != 'data:' && urlTokenMatcher.test(value)) {
                        // @ts-ignore
                        t.chi[0].typ = 'Url-token';
                        // @ts-ignore
                        t.chi[0].val = options.src !== '' && options.resolveUrls ? options.resolve(value, options.src).absolute : value;
                    }
                }
                if (t.chi[0]?.typ == 'Url-token') {
                    if (options.src !== '' && options.resolveUrls) {
                        // @ts-ignore
                        t.chi[0].val = options.resolve(t.chi[0].val, options.src, options.cwd).relative;
                    }
                }
            }
            // @ts-ignore
            if (t.chi.length > 0) {
                // @ts-ignore
                parseTokens(t.chi, options);
                if (t.typ == 'Pseudo-class-func' && t.val == ':is' && options.minify) {
                    //
                    const count = t.chi.filter(t => t.typ != 'Comment').length;
                    if (count == 1 ||
                        (i == 0 &&
                            (tokens[i + 1]?.typ == 'Comma' || tokens.length == i + 1)) ||
                        (tokens[i - 1]?.typ == 'Comma' && (tokens[i + 1]?.typ == 'Comma' || tokens.length == i + 1))) {
                        tokens.splice(i, 1, ...t.chi);
                        i = Math.max(0, i - t.chi.length);
                    }
                }
            }
            continue;
        }
        if (options.parseColor) {
            if (t.typ == 'Iden') {
                // named color
                const value = t.val.toLowerCase();
                if (value in COLORS_NAMES) {
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
            }
        }
    }
    return tokens;
}

export { parse, parseString, urlTokenMatcher };
