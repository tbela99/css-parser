import { isIdentColor, parseColor, isColor } from '../syntax/syntax.js';
import { camelize, equalsIgnoreCase, dasherize } from './utils/text.js';
import { renderValue } from '../renderer/render.js';
import { EnumToken, EnumAstNodeStatus, ModuleCaseTransformEnum, ModuleScopeEnumOptions } from '../ast/types.js';
import { minify } from '../ast/minify.js';
import { expand } from '../ast/expand.js';
import { walk, walkValues, WalkerEvent } from '../ast/walk.js';
import { Tokenizer } from './tokenize.js';
import { LOCSRCID, LOCSTA, LOCEND, tokensfuncDefMap, STATE, PARENT, TOKENS, ROOT, ERRORS, pageMarginBoxType } from '../syntax/constants.js';
import { hashAlgorithms, hash, syncHash } from './utils/hash.js';
import { parseSelector } from './utils/selector.js';
import { parseDeclaration } from './utils/declaration.js';
import { getSyntaxRule } from '../validation/config.js';
import { matchSelectorSyntax, trimArray, matchAllSyntaxes, createValidationContext } from '../validation/match.js';
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
import { SourceFile } from './source.js';
import { dirname } from '../fs/resolve.js';

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
const getShortNameGenerator = memoize(() => {
    let value = keyNameCounter.toString(36);
    let val = value.charAt(0).charCodeAt(0);
    keyNameCounter++;
    // starts with'0' - '9'
    while (48 <= val && val <= 57) {
        value = keyNameCounter.toString(36);
        keyNameCounter++;
        val = value.charAt(0).charCodeAt(0);
    }
    return value;
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
const generateSyncScopedName = memoize((localName, filePath, pattern, hashLength = 5) => {
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
                        if (hashAlgo.startsWith("sha")) {
                            throw new Error(`Unsupported hash algorithm: '${hashAlgo}'. Not supported by parseSync() or transformSync(). Use parse() or transform().`);
                        }
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
                    result += syncHash(hashString, length ?? hashLength, hashAlgo);
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
 *
 * @param visitorsDef
 * @param errors
 * @private
 */
function parseVisitors(visitorsDef, errors) {
    const visitors = Object.entries(typeof visitorsDef === "function" ? [visitorsDef] : visitorsDef);
    let key;
    let value;
    let i;
    const valuesHandlers = new Map();
    const preValuesHandlers = new Map();
    const postValuesHandlers = new Map();
    const visitorsHandlersMap = new Map();
    const preVisitorsHandlersMap = new Map();
    const postVisitorsHandlersMap = new Map();
    for (i = 0; i < visitors.length; i++) {
        key = visitors[i][0];
        value = visitors[i][1];
        if (Number.isInteger(+key)) {
            // if (Array.isArray(value)) {
            //     visitors.splice(i + 1, 0, ...Object.entries(value));
            //     continue;
            // }
            if (typeof value == "function") {
                key = value.name;
            }
        }
        // if (Array.isArray(value)) {
        //     // @ts-ignore
        //     visitors.splice(i + 1, 0, ...value.map((item) => [key, item]));
        //     continue;
        // }
        if (key in EnumToken) {
            if (typeof value == "function") {
                if (!valuesHandlers.has(EnumToken[key])) {
                    valuesHandlers.set(EnumToken[key], []);
                }
                valuesHandlers.get(EnumToken[key]).push(value);
            }
            else if (typeof value == "object") {
                if ("type" in value && "handler" in value && value.type in WalkerEvent) {
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
                    for (const val of Object.entries(value)) {
                        visitors.push(val);
                    }
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
    const allHandlers = [];
    if (preVisitorsHandlersMap.size > 0) {
        allHandlers.push(preVisitorsHandlersMap);
    }
    if (preValuesHandlers.size > 0) {
        allHandlers.push(preValuesHandlers);
    }
    if (visitorsHandlersMap.size > 0) {
        allHandlers.push(visitorsHandlersMap);
    }
    if (valuesHandlers.size > 0) {
        allHandlers.push(valuesHandlers);
    }
    if (postVisitorsHandlersMap.size > 0) {
        allHandlers.push(postVisitorsHandlersMap);
    }
    if (postValuesHandlers.size > 0) {
        allHandlers.push(postValuesHandlers);
    }
    return {
        allHandlers,
        includeTokens: preValuesHandlers.size > 0 || valuesHandlers.size > 0 || postValuesHandlers.size > 0,
    };
}
/**
 * Parse css string
 * @param iter
 * @param options
 *
 * @throws Error
 * @private
 */
function doParseSync(tokenizer, options = {}) {
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
    if (typeof options.validation !== "boolean") {
        options.validation = !!options.validation;
    }
    if (options.module) {
        options.expandNestingRules = true;
    }
    if (options.expandNestingRules) {
        options.nestingRules = false;
    }
    const startTime = performance.now();
    const errors = [];
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
    let item;
    let node;
    // @ts-ignore ignore error
    let parensMatch = 0;
    let curlyBracketMatch = 0;
    // let currentItemIndex: number;
    ast[LOCSRCID] = options.source.id;
    ast[LOCSTA] = 0;
    // let tokenizer: Tokenizer;
    while (!tokenizer.done()) {
        tokenizer.next();
        // item = (iter as Array<TokenizeResult>)[currentItemIndex];
        if (tokenizer.unit != null) {
            item = {
                typ: tokenizer.typ,
                val: tokenizer.val,
                unit: tokenizer.unit,
            };
        }
        else if (tokenizer.nam != null) {
            item = {
                typ: tokenizer.typ,
                nam: tokenizer.nam,
            };
        }
        else if (tokenizer.val === null) {
            item = {
                typ: tokenizer.typ,
            };
        }
        else if (tokenizer.kin != null) {
            item = {
                typ: tokenizer.typ,
                val: tokenizer.val,
                kin: tokenizer.kin,
            };
        }
        else {
            item = {
                typ: tokenizer.typ,
                val: tokenizer.val,
            };
        }
        item[LOCSRCID] = tokenizer.srcId;
        item[LOCSTA] = tokenizer.sta;
        item[LOCEND] = tokenizer.end;
        stats.bytesIn = tokenizer.bytesIn;
        stats.tokensCount++;
        if (BadTokensTypes.includes(item.typ)) {
            tokens.push(item);
            errors.push({
                action: "drop",
                message: "Bad token",
                syntax: null,
                node: item,
                location: options.source.getSourceLocation(item[LOCSTA]),
            });
            // bad token
            continue;
        }
        if (item.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(item.typ)) {
            parensMatch++;
        }
        else if (item.typ === EnumToken.EndParensTokenType && parensMatch > 0) {
            parensMatch--;
        }
        if (item.typ === EnumToken.BlockStartTokenType) {
            curlyBracketMatch++;
        }
        else if (item.typ === EnumToken.BlockEndTokenType && curlyBracketMatch > 0) {
            curlyBracketMatch--;
        }
        tokens.push(item);
        if (parensMatch === 0 &&
            (item.typ === EnumToken.SemiColonTokenType ||
                item.typ === EnumToken.BlockStartTokenType ||
                item.typ === EnumToken.EOFTokenType)) {
            node = parseNode(tokens, context, options, errors, stats, invalidNodes);
            if (node != null) {
                if ("chi" in node) {
                    stack.push(node);
                    context = node;
                }
            }
            else if (item.typ == EnumToken.BlockStartTokenType) {
                let inBlock = 1;
                tokens.length = 0;
                tokens.push(item);
                do {
                    tokenizer.next();
                    if (tokenizer.unit != null) {
                        item = {
                            typ: tokenizer.typ,
                            val: tokenizer.val,
                            unit: tokenizer.unit,
                        };
                    }
                    else if (tokenizer.nam != null) {
                        item = {
                            typ: tokenizer.typ,
                            nam: tokenizer.nam,
                        };
                    }
                    else if (tokenizer.val === null) {
                        item = {
                            typ: tokenizer.typ,
                        };
                    }
                    else if (tokenizer.kin != null) {
                        item = {
                            typ: tokenizer.typ,
                            val: tokenizer.val,
                            kin: tokenizer.kin,
                        };
                    }
                    else {
                        item = {
                            typ: tokenizer.typ,
                            val: tokenizer.val,
                        };
                    }
                    item[LOCSRCID] = tokenizer.srcId;
                    item[LOCSTA] = tokenizer.sta;
                    item[LOCEND] = tokenizer.end;
                    tokens.push(item);
                    if (item.typ === EnumToken.BlockStartTokenType) {
                        inBlock++;
                    }
                    else if (item.typ === EnumToken.BlockEndTokenType) {
                        inBlock--;
                    }
                } while (inBlock != 0 && !tokenizer.done());
                if (tokens.length > 0) {
                    errors.push({
                        action: "drop",
                        message: "invalid block",
                        location: options.source.getSourceLocation(tokens[0][LOCSTA]),
                    });
                }
            }
            tokens.length = 0;
        }
        else if ((parensMatch === 0 || curlyBracketMatch === 0) && item.typ === EnumToken.BlockEndTokenType) {
            parseNode(tokens, context, options, errors, stats, invalidNodes);
            context[LOCEND] = item[LOCEND];
            const previousNode = stack.pop();
            context = (stack[stack.length - 1] ?? ast);
            if (options.removeEmpty &&
                previousNode != null &&
                previousNode.chi.length == 0 &&
                context.chi[context.chi.length - 1] == previousNode) {
                context.chi.pop();
            }
            tokens.length = 0;
            parensMatch = 0;
            curlyBracketMatch = 0;
        }
        // }
    }
    if (tokens.length > 0) {
        node = parseNode(tokens, context, options, errors, stats, invalidNodes);
        if (node != null) {
            if ("chi" in node /* && node.typ != EnumToken.InvalidRuleNodeType */) {
                stack.push(node);
                context = node;
            }
        }
    }
    const endParseTime = performance.now();
    if (options.expandNestingRules) {
        ast = expand(ast);
    }
    let replacement;
    if (options.visitor != null) {
        const handlers = [];
        const visitors = parseVisitors(options.visitor, errors);
        const subNodes = [];
        let parens;
        let genericKey;
        let nodes = new Array(stats.tokensCount);
        let i;
        let k;
        let j;
        let freeBlock = 1;
        nodes[0] = ast;
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i] == null) {
                break;
            }
            subNodes.length = 0;
            if (visitors.includeTokens) {
                switch (nodes[i].typ) {
                    case EnumToken.RuleNodeType:
                    case EnumToken.AtRuleNodeType:
                    case EnumToken.KeyframesRuleNodeType:
                    case EnumToken.KeyframesAtRuleNodeType:
                        for (const token of nodes[i][TOKENS]) {
                            subNodes.push(token);
                        }
                        break;
                    case EnumToken.DeclarationNodeType:
                        for (const token of nodes[i].val) {
                            subNodes.push(token);
                        }
                        break;
                }
            }
            // @ts-ignore
            if (nodes[i].chi != null) {
                // @ts-ignore
                for (const child of nodes[i].chi) {
                    subNodes.push(child);
                }
            }
            if (subNodes.length > 0) {
                if (freeBlock <= i) {
                    freeBlock = i + 1;
                }
                for (k = 0; k < subNodes.length; k++) {
                    j = k + freeBlock;
                    nodes[j] = subNodes[k];
                    nodes[j][PARENT] = nodes[i];
                }
                freeBlock += subNodes.length;
            }
            parens = null;
            handlers.length = 0;
            genericKey =
                nodes[i].typ == EnumToken.DeclarationNodeType
                    ? "Declaration"
                    : nodes[i].typ == EnumToken.AtRuleNodeType
                        ? "AtRule"
                        : nodes[i].typ == EnumToken.KeyframesAtRuleNodeType
                            ? "KeyframesAtRule"
                            : nodes[i].typ === EnumToken.KeyframesRuleNodeType
                                ? "KeyframesRule"
                                : nodes[i].typ == EnumToken.RuleNodeType
                                    ? "Rule"
                                    : nodes[i].typ == EnumToken.KeyframesRuleNodeType
                                        ? "KeyframesRule"
                                        : null;
            let keyName = nodes[i].typ == EnumToken.DeclarationNodeType || nodes[i].typ == EnumToken.AtRuleNodeType
                ? camelize(nodes[i].nam)
                : nodes[i].typ == EnumToken.KeyframesAtRuleNodeType
                    ? camelize(nodes[i].val)
                    : null;
            for (const map of visitors.allHandlers) {
                // @ts-ignore
                if (genericKey != null && map.has(genericKey)) {
                    // @ts-ignore
                    for (const handler of map.get(genericKey)) {
                        if (typeof handler == "function") {
                            handlers.push(handler);
                        }
                        // else if (Array.isArray(handler)) {
                        //     for (const h of handler) {
                        //         if (typeof h == "function") {
                        //             handlers.push(h);
                        //         }
                        //         // @ts-ignore
                        //         else if (h[keyName] != null) {
                        //             // @ts-ignore
                        //             handlers.push(h[keyName]);
                        //         }
                        //     }
                        // } else if (typeof handler.handler! == "function") {
                        //     handlers.push(handler.handler);
                        // }
                        // @ts-ignore
                        else if (typeof handler[keyName] == "function") {
                            // @ts-ignore
                            handlers.push(handler[keyName]);
                        }
                    }
                }
                // @ts-ignore
                if (map.has(nodes[i].typ)) {
                    // @ts-ignore
                    for (const handler of map.get(nodes[i].typ)) {
                        if (typeof handler == "function") {
                            handlers.push(handler);
                        }
                        else if (Array.isArray(handler)) {
                            for (const h of handler) {
                                if (typeof h == "function") {
                                    handlers.push(h);
                                }
                            }
                        }
                        else if (typeof handler.handler == "function") {
                            handlers.push(handler.handler);
                        }
                        // @ts-ignore
                        else if (typeof handler[keyName] == "function") {
                            // @ts-ignore
                            handlers.push(handler[keyName]);
                        }
                    }
                }
            }
            if (handlers.length == 0) {
                continue;
            }
            let node = nodes[i];
            for (const callable of handlers) {
                replacement = callable(node, nodes[i][PARENT], ast, 
                // @ts-expect-error
                function* () {
                    if (parens == null) {
                        let node = nodes[i][PARENT];
                        while (node != null) {
                            yield node;
                            node = node[PARENT];
                        }
                    }
                });
                if (replacement == null) {
                    continue;
                }
                if (replacement == node) {
                    continue;
                }
                // @ts-ignore
                node = replacement;
                //
                if (Array.isArray(node)) {
                    break;
                }
            }
            if (node != nodes[i]) {
                // @ts-ignore
                replaceNodeOrValue(nodes[i][PARENT], nodes[i], node);
            }
        }
        nodes = null;
    }
    if (invalidNodes.length > 0) {
        let count = invalidNodes.length;
        for (const { node, parent } of walk(ast)) {
            if (options.lenient && node[STATE] == EnumAstNodeStatus.Unknown) {
                continue;
            }
            if (node[STATE] === EnumAstNodeStatus.Invalid ||
                node[STATE] === EnumAstNodeStatus.Unknown ||
                node[STATE] === EnumAstNodeStatus.Unparsed ||
                node[STATE] === EnumAstNodeStatus.Malformed ||
                node[STATE] === EnumAstNodeStatus.Disallowed) {
                // @ts-ignore
                parent.chi.splice(parent.chi.indexOf(node), 1);
                node[PARENT] = null;
                count--;
                if (count == 0) {
                    break;
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
            // tokenize: `${(options?.parseInfo?.time ?? 0).toFixed(2)}ms`,
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
            generateScopedName: generateSyncScopedName,
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
                ? options.resolve(options.src, options.cwd).relative
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
            moduleSettings.generateScopedName = generateSyncScopedName;
        }
        moduleSettings.filePath = filePath;
        moduleSettings.pattern =
            pattern != null && pattern !== "" ? pattern : filePath === "" ? `[local]_[hash]` : `[local]_[hash]_[name]`;
        for (const { node, parent } of walk(ast)) {
            if (node.typ == EnumToken.CssVariableImportTokenType) {
                throw new Error("css variable import not supported by parseSync() or transformSync(). use parse() or transform() instead.\nat " +
                    options.source.getSourceLocation(node[LOCSTA]).join(":"));
            }
            // @ts-ignore
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
                        let value = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                            ? node.nam
                            : moduleSettings.generateScopedName(node.nam, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
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
                    const composeSelectors = [];
                    // let isValid: boolean = true;
                    for (const token of node.val) {
                        if (token.typ == EnumToken.ComposesSelectorNodeType) {
                            composeSelectors.push(token);
                        }
                    }
                    // find parent rule
                    let parentRule = parent;
                    while (parentRule != null && parentRule.typ != EnumToken.RuleNodeType) {
                        parentRule = parentRule[PARENT];
                    }
                    if ( /* !isValid || */composeSelectors.length == 0) {
                        errors.push({
                            action: "drop",
                            message: `composes is empty`,
                            node,
                        });
                        parentRule.chi.splice(parentRule.chi.indexOf(node), 1);
                        continue;
                    }
                    for (const token of composeSelectors) {
                        // composes: a b c;
                        if (token.r == null) {
                            for (const rule of token.l) {
                                if (rule.typ == EnumToken.WhitespaceTokenType ||
                                    rule.typ == EnumToken.CommentTokenType) {
                                    continue;
                                }
                                if (!(rule.val in mapping)) {
                                    let value = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                        ? rule.val
                                        : moduleSettings.generateScopedName(rule.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                    mapping[rule.val] =
                                        (rule.typ == EnumToken.DashedIdenTokenType ? "--" : "") +
                                            (moduleSettings.naming & ModuleCaseTransformEnum.DashCaseOnly ||
                                                moduleSettings.naming & ModuleCaseTransformEnum.CamelCaseOnly
                                                ? getKeyName(value, moduleSettings.naming)
                                                : value);
                                    revMapping[mapping[rule.val]] = rule.val;
                                }
                                if (parentRule != null) {
                                    for (const tk of parentRule[TOKENS]) {
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
                            throw new Error(`composes from file is not supported using parseSync() or transformSync(). Use parse() or transform() instead.\nat ${options.source.getSourceLocation(node[LOCSTA]).join(":")}`);
                        }
                        // composes: a b c from global;
                        else if (token.r.typ == EnumToken.IdenTokenType) {
                            // global
                            if (parentRule != null) {
                                if (equalsIgnoreCase("global", token.r.val)) {
                                    for (const tk of parentRule[TOKENS]) {
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
                    parent.chi.splice(parent.chi.indexOf(node), 1);
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
                                mapping[value.val] =
                                    moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                        ? value.val
                                        : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                revMapping[mapping[value.val]] = value.val;
                            }
                            value.val = mapping[value.val];
                        }
                    }
                }
                for (const { value, parent } of walkValues(node.val, node)) {
                    if (value.typ == EnumToken.DashedIdenTokenType) {
                        value.val = mapping[value.val];
                    }
                    else if ((value.typ == EnumToken.IdenTokenType || isIdentColor(value)) &&
                        value.val in importedCssVariables) {
                        // @ts-ignore
                        replaceNodeOrValue(parent, value, importedCssVariables[value.val].val);
                    }
                }
            }
            else if (node.typ == EnumToken.RuleNodeType) {
                // if (node[TOKENS] == null) {
                const tokens = parseString(node.sel);
                matchSelectorSyntax(tokens, [], options);
                node[TOKENS] = trimArray(tokens);
                let hasIdOrClass = false;
                for (const { value } of walkValues(node[TOKENS], node, 
                // @ts-ignore
                (value, parent) => {
                    if (value.typ == EnumToken.PseudoClassTokenType ||
                        value.typ == EnumToken.PseudoElementTokenType) {
                        const val = value.val.toLowerCase();
                        switch (val) {
                            case ":local":
                            case ":global":
                                {
                                    let index = parent[TOKENS].indexOf(value);
                                    parent[TOKENS].splice(index, 1);
                                    if (parent[TOKENS][index]?.typ == EnumToken.WhitespaceTokenType ||
                                        parent[TOKENS][index]?.typ ==
                                            EnumToken.DescendantCombinatorTokenType) {
                                        parent[TOKENS].splice(index, 1);
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
                            case ":local":
                                parent[TOKENS].splice(parent[TOKENS].indexOf(value), 1, ...value.chi);
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
                    if (value.typ == EnumToken.PseudoClassTokenType || value.typ == EnumToken.PseudoElementTokenType) ;
                    else if (value.typ == EnumToken.PseudoClassFuncTokenType) ;
                    else {
                        if (global.has(value)) {
                            continue;
                        }
                        if (value.typ == EnumToken.ClassSelectorTokenType) {
                            const val = value.val.slice(1);
                            if (!(val in mapping)) {
                                let value = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                    ? val
                                    : moduleSettings.generateScopedName(val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
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
                        throw new Error(`pure module: No id or class found in selector '${node.sel}' at '${options.source.getOffsets(node[LOCSTA]).join(":")}'`);
                    }
                }
                node.sel = "";
                for (const token of node[TOKENS]) {
                    node.sel += renderValue(token);
                }
            }
            else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframesAtRuleNodeType) {
                const val = node.nam.toLowerCase();
                if (node[TOKENS] == null) {
                    node[TOKENS] = parseString(node.val);
                }
                if (val == "property" || val == "keyframes") {
                    const prefix = val == "property" ? "--" : "";
                    for (const value of node[TOKENS]) {
                        if ((prefix == "--" && value.typ == EnumToken.DashedIdenTokenType) ||
                            (prefix == "" && value.typ == EnumToken.IdenTokenType)) {
                            if (!(value.val in mapping)) {
                                let val = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                    ? value.val
                                    : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
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
                    node.val = renderTokens(node[TOKENS]);
                }
            }
        }
        if (moduleSettings.naming != ModuleCaseTransformEnum.IgnoreCase) {
            revMapping = {};
            mapping = {};
            let keyName;
            for (const [key, value] of Object.entries(mapping)) {
                keyName = getKeyName(key, moduleSettings.naming);
                mapping[keyName] = value;
                revMapping[value] = keyName;
            }
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
    if (typeof options.validation !== "boolean") {
        options.validation = !!options.validation;
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
    const imports = [];
    let item;
    let node;
    let parensMatch = 0;
    let curlyBracketMatch = 0;
    let tokenizer = iter instanceof Promise ? await iter : iter;
    // ast[ROOT] = ast;
    ast[LOCSRCID] = options.source.id;
    ast[LOCSTA] = 0;
    ast[LOCEND] = 0;
    // if (Array.isArray(iter)) {
    //     // @ts-expect-error
    //     iter = iter[Symbol.iterator]() as Iterator<TokenizeResult>;
    // }
    while (!tokenizer.done()) {
        tokenizer.next();
        if (tokenizer.unit != null) {
            item = {
                typ: tokenizer.typ,
                val: tokenizer.val,
                unit: tokenizer.unit,
            };
        }
        else if (tokenizer.nam != null) {
            item = {
                typ: tokenizer.typ,
                nam: tokenizer.nam,
            };
        }
        else if (tokenizer.val === null) {
            item = {
                typ: tokenizer.typ,
            };
        }
        else if (tokenizer.kin != null) {
            item = {
                typ: tokenizer.typ,
                val: tokenizer.val,
                kin: tokenizer.kin,
            };
        }
        else {
            item = {
                typ: tokenizer.typ,
                val: tokenizer.val,
            };
        }
        item[LOCSRCID] = tokenizer.srcId;
        item[LOCSTA] = tokenizer.sta;
        item[LOCEND] = tokenizer.end;
        stats.bytesIn = tokenizer.bytesIn;
        stats.tokensCount++;
        if (BadTokensTypes.includes(item.typ)) {
            tokens.push(item);
            errors.push({
                action: "drop",
                message: "Bad token",
                syntax: null,
                node: item,
                location: options.source.getSourceLocation(item[LOCSTA]),
            });
            // bad token
            continue;
        }
        if (item.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(item.typ)) {
            parensMatch++;
        }
        else if (item.typ === EnumToken.EndParensTokenType && parensMatch > 0) {
            parensMatch--;
        }
        if (item.typ === EnumToken.BlockStartTokenType) {
            curlyBracketMatch++;
        }
        else if (item.typ === EnumToken.BlockEndTokenType && curlyBracketMatch > 0) {
            curlyBracketMatch--;
        }
        tokens.push(item);
        if (parensMatch === 0 &&
            (item.typ === EnumToken.SemiColonTokenType ||
                item.typ === EnumToken.BlockStartTokenType ||
                item.typ === EnumToken.EOFTokenType)) {
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
            else if (item.typ == EnumToken.BlockStartTokenType) {
                let inBlock = 1;
                tokens.length = 0;
                tokens.push(item);
                do {
                    tokenizer.next();
                    if (tokenizer.unit != null) {
                        item = {
                            typ: tokenizer.typ,
                            val: tokenizer.val,
                            unit: tokenizer.unit,
                        };
                    }
                    else if (tokenizer.nam != null) {
                        item = {
                            typ: tokenizer.typ,
                            nam: tokenizer.nam,
                        };
                    }
                    else if (tokenizer.val === null) {
                        item = {
                            typ: tokenizer.typ,
                        };
                    }
                    else if (tokenizer.kin != null) {
                        item = {
                            typ: tokenizer.typ,
                            val: tokenizer.val,
                            kin: tokenizer.kin,
                        };
                    }
                    else {
                        item = {
                            typ: tokenizer.typ,
                            val: tokenizer.val,
                        };
                    }
                    item[LOCSRCID] = tokenizer.srcId;
                    item[LOCSTA] = tokenizer.sta;
                    item[LOCEND] = tokenizer.end;
                    tokens.push(item);
                    if (item.typ === EnumToken.BlockStartTokenType) {
                        inBlock++;
                    }
                    else if (item.typ === EnumToken.BlockEndTokenType) {
                        inBlock--;
                    }
                } while (inBlock != 0 && !tokenizer.done());
                if (tokens.length > 0) {
                    errors.push({
                        action: "drop",
                        message: "invalid block",
                        location: options.source.getSourceLocation(tokens[0][LOCSTA]),
                    });
                }
            }
            tokens.length = 0;
        }
        else if ((parensMatch === 0 || curlyBracketMatch === 0) && item.typ === EnumToken.BlockEndTokenType) {
            parseNode(tokens, context, options, errors, stats, invalidNodes);
            context[LOCEND] = item[LOCEND];
            const previousNode = stack.pop();
            context = (stack[stack.length - 1] ?? ast);
            if (options.removeEmpty &&
                previousNode != null &&
                previousNode.chi.length == 0 &&
                context.chi[context.chi.length - 1] == previousNode) {
                context.chi.pop();
            }
            tokens.length = 0;
            parensMatch = 0;
            curlyBracketMatch = 0;
        }
        // }
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
            if (node[STATE] !== EnumAstNodeStatus.Validated) {
                return;
            }
            const token = node[TOKENS][0];
            const url = token.typ == EnumToken.StringTokenType ? token.val.slice(1, -1) : token.val;
            try {
                const src = options.resolve(url, options.src ? dirname(options.src) : options.cwd);
                const result = options.load(src);
                const stream = result instanceof Promise || Object.getPrototypeOf(result).constructor.name == "AsyncFunction"
                    ? await result
                    : result;
                const source = new SourceFile(typeof stream === "string" ? stream : "", [], src.relative);
                options.sourcesMap.set(source.id, source);
                const parseInfo = {
                    stream,
                    offset: 0,
                    source,
                    position: 0,
                    currentPosition: 0,
                    time: 0,
                };
                const root = await doParse(stream instanceof ReadableStream
                    ? new Tokenizer(parseInfo, stream).tokenizeStream()
                    : new Tokenizer(parseInfo), Object.assign({}, options, {
                    minify: false,
                    setParent: false,
                    src: options.resolve(url, options.src || options.cwd).relative,
                }));
                stats.importedBytesIn += root.stats.bytesIn;
                stats.nodesCount += root.stats.nodesCount;
                stats.tokensCount += root.stats.tokensCount;
                stats.imports.push(root.stats);
                // @ts-ignore
                node[PARENT].chi.splice(node[PARENT].chi.indexOf(node), 1, ...root.ast.chi);
                if (root.errors.length > 0) {
                    for (const error of root.errors) {
                        errors.push(error);
                    }
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
    if (options.visitor != null) {
        let parens;
        let genericKey;
        const handlers = [];
        const visitors = parseVisitors(options.visitor, errors);
        let nodes = new Array(stats.tokensCount);
        const subNodes = [];
        let i;
        let k;
        let j;
        let freeblock = 1;
        nodes[0] = ast;
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i] == null) {
                break;
            }
            subNodes.length = 0;
            if (visitors.includeTokens) {
                switch (nodes[i].typ) {
                    case EnumToken.RuleNodeType:
                    case EnumToken.AtRuleNodeType:
                    case EnumToken.KeyframesRuleNodeType:
                    case EnumToken.KeyframesAtRuleNodeType:
                        for (const token of nodes[i][TOKENS]) {
                            subNodes.push(token);
                        }
                        break;
                    case EnumToken.DeclarationNodeType:
                        for (const token of nodes[i].val) {
                            subNodes.push(token);
                        }
                        break;
                }
            }
            // @ts-ignore
            if (nodes[i].chi != null) {
                // @ts-ignore
                for (k = 0; k < nodes[i].chi.length; k++) {
                    // @ts-ignore
                    subNodes.push(nodes[i].chi[k]);
                }
            }
            if (subNodes.length > 0) {
                if (freeblock <= i) {
                    freeblock = i + 1;
                }
                for (k = 0; k < subNodes.length; k++) {
                    j = k + freeblock;
                    nodes[j] = subNodes[k];
                    nodes[j][PARENT] = nodes[i];
                }
                freeblock += subNodes.length;
            }
            parens = null;
            handlers.length = 0;
            genericKey =
                nodes[i].typ == EnumToken.DeclarationNodeType
                    ? "Declaration"
                    : nodes[i].typ == EnumToken.AtRuleNodeType
                        ? "AtRule"
                        : nodes[i].typ == EnumToken.KeyframesAtRuleNodeType
                            ? "KeyframesAtRule"
                            : nodes[i].typ === EnumToken.KeyframesRuleNodeType
                                ? "KeyframesRule"
                                : nodes[i].typ == EnumToken.RuleNodeType
                                    ? "Rule"
                                    : nodes[i].typ == EnumToken.KeyframesRuleNodeType
                                        ? "KeyframesRule"
                                        : null;
            let keyName = nodes[i].typ == EnumToken.DeclarationNodeType || nodes[i].typ == EnumToken.AtRuleNodeType
                ? camelize(nodes[i].nam)
                : nodes[i].typ == EnumToken.KeyframesAtRuleNodeType
                    ? camelize(nodes[i].val)
                    : null;
            for (const map of visitors.allHandlers) {
                // @ts-ignore
                if (genericKey != null && map.has(genericKey)) {
                    // @ts-ignore
                    for (const handler of map.get(genericKey)) {
                        if (typeof handler == "function") {
                            handlers.push(handler);
                        }
                        // else if (Array.isArray(handler)) {
                        //     for (const h of handler) {
                        //         if (typeof h == "function") {
                        //             handlers.push(h);
                        //         }
                        //         // @ts-ignore
                        //         else if (h[keyName] != null) {
                        //             // @ts-ignore
                        //             handlers.push(h[keyName]);
                        //         }
                        //     }
                        // } else if (typeof handler.handler! == "function") {
                        //     handlers.push(handler.handler);
                        // }
                        // @ts-ignore
                        else if (typeof handler[keyName] == "function") {
                            // @ts-ignore
                            handlers.push(handler[keyName]);
                        }
                    }
                }
                // @ts-ignore
                if (map.has(nodes[i].typ)) {
                    // @ts-ignore
                    for (const handler of map.get(nodes[i].typ)) {
                        if (typeof handler == "function") {
                            handlers.push(handler);
                        }
                        else if (Array.isArray(handler)) {
                            for (const h of handler) {
                                if (typeof h == "function") {
                                    handlers.push(h);
                                }
                            }
                        }
                        else if (typeof handler.handler == "function") {
                            handlers.push(handler.handler);
                        }
                        // @ts-ignore
                        else if (typeof handler[keyName] == "function") {
                            // @ts-ignore
                            handlers.push(handler[keyName]);
                        }
                    }
                }
            }
            if (handlers.length == 0) {
                continue;
            }
            let node = nodes[i];
            for (const callable of handlers) {
                replacement = callable(node, nodes[i][PARENT], ast, 
                // @ts-expect-error
                function* () {
                    if (parens == null) {
                        let node = nodes[i][PARENT];
                        while (node != null) {
                            yield node;
                            node = node[PARENT];
                        }
                    }
                });
                if (replacement == null) {
                    continue;
                }
                if (replacement instanceof Promise) {
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
            if (node != nodes[i]) {
                // @ts-ignore
                replaceNodeOrValue(nodes[i][PARENT], nodes[i], node);
            }
        }
        nodes = null;
    }
    if (invalidNodes.length > 0) {
        let count = invalidNodes.length;
        for (const { node, parent } of walk(ast)) {
            if (options.lenient && node[STATE] == EnumAstNodeStatus.Unknown) {
                continue;
            }
            if (node[STATE] === EnumAstNodeStatus.Invalid ||
                node[STATE] === EnumAstNodeStatus.Unknown ||
                node[STATE] === EnumAstNodeStatus.Unparsed ||
                node[STATE] === EnumAstNodeStatus.Malformed ||
                node[STATE] === EnumAstNodeStatus.Disallowed) {
                // @ts-ignore
                parent.chi.splice(parent.chi.indexOf(node), 1);
                node[PARENT] = null;
                count--;
                if (count == 0) {
                    break;
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
            // tokenize: `${(options?.parseInfo?.time ?? 0).toFixed(2)}ms`,
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
                ? options.resolve(options.src, options.cwd).relative
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
                const source = new SourceFile(typeof stream === "string" ? stream : "", [], src.relative);
                options.sourcesMap.set(source.id, source);
                const parseInfo = {
                    stream,
                    buffer: "",
                    offset: 0,
                    time: 0,
                    source,
                    position: 0,
                    currentPosition: 0,
                };
                const root = await doParse(stream instanceof ReadableStream
                    ? new Tokenizer(parseInfo, stream).tokenizeStream()
                    : new Tokenizer(parseInfo), Object.assign({}, options, {
                    source,
                    minify: false,
                    setParent: false,
                    src: src.relative,
                }));
                // options.parseInfo!.time += parseInfo.time;
                cssVariablesMap[node.nam] = root.cssModuleVariables;
                parent.chi.splice(parent.chi.indexOf(node), 1);
                continue;
            }
            // @ts-ignore
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
                        // @ts-ignore
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
                    const composeSelectors = [];
                    // let isValid: boolean = true;
                    for (const token of node.val) {
                        if (token.typ == EnumToken.ComposesSelectorNodeType) {
                            composeSelectors.push(token);
                        }
                    }
                    // find parent rule
                    let parentRule = parent;
                    while (parentRule != null && parentRule.typ != EnumToken.RuleNodeType) {
                        parentRule = parentRule[PARENT];
                    }
                    if ( /* !isValid || */composeSelectors.length == 0) {
                        errors.push({
                            action: "drop",
                            message: `composes is empty`,
                            node,
                        });
                        parentRule.chi.splice(parentRule.chi.indexOf(node), 1);
                        continue;
                    }
                    const resolvedSrc = options.resolve(options.src, options.cwd);
                    for (const token of composeSelectors) {
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
                                    // @ts-expect-error
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
                                    for (const tk of parentRule[TOKENS]) {
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
                                ? new Tokenizer({
                                    offset: 0,
                                    source: new SourceFile("", [], src.relative),
                                    position: 0,
                                    currentPosition: 0,
                                }, stream).tokenizeStream()
                                : new Tokenizer({
                                    stream,
                                    offset: 0,
                                    position: 0,
                                    source: new SourceFile(stream, [], src.relative),
                                    currentPosition: 0,
                                }), Object.assign({}, options, {
                                minify: false,
                                setParent: false,
                                src: src.relative,
                            }));
                            let srcIndex = options.resolve(src.absolute, resolvedSrc.absolute).relative;
                            if (!srcIndex.startsWith("/") && !srcIndex.startsWith("../")) {
                                srcIndex = `./${srcIndex}`;
                            }
                            if (Object.keys(root.mapping).length > 0) {
                                importMapping[srcIndex] = {};
                            }
                            if (parentRule != null) {
                                for (const tk of parentRule[TOKENS]) {
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
                                                    let value = 
                                                    // @ts-expect-error
                                                    result instanceof Promise ? await result : result;
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
                                    for (const tk of parentRule[TOKENS]) {
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
                    parent.chi.splice(parent.chi.indexOf(node), 1);
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
                            // @ts-expect-error
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
                                        // @ts-expect-error
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
                                // @ts-expect-error
                                mapping[value.val] = result instanceof Promise ? await result : result;
                                revMapping[mapping[value.val]] = value.val;
                            }
                            value.val = mapping[value.val];
                        }
                    }
                }
                for (const { value, parent } of walkValues(node.val, node)) {
                    if (value.typ == EnumToken.DashedIdenTokenType) {
                        value.val = mapping[value.val];
                    }
                    else if ((value.typ == EnumToken.IdenTokenType || isIdentColor(value)) &&
                        value.val in importedCssVariables) {
                        replaceNodeOrValue(
                        // @ts-ignore
                        parent, value, importedCssVariables[value.val].val);
                    }
                }
            }
            else if (node.typ == EnumToken.RuleNodeType) {
                // if (node[TOKENS] == null) {
                const tokens = parseString(node.sel);
                matchSelectorSyntax(tokens, [], options);
                node[TOKENS] = trimArray(tokens);
                // }
                let hasIdOrClass = false;
                for (const { value } of walkValues(node[TOKENS], node, 
                // @ts-ignore
                (value, parent) => {
                    if (value.typ == EnumToken.PseudoClassTokenType ||
                        value.typ == EnumToken.PseudoElementTokenType) {
                        const val = value.val.toLowerCase();
                        switch (val) {
                            case ":local":
                            case ":global":
                                {
                                    let index = parent[TOKENS].indexOf(value);
                                    parent[TOKENS].splice(index, 1);
                                    if (parent[TOKENS][index]?.typ == EnumToken.WhitespaceTokenType ||
                                        parent[TOKENS][index]?.typ ==
                                            EnumToken.DescendantCombinatorTokenType) {
                                        parent[TOKENS].splice(index, 1);
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
                            case ":local":
                                parent[TOKENS].splice(parent[TOKENS].indexOf(value), 1, ...value.chi);
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
                    if (value.typ == EnumToken.PseudoClassTokenType || value.typ == EnumToken.PseudoElementTokenType) ;
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
                                // @ts-expect-error
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
                        throw new Error(`pure module: No id or class found in selector '${node.sel}' at '${(options.source?.getOffsets?.(node[LOCSTA]) ?? []).join(":")}'`);
                    }
                }
                node.sel = "";
                for (const token of node[TOKENS]) {
                    node.sel += renderValue(token);
                }
            }
            else if (node.typ == EnumToken.AtRuleNodeType || node.typ == EnumToken.KeyframesAtRuleNodeType) {
                const val = node.nam.toLowerCase();
                if (node[TOKENS] == null) {
                    node[TOKENS] = parseString(node.val);
                }
                if (val == "property" || val == "keyframes") {
                    const prefix = val == "property" ? "--" : "";
                    for (const value of node[TOKENS]) {
                        if ((prefix == "--" && value.typ == EnumToken.DashedIdenTokenType) ||
                            (prefix == "" && value.typ == EnumToken.IdenTokenType)) {
                            if (!(value.val in mapping)) {
                                const result = moduleSettings.scoped & ModuleScopeEnumOptions.Global
                                    ? value.val
                                    : moduleSettings.generateScopedName(value.val, moduleSettings.filePath, moduleSettings.pattern, moduleSettings.hashLength);
                                // @ts-expect-error
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
                    node.val = renderTokens(node[TOKENS]);
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
                tokens.push({
                    typ: EnumToken.EndParensTokenType,
                    [LOCSRCID]: tokens[k]?.[LOCSRCID],
                    [LOCSTA]: tokens[k]?.[LOCSTA],
                    [LOCEND]: tokens[k]?.[LOCEND],
                });
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
                location: options.source.getSourceLocation(tokens[i][LOCSTA]),
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
            if (tokens[i].typ == EnumToken.CDOCOMMTokenType && context.typ != EnumToken.StyleSheetNodeType) {
                errors.push({
                    action: "drop",
                    message: `CDOCOMM not allowed here ${JSON.stringify(tokens[i], null, 1)}`,
                    node: tokens[i],
                    location: options.source.getSourceLocation(tokens[i][LOCSTA]),
                });
                tokens[i].typ = EnumToken.InvalidCommentTokenType;
                continue;
            }
            tokens[i][ROOT] = context[ROOT];
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
            parent = parent[PARENT];
        }
        node = parseAtRule(tokens, context, { ...options, nestedRule }, errors, delim.typ == EnumToken.BlockStartTokenType);
        if (node == null) {
            return null;
        }
        if (node[STATE] == EnumAstNodeStatus.Invalid ||
            node[STATE] == EnumAstNodeStatus.Disallowed ||
            node[STATE] == EnumAstNodeStatus.Unknown ||
            node[STATE] == EnumAstNodeStatus.Unparsed ||
            node[STATE] == EnumAstNodeStatus.Malformed) {
            invalidNodes.push(node);
        }
        stats.nodesCount++;
        context.chi.push(node);
        node[ROOT] = context[ROOT];
        node[PARENT] = context;
        // @ts-ignore
        return node;
    }
    else {
        stats.nodesCount++;
        // rule
        if (delim.typ == EnumToken.BlockStartTokenType) {
            const node = parseSelector(tokens, context, options, errors);
            context.chi.push(node);
            node[PARENT] = context;
            node[ROOT] = context[ROOT];
            if (node[STATE] == EnumAstNodeStatus.Invalid ||
                node[STATE] == EnumAstNodeStatus.Disallowed ||
                node[STATE] == EnumAstNodeStatus.Unknown ||
                node[STATE] == EnumAstNodeStatus.Unparsed ||
                node[STATE] == EnumAstNodeStatus.Malformed) {
                invalidNodes.push(node);
            }
            return node;
        }
        else {
            const node = parseDeclaration(tokens, context, options, errors);
            node[PARENT] = context;
            node[ROOT] = context[ROOT];
            if (context.typ === EnumToken.StyleSheetNodeType && node.typ === EnumToken.DeclarationNodeType) {
                node[STATE] = EnumAstNodeStatus.Invalid;
                errors.push({
                    message: "<declaration> not allowed in <stylesheet>",
                    action: "drop",
                    node,
                    location: options.source.getSourceLocation(node[LOCSTA]),
                });
            }
            else if (options.lenient || node.typ === EnumToken.DeclarationNodeType) {
                context.chi.push(node);
            }
            if (node[STATE] == EnumAstNodeStatus.Invalid ||
                node[STATE] == EnumAstNodeStatus.Disallowed ||
                node[STATE] == EnumAstNodeStatus.Unknown ||
                node[STATE] == EnumAstNodeStatus.Unparsed ||
                node[STATE] == EnumAstNodeStatus.Malformed) {
                invalidNodes.push(node);
            }
        }
    }
    return null;
}
/**
 * @param stream
 * @param context
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
            location: options.source.getSourceLocation(atRule[LOCSTA]),
            message: "unknown at-rule",
        });
        const result = matchGenericSyntax(stream, options);
        atRule[TOKENS] = parseTokens(stream);
        atRule[STATE] = result.success ? EnumAstNodeStatus.Unknown : EnumAstNodeStatus.Invalid;
        atRule[ERRORS] = result.success ? [errors[errors.length - 1]] : [errors[errors.length - 1], ...result.errors];
        // @ts-expect-error
        return Object.assign(atRule, {
            typ: EnumToken.AtRuleNodeType,
            val: renderTokens(trimArray(stream), options),
            ...(parseAsBlock ? { chi: [] } : {}),
        });
    }
    else if (context.typ === EnumToken.AtRuleNodeType &&
        "page" === context.nam &&
        pageMarginBoxType.has(atRuleName.toLowerCase())) {
        if (parseAsBlock === false) {
            errors.push({
                action: "drop",
                node: atRule,
                location: options.source.getSourceLocation(atRule[LOCSTA]),
                message: parseAsBlock ? "at-rule block not supported" : "at-rule block is required",
            });
            atRule[TOKENS] = parseTokens(stream);
            atRule[STATE] = EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = [errors[errors.length - 1]];
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimArray(stream), options),
                ...(parseAsBlock ? { chi: [] } : {}),
            });
        }
        const token = stream.find((t) => t.typ != EnumToken.WhitespaceTokenType && t.typ === EnumToken.CommentTokenType) ?? null;
        if (token != null) {
            errors.push({
                action: "drop",
                node: token,
                location: options.source.getSourceLocation(token[LOCSTA]),
                message: `unexpected token`,
            });
            atRule[TOKENS] = parseTokens(stream);
            atRule[STATE] = EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = [errors[errors.length - 1]];
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimArray(stream), options),
                ...(parseAsBlock ? { chi: [] } : {}),
            });
        }
    }
    if (parseAsBlock === null) {
        parseAsBlock = blockAllowed;
    }
    if (syntax != null && atRule.nam !== "layer" && parseAsBlock !== blockAllowed) {
        errors.push({
            action: "drop",
            node: atRule,
            location: options.source.getSourceLocation(atRule[LOCSTA]),
            message: parseAsBlock ? "at-rule block not supported" : "at-rule block is required",
        });
        atRule[TOKENS] = parseTokens(stream);
        atRule[STATE] = EnumAstNodeStatus.Invalid;
        atRule[ERRORS] = [errors[errors.length - 1]];
        // @ts-expect-error
        return Object.assign(atRule, {
            typ: EnumToken.AtRuleNodeType,
            val: renderTokens(trimArray(stream), options),
            ...(parseAsBlock ? { chi: [] } : {}),
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
                    location: options.source.getSourceLocation((stream[0] ?? atRule)[LOCSTA]),
                    message: "expecting <space>",
                });
            }
            else if (stream[1].typ !== EnumToken.StringTokenType) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    location: options.source.getSourceLocation((stream[1] ?? atRule)[LOCSTA]),
                    message: "expecting <string>",
                });
            }
            if (success && stream[1].val.charCodeAt(0) !== 0x22) {
                success = false;
                errors.push({
                    action: "drop",
                    node: stream[1] ?? atRule,
                    location: options.source.getSourceLocation((stream[1] ?? atRule)[LOCSTA]),
                    message: "expecting double-quoted string",
                });
            }
            if (!success) {
                atRule[TOKENS] = stream;
                atRule[STATE] = EnumAstNodeStatus.Invalid;
                atRule[ERRORS] = [errors[errors.length - 1]];
                atRule[LOCEND] = (stream.at(-1) ?? atRule)[LOCEND];
                // @ts-expect-error
                return Object.assign(atRule, {
                    typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                    val: renderTokens(trimArray(stream), options),
                });
            }
            if (options.removeCharset) {
                return null;
            }
            atRule[TOKENS] = stream;
            atRule[STATE] = EnumAstNodeStatus.Validated;
            atRule[ERRORS] = [];
            atRule[LOCEND] = (stream.at(-1) ?? atRule)[LOCEND];
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: success ? EnumToken.AtRuleNodeType : EnumToken.InvalidRuleNodeType,
                val: renderTokens(trimArray(stream), options),
            });
        }
        case "font-feature-values": {
            const result = parseAtRuleFontFeatureValues(stream, atRule, options);
            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }
            atRule[TOKENS] = stream;
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : result.errors;
            atRule[LOCEND] = (stream.at(-1) ?? atRule)[LOCEND];
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                chi: [],
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
                    location: options.source.getSourceLocation(atRule[LOCSTA]),
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
                            location: options.source.getSourceLocation(token[LOCSTA]),
                            message: `unexpected token`,
                        });
                    }
                }
            }
            atRule[LOCEND] = (stream.at(-1) ?? atRule)[LOCEND];
            atRule[TOKENS] = stream;
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = [errors[errors.length - 1]];
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                chi: [],
            });
        }
        case "container": {
            const result = parseAtRuleContainerQueryList(stream, atRule, options);
            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }
            atRule[LOCEND] = (stream.at(-1) ?? atRule)[LOCEND];
            atRule[TOKENS] = stream;
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : result.errors;
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                chi: [],
            });
        }
        case "custom-media": {
            const tokens = trimArray(stream.slice(1));
            const result = matchAllSyntaxes(syntax, createValidationContext(tokens), options);
            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }
            // @ts-expect-error
            options = { ...options, convertColor: false };
            atRule[LOCEND] = (tokens.at(-1) ?? atRule)[LOCEND];
            atRule[TOKENS] = tokens;
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.ValidationFailed;
            atRule[ERRORS] = result.success ? [] : result.errors;
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(tokens), options),
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
                    location: options.source.getSourceLocation(atRule[LOCSTA]),
                    message: `expected <keyframe-name>`,
                });
                success = false;
            }
            // @ts-expect-error
            options = { ...options, convertColor: false };
            atRule[LOCEND] = (tokens.at(-1) ?? atRule)[LOCEND];
            atRule[TOKENS] = tokens;
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = success ? [] : [errors[errors.length - 1]];
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.KeyframesAtRuleNodeType,
                val: renderTokens(tokens, options),
                chi: [],
            });
        }
        case "namespace": {
            const result = matchAllSyntaxes(syntax, createValidationContext(stream), options);
            if (!result.success) {
                for (const error of result.errors) {
                    errors.push(error);
                }
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
            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = valid ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = valid ? [] : result.errors;
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: trimArray(stream).reduce((acc, t, index) => acc +
                    (t.typ === EnumToken.CommentTokenType ||
                        (t.typ === EnumToken.WhitespaceTokenType &&
                            stream[index + 1]?.typ === EnumToken.CommentTokenType &&
                            (stream.length < index + 3 || stream[index + 2]?.typ === EnumToken.WhitespaceTokenType))
                        ? ""
                        : renderValue(t, options)), ""),
                ...(parseAsBlock ? { chi: [] } : {}),
            });
        }
        case "import": {
            const result = matchAtRuleImportSyntax(atRule, stream, context, options);
            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }
            else {
                if (stream[0]?.typ == EnumToken.UrlFunctionTokenType &&
                    stream[0].chi.some((t) => t.typ == EnumToken.StringTokenType || t.typ == EnumToken.UrlTokenTokenType)) {
                    stream.splice(0, 1, ...stream[0].chi);
                }
            }
            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : result.errors;
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: stream.reduce((acc, t, index) => acc +
                    (t.typ === EnumToken.CommentTokenType ||
                        (t.typ === EnumToken.WhitespaceTokenType &&
                            stream[index + 1]?.typ === EnumToken.CommentTokenType &&
                            (stream.length < index + 3 || stream[index + 2]?.typ === EnumToken.WhitespaceTokenType))
                        ? ""
                        : renderValue(t, options)), ""),
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
                for (const error of result.errors) {
                    errors.push(error);
                }
            }
            let success = result.success;
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
                    // @ts-expect-error
                }
                else if (sibling.nam !== "when") {
                    // @ts-expect-error
                    if (sibling.nam !== "else") {
                        missingWhen = true;
                        // @ts-expect-error
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
                        location: options.source.getSourceLocation(atRule[LOCSTA]),
                        message: "at-rule @when is required before @else block",
                    });
                }
                else if (definedAfterLastElse) {
                    success = false;
                    errors.push({
                        action: "drop",
                        node: atRule,
                        location: options.source.getSourceLocation(atRule[LOCSTA]),
                        message: "at-rule @else block is defined after last @else block",
                    });
                }
            }
            // @ts-expect-error
            options = { ...options, minify: false, convertColor: false };
            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : [errors[errors.length - 1]].concat(result.errors);
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
            });
        }
        case "media": {
            options = { ...options, parseColor: false };
            const result = parseMediaqueryList(stream, options);
            if (result.errors.length > 0) {
                for (const error of result.errors) {
                    errors.push(error);
                }
            }
            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.success ? [] : result.errors;
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
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
                    location: options.source.getSourceLocation((range[0] ?? atRule)[LOCSTA]),
                    message: "expected '(' at start of @scope block",
                });
                success = false;
            }
            else if (range.at(-1)?.typ !== EnumToken.EndParensTokenType) {
                errors.push({
                    action: "drop",
                    node: range.at(-1) ?? atRule,
                    location: options.source.getSourceLocation((range.at(-1) ?? atRule)[LOCSTA]),
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
                            location: options.source.getSourceLocation(stream[index]?.[LOCSTA]),
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
                                location: options.source.getSourceLocation(stream[index]?.[LOCSTA]),
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
                                    location: options.source.getSourceLocation((range.at(-1) ?? atRule)[LOCSTA]),
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
            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = success ? [] : [errors[errors.length - 1]];
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
            });
        }
        case "page": {
            trimArray(stream);
            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = success ? [] : [errors[errors.length - 1]];
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
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
                    location: options.source.getSourceLocation(atRule[LOCSTA]),
                    message: "node is allowed only in @page rule",
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
                            location: options.source.getSourceLocation(stream[i][LOCSTA]),
                            message: "expected whitespace or comment",
                        });
                        break;
                    }
                }
            }
            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = success ? [] : [errors[errors.length - 1]];
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(stream, options),
                chi: [],
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
                    stream.splice(index, 0, {
                        typ: EnumToken.ColonTokenType,
                        [LOCSRCID]: stream[index][LOCSRCID],
                        [LOCSTA]: stream[index][LOCSTA],
                        [LOCEND]: stream[index][LOCEND],
                    });
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
            let result = matchAllSyntaxes(syntaxRules?.getPreludeRules()?.slice?.(1), createValidationContext(stream), options);
            atRule[STATE] = success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = success ? [] : [errors[errors.length - 1]];
            if (!result.success) {
                for (const error of result.errors) {
                    errors.push(error);
                }
                return {
                    typ: EnumToken.AtRuleNodeType,
                    val: renderTokens(stream, options),
                    [LOCSRCID]: atRule[LOCSRCID],
                    [LOCSTA]: atRule[LOCSTA],
                    [LOCEND]: stream.at(-1)?.[LOCEND] ?? atRule[LOCEND],
                    [TOKENS]: stream,
                    [STATE]: EnumAstNodeStatus.Invalid,
                    [ERRORS]: result.errors,
                };
            }
            if (isVarDeclaration) {
                const nam = stream.find((t) => t.typ == EnumToken.IdenTokenType);
                const value = trimArray(stream.slice(index + 1).filter((t) => t.typ != EnumToken.CommentTokenType));
                if (value.length == 1 && value[0].typ == EnumToken.StringTokenType) {
                    // import from file as alias
                    return {
                        typ: EnumToken.CssVariableImportTokenType,
                        nam: nam.val,
                        val: value,
                        [LOCSRCID]: atRule[LOCSRCID],
                        [LOCSTA]: atRule[LOCSTA],
                        [LOCEND]: stream.at(-1)?.[LOCEND] ?? atRule[LOCEND],
                        [TOKENS]: stream,
                        [STATE]: EnumAstNodeStatus.Validated,
                        [ERRORS]: [],
                    };
                }
                // import variables from alias
                return {
                    typ: EnumToken.CssVariableTokenType,
                    nam: nam.val,
                    val: value,
                    [LOCSRCID]: atRule[LOCSRCID],
                    [LOCSTA]: atRule[LOCSTA],
                    [LOCEND]: stream.at(-1)?.[LOCEND] ?? atRule[LOCEND],
                    [TOKENS]: stream,
                    [STATE]: EnumAstNodeStatus.Validated,
                    [ERRORS]: [],
                };
            }
            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[STATE] = EnumAstNodeStatus.Validated;
            atRule[ERRORS] = [];
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.CssVariableDeclarationMapTokenType,
                vars: trimArray(stream.slice(0, index)),
                from: stream.slice(index + 1),
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
                result = matchGenericSyntax(stream, options);
                if (result.errors.length > 0) {
                    for (const error of result.errors) {
                        errors.push(error);
                    }
                }
            }
            else {
                result = matchAtRuleSyntax(atRule, stream, options);
                if (result.errors.length > 0) {
                    for (const error of result.errors) {
                        errors.push(error);
                    }
                }
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
                            stream[index][LOCEND] = stream[i][LOCEND];
                            Object.assign(stream[index], {
                                typ: tokensfuncDefMap.get(stream[index].typ),
                                chi: stream.splice(index + 1, i - index - 1),
                            });
                            i = index;
                            stream.splice(index + 1, 1);
                            stack.pop();
                        }
                    }
                }
            }
            atRule[LOCEND] = stream.at(-1)?.[LOCEND] ?? atRule[LOCEND];
            atRule[TOKENS] = stream.slice();
            atRule[STATE] = result.success ? EnumAstNodeStatus.Validated : EnumAstNodeStatus.Invalid;
            atRule[ERRORS] = result.errors;
            // @ts-expect-error
            return Object.assign(atRule, {
                typ: EnumToken.AtRuleNodeType,
                val: renderTokens(trimWhiteSpaceTokens(stream), options),
                ...(parseAsBlock ? { chi: [] } : {}),
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
    const stream = `.x{${declaration}}`;
    return doParse(new Tokenizer({
        stream,
        offset: 0,
        position: 0,
        source: new SourceFile(stream, [], ""),
        currentPosition: 0,
    }), { setParent: false, minify: false, validation: false }).then((result) => {
        return result.ast.chi[0].chi.filter((t) => t.typ == EnumToken.DeclarationNodeType || t.typ == EnumToken.CommentNodeType);
    });
}
/**
 * Parse css string and return an array of tokens
 * @param src
 * @param options
 *    - parseColor: parse identifiers as colors
 *    - src: source url used for source map
 * @param errors capture parse errors in the provided array

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
 * tokens = parseString('#c322c980');
 * console.log(tokens);
 * ```
 */
function parseString(src, options = { parseColor: true }, errors) {
    // const parseInfo: ParseInfo = {
    //     stream: src,
    //     offset: 0,
    //     time: 0,
    //     source: new SourceFile(src, [], ""),
    //     position: 0,
    //     currentPosition: 0,
    // };
    const tokenizer = new Tokenizer({
        stream: src,
        buffer: "",
        src: options?.src ?? "",
        offset: 0,
        time: 0,
        source: new SourceFile(src, [], options?.src ?? ""),
        position: 0,
        currentPosition: 0,
    });
    const mapped = [];
    let token;
    while (!tokenizer.done()) {
        tokenizer.next();
        if (tokenizer.unit != null) {
            token = {
                typ: tokenizer.typ,
                val: tokenizer.val,
                unit: tokenizer.unit,
            };
        }
        else if (tokenizer.val === null) {
            token = {
                typ: tokenizer.typ,
            };
        }
        else if (tokenizer.kin != null) {
            token = {
                typ: tokenizer.typ,
                val: tokenizer.val,
                kin: tokenizer.kin,
            };
        }
        else {
            token = {
                typ: tokenizer.typ,
                val: tokenizer.val,
            };
        }
        token[LOCSRCID] = tokenizer.source.id;
        token[LOCEND] = tokenizer.end;
        token[LOCSTA] = tokenizer.sta;
        mapped.push(token);
    }
    const result = parseTokens(mapped, options, errors);
    // remove EOF token
    result.splice(result.length - (result[result.length - 2]?.typ === EnumToken.WhitespaceTokenType ? 2 : 1), 2);
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
    options ??= { parseColor: true };
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
                t[LOCEND] = tokens[i][LOCEND];
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
                    message: `Unbalanced token ')'`,
                    node,
                    location: options.source.getSourceLocation(node[LOCSTA]),
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
            if (tokens[index].typ === EnumToken.ColorTokenType && options?.parseColor) {
                parseColor(tokens[index]);
            }
            stack.pop();
            continue;
        }
        if (t.typ === EnumToken.AttrEndTokenType) {
            if (stack.at(-1)?.typ !== EnumToken.AttrStartTokenType) {
                // unbalanced
                const node = stack.at(-1);
                errors?.push?.({
                    action: "drop",
                    message: `Unbalanced token ']'`,
                    node,
                    location: options.source.getSourceLocation(node[LOCSTA]),
                });
                continue;
            }
            index = tokens.indexOf(stack.at(-1));
            const attr = stack.at(-1);
            attr[LOCEND] = t[LOCEND];
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
            location: options.source.getSourceLocation(node[LOCSTA]),
        });
    }
    return tokens;
}

export { doParse, doParseSync, generateScopedName, generateSyncScopedName, getKeyName, getShortNameGenerator, parseAtRule, parseDeclarations, parseString, parseTokens, trimWhiteSpace };
