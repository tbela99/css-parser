/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.1
	License: MIT
 */
import { eq, eqToken } from '../parser/utils/eq.js';
import { renderValue, NodeRenderer } from '../printer/render.js';
import * as index from './features/index.js';
import { EnumToken, EnumAstNodeStatus } from './types.js';
import { StringBuilder } from './strings.js';
import { isWhiteSpace, isIdent, isFunction, isIdentStart } from '../syntax/syntax.js';
import { FeatureWalkMode } from './features/type.js';
import { moveResult } from './mixins/utils.js';
import { trimArray } from '../validation/match.js';
import { combinators } from '../syntax/constants.js';
import { parseString } from '../parser/parse.js';
import { equalsIgnoreCase } from '../parser/utils/text.js';
import { ValueWalker } from './walk.js';

const notEndingWith = ["(", "["].concat(combinators);
// @ts-ignore
const features = Object.values(index).sort((a, b) => a.ordering - b.ordering);
/**
 * Apply minification rules to the ast tree
 * @param arena
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 *
 * @param context
 * @private
 */
function minify(arena, ast, options = {}, recursive = false, errors, nestingContent, context = {}) {
    let preprocess = false;
    let postprocess = false;
    let { sourcemap, module, ...options2 } = options;
    if (!(options2.features != null)) {
        options2 = {
            removeDuplicateDeclarations: true,
            computeShorthand: true,
            computeCalcExpression: true,
            removePrefix: false,
            features: [],
            ...options2,
        };
        for (const feature of features) {
            feature.register(options2);
        }
        options2.features.sort((a, b) => a.ordering - b.ordering);
    }
    for (const feature of options2.features) {
        if (feature.processMode & FeatureWalkMode.Pre) {
            preprocess = true;
        }
        if (feature.processMode & FeatureWalkMode.Post) {
            postprocess = true;
        }
    }
    /**
     * run the features on every node of the tree
     * @param mode
     */
    const runFeatures = (mode) => {
        // breadth first traversal
        const queue = [ast];
        let node;
        let typ;
        let replacement;
        for (let k = 0; k < queue.length; k++) {
            node = queue[k];
            typ = arena.dataTypes[node];
            if (typ === EnumToken.CommentTokenType || typ === EnumToken.CDOCOMMTokenType) {
                continue;
            }
            replacement = node;
            for (const feature of options2.features) {
                if ((feature.processMode & mode) === 0 || (feature.accept != null && !feature.accept.has(typ))) {
                    continue;
                }
                if (Array.isArray(replacement)) {
                    break;
                }
                // the prelude tokens of the rules whose selector has been rewritten are not parsed again:
                // the features and the renderer use the selector / prelude string
                const result = feature.run(arena, replacement, options2, arena.parents[node] === 0 ? ast : arena.parents[node], context, mode);
                if (result != null) {
                    replacement = result;
                }
            }
            if (replacement != null &&
                (!Array.isArray(replacement) || replacement.length > 0) &&
                replacement != node &&
                arena.parents[node] !== 0) {
                arena.replaceChild(node, ...(Array.isArray(replacement) ? replacement : [replacement]));
            }
            if (!Array.isArray(replacement) && arena.flags[replacement] & EnumAstNodeStatus.HasChildren) {
                for (let child = arena.firstChild[replacement]; child !== 0; child = arena.nextSibling[child]) {
                    queue.push(child);
                }
            }
        }
        for (const feature of options2.features) {
            if (feature.processMode & mode && "cleanup" in feature) {
                // @ts-ignore
                feature.cleanup(arena, ast, options2, context, mode);
            }
        }
    };
    if (preprocess) {
        runFeatures(FeatureWalkMode.Pre);
    }
    doMinify(arena, ast, options2, recursive, errors, nestingContent, context);
    if (postprocess) {
        runFeatures(FeatureWalkMode.Post);
    }
    return ast;
}
/**
 * `@apply --mixin()` is equivalent to `@apply --mixin`: a mixin applied without arguments is referenced by its name
 * https://drafts.csswg.org/css-mixins-1/#apply-rule
 * @param arena
 * @param node `@apply` rule
 */
function minifyApplyPrelude(arena, node) {
    let reference = arena.firstToken[node];
    while (reference !== 0 &&
        (arena.dataTypes[reference] === EnumToken.WhitespaceTokenType ||
            arena.dataTypes[reference] === EnumToken.CommentTokenType)) {
        reference = arena.nextSibling[reference];
    }
    if (reference === 0 || arena.dataTypes[reference] !== EnumToken.CustomFunctionTokenType) {
        return;
    }
    // the comments and the whitespace are ignored: `@apply --mixin(/* comment */)` has no argument
    for (let token = arena.firstToken[reference]; token !== 0; token = arena.nextSibling[token]) {
        if (arena.dataTypes[token] !== EnumToken.WhitespaceTokenType &&
            arena.dataTypes[token] !== EnumToken.CommentTokenType) {
            return;
        }
    }
    const name = arena.resolveString(arena.stringValue[reference]);
    arena.setTokenList(node, [arena.createToken(EnumToken.DashedIdenTokenType, name)]);
    // inlined: arena.setValueString(node, name)
    arena.stringValue[node] = arena.internString(name);
}
function transformAtRuleMediaPrelude(arena, values) {
    return { hasUpdates: false, values: trimArray(arena, values) };
}
/**
 * Minify at-rule media
 * - remove redundant tokens
 * - generate range queries
 *
 * @private
 * @param arena
 * @param tokens
 */
function minifyAtRuleMedia(arena, tokens) {
    const parts = [[]];
    for (const token of tokens) {
        if (arena.dataTypes[token] === EnumToken.CommaTokenType) {
            parts.push([]);
        }
        else {
            parts[parts.length - 1].push(token);
        }
    }
    const sections = new Map();
    for (const values of parts) {
        if (sections.has("all")) {
            break;
        }
        const result = transformAtRuleMediaPrelude(arena, values);
        if (result.values.length === 0) {
            continue;
        }
        let key = "";
        for (const token of values) {
            key += renderValue(arena, token);
        }
        sections.set(key, result.values);
    }
    if (sections.has("all")) {
        tokens.length = 0;
    }
    // return ast;
    return tokens;
}
/**
 * Reduce selectors
 * @param acc
 * @param curr
 *
 * @private
 */
function reduce(acc, curr) {
    // trim :is()
    if (curr[0] === "&") {
        if (curr[1] === " " && !isIdent(curr[2]) && !isFunction(curr[2])) {
            const all = new Array(Math.max(curr.length - 2, 0));
            let write = 0;
            for (let read = 2; read < curr.length; read++) {
                all[write++] = curr[read];
            }
            curr.length = 0;
            for (let index = 0; index < write; index++) {
                curr[index] = all[index];
            }
        }
    }
    acc.push(curr.join(""));
    return acc;
}
/**
 * true if the selector part is a simple selector that can be moved into `:is()`: it is not a combinator, a whitespace
 * (descendant combinator), the nesting selector or a pseudo-element (a pseudo-element is not allowed in `:is()`)
 * @param part
 */
function isCompoundPart(part) {
    return (part.trim() !== "" &&
        part !== "&" &&
        !combinators.includes(part) &&
        !part.startsWith("::") &&
        !/^:(before|after|first-line|first-letter)$/i.test(part));
}
/**
 * factor the common prefix of the selectors of a rule into `:is()`. the selectors are relative to the common prefix,
 * see {@link optimizeSelector}: `["&"]` is the prefix itself, `["&", ".a"]` is a compound selector (`.foo.a`),
 * `["&", " ", ".a"]` a descendant selector (`.foo .a`) and `[">", ".a"]` a child selector (`.foo>.a`).
 *
 * - `.foo.a,.foo.b` -> `.foo:is(.a,.b)`. `.foo,.foo.b` -> `.foo:is(*,.b)`
 * - `.foo .a,.foo .b` -> `.foo :is(.a,.b)`, `.foo>.a,.foo>.b` -> `.foo>:is(.a,.b)`
 *
 * the selectors are factored only when the suffixes are compound selectors joined to the prefix with the same
 * combinator: `.foo .a .b,.foo .c` is not `.foo :is(.a .b,.c)`. null when the selectors cannot be factored
 * @param optimized
 */
