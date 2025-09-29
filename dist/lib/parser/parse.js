import { isIdentStart, isIdent, isIdentColor, mathFuncs, isColor, parseColor, isPseudo, pseudoElements, isAtKeyword, isFunction, isNumber, isPercentage, parseDimension, isHexColor, isHash, mediaTypes } from '../syntax/syntax.js';
import { EnumToken, ColorType, ValidationLevel, SyntaxValidationResult } from '../ast/types.js';
import { definedPropertySettings, minify, combinators } from '../ast/minify.js';
import { walkValues, WalkerEvent, walk, WalkerOptionEnum } from '../ast/walk.js';
import { expand } from '../ast/expand.js';
import './utils/config.js';
import { parseDeclarationNode } from './utils/declaration.js';
import { renderToken } from '../renderer/render.js';
import '../renderer/sourcemap/lib/encode.js';
import { funcLike, timingFunc, timelineFunc, COLORS_NAMES, systemColors, deprecatedSystemColors, colorsFunc } from '../syntax/color/utils/constants.js';
import { buildExpression } from '../ast/math/expression.js';
import { tokenize, tokenizeStream } from './tokenize.js';
import '../validation/config.js';
import '../validation/parser/parse.js';
import { validateSelector } from '../validation/selector.js';
import { validateAtRule } from '../validation/atrule.js';
import { splitTokenList } from '../validation/utils/list.js';
import '../validation/syntaxes/complex-selector.js';
import { validateKeyframeSelector } from '../validation/syntaxes/keyframe-selector.js';
import { isNodeAllowedInContext, evaluateSyntax } from '../validation/syntax.js';
import { validateAtRuleKeyframes } from '../validation/at-rules/keyframes.js';
import { hashAlgorithms, hash } from './utils/hash.js';

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
function reject(reason) {
    throw new Error(reason ?? 'Parsing aborted');
}
function normalizeVisitorKeyName(keyName) {
    return keyName.replace(/-([a-z])/g, (all, one) => one.toUpperCase());
}
function replaceToken(parent, value, replacement) {
    for (const node of (Array.isArray(replacement) ? replacement : [replacement])) {
        if ('parent' in value && value.parent != node.parent) {
            Object.defineProperty(node, 'parent', {
                ...definedPropertySettings,
                value: value.parent
            });
        }
    }
    if (parent.typ == EnumToken.BinaryExpressionTokenType) {
        if (parent.l == value) {
            parent.l = replacement;
        }
        else {
            parent.r = replacement;
        }
    }
    else {
        const target = 'val' in parent && Array.isArray(parent.val) ? parent.val : parent.chi;
        // @ts-ignore
        const index = target.indexOf(value);
        if (index == -1) {
            return;
        }
        target.splice(index, 1, ...(Array.isArray(replacement) ? replacement : [replacement]));
    }
}
async function generateScopedName(localName, filePath, pattern, hashLength = 5) {
    if (localName.startsWith('--')) {
        localName = localName.slice(2);
    }
    const matches = /.*?(([^/]+)\/)?([^/\\]*?)(\.([^?]+))?([?].*)?$/.exec(filePath);
    const folder = matches?.[2]?.replace?.(/[^A-Za-z0-9_-]/g, "_") ?? '';
    const fileBase = matches?.[3] ?? '';
    const ext = matches?.[5] ?? '';
    const path = filePath.replace(/[^A-Za-z0-9_-]/g, "_");
    // sanitize localName for safe char set (replace spaces/illegal chars)
    const safeLocal = localName.replace(/[^A-Za-z0-9_-]/g, "_");
    const hashString = `${localName}::${filePath}`;
    let result = '';
    let inParens = 0;
    let key = '';
    let position = 0;
    // Compose final scoped name. Ensure the entire class doesn't start with digit:
    for (const char of pattern) {
        position += char.length;
        if (char == '[') {
            inParens++;
            if (inParens != 1) {
                throw new Error(`Unexpected character: '${char}:${position - 1}'`);
            }
            continue;
        }
        if (char == ']') {
            inParens--;
            if (inParens != 0) {
                throw new Error(`Unexpected character: '${char}:${position - 1}'`);
            }
            let hashAlgo = null;
            let length = null;
            if (key.includes(':')) {
                const parts = key.split(':');
                if (parts.length == 2) {
                    // @ts-ignore
                    [key, length] = parts;
                    // @ts-ignore
                    if (key == 'hash' && hashAlgorithms.includes(length)) {
                        // @ts-ignore
                        hashAlgo = length;
                        length = null;
                    }
                }
                if (parts.length == 3) {
                    // @ts-ignore
                    [key, hashAlgo, length] = parts;
                }
                if (length != null && !Number.isInteger(+length)) {
                    throw new Error(`Unsupported hash length: '${length}'. expecting format [hash:length] or [hash:hash-algo:length]`);
                }
            }
            switch (key) {
                case 'hash':
                    result += await hash(hashString, length ?? hashLength, hashAlgo);
                    break;
                case 'name':
                    result += length != null ? fileBase.slice(0, +length) : fileBase;
                    break;
                case 'local':
                    result += length != null ? safeLocal.slice(0, +length) : localName;
                    break;
                case 'ext':
                    result += length != null ? ext.slice(0, +length) : ext;
                    break;
                case 'path':
                    result += length != null ? path.slice(0, +length) : path;
                    break;
                case 'folder':
                    result += length != null ? folder.slice(0, +length) : folder;
                    break;
                default:
                    throw new Error(`Unsupported key: '${key}'`);
            }
            key = '';
            continue;
        }
        if (inParens > 0) {
            key += char;
        }
        else {
            result += char;
        }
    }
    // if leading char is digit, prefix underscore (very rare)
    return (/^[0-9]/.test(result) ? '_' : '') + result;
}
/**
 * parse css string
 * @param iter
 * @param options
 *
 * @private
 */
