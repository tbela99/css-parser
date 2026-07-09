import { isIdentColor, isColor, parseColor } from '../syntax/syntax.js';
import { camelize, equalsIgnoreCase, dasherize } from './utils/text.js';
import { renderValue } from '../renderer/render.js';
import { EnumToken, ValidationLevel, EnumAstNodeStatus, ModuleCaseTransformEnum, ModuleScopeEnumOptions } from '../ast/types.js';
import { minify } from '../ast/minify.js';
import { expand } from '../ast/expand.js';
import { WalkerEvent, walk, walkValues } from '../ast/walk.js';
import { tokenize, tokenizeStream } from './tokenize.js';
import { definedPropertySettings, tokensfuncDefMap, pageMarginBoxType } from '../syntax/constants.js';
import { hashAlgorithms, hash } from './utils/hash.js';
import { parseSelector } from './utils/selector.js';
import { parseDeclaration } from './utils/declaration.js';
import { getSyntaxRule } from '../validation/config.js';
import { matchSelectorSyntax, trimArray, matchAllSyntax, createValidationContext } from '../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../validation/parser/typedef.js';
import { matchAtRuleImportSyntax } from './utils/at-rule-import.js';
import { matchAtRuleWhenElseSyntax } from './utils/at-rule-when-else.js';
import { parseAtRuleSupportSyntax } from './utils/at-rule-support.js';
import { replaceNodeOrValue, trimWhiteSpaceTokens } from './utils/token.js';
import { parseAtRuleContainerQueryList } from './utils/at-rule-container.js';
import { parseMediaqueryList } from './utils/at-rule-media.js';
import { matchAtRuleSyntax } from './utils/at-rule.js';
import { parseAtRuleFontFeatureValues } from './utils/at-rule-font-feature-values.js';
import { matchGenericSyntax } from './utils/at-rule-generic.js';
import { memoize } from './utils/cache.js';

function renderTokens(tokens, options) {
    if (tokens == null || tokens.length === 0)
        return "";
    if (options != null)
        return tokens.map((t) => renderValue(t, options)).join("");
    return tokens.map((t) => renderValue(t)).join("");
}
const trimWhiteSpace = [
    EnumToken.CommentTokenType,
    EnumToken.GtTokenType,
    EnumToken.GteTokenType,
    EnumToken.LtTokenType,
    EnumToken.LteTokenType,
    EnumToken.ColumnCombinatorTokenType,
];
const BadTokensTypes = [
    EnumToken.BadCommentTokenType,
    EnumToken.BadCdoTokenType,
    EnumToken.BadUrlTokenType,
    EnumToken.BadStringTokenType,
];
let keyNameCounter = 0;
let keyNameCache = {};
const forbiddenStartCharacters = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((c) => c.charCodeAt(0));
/**
 * Short-scoped name generator.
 *
 * @param localName
 * @param filePath
 * @param pattern
 * @param hashLength
 *
 * @returns string
 */
const getShortNameGenerator = memoize((localName, filePath, pattern, hashLength = 5) => {
    const key = `${localName}_${filePath}_${pattern}_${hashLength}`;
    if (key in keyNameCache) {
        return keyNameCache[key];
    }
    let value = keyNameCounter.toString(36);
    keyNameCounter++;
    while (forbiddenStartCharacters.includes(value.charCodeAt(0))) {
        value = keyNameCounter.toString(36);
        keyNameCounter++;
    }
    return (keyNameCache[key] = value);
});
function reject(reason) {
    throw new Error(reason ?? "Parsing aborted");
}
/**
 * Transform case of key name
 * @param key
 * @param how
 *
 * @throws Error
 * @private
 */
const getKeyName = memoize((key, how) => {
    switch (how) {
        case ModuleCaseTransformEnum.CamelCase:
        case ModuleCaseTransformEnum.CamelCaseOnly:
            return camelize(key);
        case ModuleCaseTransformEnum.DashCase:
        case ModuleCaseTransformEnum.DashCaseOnly:
            return dasherize(key);
    }
    return key;
});
/**
 * Generate scoped name
 * @param localName
 * @param filePath
 * @param pattern
 * @param hashLength
 *
 * @throws Error
 * @private
 */