function factorSelector(optimized) {
    const prefix = optimized.optimized;
    if (prefix.length === 0 ||
        !prefix.every((part) => part === " " || isCompoundPart(part) || combinators.includes(part))) {
        return null;
    }
    let combinator = null;
    const members = [];
    for (const selector of optimized.selector) {
        // the parts that follow the prefix. the whitespace around the combinators is removed
        const suffix = (selector[0] === "&" ? selector.slice(1) : selector.slice()).filter((part, index, parts) => part.trim() !== "" ||
            (!combinators.includes(parts[index - 1]) && !combinators.includes(parts[index + 1])));
        // the prefix itself
        if (suffix.length === 0) {
            if (combinator != null && combinator !== "") {
                return null;
            }
            combinator = "";
            members.push("*");
            continue;
        }
        // the combinator that joins the suffix to the prefix. "" for a compound selector
        const current = suffix[0].trim() === "" ? " " : combinators.includes(suffix[0]) ? suffix[0] : "";
        const compound = current === "" ? suffix : suffix.slice(1);
        if ((combinator != null && combinator !== current) ||
            current === "|" ||
            compound.length === 0 ||
            !compound.every(isCompoundPart)) {
            return null;
        }
        combinator = current;
        members.push(compound.join(""));
    }
    return prefix.join("") + combinator + ":is(" + members.join(",") + ")";
}
/**
 * Apply minification rules to the ast tree
 * @param arena
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 * @param context
 *
 * @private
 */
