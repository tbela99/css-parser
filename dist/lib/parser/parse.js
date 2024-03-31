import { isPseudo, isAtKeyword, isFunction, isNumber, isPercentage, isFlex, isDimension, parseDimension, isIdent, isHexColor, isHash, isIdentStart, isColor } from './utils/syntax.js';
import { EnumToken, funcLike } from '../ast/types.js';
import { minify, combinators } from '../ast/minify.js';
import { walkValues, walk } from '../ast/walk.js';
import { expand } from '../ast/expand.js';
import { parseDeclaration } from './utils/declaration.js';
import { renderToken } from '../renderer/render.js';
import { COLORS_NAMES } from '../renderer/color/utils/constants.js';
import { tokenize } from './tokenize.js';

const urlTokenMatcher = /^(["']?)[a-zA-Z0-9_/.-][a-zA-Z0-9_/:.#?-]+(\1)$/;
const trimWhiteSpace = [EnumToken.CommentTokenType, EnumToken.GtTokenType, EnumToken.GteTokenType, EnumToken.LtTokenType, EnumToken.LteTokenType, EnumToken.ColumnCombinatorTokenType];
const BadTokensTypes = [
    EnumToken.BadCommentTokenType,
    EnumToken.BadCdoTokenType,
    EnumToken.BadUrlTokenType,
    EnumToken.BadStringTokenType
];
const webkitPseudoAliasMap = {
    '-webkit-autofill': 'autofill'
};
async function doParse(iterator, options = {}) {
    return new Promise(async (resolve, reject) => {
        if (options.signal != null) {
            options.signal.addEventListener('abort', reject);
        }
        options = {
            src: '',
            sourcemap: false,
            minify: true,
            parseColor: true,
            nestingRules: false,
            resolveImport: false,
            resolveUrls: false,
            removeCharset: false,
            removeEmpty: true,
            removeDuplicateDeclarations: true,
            computeShorthand: true,
            computeCalcExpression: true,
            inlineCssVariables: false,
            ...options
        };
        if (options.expandNestingRules) {
            options.nestingRules = false;
        }
        if (options.resolveImport) {
            options.resolveUrls = true;
        }
        const startTime = performance.now();
        const errors = [];
        const src = options.src;
        const stack = [];
        const stats = {
            bytesIn: 0,
            importedBytesIn: 0,
            parse: `0ms`,
            minify: `0ms`,
            total: `0ms`
        };
        let ast = {
            typ: EnumToken.StyleSheetNodeType,
            chi: []
        };
        let tokens = [];
        let map = new Map;
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
        const iter = tokenize(iterator);
        let item;
        while (item = iter.next().value) {
            stats.bytesIn = item.bytesIn;
            //
            // doParse error
            if (item.hint != null && BadTokensTypes.includes(item.hint)) {
                // bad token
                continue;
            }
            if (item.hint != EnumToken.EOFTokenType) {
                tokens.push(item);
            }
            if (item.token == ';' || item.token == '{') {
                let node = await parseNode(tokens, context, stats, options, errors, src, map);
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
                await parseNode(tokens, context, stats, options, errors, src, map);
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
            await parseNode(tokens, context, stats, options, errors, src, map);
        }
        while (stack.length > 0 && context != ast) {
            const previousNode = stack.pop();
            // @ts-ignore
            context = stack[stack.length - 1] ?? ast;
            // @ts-ignore
            if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                context.chi.pop();
                continue;
            }
            break;
        }
        const endParseTime = performance.now();
        if (options.expandNestingRules) {
            ast = expand(ast);
        }
        if (options.visitor != null) {
            for (const result of walk(ast)) {
                if (result.node.typ == EnumToken.DeclarationNodeType &&
                    // @ts-ignore
                    (typeof options.visitor.Declaration == 'function' || options.visitor.Declaration?.[result.node.nam] != null)) {
                    const callable = typeof options.visitor.Declaration == 'function' ? options.visitor.Declaration : options.visitor.Declaration[result.node.nam];
                    const results = await callable(result.node);
                    if (results == null || (Array.isArray(results) && results.length == 0)) {
                        continue;
                    }
                    // @ts-ignore
                    result.parent.chi.splice(result.parent.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
                }
                else if (options.visitor.Rule != null && result.node.typ == EnumToken.RuleNodeType) {
                    const results = await options.visitor.Rule(result.node);
                    if (results == null || (Array.isArray(results) && results.length == 0)) {
                        continue;
                    }
                    // @ts-ignore
                    result.parent.chi.splice(result.parent.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
                }
                else if (options.visitor.AtRule != null &&
                    result.node.typ == EnumToken.AtRuleNodeType &&
                    // @ts-ignore
                    (typeof options.visitor.AtRule == 'function' || options.visitor.AtRule?.[result.node.nam] != null)) {
                    const callable = typeof options.visitor.AtRule == 'function' ? options.visitor.AtRule : options.visitor.AtRule[result.node.nam];
                    const results = await callable(result.node);
                    if (results == null || (Array.isArray(results) && results.length == 0)) {
                        continue;
                    }
                    // @ts-ignore
                    result.parent.chi.splice(result.parent.chi.indexOf(result.node), 1, ...(Array.isArray(results) ? results : [results]));
                }
            }
        }
        if (options.minify) {
            if (ast.chi.length > 0) {
                minify(ast, options, true, errors, false);
            }
        }
        const endTime = performance.now();
        if (options.signal != null) {
            options.signal.removeEventListener('abort', reject);
        }
        stats.bytesIn += stats.importedBytesIn;
        resolve({
            ast,
            errors,
            stats: {
                ...stats,
                parse: `${(endParseTime - startTime).toFixed(2)}ms`,
                minify: `${(endTime - endParseTime).toFixed(2)}ms`,
                total: `${(endTime - startTime).toFixed(2)}ms`
            }
        });
    });
}
async function parseNode(results, context, stats, options, errors, src, map) {
    let tokens = results.map((t) => mapToken(t, map));
    let i;
    let loc;
    for (i = 0; i < tokens.length; i++) {
        if (tokens[i].typ == EnumToken.CommentTokenType || tokens[i].typ == EnumToken.CDOCOMMTokenType) {
            const position = map.get(tokens[i]);
            if (tokens[i].typ == EnumToken.CDOCOMMTokenType && context.typ != EnumToken.StyleSheetNodeType) {
                errors.push({
                    action: 'drop',
                    message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                    location: { src, ...position }
                });
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
        else if (tokens[i].typ != EnumToken.WhitespaceTokenType) {
            break;
        }
    }
    tokens = tokens.slice(i);
    if (tokens.length == 0) {
        return null;
    }
    let delim = tokens.at(-1);
    if (delim.typ == EnumToken.SemiColonTokenType || delim.typ == EnumToken.BlockStartTokenType || delim.typ == EnumToken.BlockEndTokenType) {
        tokens.pop();
    }
    else {
        delim = { typ: EnumToken.SemiColonTokenType };
    }
    // @ts-ignore
    while ([EnumToken.WhitespaceTokenType, EnumToken.BadStringTokenType, EnumToken.BadCommentTokenType].includes(tokens.at(-1)?.typ)) {
        tokens.pop();
    }
    if (tokens.length == 0) {
        return null;
    }
    if (tokens[0]?.typ == EnumToken.AtRuleTokenType) {
        const atRule = tokens.shift();
        const position = map.get(atRule);
        if (atRule.val == 'charset') {
            if (position.ind > 0) {
                errors.push({
                    action: 'drop',
                    message: 'doParse: invalid @charset',
                    location: { src, ...position }
                });
                return null;
            }
            if (options.removeCharset) {
                return null;
            }
        }
        // @ts-ignore
        while ([EnumToken.WhitespaceTokenType].includes(tokens[0]?.typ)) {
            tokens.shift();
        }
        if (atRule.val == 'import') {
            // only @charset and @layer are accepted before @import
            if (context.chi.length > 0) {
                let i = context.chi.length;
                while (i--) {
                    const type = context.chi[i].typ;
                    if (type == EnumToken.CommentNodeType) {
                        continue;
                    }
                    if (type != EnumToken.AtRuleNodeType) {
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
            if (tokens[0]?.typ != EnumToken.StringTokenType && tokens[0]?.typ != EnumToken.UrlFunctionTokenType) {
                errors.push({
                    action: 'drop',
                    message: 'doParse: invalid @import',
                    location: { src, ...position }
                });
                return null;
            }
            // @ts-ignore
            if (tokens[0].typ == EnumToken.UrlFunctionTokenType && tokens[1]?.typ != EnumToken.UrlTokenTokenType && tokens[1]?.typ != EnumToken.StringTokenType) {
                errors.push({
                    action: 'drop',
                    message: 'doParse: invalid @import',
                    location: { src, ...position }
                });
                return null;
            }
        }
        if (atRule.val == 'import') {
            // @ts-ignore
            if (tokens[0].typ == EnumToken.UrlFunctionTokenType && tokens[1].typ == EnumToken.UrlTokenTokenType) {
                tokens.shift();
                // @ts-ignore
                tokens[0].typ = EnumToken.StringTokenType;
                // @ts-ignore
                tokens[0].val = `"${tokens[0].val}"`;
            }
            // @ts-ignore
            if (tokens[0].typ == EnumToken.StringTokenType) {
                if (options.resolveImport) {
                    const url = tokens[0].val.slice(1, -1);
                    try {
                        // @ts-ignore
                        const root = await options.load(url, options.src).then((src) => {
                            return doParse(src, Object.assign({}, options, {
                                minify: false,
                                // @ts-ignore
                                src: options.resolve(url, options.src).absolute
                            }));
                        });
                        stats.importedBytesIn += root.stats.bytesIn;
                        if (root.ast.chi.length > 0) {
                            // @todo - filter charset, layer and scope
                            context.chi.push(...root.ast.chi);
                        }
                        if (root.errors.length > 0) {
                            errors.push(...root.errors);
                        }
                        return null;
                    }
                    catch (error) {
                        // @ts-ignore
                        errors.push({ action: 'ignore', message: 'doParse: ' + error.message, error });
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
            typ: EnumToken.AtRuleNodeType,
            nam: renderToken(atRule, { removeComments: true }),
            val: raw.join('')
        };
        Object.defineProperty(node, 'raw', { enumerable: false, configurable: true, writable: true, value: raw });
        if (delim.typ == EnumToken.BlockStartTokenType) {
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
        return delim.typ == EnumToken.BlockStartTokenType ? node : null;
    }
    else {
        // rule
        if (delim.typ == EnumToken.BlockStartTokenType) {
            const position = map.get(tokens[0]);
            const uniq = new Map;
            parseTokens(tokens, { minify: true }).reduce((acc, curr, index, array) => {
                if (curr.typ == EnumToken.WhitespaceTokenType) {
                    if (trimWhiteSpace.includes(array[index - 1]?.typ) ||
                        trimWhiteSpace.includes(array[index + 1]?.typ) ||
                        combinators.includes(array[index - 1]?.val) ||
                        combinators.includes(array[index + 1]?.val)) {
                        return acc;
                    }
                }
                let t = renderToken(curr, { minify: false });
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
                typ: EnumToken.RuleNodeType,
                // @ts-ignore
                sel: [...uniq.keys()].join(','),
                chi: []
            };
            let raw = [...uniq.values()];
            Object.defineProperty(node, 'raw', {
                enumerable: false,
                configurable: true,
                writable: true,
                value: raw
            });
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
                if (tokens[i].typ == EnumToken.CommentTokenType) {
                    continue;
                }
                if (tokens[i].typ == EnumToken.ColonTokenType) {
                    name = tokens.slice(0, i);
                    value = parseTokens(tokens.slice(i + 1), {
                        parseColor: options.parseColor,
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
                    if (name[i].typ != EnumToken.WhitespaceTokenType && name[i].typ != EnumToken.CommentTokenType) {
                        errors.push({
                            action: 'drop',
                            message: 'doParse: invalid declaration',
                            location: { src, ...position }
                        });
                        return null;
                    }
                }
            }
            if (value == null || value.length == 0) {
                errors.push({
                    action: 'drop',
                    message: 'doParse: invalid declaration',
                    location: { src, ...position }
                });
                return null;
            }
            const node = {
                typ: EnumToken.DeclarationNodeType,
                // @ts-ignore
                nam: renderToken(name.shift(), { removeComments: true }),
                // @ts-ignore
                val: value
            };
            const result = parseDeclaration(node, errors, src, position);
            if (result != null) {
                // @ts-ignore
                context.chi.push(node);
            }
            return null;
        }
    }
}
function mapToken(token, map) {
    const node = getTokenType(token.token, token.hint);
    map.set(node, token.position);
    return node;
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
            EnumToken.WhitespaceTokenType, EnumToken.SemiColonTokenType, EnumToken.ColonTokenType, EnumToken.BlockStartTokenType,
            EnumToken.BlockStartTokenType, EnumToken.AttrStartTokenType, EnumToken.AttrEndTokenType, EnumToken.StartParensTokenType, EnumToken.EndParensTokenType,
            EnumToken.CommaTokenType, EnumToken.GtTokenType, EnumToken.LtTokenType, EnumToken.GteTokenType, EnumToken.LteTokenType, EnumToken.CommaTokenType,
            EnumToken.StartMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType, EnumToken.DashMatchTokenType, EnumToken.ContainMatchTokenType,
            EnumToken.EOFTokenType
        ].includes(hint) ? { typ: hint } : { typ: hint, val });
    }
    if (val == ' ') {
        return { typ: EnumToken.WhitespaceTokenType };
    }
    if (val == ';') {
        return { typ: EnumToken.SemiColonTokenType };
    }
    if (val == '{') {
        return { typ: EnumToken.BlockStartTokenType };
    }
    if (val == '}') {
        return { typ: EnumToken.BlockEndTokenType };
    }
    if (val == '[') {
        return { typ: EnumToken.AttrStartTokenType };
    }
    if (val == ']') {
        return { typ: EnumToken.AttrEndTokenType };
    }
    if (val == ':') {
        return { typ: EnumToken.ColonTokenType };
    }
    if (val == ')') {
        return { typ: EnumToken.EndParensTokenType };
    }
    if (val == '(') {
        return { typ: EnumToken.StartParensTokenType };
    }
    if (val == '=') {
        return { typ: EnumToken.DelimTokenType, val };
    }
    if (val == ';') {
        return { typ: EnumToken.SemiColonTokenType };
    }
    if (val == ',') {
        return { typ: EnumToken.CommaTokenType };
    }
    if (val == '<') {
        return { typ: EnumToken.LtTokenType };
    }
    if (val == '>') {
        return { typ: EnumToken.GtTokenType };
    }
    if (isPseudo(val)) {
        return val.endsWith('(') ? {
            typ: EnumToken.PseudoClassFuncTokenType,
            val: val.slice(0, -1),
            chi: []
        }
            : {
                typ: EnumToken.PseudoClassTokenType,
                val
            };
    }
    if (isAtKeyword(val)) {
        return {
            typ: EnumToken.AtRuleTokenType,
            val: val.slice(1)
        };
    }
    if (isFunction(val)) {
        val = val.slice(0, -1);
        if (val == 'url') {
            return {
                typ: EnumToken.UrlFunctionTokenType,
                val,
                chi: []
            };
        }
        if (['linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient', 'image', 'image-set', 'element', 'cross-fade'].includes(val)) {
            return {
                typ: EnumToken.ImageFunctionTokenType,
                val,
                chi: []
            };
        }
        if (['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end', 'steps', 'cubic-bezier'].includes(val)) {
            return {
                typ: EnumToken.TimingFunctionTokenType,
                val,
                chi: []
            };
        }
        if (['view', 'scroll'].includes(val)) {
            return {
                typ: EnumToken.TimelineFunctionTokenType,
                val,
                chi: []
            };
        }
        return {
            typ: EnumToken.FunctionTokenType,
            val,
            chi: []
        };
    }
    if (isNumber(val)) {
        return {
            typ: EnumToken.NumberTokenType,
            val
        };
    }
    if (isPercentage(val)) {
        return {
            typ: EnumToken.PercentageTokenType,
            val: val.slice(0, -1)
        };
    }
    if (isFlex(val)) {
        return {
            typ: EnumToken.FlexTokenType,
            val: val.slice(0, -2)
        };
    }
    if (isDimension(val)) {
        return parseDimension(val);
    }
    const v = val.toLowerCase();
    if (v == 'currentcolor' || val == 'transparent' || v in COLORS_NAMES) {
        return {
            typ: EnumToken.ColorTokenType,
            val,
            kin: 'lit'
        };
    }
    if (isIdent(val)) {
        return {
            typ: val.startsWith('--') ? EnumToken.DashedIdenTokenType : EnumToken.IdenTokenType,
            val
        };
    }
    if (val.charAt(0) == '#' && isHexColor(val)) {
        return {
            typ: EnumToken.ColorTokenType,
            val,
            kin: 'hex'
        };
    }
    if (val.charAt(0) == '#' && isHash(val)) {
        return {
            typ: EnumToken.HashTokenType,
            val
        };
    }
    if ('"\''.includes(val.charAt(0))) {
        return {
            typ: EnumToken.UnclosedStringTokenType,
            val
        };
    }
    return {
        typ: EnumToken.LiteralTokenType,
        val
    };
}
function parseTokens(tokens, options = {}) {
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.typ == EnumToken.WhitespaceTokenType && ((i == 0 ||
            i + 1 == tokens.length ||
            [EnumToken.CommaTokenType, EnumToken.GteTokenType, EnumToken.LteTokenType, EnumToken.ColumnCombinatorTokenType].includes(tokens[i + 1].typ)) ||
            (i > 0 &&
                // tokens[i + 1]?.typ != Literal ||
                // funcLike.includes(tokens[i - 1].typ) &&
                // !['var', 'calc'].includes((<FunctionToken>tokens[i - 1]).val)))) &&
                trimWhiteSpace.includes(tokens[i - 1].typ)))) {
            tokens.splice(i--, 1);
            continue;
        }
        if (t.typ == EnumToken.ColonTokenType) {
            const typ = tokens[i + 1]?.typ;
            if (typ != null) {
                if (typ == EnumToken.FunctionTokenType) {
                    tokens[i + 1].val = ':' + tokens[i + 1].val;
                    tokens[i + 1].typ = EnumToken.PseudoClassFuncTokenType;
                }
                else if (typ == EnumToken.IdenTokenType) {
                    if (tokens[i + 1].val in webkitPseudoAliasMap) {
                        tokens[i + 1].val = webkitPseudoAliasMap[tokens[i + 1].val];
                    }
                    tokens[i + 1].val = ':' + tokens[i + 1].val;
                    tokens[i + 1].typ = EnumToken.PseudoClassTokenType;
                }
                if (typ == EnumToken.FunctionTokenType || typ == EnumToken.IdenTokenType) {
                    tokens.splice(i, 1);
                    i--;
                }
            }
            continue;
        }
        if (t.typ == EnumToken.AttrStartTokenType) {
            let k = i;
            let inAttr = 1;
            while (++k < tokens.length) {
                if (tokens[k].typ == EnumToken.AttrEndTokenType) {
                    inAttr--;
                }
                else if (tokens[k].typ == EnumToken.AttrStartTokenType) {
                    inAttr++;
                }
                if (inAttr == 0) {
                    break;
                }
            }
            Object.assign(t, { typ: EnumToken.AttrTokenType, chi: tokens.splice(i + 1, k - i) });
            // @ts-ignore
            if (t.chi.at(-1).typ == EnumToken.AttrEndTokenType) {
                // @ts-ignore
                t.chi.pop();
            }
            // @ts-ignore
            if (t.chi.length > 1) {
                /*(<AttrToken>t).chi =*/
                // @ts-ignore
                parseTokens(t.chi, t.typ);
            }
            let m = t.chi.length;
            let val;
            for (m = 0; m < t.chi.length; m++) {
                val = t.chi[m];
                if (val.typ == EnumToken.StringTokenType) {
                    const slice = val.val.slice(1, -1);
                    if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                        Object.assign(val, { typ: EnumToken.IdenTokenType, val: slice });
                    }
                }
                else if (val.typ == EnumToken.LiteralTokenType && val.val == '|') {
                    let upper = m;
                    let lower = m;
                    while (++upper < t.chi.length) {
                        if (t.chi[upper].typ == EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    while (lower-- > 0) {
                        if (t.chi[lower].typ == EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    // @ts-ignore
                    t.chi[m] = {
                        typ: EnumToken.NameSpaceAttributeTokenType,
                        l: t.chi[lower],
                        r: t.chi[upper]
                    };
                    t.chi.splice(upper, 1);
                    if (lower >= 0) {
                        t.chi.splice(lower, 1);
                        m--;
                    }
                }
                else if ([
                    EnumToken.DashMatchTokenType, EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType
                ].includes(t.chi[m].typ)) {
                    let upper = m;
                    let lower = m;
                    while (++upper < t.chi.length) {
                        if (t.chi[upper].typ == EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    while (lower-- > 0) {
                        if (t.chi[lower].typ == EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    val = t.chi[lower];
                    if (val.typ == EnumToken.StringTokenType) {
                        const slice = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, { typ: EnumToken.IdenTokenType, val: slice });
                        }
                    }
                    val = t.chi[upper];
                    if (val.typ == EnumToken.StringTokenType) {
                        const slice = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, { typ: EnumToken.IdenTokenType, val: slice });
                        }
                    }
                    t.chi[m] = {
                        typ: EnumToken.MatchExpressionTokenType,
                        op: t.chi[m].typ,
                        l: t.chi[lower],
                        r: t.chi[upper]
                    };
                    t.chi.splice(upper, 1);
                    t.chi.splice(lower, 1);
                    upper = m;
                    m--;
                    while (upper < t.chi.length && t.chi[upper].typ == EnumToken.WhitespaceTokenType) {
                        upper++;
                    }
                    if (upper < t.chi.length &&
                        t.chi[upper].typ == EnumToken.Iden &&
                        ['i', 's'].includes(t.chi[upper].val.toLowerCase())) {
                        t.chi[m].attr = t.chi[upper].val;
                        t.chi.splice(upper, 1);
                    }
                }
            }
            m = t.chi.length;
            while (t.chi.at(-1)?.typ == EnumToken.WhitespaceTokenType) {
                t.chi.pop();
            }
            continue;
        }
        if (funcLike.includes(t.typ)) {
            let parens = 1;
            let k = i;
            while (++k < tokens.length) {
                if (tokens[k].typ == EnumToken.ColonTokenType) {
                    const typ = tokens[k + 1]?.typ;
                    if (typ != null) {
                        if (typ == EnumToken.IdenTokenType) {
                            tokens[k + 1].typ = EnumToken.PseudoClassTokenType;
                            tokens[k + 1].val = ':' + tokens[k + 1].val;
                        }
                        else if (typ == EnumToken.FunctionTokenType) {
                            tokens[k + 1].typ = EnumToken.PseudoClassFuncTokenType;
                            tokens[k + 1].val = ':' + tokens[k + 1].val;
                        }
                        if (typ == EnumToken.FunctionTokenType || typ == EnumToken.IdenTokenType) {
                            tokens.splice(k, 1);
                            k--;
                            continue;
                        }
                    }
                }
                if (funcLike.includes(tokens[k].typ)) {
                    parens++;
                }
                else if (tokens[k].typ == EnumToken.EndParensTokenType) {
                    parens--;
                }
                if (parens == 0) {
                    break;
                }
            }
            // @ts-ignore
            t.chi = tokens.splice(i + 1, k - i);
            // @ts-ignore
            if (t.chi.at(-1)?.typ == EnumToken.EndParensTokenType) {
                // @ts-ignore
                t.chi.pop();
            }
            // @ts-ignore
            if (t.chi.length > 0) {
                // @ts-ignore
                parseTokens(t.chi, options);
            }
            if (t.typ == EnumToken.FunctionTokenType && t.val == 'calc') {
                for (const { value, parent } of walkValues(t.chi)) {
                    if (value.typ == EnumToken.WhitespaceTokenType) {
                        const p = (parent ?? t);
                        for (let i = 0; i < (p).chi.length; i++) {
                            // @ts-ignore
                            if (p.chi[i] == value) {
                                // @ts-ignore
                                (p).chi.splice(i, 1);
                                i--;
                                break;
                            }
                        }
                    }
                    else if (value.typ == EnumToken.LiteralTokenType && ['+', '-', '/', '*'].includes(value.val)) {
                        // @ts-ignore
                        value.typ = value.val == '+' ? EnumToken.Add : (value.val == '-' ? EnumToken.Sub : (value.val == '*' ? EnumToken.Mul : EnumToken.Div));
                        // @ts-ignore
                        delete value.val;
                    }
                }
            }
            else if (t.typ == EnumToken.FunctionTokenType && ['minmax', 'fit-content', 'repeat'].includes(t.val)) {
                // @ts-ignore
                t.typ = EnumToken.GridTemplateFuncTokenType;
            }
            else if (t.typ == EnumToken.StartParensTokenType) {
                // @ts-ignore
                t.typ = EnumToken.ParensTokenType;
            }
            // @ts-ignore
            if (options.parseColor && t.typ == EnumToken.FunctionTokenType && isColor(t)) {
                // @ts-ignore
                t.typ = EnumToken.ColorTokenType;
                // @ts-ignore
                t.kin = t.val;
                if (t.chi[0].typ == EnumToken.IdenTokenType) {
                    if (t.chi[0].val == 'from') {
                        // @ts-ignore
                        t.cal = 'rel';
                    }
                    // @ts-ignore
                    else if (t.val == 'color-mix' && t.chi[0].val == 'in') {
                        // @ts-ignore
                        t.cal = 'mix';
                    }
                    else if (t.val == 'color') {
                        // @ts-ignore
                        t.cal = 'col';
                        // t.chi = t.chi.filter((t: Token) => [EnumToken.IdenTokenType, EnumToken.NumberTokenType, EnumToken.PercentageTokenType].includes(t.typ));
                    }
                }
                t.chi = t.chi.filter((t) => ![EnumToken.WhitespaceTokenType, EnumToken.CommaTokenType, EnumToken.CommentTokenType].includes(t.typ));
                continue;
            }
            if (t.typ == EnumToken.UrlFunctionTokenType) {
                // @ts-ignore
                if (t.chi[0]?.typ == EnumToken.StringTokenType) {
                    // @ts-ignore
                    const value = t.chi[0].val.slice(1, -1);
                    // @ts-ignore
                    if (t.chi[0].val.slice(1, 5) != 'data:' && urlTokenMatcher.test(value)) {
                        // @ts-ignore
                        t.chi[0].typ = EnumToken.UrlTokenTokenType;
                        // @ts-ignore
                        t.chi[0].val = options.src !== '' && options.resolveUrls ? options.resolve(value, options.src).absolute : value;
                    }
                }
                if (t.chi[0]?.typ == EnumToken.UrlTokenTokenType) {
                    if (options.src !== '' && options.resolveUrls) {
                        // @ts-ignore
                        t.chi[0].val = options.resolve(t.chi[0].val, options.src, options.cwd).relative;
                    }
                }
            }
            // @ts-ignore
            if (t.chi.length > 0) {
                if (t.typ == EnumToken.PseudoClassFuncTokenType && t.val == ':is' && options.minify) {
                    //
                    const count = t.chi.filter(t => t.typ != EnumToken.CommentTokenType).length;
                    if (count == 1 ||
                        (i == 0 &&
                            (tokens[i + 1]?.typ == EnumToken.CommaTokenType || tokens.length == i + 1)) ||
                        (tokens[i - 1]?.typ == EnumToken.CommaTokenType && (tokens[i + 1]?.typ == EnumToken.CommaTokenType || tokens.length == i + 1))) {
                        tokens.splice(i, 1, ...t.chi);
                        i = Math.max(0, i - t.chi.length);
                    }
                }
            }
            continue;
        }
        if (options.parseColor) {
            if (t.typ == EnumToken.IdenTokenType) {
                // named color
                const value = t.val.toLowerCase();
                if (value in COLORS_NAMES) {
                    Object.assign(t, {
                        typ: EnumToken.ColorTokenType,
                        val: COLORS_NAMES[value].length < value.length ? COLORS_NAMES[value] : value,
                        kin: 'hex'
                    });
                }
                continue;
            }
            if (t.typ == EnumToken.HashTokenType && isHexColor(t.val)) {
                // hex color
                // @ts-ignore
                t.typ = EnumToken.ColorTokenType;
                // @ts-ignore
                t.kin = 'hex';
            }
        }
    }
    return tokens;
}

export { doParse, parseString, parseTokens, urlTokenMatcher };