async function doParse(iter, options = {}) {
    if (options.signal != null) {
        options.signal.addEventListener('abort', reject);
    }
    options = {
        src: '',
        sourcemap: false,
        minify: true,
        pass: 1,
        parseColor: true,
        nestingRules: true,
        resolveImport: false,
        resolveUrls: false,
        removeCharset: true,
        removeEmpty: true,
        removeDuplicateDeclarations: true,
        computeTransform: true,
        computeShorthand: true,
        computeCalcExpression: true,
        inlineCssVariables: false,
        setParent: true,
        removePrefix: false,
        validation: ValidationLevel.Default,
        lenient: true,
        ...options
    };
    if (typeof options.validation == 'boolean') {
        options.validation = options.validation ? ValidationLevel.All : ValidationLevel.None;
    }
    if (options.module) {
        options.expandNestingRules = true;
    }
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
        src: options.src ?? '',
        bytesIn: 0,
        nodesCount: 0,
        tokensCount: 0,
        importedBytesIn: 0,
        parse: `0ms`,
        minify: `0ms`,
        total: `0ms`,
        imports: []
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
            end: {
                ind: 0,
                lin: 1,
                col: 1
            },
            src: ''
        };
    }
    let valuesHandlers;
    let preValuesHandlers;
    let postValuesHandlers;
    let preVisitorsHandlersMap;
    let visitorsHandlersMap;
    let postVisitorsHandlersMap;
    const rawTokens = [];
    const imports = [];
    let item;
    let node;
    // @ts-ignore ignore error
    let isAsync = typeof iter[Symbol.asyncIterator] === 'function';
    if (options.visitor != null) {
        valuesHandlers = new Map;
        preValuesHandlers = new Map;
        postValuesHandlers = new Map;
        preVisitorsHandlersMap = new Map;
        visitorsHandlersMap = new Map;
        postVisitorsHandlersMap = new Map;
        const visitors = Object.entries(options.visitor);
        let key;
        let value;
        let i;
        for (i = 0; i < visitors.length; i++) {
            key = visitors[i][0];
            value = visitors[i][1];
            if (Number.isInteger(+key)) {
                visitors.splice(i + 1, 0, ...Object.entries(value));
                continue;
            }
            if (Array.isArray(value)) {
                // @ts-ignore
                visitors.splice(i + 1, 0, ...value.map((item) => [key, item]));
                continue;
            }
            if (key in EnumToken) {
                if (typeof value == 'function') {
                    if (!valuesHandlers.has(EnumToken[key])) {
                        valuesHandlers.set(EnumToken[key], []);
                    }
                    valuesHandlers.get(EnumToken[key]).push(value);
                }
                else if (typeof value == 'object' && 'type' in value && 'handler' in value && value.type in WalkerEvent) {
                    if (value.type == WalkerEvent.Enter) {
                        if (!preValuesHandlers.has(EnumToken[key])) {
                            preValuesHandlers.set(EnumToken[key], []);
                        }
                        preValuesHandlers.get(EnumToken[key]).push(value.handler);
                    }
                    else if (value.type == WalkerEvent.Leave) {
                        if (!postValuesHandlers.has(EnumToken[key])) {
                            postValuesHandlers.set(EnumToken[key], []);
                        }
                        postValuesHandlers.get(EnumToken[key]).push(value.handler);
                    }
                }
                else {
                    errors.push({ action: 'ignore', message: `doParse: visitor.${key} is not a valid key name` });
                }
            }
            else if (['Declaration', 'Rule', 'AtRule', 'KeyframesRule', 'KeyframesAtRule'].includes(key)) {
                if (typeof value == 'function') {
                    if (!visitorsHandlersMap.has(key)) {
                        visitorsHandlersMap.set(key, []);
                    }
                    visitorsHandlersMap.get(key).push(value);
                }
                else if (typeof value == 'object') {
                    if ('type' in value && 'handler' in value && value.type in WalkerEvent) {
                        if (value.type == WalkerEvent.Enter) {
                            if (!preVisitorsHandlersMap.has(key)) {
                                preVisitorsHandlersMap.set(key, []);
                            }
                            preVisitorsHandlersMap.get(key).push(value.handler);
                        }
                        else if (value.type == WalkerEvent.Leave) {
                            if (!postVisitorsHandlersMap.has(key)) {
                                postVisitorsHandlersMap.set(key, []);
                            }
                            postVisitorsHandlersMap.get(key).push(value.handler);
                        }
                    }
                    else {
                        if (!visitorsHandlersMap.has(key)) {
                            visitorsHandlersMap.set(key, []);
                        }
                        visitorsHandlersMap.get(key).push(value);
                    }
                }
                else {
                    errors.push({ action: 'ignore', message: `doParse: visitor.${key} is not a valid key name` });
                }
            }
            else {
                errors.push({ action: 'ignore', message: `doParse: visitor.${key} is not a valid key name` });
            }
        }
    }
    while (item = isAsync ? (await iter.next()).value : iter.next().value) {
        stats.bytesIn = item.bytesIn;
        stats.tokensCount++;
        rawTokens.push(item);
        if (item.hint != null && BadTokensTypes.includes(item.hint)) {
            const node = getTokenType(item.token, item.hint);
            errors.push({
                action: 'drop',
                message: 'Bad token',
                syntax: null,
                node,
                location: {
                    src,
                    sta: item.sta,
                    end: item.end
                }
            });
            // bad token
            continue;
        }
        if (item.hint != EnumToken.EOFTokenType) {
            tokens.push(item);
        }
        else if (ast.loc != null) {
            for (let i = stack.length - 1; i >= 0; i--) {
                stack[i].loc.end = { ...item.end };
            }
            ast.loc.end = item.end;
        }
        if (item.token == ';' || item.token == '{') {
            node = parseNode(tokens, context, options, errors, src, map, rawTokens, stats);
            rawTokens.length = 0;
            if (node != null) {
                if ('chi' in node) {
                    stack.push(node);
                    context = node;
                }
                else if (node.typ == EnumToken.AtRuleNodeType && node.nam == 'import') {
                    imports.push(node);
                }
            }
            else if (item.token == '{') {
                let inBlock = 1;
                tokens = [item];
                do {
                    item = isAsync ? (await iter.next()).value : iter.next().value;
                    if (item == null) {
                        break;
                    }
                    tokens.push(item);
                    if (item.token == '{') {
                        inBlock++;
                    }
                    else if (item.token == '}') {
                        inBlock--;
                    }
                } while (inBlock != 0);
                if (tokens.length > 0) {
                    errors.push({
                        action: 'drop',
                        message: 'invalid block',
                        rawTokens: tokens.slice(),
                        location: {
                            src,
                            sta: tokens[0].sta,
                            end: tokens[tokens.length - 1].end
                        }
                    });
                }
            }
            tokens = [];
            map = new Map;
        }
        else if (item.token == '}') {
            parseNode(tokens, context, options, errors, src, map, rawTokens, stats);
            rawTokens.length = 0;
            if (context.loc != null) {
                context.loc.end = item.end;
            }
            const previousNode = stack.pop();
            context = (stack[stack.length - 1] ?? ast);
            if (previousNode != null && previousNode.typ == EnumToken.InvalidRuleTokenType) {
                const index = context.chi.findIndex(node => node == previousNode);
                if (index > -1) {
                    context.chi.splice(index, 1);
                }
            }
            if (options.removeEmpty && previousNode != null && previousNode.chi.length == 0 && context.chi[context.chi.length - 1] == previousNode) {
                context.chi.pop();
            }
            tokens = [];
            map = new Map;
        }
    }
    if (tokens.length > 0) {
        node = parseNode(tokens, context, options, errors, src, map, rawTokens, stats);
        rawTokens.length = 0;
        if (node != null) {
            if (node.typ == EnumToken.AtRuleNodeType && node.nam == 'import') {
                imports.push(node);
            }
            else if ('chi' in node && node.typ != EnumToken.InvalidRuleTokenType) {
                stack.push(node);
                context = node;
            }
        }
        if (context != null && context.typ == EnumToken.InvalidRuleTokenType) {
            // @ts-ignore ignore error
            const index = context.chi.findIndex((node) => node === context);
            if (index > -1) {
                context.chi.splice(index, 1);
            }
        }
    }
    if (imports.length > 0 && options.resolveImport) {
        await Promise.all(imports.map(async (node) => {
            const token = node.tokens[0];
            const url = token.typ == EnumToken.StringTokenType ? token.val.slice(1, -1) : token.val;
            try {
                const result = options.load(url, options.src);
                const stream = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == 'AsyncFunction' ? await result : result;
                const root = await doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize({
                    stream,
                    buffer: '',
                    position: { ind: 0, lin: 1, col: 1 },
                    currentPosition: { ind: -1, lin: 1, col: 0 }
                }), Object.assign({}, options, {
                    minify: false,
                    setParent: false,
                    src: options.resolve(url, options.src).absolute
                }));
                stats.importedBytesIn += root.stats.bytesIn;
                stats.imports.push(root.stats);
                node.parent.chi.splice(node.parent.chi.indexOf(node), 1, ...root.ast.chi);
                if (root.errors.length > 0) {
                    errors.push(...root.errors);
                }
            }
            catch (error) {
                // @ts-ignore ignore error
                errors.push({ action: 'ignore', message: 'doParse: ' + error.message, error });
            }
        }));
    }
    while (stack.length > 0 && context != ast) {
        const previousNode = stack.pop();
        context = (stack[stack.length - 1] ?? ast);
        // remove empty nodes
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
    let replacement;
    let callable;
    if (options.visitor != null) {
        for (const result of walk(ast)) {
            if (valuesHandlers.size > 0 || preVisitorsHandlersMap.size > 0 || visitorsHandlersMap.size > 0 || postVisitorsHandlersMap.size > 0) {
                if ((result.node.typ == EnumToken.DeclarationNodeType &&
                    (preVisitorsHandlersMap.has('Declaration') || visitorsHandlersMap.has('Declaration') || postVisitorsHandlersMap.has('Declaration'))) ||
                    (result.node.typ == EnumToken.AtRuleNodeType && (preVisitorsHandlersMap.has('AtRule') || visitorsHandlersMap.has('AtRule') || postVisitorsHandlersMap.has('AtRule'))) ||
                    (result.node.typ == EnumToken.KeyframesAtRuleNodeType && (preVisitorsHandlersMap.has('KeyframesAtRule') || visitorsHandlersMap.has('KeyframesAtRule') || postVisitorsHandlersMap.has('KeyframesAtRule')))) {
                    const handlers = [];
                    const key = result.node.typ == EnumToken.DeclarationNodeType ? 'Declaration' : result.node.typ == EnumToken.AtRuleNodeType ? 'AtRule' : 'KeyframesAtRule';
                    if (preVisitorsHandlersMap.has(key)) {
                        // @ts-ignore
                        handlers.push(...preVisitorsHandlersMap.get(key));
                    }
                    if (visitorsHandlersMap.has(key)) {
                        // @ts-ignore
                        handlers.push(...visitorsHandlersMap.get(key));
                    }
                    if (postVisitorsHandlersMap.has(key)) {
                        // @ts-ignore
                        handlers.push(...postVisitorsHandlersMap.get(key));
                    }
                    let node = result.node;
                    for (const handler of handlers) {
                        callable = typeof handler == 'function' ? handler : handler[normalizeVisitorKeyName(node.typ == EnumToken.DeclarationNodeType || node.typ == EnumToken.AtRuleNodeType ? node.nam : node.val)];
                        if (callable == null) {
                            continue;
                        }
                        replacement = callable(node, result.parent);
                        if (replacement == null) {
                            continue;
                        }
                        isAsync = replacement instanceof Promise || Object.getPrototypeOf(replacement).constructor.name == 'AsyncFunction';
                        if (replacement) {
                            replacement = await replacement;
                        }
                        if (replacement == null || replacement == node) {
                            continue;
                        }
                        // @ts-ignore
                        node = replacement;
                        //
                        if (Array.isArray(node)) {
                            break;
                        }
                    }
                    if (node != result.node) {
                        // @ts-ignore
                        replaceToken(result.parent, result.node, node);
                    }
                }
                else if ((result.node.typ == EnumToken.RuleNodeType && (preVisitorsHandlersMap.has('Rule') || visitorsHandlersMap.has('Rule') || postVisitorsHandlersMap.has('Rule'))) ||
                    (result.node.typ == EnumToken.KeyFramesRuleNodeType && (preVisitorsHandlersMap.has('KeyframesRule') || visitorsHandlersMap.has('KeyframesRule') || postVisitorsHandlersMap.has('KeyframesRule')))) {
                    const handlers = [];
                    const key = result.node.typ == EnumToken.RuleNodeType ? 'Rule' : 'KeyframesRule';
                    if (preVisitorsHandlersMap.has(key)) {
                        handlers.push(...preVisitorsHandlersMap.get(key));
                    }
                    if (visitorsHandlersMap.has(key)) {
                        handlers.push(...visitorsHandlersMap.get(key));
                    }
                    if (postVisitorsHandlersMap.has(key)) {
                        handlers.push(...postVisitorsHandlersMap.get(key));
                    }
                    let node = result.node;
                    for (const callable of handlers) {
                        replacement = callable(node, result.parent);
                        if (replacement == null) {
                            continue;
                        }
                        isAsync = replacement instanceof Promise || Object.getPrototypeOf(replacement).constructor.name == 'AsyncFunction';
                        if (replacement) {
                            replacement = await replacement;
                        }
                        if (replacement == null || replacement == node) {
                            continue;
                        }
                        // @ts-ignore
                        node = replacement;
                        //
                        if (Array.isArray(node)) {
                            break;
                        }
                    }
                    // @ts-ignore
                    if (node != result.node) {
                        // @ts-ignore
                        replaceToken(result.parent, result.node, node);
                    }
                }
                else if (valuesHandlers.size > 0) {
                    let node = null;
                    node = result.node;
                    if (valuesHandlers.has(node.typ)) {
                        for (const valueHandler of valuesHandlers.get(node.typ)) {
                            callable = valueHandler;
                            replacement = callable(node, result.parent);
                            if (replacement == null) {
                                continue;
                            }
                            isAsync = replacement instanceof Promise || Object.getPrototypeOf(replacement).constructor.name == 'AsyncFunction';
                            if (isAsync) {
                                replacement = await replacement;
                            }
                            if (replacement != null && replacement != node) {
                                node = replacement;
                            }
                        }
                    }
                    if (node != result.node) {
                        // @ts-ignore
                        replaceToken(result.parent, value, node);
                    }
                    const tokens = 'tokens' in result.node ? result.node.tokens : [];
                    if ('val' in result.node && Array.isArray(result.node.val)) {
                        tokens.push(...result.node.val);
                    }
                    if (tokens.length == 0) {
                        continue;
                    }
                    for (const { value, parent, root } of walkValues(tokens, result.node)) {
                        node = value;
                        if (valuesHandlers.has(node.typ)) {
                            for (const valueHandler of valuesHandlers.get(node.typ)) {
                                callable = valueHandler;
                                let result = callable(node, parent, root);
                                if (result == null) {
                                    continue;
                                }
                                isAsync = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == 'AsyncFunction';
                                if (isAsync) {
                                    result = await result;
                                }
                                if (result != null && result != node) {
                                    node = result;
                                }
                                //
                                if (Array.isArray(node)) {
                                    break;
                                }
                            }
                        }
                        if (node != value) {
                            // @ts-ignore
                            replaceToken(parent, value, node);
                        }
                    }
                }
            }
        }
    }
    if (options.minify) {
        if (ast.chi.length > 0) {
            let passes = options.pass ?? 1;
            while (passes--) {
                minify(ast, options, true, errors, false);
            }
        }
    }
    stats.bytesIn += stats.importedBytesIn;
    let endTime = performance.now();
    const result = {
        ast,
        errors,
        stats: {
            ...stats,
            parse: `${(endParseTime - startTime).toFixed(2)}ms`,
            minify: `${(endTime - endParseTime).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`
        }
    };
    if (options.signal != null) {
        options.signal.removeEventListener('abort', reject);
    }
    if (options.module) {
        const parseModuleTime = performance.now();
        const mapping = {};
        const global = new Set;
        const processed = new Set;
        const pattern = typeof options.module == 'boolean' ? null : options.module.pattern;
        const revMapping = {};
        let filePath = typeof options.module == 'boolean' ? options.src : (options.module.filePath ?? options.src);
        if (filePath.startsWith(options.cwd + '/')) {
            filePath = filePath.slice(options.cwd.length + 1);
        }
        const moduleSettings = {
            hashLength: 5, filePath,
            scoped: true,
            pattern: pattern != null && pattern !== '' ? pattern : (filePath === '' ? `[hash]_[local]` : `[name]_[hash]_[local]`),
            generateScopedName,
            ...(typeof options.module == 'boolean' ? {} : options.module)
        };
        for (const { node } of walk(ast)) {
            if (node.typ == EnumToken.DeclarationNodeType) {
                if (node.nam.startsWith('--')) {
                    if (!(node.nam in mapping)) {
                        let result = moduleSettings.generateScopedName(node.nam, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                        mapping[node.nam] = '--' + (result instanceof Promise ? await result : result);
                        revMapping[mapping[node.nam]] = node.nam;
                    }
                    node.nam = mapping[node.nam];
                }
                if ('composes' == node.nam.toLowerCase()) {
                    const token = node.val.find(t => t.typ == EnumToken.ComposesSelectorNodeType);
                    if (token == null) {
                        continue;
                    }
                    // find parent rule
                    let parentRule = node.parent;
                    while (parentRule != null && parentRule.typ != EnumToken.RuleNodeType) {
                        parentRule = parentRule.parent;
                    }
                    // composes: a b c;
                    if (token.r == null) {
                        for (const rule of token.l) {
                            if (rule.typ == EnumToken.WhitespaceTokenType || rule.typ == EnumToken.CommentTokenType) {
                                continue;
                            }
                            if (!(rule.val in mapping)) {
                                let result = moduleSettings.generateScopedName(rule.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                mapping[rule.val] = (rule.typ == EnumToken.DashedIdenTokenType ? '--' : '') + (result instanceof Promise ? await result : result);
                                revMapping[mapping[rule.val]] = rule.val;
                            }
                            if (parentRule != null) {
                                for (const tk of parentRule.tokens) {
                                    if (tk.typ == EnumToken.ClassSelectorTokenType) {
                                        const val = tk.val.slice(1);
                                        if (val in revMapping) {
                                            const key = revMapping[val];
                                            mapping[key] = [...new Set([...mapping[key].split(' '), mapping[rule.val]])].join(' ');
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // composes: a b c from 'file.css';
                    else if (token.r.typ == EnumToken.String) {
                        const url = token.r.val.slice(1, -1);
                        const result = options.load(url, options.src);
                        const stream = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == 'AsyncFunction' ? await result : result;
                        const root = await doParse(stream instanceof ReadableStream ? tokenizeStream(stream) : tokenize({
                            stream,
                            buffer: '',
                            position: { ind: 0, lin: 1, col: 1 },
                            currentPosition: { ind: -1, lin: 1, col: 0 }
                        }), Object.assign({}, options, {
                            minify: false,
                            setParent: false,
                            src: options.resolve(url, options.src).absolute,
                            module: typeof options.module == 'boolean' ? options.module : { ...options.module }
                        }));
                        if (parentRule != null) {
                            for (const tk of parentRule.tokens) {
                                if (tk.typ == EnumToken.ClassSelectorTokenType) {
                                    const val = tk.val.slice(1);
                                    if (val in revMapping) {
                                        const key = revMapping[val];
                                        const values = [];
                                        for (const iden of token.l) {
                                            if (iden.typ != EnumToken.IdenTokenType && iden.typ != EnumToken.DashedIdenTokenType) {
                                                continue;
                                            }
                                            if (!(iden.val in root.mapping)) {
                                                const result = moduleSettings.generateScopedName(iden.val, url, moduleSettings.pattern, moduleSettings.hashLength);
                                                root.mapping[iden.val] = result instanceof Promise ? await result : result;
                                                root.revMapping[root.mapping[iden.val]] = iden.val;
                                            }
                                            values.push(root.mapping[iden.val]);
                                        }
                                        mapping[key] = [...new Set([...mapping[key].split(' '), ...values])].join(' ');
                                    }
                                }
                            }
                        }
                    }
                    // composes: a b c from global;
                    else if (token.r.typ == EnumToken.IdenTokenType) {
                        // global
                        if (parentRule != null) {
                            if ('global' == token.r.val.toLowerCase()) {
                                for (const tk of parentRule.tokens) {
                                    if (tk.typ == EnumToken.ClassSelectorTokenType) {
                                        const val = tk.val.slice(1);
                                        if (val in revMapping) {
                                            const key = revMapping[val];
                                            mapping[key] = [...new Set([...mapping[key].split(' '), ...(token.l.reduce((acc, curr) => {
                                                        if (curr.typ == EnumToken.IdenTokenType) {
                                                            acc.push(curr.val);
                                                        }
                                                        return acc;
                                                    }, []))])].join(' ');
                                        }
                                    }
                                }
                            }
                            else {
                                errors.push({
                                    action: 'drop',
                                    message: `composes '${token.r.val}' is not supported`,
                                    node
                                });
                            }
                        }
                    }
                    else {
                        errors.push({
                            action: 'drop',
                            message: `composes '${EnumToken[token.r.typ]}' is not supported`,
                            node
                        });
                    }
                    parentRule.chi.splice(parentRule.chi.indexOf(node), 1);
                }
                if (node.nam == 'grid-template-areas') {
                    for (let i = 0; i < node.val.length; i++) {
                        if (node.val[i].typ == EnumToken.String) {
                            const tokens = parseString(node.val[i].val.slice(1, -1), { location: true });
                            for (const { value } of walkValues(tokens)) {
                                if (value.typ == EnumToken.IdenTokenType || value.typ == EnumToken.DashedIdenTokenType) {
                                    if (value.val in mapping) {
                                        value.val = mapping[value.val];
                                    }
                                    else {
                                        let result = moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                        if (result instanceof Promise) {
                                            result = await result;
                                        }
                                        mapping[value.val] = result;
                                        revMapping[result] = value.val;
                                        value.val = result;
                                    }
                                }
                            }
                            node.val[i].val = node.val[i].val.charAt(0) + tokens.reduce((acc, curr) => acc + renderToken(curr), '') + node.val[i].val.charAt(node.val[i].val.length - 1);
                        }
                    }
                }
                else if (node.nam == 'animation' || node.nam == 'animation-name') {
                    for (const { value } of walkValues(node.val, node)) {
                        if (value.typ == EnumToken.IdenTokenType && ![
                            'none', 'infinite', 'normal', 'reverse', 'alternate',
                            'alternate-reverse', 'forwards', 'backwards', 'both',
                            'running', 'paused', 'linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out',
                            'step-start', 'step-end', 'jump-start', 'jump-end',
                            'jump-none', 'jump-both', 'start', 'end',
                            'inherit', 'initial', 'unset'
                        ].includes(value.val)) {
                            if (!(value.val in mapping)) {
                                const result = moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                mapping[value.val] = result instanceof Promise ? await result : result;
                                revMapping[mapping[value.val]] = value.val;
                            }
                            value.val = mapping[value.val];
                        }
                    }
                }
                for (const { value } of walkValues(node.val, node)) {
                    if (value.typ == EnumToken.DashedIdenTokenType) {
                        if (!(value.val in mapping)) {
                            const result = moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                            mapping[value.val] = '--' + (result instanceof Promise ? await result : result);
                            revMapping[mapping[value.val]] = value.val;
                        }
                        value.val = mapping[value.val];
                    }
                }
            }
            else if (node.typ == EnumToken.RuleNodeType) {
                if (node.tokens == null) {
                    Object.defineProperty(node, 'tokens', {
                        ...definedPropertySettings,
                        value: parseSelector(parseString(node.sel))
                    });
                }
                for (const { value } of walkValues(node.tokens, node, 
                // @ts-ignore
                (value, parent) => {
                    if (value.typ == EnumToken.PseudoClassTokenType) {
                        switch (value.val.toLowerCase()) {
                            case ':global':
                                let index = parent.tokens.indexOf(value);
                                parent.tokens.splice(index, 1);
                                if (parent.tokens[index]?.typ == EnumToken.WhitespaceTokenType || parent.tokens[index]?.typ == EnumToken.DescendantCombinatorTokenType) {
                                    parent.tokens.splice(index, 1);
                                }
                                for (; index < parent.tokens.length; index++) {
                                    if (parent.tokens[index].typ == EnumToken.CommaTokenType ||
                                        ([EnumToken.PseudoClassFuncTokenType, EnumToken.PseudoClassTokenType].includes(parent.tokens[index].typ) &&
                                            [':global', ':local'].includes(parent.tokens[index].val.toLowerCase()))) {
                                        break;
                                    }
                                    global.add(parent.tokens[index]);
                                }
                                break;
                        }
                    }
                    else if (value.typ == EnumToken.PseudoClassFuncTokenType) {
                        switch (value.val.toLowerCase()) {
                            case ':global':
                                for (const token of value.chi) {
                                    global.add(token);
                                }
                                parent.tokens.splice(parent.tokens.indexOf(value), 1, ...value.chi);
                                break;
                            case ':local':
                                parent.tokens.splice(parent.tokens.indexOf(value), 1, ...value.chi);
                                break;
                        }
                    }
                })) {
                    if (processed.has(value)) {
                        continue;
                    }
                    processed.add(value);
                    if (value.typ == EnumToken.PseudoClassTokenType) ;
                    else if (value.typ == EnumToken.PseudoClassFuncTokenType) ;
                    else {
                        if (global.has(value)) {
                            continue;
                        }
                        if (value.typ == EnumToken.ClassSelectorTokenType) {
                            const val = value.val.slice(1);
                            if (!(val in mapping)) {
                                const result = moduleSettings.generateScopedName(val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                mapping[val] = result instanceof Promise ? await result : result;
                                revMapping[mapping[val]] = val;
                            }
                            value.val = '.' + mapping[val];
                        }
                    }
                }
                node.sel = '';
                for (const token of node.tokens) {
                    node.sel += renderToken(token);
                }
            }
            else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframesAtRuleNodeType) {
                const val = node.nam.toLowerCase();
                if (val == 'property' || val == 'keyframes') {
                    if (node.tokens == null) {
                        Object.defineProperty(node, 'tokens', {
                            ...definedPropertySettings,
                            // @ts-ignore
                            value: parseAtRulePrelude(parseString(node.val), node)
                        });
                    }
                    const prefix = val == 'property' ? '--' : '';
                    for (const value of node.tokens) {
                        if ((prefix == '--' && value.typ == EnumToken.DashedIdenTokenType) || (prefix == '' && value.typ == EnumToken.IdenTokenType)) {
                            if (!(value.val in mapping)) {
                                const result = moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                mapping[value.val] = prefix + (result instanceof Promise ? await result : result);
                                revMapping[mapping[value.val]] = value.val;
                            }
                            value.val = mapping[value.val];
                        }
                    }
                    node.val = node.tokens.reduce((a, b) => a + renderToken(b), '');
                }
            }
        }
        result.mapping = mapping;
        result.revMapping = revMapping;
        endTime = performance.now();
        result.stats.module = `${(endTime - parseModuleTime).toFixed(2)}ms`;
        result.stats.total = `${(endTime - startTime).toFixed(2)}ms`;
    }
    return result;
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
function parseNode(results, context, options, errors, src, map, rawTokens, stats) {
    let tokens = [];
    for (const t of results) {
        const node = getTokenType(t.token, t.hint);
        map.set(node, { sta: t.sta, end: t.end, src });
        tokens.push(node);
    }
    let i;
    let loc;
    for (i = 0; i < tokens.length; i++) {
        if (tokens[i].typ == EnumToken.CommentTokenType || tokens[i].typ == EnumToken.CDOCOMMTokenType) {
            const location = map.get(tokens[i]);
            if (tokens[i].typ == EnumToken.CDOCOMMTokenType && context.typ != EnumToken.StyleSheetNodeType) {
                errors.push({
                    action: 'drop',
                    message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                    node: tokens[i],
                    location
                });
                continue;
            }
            loc = location;
            context.chi.push(tokens[i]);
            stats.nodesCount++;
            Object.defineProperty(tokens[i], 'loc', {
                ...definedPropertySettings,
                value: loc,
                enumerable: options.sourcemap !== false
            });
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
    while ([EnumToken.WhitespaceTokenType, EnumToken.BadStringTokenType, EnumToken.BadCommentTokenType].includes(tokens.at(-1)?.typ)) {
        tokens.pop();
    }
    if (tokens.length == 0) {
        return null;
    }
    if (tokens[0]?.typ == EnumToken.AtRuleTokenType) {
        const atRule = tokens.shift();
        const location = map.get(atRule);
        // @ts-ignore
        while ([EnumToken.WhitespaceTokenType].includes(tokens[0]?.typ)) {
            tokens.shift();
        }
        rawTokens.shift();
        if (atRule.val == 'import') {
            // only @charset and @layer are accepted before @import
            if (context.chi.length > 0) {
                let i = context.chi.length;
                while (i--) {
                    // @ts-ignore
                    const type = context.chi[i].typ;
                    if (type == EnumToken.CommentNodeType) {
                        continue;
                    }
                    if (type != EnumToken.AtRuleNodeType) {
                        if (!(type == EnumToken.InvalidAtRuleTokenType &&
                            ['charset', 'layer', 'import'].includes(context.chi[i].nam))) {
                            errors.push({
                                action: 'drop',
                                message: 'invalid @import',
                                location,
                                // @ts-ignore
                                rawTokens: [atRule, ...tokens]
                            });
                            return null;
                        }
                    }
                    const name = context.chi[i].nam;
                    if (name != 'charset' && name != 'import' && name != 'layer') {
                        errors.push({ action: 'drop', message: 'invalid @import', location });
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
                    location
                });
                return null;
            }
            // @ts-ignore
            if (tokens[0].typ == EnumToken.UrlFunctionTokenType && tokens[1]?.typ != EnumToken.UrlTokenTokenType && tokens[1]?.typ != EnumToken.StringTokenType) {
                errors.push({
                    action: 'drop',
                    message: 'doParse: invalid @import',
                    location
                });
                return null;
            }
        }
        if (atRule.val == 'import') {
            // @ts-ignore
            if (tokens[0].typ == EnumToken.UrlFunctionTokenType) {
                if (tokens[1].typ == EnumToken.UrlTokenTokenType || tokens[1].typ == EnumToken.StringTokenType) {
                    tokens.shift();
                    if (tokens[0]?.typ == EnumToken.UrlTokenTokenType) {
                        // @ts-ignore
                        tokens[0].typ = EnumToken.StringTokenType;
                        // @ts-ignore
                        tokens[0].val = `"${tokens[0].val}"`;
                    }
                    // @ts-ignore
                    while (tokens[1]?.typ == EnumToken.WhitespaceTokenType || tokens[1]?.typ == EnumToken.CommentTokenType) {
                        tokens.splice(1, 1);
                    }
                    // @ts-ignore
                    if (tokens[1]?.typ == EnumToken.EndParensTokenType) {
                        tokens.splice(1, 1);
                    }
                }
            }
        }
        // https://www.w3.org/TR/css-nesting-1/#conditionals
        // allowed nesting at-rules
        // there must be a top level rule in the stack
        if (atRule.val == 'charset') {
            let spaces = 0;
            // https://developer.mozilla.org/en-US/docs/Web/CSS/@charset
            for (let k = 0; k < rawTokens.length; k++) {
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
                        location, rawTokens: [atRule, ...tokens]
                    });
                    return null;
                }
                if (rawTokens[k].hint != EnumToken.StringTokenType || rawTokens[k].token[0] != '"') {
                    errors.push({
                        action: 'drop',
                        message: '@charset expects a "<charset>"',
                        location
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
        const raw = [];
        for (const curr of t) {
            raw.push(renderToken(curr, { removeComments: true, convertColor: false }));
        }
        const nam = renderToken(atRule, { removeComments: true });
        // @ts-ignore
        const node = {
            typ: /^(-[a-z]+-)?keyframes$/.test(nam) ? EnumToken.KeyframesAtRuleNodeType : EnumToken.AtRuleNodeType,
            nam,
            val: raw.join('')
        };
        Object.defineProperties(node, {
            tokens: { ...definedPropertySettings, enumerable: false, value: t.slice() },
            raw: { ...definedPropertySettings, value: raw }
        });
        if (delim.typ == EnumToken.BlockStartTokenType) {
            node.chi = [];
        }
        loc = map.get(atRule);
        Object.defineProperty(node, 'loc', {
            ...definedPropertySettings,
            value: loc,
            enumerable: options.sourcemap !== false
        });
        node.loc.end = { ...map.get(delim).end };
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
        // @ts-ignore
        const skipValidate = (options.validation & ValidationLevel.AtRule) == 0;
        const isAllowed = skipValidate || isNodeAllowedInContext(node, context);
        // @ts-ignore
        const valid = skipValidate ? {
            valid: SyntaxValidationResult.Valid,
            error: '',
            node,
            syntax: '@' + node.nam
        } : !isAllowed ? {
            valid: SyntaxValidationResult.Drop,
            node,
            syntax: '@' + node.nam,
            error: `${EnumToken[context.typ]}: child ${EnumToken[node.typ]} not allowed in context${context.typ == EnumToken.AtRuleNodeType ? ` '@${context.nam}'` : context.typ == EnumToken.StyleSheetNodeType ? ` 'stylesheet'` : ''}`} : isValid ? (node.typ == EnumToken.KeyframesAtRuleNodeType ? validateAtRuleKeyframes(node) : validateAtRule(node, options, context)) : {
            valid: SyntaxValidationResult.Drop,
            node,
            syntax: '@' + node.nam,
            error: '@' + node.nam + ' not allowed here'};
        if (valid.valid == SyntaxValidationResult.Drop) {
            let message = '';
            for (const token of tokens) {
                message += renderToken(token, { minify: false });
            }
            errors.push({
                action: 'drop',
                message: valid.error + ' - "' + message + '"',
                node,
                // @ts-ignore
                location: { src, ...(map.get(valid.node) ?? location) }
            });
            // @ts-ignore
            node.typ = EnumToken.InvalidAtRuleTokenType;
        }
        else {
            node.val = '';
            for (const token of node.tokens) {
                node.val += renderToken(token, {
                    minify: false,
                    convertColor: false,
                    removeComments: true
                });
            }
        }
        context.chi.push(node);
        stats.nodesCount++;
        Object.defineProperties(node, {
            parent: { ...definedPropertySettings, value: context },
            validSyntax: { ...definedPropertySettings, value: valid.valid == SyntaxValidationResult.Valid }
        });
        return node;
    }
    else {
        // rule
        if (delim.typ == EnumToken.BlockStartTokenType) {
            const location = map.get(tokens[0]);
            const uniq = new Map;
            parseTokens(tokens, { minify: true });
            const ruleType = context.typ == EnumToken.KeyframesAtRuleNodeType ? EnumToken.KeyFramesRuleNodeType : EnumToken.RuleNodeType;
            if (ruleType == EnumToken.RuleNodeType) {
                parseSelector(tokens);
            }
            const node = {
                typ: ruleType,
                sel: [...tokens.reduce((acc, curr, index, array) => {
                        if (curr.typ == EnumToken.CommentTokenType) {
                            return acc;
                        }
                        if (options.minify) {
                            if (curr.typ == EnumToken.PseudoClassFuncTokenType && curr.val == ':nth-child') {
                                let i = 0;
                                for (; i < curr.chi.length; i++) {
                                    if (curr.chi[i].typ == EnumToken.IdenTokenType && curr.chi[i].val == 'even') {
                                        Object.assign(curr.chi[i], {
                                            typ: EnumToken.Dimension,
                                            val: 2,
                                            unit: 'n'
                                        });
                                    }
                                    else if (curr.chi[i].typ == EnumToken.Dimension &&
                                        curr.chi[i].val == 2 &&
                                        curr.chi[i].unit == 'n' &&
                                        curr.chi[i + 1]?.typ == EnumToken.WhitespaceTokenType &&
                                        curr.chi[i + 2]?.typ == EnumToken.LiteralTokenType &&
                                        curr.chi[i + 2].val == '+' &&
                                        curr.chi[i + 3]?.typ == EnumToken.WhitespaceTokenType &&
                                        curr.chi[i + 4]?.typ == EnumToken.NumberTokenType &&
                                        curr.chi[i + 4].val == 1) {
                                        curr.chi.splice(i, 5, Object.assign(curr.chi[i], {
                                            typ: EnumToken.IdenTokenType,
                                            val: 'odd'
                                        }));
                                    }
                                }
                            }
                        }
                        if (curr.typ == EnumToken.WhitespaceTokenType) {
                            if (trimWhiteSpace.includes(array[index - 1]?.typ) ||
                                trimWhiteSpace.includes(array[index + 1]?.typ) ||
                                combinators.includes(array[index - 1]?.val) ||
                                combinators.includes(array[index + 1]?.val)) {
                                return acc;
                            }
                        }
                        if (ruleType == EnumToken.KeyFramesRuleNodeType && options.minify) {
                            if (curr.typ == EnumToken.IdenTokenType && curr.val == 'from') {
                                Object.assign(curr, { typ: EnumToken.PercentageTokenType, val: '0' });
                            }
                            else if (curr.typ == EnumToken.PercentageTokenType && curr.val == 100) {
                                Object.assign(curr, { typ: EnumToken.IdenTokenType, val: 'to' });
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
                    }, uniq).keys()].join(','),
                chi: []
            };
            Object.defineProperty(node, 'tokens', {
                ...definedPropertySettings,
                enumerable: false,
                value: tokens.slice()
            });
            loc = location;
            Object.defineProperty(node, 'loc', {
                ...definedPropertySettings,
                value: loc,
                enumerable: options.sourcemap !== false
            });
            context.chi.push(node);
            Object.defineProperty(node, 'parent', { ...definedPropertySettings, value: context });
            // @ts-ignore
            const skipValidate = (options.validation & ValidationLevel.Selector) == 0;
            const isAllowed = skipValidate || isNodeAllowedInContext(node, context);
            // @ts-ignore
            const valid = skipValidate ? {
                valid: SyntaxValidationResult.Valid,
                error: null
            } : !isAllowed ? {
                valid: SyntaxValidationResult.Drop,
                error: `${EnumToken[context.typ]}: child ${EnumToken[node.typ]} not allowed in context${context.typ == EnumToken.AtRuleNodeType ? ` '@${context.nam}'` : context.typ == EnumToken.StyleSheetNodeType ? ` 'stylesheet'` : ''}`
            } : ruleType == EnumToken.KeyFramesRuleNodeType ? validateKeyframeSelector(tokens) : validateSelector(tokens, options, context);
            if (valid.valid != SyntaxValidationResult.Valid) {
                // @ts-ignore
                node.typ = EnumToken.InvalidRuleTokenType;
                node.sel = tokens.reduce((acc, curr) => acc + renderToken(curr, { minify: false }), '');
                errors.push({
                    action: 'drop',
                    message: valid.error + ' - "' + tokens.reduce((acc, curr) => acc + renderToken(curr, { minify: false }), '') + '"',
                    node,
                    // @ts-ignore
                    location
                });
            }
            Object.defineProperty(node, 'validSyntax', {
                ...definedPropertySettings,
                value: valid.valid == SyntaxValidationResult.Valid
            });
            return node;
        }
        else {
            let name = null;
            let value = null;
            let i = 0;
            for (; i < tokens.length; i++) {
                if (tokens[i].typ == EnumToken.LiteralTokenType && tokens[i].val.length > 1) {
                    const start = tokens[i].val.charAt(0);
                    const val = tokens[i].val.slice(1);
                    if (['/', '*'].includes(start) && isNumber(val)) {
                        tokens.splice(i, 1, {
                            typ: EnumToken.LiteralTokenType,
                            val: tokens[i].val.charAt(0)
                        }, {
                            typ: EnumToken.NumberTokenType,
                            val: +tokens[i].val.slice(1)
                        });
                    }
                    else if (start == '/' && isFunction(val)) {
                        tokens.splice(i, 1, { typ: EnumToken.LiteralTokenType, val: '/' }, getTokenType(val));
                    }
                }
            }
            parseTokens(tokens, { ...options, parseColor: true });
            for (i = 0; i < tokens.length; i++) {
                if (tokens[i].typ == EnumToken.CommentTokenType) {
                    continue;
                }
                if (name == null && [EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType].includes(tokens[i].typ)) {
                    name = tokens.slice(0, i + 1);
                }
                else if (name == null && tokens[i].typ == EnumToken.ColorTokenType && [ColorType.SYS, ColorType.DPSYS].includes(tokens[i].kin)) {
                    name = tokens.slice(0, i + 1);
                    tokens[i].typ = EnumToken.IdenTokenType;
                }
                else if (name != null && funcLike.concat([
                    EnumToken.LiteralTokenType,
                    EnumToken.IdenTokenType, EnumToken.DashedIdenTokenType,
                    EnumToken.PseudoClassTokenType, EnumToken.PseudoClassFuncTokenType
                ]).includes(tokens[i].typ)) {
                    if (tokens[i].val?.charAt?.(0) == ':') {
                        Object.assign(tokens[i], getTokenType(tokens[i].val.slice(1)));
                        if ('chi' in tokens[i]) {
                            tokens[i].typ = EnumToken.FunctionTokenType;
                            if (colorsFunc.includes(tokens[i].val) && isColor(tokens[i])) {
                                parseColor(tokens[i]);
                            }
                        }
                        tokens.splice(i--, 0, { typ: EnumToken.ColonTokenType });
                        continue;
                    }
                    if ('chi' in tokens[i]) {
                        tokens[i].typ = EnumToken.FunctionTokenType;
                    }
                    value = tokens.slice(i);
                }
                if (tokens[i].typ == EnumToken.ColonTokenType) {
                    name = tokens.slice(0, i);
                    value = tokens.slice(i + 1);
                    break;
                }
            }
            if (name == null) {
                name = tokens;
            }
            const location = map.get(name[0]);
            if (name.length > 0) {
                for (let i = 1; i < name.length; i++) {
                    if (name[i].typ != EnumToken.WhitespaceTokenType && name[i].typ != EnumToken.CommentTokenType) {
                        errors.push({
                            action: 'drop',
                            message: 'doParse: invalid declaration',
                            location
                        });
                        return null;
                    }
                }
            }
            const nam = renderToken(name.shift(), { removeComments: true });
            if (value == null || (!nam.startsWith('--') && value.length == 0)) {
                errors.push({
                    action: 'drop',
                    message: 'doParse: invalid declaration',
                    location
                });
                if (options.lenient) {
                    const node = {
                        typ: EnumToken.InvalidDeclarationNodeType,
                        nam,
                        val: []
                    };
                    Object.defineProperty(node, 'loc', {
                        ...definedPropertySettings,
                        value: location,
                        enumerable: options.sourcemap !== false
                    });
                    context.chi.push(node);
                    stats.nodesCount++;
                }
                return null;
            }
            for (const { value: token } of walkValues(value, null, {
                fn: (node) => node.typ == EnumToken.FunctionTokenType && node.val == 'calc' ? WalkerOptionEnum.IgnoreChildren : null,
                type: EnumToken.FunctionTokenType
            })) {
                if (token.typ == EnumToken.FunctionTokenType && token.val == 'calc') {
                    for (const { value: node, parent } of walkValues(token.chi, token)) {
                        // fix expressions starting with '/' or '*' such as '/4' in (1 + 1)/4
                        if (node.typ == EnumToken.LiteralTokenType && node.val.length > 0) {
                            if (node.val[0] == '/' || node.val[0] == '*') {
                                parent.chi.splice(parent.chi.indexOf(node), 1, { typ: node.val[0] == '/' ? EnumToken.Div : EnumToken.Mul }, ...parseString(node.val.slice(1)));
                            }
                        }
                    }
                }
            }
            const node = {
                typ: EnumToken.DeclarationNodeType,
                nam,
                val: value
            };
            Object.defineProperty(node, 'loc', {
                ...definedPropertySettings,
                value: location,
                enumerable: options.sourcemap !== false
            });
            node.loc.end = { ...map.get(delim).end };
            // do not allow declarations in style sheets
            if (context.typ == EnumToken.StyleSheetNodeType && options.lenient) {
                Object.assign(node, { typ: EnumToken.InvalidDeclarationNodeType });
                context.chi.push(node);
                stats.nodesCount++;
                return null;
            }
            const result = parseDeclarationNode(node, errors, location);
            Object.defineProperty(result, 'parent', { ...definedPropertySettings, value: context });
            if (result != null) {
                if (options.validation & ValidationLevel.Declaration) {
                    const isAllowed = isNodeAllowedInContext(node, context);
                    // @ts-ignore
                    const valid = !isAllowed ? {
                        valid: SyntaxValidationResult.Drop,
                        error: `${EnumToken[node.typ]} not allowed in context${context.typ == EnumToken.AtRuleNodeType ? ` '@${context.nam}'` : context.typ == EnumToken.StyleSheetNodeType ? ` 'stylesheet'` : ''}`,
                        node,
                        syntax: null
                    } : evaluateSyntax(result, context, options);
                    Object.defineProperty(result, 'validSyntax', {
                        ...definedPropertySettings,
                        value: valid.valid == SyntaxValidationResult.Valid
                    });
                    if (valid.valid == SyntaxValidationResult.Drop) {
                        errors.push({
                            action: 'drop',
                            message: valid.error,
                            syntax: valid.syntax,
                            node: valid.node,
                            location: map.get(valid.node) ?? valid.node?.loc ?? result.loc ?? location
                        });
                        if (!options.lenient) {
                            return null;
                        }
                        Object.assign(node, { typ: EnumToken.InvalidDeclarationNodeType });
                    }
                }
                context.chi.push(result);
                stats.nodesCount++;
            }
            return null;
        }
    }
}
/**
 * parse at-rule prelude
 * @param tokens
 * @param atRule
 */
function parseAtRulePrelude(tokens, atRule) {
    for (const { value, parent } of walkValues(tokens, null, null, true)) {
        if (value.typ == EnumToken.CommentTokenType ||
            value.typ == EnumToken.WhitespaceTokenType ||
            value.typ == EnumToken.CommaTokenType) {
            continue;
        }
        if (value.typ == EnumToken.PseudoClassFuncTokenType || value.typ == EnumToken.PseudoClassTokenType) {
            if (parent?.typ == EnumToken.ParensTokenType) {
                const index = parent.chi.indexOf(value);
                let i = index;
                while (i--) {
                    if (parent.chi[i].typ == EnumToken.IdenTokenType || parent.chi[i].typ == EnumToken.DashedIdenTokenType) {
                        break;
                    }
                }
                if (i >= 0) {
                    const token = getTokenType(parent.chi[index].val.slice(1) + (funcLike.includes(parent.chi[index].typ) ? '(' : ''));
                    parent.chi[index].val = token.val;
                    parent.chi[index].typ = token.typ;
                    if (parent.chi[index].typ == EnumToken.FunctionTokenType && isColor(parent.chi[index])) {
                        parseColor(parent.chi[index]);
                    }
                    parent.chi.splice(i, index - i + 1, {
                        typ: EnumToken.MediaQueryConditionTokenType,
                        l: parent.chi[i],
                        r: parent.chi.slice(index),
                        op: {
                            typ: EnumToken.ColonTokenType
                        }
                    });
                }
            }
        }
        if (atRule.val == 'page' && value.typ == EnumToken.PseudoClassTokenType) {
            if ([':left', ':right', ':first', ':blank'].includes(value.val)) {
                Object.assign(value, { typ: EnumToken.PseudoPageTokenType });
            }
        }
        if (atRule.val == 'layer') {
            if (parent == null && value.typ == EnumToken.LiteralTokenType) {
                if (value.val.charAt(0) == '.') {
                    if (isIdent(value.val.slice(1))) {
                        Object.assign(value, { typ: EnumToken.ClassSelectorTokenType });
                    }
                }
            }
        }
        const val = value.typ == EnumToken.IdenTokenType ? value.val.toLowerCase() : null;
        if (value.typ == EnumToken.IdenTokenType) {
            if (parent == null && mediaTypes.some((t) => {
                if (val === t) {
                    Object.assign(value, { typ: EnumToken.MediaFeatureTokenType });
                    return true;
                }
                return false;
            })) {
                continue;
            }
            if (value.typ == EnumToken.IdenTokenType && 'and' === val) {
                Object.assign(value, { typ: EnumToken.MediaFeatureAndTokenType });
                continue;
            }
            if (value.typ == EnumToken.IdenTokenType && 'or' === val) {
                Object.assign(value, { typ: EnumToken.MediaFeatureOrTokenType });
                continue;
            }
            if (value.typ == EnumToken.IdenTokenType &&
                ['not', 'only'].some((t) => val === t)) {
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
        if (value.typ == EnumToken.FunctionTokenType && value.val == 'selector') {
            parseSelector(value.chi);
        }
        if (value.typ == EnumToken.ParensTokenType || (value.typ == EnumToken.FunctionTokenType && ['media', 'supports', 'style', 'scroll-state'].includes(value.val))) {
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
                if (value.chi[i].typ == EnumToken.LiteralTokenType && value.chi[i].val.startsWith(':')) {
                    const dimension = parseDimension(value.chi[i].val.slice(1));
                    if (dimension != null) {
                        value.chi.splice(i, 1, {
                            typ: EnumToken.ColonTokenType,
                        }, Object.assign(value.chi[i], dimension));
                        i--;
                        continue;
                    }
                }
                if (nameIndex != -1 && value.chi[i].typ == EnumToken.PseudoClassTokenType) {
                    value.chi.splice(i, 1, {
                        typ: EnumToken.ColonTokenType,
                    }, Object.assign(value.chi[i], {
                        typ: EnumToken.IdenTokenType,
                        val: value.chi[i].val.slice(1)
                    }));
                    i--;
                    continue;
                }
                valueIndex = i;
                break;
            }
            if (valueIndex == -1) {
                continue;
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
                    if (node.typ == EnumToken.ColorTokenType && node.kin == ColorType.DPSYS) {
                        Object.assign(node, { typ: EnumToken.IdenTokenType });
                        // @ts-ignore
                        delete node.kin;
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
/**
 * parse a string as an array of declaration nodes
 * @param declaration
 *
 * Example:
 * ````ts
 *
 * const declarations = await parseDeclarations('color: red; background: blue');
 * console.log(declarations);
 * ```
 */
async function parseDeclarations(declaration) {
    return doParse(tokenize({
        stream: `.x{${declaration}}`,
        buffer: '',
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 }
    }), { setParent: false, minify: false, validation: false }).then(result => {
        return result.ast.chi[0].chi.filter(t => t.typ == EnumToken.DeclarationNodeType || t.typ == EnumToken.CommentNodeType);
    });
}
/**
 * parse selector
 * @param tokens
 */
function parseSelector(tokens) {
    for (const { value, parent } of walkValues(tokens)) {
        if (value.typ == EnumToken.CommentTokenType ||
            value.typ == EnumToken.WhitespaceTokenType ||
            value.typ == EnumToken.CommaTokenType ||
            value.typ == EnumToken.IdenTokenType ||
            value.typ == EnumToken.HashTokenType) {
            continue;
        }
        if (parent == null) {
            if (value.typ == EnumToken.GtTokenType) {
                Object.assign(value, { typ: EnumToken.ChildCombinatorTokenType });
            }
            else if (value.typ == EnumToken.LiteralTokenType) {
                if (value.val.charAt(0) == '&') {
                    Object.assign(value, { typ: EnumToken.NestingSelectorTokenType });
                    // @ts-ignore
                    delete value.val;
                }
                else if (value.val.charAt(0) == '.') {
                    if (!isIdent(value.val.slice(1))) {
                        Object.assign(value, { typ: EnumToken.InvalidClassSelectorTokenType });
                    }
                    else {
                        Object.assign(value, { typ: EnumToken.ClassSelectorTokenType });
                    }
                }
                if (['*', '>', '+', '~'].includes(value.val)) {
                    switch (value.val) {
                        case '*':
                            Object.assign(value, { typ: EnumToken.UniversalSelectorTokenType });
                            break;
                        case '>':
                            Object.assign(value, { typ: EnumToken.ChildCombinatorTokenType });
                            break;
                        case '+':
                            Object.assign(value, { typ: EnumToken.NextSiblingCombinatorTokenType });
                            break;
                        case '~':
                            Object.assign(value, { typ: EnumToken.SubsequentSiblingCombinatorTokenType });
                            break;
                    }
                    // @ts-ignore
                    delete value.val;
                }
            }
            else if (value.typ == EnumToken.ColorTokenType) {
                if (value.kin == ColorType.LIT || value.kin == ColorType.HEX || value.kin == ColorType.SYS || value.kin == ColorType.DPSYS) {
                    if (value.kin == ColorType.HEX) {
                        if (!isIdent(value.val.slice(1))) {
                            continue;
                        }
                        Object.assign(value, { typ: EnumToken.HashTokenType });
                    }
                    else {
                        Object.assign(value, { typ: EnumToken.IdenTokenType });
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
/**
 * parse css string and return an array of tokens
 * @param src
 * @param options
 *
 * @private
 *
 * Example:
 *
 * ```ts
 *
 * import {parseString} from '@tbela99/css-parser';
 *
 * let tokens = parseString('body { color: red; }');
 * console.log(tokens);
 *
 *  tokens = parseString('#c322c980');
 * console.log(tokens);
 * ```
 */
function parseString(src, options = { location: false }) {
    const parseInfo = {
        stream: src,
        buffer: '',
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 }
    };
    return parseTokens([...tokenize(parseInfo)].reduce((acc, t) => {
        if (t.hint == EnumToken.EOFTokenType) {
            return acc;
        }
        const token = getTokenType(t.token, t.hint);
        Object.defineProperty(token, 'loc', {
            ...definedPropertySettings,
            value: { sta: t.sta },
            enumerable: options.location !== false
        });
        acc.push(token);
        return acc;
    }, []));
}
/**
 * get the token type from a string
 * @param val
 * @param hint
 */
function getTokenType(val, hint) {
    if (hint != null) {
        return enumTokenHints.has(hint) ? { typ: hint } : { typ: hint, val };
    }
    switch (val) {
        case ' ':
            return { typ: EnumToken.WhitespaceTokenType };
        case ';':
            return { typ: EnumToken.SemiColonTokenType };
        case '{':
            return { typ: EnumToken.BlockStartTokenType };
        case '}':
            return { typ: EnumToken.BlockEndTokenType };
        case '[':
            return { typ: EnumToken.AttrStartTokenType };
        case ']':
            return { typ: EnumToken.AttrEndTokenType };
        case ':':
            return { typ: EnumToken.ColonTokenType };
        case ')':
            return { typ: EnumToken.EndParensTokenType };
        case '(':
            return { typ: EnumToken.StartParensTokenType };
        case '=':
            return { typ: EnumToken.DelimTokenType };
        case ',':
            return { typ: EnumToken.CommaTokenType };
        case '<':
            return { typ: EnumToken.LtTokenType };
        case '>':
            return { typ: EnumToken.GtTokenType };
    }
    if (val.charAt(0) == ':' && isPseudo(val)) {
        return val.endsWith('(') ? {
            typ: EnumToken.PseudoClassFuncTokenType,
            val: val.slice(0, -1),
            chi: []
        }
            : (
            // https://www.w3.org/TR/selectors-4/#single-colon-pseudos
            val.startsWith('::') || pseudoElements.includes(val) ? {
                typ: EnumToken.PseudoElementTokenType,
                val
            } :
                {
                    typ: EnumToken.PseudoClassTokenType,
                    val
                });
    }
    if (val.charAt(0) == '@' && isAtKeyword(val)) {
        return {
            typ: EnumToken.AtRuleTokenType,
            val: val.slice(1)
        };
    }
    if (val.endsWith('(') && isFunction(val)) {
        val = val.slice(0, -1);
        if (val == 'url') {
            return {
                typ: EnumToken.UrlFunctionTokenType,
                val,
                chi: []
            };
        }
        if (['linear-gradient', 'radial-gradient', 'repeating-linear-gradient', 'repeating-radial-gradient', 'conic-gradient', 'image', 'image-set', 'element', 'cross-fade', 'paint'].includes(val)) {
            return {
                typ: EnumToken.ImageFunctionTokenType,
                val,
                chi: []
            };
        }
        if (timingFunc.includes(val.toLowerCase())) {
            return {
                typ: EnumToken.TimingFunctionTokenType,
                val,
                chi: []
            };
        }
        if (timelineFunc.includes(val)) {
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
            val: +val
        };
    }
    if (isPercentage(val)) {
        return {
            typ: EnumToken.PercentageTokenType,
            val: +val.slice(0, -1)
        };
    }
    const dimension = parseDimension(val);
    if (dimension != null) {
        return dimension;
    }
    const v = val.toLowerCase();
    if (v == 'currentcolor' || v == 'transparent' || v in COLORS_NAMES) {
        return {
            typ: EnumToken.ColorTokenType,
            val: v,
            kin: ColorType.LIT
        };
    }
    if (isIdent(val)) {
        if (systemColors.has(v)) {
            return {
                typ: EnumToken.ColorTokenType,
                val,
                kin: ColorType.SYS
            };
        }
        if (deprecatedSystemColors.has(v)) {
            return {
                typ: EnumToken.ColorTokenType,
                val,
                kin: ColorType.DPSYS
            };
        }
        return {
            typ: val.startsWith('--') ? EnumToken.DashedIdenTokenType : EnumToken.IdenTokenType,
            val
        };
    }
    if (val.charAt(0) == '.' && isIdent(val.slice(1))) {
        return {
            typ: EnumToken.ClassSelectorTokenType,
            val
        };
    }
    if (val.charAt(0) == '#' && isHexColor(val)) {
        return {
            typ: EnumToken.ColorTokenType,
            val,
            kin: ColorType.HEX
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
/**
 * parse function tokens in a token array
 * @param tokens
 * @param options
 *
 * Example:
 *
 * ```ts
 *
 * import {parseString, parseTokens} from '@tbela99/css-parser';
 *
 * let tokens = parseString('body { color: red; }');
 * console.log(parseTokens(tokens));
 *
 *  tokens = parseString('#c322c980');
 * console.log(parseTokens(tokens));
 * ```
 *
 * @private
 */
function parseTokens(tokens, options = {}) {
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];
        if (t.typ == EnumToken.IdenTokenType && t.val == 'from' && i > 0) {
            const left = [];
            const right = [];
            let foundLeft = 0;
            let foundRight = 0;
            let k = i;
            let l = i;
            while (k > 0) {
                if (tokens[k - 1].typ == EnumToken.CommentTokenType || tokens[k - 1].typ == EnumToken.WhitespaceTokenType) {
                    left.push(tokens[--k]);
                    continue;
                }
                if (tokens[k - 1].typ == EnumToken.IdenTokenType || tokens[k - 1].typ == EnumToken.DashedIdenTokenType) {
                    foundLeft++;
                    left.push(tokens[--k]);
                    continue;
                }
                break;
            }
            while (++l < tokens.length) {
                if (tokens[l].typ == EnumToken.CommentTokenType || tokens[l].typ == EnumToken.WhitespaceTokenType) {
                    right.push(tokens[l]);
                    continue;
                }
                if (tokens[l].typ == EnumToken.IdenTokenType || tokens[l].typ == EnumToken.StringTokenType) {
                    foundRight++;
                    right.push(tokens[l]);
                    continue;
                }
                break;
            }
            if (foundLeft > 0 && foundRight == 1) {
                while (left?.[0].typ == EnumToken.WhitespaceTokenType) {
                    left.shift();
                }
                while (left.at(-1)?.typ == EnumToken.WhitespaceTokenType) {
                    left.pop();
                }
                tokens.splice(k, l - k + 1, {
                    typ: EnumToken.ComposesSelectorNodeType,
                    l: left,
                    r: right.reduce((a, b) => {
                        return a == null ? b : b.typ == EnumToken.IdenTokenType || b.typ == EnumToken.StringTokenType ? b : a;
                    }, null)
                });
                i = k;
                continue;
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
                    tokens[i + 1].typ = EnumToken.PseudoClassFuncTokenType;
                }
                else if (typ == EnumToken.IdenTokenType) {
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
            const attr = Object.assign(t, {
                typ: inAttr == 0 ? EnumToken.AttrTokenType : EnumToken.InvalidAttrTokenType,
                chi: tokens.splice(i + 1, k - i)
            });
            // @ts-ignore
            if (attr.chi.at(-1).typ == EnumToken.AttrEndTokenType) {
                // @ts-ignore
                attr.chi.pop();
            }
            // @ts-ignore
            if (attr.chi.length > 1) {
                // @ts-ignore
                parseTokens(attr.chi, t.typ);
            }
            let m = attr.chi.length;
            let val;
            for (m = 0; m < attr.chi.length; m++) {
                val = attr.chi[m];
                if (val.typ == EnumToken.StringTokenType) {
                    const slice = val.val.slice(1, -1);
                    if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                        Object.assign(val, { typ: EnumToken.IdenTokenType, val: slice });
                    }
                }
                else if (val.typ == EnumToken.LiteralTokenType && val.val == '|') {
                    let upper = m;
                    let lower = m;
                    while (++upper < attr.chi.length) {
                        if (attr.chi[upper].typ == EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    while (lower-- > 0) {
                        if (attr.chi[lower].typ == EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    // @ts-ignore
                    attr.chi[m] = {
                        typ: EnumToken.NameSpaceAttributeTokenType,
                        l: attr.chi[lower],
                        r: attr.chi[upper]
                    };
                    attr.chi.splice(upper, 1);
                    if (lower >= 0) {
                        attr.chi.splice(lower, 1);
                        m--;
                    }
                }
                else if ([
                    EnumToken.DashMatchTokenType, EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType, EnumToken.DelimTokenType
                ].includes(attr.chi[m].typ)) {
                    let upper = m;
                    let lower = m;
                    while (++upper < attr.chi.length) {
                        if (attr.chi[upper].typ == EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    while (lower-- > 0) {
                        if (attr.chi[lower].typ == EnumToken.CommentTokenType) {
                            continue;
                        }
                        break;
                    }
                    val = attr.chi[lower];
                    if (val.typ == EnumToken.StringTokenType) {
                        const slice = val.val.slice(1, -1);
                        if ((slice.charAt(0) != '-' || (slice.charAt(0) == '-' && isIdentStart(slice.charCodeAt(1)))) && isIdent(slice)) {
                            Object.assign(val, { typ: EnumToken.IdenTokenType, val: slice });
                        }
                    }
                    val = attr.chi[upper];
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
                    if (isIdentColor(t.chi[m].l)) {
                        t.chi[m].l.typ = EnumToken.IdenTokenType;
                    }
                    if (isIdentColor(t.chi[m].r)) {
                        t.chi[m].r.typ = EnumToken.IdenTokenType;
                    }
                    t.chi.splice(upper, 1);
                    t.chi.splice(lower, 1);
                    upper = m;
                    m--;
                    while (upper < t.chi.length && t.chi[upper].typ == EnumToken.WhitespaceTokenType) {
                        upper++;
                    }
                    if (upper < t.chi.length &&
                        t.chi[upper].typ == EnumToken.IdenTokenType &&
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
                t.chi = splitTokenList(t.chi).reduce((acc, t) => {
                    if (acc.length > 0) {
                        acc.push({ typ: EnumToken.CommaTokenType });
                    }
                    acc.push(buildExpression(t));
                    return acc;
                }, []);
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
                parseColor(t);
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
                    const count = t.chi.filter((t) => t.typ != EnumToken.CommentTokenType).length;
                    if (count == 1 ||
                        (i == 0 &&
                            (tokens[i + 1]?.typ == EnumToken.CommaTokenType || tokens.length == i + 1)) ||
                        (tokens[i - 1]?.typ == EnumToken.CommaTokenType && (tokens[i + 1]?.typ == EnumToken.CommaTokenType || tokens.length == i + 1))) {
                        tokens.splice(i, 1, ...t.chi);
                        i = Math.max(0, i - t.chi.length);
                    }
                }
            }
        }
    }
    return tokens;
}

export { doParse, getTokenType, parseAtRulePrelude, parseDeclarations, parseSelector, parseString, parseTokens, replaceToken, urlTokenMatcher };