function doMinify(arena, ast, options = {}, recursive = false, errors, nestingContent, context = {}) {
    if (!("nodes" in context)) {
        context.nodes = new Set();
    }
    if (context.nodes.has(ast)) {
        return ast;
    }
    context.nodes.add(ast);
    if (arena.flags[ast] & EnumAstNodeStatus.HasChildren && arena.firstChild[ast] !== 0) {
        const reducer = reduce.bind(ast);
        if (!nestingContent) {
            nestingContent = options.nestingRules && arena.dataTypes[ast] === EnumToken.RuleNodeType;
        }
        // the children list is modified while it is visited: every branch sets the next child to visit
        let cursor = arena.firstChild[ast];
        let previous = null;
        let node = null;
        let nodeType;
        let previousType;
        /**
         * the node located `count` positions before a child of ast (the end of the list when 0). null when out of range
         * @param child
         * @param count
         */
        const before = (child, count) => {
            let result = child === 0 ? arena.lastChild[ast] : arena.previousSibling[child];
            while (--count > 0 && result !== 0) {
                result = arena.previousSibling[result];
            }
            return result === 0 ? null : result;
        };
        while (cursor !== 0) {
            if (arena.dataTypes[cursor] === EnumToken.CommentNodeType) {
                cursor = arena.nextSibling[cursor];
                continue;
            }
            while (previous != null && arena.dataTypes[previous] === EnumToken.CommentNodeType) {
                previous = arena.previousSibling[previous] || null;
            }
            node = cursor;
            nodeType = arena.dataTypes[node];
            previousType = previous == null ? null : arena.dataTypes[previous];
            if (nodeType === EnumToken.AtRuleNodeType) {
                const nam = arena.resolveString(arena.name[node]);
                if (nam === "font-face") {
                    cursor = arena.nextSibling[node];
                    continue;
                }
                // there is no early return: the result that precedes the conditional rules is moved after them.
                // the conditional rules are never removed
                if (equalsIgnoreCase(nam, "function")) {
                    moveResult(arena, node);
                }
            }
            if (nodeType === EnumToken.KeyframesAtRuleNodeType) {
                if (previousType === EnumToken.KeyframesAtRuleNodeType &&
                    arena.name[node] === arena.name[previous] &&
                    arena.stringValue[node] === arena.stringValue[previous]) {
                    // the previous keyframes are dropped, the node is visited again
                    const previousNode = arena.previousSibling[previous];
                    cursor = arena.nextSibling[previous];
                    arena.detach(previous);
                    previous = previousNode || null;
                    continue;
                }
            }
            else if (nodeType === EnumToken.KeyframesRuleNodeType) {
                if (previousType === EnumToken.KeyframesRuleNodeType &&
                    arena.name[node] === arena.name[previous]) {
                    // do not merge keyframes
                    // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@keyframes#resolving_duplicates
                    arena.moveChildren(node, previous);
                    options.cache?.delete(previous);
                    arena.detach(node);
                    cursor = arena.nextSibling[previous];
                    continue;
                }
                let k = arena.firstChild[node];
                while (k !== 0) {
                    const next = arena.nextSibling[k];
                    if (arena.dataTypes[k] === EnumToken.DeclarationNodeType) {
                        let l = arena.lastToken[k];
                        while (l !== 0) {
                            if (arena.dataTypes[l] === EnumToken.ImportantTokenType) {
                                arena.detach(k);
                                break;
                            }
                            if (arena.dataTypes[l] === EnumToken.WhitespaceTokenType ||
                                arena.dataTypes[l] === EnumToken.CommentTokenType) {
                                l = arena.previousSibling[l];
                                continue;
                            }
                            break;
                        }
                    }
                    k = next;
                }
            }
            else if (nodeType === EnumToken.AtRuleNodeType) {
                const nam = arena.resolveString(arena.name[node]);
                const tokens = arena.firstToken[node] === 0 ? null : arena.tokens(node);
                const renderPrelude = (acc, curr, index, arr) => acc +
                    (arena.dataTypes[curr] === EnumToken.CommentTokenType ||
                        (arena.dataTypes[curr] === EnumToken.WhitespaceTokenType &&
                            // inlined: arena.typeOf(arr[index + 1])
                            arena.dataTypes[arr[index + 1]] === EnumToken.CommentTokenType &&
                            // inlined: arena.typeOf(arr[index + 2])
                            (index + 3 < arr.length || arena.dataTypes[arr[index + 2]] === EnumToken.WhitespaceTokenType))
                        ? ""
                        : renderValue(arena, curr));
                if (nam === "apply") {
                    // `@apply --mixin()` is equivalent to `@apply --mixin`
                    minifyApplyPrelude(arena, node);
                }
                else if (nam === "media") {
                    if (tokens != null) {
                        const slice = tokens.slice();
                        minifyAtRuleMedia(arena, slice);
                        if (slice.length !== tokens.length) {
                            arena.setTokenList(node, slice);
                            // inlined: arena.setValueString(node, slice.reduce(renderPrelude, ""))
                            arena.stringValue[node] = arena.internString(slice.reduce(renderPrelude, ""));
                        }
                    }
                    if (["all", ""].includes(arena.resolveString(arena.stringValue[node]))) {
                        // the node is replaced by its children
                        cursor = arena.firstChild[node] || arena.nextSibling[node];
                        arena.moveChildren(node, ast, node);
                        arena.detach(node);
                        continue;
                    }
                }
                else if (nam === "import" && tokens != null) {
                    let l = 0;
                    let token;
                    for (; l < tokens.length; l++) {
                        token = tokens[l];
                        if (arena.dataTypes[token] === EnumToken.ParensTokenType ||
                            arena.dataTypes[token] === EnumToken.MediaQueryConditionTokenType ||
                            (arena.dataTypes[token] === EnumToken.IdenTokenType &&
                                "layer" !== arena.resolveString(arena.stringValue[token]))) {
                            break;
                        }
                    }
                    if (l < tokens.length) {
                        const slice = tokens.slice(l);
                        tokens.splice(l, slice.length, ...minifyAtRuleMedia(arena, slice));
                        arena.setTokenList(node, tokens);
                        // inlined: arena.setValueString(node, trimArray(arena, tokens).reduce(renderPrelude, ""))
                        arena.stringValue[node] = arena.internString(trimArray(arena, tokens).reduce(renderPrelude, ""));
                    }
                }
                else if (arena.dataTypes[ast] === nodeType &&
                    arena.name[ast] === arena.name[node] &&
                    arena.stringValue[ast] === arena.stringValue[node]) {
                    // the node is replaced by its children
                    cursor = arena.firstChild[node] || arena.nextSibling[node];
                    arena.moveChildren(node, ast, node);
                    arena.detach(node);
                    continue;
                }
                if (previousType === EnumToken.AtRuleNodeType &&
                    nam !== "font-face" &&
                    arena.name[previous] === arena.name[node] &&
                    arena.stringValue[previous] === arena.stringValue[node]) {
                    if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                        arena.moveChildren(node, previous);
                        options.cache?.delete(previous);
                        if (!hasDeclaration(arena, previous)) {
                            context.nodes.delete(previous);
                            doMinify(arena, previous, options, recursive, errors, nestingContent, context);
                        }
                    }
                    cursor = arena.nextSibling[node];
                    arena.detach(node);
                    continue;
                }
                if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                    doMinify(arena, node, options, recursive, errors, nestingContent, context);
                }
                previous = node;
                cursor = arena.nextSibling[node];
                continue;
            }
            else if (nodeType === EnumToken.RuleNodeType) {
                // a single selector that does not end with a combinator is not reduced (see isSimpleSelector()): the
                // selector is not read
                if (!isSimpleSelector(arena, arena.name[node])) {
                    reduceRuleSelector(arena, node);
                }
                let wrapper = null;
                let match;
                if (options.nestingRules) {
                    // the rules that apply a mixin are not merged
                    if (previousType === EnumToken.RuleNodeType &&
                        !hasAtRuleStatement(arena, previous) &&
                        !hasAtRuleStatement(arena, node)) {
                        if (!isSimpleSelector(arena, arena.name[previous])) {
                            reduceRuleSelector(arena, previous);
                        }
                        // the selectors are split when their first parts are equal: they do not match otherwise
                        if (mayMatchSelectors(arena, previous, node)) {
                            match = matchSelectors(rawSelector(arena, previous), rawSelector(arena, node));
                            if (match != null) {
                                wrapper = wrapNodes(arena, previous, node, match, reducer);
                            }
                        }
                    }
                    if (wrapper != null) {
                        // wrap the following rules that match the wrapper selector
                        let nextNode = arena.nextSibling[wrapper];
                        while (nextNode !== 0 &&
                            arena.dataTypes[nextNode] === EnumToken.RuleNodeType &&
                            !hasAtRuleStatement(arena, nextNode)) {
                            if (!isSimpleSelector(arena, arena.name[nextNode])) {
                                reduceRuleSelector(arena, nextNode);
                            }
                            // the selector is split when its first part matches the wrapper selector
                            match = mayMatchSelectors(arena, wrapper, nextNode)
                                ? matchSelectors(rawSelector(arena, wrapper), rawSelector(arena, nextNode))
                                : null;
                            if (match == null) {
                                break;
                            }
                            wrapper = wrapNodes(arena, wrapper, nextNode, match, reducer);
                            nextNode = arena.nextSibling[wrapper];
                        }
                        previous = wrapper;
                        cursor = arena.nextSibling[wrapper];
                        doMinify(arena, wrapper, options, recursive, errors, nestingContent, context);
                        continue;
                    }
                    else if (arena.optimized.get(node) != null &&
                        arena.optimized.get(node).match &&
                        arena.optimized.get(node).selector.length > 1) {
                        const optimized = arena.optimized.get(node);
                        wrapper = arena.cloneNode(node);
                        arena.optimized.set(wrapper, arena.optimized.get(node));
                        // inlined: arena.setSelector(wrapper, optimized.optimized[0])
                        arena.name[wrapper] = arena.internString(optimized.optimized[0]);
                        arena.raw.set(wrapper, [[optimized.optimized[0]]]);
                        // inlined: arena.setTokens(wrapper)
                        arena.setTokenList(wrapper, []);
                        // inlined: arena.setSelector(node, optimized.selector.reduce(reducer, []).join(","))
                        arena.name[node] = arena.internString(optimized.selector.reduce(reducer, []).join(","));
                        arena.raw.set(node, optimized.selector.slice());
                        // inlined: arena.setTokens(node)
                        arena.setTokenList(node, []);
                        // the wrapper takes the place of the node
                        arena.insertBefore(node, wrapper);
                        arena.appendChild(wrapper, node);
                        node = wrapper;
                        nodeType = EnumToken.RuleNodeType;
                    }
                    else if (arena.optimized.get(node)?.reducible) {
                        const optimized = arena.optimized.get(node);
                        if (optimized.optimized.length === 1) {
                            const sel1 = optimized.optimized[0] +
                                ":is(" +
                                optimized.selector.reduce(reducer, []).join(",") +
                                ")";
                            const sel2 = optimized.selector.reduce((acc, curr) => (acc.length > 0 ? acc + "," : "") + optimized.optimized[0] + curr.join(""), "");
                            // inlined: arena.setSelector(node, sel1.length < sel2.length ? sel1 : sel2)
                            arena.name[node] = arena.internString(sel1.length < sel2.length ? sel1 : sel2);
                            // inlined: arena.setTokens(node)
                            arena.setTokenList(node, []);
                        }
                        else if (optimized.optimized.length === 0) {
                            const testIdent = /^[a-zA-Z]/;
                            // inlined: arena.setSelector(node, optimized.selector.reduce((acc: string, curr: string[]) => (acc.length > 0 ? acc + "," : "") + (nestingContent && testIdent.test(curr[0]) ? "& " : "") + curr.join(""), ""))
                            arena.name[node] = arena.internString(optimized.selector.reduce((acc, curr) => (acc.length > 0 ? acc + "," : "") +
                                (nestingContent && testIdent.test(curr[0]) ? "& " : "") +
                                curr.join(""), ""));
                            // inlined: arena.setTokens(node)
                            arena.setTokenList(node, []);
                        }
                    }
                }
                else if (arena.optimized.get(node)?.match) {
                    const sel = factorSelector(arena.optimized.get(node));
                    if (sel != null && sel.length < arena.resolveString(arena.name[node]).length) {
                        // inlined: arena.setSelector(node, sel)
                        arena.name[node] = arena.internString(sel);
                        // inlined: arena.setTokens(node)
                        arena.setTokenList(node, []);
                    }
                }
                else if (arena.optimized.get(node)?.reducible) {
                    const optimized = arena.optimized.get(node);
                    if (optimized.optimized.length === 1) {
                        const sel1 = optimized.optimized[0] + ":is(" + optimized.selector.reduce(reducer, []).join(",") + ")";
                        const sel2 = optimized.selector.reduce((acc, curr) => (acc.length > 0 ? acc + "," : "") + optimized.optimized[0] + curr.join(""), "");
                        // inlined: arena.setSelector(node, sel1.length < sel2.length ? sel1 : sel2)
                        arena.name[node] = arena.internString(sel1.length < sel2.length ? sel1 : sel2);
                        // inlined: arena.setTokens(node)
                        arena.setTokenList(node, []);
                    }
                    else if (optimized.optimized.length === 0) {
                        const testIdent = /^[a-zA-Z]/;
                        // inlined: arena.setSelector(node, optimized.selector.reduce((acc: string, curr: string[]) => (acc.length > 0 ? acc + "," : "") + (nestingContent && testIdent.test(curr[0]) ? "& " : "") + curr.join(""), ""))
                        arena.name[node] = arena.internString(optimized.selector.reduce((acc, curr) => (acc.length > 0 ? acc + "," : "") +
                            (nestingContent && testIdent.test(curr[0]) ? "& " : "") +
                            curr.join(""), ""));
                        // inlined: arena.setTokens(node)
                        arena.setTokenList(node, []);
                    }
                }
                else if (arena.optimized.get(node)?.optimized.length > 0) {
                    const optimized = arena.optimized.get(node);
                    const sel = optimized.optimized.join("");
                    if (sel.length < arena.resolveString(arena.name[node]).length) {
                        // inlined: arena.setSelector(node, sel)
                        arena.name[node] = arena.internString(sel);
                        arena.raw.set(node, [optimized.optimized.slice()]);
                        // inlined: arena.setTokens(node)
                        arena.setTokenList(node, []);
                    }
                }
                doMinify(arena, node, options, recursive, errors, nestingContent, context);
            }
            if (previous != null) {
                previousType = arena.dataTypes[previous];
                if (arena.flags[previous] & EnumAstNodeStatus.HasChildren &&
                    arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                    if (previousType === nodeType) {
                        let shouldMerge = true;
                        let k = arena.lastChild[previous];
                        while (k !== 0) {
                            if (arena.dataTypes[k] === EnumToken.CommentNodeType) {
                                k = arena.previousSibling[k];
                                continue;
                            }
                            shouldMerge = arena.dataTypes[k] === EnumToken.DeclarationNodeType;
                            break;
                        }
                        // the rules that apply a mixin are not merged
                        if (shouldMerge &&
                            (nodeType !== EnumToken.RuleNodeType ||
                                (!hasAtRuleStatement(arena, previous) && !hasAtRuleStatement(arena, node)))) {
                            if (((nodeType === EnumToken.RuleNodeType ||
                                nodeType === EnumToken.KeyframesRuleNodeType) &&
                                arena.name[node] === arena.name[previous]) ||
                                (nodeType === EnumToken.AtRuleNodeType &&
                                    arena.resolveString(arena.name[node]) !== "font-face" &&
                                    arena.name[node] === arena.name[previous])) {
                                arena.moveChildren(previous, node, arena.firstChild[node]);
                                options.cache?.delete(node);
                                doMinify(arena, node, options, recursive, errors, nestingContent, context);
                                arena.detach(previous);
                                previous = node;
                                cursor = arena.nextSibling[node];
                                continue;
                            }
                            else if (nodeType === previousType &&
                                [EnumToken.KeyframesRuleNodeType, EnumToken.RuleNodeType].includes(nodeType)) {
                                const intersect = diff(arena, previous, node, options, context);
                                if (intersect != null) {
                                    // [result, node2] take the place of node1 (previous), node1 takes the place of node2 (node)
                                    const { node1, node2, result } = intersect;
                                    const after = arena.nextSibling[node2];
                                    const keep2 = arena.firstChild[node2] !== 0;
                                    if (result != null) {
                                        arena.insertBefore(node1, result);
                                    }
                                    if (keep2) {
                                        arena.insertBefore(node1, node2);
                                    }
                                    else {
                                        arena.detach(node2);
                                    }
                                    if (arena.firstChild[node1] === 0) {
                                        arena.detach(node1);
                                    }
                                    else if (after === 0) {
                                        arena.appendChild(ast, node1);
                                    }
                                    else {
                                        arena.insertBefore(after, node1);
                                    }
                                    // next node to visit
                                    node = keep2
                                        ? arena.nextSibling[result ?? node2] || null
                                        : before(arena.parents[node1] === ast ? node1 : after, result == null ? 1 : 2);
                                    previous = result;
                                }
                            }
                        }
                    }
                    if (recursive && previous != null && previous !== node) {
                        if (!hasDeclaration(arena, previous)) {
                            doMinify(arena, previous, options, recursive, errors, nestingContent, context);
                        }
                    }
                }
            }
            if (!nestingContent &&
                previous != null &&
                arena.dataTypes[previous] === EnumToken.RuleNodeType &&
                arena.stringIndexOf(arena.name[previous], 0x26) !== -1) {
                fixSelector(arena, previous);
            }
            previous = node;
            cursor = node == null ? arena.firstChild[ast] : arena.nextSibling[node];
        }
        if (recursive && node != null && arena.flags[node] & EnumAstNodeStatus.HasChildren) {
            if (arena.dataTypes[node] === EnumToken.KeyframesAtRuleNodeType || !hasDeclarationChild(arena, node)) {
                if (!(arena.dataTypes[node] === EnumToken.AtRuleNodeType &&
                    arena.resolveString(arena.name[node]) !== "font-face")) {
                    doMinify(arena, node, options, recursive, errors, nestingContent, context);
                }
            }
        }
        if (!nestingContent &&
            node != null &&
            arena.dataTypes[node] === EnumToken.RuleNodeType &&
            arena.stringIndexOf(arena.name[node], 0x26) !== -1) {
            fixSelector(arena, node);
        }
    }
    return ast;
}
/**
 * Check if the first non comment child is a declaration
 * @param arena
 * @param node
 *
 * @private
 */