const generateScopedName = memoize(async (localName, filePath, pattern, hashLength = 5) => {
    if (localName.startsWith("--")) {
        localName = localName.slice(2);
    }
    const matches = /.*?(([^/]+)\/)?([^/\\]*?)(\.([^?/]+))?([?].*)?$/.exec(filePath);
    const folder = matches?.[2]?.replace?.(/[^A-Za-z0-9_-]/g, "_") ?? "";
    const fileBase = matches?.[3] ?? "";
    const ext = matches?.[5] ?? "";
    const path = filePath.replace(/[^A-Za-z0-9_-]/g, "_");
    // sanitize localName for safe char set (replace spaces/illegal chars)
    const safeLocal = localName.replace(/[^A-Za-z0-9_-]/g, "_");
    const hashString = `${localName}::${filePath}`;
    let result = "";
    let inParens = 0;
    let key = "";
    let position = 0;
    // Compose final scoped name. Ensure the entire class doesn't start with a digit:
    for (const char of pattern) {
        position += char.length;
        if (char == "[") {
            inParens++;
            if (inParens != 1) {
                throw new Error(`Unexpected character: '${char} at position ${position - 1}' in pattern '${pattern}'`);
            }
            continue;
        }
        if (char == "]") {
            inParens--;
            if (inParens != 0) {
                throw new Error(`Unexpected character: '${char}:${position - 1}'`);
            }
            let hashAlgo = null;
            let length = null;
            if (key.includes(":")) {
                const parts = key.split(":");
                if (parts.length == 2) {
                    // @ts-ignore
                    [key, length] = parts;
                    // @ts-ignore
                    if (key == "hash" && hashAlgorithms.includes(length)) {
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
            const slice = length != null && length != fileBase.length;
            switch (key) {
                case "hash":
                    result += await hash(hashString, length ?? hashLength, hashAlgo);
                    break;
                case "name":
                    // @ts-expect-error
                    result += slice ? fileBase.slice(0, +length) : fileBase;
                    break;
                case "local":
                    // @ts-expect-error
                    result += slice ? safeLocal.slice(0, +length) : localName;
                    break;
                case "ext":
                    // @ts-expect-error
                    result += slice ? ext.slice(0, +length) : ext;
                    break;
                case "path":
                    // @ts-expect-error
                    result += slice ? path.slice(0, +length) : path;
                    break;
                case "folder":
                    // @ts-expect-error
                    result += slice ? folder.slice(0, +length) : folder;
                    break;
                default:
                    throw new Error(`Unsupported key: '${key}'`);
            }
            key = "";
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
    return (/^[0-9]/.test(result) ? "_" : "") + result;
});
/**
 * Parse css string
 * @param iter
 * @param options
 *
 * @throws Error
 * @private
 */
async function doParse(iter, options = {}) {
    if (options.signal != null) {
        options.signal.addEventListener("abort", reject);
    }
    options = {
        src: "",
        sourcemap: false,
        minify: true,
        pass: 1,
        expandIfSyntax: false,
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
        validation: false,
        lenient: true,
        ...options,
    };
    if (typeof options.validation == "boolean") {
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
        src: options.src ?? "",
        bytesIn: 0,
        nodesCount: 0,
        tokensCount: 0,
        importedBytesIn: 0,
        tokenize: `0ms`,
        parse: `0ms`,
        minify: `0ms`,
        total: `0ms`,
        imports: [],
    };
    const invalidNodes = [];
    let ast = {
        typ: EnumToken.StyleSheetNodeType,
        chi: [],
    };
    let tokens = [];
    let context = ast;
    if (options.sourcemap) {
        ast.loc = {
            sta: {
                ind: 0,
                lin: 1,
                col: 1,
            },
            end: {
                ind: 0,
                lin: 1,
                col: 1,
            },
            src: "",
        };
    }
    let valuesHandlers;
    let preValuesHandlers;
    let postValuesHandlers;
    let preVisitorsHandlersMap;
    let visitorsHandlersMap;
    let postVisitorsHandlersMap;
    const imports = [];
    let item;
    let node;
    // @ts-ignore ignore error
    let isAsync = typeof iter[Symbol.asyncIterator] === "function";
    let parensMatch = 0;
    if (options.visitor != null) {
        valuesHandlers = new Map();
        preValuesHandlers = new Map();
        postValuesHandlers = new Map();
        preVisitorsHandlersMap = new Map();
        visitorsHandlersMap = new Map();
        postVisitorsHandlersMap = new Map();
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
                if (typeof value == "function") {
                    if (!valuesHandlers.has(EnumToken[key])) {
                        valuesHandlers.set(EnumToken[key], []);
                    }
                    valuesHandlers.get(EnumToken[key]).push(value);
                }
                else if (typeof value == "object" &&
                    "type" in value &&
                    "handler" in value &&
                    value.type in WalkerEvent) {
                    if (value.type == WalkerEvent.Enter) {
                        if (!preValuesHandlers.has(EnumToken[key])) {
                            preValuesHandlers.set(EnumToken[key], []);
                        }
                        preValuesHandlers
                            .get(EnumToken[key])
                            .push(value.handler);
                    }
                    else if (value.type == WalkerEvent.Leave) {
                        if (!postValuesHandlers.has(EnumToken[key])) {
                            postValuesHandlers.set(EnumToken[key], []);
                        }
                        postValuesHandlers
                            .get(EnumToken[key])
                            .push(value.handler);
                    }
                }
                else {
                    errors.push({ action: "ignore", message: `doParse: visitor.${key} is not a valid key name` });
                }
            }
            else if (["Declaration", "Rule", "AtRule", "KeyframesRule", "KeyframesAtRule"].includes(key)) {
                if (typeof value == "function") {
                    if (!visitorsHandlersMap.has(key)) {
                        visitorsHandlersMap.set(key, []);
                    }
                    visitorsHandlersMap
                        .get(key)
                        .push(value);
                }
                else if (typeof value == "object") {
                    if ("type" in value && "handler" in value && value.type in WalkerEvent) {
                        if (value.type == WalkerEvent.Enter) {
                            if (!preVisitorsHandlersMap.has(key)) {
                                preVisitorsHandlersMap.set(key, []);
                            }
                            preVisitorsHandlersMap
                                .get(key)
                                .push(value.handler);
                        }
                        else if (value.type == WalkerEvent.Leave) {
                            if (!postVisitorsHandlersMap.has(key)) {
                                postVisitorsHandlersMap.set(key, []);
                            }
                            postVisitorsHandlersMap
                                .get(key)
                                .push(value.handler);
                        }
                    }
                    else {
                        if (!visitorsHandlersMap.has(key)) {
                            visitorsHandlersMap.set(key, []);
                        }
                        visitorsHandlersMap
                            .get(key)
                            .push(value);
                    }
                }
                else {
                    errors.push({ action: "ignore", message: `doParse: visitor.${key} is not a valid key name` });
                }
            }
            else {
                errors.push({ action: "ignore", message: `doParse: visitor.${key} is not a valid key name` });
            }
        }
    }
    if (Array.isArray(iter)) {
        // @ts-expect-error
        iter = iter[Symbol.iterator]();
    }
    while ((item = isAsync
        ? // @ts-expect-error
            (await iter.next()).value
        : // @ts-expect-error
            iter.next().value)) {
        stats.bytesIn = item.bytesIn;
        stats.tokensCount++;
        if (options.sourcemap !== false) {
            Object.defineProperty(item.token, "loc", {
                ...definedPropertySettings,
                value: item.token.loc,
                enumerable: true,
            });
        }
        if (BadTokensTypes.includes(item.token.typ)) {
            tokens.push(item.token);
            errors.push({
                action: "drop",
                message: "Bad token",
                syntax: null,
                node: item.token,
                location: item.token.loc,
            });
            // bad token
            continue;
        }
        if (item.token.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(item.token.typ)) {
            parensMatch++;
        }
        else if (item.token.typ === EnumToken.EndParensTokenType && parensMatch > 0) {
            parensMatch--;
        }
        tokens.push(item.token);
        if ((parensMatch === 0 &&
            (item.token.typ === EnumToken.SemiColonTokenType ||
                item.token.typ === EnumToken.BlockStartTokenType)) ||
            item.token.typ === EnumToken.EOFTokenType) {
            node = parseNode(tokens, context, options, errors, stats, invalidNodes);
            if (node != null) {
                if ("chi" in node) {
                    stack.push(node);
                    context = node;
                }
                else if (node.typ == EnumToken.AtRuleNodeType && node.nam === "import") {
                    imports.push(node);
                }
            }
            else if (item.token.typ == EnumToken.BlockStartTokenType) {
                let inBlock = 1;
                tokens = [item.token];
                do {
                    item = isAsync
                        ? // @ts-expect-error
                            (await iter.next()).value
                        : // @ts-expect-error
                            iter.next().value;
                    if (item == null) {
                        break;
                    }
                    tokens.push(item.token);
                    if (item.token.typ === EnumToken.BlockStartTokenType) {
                        inBlock++;
                    }
                    else if (item.token.typ === EnumToken.BlockEndTokenType) {
                        inBlock--;
                    }
                } while (inBlock != 0);
                if (tokens.length > 0) {
                    errors.push({
                        action: "drop",
                        message: "invalid block",
                        location: {
                            src,
                            sta: tokens[0].loc.sta,
                            end: tokens[tokens.length - 1].loc.end,
                        },
                    });
                }
            }
            tokens = [];
        }
        else if (item.token.typ === EnumToken.BlockEndTokenType) {
            parseNode(tokens, context, options, errors, stats, invalidNodes);
            if (context.loc != null) {
                context.loc.end = item.token.loc.end;
            }
            const previousNode = stack.pop();
            context = (stack[stack.length - 1] ?? ast);
            if (options.removeEmpty &&
                previousNode != null &&
                previousNode.chi.length == 0 &&
                context.chi[context.chi.length - 1] == previousNode) {
                context.chi.pop();
            }
            tokens = [];
        }
    }
    if (tokens.length > 0) {
        node = parseNode(tokens, context, options, errors, stats, invalidNodes);
        if (node != null) {
            if (node.typ == EnumToken.AtRuleNodeType && "import" === node.val) {
                imports.push(node);
            }
            if ("chi" in node /* && node.typ != EnumToken.InvalidRuleNodeType */) {
                stack.push(node);
                context = node;
            }
        }
    }
    if (imports.length > 0 && options.resolveImport) {
        await Promise.all(imports.map(async (node) => {
            if (node.state !== EnumAstNodeStatus.Validated) {
                return;
            }
            const token = node.tokens[0];
            const url = token.typ == EnumToken.StringTokenType ? token.val.slice(1, -1) : token.val;
            try {
                const result = options.load(url, options.src || options.cwd);
                const stream = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == "AsyncFunction"
                    ? await result
                    : result;
                const root = await doParse(stream instanceof ReadableStream
                    ? tokenizeStream(stream)
                    : tokenize({
                        stream,
                        src: options.resolve(url, options.src || options.cwd).relative,
                        buffer: "",
                        offset: 0,
                        position: { ind: 0, lin: 1, col: 1 },
                        currentPosition: { ind: -1, lin: 1, col: 0 },
                    }), Object.assign({}, options, {
                    minify: false,
                    setParent: false,
                    src: options.resolve(url, options.src || options.cwd).relative,
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
                errors.push({ action: "ignore", message: ("doParse: " + error.message), error });
            }
        }));
    }
    const endParseTime = performance.now();
    if (options.expandNestingRules) {
        ast = expand(ast);
    }
    let replacement;
    let callable;
    if (options.visitor != null) {
        let parens;
        for (const result of walk(ast)) {
            parens = null;
            if (valuesHandlers.size > 0 ||
                preVisitorsHandlersMap.size > 0 ||
                visitorsHandlersMap.size > 0 ||
                postVisitorsHandlersMap.size > 0) {
                if ((result.node.typ == EnumToken.DeclarationNodeType &&
                    (preVisitorsHandlersMap.has("Declaration") ||
                        visitorsHandlersMap.has("Declaration") ||
                        postVisitorsHandlersMap.has("Declaration"))) ||
                    (result.node.typ == EnumToken.AtRuleNodeType &&
                        (preVisitorsHandlersMap.has("AtRule") ||
                            visitorsHandlersMap.has("AtRule") ||
                            postVisitorsHandlersMap.has("AtRule"))) ||
                    (result.node.typ == EnumToken.KeyframesAtRuleNodeType &&
                        (preVisitorsHandlersMap.has("KeyframesAtRule") ||
                            visitorsHandlersMap.has("KeyframesAtRule") ||
                            postVisitorsHandlersMap.has("KeyframesAtRule")))) {
                    const handlers = [];
                    const key = result.node.typ == EnumToken.DeclarationNodeType
                        ? "Declaration"
                        : result.node.typ == EnumToken.AtRuleNodeType
                            ? "AtRule"
                            : "KeyframesAtRule";
                    if (preVisitorsHandlersMap.has(key)) {
                        handlers.push(
                        // @ts-expect-error
                        ...preVisitorsHandlersMap.get(key));
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
                        callable =
                            typeof handler == "function"
                                ? handler
                                : handler[camelize(node.typ === EnumToken.DeclarationNodeType ||
                                    node.typ === EnumToken.AtRuleNodeType
                                    ? node.nam
                                    : node.val)];
                        if (callable == null) {
                            continue;
                        }
                        // @ts-expect-error
                        replacement = callable(node, result.parent, ast, function* () {
                            if (parens == null) {
                                // @ts-expect-error
                                parens = [...result.parents()];
                            }
                            yield* parens[Symbol.iterator]();
                        });
                        if (replacement == null) {
                            continue;
                        }
                        isAsync =
                            replacement instanceof Promise ||
                                Object.getPrototypeOf(replacement).constructor.name == "AsyncFunction";
                        if (replacement) {
                            replacement = await replacement;
                        }
                        if (replacement == null || replacement == node) {
                            continue;
                        }
                        // @ts-ignore
                        node = replacement;
                        if (Array.isArray(node)) {
                            break;
                        }
                    }
                    if (node != result.node) {
                        replaceNodeOrValue(result.parent, result.node, node);
                    }
                }
                else if ((result.node.typ == EnumToken.RuleNodeType &&
                    (preVisitorsHandlersMap.has("Rule") ||
                        visitorsHandlersMap.has("Rule") ||
                        postVisitorsHandlersMap.has("Rule"))) ||
                    (result.node.typ == EnumToken.KeyFramesRuleNodeType &&
                        (preVisitorsHandlersMap.has("KeyframesRule") ||
                            visitorsHandlersMap.has("KeyframesRule") ||
                            postVisitorsHandlersMap.has("KeyframesRule")))) {
                    const handlers = [];
                    const key = result.node.typ == EnumToken.RuleNodeType ? "Rule" : "KeyframesRule";
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
                        replacement = callable(node, result.parent, result.root, 
                        // @ts-expect-error
                        function* () {
                            if (parens == null) {
                                // @ts-expect-error
                                parens = [...result.parents()];
                            }
                            yield* parens[Symbol.iterator]();
                        });
                        if (replacement == null) {
                            continue;
                        }
                        isAsync =
                            replacement instanceof Promise ||
                                Object.getPrototypeOf(replacement).constructor.name == "AsyncFunction";
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
                        replaceNodeOrValue(result.parent, result.node, node);
                    }
                }
                else if (valuesHandlers.size > 0) {
                    let node = null;
                    node = result.node;
                    if (valuesHandlers.has(node.typ)) {
                        for (const valueHandler of valuesHandlers.get(node.typ)) {
                            callable = valueHandler;
                            replacement = callable(node, result.parent, ast, 
                            // @ts-expect-error
                            function* () {
                                if (parens == null) {
                                    // @ts-expect-error
                                    parens = [...result.parents()];
                                }
                                yield* parens[Symbol.iterator]();
                            });
                            if (replacement == null) {
                                continue;
                            }
                            isAsync =
                                replacement instanceof Promise ||
                                    Object.getPrototypeOf(replacement).constructor.name == "AsyncFunction";
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
                        replaceNodeOrValue(result.parent, value, node);
                    }
                    const tokens = Array.isArray(result.node.tokens) ? result.node.tokens : [];
                    if (Array.isArray(result.node.val)) {
                        tokens.push(...result.node.val);
                    }
                    if (tokens.length == 0) {
                        continue;
                    }
                    for (const { value, parent, root, parents } of walkValues(tokens, result.node)) {
                        node = value;
                        if (valuesHandlers.has(node.typ)) {
                            let parens = null;
                            for (const valueHandler of valuesHandlers.get(node.typ)) {
                                callable = valueHandler;
                                // @ts-expect-error
                                let result = callable(node, parent, root, function* () {
                                    if (parens == null) {
                                        // @ts-expect-error
                                        parens = [...parents()];
                                    }
                                    yield* parens[Symbol.iterator]();
                                });
                                if (result == null) {
                                    continue;
                                }
                                isAsync =
                                    result instanceof Promise ||
                                        Object.getPrototypeOf(result).constructor.name == "AsyncFunction";
                                if (isAsync) {
                                    result = await result;
                                }
                                if (result != null && result != node) {
                                    node = result;
                                }
                                if (Array.isArray(node)) {
                                    break;
                                }
                            }
                        }
                        if (node != value) {
                            // @ts-ignore
                            replaceNodeOrValue(parent, value, node);
                        }
                    }
                }
            }
        }
    }
    if (invalidNodes.length > 0) {
        let k = invalidNodes.length;
        while (k-- > 0) {
            if (options.lenient && invalidNodes[k].state == EnumAstNodeStatus.Unknown) {
                continue;
            }
            invalidNodes[k].parent.chi.splice(invalidNodes[k].parent.chi.indexOf(invalidNodes[k]), 1);
        }
    }
    while (stack.length > 0 && context != ast) {
        const previousNode = stack.pop();
        context = (stack[stack.length - 1] ?? ast);
        // remove empty nodes
        if (options.removeEmpty &&
            previousNode != null &&
            previousNode.chi.length == 0 &&
            context.chi[context.chi.length - 1] == previousNode) {
            context.chi.pop();
            continue;
        }
        // remove invalid nodes
        if (!options.lenient &&
            previousNode?.parent != null &&
            // @ts-expect-error
            (previousNode.typ == EnumToken.InvalidRuleNodeType || previousNode.typ == EnumToken.InvalidAtRuleNodeType)) {
            for (let i = context.chi.length - 1; i >= 0; i--) {
                if (context.chi[i] == previousNode) {
                    context.chi.splice(i, 1);
                    break;
                }
            }
        }
        break;
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
            tokenize: `${(options?.parseInfo?.time ?? 0).toFixed(2)}ms`,
            total: `${(endTime - startTime).toFixed(2)}ms`,
        },
    };
    if (options.module) {
        const moduleSettings = {
            hashLength: 5,
            filePath: "",
            scoped: ModuleScopeEnumOptions.Local,
            naming: ModuleCaseTransformEnum.IgnoreCase,
            pattern: "",
            generateScopedName,
            ...(typeof options.module != "object" ? {} : options.module),
        };
        const parseModuleTime = performance.now();
        const namesMapping = {};
        const global = new Set();
        const processed = new Set();
        const pattern = typeof options.module == "boolean" ? null : moduleSettings.pattern;
        const importMapping = {};
        const cssVariablesMap = {};
        const importedCssVariables = {};
        let mapping = {};
        let revMapping = {};
        let filePath = typeof options.module == "boolean"
            ? options.src
            : (moduleSettings.filePath ?? options.src);
        filePath =
            filePath === ""
                ? options.src
                : options.resolve(filePath, options.dirname(options.src), options.cwd).relative;
        if (typeof options.module == "number") {
            if (options.module & ModuleCaseTransformEnum.CamelCase) {
                moduleSettings.naming = ModuleCaseTransformEnum.CamelCase;
            }
            else if (options.module & ModuleCaseTransformEnum.CamelCaseOnly) {
                moduleSettings.naming = ModuleCaseTransformEnum.CamelCaseOnly;
            }
            else if (options.module & ModuleCaseTransformEnum.DashCase) {
                moduleSettings.naming = ModuleCaseTransformEnum.DashCase;
            }
            else if (options.module & ModuleCaseTransformEnum.DashCaseOnly) {
                moduleSettings.naming = ModuleCaseTransformEnum.DashCaseOnly;
            }
            if (options.module & ModuleScopeEnumOptions.Global) {
                moduleSettings.scoped = ModuleScopeEnumOptions.Global;
            }
            if (options.module & ModuleScopeEnumOptions.Pure) {
                // @ts-ignore
                moduleSettings.scoped |= ModuleScopeEnumOptions.Pure;
            }
            if (options.module & ModuleScopeEnumOptions.Shortest) {
                // @ts-ignore
                moduleSettings.scoped |= ModuleScopeEnumOptions.Shortest;
            }
            if (options.module & ModuleScopeEnumOptions.ICSS) {
                // @ts-ignore
                moduleSettings.scoped |= ModuleScopeEnumOptions.ICSS;
            }
        }
        if (typeof moduleSettings.scoped == "boolean") {
            moduleSettings.scoped = moduleSettings.scoped
                ? ModuleScopeEnumOptions.Local
                : ModuleScopeEnumOptions.Global;
        }
        if (moduleSettings.scoped & ModuleScopeEnumOptions.Shortest) {
            moduleSettings.generateScopedName = getShortNameGenerator;
        }
        moduleSettings.filePath = filePath;
        moduleSettings.pattern =
            pattern != null && pattern !== "" ? pattern : filePath === "" ? `[local]_[hash]` : `[local]_[hash]_[name]`;
        for (const { node, parent } of walk(ast)) {
            if (node.typ == EnumToken.CssVariableImportTokenType) {
                const url = node.val.find((t) => t.typ == EnumToken.StringTokenType).val.slice(1, -1);
                const src = options.resolve(url, options.dirname(options.src), options.cwd);
                const result = options.load(src, "");
                const stream = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == "AsyncFunction"
                    ? await result
                    : result;
                const parseInfo = {
                    stream,
                    buffer: "",
                    offset: 0,
                    time: 0,
                    position: { ind: 0, lin: 1, col: 1 },
                    currentPosition: { ind: -1, lin: 1, col: 0 },
                };
                const root = await doParse(stream instanceof ReadableStream ? tokenizeStream(stream, parseInfo) : tokenize(parseInfo), Object.assign({}, options, {
                    minify: false,
                    setParent: false,
                    src: src.relative,
                }));
                options.parseInfo.time += parseInfo.time;
                cssVariablesMap[node.nam] = root.cssModuleVariables;
                parent.chi.splice(parent.chi.indexOf(node), 1);
                continue;
            }
            if (node.typ == EnumToken.CssVariableDeclarationMapTokenType) {
                const from = node.from.find((t) => t.typ == EnumToken.IdenTokenType || isIdentColor(t));
                if (!(from.val in cssVariablesMap)) {
                    errors.push({
                        node,
                        message: `could not resolve @value import from '${from.val}'`,
                        action: "drop",
                    });
                }
                else {
                    for (const token of node.vars) {
                        if (token.typ == EnumToken.IdenTokenType || isIdentColor(token)) {
                            if (!(token.val in cssVariablesMap[from.val])) {
                                errors.push({
                                    node,
                                    message: `value '${token.val}' is not exported from '${from.val}'`,
                                    action: "drop",
                                });
                                continue;
                            }
                            result.cssModuleVariables ??= {};
                            result.cssModuleVariables[token.val] = importedCssVariables[token.val] = cssVariablesMap[from.val][token.val];
                        }
                    }
                }
                parent.chi.splice(parent.chi.indexOf(node), 1);
                continue;
            }
            if (node.typ == EnumToken.CssVariableTokenType) {
                if (parent?.typ == EnumToken.StyleSheetNodeType) {
                    if (result.cssModuleVariables == null) {
                        result.cssModuleVariables = {};
                    }
                    result.cssModuleVariables[node.nam] = node;
                }
                parent.chi.splice(parent.chi.indexOf(node), 1);
                continue;
            }
            if (node.typ == EnumToken.DeclarationNodeType) {
                if (node.nam.startsWith("--")) {
                    if (!(node.nam in namesMapping)) {
                        let result = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                            ? node.nam
                            : moduleSettings.generateScopedName(node.nam, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                        let value = result instanceof Promise ? await result : result;
                        mapping[node.nam] =
                            "--" +
                                (moduleSettings.naming & ModuleCaseTransformEnum.DashCaseOnly ||
                                    moduleSettings.naming & ModuleCaseTransformEnum.CamelCaseOnly
                                    ? getKeyName(value, moduleSettings.naming)
                                    : value);
                        revMapping[node.nam] = node.nam;
                    }
                    node.nam = mapping[node.nam];
                }
                if (equalsIgnoreCase("composes", node.nam)) {
                    const tokens = [];
                    // let isValid: boolean = true;
                    for (const token of node.val) {
                        if (token.typ == EnumToken.ComposesSelectorNodeType) {
                            tokens.push(token);
                        }
                    }
                    // find parent rule
                    let parentRule = node.parent;
                    while (parentRule != null && parentRule.typ != EnumToken.RuleNodeType) {
                        parentRule = parentRule.parent;
                    }
                    if ( /* !isValid || */tokens.length == 0) {
                        errors.push({
                            action: "drop",
                            message: `composes is empty`,
                            node,
                        });
                        parentRule.chi.splice(parentRule.chi.indexOf(node), 1);
                        continue;
                    }
                    for (const token of tokens) {
                        // composes: a b c;
                        if (token.r == null) {
                            for (const rule of token.l) {
                                if (rule.typ == EnumToken.WhitespaceTokenType ||
                                    rule.typ == EnumToken.CommentTokenType) {
                                    continue;
                                }
                                if (!(rule.val in mapping)) {
                                    let result = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                        ? rule.val
                                        : moduleSettings.generateScopedName(rule.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                    let value = result instanceof Promise ? await result : result;
                                    mapping[rule.val] =
                                        (rule.typ == EnumToken.DashedIdenTokenType ? "--" : "") +
                                            (moduleSettings.naming & ModuleCaseTransformEnum.DashCaseOnly ||
                                                moduleSettings.naming & ModuleCaseTransformEnum.CamelCaseOnly
                                                ? getKeyName(value, moduleSettings.naming)
                                                : value);
                                    revMapping[mapping[rule.val]] = rule.val;
                                }
                                if (parentRule != null) {
                                    for (const tk of parentRule.tokens) {
                                        if (tk.typ == EnumToken.ClassSelectorTokenType) {
                                            const val = tk.val.slice(1);
                                            if (val in revMapping) {
                                                const key = revMapping[val];
                                                mapping[key] = [
                                                    ...new Set([
                                                        ...mapping[key].split(" "),
                                                        mapping[rule.val],
                                                    ]),
                                                ].join(" ");
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        // composes: a b c from 'file.css';
                        else if (token.r.typ == EnumToken.String) {
                            const url = token.r.val.slice(1, -1);
                            const src = options.resolve(url, options.dirname(options.src), options.cwd);
                            const result = options.load(src, "");
                            const stream = result instanceof Promise ||
                                Object.getPrototypeOf(result).constructor.name == "AsyncFunction"
                                ? await result
                                : result;
                            const root = await doParse(stream instanceof ReadableStream
                                ? tokenizeStream(stream)
                                : tokenize({
                                    stream,
                                    buffer: "",
                                    offset: 0,
                                    position: { ind: 0, lin: 1, col: 1 },
                                    currentPosition: { ind: -1, lin: 1, col: 0 },
                                }), Object.assign({}, options, {
                                minify: false,
                                setParent: false,
                                src: src.relative,
                            }));
                            const srcIndex = (src.relative.startsWith("/") || src.relative.startsWith("../") ? "" : "./") +
                                src.relative;
                            if (Object.keys(root.mapping).length > 0) {
                                importMapping[srcIndex] = {};
                            }
                            if (parentRule != null) {
                                for (const tk of parentRule.tokens) {
                                    if (tk.typ == EnumToken.ClassSelectorTokenType) {
                                        const val = tk.val.slice(1);
                                        if (val in revMapping) {
                                            const key = revMapping[val];
                                            const values = [];
                                            for (const iden of token.l) {
                                                if (iden.typ != EnumToken.IdenTokenType &&
                                                    iden.typ != EnumToken.DashedIdenTokenType) {
                                                    continue;
                                                }
                                                if (!(iden.val in root.mapping)) {
                                                    const result = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                                        ? iden.val
                                                        : moduleSettings.generateScopedName(iden.val, srcIndex, moduleSettings.pattern, moduleSettings.hashLength);
                                                    let value = result instanceof Promise ? await result : result;
                                                    root.mapping[iden.val] =
                                                        moduleSettings.naming & ModuleCaseTransformEnum.DashCaseOnly ||
                                                            moduleSettings.naming & ModuleCaseTransformEnum.CamelCaseOnly
                                                            ? getKeyName(value, moduleSettings.naming)
                                                            : value;
                                                    root.revMapping[root.mapping[iden.val]] = iden.val;
                                                }
                                                importMapping[srcIndex][iden.val] =
                                                    root.mapping[iden.val];
                                                values.push(root.mapping[iden.val]);
                                            }
                                            mapping[key] = [...new Set([...mapping[key].split(" "), ...values])].join(" ");
                                        }
                                    }
                                }
                            }
                        }
                        // composes: a b c from global;
                        else if (token.r.typ == EnumToken.IdenTokenType) {
                            // global
                            if (parentRule != null) {
                                if (equalsIgnoreCase("global", token.r.val)) {
                                    for (const tk of parentRule.tokens) {
                                        if (tk.typ == EnumToken.ClassSelectorTokenType) {
                                            const val = tk.val.slice(1);
                                            if (val in revMapping) {
                                                const key = revMapping[val];
                                                mapping[key] = [
                                                    ...new Set([
                                                        ...mapping[key].split(" "),
                                                        ...token.l.reduce((acc, curr) => {
                                                            if (curr.typ == EnumToken.IdenTokenType) {
                                                                acc.push(curr.val);
                                                            }
                                                            return acc;
                                                        }, []),
                                                    ]),
                                                ].join(" ");
                                            }
                                        }
                                    }
                                }
                                else {
                                    errors.push({
                                        action: "drop",
                                        message: `composes '${token.r.val}' is not supported`,
                                        node,
                                    });
                                }
                            }
                        }
                    }
                    parentRule.chi.splice(parentRule.chi.indexOf(node), 1);
                }
                if (node.typ == EnumToken.DeclarationNodeType &&
                    [
                        "grid-column",
                        "grid-column-start",
                        "grid-column-end",
                        "grid-row",
                        "grid-row-start",
                        "grid-row-end",
                        "grid-template",
                        "grid-template-columns",
                        "grid-template-rows",
                    ].includes(node.nam)) {
                    for (const { value } of walkValues(node.val, node)) {
                        if (value.typ != EnumToken.IdenTokenType) {
                            continue;
                        }
                        let idenToken = value.val;
                        let suffix = "";
                        if (idenToken.endsWith("-start")) {
                            suffix = "-start";
                            idenToken = idenToken.slice(0, -6);
                        }
                        else if (idenToken.endsWith("-end")) {
                            suffix = "-end";
                            idenToken = idenToken.slice(0, -4);
                        }
                        if (!(idenToken in mapping)) {
                            let result = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                ? idenToken
                                : moduleSettings.generateScopedName(idenToken, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                            if (result instanceof Promise) {
                                result = await result;
                            }
                            mapping[idenToken] = result;
                            revMapping[result] = idenToken;
                            if (suffix !== "") {
                                idenToken += suffix;
                                if (!(idenToken in mapping)) {
                                    mapping[idenToken] = result + suffix;
                                    revMapping[result + suffix] = idenToken;
                                }
                            }
                        }
                        value.val = mapping[idenToken];
                    }
                }
                else if (node.nam == "grid-template-areas" || node.nam == "grid-template") {
                    for (let i = 0; i < node.val.length; i++) {
                        if (node.val[i].typ == EnumToken.String) {
                            const tokens = parseString(node.val[i].val.slice(1, -1));
                            for (const { value } of walkValues(tokens)) {
                                if (value.typ == EnumToken.IdenTokenType ||
                                    value.typ == EnumToken.DashedIdenTokenType) {
                                    if (value.val in mapping) {
                                        value.val = mapping[value.val];
                                    }
                                    else {
                                        let result = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                            ? value.val
                                            : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                        if (result instanceof Promise) {
                                            result = await result;
                                        }
                                        mapping[value.val] = result;
                                        revMapping[result] = value.val;
                                        value.val = result;
                                    }
                                }
                            }
                            node.val[i].val =
                                node.val[i].val.charAt(0) +
                                    renderTokens(tokens) +
                                    node.val[i].val.charAt(node.val[i].val.length - 1);
                        }
                    }
                }
                else if (node.nam == "animation" || node.nam == "animation-name") {
                    for (const { value } of walkValues(node.val, node)) {
                        if (value.typ == EnumToken.IdenTokenType &&
                            ![
                                "none",
                                "infinite",
                                "normal",
                                "reverse",
                                "alternate",
                                "alternate-reverse",
                                "forwards",
                                "backwards",
                                "both",
                                "running",
                                "paused",
                                "linear",
                                "ease",
                                "ease-in",
                                "ease-out",
                                "ease-in-out",
                                "step-start",
                                "step-end",
                                "jump-start",
                                "jump-end",
                                "jump-none",
                                "jump-both",
                                "start",
                                "end",
                                "inherit",
                                "initial",
                                "unset",
                            ].includes(value.val)) {
                            if (!(value.val in mapping)) {
                                const result = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                    ? value.val
                                    : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                mapping[value.val] = result instanceof Promise ? await result : result;
                                revMapping[mapping[value.val]] = value.val;
                            }
                            value.val = mapping[value.val];
                        }
                    }
                }
                for (const { value, parent } of walkValues(node.val, node)) {
                    if (value.typ == EnumToken.DashedIdenTokenType) {
                        if (!(value.val in mapping)) {
                            const result = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                ? value.val
                                : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                            let val = result instanceof Promise ? await result : result;
                            mapping[value.val] =
                                "--" +
                                    (moduleSettings.naming & ModuleCaseTransformEnum.DashCaseOnly ||
                                        moduleSettings.naming & ModuleCaseTransformEnum.CamelCaseOnly
                                        ? getKeyName(val, moduleSettings.naming)
                                        : val);
                            revMapping[mapping[value.val]] = value.val;
                        }
                        value.val = mapping[value.val];
                    }
                    else if ((value.typ == EnumToken.IdenTokenType || isIdentColor(value)) &&
                        value.val in importedCssVariables) {
                        replaceNodeOrValue(parent, value, importedCssVariables[value.val].val);
                    }
                }
            }
            else if (node.typ == EnumToken.RuleNodeType) {
                if (node.tokens == null) {
                    const tokens = parseString(node.sel);
                    matchSelectorSyntax(tokens, [], options);
                    Object.defineProperty(node, "tokens", {
                        ...definedPropertySettings,
                        value: trimArray(tokens),
                    });
                    let i;
                    const stack = [];
                    for (i = 0; i < tokens.length; i++) {
                        if (tokensfuncDefMap.has(tokens[i].typ)) {
                            stack.push(tokens[i]);
                            continue;
                        }
                        else if (tokens[i].typ == EnumToken.EndParensTokenType) {
                            const func = stack.at(-1);
                            tokens.splice(i, 1);
                            // @ts-expect-error
                            func.typ = tokensfuncDefMap.get(func.typ);
                            func.chi = tokens.splice(tokens.indexOf(func) + 1, i - 1);
                            stack.pop();
                        }
                    }
                }
                let hasIdOrClass = false;
                for (const { value } of walkValues(node.tokens, node, 
                // @ts-ignore
                (value, parent) => {
                    if (value.typ == EnumToken.PseudoClassTokenType) {
                        const val = value.val.toLowerCase();
                        switch (val) {
                            case ":local":
                            case ":global":
                                {
                                    let index = parent.tokens.indexOf(value);
                                    parent.tokens.splice(index, 1);
                                    if (parent.tokens[index]?.typ == EnumToken.WhitespaceTokenType ||
                                        parent.tokens[index]?.typ ==
                                            EnumToken.DescendantCombinatorTokenType) {
                                        parent.tokens.splice(index, 1);
                                    }
                                    if (val == ":global") {
                                        for (; index < parent.tokens.length; index++) {
                                            if (parent.tokens[index].typ ==
                                                EnumToken.CommaTokenType ||
                                                ([
                                                    EnumToken.PseudoClassFuncTokenType,
                                                    EnumToken.PseudoClassTokenType,
                                                ].includes(parent.tokens[index].typ) &&
                                                    [":global", ":local"].includes(parent.tokens[index].val.toLowerCase()))) {
                                                break;
                                            }
                                            global.add(parent.tokens[index]);
                                        }
                                    }
                                }
                                break;
                        }
                    }
                    else if (value.typ == EnumToken.PseudoClassFuncTokenType) {
                        switch (value.val.toLowerCase()) {
                            case ":global":
                                for (const token of value.chi) {
                                    global.add(token);
                                }
                                parent.tokens.splice(parent.tokens.indexOf(value), 1, ...value.chi);
                                break;
                            case ":local":
                                parent.tokens.splice(parent.tokens.indexOf(value), 1, ...value.chi);
                                break;
                        }
                    }
                })) {
                    if (value.typ == EnumToken.HashTokenType || value.typ == EnumToken.ClassSelectorTokenType) {
                        hasIdOrClass = true;
                    }
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
                                const result = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                    ? val
                                    : moduleSettings.generateScopedName(val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                let value = result instanceof Promise ? await result : result;
                                mapping[val] =
                                    moduleSettings.naming & ModuleCaseTransformEnum.DashCaseOnly ||
                                        moduleSettings.naming & ModuleCaseTransformEnum.CamelCaseOnly
                                        ? getKeyName(value, moduleSettings.naming)
                                        : value;
                                revMapping[mapping[val]] = val;
                            }
                            value.val = "." + mapping[val];
                        }
                    }
                }
                if (moduleSettings.scoped & ModuleScopeEnumOptions.Pure) {
                    if (!hasIdOrClass) {
                        throw new Error(`pure module: No id or class found in selector '${node.sel}' at '${node.loc?.src ?? ""}':${node.loc?.sta?.lin ?? ""}:${node.loc?.sta?.col ?? ""}`);
                    }
                }
                node.sel = "";
                for (const token of node.tokens) {
                    node.sel += renderValue(token);
                }
            }
            else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframesAtRuleNodeType) {
                const val = node.nam.toLowerCase();
                if (node.tokens == null) {
                    Object.defineProperty(node, "tokens", {
                        ...definedPropertySettings,
                        // @ts-ignore
                        value: parseString(node.val),
                    });
                }
                if (val == "property" || val == "keyframes") {
                    const prefix = val == "property" ? "--" : "";
                    for (const value of node.tokens) {
                        if ((prefix == "--" && value.typ == EnumToken.DashedIdenTokenType) ||
                            (prefix == "" && value.typ == EnumToken.IdenTokenType)) {
                            if (!(value.val in mapping)) {
                                const result = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                    ? value.val
                                    : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                let val = result instanceof Promise ? await result : result;
                                mapping[value.val] =
                                    prefix +
                                        (moduleSettings.naming & ModuleCaseTransformEnum.DashCaseOnly ||
                                            moduleSettings.naming & ModuleCaseTransformEnum.CamelCaseOnly
                                            ? getKeyName(val, moduleSettings.naming)
                                            : val);
                                revMapping[mapping[value.val]] = value.val;
                            }
                            value.val = mapping[value.val];
                        }
                    }
                    node.val = renderTokens(node.tokens);
                }
                else {
                    let isReplaced = false;
                    for (const { value, parent } of walkValues(node.tokens, node)) {
                        if (EnumToken.MediaQueryConditionTokenType == parent.typ &&
                            // @ts-expect-error
                            value != parent.l) {
                            if ((value.typ == EnumToken.IdenTokenType || isIdentColor(value)) &&
                                value.val in importedCssVariables) {
                                isReplaced = true;
                                parent.r.splice(parent.r.indexOf(value), 1, ...importedCssVariables[value.val].val);
                            }
                        }
                    }
                    if (isReplaced) {
                        node.val = renderTokens(node.tokens);
                    }
                }
            }
        }
        if (moduleSettings.naming != ModuleCaseTransformEnum.IgnoreCase) {
            revMapping = {};
            mapping = Object.entries(mapping).reduce((acc, [key, value]) => {
                const keyName = getKeyName(key, moduleSettings.naming);
                acc[keyName] = value;
                revMapping[value] = keyName;
                return acc;
            }, {});
        }
        result.mapping = mapping;
        result.revMapping = revMapping;
        if (moduleSettings.scoped & ModuleScopeEnumOptions.ICSS && Object.keys(importMapping).length > 0) {
            result.importMapping = importMapping;
        }
        endTime = performance.now();
        result.stats.module = `${(endTime - parseModuleTime).toFixed(2)}ms`;
        result.stats.total = `${(endTime - startTime).toFixed(2)}ms`;
    }
    if (options.signal != null) {
        options.signal.removeEventListener("abort", reject);
    }
    return result;
}
function parseNode(tokens, context, options, errors, stats, invalidNodes) {
    let i = 0;
    if (tokens.at(-1)?.typ === EnumToken.EOFTokenType) {
        tokens.pop();
        // check parenthesis are balanced
        let matchCount = 0;
        let position = tokens.at(-1)?.loc;
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (token.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(token.typ)) {
                matchCount++;
            }
            else if (token.typ === EnumToken.EndParensTokenType) {
                matchCount--;
            }
        }
        if (matchCount > 0) {
            let k = tokens.length;
            while (k-- > 0 &&
                (tokens[k].typ === EnumToken.WhitespaceTokenType || tokens[k].typ === EnumToken.CommentTokenType))
                ;
            if (tokens[k]?.typ == EnumToken.SemiColonTokenType) {
                matchCount = 0;
            }
            while (matchCount > 0) {
                position = {
                    ...position,
                    sta: { ...position.sta, ind: position.sta.ind + 1, col: position.sta.col + 1 },
                    end: { ...position.end, ind: position.end.ind + 1, col: position.end.col + 1 },
                };
                tokens.push(Object.defineProperty({
                    typ: EnumToken.EndParensTokenType,
                    loc: tokens.at(-1)?.loc,
                }, "loc", {
                    ...definedPropertySettings,
                    value: { ...position },
                }));
                matchCount--;
            }
        }
    }
    for (; i < tokens.length; i++) {
        if (tokens[i].typ === EnumToken.CDOCOMMTokenType && context.typ !== EnumToken.StyleSheetNodeType) {
            errors.push({
                action: "drop",
                message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                node: tokens[i],
                location: tokens[i].loc,
            });
            tokens[i].typ = EnumToken.InvalidCommentTokenType;
            continue;
        }
        if (tokens[i].typ === EnumToken.CommentTokenType ||
            tokens[i].typ === EnumToken.CDOCOMMTokenType ||
            tokens[i].typ === EnumToken.WhitespaceTokenType) {
            continue;
        }
        break;
    }
    if (i > 0) {
        context.chi.push(...tokens.splice(0, i).filter((n) => n.typ !== EnumToken.WhitespaceTokenType));
        i = 0;
    }
    for (; i < tokens.length; i++) {
        if (tokens[i].typ == EnumToken.CommentTokenType || tokens[i].typ == EnumToken.CDOCOMMTokenType) {
            const location = tokens[i]?.loc;
            if (tokens[i].typ == EnumToken.CDOCOMMTokenType && context.typ != EnumToken.StyleSheetNodeType) {
                errors.push({
                    action: "drop",
                    message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                    node: tokens[i],
                    location,
                });
                tokens[i].typ = EnumToken.InvalidCommentTokenType;
                continue;
            }
            context.chi.push(tokens[i]);
            stats.nodesCount++;
        }
        else if (tokens[i].typ != EnumToken.WhitespaceTokenType) {
            break;
        }
    }
    if (tokens.length == 0) {
        return null;
    }
    let delim = tokens.at(-1);
    if (delim.typ == EnumToken.SemiColonTokenType ||
        delim.typ == EnumToken.BlockStartTokenType ||
        delim.typ == EnumToken.BlockEndTokenType) {
        tokens.pop();
    }
    if (tokens.length == 0) {
        return null;
    }
    if (tokens[0]?.typ == EnumToken.AtRuleTokenType) {
        let nestedRule = false;
        let parent = context;
        let node;
        while (parent != null) {
            if (parent.typ == EnumToken.RuleNodeType) {
                nestedRule = true;
                break;
            }
            parent = parent.parent;
        }
        node = parseAtRule(tokens, context, { ...options, nestedRule }, errors, delim.typ == EnumToken.BlockStartTokenType);
        if (node == null) {
            return null;
        }
        if (node.state == EnumAstNodeStatus.Invalid ||
            node.state == EnumAstNodeStatus.Disallowed ||
            node.state == EnumAstNodeStatus.Unknown ||
            node.state == EnumAstNodeStatus.Unparsed ||
            node.state == EnumAstNodeStatus.Malformed) {
            invalidNodes.push(node);
        }
        stats.nodesCount++;
        context.chi.push(node);
        // @ts-expect-error
        return Object.defineProperty(node, "parent", { ...definedPropertySettings, value: context });
    }
    else {
        stats.nodesCount++;
        // rule
        if (delim.typ == EnumToken.BlockStartTokenType) {
            const node = parseSelector(tokens, context, options, errors);
            context.chi.push(node);
            Object.defineProperty(node, "parent", { ...definedPropertySettings, value: context });
            if (node.state == EnumAstNodeStatus.Invalid ||
                node.state == EnumAstNodeStatus.Disallowed ||
                node.state == EnumAstNodeStatus.Unknown ||
                node.state == EnumAstNodeStatus.Unparsed ||
                node.state == EnumAstNodeStatus.Malformed) {
                invalidNodes.push(node);
            }
            return node;
        }
        else {
            const node = parseDeclaration(tokens, context, options, errors);
            Object.defineProperty(node, "parent", { ...definedPropertySettings, value: context });
            if (context.typ === EnumToken.StyleSheetNodeType && node.typ === EnumToken.DeclarationNodeType) {
                // @ts-expect-error
                node.typ = EnumToken.InvalidDeclarationNodeType;
                errors.push({
                    message: "<declaration> not allowed in <stylesheet>",
                    action: "drop",
                    node,
                    location: node.loc,
                });
            }
            else if (options.lenient || node.typ === EnumToken.DeclarationNodeType) {
                context.chi.push(node);
            }
            if (node.state == EnumAstNodeStatus.Invalid ||
                node.state == EnumAstNodeStatus.Disallowed ||
                node.state == EnumAstNodeStatus.Unknown ||
                node.state == EnumAstNodeStatus.Unparsed ||
                node.state == EnumAstNodeStatus.Malformed) {
                invalidNodes.push(node);
            }
        }
    }
    return null;
}
/**
 * @param options
 * @param errors
 * @param parseAsBlock
 */
function parseAtRule(stream, context, options, errors, parseAsBlock = null) {
    let success = true;
    let atRuleName = stream[0].nam;
    if (atRuleName.startsWith("-")) {
        atRuleName = atRuleName.replace(/^-[a-z]+-/, "").toLowerCase();
    }
    const atRule = stream.shift();
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + atRule.nam);
    const syntax = syntaxRules?.getPreludeRules()?.slice?.(1);
    const blockAllowed = syntaxRules?.getBlockRules() != null;
    if (syntaxRules == null) {
        // if (!options.lenient) {
        errors.push({
            action: "drop",
            node: atRule,
            location: atRule.loc,
            message: "unknown at-rule",
        });
        const result = matchGenericSyntax(stream);
        // @ts-expect-error
        return Object.defineProperties(Object.assign(atRule, {
            typ: EnumToken.AtRuleNodeType,
            val: renderTokens(trimArray(stream), options),
            ...(parseAsBlock ? { chi: [] } : {}),
        }), {
            state: {
                ...definedPropertySettings,
                value: result.success ? EnumAstNodeStatus.Unknown : EnumAstNodeStatus.Invalid,
            },
            errors: {
                ...definedPropertySettings,
                value: result.success ? [errors[errors.length - 1]] : [errors[errors.length - 1], ...result.errors],
            },
        });
        // }
    }
    else if (context.typ === EnumToken.AtRuleNodeType &&
        "page" === context.nam &&
        pageMarginBoxType.has(atRuleName.toLowerCase())) {
        if (parseAsBlock === false) {
            errors.push({
                action: "drop",
                node: atRule,
                location: atRule.loc,
                message: parseAsBlock ? "at-rule block not supported" : "at-rule block is required",
            });
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimArray(stream), options),
                ...(parseAsBlock ? { chi: [] } : {}),
            }), {
                state: {
                    ...definedPropertySettings,
                    value: EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: [errors[errors.length - 1]],
                },
            });
        }
        const token = stream.find((t) => t.typ != EnumToken.WhitespaceTokenType && t.typ === EnumToken.CommentTokenType) ?? null;
        if (token != null) {
            errors.push({
                action: "drop",
                node: token,
                location: token.loc,
                message: `unexpected token ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
            });
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimArray(stream), options),
                ...(parseAsBlock ? { chi: [] } : {}),
            }), {
                state: {
                    ...definedPropertySettings,
                    value: EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: [errors[errors.length - 1]],
                },
            });
        }
    }
    if (parseAsBlock === null) {
        parseAsBlock = blockAllowed;
    }
    if (syntax != null && atRule.nam !== "layer" && parseAsBlock !== blockAllowed) {
        success = false;
        errors.push({
            action: "drop",
            node: atRule,
            location: atRule.loc,
            message: parseAsBlock ? "at-rule block not supported" : "at-rule block is required",
        });
        // @ts-expect-error
        return Object.defineProperties(Object.assign(atRule, {
            typ: EnumToken.AtRuleNodeType,
            val: renderTokens(trimArray(stream), options),
            ...(parseAsBlock ? { chi: [] } : {}),
        }), {
            state: {
                ...definedPropertySettings,
                value: EnumAstNodeStatus.Invalid,
            },
            errors: {
                ...definedPropertySettings,
                value: [errors[errors.length - 1]],
            },
        });
    }
    switch (atRuleName) {
        case "charset": {
            let success = true;
            if (stream.length === 0 ||
                stream[0].typ !== EnumToken.WhitespaceTokenType ||
                stream[0].val !== " ") {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[0] ?? atRule,
                    location: (stream[0] ?? atRule).loc,
                    message: "expecting <space>",
                });
            }
            else if (stream[1].typ !== EnumToken.StringTokenType) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    location: (stream[1] ?? atRule).loc,
                    message: "expecting <string>",
                });
            }
            if (success && stream[1].val.charCodeAt(0) !== 0x22) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    location: (stream[1] ?? atRule).loc,
                    message: "expecting double-quoted string",
                });
            }
            if (!success) {
                // @ts-expect-error
                return Object.defineProperties(Object.assign(atRule, {
                    typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: renderTokens(trimArray(stream), options),
                }), {
                    state: {
                        ...definedPropertySettings,
                        value: EnumAstNodeStatus.Invalid,
                    },
                    errors: {
                        ...definedPropertySettings,
                        value: [errors[errors.length - 1]],
                    },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: (stream.at(-1) ?? atRule).loc.end },
                    },
                    tokens: { ...definedPropertySettings, value: stream },
                });
            }
            if (options.removeCharset) {
                return null;
            }
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                val: renderTokens(trimArray(stream), options),
            }), {
                state: {
                    ...definedPropertySettings,
                    value: EnumAstNodeStatus.Validated,
                },
                errors: {
                    ...definedPropertySettings,
                    value: [],
                },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: (stream.at(-1) ?? atRule).loc.end },
                },
                tokens: { ...definedPropertySettings, value: stream },
            });
        }
        case "font-feature-values": {
            const result = parseAtRuleFontFeatureValues(stream, atRule, options);
            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                chi: [],
            }), {
                state: {
                    ...definedPropertySettings,
                    value: result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: result.success ? [] : result.errors,
                },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: (stream.at(-1) ?? atRule).loc.end },
                },
                tokens: { ...definedPropertySettings, value: stream },
            });
        }
        case "stylistic":
        case "historical-forms":
        case "character-variant":
        case "swash":
        case "ornaments":
        case "annotation": {
            let success = context.typ === EnumToken.AtRuleNodeType && "font-feature-values" === context.nam;
            if (!success) {
                errors.push({
                    action: "drop",
                    node: atRule,
                    location: atRule.loc,
                    message: `unexpected at-rule ${atRule.nam}`,
                });
            }
            if (success) {
                for (const token of stream) {
                    if (token.typ !== EnumToken.CommentTokenType && token.typ !== EnumToken.WhitespaceTokenType) {
                        success = false;
                        errors.push({
                            action: "drop",
                            node: token,
                            location: token.loc,
                            message: `unexpected token ${EnumToken[token.typ]} at ${token.loc.src}:${token.loc.sta.lin}:${token.loc.sta.col}`,
                        });
                    }
                }
            }
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                chi: [],
            }), {
                state: {
                    ...definedPropertySettings,
                    value: success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: [errors[errors.length - 1]],
                },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: (stream.at(-1) ?? atRule).loc.end },
                },
                tokens: { ...definedPropertySettings, value: stream },
            });
        }
        case "container": {
            const result = parseAtRuleContainerQueryList(stream, atRule, options);
            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                chi: [],
            }), {
                state: {
                    ...definedPropertySettings,
                    value: result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: result.success ? [] : result.errors,
                },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: (stream.at(-1) ?? atRule).loc.end },
                },
                tokens: { ...definedPropertySettings, value: stream },
            });
        }
        case "custom-media": {
            const tokens = trimArray(stream.slice(1));
            const result = matchAllSyntax(syntax, createValidationContext(tokens), options);
            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }
            // @ts-expect-error
            options = { ...options, convertColor: false };
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(tokens), options),
            }), {
                state: {
                    ...definedPropertySettings,
                    value: success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.ValidationFailed,
                },
                errors: {
                    ...definedPropertySettings,
                    value: result.success ? [] : result.errors,
                },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: (tokens.at(-1) ?? atRule).loc.end },
                },
                tokens: { ...definedPropertySettings, value: tokens },
            });
        }
        case "keyframes": {
            const tokens = trimArray(stream.slice(1));
            const filtered = stream.filter((t) => t.typ !== EnumToken.WhitespaceTokenType && t.typ !== EnumToken.CommentTokenType);
            if (filtered.length != 1 ||
                (filtered[0].typ !== EnumToken.IdenTokenType &&
                    filtered[0].typ !== EnumToken.StringTokenType &&
                    filtered[0].typ !== EnumToken.DashedIdenTokenType)) {
                errors.push({
                    action: "drop",
                    node: atRule,
                    location: atRule.loc,
                    message: `expected <keyframe-name> at ${atRule.loc.src}:${atRule.loc.sta.lin}:${atRule.loc.sta.col}`,
                });
                success = false;
            }
            // @ts-expect-error
            options = { ...options, convertColor: false };
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.KeyframesAtRuleNodeType,
                val: renderTokens(tokens, options),
                chi: [],
            }), {
                state: {
                    ...definedPropertySettings,
                    value: success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: success ? [] : errors[errors.length - 1],
                },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: (tokens.at(-1) ?? atRule).loc.end },
                },
                tokens: { ...definedPropertySettings, value: tokens },
            });
        }
        case "namespace": {
            const result = matchAllSyntax(syntax, createValidationContext(stream), options);
            if (!result.success) {
                errors.push(...result.errors);
            }
            // else {
            //     parseUrlToken(stream);
            // }
            const valid = blockAllowed === parseAsBlock && result.success;
            if (valid) {
                let start = 0;
                let end = -1;
                let hasString = false;
                for (start = 0; start < stream.length; start++) {
                    if (stream[start].typ == EnumToken.UrlFunctionTokenDefType) {
                        start++;
                        for (end = start; end < stream.length; end++) {
                            if (stream[end].typ == EnumToken.EndParensTokenType) {
                                break;
                            }
                            if (stream[end].typ === EnumToken.StringTokenType) {
                                hasString = true;
                            }
                        }
                        break;
                    }
                }
                // replace url(string) -> string
                if (hasString) {
                    stream.splice(start - 1, end - start + 2, ...stream.slice(start, end));
                }
            }
            // @ts-expect-error
            options = { ...options, convertColor: false };
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: trimArray(stream).reduce((acc, t, index) => acc +
                    (t.typ === EnumToken.CommentTokenType ||
                        (t.typ === EnumToken.WhitespaceTokenType &&
                            stream[index + 1]?.typ === EnumToken.CommentTokenType &&
                            (stream.length < index + 3 || stream[index + 2]?.typ === EnumToken.WhitespaceTokenType))
                        ? ""
                        : renderValue(t, options)), ""),
                ...(parseAsBlock ? { chi: [] } : {}),
            }), {
                state: {
                    ...definedPropertySettings,
                    value: valid ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: valid ? [] : result.errors,
                },
                tokens: { ...definedPropertySettings, value: stream.slice() },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                },
            });
        }
        case "import": {
            const result = matchAtRuleImportSyntax(atRule, stream, context, options);
            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }
            else {
                if (stream[0]?.typ == EnumToken.UrlFunctionTokenType &&
                    stream[0].chi.some((t) => t.typ == EnumToken.StringTokenType || t.typ == EnumToken.UrlTokenTokenType)) {
                    stream.splice(0, 1, ...stream[0].chi);
                }
            }
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: stream.reduce((acc, t, index) => acc +
                    (t.typ === EnumToken.CommentTokenType ||
                        (t.typ === EnumToken.WhitespaceTokenType &&
                            stream[index + 1]?.typ === EnumToken.CommentTokenType &&
                            (stream.length < index + 3 || stream[index + 2]?.typ === EnumToken.WhitespaceTokenType))
                        ? ""
                        : renderValue(t, options)), ""),
            }), {
                state: {
                    ...definedPropertySettings,
                    value: result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: result.success ? [] : result.errors,
                },
                tokens: { ...definedPropertySettings, value: stream.slice() },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                },
            });
        }
        case "supports":
        case "when":
        case "else": {
            trimWhiteSpaceTokens(stream);
            const result = atRuleName === "supports"
                ? parseAtRuleSupportSyntax(stream, atRule, options)
                : matchAtRuleWhenElseSyntax(stream, atRule, options);
            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }
            let success = true;
            if (atRule.nam === "else") {
                const siblings = context.chi;
                let sibling = null;
                let l = siblings.length;
                while (l--) {
                    if (siblings[l].typ === EnumToken.WhitespaceTokenType ||
                        siblings[l].typ === EnumToken.CommentTokenType ||
                        siblings[l].typ === EnumToken.CDOCOMMTokenType) {
                        continue;
                    }
                    sibling = siblings[l];
                    break;
                }
                let missingWhen = false;
                let definedAfterLastElse = false;
                if (sibling == null || sibling.typ !== EnumToken.AtRuleNodeType) {
                    missingWhen = true;
                }
                else if (sibling.nam !== "when") {
                    if (sibling.nam !== "else") {
                        missingWhen = true;
                    }
                    else if (sibling.val === "") {
                        definedAfterLastElse = true;
                    }
                }
                if (missingWhen) {
                    success = false;
                    errors.push({
                        action: "drop",
                        node: atRule,
                        location: atRule.loc,
                        message: "at-rule @when is required before @else block",
                    });
                }
                else if (definedAfterLastElse) {
                    success = false;
                    errors.push({
                        action: "drop",
                        node: atRule,
                        location: atRule.loc,
                        message: "at-rule @else block is defined after last @else block",
                    });
                }
            }
            // @ts-expect-error
            options = { ...options, minify: false, convertColor: false };
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
            }), {
                state: {
                    ...definedPropertySettings,
                    value: success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: result.success ? [] : [errors[errors.length - 1]].concat(result.errors),
                },
                tokens: { ...definedPropertySettings, value: stream.slice() },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                },
            });
        }
        case "media": {
            options = { ...options, parseColor: false };
            const result = parseMediaqueryList(stream, options);
            if (result.errors.length > 0) {
                errors.push(...result.errors);
            }
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
            }), {
                state: {
                    ...definedPropertySettings,
                    value: result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: result.success ? [] : result.errors,
                },
                tokens: { ...definedPropertySettings, value: stream.slice() },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                },
            });
        }
        case "scope": {
            let context = createValidationContext(trimArray(stream));
            let success = true;
            // @ts-ignore
            let range = context.peekRange((t) => t.typ === EnumToken.EndParensTokenType);
            if (range[0]?.typ !== EnumToken.StartParensTokenType) {
                errors.push({
                    action: "drop",
                    node: range[0] ?? atRule,
                    location: (range[0] ?? atRule).loc,
                    message: "expected '(' at start of @scope block",
                });
                success = false;
            }
            else if (range.at(-1)?.typ !== EnumToken.EndParensTokenType) {
                errors.push({
                    action: "drop",
                    node: range.at(-1) ?? atRule,
                    location: (range.at(-1) ?? atRule).loc,
                    message: "expected ')' at end of @scope block",
                });
                success = false;
            }
            else {
                const srange = range.slice(1, -1);
                const result = matchSelectorSyntax(srange, errors, options, true);
                if (!result.success) {
                    success = false;
                }
                else {
                    stream.splice(stream.indexOf(range[0]) + 1, range.length - 2, ...trimWhiteSpaceTokens(srange));
                }
            }
            let index = stream.indexOf(range.at(-1));
            if (stream.length > index + 1) {
                while (stream[++index]?.typ === EnumToken.WhitespaceTokenType ||
                    stream[index]?.typ === EnumToken.CommentTokenType)
                    ;
                if (index < stream.length) {
                    if (stream[index].typ !== EnumToken.IdenTokenType ||
                        "to" !== stream[index].val.toLowerCase()) {
                        errors.push({
                            action: "drop",
                            node: stream[index],
                            location: stream[index]?.loc,
                            message: "expected 'to' at end of @scope block",
                        });
                        success = false;
                    }
                    else {
                        while (stream[++index]?.typ === EnumToken.WhitespaceTokenType ||
                            stream[index]?.typ === EnumToken.CommentTokenType)
                            ;
                        if (stream[index].typ !== EnumToken.StartParensTokenType) {
                            errors.push({
                                action: "drop",
                                node: stream[index],
                                location: stream[index]?.loc,
                                message: "expected 'to' at end of @scope block",
                            });
                            success = false;
                        }
                        else {
                            context = createValidationContext(stream.slice(index));
                            // @ts-ignore
                            range = context.peekRange((t) => t.typ === EnumToken.EndParensTokenType);
                            if (range.at(-1)?.typ !== EnumToken.EndParensTokenType) {
                                errors.push({
                                    action: "drop",
                                    node: range.at(-1) ?? atRule,
                                    location: (range.at(-1) ?? atRule).loc,
                                    message: "expected ')' at end of @scope block",
                                });
                                success = false;
                            }
                            else {
                                const srange = range.slice(1, -1);
                                const result = matchSelectorSyntax(srange, errors, options, true);
                                if (!result.success) {
                                    success = false;
                                }
                                else {
                                    stream.splice(stream.indexOf(range[0]) + 1, range.length - 2, ...trimWhiteSpaceTokens(srange));
                                }
                            }
                        }
                    }
                }
            }
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
            }), {
                state: {
                    ...definedPropertySettings,
                    value: success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: success ? [] : [errors[errors.length - 1]],
                },
                tokens: { ...definedPropertySettings, value: stream.slice() },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                },
            });
        }
        case "page": {
            trimArray(stream);
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
            }), {
                state: {
                    ...definedPropertySettings,
                    value: success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: success ? [] : [errors[errors.length - 1]],
                },
                tokens: { ...definedPropertySettings, value: stream.slice() },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                },
            });
        }
        case "top-left-corner":
        case "top-left":
        case "top-center":
        case "top-right":
        case "top-right-corner":
        case "bottom-left-corner":
        case "bottom-left":
        case "bottom-right":
        case "bottom-right-corner":
        case "left-top":
        case "left-middle":
        case "left-bottom":
        case "right-top":
        case "right-middle":
        case "right-bottom": {
            if (context.typ !== EnumToken.AtRuleNodeType || context.nam !== "page") {
                success = false;
                errors.push({
                    action: "drop",
                    node: atRule,
                    location: atRule.loc,
                    message: "node is allowd only in @page rule",
                });
            }
            else {
                trimArray(stream);
                for (let i = 0; i < stream.length; i++) {
                    if (stream[i].typ !== EnumToken.WhitespaceTokenType &&
                        stream[i].typ !== EnumToken.CommentTokenType) {
                        success = false;
                        errors.push({
                            action: "drop",
                            node: stream[i],
                            location: stream[i].loc,
                            message: "expected whitespace or comment",
                        });
                        break;
                    }
                }
            }
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
            }), {
                state: {
                    ...definedPropertySettings,
                    value: success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: success ? [] : [errors[errors.length - 1]],
                },
                tokens: { ...definedPropertySettings, value: stream.slice() },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                },
            });
        }
        case "value": {
            let index = 0;
            let isVarDeclaration = false;
            for (; index < stream.length; index++) {
                if (stream[index].typ == EnumToken.PseudoClassTokenType) {
                    Object.assign(stream[index], {
                        typ: EnumToken.IdenTokenType,
                        val: stream[index].val.slice(1),
                    });
                    stream.splice(index, 0, Object.defineProperty({
                        typ: EnumToken.ColonTokenType,
                    }, "loc", {
                        ...definedPropertySettings,
                        value: { ...stream[index].loc, end: { ...stream[index]?.loc?.sta } },
                    }));
                    isVarDeclaration = true;
                    break;
                }
                else if (stream[index].typ == EnumToken.ColonTokenType) {
                    isVarDeclaration = true;
                    break;
                }
                else if (stream[index].typ == EnumToken.IdenTokenType &&
                    equalsIgnoreCase("from", stream[index].val)) {
                    break;
                }
            }
            // supported syntaxes:
            // @value <ident>: <string>; // import from file as alias
            // @value id : <declaration-value>; // variable declaration
            // @value <ident># from <ident>; // import variables from alias
            let result = matchAllSyntax(syntaxRules?.getPreludeRules()?.slice?.(1), createValidationContext(stream), options);
            if (!result.success) {
                errors.push(...result.errors);
                return Object.defineProperties({
                    typ: EnumToken.AtRuleNodeType,
                    val: renderTokens(stream, options),
                }, {
                    state: {
                        ...definedPropertySettings,
                        value: EnumAstNodeStatus.Invalid,
                    },
                    errors: {
                        ...definedPropertySettings,
                        value: result.errors,
                    },
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                    },
                });
            }
            if (isVarDeclaration) {
                const nam = stream.find((t) => t.typ == EnumToken.IdenTokenType);
                const value = trimArray(stream.slice(index + 1).filter((t) => t.typ != EnumToken.CommentTokenType));
                if (value.length == 1 && value[0].typ == EnumToken.StringTokenType) {
                    // import from file as alias
                    return Object.defineProperties({
                        typ: EnumToken.CssVariableImportTokenType,
                        nam: nam.val,
                        val: value,
                    }, {
                        loc: {
                            ...definedPropertySettings,
                            value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                        },
                    });
                }
                // import variables from alias
                return Object.defineProperties({
                    typ: EnumToken.CssVariableTokenType,
                    nam: nam.val,
                    val: value,
                }, {
                    loc: {
                        ...definedPropertySettings,
                        value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                    },
                });
            }
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.CssVariableDeclarationMapTokenType,
                vars: trimArray(stream.slice(0, index)),
                from: stream.slice(index + 1),
            }), {
                tokens: { ...definedPropertySettings, value: stream.slice() },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                },
            });
        }
        default: {
            options = { ...options, parseColor: false };
            let result = null;
            if (syntax == null) {
                // check matching '(' and ')'
                // check commas , or ,,
                // check colon :
                // check or and and
                result = matchGenericSyntax(stream);
                if (result.errors.length > 0) {
                    errors.push(...result.errors);
                }
            }
            else {
                result = matchAtRuleSyntax(atRule, stream, options);
                if (result.errors.length > 0) {
                    errors.push(...result.errors);
                }
                // else if (atRuleName === "document") {
                //     parseUrlToken(stream);
                // }
                if (result.success) {
                    let i = 0;
                    const stack = [];
                    for (; i < stream.length; i++) {
                        if (stream[i].typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[i].typ)) {
                            stack.push(stream[i]);
                            continue;
                        }
                        if (stream[i].typ === EnumToken.EndParensTokenType && stack.length > 0) {
                            const index = stream.indexOf(stack[stack.length - 1]);
                            stream[index].loc.end = stream[i].loc.end;
                            Object.assign(stream[index], {
                                typ: tokensfuncDefMap.get(stream[index].typ),
                                chi: stream.splice(index + 1, i - index - 1),
                            });
                            i = index;
                            stream.splice(index + 1, 1);
                            stack.pop();
                            // continue;
                        }
                    }
                }
            }
            // @ts-expect-error
            return Object.defineProperties(Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                ...(parseAsBlock ? { chi: [] } : {}),
            }), {
                state: {
                    ...definedPropertySettings,
                    value: result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid,
                },
                errors: {
                    ...definedPropertySettings,
                    value: result.errors,
                },
                tokens: { ...definedPropertySettings, value: stream.slice() },
                loc: {
                    ...definedPropertySettings,
                    value: { ...atRule.loc, end: { ...(stream.at(-1)?.loc?.end ?? atRule.loc.end) } },
                },
            });
        }
    }
}
/**
 * Parse a string as an array of declaration nodes
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
        buffer: "",
        offset: 0,
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 },
    }), { setParent: false, minify: false, validation: false }).then((result) => {
        return result.ast.chi[0].chi.filter((t) => t.typ == EnumToken.DeclarationNodeType ||
            t.typ == EnumToken.CommentNodeType ||
            t.typ == EnumToken.InvalidDeclarationNodeType);
    });
}
/**
 * Parse css string and return an array of tokens
 * @param src
 * @param options
 *    - parseColor: parse identifiers as colors
 *    - src: source url used for source map
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
function parseString(src, options, errors) {
    const parseInfo = {
        stream: src,
        src: options?.src ?? "",
        buffer: "",
        offset: 0,
        time: 0,
        position: { ind: 0, lin: 1, col: 1 },
        currentPosition: { ind: -1, lin: 1, col: 0 },
    };
    const result = parseTokens([...tokenize(parseInfo)].map((t) => t.token), options, errors);
    // remove EOF token
    result.pop();
    if (result.at(-1)?.typ === EnumToken.WhitespaceTokenType) {
        result.pop();
    }
    return result;
}
/**
 * Parse function tokens in a token array
 * @param tokens
 * @param options
 *    - parseColor: parse identifiers as colors
 * @param errors parse errors
 *
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
function parseTokens(tokens, options, errors) {
    const stack = [];
    let i = 0;
    let index;
    let t;
    for (; i < tokens.length; i++) {
        t = tokens[i];
        if (t.typ === EnumToken.FunctionTokenDefType) {
            if (tokens[i - 1]?.typ === EnumToken.ColonTokenType ||
                tokens[i - 1]?.typ === EnumToken.DoubleColonTokenType) {
                t = Object.assign(tokens[i - 1], {
                    typ: EnumToken.PseudoClassFunctionTokenDefType,
                    val: (tokens[i - 1].typ === EnumToken.ColonTokenType ? ":" : "::") +
                        tokens[i].val,
                });
                t.loc.end = tokens[i].loc.end;
                tokens.splice(i--, 1);
            }
        }
        if (t.typ === EnumToken.AttrStartTokenType ||
            t.typ === EnumToken.StartParensTokenType ||
            tokensfuncDefMap.has(t.typ)) {
            stack.push(t);
            continue;
        }
        if (t.typ === EnumToken.EndParensTokenType) {
            if (stack.length === 0 ||
                (stack.at(-1)?.typ !== EnumToken.StartParensTokenType && !tokensfuncDefMap.has(stack.at(-1)?.typ))) {
                // unbalanced parens
                const node = stack.at(-1);
                errors?.push?.({
                    action: "drop",
                    message: `Unbalanced token ')' at ${node.loc.src}:${node.loc.sta.lin}:${node.loc.sta.col}`,
                    node,
                    location: node.loc,
                });
                // return [];
                continue;
            }
            tokens.splice(i, 1);
            index = tokens.indexOf(stack.at(-1));
            Object.assign(tokens[index], {
                typ: tokens[index].typ === EnumToken.StartParensTokenType
                    ? EnumToken.ParensTokenType
                    : tokensfuncDefMap.get(tokens[index].typ),
                chi: trimArray(tokens.splice(index + 1, i - index - 1)),
            });
            i = index;
            stack.pop();
            continue;
        }
        if (t.typ === EnumToken.AttrEndTokenType) {
            if (stack.at(-1)?.typ !== EnumToken.AttrStartTokenType) {
                // unbalanced
                const node = stack.at(-1);
                errors?.push?.({
                    action: "drop",
                    message: `Unbalanced token ']' at ${node.loc.src}:${node.loc.sta.lin}:${node.loc.sta.col}`,
                    node,
                    location: node.loc,
                });
                // return [];
                continue;
            }
            index = tokens.indexOf(stack.at(-1));
            const attr = stack.at(-1);
            attr.loc.end = t.loc.end;
            tokens.splice(i, 1);
            Object.assign(attr, {
                typ: EnumToken.AttrTokenType,
                chi: tokens.splice(index + 1, i - index - 1),
            });
            tokens[index] = attr;
            i = index;
            stack.pop();
            continue;
        }
        if (t.typ == EnumToken.IdenTokenType) {
            if (t.val == "from" && i > 0) {
                const left = [];
                const right = [];
                let foundLeft = 0;
                let foundRight = 0;
                let k = i;
                let l = i;
                while (k > 0) {
                    if (tokens[k - 1].typ == EnumToken.CommentTokenType ||
                        tokens[k - 1].typ == EnumToken.WhitespaceTokenType) {
                        left.push(tokens[--k]);
                        continue;
                    }
                    if (tokens[k - 1].typ == EnumToken.IdenTokenType ||
                        tokens[k - 1].typ == EnumToken.DashedIdenTokenType) {
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
                            return a == null
                                ? b
                                : b.typ == EnumToken.IdenTokenType || b.typ == EnumToken.StringTokenType
                                    ? b
                                    : a;
                        }, null),
                    });
                    i = k;
                    continue;
                }
            }
            else if (options?.parseColor && isColor(t)) {
                parseColor(t);
            }
        }
        if (t.typ == EnumToken.WhitespaceTokenType &&
            (i == 0 ||
                i + 1 == tokens.length ||
                [
                    EnumToken.CommaTokenType,
                    EnumToken.GteTokenType,
                    EnumToken.LteTokenType,
                    EnumToken.ColumnCombinatorTokenType,
                ].includes(tokens[i + 1].typ) ||
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
                    tokens[i + 1].val = ":" + tokens[i + 1].val;
                    tokens[i + 1].typ = EnumToken.PseudoClassTokenType;
                }
                if (typ == EnumToken.FunctionTokenType || typ == EnumToken.IdenTokenType) {
                    tokens.splice(i, 1);
                    i--;
                }
            }
        }
        if (t.typ === EnumToken.CommaTokenType) {
            if (tokens[i + 1]?.typ === EnumToken.WhitespaceTokenType) {
                tokens.splice(i + 1, 1);
            }
            if (tokens[i - 1]?.typ === EnumToken.WhitespaceTokenType) {
                tokens.splice(i - 1, 1);
                i--;
            }
        }
    }
    if (stack.length > 0) {
        const node = stack.at(-1);
        errors?.push?.({
            action: "drop",
            message: `Unbalanced token. Expecting ${node.typ === EnumToken.AttrStartTokenType ? "']'" : ")"}'`,
            node,
            location: node.loc,
        });
        // return [];
    }
    return tokens;
}

export { doParse, generateScopedName, getKeyName, getShortNameGenerator, parseAtRule, parseDeclarations, parseString, parseTokens, trimWhiteSpace };
