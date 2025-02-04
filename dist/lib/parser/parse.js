import { isPseudo, isAtKeyword, isFunction, isNumber, isPercentage, isFlex, isDimension, parseDimension, isIdent, isHexColor, isHash, isIdentStart, mathFuncs, isColor, mediaTypes } from '../syntax/syntax.js';
import './utils/config.js';
import { EnumToken, funcLike, ValidationLevel } from '../ast/types.js';
import { minify, definedPropertySettings, combinators } from '../ast/minify.js';
import { walkValues, walk } from '../ast/walk.js';
import { expand } from '../ast/expand.js';
import { parseDeclarationNode } from './utils/declaration.js';
import { renderToken } from '../renderer/render.js';
import { COLORS_NAMES, systemColors, deprecatedSystemColors } from '../renderer/color/utils/constants.js';
import { tokenize } from './tokenize.js';
import '../validation/config.js';
import '../validation/parser/types.js';
import '../validation/parser/parse.js';
import { validateSelector } from '../validation/selector.js';
import { validateAtRule } from '../validation/atrule.js';

const urlTokenMatcher = /^(["']?)[a-zA-Z0-9_/.-][a-zA-Z0-9_/:.#?-]+(\1)$/;
const trimWhiteSpace = [EnumToken.CommentTokenType, EnumToken.GtTokenType, EnumToken.GteTokenType, EnumToken.LtTokenType, EnumToken.LteTokenType, EnumToken.ColumnCombinatorTokenType];
const BadTokensTypes = [
    EnumToken.BadCommentTokenType,
    EnumToken.BadCdoTokenType,
    EnumToken.BadUrlTokenType,
    EnumToken.BadStringTokenType
];
const enumTokenHints = new Set([
    EnumToken.WhitespaceTokenType, EnumToken.SemiColonTokenType, EnumToken.ColonTokenType, EnumToken.BlockStartTokenType,
    EnumToken.BlockStartTokenType, EnumToken.AttrStartTokenType, EnumToken.AttrEndTokenType, EnumToken.StartParensTokenType, EnumToken.EndParensTokenType,
    EnumToken.CommaTokenType, EnumToken.GtTokenType, EnumToken.LtTokenType, EnumToken.GteTokenType, EnumToken.LteTokenType, EnumToken.CommaTokenType,
    EnumToken.StartMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType, EnumToken.DashMatchTokenType, EnumToken.ContainMatchTokenType,
    EnumToken.EOFTokenType
]);
const webkitPseudoAliasMap = {
    '-webkit-autofill': 'autofill',
    '-webkit-any': 'is',
    '-moz-any': 'is',
    '-webkit-border-after': 'border-block-end',
    '-webkit-border-after-color': 'border-block-end-color',
    '-webkit-border-after-style': 'border-block-end-style',
    '-webkit-border-after-width': 'border-block-end-width',
    '-webkit-border-before': 'border-block-start',
    '-webkit-border-before-color': 'border-block-start-color',
    '-webkit-border-before-style': 'border-block-start-style',
    '-webkit-border-before-width': 'border-block-start-width',
    '-webkit-border-end': 'border-inline-end',
    '-webkit-border-end-color': 'border-inline-end-color',
    '-webkit-border-end-style': 'border-inline-end-style',
    '-webkit-border-end-width': 'border-inline-end-width',
    '-webkit-border-start': 'border-inline-start',
    '-webkit-border-start-color': 'border-inline-start-color',
    '-webkit-border-start-style': 'border-inline-start-style',
    '-webkit-border-start-width': 'border-inline-start-width',
    '-webkit-box-align': 'align-items',
    '-webkit-box-direction': 'flex-direction',
    '-webkit-box-flex': 'flex-grow',
    '-webkit-box-lines': 'flex-flow',
    '-webkit-box-ordinal-group': 'order',
    '-webkit-box-orient': 'flex-direction',
    '-webkit-box-pack': 'justify-content',
    '-webkit-column-break-after': 'break-after',
    '-webkit-column-break-before': 'break-before',
    '-webkit-column-break-inside': 'break-inside',
    '-webkit-font-feature-settings': 'font-feature-settings',
    '-webkit-hyphenate-character': 'hyphenate-character',
    '-webkit-initial-letter': 'initial-letter',
    '-webkit-margin-end': 'margin-block-end',
    '-webkit-margin-start': 'margin-block-start',
    '-webkit-padding-after': 'padding-block-end',
    '-webkit-padding-before': 'padding-block-start',
    '-webkit-padding-end': 'padding-inline-end',
    '-webkit-padding-start': 'padding-inline-start',
    '-webkit-min-device-pixel-ratio': 'min-resolution',
    '-webkit-max-device-pixel-ratio': 'max-resolution'
};
function reject(reason) {
    throw new Error(reason ?? 'Parsing aborted');
}
async function doParse(iterator, options = {}) {
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
        removeCharset: true,
        removeEmpty: true,
        removeDuplicateDeclarations: true,
        computeShorthand: true,
        computeCalcExpression: true,
        inlineCssVariables: false,
        setParent: true,
        removePrefix: false,
        validation: true,
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
    const rawTokens = [];
    while (item = iter.next().value) {
        stats.bytesIn = item.bytesIn;
        rawTokens.push(item);
        // doParse error
        if (item.hint != null && BadTokensTypes.includes(item.hint)) {
            // bad token
            continue;
        }
        if (item.hint != EnumToken.EOFTokenType) {
            tokens.push(item);
        }
        if (item.token == ';' || item.token == '{') {
            let node = await parseNode(tokens, context, stats, options, errors, src, map, rawTokens);
            rawTokens.length = 0;
            if (node != null) {
                // @ts-ignore
                stack.push(node);
                // @ts-ignore
                context = node;
            }
            else if (item.token == '{') {
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
            await parseNode(tokens, context, stats, options, errors, src, map, rawTokens);
            rawTokens.length = 0;
            const previousNode = stack.pop();
            // @ts-ignore
            context = stack[stack.length - 1] ?? ast;
            // @ts-ignore
            if (previousNode != null && previousNode.typ == EnumToken.InvalidRuleTokenType) {
                // @ts-ignore
                const index = context.chi.findIndex(node => node == previousNode);
                if (index > -1) {
                    // @ts-ignore
                    context.chi.splice(index, 1);
                }
            }
            // @ts-ignore
            if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                // @ts-ignore
                context.chi.pop();
            }
            tokens = [];
            map = new Map;
        }
    }
    if (tokens.length > 0) {
        await parseNode(tokens, context, stats, options, errors, src, map, rawTokens);
        rawTokens.length = 0;
        if (context != null && context.typ == EnumToken.InvalidRuleTokenType) {
            const index = context.chi.findIndex(node => node == context);
            if (index > -1) {
                context.chi.splice(index, 1);
            }
        }
    }
    while (stack.length > 0 && context != ast) {
        const previousNode = stack.pop();
        // @ts-ignore
        context = stack[stack.length - 1] ?? ast;
        // @ts-ignore
        if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
            // @ts-ignore
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
    // if (options.setParent) {
    //
    //     const nodes: Array<AstRule | AstAtRule | AstRuleStyleSheet> = [ast];
    //     let node: AstNode;
    //
    //     while ((node = nodes.shift()!)) {
    //
    //         // @ts-ignore
    //         if (node.chi.length > 0) {
    //
    //             // @ts-ignore
    //             for (const child of node.chi) {
    //
    //                 if (child.parent != node) {
    //
    //                     Object.defineProperty(child, 'parent', {...definedPropertySettings, value: node});
    //                 }
    //
    //                 if ('chi' in child && child.chi.length > 0) {
    //
    //                     // @ts-ignore
    //                     nodes.push(<AstRule | AstAtRule>child);
    //                 }
    //             }
    //         }
    //     }
    // }
    const endTime = performance.now();
    if (options.signal != null) {
        options.signal.removeEventListener('abort', reject);
    }
    stats.bytesIn += stats.importedBytesIn;
    return {
        ast,
        errors,
        stats: {
            ...stats,
            parse: `${(endParseTime - startTime).toFixed(2)}ms`,
            minify: `${(endTime - endParseTime).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`
        }
    };
}
function getLastNode(context) {
    let i = context.chi.length;
    while (i--) {
        if ([EnumToken.CommentTokenType, EnumToken.CDOCOMMTokenType, EnumToken.WhitespaceTokenType].includes(context.chi[i].typ)) {
            continue;
        }
        return context.chi[i];
    }
    return null;
}
async function parseNode(results, context, stats, options, errors, src, map, rawTokens) {
    let tokens = [];
    for (const t of results) {
        const node = getTokenType(t.token, t.hint);
        map.set(node, t.position);
        tokens.push(node);
    }
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
        // @ts-ignore
        while ([EnumToken.WhitespaceTokenType].includes(tokens[0]?.typ)) {
            tokens.shift();
        }
        if (atRule.val == 'import') {
            // only @charset and @layer are accepted before @import
            // @ts-ignore
            if (context.chi.length > 0) {
                // @ts-ignore
                let i = context.chi.length;
                while (i--) {
                    // @ts-ignore
                    const type = context.chi[i].typ;
                    if (type == EnumToken.CommentNodeType) {
                        continue;
                    }
                    if (type != EnumToken.AtRuleNodeType) {
                        errors.push({ action: 'drop', message: 'invalid @import', location: { src, ...position } });
                        return null;
                    }
                    // @ts-ignore
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
            if (tokens[0].typ == EnumToken.UrlFunctionTokenType) {
                if (tokens[1].typ == EnumToken.UrlTokenTokenType || tokens[1].typ == EnumToken.StringTokenType) {
                    tokens.shift();
                    if (tokens[1].typ == EnumToken.UrlTokenTokenType) {
                        // @ts-ignore
                        tokens[0].typ = EnumToken.StringTokenType;
                        // @ts-ignore
                        tokens[0].val = `"${tokens[0].val}"`;
                    }
                }
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
                                setParent: false,
                                // @ts-ignore
                                src: options.resolve(url, options.src).absolute
                            }));
                        });
                        stats.importedBytesIn += root.stats.bytesIn;
                        if (root.ast.chi.length > 0) {
                            // @todo - filter charset, layer and scope
                            // @ts-ignore
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
        if (atRule.val == 'charset') {
            let spaces = 0;
            for (let k = 1; k < rawTokens.length; k++) {
                if (rawTokens[k].hint == EnumToken.WhitespaceTokenType) {
                    spaces += rawTokens[k].len;
                    continue;
                }
                if (rawTokens[k].hint == EnumToken.CommentTokenType) {
                    continue;
                }
                if (rawTokens[k].hint == EnumToken.CDOCOMMTokenType) {
                    continue;
                }
                if (spaces > 1) {
                    errors.push({
                        action: 'drop',
                        message: '@charset must have only one space',
                        // @ts-ignore
                        location: { src, ...(map.get(atRule) ?? position) }
                    });
                    return null;
                }
                if (rawTokens[k].hint != EnumToken.StringTokenType || rawTokens[k].token[0] != '"') {
                    errors.push({
                        action: 'drop',
                        message: '@charset expects a "<charset>"',
                        // @ts-ignore
                        location: { src, ...(map.get(atRule) ?? position) }
                    });
                    return null;
                }
                break;
            }
            if (options.removeCharset) {
                return null;
            }
        }
        const t = parseAtRulePrelude(parseTokens(tokens, { minify: options.minify }), atRule);
        const raw = t.reduce((acc, curr) => {
            acc.push(renderToken(curr, { removeComments: true }));
            return acc;
        }, []);
        const node = {
            typ: EnumToken.AtRuleNodeType,
            nam: renderToken(atRule, { removeComments: true }),
            tokens: t,
            val: raw.join('')
        };
        Object.defineProperties(node, {
            tokens: { ...definedPropertySettings, enumerable: true, value: tokens.slice() },
            raw: { ...definedPropertySettings, value: raw }
        });
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
        if (options.validation) {
            let isValid = true;
            if (node.nam == 'else') {
                const prev = getLastNode(context);
                if (prev != null && prev.typ == EnumToken.AtRuleNodeType && ['when', 'else'].includes(prev.nam)) {
                    if (prev.nam == 'else') {
                        isValid = Array.isArray(prev.tokens) && prev.tokens.length > 0;
                    }
                }
                else {
                    isValid = false;
                }
            }
            const valid = isValid ? validateAtRule(node, options, context) : {
                valid: ValidationLevel.Drop,
                node,
                matches: [],
                syntax: '@' + node.nam,
                error: '@' + node.nam + ' not allowed here',
                tokens
            };
            if (valid.valid == ValidationLevel.Drop) {
                errors.push({
                    action: 'drop',
                    message: valid.error + ' - "' + tokens.reduce((acc, curr) => acc + renderToken(curr, { minify: false }), '') + '"',
                    // @ts-ignore
                    location: { src, ...(map.get(valid.node) ?? position) }
                });
                // @ts-ignore
                node.typ = EnumToken.InvalidAtRuleTokenType;
            }
            else {
                node.val = node.tokens.reduce((acc, curr) => acc + renderToken(curr, { minify: false, removeComments: true }), '');
            }
        }
        // @ts-ignore
        context.chi.push(node);
        Object.defineProperty(node, 'parent', { ...definedPropertySettings, value: context });
        return delim.typ == EnumToken.BlockStartTokenType ? node : null;
    }
    else {
        // rule
        if (delim.typ == EnumToken.BlockStartTokenType) {
            const position = map.get(tokens[0]);
            const uniq = new Map;
            parseTokens(tokens, { minify: true }).reduce((acc, curr, index, array) => {
                if (curr.typ == EnumToken.CommentTokenType) {
                    return acc;
                }
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
                    // uniqTokens.push([]);
                }
                else {
                    acc[acc.length - 1].push(t);
                    // uniqTokens[uniqTokens.length - 1].push(curr);
                }
                return acc;
            }, [[]]).reduce((acc, curr) => {
                let i = 0;
                for (; i < curr.length; i++) {
                    if (i + 1 < curr.length && curr[i] == '*') {
                        if (curr[i] == '*') {
                            let index = curr[i + 1] == ' ' ? 2 : 1;
                            if (!['>', '~', '+'].includes(curr[index])) {
                                curr.splice(i, index);
                            }
                        }
                    }
                }
                acc.set(curr.join(''), curr);
                return acc;
            }, uniq);
            const ruleType = context.typ == EnumToken.AtRuleNodeType && context.nam == 'keyframes' ? EnumToken.KeyFrameRuleNodeType : EnumToken.RuleNodeType;
            if (ruleType == EnumToken.RuleNodeType) {
                parseSelector(tokens);
                if (options.validation) {
                    // @ts-ignore
                    const valid = validateSelector(tokens, options, context);
                    if (valid.valid != ValidationLevel.Valid) {
                        const node = {
                            typ: EnumToken.InvalidRuleTokenType,
                            // @ts-ignore
                            sel: tokens.reduce((acc, curr) => acc + renderToken(curr, { minify: false }), ''),
                            chi: []
                        };
                        errors.push({
                            action: 'drop',
                            message: valid.error + ' - "' + tokens.reduce((acc, curr) => acc + renderToken(curr, { minify: false }), '') + '"',
                            // @ts-ignore
                            location: { src, ...(map.get(valid.node) ?? position) }
                        });
                        // @ts-ignore
                        context.chi.push(node);
                        Object.defineProperty(node, 'parent', { ...definedPropertySettings, value: context });
                        return node;
                    }
                }
            }
            const node = {
                typ: ruleType,
                sel: [...uniq.keys()].join(','),
                chi: []
            };
            Object.defineProperty(node, 'tokens', {
                ...definedPropertySettings,
                enumerable: true,
                value: tokens.slice()
            });
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
            Object.defineProperty(node, 'parent', { ...definedPropertySettings, value: context });
            return node;
        }
        else {
            let name = null;
            let value = null;
            for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].typ == EnumToken.CommentTokenType) {
                    continue;
                }
                if (name == null && [EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType].includes(tokens[i].typ)) {
                    name = tokens.slice(0, i + 1);
                }
                else if (name != null && funcLike.concat([
                    EnumToken.LiteralTokenType,
                    EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType,
                    EnumToken.PseudoClassTokenType, EnumToken.PseudoClassFuncTokenType
                ]).includes(tokens[i].typ)) {
                    if (tokens[i].val.charAt(0) == ':') {
                        Object.assign(tokens[i], getTokenType(tokens[i].val.slice(1)));
                    }
                    if ('chi' in tokens[i]) {
                        tokens[i].typ = EnumToken.FunctionTokenType;
                    }
                    value = parseTokens(tokens.slice(i), {
                        parseColor: options.parseColor,
                        src: options.src,
                        resolveUrls: options.resolveUrls,
                        resolve: options.resolve,
                        cwd: options.cwd
                    });
                    break;
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
                    break;
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
            const result = parseDeclarationNode(node, errors, src, position);
            if (result != null) {
                if (options.validation) ;
                // @ts-ignore
                context.chi.push(result);
                Object.defineProperty(result, 'parent', { ...definedPropertySettings, value: context });
            }
            return null;
        }
    }
}
function parseAtRulePrelude(tokens, atRule) {
    // @ts-ignore
    for (const { value, parent } of walkValues(tokens, null, null, true)) {
        if (value.typ == EnumToken.CommentTokenType ||
            value.typ == EnumToken.WhitespaceTokenType ||
            value.typ == EnumToken.CommaTokenType) {
            continue;
        }
        if (atRule.val == 'page' && value.typ == EnumToken.PseudoClassTokenType) {
            if ([':left', ':right', ':first', ':blank'].includes(value.val)) {
                // @ts-ignore
                value.typ = EnumToken.PseudoPageTokenType;
            }
        }
        if (atRule.val == 'layer') {
            if (parent == null && value.typ == EnumToken.LiteralTokenType) {
                if (value.val.charAt(0) == '.') {
                    if (isIdent(value.val.slice(1))) {
                        // @ts-ignore
                        value.typ = EnumToken.ClassSelectorTokenType;
                    }
                }
            }
        }
        if (value.typ == EnumToken.IdenTokenType) {
            if (parent == null && mediaTypes.some((t) => {
                if (value.val.localeCompare(t, 'en', { sensitivity: 'base' }) == 0) {
                    // @ts-ignore
                    value.typ = EnumToken.MediaFeatureTokenType;
                    return true;
                }
                return false;
            })) {
                continue;
            }
            if (value.typ == EnumToken.IdenTokenType && 'and'.localeCompare(value.val, 'en', { sensitivity: 'base' }) == 0) {
                // @ts-ignore
                value.typ = EnumToken.MediaFeatureAndTokenType;
                continue;
            }
            if (value.typ == EnumToken.IdenTokenType && 'or'.localeCompare(value.val, 'en', { sensitivity: 'base' }) == 0) {
                // @ts-ignore
                value.typ = EnumToken.MediaFeatureOrTokenType;
                continue;
            }
            if (value.typ == EnumToken.IdenTokenType &&
                ['not', 'only'].some((t) => t.localeCompare(value.val, 'en', { sensitivity: 'base' }) == 0)) {
                // @ts-ignore
                const array = parent?.chi ?? tokens;
                const startIndex = array.indexOf(value);
                let index = startIndex + 1;
                if (index == 0) {
                    continue;
                }
                while (index < array.length && [EnumToken.CommentTokenType, EnumToken.WhitespaceTokenType].includes(array[index].typ)) {
                    index++;
                }
                if (array[index] == null || array[index].typ == EnumToken.CommaTokenType) {
                    continue;
                }
                Object.assign(array[startIndex], {
                    typ: value.val.toLowerCase() == 'not' ? EnumToken.MediaFeatureNotTokenType : EnumToken.MediaFeatureOnlyTokenType,
                    val: array[index]
                });
                array.splice(startIndex + 1, index - startIndex);
                continue;
            }
        }
        if (value.typ == EnumToken.ParensTokenType || (value.typ == EnumToken.FunctionTokenType && ['media', 'supports', 'style', 'scroll-state'].includes(value.val))) {
            // @todo parse range and declarations
            // parseDeclaration(parent.chi);
            let i;
            let nameIndex = -1;
            let valueIndex = -1;
            const dashedIdent = value.typ == EnumToken.FunctionTokenType && value.val == 'style';
            for (let i = 0; i < value.chi.length; i++) {
                if (value.chi[i].typ == EnumToken.CommentTokenType || value.chi[i].typ == EnumToken.WhitespaceTokenType) {
                    continue;
                }
                if ((dashedIdent && value.chi[i].typ == EnumToken.DashedIdenTokenType) || value.chi[i].typ == EnumToken.IdenTokenType || value.chi[i].typ == EnumToken.FunctionTokenType || value.chi[i].typ == EnumToken.ColorTokenType) {
                    nameIndex = i;
                }
                break;
            }
            if (nameIndex == -1) {
                continue;
            }
            for (let i = nameIndex + 1; i < value.chi.length; i++) {
                if (value.chi[i].typ == EnumToken.CommentTokenType || value.chi[i].typ == EnumToken.WhitespaceTokenType) {
                    continue;
                }
                valueIndex = i;
                break;
            }
            if (valueIndex == -1) {
                // @ts-ignore
                // value.chi[nameIndex].typ = EnumToken.MediaFeatureTokenType;
                continue;
                // return tokens;
            }
            for (i = nameIndex + 1; i < value.chi.length; i++) {
                if ([
                    EnumToken.GtTokenType, EnumToken.LtTokenType,
                    EnumToken.GteTokenType, EnumToken.LteTokenType,
                    EnumToken.ColonTokenType
                ].includes(value.chi[valueIndex].typ)) {
                    const val = value.chi.splice(valueIndex, 1)[0];
                    const node = value.chi.splice(nameIndex, 1)[0];
                    // 'background'
                    // @ts-ignore
                    if (node.typ == EnumToken.ColorTokenType && node.kin == 'dpsys') {
                        // @ts-ignore
                        delete node.kin;
                        node.typ = EnumToken.IdenTokenType;
                    }
                    while (value.chi[0]?.typ == EnumToken.WhitespaceTokenType) {
                        value.chi.shift();
                    }
                    const t = [{
                            typ: EnumToken.MediaQueryConditionTokenType,
                            l: node,
                            op: { typ: val.typ },
                            r: value.chi.slice()
                        }];
                    value.chi.length = 0;
                    value.chi.push(...t);
                }
            }
        }
    }
    return tokens;
}
function parseSelector(tokens) {
    for (const { value, previousValue, nextValue, parent } of walkValues(tokens)) {
        if (value.typ == EnumToken.CommentTokenType ||
            value.typ == EnumToken.WhitespaceTokenType ||
            value.typ == EnumToken.CommaTokenType ||
            value.typ == EnumToken.IdenTokenType ||
            value.typ == EnumToken.HashTokenType) {
            continue;
        }
        if (parent == null) {
            if (value.typ == EnumToken.GtTokenType) {
                // @ts-ignore
                value.typ = EnumToken.ChildCombinatorTokenType;
            }
            // @ts-ignore
            else if (value.typ == EnumToken.WhitespaceTokenType) {
                if (nextValue != null && nextValue.typ == EnumToken.LiteralTokenType) {
                    if (['>', '+', '~'].includes(nextValue.val)) {
                        switch (value.val) {
                            case '>':
                                // @ts-ignore
                                nextValue.typ = EnumToken.ChildCombinatorTokenType;
                                break;
                            case '+':
                                // @ts-ignore
                                nextValue.typ = EnumToken.NextSiblingCombinatorTokenType;
                                break;
                            case '~':
                                // @ts-ignore
                                nextValue.typ = EnumToken.SubsequentSiblingCombinatorTokenType;
                                break;
                        }
                        // @ts-ignore
                        delete nextValue.val;
                        continue;
                    }
                }
                if (previousValue != null && [
                    EnumToken.ChildCombinatorTokenType,
                    EnumToken.DescendantCombinatorTokenType,
                    EnumToken.NextSiblingCombinatorTokenType,
                    EnumToken.SubsequentSiblingCombinatorTokenType,
                    EnumToken.ColumnCombinatorTokenType,
                    EnumToken.NameSpaceAttributeTokenType,
                    EnumToken.CommaTokenType
                ].includes(previousValue.typ)) {
                    continue;
                }
                // @ts-ignore
                value.typ = EnumToken.DescendantCombinatorTokenType;
            }
            else if (value.typ == EnumToken.LiteralTokenType) {
                if (value.val.charAt(0) == '&') {
                    // @ts-ignore
                    value.typ = EnumToken.NestingSelectorTokenType;
                    // @ts-ignore
                    delete value.val;
                }
                else if (value.val.charAt(0) == '.') {
                    if (!isIdent(value.val.slice(1))) {
                        // @ts-ignore
                        value.typ = EnumToken.InvalidClassSelectorTokenType;
                    }
                    else {
                        // @ts-ignore
                        value.typ = EnumToken.ClassSelectorTokenType;
                    }
                }
                // @ts-ignore
                if (value.typ == EnumToken.DelimTokenType) {
                    // @ts-ignore
                    value.typ = EnumToken.NextSiblingCombinatorTokenType;
                }
                else if (['*', '>', '+', '~'].includes(value.val)) {
                    switch (value.val) {
                        case '*':
                            // @ts-ignore
                            value.typ = EnumToken.UniversalSelectorTokenType;
                            break;
                        case '>':
                            // @ts-ignore
                            value.typ = EnumToken.ChildCombinatorTokenType;
                            break;
                        case '+':
                            // @ts-ignore
                            value.typ = EnumToken.NextSiblingCombinatorTokenType;
                            break;
                        case '~':
                            // @ts-ignore
                            value.typ = EnumToken.SubsequentSiblingCombinatorTokenType;
                            break;
                    }
                    // @ts-ignore
                    // @ts-ignore
                    delete value.val;
                }
            }
            else if (value.typ == EnumToken.ColorTokenType) {
                if (value.kin == 'lit' || value.kin == 'hex' || value.kin == 'sys' || value.kin == 'dpsys') {
                    if (value.kin == 'hex') {
                        if (!isIdent(value.val.slice(1))) {
                            continue;
                        }
                        // @ts-ignore
                        value.typ = EnumToken.HashTokenType;
                    }
                    else {
                        // @ts-ignore
                        value.typ = EnumToken.IdenTokenType;
                    }
                    // @ts-ignore
                    delete value.kin;
                }
            }
        }
    }
    let i = 0;
    const combinators = [
        EnumToken.ChildCombinatorTokenType,
        EnumToken.NextSiblingCombinatorTokenType,
        EnumToken.SubsequentSiblingCombinatorTokenType
    ];
    for (; i < tokens.length; i++) {
        if (combinators.includes(tokens[i].typ)) {
            if (i + 1 < tokens.length && [EnumToken.WhitespaceTokenType, EnumToken.DescendantCombinatorTokenType].includes(tokens[i + 1].typ)) {
                tokens.splice(i + 1, 1);
            }
            if (i > 0 && [EnumToken.WhitespaceTokenType, EnumToken.DescendantCombinatorTokenType].includes(tokens[i - 1].typ)) {
                tokens.splice(i - 1, 1);
                i--;
                continue;
            }
        }
        if (tokens[i].typ == EnumToken.WhitespaceTokenType) {
            tokens[i].typ = EnumToken.DescendantCombinatorTokenType;
        }
    }
    return tokens;
}
// export async function parseDeclarations(src: string, options: ParserOptions = {}): Promise<AstDeclaration[]> {
//
//     return doParse(`.x{${src}`, options).then((result: ParseResult) => <AstDeclaration[]>(<AstRule>result.ast.chi[0]).chi.filter(t => t.typ == EnumToken.DeclarationNodeType));
// }
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
    if (hint != null) {
        return enumTokenHints.has(hint) ? { typ: hint } : { typ: hint, val };
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
        return { typ: EnumToken.DelimTokenType };
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
    if (v == 'currentcolor' || v == 'transparent' || v in COLORS_NAMES) {
        return {
            typ: EnumToken.ColorTokenType,
            val: v,
            kin: 'lit'
        };
    }
    if (isIdent(val)) {
        if (systemColors.has(val.toLowerCase())) {
            return {
                typ: EnumToken.ColorTokenType,
                val,
                kin: 'sys'
            };
        }
        if (deprecatedSystemColors.has(val.toLowerCase())) {
            return {
                typ: EnumToken.ColorTokenType,
                val,
                kin: 'dpsys'
            };
        }
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
        if (t.typ == EnumToken.PseudoClassFuncTokenType) {
            if (t.val.slice(1) in webkitPseudoAliasMap) {
                t.val = ':' + webkitPseudoAliasMap[t.val.slice(1)];
            }
        }
        else if (t.typ == EnumToken.PseudoClassTokenType) {
            if (t.val.slice(1) in webkitPseudoAliasMap) {
                t.val = ':' + webkitPseudoAliasMap[t.val.slice(1)];
            }
        }
        if (t.typ == EnumToken.WhitespaceTokenType && ((i == 0 ||
            i + 1 == tokens.length ||
            [EnumToken.CommaTokenType, EnumToken.GteTokenType, EnumToken.LteTokenType, EnumToken.ColumnCombinatorTokenType].includes(tokens[i + 1].typ)) ||
            (i > 0 && trimWhiteSpace.includes(tokens[i - 1].typ)))) {
            tokens.splice(i--, 1);
            continue;
        }
        if (t.typ == EnumToken.ColonTokenType) {
            const typ = tokens[i + 1]?.typ;
            if (typ != null) {
                if (typ == EnumToken.FunctionTokenType) {
                    tokens[i + 1].val = ':' + (tokens[i + 1].val in webkitPseudoAliasMap ? webkitPseudoAliasMap[tokens[i + 1].val] : tokens[i + 1].val);
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
            Object.assign(t, {
                typ: inAttr == 0 ? EnumToken.AttrTokenType : EnumToken.InvalidAttrTokenType,
                chi: tokens.splice(i + 1, k - i)
            });
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
                    EnumToken.DashMatchTokenType, EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType, EnumToken.DelimTokenType
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
                    // @ts-ignore
                    const typ = t.chi[m].typ;
                    // @ts-ignore
                    t.chi[m] = {
                        typ: EnumToken.MatchExpressionTokenType,
                        op: {
                            // @ts-ignore
                            typ: typ == EnumToken.DelimTokenType ? EnumToken.EqualMatchTokenType : typ
                        },
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
            if (t.typ == EnumToken.FunctionTokenType && mathFuncs.includes(t.val)) {
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
                const filter = [EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType];
                if (t.val != 'light-dark') {
                    filter.push(EnumToken.CommaTokenType);
                }
                t.chi = t.chi.filter((t) => !filter.includes(t.typ));
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

export { doParse, parseAtRulePrelude, parseSelector, parseString, parseTokens, urlTokenMatcher };