function hasDeclaration(arena, node) {
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (arena.dataTypes[child] === EnumToken.CommentNodeType) {
            continue;
        }
        return arena.dataTypes[child] === EnumToken.DeclarationNodeType;
    }
    return true;
}
/**
 * Check if the node has a declaration child
 * @param arena
 * @param node
 *
 * @private
 */
function hasDeclarationChild(arena, node) {
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (arena.dataTypes[child] === EnumToken.DeclarationNodeType) {
            return true;
        }
    }
    return false;
}
/**
 * Optimize selector
 * @param selector
 *
 * @private
 */
function optimizeSelector(selector) {
    if (selector.length === 0) {
        return null;
    }
    if (selector.length === 1) {
        const current = selector[0];
        const last = current.at(-1);
        if (last == null || !last.startsWith(":is(")) {
            let end = current.length;
            while (end > 0 && (current[end - 1] === " " || combinators.includes(current[end - 1]))) {
                end--;
            }
            const optimized = current.slice(0, end);
            if (optimized[0] === "&" && optimized[1] === " ") {
                optimized.splice(0, 2);
            }
            const remainder = current.slice(end);
            return {
                match: false,
                optimized,
                selector: [remainder[0] === "&" && remainder[1] === " " ? remainder.slice(2) : remainder],
                reducible: false,
            };
        }
    }
    const map = new Set();
    selector = selector
        .reduce((acc, curr) => {
        // @ts-ignore
        if (curr.length > 0 && curr.at(-1).startsWith(":is(")) {
            // @ts-ignore
            const rules = splitRule(curr.at(-1).slice(4, -1)).map((x) => {
                if (x[0] === "&" && x.length > 1) {
                    return x.slice(x[1] === " " ? 2 : 1);
                }
                return x;
            });
            const part = curr.slice(0, -1);
            for (const rule of rules) {
                acc.push(part.concat(rule));
            }
            return acc;
        }
        acc.push(curr);
        return acc;
    }, [])
        .filter((x) => {
        const str = x.join("");
        if (map.has(str)) {
            return false;
        }
        map.add(str);
        return true;
    });
    const optimized = [];
    const k = selector.reduce((acc, curr) => acc === 0 ? curr.length : curr.length === 0 ? acc : Math.min(acc, curr.length), 0);
    let i = 0;
    let j;
    let match;
    for (; i < k; i++) {
        const item = selector[0][i];
        match = true;
        for (j = 1; j < selector.length; j++) {
            if (item !== selector[j][i]) {
                match = false;
                break;
            }
        }
        if (!match) {
            break;
        }
        optimized.push(item);
    }
    while (optimized.length > 0) {
        const last = optimized.at(-1);
        if (last === " " || combinators.includes(last)) {
            const all = new Array(Math.max(optimized.length - 1, 0));
            let write = 0;
            for (let read = 0; read < optimized.length - 1; read++) {
                all[write++] = optimized[read];
            }
            optimized.length = 0;
            for (let index = 0; index < write; index++) {
                optimized[index] = all[index];
            }
            continue;
        }
        break;
    }
    for (let i1 = 0; i1 < selector.length; i1++) {
        const all = new Array(Math.max(selector[i1].length - optimized.length, 0));
        let write = 0;
        for (let read = optimized.length; read < selector[i1].length; read++) {
            all[write++] = selector[i1][read];
        }
        selector[i1].length = 0;
        for (let index = 0; index < write; index++) {
            selector[i1][index] = all[index];
        }
    }
    let reducible = optimized.length === 1;
    if (optimized[0] === "&") {
        if (optimized[1] === " ") {
            const all = new Array(Math.max(optimized.length - 2, 0));
            let write = 0;
            for (let read = 2; read < optimized.length; read++) {
                all[write++] = optimized[read];
            }
            optimized.length = 0;
            for (let index = 0; index < write; index++) {
                optimized[index] = all[index];
            }
        }
    }
    if (optimized.length === 0 || optimized[0].charAt(0) === "&" || selector.length === 1) {
        return {
            match: false,
            optimized,
            selector: selector.map((selector) => selector[0] === "&" && selector[1] === " " ? selector.slice(2) : selector),
            reducible: selector.length > 1 && selector.every((selector) => !combinators.includes(selector[0])),
        };
    }
    return {
        match: true,
        optimized,
        selector: selector.reduce((acc, curr) => {
            let hasCompound = true;
            if (hasCompound && curr.length > 0) {
                hasCompound = !["&"].concat(combinators).includes(curr[0].charAt(0));
            }
            // @ts-ignore
            if (hasCompound && curr[0] === " ") {
                hasCompound = false;
                curr.unshift("&");
            }
            if (curr.length === 0) {
                curr.push("&");
                hasCompound = false;
            }
            if (reducible) {
                const chr = curr[0].charAt(0);
                // @ts-ignore
                reducible = chr === "." || chr === ":" || isIdentStart(chr.charCodeAt(0));
            }
            acc.push(hasCompound ? ["&"].concat(curr) : curr);
            return acc;
        }, []),
        reducible: selector.every((selector) => ![">", "+", "~", "&"].includes(selector[0])),
    };
}
/**
 * Split selector string
 * @param buffer
 *
 * @internal
 */
function splitRule(buffer) {
    const result = [[]];
    const length = buffer.length;
    let group = result[0];
    // the start of the current part, -1 when it is empty: a part is a contiguous range of the buffer
    let start = -1;
    let code;
    for (let i = 0; i < length; i++) {
        code = buffer.charCodeAt(i);
        if (isWhiteSpace(code)) {
            if (start !== -1) {
                group.push(buffer.slice(start, i));
                start = -1;
            }
            if (group.length > 0) {
                group.push(" ");
            }
            continue;
        }
        // ,
        if (code === 0x2c) {
            if (start !== -1) {
                group.push(buffer.slice(start, i));
                start = -1;
            }
            group = [];
            result.push(group);
            continue;
        }
        // .
        if (code === 0x2e) {
            if (start !== -1) {
                group.push(buffer.slice(start, i));
            }
            start = i;
            continue;
        }
        // the combinators: + > ~ | ||
        if (code === 0x2b || code === 0x3e || code === 0x7e || code === 0x7c) {
            if (start !== -1) {
                group.push(buffer.slice(start, i));
                start = -1;
            }
            if (code === 0x7c && buffer.charCodeAt(i + 1) === 0x7c) {
                group.push("||");
                i++;
            }
            else {
                group.push(code === 0x2b ? "+" : code === 0x3e ? ">" : code === 0x7e ? "~" : "|");
            }
            continue;
        }
        // : ::
        if (code === 0x3a) {
            if (start !== -1) {
                group.push(buffer.slice(start, i));
            }
            start = i;
            if (buffer.charCodeAt(i + 1) === 0x3a) {
                i++;
            }
            continue;
        }
        if (start === -1) {
            start = i;
        }
        // \: the escaped character
        if (code === 0x5c) {
            i++;
            continue;
        }
        // ( [: the part ends with the matching ) ]
        if (code === 0x28 || code === 0x5b) {
            const close = code === 0x28 ? 0x29 : 0x5d;
            let depth = 1;
            let k = i;
            let c;
            while (++k < length) {
                c = buffer.charCodeAt(k);
                if (c === 0x5c) {
                    k++;
                    continue;
                }
                if (c === code) {
                    depth++;
                }
                else if (c === close) {
                    depth--;
                }
                if (depth === 0) {
                    break;
                }
            }
            i = k;
        }
    }
    if (start !== -1) {
        group.push(buffer.slice(start, length));
    }
    return result;
}
/**
 * Reduce selector
 * @param acc
 * @param curr
 *
 * @private
 */
function reduceSelector(acc, curr) {
    let hasCompoundSelector = true;
    // @ts-ignore
    curr = curr.slice(this.match[0].length);
    while (curr.length > 0) {
        if (curr[0] === " ") {
            hasCompoundSelector = false;
            curr.unshift("&");
            continue;
        }
        break;
    }
    if (hasCompoundSelector && curr.length > 0) {
        hasCompoundSelector = !["&"].concat(combinators).includes(curr[0].charAt(0));
    }
    if (curr[0] === ":is(") {
        let canReduce = true;
        const isCompound = curr.reduce((acc, token, index) => {
            if (index === 0) {
                canReduce = curr[1] === "&";
            }
            else if (token === ")") ;
            else if (token === ",") {
                if (!canReduce) {
                    canReduce = curr[index + 1] === "&";
                }
                acc.push([]);
            }
            else
                acc.at(-1)?.push(token);
            return acc;
        }, [[]]);
        if (canReduce) {
            curr = isCompound.reduce((acc, curr) => {
                if (acc.length > 0) {
                    acc.push(",");
                }
                for (const c of curr) {
                    acc.push(c);
                }
                return acc;
            }, []);
        }
    }
    acc.push(
    // @ts-ignore
    this.match.length == 0
        ? ["&"]
        : hasCompoundSelector && curr[0] !== "&" && (curr.length === 0 || !combinators.includes(curr[0].charAt(0)))
            ? ["&"].concat(curr)
            : curr);
    return acc;
}
/**
 * Match selectors
 * @param selector1
 * @param selector2
 *
 * @private
 */
function matchSelectors(selector1, selector2) {
    let match = [[]];
    const j = Math.min(selector1.reduce((acc, curr) => Math.min(acc, curr.length), selector1.length > 0 ? selector1[0].length : 0), selector2.reduce((acc, curr) => Math.min(acc, curr.length), selector2.length > 0 ? selector2[0].length : 0));
    let i = 0;
    let k;
    let l;
    let token;
    let matching = true;
    let matchFunction = 0;
    let inAttr = 0;
    const regEx = /^:is\(([:.][^\s,]+)\)$/;
    for (const _1 of selector1) {
        if (_1[0] !== "&") {
            continue;
        }
        for (let i = 1; i < _1.length; i++) {
            const token = _1[i];
            if (token.startsWith(":is(")) {
                const match = regEx.exec(token);
                if (match != null) {
                    _1[i] = match[1];
                }
            }
        }
    }
    for (const _1 of selector2) {
        if (_1[0] !== "&") {
            continue;
        }
        for (let i = 1; i < _1.length; i++) {
            const token = _1[i];
            if (token.startsWith(":is(")) {
                const match = regEx.exec(token);
                if (match != null) {
                    _1[i] = match[1];
                }
            }
        }
    }
    for (; i < j; i++) {
        k = 0;
        token = selector1[0][i];
        for (; k < selector1.length; k++) {
            if (selector1[k][i] !== token) {
                matching = false;
                break;
            }
        }
        if (matching) {
            l = 0;
            for (; l < selector2.length; l++) {
                if (selector2[l][i] !== token) {
                    matching = false;
                    break;
                }
            }
        }
        if (!matching) {
            break;
        }
        if (token.endsWith("(")) {
            matchFunction++;
        }
        match.at(-1).push(token);
    }
    // invalid function
    if (matchFunction !== 0 || inAttr !== 0) {
        return null;
    }
    for (const part of match) {
        while (part.length > 0) {
            const token = part.at(-1);
            if (token === " " || combinators.includes(token) || notEndingWith.includes(token.at(-1))) {
                part.pop();
                continue;
            }
            break;
        }
    }
    if (match.every((t) => t.length === 0)) {
        return null;
    }
    if (eq([["&"]], match)) {
        return null;
    }
    const reducer = reduceSelector.bind({ match });
    // @ts-ignore
    selector1 = selector1.reduce(reducer, []);
    // @ts-ignore
    selector2 = selector2.reduce(reducer, []);
    return selector1 == null || selector2 == null
        ? null
        : {
            eq: eq(selector1, selector2),
            match,
            selector1,
            selector2,
        };
}
/**
 * Fix selector
 * @param arena
 * @param node
 *
 * @private
 */
function fixSelector(arena, node) {
    const sel = arena.resolveString(arena.name[node]);
    if (sel.includes("&")) {
        const attributes = parseString(arena, sel);
        // inlined: arena.walkValues(attributes)
        for (const attr of new ValueWalker(arena, attributes)) {
            if (arena.dataTypes[attr] === EnumToken.PseudoClassFuncTokenType &&
                arena.resolveString(arena.stringValue[attr]) === ":is") {
                let child = arena.lastToken[attr];
                while (child !== 0) {
                    const previous = arena.previousSibling[child];
                    if (arena.dataTypes[child] === EnumToken.NestingSelectorTokenType) {
                        arena.detach(child);
                    }
                    child = previous;
                }
            }
        }
        // inlined: arena.setSelector(node, attributes.reduce((acc: string, curr: Token) => acc + renderValue(arena, curr), ""))
        arena.name[node] = arena.internString(attributes.reduce((acc, curr) => acc + renderValue(arena, curr), ""));
        // inlined: arena.setTokens(node)
        arena.setTokenList(node, []);
    }
}
/**
 * Wrap two sibling rules into a new rule. the wrapper takes the place of node, previous is removed
 * @param arena
 * @param previous
 * @param node
 * @param match
 * @param reducer
 *
 * @private
 */
function wrapNodes(arena, previous, node, match, reducer) {
    // @ts-ignore
    let pSel = match.selector1.reduce(reducer, []).join(",");
    // @ts-ignore
    let nSel = match.selector2.reduce(reducer, []).join(",");
    const wrapper = arena.cloneNode(previous);
    // inlined: arena.setSelector(wrapper, match.match.reduce(reducer, []).join(","))
    // @ts-ignore
    arena.name[wrapper] = arena.internString(match.match.reduce(reducer, []).join(","));
    arena.raw.set(wrapper, match.match.map((t) => t.slice()));
    // not copied by cloneNode()
    if (arena.optimized.get(wrapper) != null) {
        arena.optimized.set(wrapper, null);
    }
    // inlined: arena.setTokens(wrapper)
    arena.setTokenList(wrapper, []);
    const parent = arena.parents[node];
    // the wrapper takes the place of node
    arena.insertBefore(node, wrapper);
    if (pSel === "&" || pSel === "") {
        arena.moveChildren(previous, wrapper);
        if (nSel === "&" || nSel === "") {
            arena.moveChildren(node, wrapper);
        }
        else {
            arena.appendChild(wrapper, node);
        }
    }
    else {
        arena.appendChild(wrapper, previous);
        arena.appendChild(wrapper, node);
    }
    // the nodes whose children were moved into the wrapper are dropped
    if (arena.parents[previous] === parent) {
        arena.detach(previous);
    }
    if (arena.parents[node] === parent) {
        arena.detach(node);
    }
    // update the selectors of the wrapped nodes
    if (arena.parents[previous] === wrapper) {
        // inlined: arena.setSelector(previous, pSel)
        arena.name[previous] = arena.internString(pSel);
        arena.raw.set(previous, match.selector1);
        // inlined: arena.setTokens(previous)
        arena.setTokenList(previous, []);
    }
    if (arena.parents[node] === wrapper) {
        // inlined: arena.setSelector(node, nSel)
        arena.name[node] = arena.internString(nSel);
        arena.raw.set(node, match.selector2);
        // inlined: arena.setTokens(node)
        arena.setTokenList(node, []);
    }
    reduceRuleSelector(arena, wrapper);
    // inlined: arena.setTokens(wrapper)
    arena.setTokenList(wrapper, []);
    return wrapper;
}
/**
 * true if a child of the node is an at-rule without a block or an `@apply` rule: `@apply --mixin;`,
 * `@apply --mixin { color: red }`
 * @param arena
 * @param node
 */
function hasAtRuleStatement(arena, node) {
    for (let child = arena.firstChild[node]; child !== 0; child = arena.nextSibling[child]) {
        if (arena.dataTypes[child] === EnumToken.AtRuleNodeType &&
            (!(arena.flags[child] & EnumAstNodeStatus.HasChildren) || arena.stringEquals(arena.name[child], "apply"))) {
            return true;
        }
    }
    return false;
}
/**
 * Diff nodes: move the declarations shared by both rules into a new rule
 * @param arena
 * @param n1
 * @param n2
 * @param options
 * @param context minification context
 *
 * @private
 */
function diff(arena, n1, n2, options, context) {
    // the declarations of a rule that applies a mixin are not moved: `@apply` inserts declarations at its position,
    // the declarations that follow it override them
    if (hasAtRuleStatement(arena, n1) || hasAtRuleStatement(arena, n2)) {
        return null;
    }
    if (!("cache" in options)) {
        options.cache = new Map();
    }
    let node1 = n1;
    let node2 = n2;
    let exchanged = false;
    if (arena.childCount(node1) > arena.childCount(node2)) {
        const t = node1;
        node1 = node2;
        node2 = t;
        exchanged = true;
    }
    const raw1 = arena.raw.get(node1);
    const raw2 = arena.raw.get(node2);
    if (raw1 == null || raw2 == null) {
        // the selectors that are not split (see isSimpleSelector()): the vendor prefixes of the pseudo classes are
        // read from the code units of the selectors
        const prefixes1 = raw1 == null ? selectorPrefixes(arena, arena.name[node1]) : rawSelectorPrefixes(raw1);
        const prefixes2 = raw2 == null ? selectorPrefixes(arena, arena.name[node2]) : rawSelectorPrefixes(raw2);
        if (prefixes1.size !== prefixes2.size) {
            return null;
        }
        for (const prefix of prefixes1) {
            if (!prefixes2.has(prefix)) {
                return null;
            }
        }
    }
    else {
        const prefixes1 = new Set();
        const prefixes2 = new Set();
        for (const token1 of raw1) {
            for (const t of token1) {
                if (t.includes(":")) {
                    const matches = t.match(/::?-([a-z]+)-/);
                    if (matches == null) {
                        continue;
                    }
                    prefixes1.add(matches[1]);
                    if (prefixes1.size > 1) {
                        break;
                    }
                }
            }
            if (prefixes1.size > 1) {
                break;
            }
        }
        for (const token2 of raw2) {
            for (const t of token2) {
                if (t.includes(":")) {
                    const matches = t.match(/::?-([a-z]+)-/);
                    if (matches == null) {
                        continue;
                    }
                    prefixes2.add(matches[1]);
                    if (prefixes2.size > 1) {
                        break;
                    }
                }
            }
            if (prefixes2.size > 1) {
                break;
            }
        }
        if (prefixes1.size !== prefixes2.size) {
            return null;
        }
        for (const prefix of prefixes1) {
            if (!prefixes2.has(prefix)) {
                return null;
            }
        }
    }
    // match the declarations of both rules, from the last to the first
    let matches = 0;
    for (let child1 = arena.lastChild[node1]; child1 !== 0; child1 = arena.previousSibling[child1]) {
        if (arena.dataTypes[child1] === EnumToken.CommentNodeType) {
            continue;
        }
        for (let child2 = arena.lastChild[node2]; child2 !== 0; child2 = arena.previousSibling[child2]) {
            if (arena.dataTypes[child2] === EnumToken.CommentNodeType ||
                arena.flags[child2] & EnumAstNodeStatus.Matched) {
                continue;
            }
            if (arena.name[child1] === arena.name[child2] && eqNode(arena, child1, child2)) {
                arena.flags[child1] |= EnumAstNodeStatus.Matched;
                arena.flags[child2] |= EnumAstNodeStatus.Matched;
                matches++;
                break;
            }
        }
    }
    if (matches === 0 && (arena.firstChild[node1] !== 0 || arena.firstChild[node2] !== 0)) {
        return null;
    }
    // the rules are rendered with the same options during the minification: the options are resolved once and
    // identical values are rendered once
    const renderer = (context.renderer ??= new NodeRenderer(options));
    const renderedSize = (node, cache) => {
        let size = cache ? options.cache.get(node) : undefined;
        if (size === undefined) {
            size = renderer.size(arena, node);
            if (cache) {
                options.cache.set(node, size);
            }
        }
        return arena.firstChild[node] === 0 ? 0 : size;
    };
    // size of the original nodes
    const size = renderedSize(n1, true) + renderedSize(n2, true);
    // the shared declarations are moved into the result node
    const result = arena.cloneNode(node1);
    // the distinct selectors of both rules: built from the code units of the selectors when they are normalized
    let merged = mergeSelectors(arena, arena.name[node1], arena.name[node2]);
    if (merged === -1) {
        // inlined: arena.setSelector(result, [ ...new Set(splitRule(arena.resolveString(arena.name[node1])) .concat(splitRule(arena.resolveString(arena.name[node2]))) .map((s) => s.join(""))), ].join(","))
        merged = arena.internString([
            ...new Set(splitRule(arena.resolveString(arena.name[node1]))
                .concat(splitRule(arena.resolveString(arena.name[node2])))
                .map((s) => s.join(""))),
        ].join(","));
    }
    arena.name[result] = merged;
    // the matched declarations of node1 are moved into the result, the duplicates in node2 are dropped.
    // the moves are recorded (node, parent, next sibling) to be undone when the result is not smaller
    const moves = [];
    const moveMatched = (parent, target) => {
        let child = arena.firstChild[parent];
        while (child !== 0) {
            const next = arena.nextSibling[child];
            if (arena.flags[child] & EnumAstNodeStatus.Matched) {
                arena.flags[child] &= ~EnumAstNodeStatus.Matched;
                moves.push(child, parent, next);
                if (target == null) {
                    arena.detach(child);
                }
                else {
                    arena.appendChild(target, child);
                }
            }
            child = next;
        }
    };
    moveMatched(node1, result);
    moveMatched(node2, null);
    arena.insertBefore(n1, result);
    options.cache.delete(node1);
    options.cache.delete(node2);
    // the merge is kept when the output is smaller, or when it has the same size and removes a rule (an emptied rule is
    // removed, its size is 0). the other rule keeps its selector, which is repeated in the merged selector: the merge of
    // `html{margin:0}` and `body,div,...{margin:0;font:inherit}` is larger than the rules
    const mergedSize = renderedSize(node1, false) + renderedSize(node2, false) + renderedSize(result, false);
    if (size < mergedSize ||
        (size === mergedSize && arena.firstChild[node1] !== 0 && arena.firstChild[node2] !== 0)) {
        // restore the nodes: undo the moves in reverse order
        for (let k = moves.length - 3; k >= 0; k -= 3) {
            if (moves[k + 2] === 0) {
                arena.appendChild(moves[k + 1], moves[k]);
            }
            else {
                arena.insertBefore(moves[k + 2], moves[k]);
            }
        }
        arena.detach(result);
        return null;
    }
    // inlined: arena.setTokens(result)
    arena.setTokenList(result, []);
    // the raw and optimized selectors are not copied by cloneNode()
    if (arena.raw.get(result) != null) {
        arena.raw.set(result, null);
    }
    if (arena.optimized.get(result) != null) {
        arena.optimized.set(result, null);
    }
    const optimized = optimizeSelector(splitRule(arena.resolveString(arena.name[result])));
    if (optimized?.match) {
        const sel = factorSelector(optimized);
        if (sel != null && sel.length < arena.resolveString(arena.name[result]).length) {
            // inlined: arena.setSelector(result, sel)
            arena.name[result] = arena.internString(sel);
            // inlined: arena.setTokens(result)
            arena.setTokenList(result, []);
        }
    }
    arena.detach(result);
    return { result, node1: exchanged ? node2 : node1, node2: exchanged ? node1 : node2 };
}
/**
 * compare two nodes
 * @param arena
 * @param a
 * @param b
 *
 * @private
 */
function eqNode(arena, a, b) {
    if (a === b) {
        return true;
    }
    if (arena.dataTypes[a] !== arena.dataTypes[b] ||
        arena.name[a] !== arena.name[b] ||
        arena.stringValue[a] !== arena.stringValue[b]) {
        return false;
    }
    if (arena.flags[a] & EnumAstNodeStatus.HasValues) {
        let token1 = arena.firstToken[a];
        let token2 = arena.firstToken[b];
        while (token1 !== 0 && token2 !== 0) {
            if (!eqToken(arena, token1, token2)) {
                return false;
            }
            token1 = arena.nextSibling[token1];
            token2 = arena.nextSibling[token2];
        }
        if (token1 !== token2) {
            return false;
        }
    }
    if (arena.flags[a] & EnumAstNodeStatus.HasChildren) {
        let child1 = arena.firstChild[a];
        let child2 = arena.firstChild[b];
        while (child1 !== 0 && child2 !== 0) {
            if (!eqNode(arena, child1, child2)) {
                return false;
            }
            child1 = arena.nextSibling[child1];
            child2 = arena.nextSibling[child2];
        }
        return child1 === child2;
    }
    return true;
}
/**
 * builder of the merged selectors, see {@link mergeSelectors}
 */
const mergedSelectors = new StringBuilder();
/**
 * start and end of the selectors read by {@link selectorRanges}, in {@link mergedSelectors}
 */
let selectorBounds = new Int32Array(64);
/**
 * append the comma separated selectors of a selector string to {@link mergedSelectors} and record their bounds. the
 * selectors are the selectors of splitRule() joined: false when the selector string is not normalized (whitespace
 * other than a single space between two parts, a space after a comma)
 * @param arena
 * @param id selector string id
 * @param count number of selectors recorded
 * @returns the number of selectors recorded, -1 when the selector string is not normalized
 */
function selectorRanges(arena, id, count) {
    const length = arena.stringLength(id);
    const offset = mergedSelectors.length;
    arena.appendString(mergedSelectors, id);
    const codes = mergedSelectors.codes;
    let start = offset;
    const add = (end) => {
        if ((count + 1) * 2 > selectorBounds.length) {
            const bounds = new Int32Array(selectorBounds.length * 2);
            bounds.set(selectorBounds);
            selectorBounds = bounds;
        }
        selectorBounds[count * 2] = start;
        selectorBounds[count * 2 + 1] = end;
        count++;
    };
    for (let i = offset; i < offset + length; i++) {
        const code = codes[i];
        if (isWhiteSpace(code)) {
            // a single space between two parts
            if (code !== 0x20 || i === start || isWhiteSpace(codes[i - 1])) {
                return -1;
            }
            continue;
        }
        if (code === 0x2c) {
            add(i);
            start = i + 1;
            continue;
        }
        if (code === 0x5c) {
            i++;
            continue;
        }
        // ( [: the part ends with the matching ) ]
        if (code === 0x28 || code === 0x5b) {
            const close = code === 0x28 ? 0x29 : 0x5d;
            let depth = 1;
            let k = i;
            let c;
            while (++k < offset + length) {
                c = codes[k];
                if (c === 0x5c) {
                    k++;
                    continue;
                }
                if (c === code) {
                    depth++;
                }
                else if (c === close) {
                    depth--;
                }
                if (depth === 0) {
                    break;
                }
            }
            i = k;
        }
    }
    add(offset + length);
    return count;
}
/**
 * the distinct selectors of two selector strings, comma separated, like
 * `[...new Set(splitRule(sel1).concat(splitRule(sel2)).map((s) => s.join("")))].join(",")`. the selectors are read
 * from the string table and the result is interned: no string is created
 * @param arena
 * @param id1
 * @param id2
 * @returns the string id, -1 when a selector string is not normalized (see {@link selectorRanges})
 */
function mergeSelectors(arena, id1, id2) {
    mergedSelectors.reset();
    let count = selectorRanges(arena, id1, 0);
    if (count === -1 || (count = selectorRanges(arena, id2, count)) === -1) {
        return -1;
    }
    const codes = mergedSelectors.codes;
    const end = mergedSelectors.length;
    // the result is built after the selectors
    for (let i = 0, written = 0; i < count; i++) {
        const start1 = selectorBounds[i * 2];
        const end1 = selectorBounds[i * 2 + 1];
        let duplicate = false;
        for (let k = 0; k < i && !duplicate; k++) {
            const start2 = selectorBounds[k * 2];
            const end2 = selectorBounds[k * 2 + 1];
            if (end2 - start2 === end1 - start1) {
                let j = 0;
                while (j < end1 - start1 && codes[start1 + j] === codes[start2 + j]) {
                    j++;
                }
                duplicate = j === end1 - start1;
            }
        }
        if (duplicate) {
            continue;
        }
        if (written++ > 0) {
            mergedSelectors.appendCode(0x2c);
        }
        for (let j = start1; j < end1; j++) {
            // the builder may have been reallocated
            mergedSelectors.appendCode(mergedSelectors.codes[j]);
        }
    }
    // intern the result only
    const result = mergedSelectors.codes;
    return arena.internRange(result, end, mergedSelectors.length, -1 /* StringSource.Pool */);
}
/**
 * the split selector of a rule (see splitRule()): computed when it is not cached
 * @param arena
 * @param node
 */
function rawSelector(arena, node) {
    let raw = arena.raw.get(node);
    if (raw == null) {
        raw = splitRule(arena.resolveString(arena.name[node]));
        arena.raw.set(node, raw);
    }
    return raw;
}
/**
 * start and end of the first part of a selector (see splitRule()): the leading whitespace is
 * skipped. the end is -1 when the first selector is empty
 * @param arena
 * @param id selector string id
 * @param part
 */
function firstPartRange(arena, id, part) {
    // the code units are read until the end of the first part: the selector is not copied
    const length = arena.stringLength(id);
    let start = -1;
    let i = 0;
    part.end = -1;
    while (i < length && isWhiteSpace(arena.stringCodeAt(id, i))) {
        i++;
    }
    part.start = i;
    for (; i < length; i++) {
        const code = arena.stringCodeAt(id, i);
        if (isWhiteSpace(code)) {
            part.end = i;
            return;
        }
        // ,
        if (code === 0x2c) {
            part.end = start === -1 ? -1 : i;
            return;
        }
        // . :
        if (code === 0x2e || code === 0x3a) {
            if (start !== -1) {
                part.end = i;
                return;
            }
            start = i;
            if (code === 0x3a && arena.stringCodeAt(id, i + 1) === 0x3a) {
                i++;
            }
            continue;
        }
        // the combinators: a part
        if (code === 0x2b || code === 0x3e || code === 0x7e || code === 0x7c) {
            part.end = start !== -1 ? i : code === 0x7c && arena.stringCodeAt(id, i + 1) === 0x7c ? i + 2 : i + 1;
            return;
        }
        if (start === -1) {
            start = i;
        }
        // \: the escaped character
        if (code === 0x5c) {
            i++;
            continue;
        }
        // ( [: the part ends with the matching ) ]
        if (code === 0x28 || code === 0x5b) {
            const close = code === 0x28 ? 0x29 : 0x5d;
            let depth = 1;
            let k = i;
            let c;
            while (++k < length) {
                c = arena.stringCodeAt(id, k);
                if (c === 0x5c) {
                    k++;
                    continue;
                }
                if (c === code) {
                    depth++;
                }
                else if (c === close) {
                    depth--;
                }
                if (depth === 0) {
                    break;
                }
            }
            i = k;
        }
    }
    part.end = start === -1 ? -1 : Math.min(i, length);
}
const firstPart1 = { str: null, start: 0, end: 0 };
const firstPart2 = { str: null, start: 0, end: 0 };
/**
 * the first part of the first selector of a rule. false when the first selector is empty
 * @param arena
 * @param node
 * @param part
 */
function firstPart(arena, node, part) {
    const raw = arena.raw.get(node);
    if (raw != null) {
        // the split selector: the first part is a string
        part.str = raw.length > 0 && raw[0].length > 0 ? raw[0][0] : null;
        return part.str != null;
    }
    part.str = null;
    firstPartRange(arena, arena.name[node], part);
    return part.end !== -1;
}
/**
 * false when the selectors of two rules cannot match (see matchSelectors()): the first parts of their first selectors
 * are different. the selectors that are not split are read from the string table: they are not split
 * @param arena
 * @param node1
 * @param node2
 */
function mayMatchSelectors(arena, node1, node2) {
    if (!firstPart(arena, node1, firstPart1) || !firstPart(arena, node2, firstPart2)) {
        return false;
    }
    const id1 = arena.name[node1];
    const id2 = arena.name[node2];
    const str1 = firstPart1.str;
    const str2 = firstPart2.str;
    const length1 = str1 != null ? str1.length : firstPart1.end - firstPart1.start;
    const length2 = str2 != null ? str2.length : firstPart2.end - firstPart2.start;
    if (length1 !== length2) {
        return false;
    }
    for (let i = 0; i < length1; i++) {
        const code1 = str1 != null ? str1.charCodeAt(i) : arena.stringCodeAt(id1, firstPart1.start + i);
        const code2 = str2 != null ? str2.charCodeAt(i) : arena.stringCodeAt(id2, firstPart2.start + i);
        if (code1 !== code2) {
            return false;
        }
    }
    return true;
}
/**
 * code units of the selector read by {@link selectorPrefixes}
 */
let selectorCodes = new Uint16Array(256);
/**
 * copy the code units of a selector to {@link selectorCodes}
 * @param arena
 * @param id
 * @returns the number of code units
 */
function readSelector(arena, id) {
    const length = arena.stringLength(id);
    if (selectorCodes.length < length) {
        selectorCodes = new Uint16Array(length * 2);
    }
    return arena.copyString(id, selectorCodes, 0);
}
/**
 * true if a rule selector is not modified by {@link reduceRuleSelector}: a single selector (no comma), that does not
 * start with `&`, does not end with `)` (`:is()`), a combinator or a whitespace, and has no whitespace other than single
 * spaces. the selector is read from the string table, the result is computed once per string id
 * @param arena
 * @param id selector string id
 */
function isSimpleSelector(arena, id) {
    selectorArena = arena;
    return arena.stringFlagId(id, 1 /* StringFlag.SimpleSelector */, computeSimpleSelector);
}
/**
 * the arena of the selector read by {@link computeSimpleSelector} and {@link hasVendorPrefix}: the functions passed to
 * the string table are not closures (no allocation per call)
 */
let selectorArena = null;
/**
 * see {@link isSimpleSelector}
 * @param id selector string id
 */
function computeSimpleSelector(id) {
    {
        const length = readSelector(selectorArena, id);
        const codes = selectorCodes;
        if (length === 0 || codes[0] === 0x26) {
            return false;
        }
        let previous = 0;
        for (let i = 0; i < length; i++) {
            const code = codes[i];
            if (code === 0x2c) {
                return false;
            }
            if (isWhiteSpace(code)) {
                // a single space between two parts
                if (code !== 0x20 || i === 0 || isWhiteSpace(previous)) {
                    return false;
                }
            }
            previous = code;
        }
        // ) + > ~ | and the whitespace
        return !(previous === 0x29 ||
            previous === 0x2b ||
            previous === 0x3e ||
            previous === 0x7e ||
            previous === 0x7c ||
            isWhiteSpace(previous));
    }
}
/**
 * the first vendor prefix of a part of a selector: `::?-([a-z]+)-`, null when there is none
 * @param codes
 * @param start
 * @param end
 */
function partPrefix(codes, start, end) {
    for (let p = start; p < end; p++) {
        if (codes[p] !== 0x3a) {
            continue;
        }
        let q = p + 1;
        if (q < end && codes[q] === 0x3a) {
            q++;
        }
        if (q >= end || codes[q] !== 0x2d) {
            continue;
        }
        let k = q + 1;
        while (k < end && codes[k] >= 0x61 && codes[k] <= 0x7a) {
            k++;
        }
        if (k > q + 1 && k < end && codes[k] === 0x2d) {
            return String.fromCharCode.apply(null, codes.subarray(q + 1, k));
        }
    }
    return null;
}
/**
 * no vendor prefix. read only
 */
const emptyPrefixes = new Set();
/**
 * true if a selector contains `:-` (`::?-([a-z]+)-` matches `:-`)
 * @param id
 */
function hasVendorPrefix(id) {
    const length = readSelector(selectorArena, id);
    for (let i = 0; i + 1 < length; i++) {
        if (selectorCodes[i] === 0x3a && selectorCodes[i + 1] === 0x2d) {
            return true;
        }
    }
    return false;
}
/**
 * the vendor prefixes of the pseudo classes of a selector, like the prefixes read from the parts of the split selector
 * in diff(): the parts are the parts of splitRule(), the first prefix of each part that contains `:`. the selector is
 * read from the string table, it is not split into strings
 * @param arena
 * @param id selector string id
 */
function selectorPrefixes(arena, id) {
    // the selectors without `:-` are skipped: computed once per string id
    selectorArena = arena;
    if (!arena.stringFlagId(id, 2 /* StringFlag.VendorPrefix */, hasVendorPrefix)) {
        return emptyPrefixes;
    }
    const prefixes = new Set();
    const length = readSelector(arena, id);
    const codes = selectorCodes;
    // the part boundaries of splitRule()
    let start = -1;
    let code;
    const addPart = (end) => {
        for (let k = start; k < end; k++) {
            if (codes[k] === 0x3a) {
                const prefix = partPrefix(codes, start, end);
                if (prefix != null) {
                    prefixes.add(prefix);
                }
                break;
            }
        }
        return prefixes.size > 1;
    };
    for (let i = 0; i < length; i++) {
        code = codes[i];
        if (isWhiteSpace(code) || code === 0x2c) {
            if (start !== -1 && addPart(i)) {
                return prefixes;
            }
            start = -1;
            continue;
        }
        if (code === 0x2e || code === 0x3a) {
            if (start !== -1 && addPart(i)) {
                return prefixes;
            }
            start = i;
            if (code === 0x3a && codes[i + 1] === 0x3a) {
                i++;
            }
            continue;
        }
        if (code === 0x2b || code === 0x3e || code === 0x7e || code === 0x7c) {
            if (start !== -1 && addPart(i)) {
                return prefixes;
            }
            start = -1;
            if (code === 0x7c && codes[i + 1] === 0x7c) {
                i++;
            }
            continue;
        }
        if (start === -1) {
            start = i;
        }
        if (code === 0x5c) {
            i++;
            continue;
        }
        if (code === 0x28 || code === 0x5b) {
            const close = code === 0x28 ? 0x29 : 0x5d;
            let depth = 1;
            let k = i;
            let c;
            while (++k < length) {
                c = codes[k];
                if (c === 0x5c) {
                    k++;
                    continue;
                }
                if (c === code) {
                    depth++;
                }
                else if (c === close) {
                    depth--;
                }
                if (depth === 0) {
                    break;
                }
            }
            i = k;
        }
    }
    if (start !== -1) {
        addPart(length);
    }
    return prefixes;
}
/**
 * the vendor prefixes of the pseudo classes of a split selector, see diff()
 * @param raw
 */
function rawSelectorPrefixes(raw) {
    const prefixes = new Set();
    for (const token of raw) {
        for (const t of token) {
            if (t.includes(":")) {
                const matches = t.match(/::?-([a-z]+)-/);
                if (matches == null) {
                    continue;
                }
                prefixes.add(matches[1]);
                if (prefixes.size > 1) {
                    break;
                }
            }
        }
        if (prefixes.size > 1) {
            break;
        }
    }
    return prefixes;
}
/**
 * Reduce rule selector
 * @param arena
 * @param node
 *
 * @private
 */
function reduceRuleSelector(arena, node) {
    if (arena.raw.get(node) == null) {
        arena.raw.set(node, splitRule(arena.resolveString(arena.name[node])));
    }
    const raw = arena.raw.get(node);
    const singleSelectorWithoutIs = raw.length === 1 && (raw[0].at(-1) == null || !raw[0].at(-1).startsWith(":is("));
    let optimized = optimizeSelector(singleSelectorWithoutIs
        ? raw
        : raw.map((curr) => curr.slice()));
    if (optimized != null) {
        arena.optimized.set(node, optimized);
    }
    if (optimized != null && optimized.match && optimized.reducible && optimized.selector.length > 1) {
        for (const selector of optimized.selector) {
            if (selector.length > 1 &&
                selector[0] === "&" &&
                (combinators.includes(selector[1]) || !/^[a-zA-Z:]/.test(selector[1]))) {
                const all = new Array(Math.max(selector.length - 1, 0));
                let write = 0;
                for (let read = 1; read < selector.length; read++) {
                    all[write++] = selector[read];
                }
                selector.length = 0;
                for (let index = 0; index < write; index++) {
                    selector[index] = all[index];
                }
            }
        }
        const unique = new Set();
        const reduced = optimized.selector.reduce((acc, curr) => {
            const sig = curr.join("");
            if (!unique.has(sig)) {
                if (acc.length > 0) {
                    acc.push(",");
                }
                unique.add(sig);
                for (const c of curr) {
                    acc.push(c);
                }
            }
            return acc;
        }, []);
        const raw = [
            [optimized.optimized[0], reduced.length === 1 ? reduced.join("") : ":is("].concat(reduced).concat(")"),
        ];
        const sel = raw[0].join("");
        if (sel.length < arena.resolveString(arena.name[node]).length) {
            // inlined: arena.setSelector(node, sel)
            arena.name[node] = arena.internString(sel);
            arena.raw.set(node, raw);
            // inlined: arena.setTokens(node)
            arena.setTokenList(node, []);
        }
    }
}

export { minify, optimizeSelector, splitRule };
