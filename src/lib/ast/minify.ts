import { eq, eqToken } from "../parser/utils/eq.ts";
import { NodeRenderer, renderValue } from "../printer/render.ts";
import * as allFeatures from "./features/index.ts";
import { walkValues } from "./walk.ts";
import type {
    AstNode,
    AstRule,
    ErrorDescription,
    MatchedSelector,
    MinifyFeature,
    MinifyFeatureOptions,
    OptimizedSelector,
    ParserOptions,
    RawSelectorTokens,
    RenderOptions,
    Token,
} from "../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "./types.ts";
import type { AstArena } from "./arena.ts";
import { isFunction, isIdent, isIdentStart, isWhiteSpace } from "../syntax/syntax.ts";
import { FeatureWalkMode } from "./features/type.ts";
import { trimArray } from "../validation/match.ts";
import { combinators } from "../syntax/constants.ts";
import { replaceNode } from "../parser/utils/token.ts";
import { parseString } from "../parser/parse.ts";
import { replaceCompound } from "./expand.ts";
import { equalsIgnoreCase } from "../parser/utils/text.ts";

const notEndingWith: string[] = ["(", "["].concat(combinators);
// @ts-ignore
const features: MinifyFeature[] = Object.values(allFeatures as Record<string, MinifyFeature>).sort(
    (a: MinifyFeature, b: MinifyFeature) => a.ordering - b.ordering,
) as MinifyFeature[];

/**
 * Apply minification rules to the ast tree
 * @param arena
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 *
 * @private
 */
export function minify(
    arena: AstArena,
    ast: AstNode,
    options: ParserOptions | MinifyFeatureOptions,
    recursive: boolean,
    errors?: ErrorDescription[],
    nestingContent?: boolean,
): AstNode;

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
export function minify(
    arena: AstArena,
    ast: AstNode,
    options: ParserOptions | MinifyFeatureOptions = {},
    recursive: boolean = false,
    errors?: ErrorDescription[],
    nestingContent?: boolean,
    context: {
        [key: string]: any;
    } = {},
): AstNode {
    let preprocess: boolean = false;
    let postprocess: boolean = false;

    let { sourcemap, module, ...options2 } = options as ParserOptions;

    if (!((options2 as MinifyFeatureOptions).features != null)) {
        options2 = {
            removeDuplicateDeclarations: true,
            computeShorthand: true,
            computeCalcExpression: true,
            removePrefix: false,
            features: [] as Function[],
            ...options2,
        } as MinifyFeatureOptions;

        for (const feature of features) {
            feature.register(options2);
        }

        options2.features!.sort((a: MinifyFeature, b: MinifyFeature): number => a.ordering - b.ordering);
    }

    for (const feature of options2!.features as MinifyFeature[]) {
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
    const runFeatures = (mode: FeatureWalkMode): void => {
        // breadth first traversal
        const queue: AstNode[] = [ast];
        let node: AstNode;
        let typ: EnumToken;
        let replacement: AstNode | AstNode[] | null;

        for (let k = 0; k < queue.length; k++) {
            node = queue[k];
            typ = arena.dataTypes[node];

            if (typ == EnumToken.CommentTokenType || typ == EnumToken.CDOCOMMTokenType) {
                continue;
            }

            replacement = node;

            for (const feature of options2.features as MinifyFeature[]) {
                if ((feature.processMode & mode) === 0 || (feature.accept != null && !feature.accept.has(typ))) {
                    continue;
                }

                if (Array.isArray(replacement)) {
                    break;
                }

                // the prelude tokens of the rules whose selector has been rewritten are not parsed again:
                // the features and the renderer use the selector / prelude string

                const result = feature.run(
                    arena,
                    replacement,
                    options2,
                    arena.parents[node] == 0 ? ast : arena.parents[node],
                    context,
                    mode,
                );

                if (result != null) {
                    replacement = result;
                }
            }

            if (
                replacement != null &&
                (!Array.isArray(replacement) || replacement.length > 0) &&
                replacement != node &&
                arena.parents[node] != 0
            ) {
                replaceNode(arena, node, replacement);
            }

            if (!Array.isArray(replacement) && arena.flags[replacement] & EnumAstNodeStatus.HasChildren) {
                for (let child = arena.firstChild[replacement]; child != 0; child = arena.nextSibling[child]) {
                    queue.push(child);
                }
            }
        }

        for (const feature of options2.features as MinifyFeature[]) {
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

function transformAtRuleMediaPrelude(arena: AstArena, values: Token[]) {
    return { hasUpdates: false, values: trimArray(arena, values) };
}

/**
 * Minify at-rule media
 * - remove redundant tokens
 * - generate range queries
 *
 * @private
 * @param tokens
 */
function minifyAtRuleMedia(arena: AstArena, tokens: Token[]): Token[] {
    let hasUpdates: boolean = false;

    const parts: Token[][] = [[]];

    for (const token of tokens) {
        if (arena.dataTypes[token] === EnumToken.CommaTokenType) {
            parts.push([]);
        } else {
            parts[parts.length - 1].push(token);
        }
    }

    const sections: Map<string, Token[]> = new Map();

    for (const values of parts) {
        if (sections.has("all")) {
            break;
        }

        const result = transformAtRuleMediaPrelude(arena, values);

        if (result.values.length === 0) {
            continue;
        }

        if (result.hasUpdates) {
            hasUpdates = true;
        }

        let key: string = "";

        for (const token of values) {
            key += renderValue(arena, token);
        }

        sections.set(key, result.values);
    }

    if (sections.has("all")) {
        tokens.length = 0;
    } else if (hasUpdates) {
        tokens.length = 0;
        let hasSection: boolean = false;

        for (const section of sections.values()) {
            if (hasSection) {
                tokens.push(arena.createToken(EnumToken.CommaTokenType));
            }

            for (const token of section) {
                tokens.push(token);
            }

            hasSection = true;
        }
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
function reduce(acc: string[], curr: string[]): string[] {
    // trim :is()

    if (curr[0] == "&") {
        if (curr[1] == " " && !isIdent(curr[2]) && !isFunction(curr[2])) {
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
function doMinify(
    arena: AstArena,
    ast: AstNode,
    options: ParserOptions = {},
    recursive: boolean = false,
    errors?: ErrorDescription[],
    nestingContent?: boolean,
    context: {
        [key: string]: any;
    } = {},
): AstNode {
    if (!("nodes" in context)) {
        context.nodes = <Set<AstNode>>new Set();
    }

    if (context.nodes.has(ast)) {
        return ast;
    }

    context.nodes.add(ast);

    if (arena.flags[ast] & EnumAstNodeStatus.HasChildren && arena.firstChild[ast] != 0) {
        const reducer = reduce.bind(ast);

        if (!nestingContent) {
            nestingContent = options.nestingRules && arena.dataTypes[ast] == EnumToken.RuleNodeType;
        }

        // the children list is modified while it is visited: every branch sets the next child to visit
        let cursor: AstNode = arena.firstChild[ast];
        let previous: AstNode | null = null;
        let node: AstNode | null = null;
        let nodeType: EnumToken;
        let previousType: EnumToken | null;

        /**
         * the node located `count` positions before a child of ast (the end of the list when 0). null when out of range
         * @param child
         * @param count
         */
        const before = (child: AstNode, count: number): AstNode | null => {
            let result: AstNode = child == 0 ? arena.lastChild[ast] : arena.previousSibling[child];

            while (--count > 0 && result != 0) {
                result = arena.previousSibling[result];
            }

            return result == 0 ? null : result;
        };

        while (cursor != 0) {
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
                const nam: string = arena.strings[arena.name[node]];

                if (nam === "font-face") {
                    cursor = arena.nextSibling[node];
                    continue;
                }

                // https://drafts.csswg.org/css-mixins/#:~:text=The%20value%20of%20the%20result%20descriptor%20is%20always%2016px%20in%20the%20above%20example
                if (equalsIgnoreCase(nam, "function")) {
                    let k: AstNode = arena.lastChild[node];
                    let slice: boolean = false;

                    while (k != 0) {
                        if (
                            arena.dataTypes[k] === EnumToken.CommentNodeType ||
                            arena.dataTypes[k] === EnumToken.WhitespaceTokenType
                        ) {
                            k = arena.previousSibling[k];
                            continue;
                        }

                        if (
                            arena.dataTypes[k] === EnumToken.DeclarationNodeType &&
                            equalsIgnoreCase(arena.strings[arena.name[k]], "result")
                        ) {
                            slice = true;
                            break;
                        }

                        k = arena.previousSibling[k];
                    }

                    if (k != 0 && slice) {
                        k = arena.previousSibling[k];

                        while (k != 0) {
                            const previousNode: AstNode = arena.previousSibling[k];

                            if (arena.dataTypes[k] === EnumToken.AtRuleNodeType) {
                                arena.detach(k);
                            }

                            k = previousNode;
                        }
                    }
                }
            }

            if (nodeType === EnumToken.KeyframesAtRuleNodeType) {
                if (
                    previousType === EnumToken.KeyframesAtRuleNodeType &&
                    arena.name[node] === arena.name[previous as AstNode] &&
                    arena.stringValue[node] === arena.stringValue[previous as AstNode]
                ) {
                    // the previous keyframes are dropped, the node is visited again
                    const previousNode: AstNode = arena.previousSibling[previous as AstNode];

                    cursor = arena.nextSibling[previous as AstNode];
                    arena.detach(previous as AstNode);
                    previous = previousNode || null;

                    continue;
                }
            } else if (nodeType === EnumToken.KeyframesRuleNodeType) {
                if (
                    previousType === EnumToken.KeyframesRuleNodeType &&
                    arena.name[node] === arena.name[previous as AstNode]
                ) {
                    // do not merge keyframes
                    // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@keyframes#resolving_duplicates
                    arena.moveChildren(node, previous as AstNode);
                    options.cache?.delete(previous as AstNode);
                    arena.detach(node);
                    cursor = arena.nextSibling[previous as AstNode];

                    continue;
                }

                let k: AstNode = arena.firstChild[node];

                while (k != 0) {
                    const next: AstNode = arena.nextSibling[k];

                    if (arena.dataTypes[k] == EnumToken.DeclarationNodeType) {
                        let l: Token = arena.lastToken[k];

                        while (l != 0) {
                            if (arena.dataTypes[l] == EnumToken.ImportantTokenType) {
                                arena.detach(k);
                                break;
                            }

                            if (
                                arena.dataTypes[l] == EnumToken.WhitespaceTokenType ||
                                arena.dataTypes[l] == EnumToken.CommentTokenType
                            ) {
                                l = arena.previousSibling[l];
                                continue;
                            }

                            break;
                        }
                    }

                    k = next;
                }
            } else if (nodeType == EnumToken.AtRuleNodeType) {
                const nam: string = arena.strings[arena.name[node]];
                const tokens: Token[] | null = arena.firstToken[node] == 0 ? null : arena.tokens(node);
                const renderPrelude = (acc: string, curr: Token, index: number, arr: Token[]): string =>
                    acc +
                    (arena.dataTypes[curr] === EnumToken.CommentTokenType ||
                    (arena.dataTypes[curr] === EnumToken.WhitespaceTokenType &&
                        arena.typeOf(arr[index + 1]) === EnumToken.CommentTokenType &&
                        (index + 3 < arr.length || arena.typeOf(arr[index + 2]) === EnumToken.WhitespaceTokenType))
                        ? ""
                        : renderValue(arena, curr));

                if (nam == "media") {
                    if (tokens != null) {
                        const slice = tokens.slice();
                        minifyAtRuleMedia(arena, slice);

                        if (slice.length !== tokens.length) {
                            arena.setTokenList(node, slice);
                            arena.setValueString(node, slice.reduce(renderPrelude, ""));
                        }
                    }

                    if (["all", ""].includes(arena.strings[arena.stringValue[node]])) {
                        // the node is replaced by its children
                        cursor = arena.firstChild[node] || arena.nextSibling[node];
                        arena.moveChildren(node, ast, node);
                        arena.detach(node);
                        continue;
                    }
                } else if (nam === "import" && tokens != null) {
                    let l: number = 0;
                    let token: Token;

                    for (; l < tokens.length; l++) {
                        token = tokens[l];

                        if (
                            arena.dataTypes[token] === EnumToken.ParensTokenType ||
                            arena.dataTypes[token] === EnumToken.MediaQueryConditionTokenType ||
                            (arena.dataTypes[token] === EnumToken.IdenTokenType &&
                                "layer" !== arena.strings[arena.stringValue[token]])
                        ) {
                            break;
                        }
                    }

                    if (l < tokens.length) {
                        const slice = tokens.slice(l) as Token[];

                        tokens.splice(l, slice.length, ...minifyAtRuleMedia(arena, slice));
                        arena.setTokenList(node, tokens);
                        arena.setValueString(node, trimArray(arena, tokens).reduce(renderPrelude, ""));
                    }
                } else if (
                    arena.dataTypes[ast] === nodeType &&
                    arena.name[ast] === arena.name[node] &&
                    arena.stringValue[ast] === arena.stringValue[node]
                ) {
                    // the node is replaced by its children
                    cursor = arena.firstChild[node] || arena.nextSibling[node];
                    arena.moveChildren(node, ast, node);
                    arena.detach(node);
                    continue;
                }

                if (
                    previousType == EnumToken.AtRuleNodeType &&
                    nam != "font-face" &&
                    arena.name[previous as AstNode] === arena.name[node] &&
                    arena.stringValue[previous as AstNode] === arena.stringValue[node]
                ) {
                    if (arena.flags[node] & EnumAstNodeStatus.HasChildren) {
                        arena.moveChildren(node, previous as AstNode);
                        options.cache?.delete(previous as AstNode);

                        if (!hasDeclaration(arena, previous as AstNode)) {
                            context.nodes.delete(previous);
                            doMinify(arena, previous as AstNode, options, recursive, errors, nestingContent, context);
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
            } else if (nodeType === EnumToken.RuleNodeType) {
                reduceRuleSelector(arena, node);

                let wrapper: AstRule | null = null;
                let match;

                if (options.nestingRules) {
                    if (previousType == EnumToken.RuleNodeType) {
                        reduceRuleSelector(arena, previous as AstNode);

                        match = matchSelectors(
                            arena.raw[previous as AstNode] as string[][],
                            arena.raw[node] as string[][],
                        );

                        if (match != null) {
                            wrapper = wrapNodes(arena, previous as AstNode, node, match, reducer);
                        }
                    }

                    if (wrapper != null) {
                        // wrap the following rules that match the wrapper selector
                        let nextNode: AstNode = arena.nextSibling[wrapper];

                        while (nextNode != 0 && arena.dataTypes[nextNode] == EnumToken.RuleNodeType) {
                            reduceRuleSelector(arena, nextNode);
                            match = matchSelectors(arena.raw[wrapper] as string[][], arena.raw[nextNode] as string[][]);

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
                    } else if (
                        arena.optimized[node] != null &&
                        arena.optimized[node]!.match &&
                        arena.optimized[node]!.selector.length > 1
                    ) {
                        const optimized: OptimizedSelector = arena.optimized[node] as OptimizedSelector;

                        wrapper = arena.clone(node);

                        arena.setSelector(wrapper, optimized.optimized[0]);
                        arena.raw[wrapper] = [[optimized.optimized[0]]];
                        arena.setTokens(wrapper);

                        arena.setSelector(node, optimized.selector.reduce(reducer, []).join(","));
                        arena.raw[node] = optimized.selector.slice();
                        arena.setTokens(node);

                        // the wrapper takes the place of the node
                        arena.insertBefore(node, wrapper);
                        arena.appendChild(wrapper, node);
                        node = wrapper as AstRule;
                        nodeType = EnumToken.RuleNodeType;
                    } else if (arena.optimized[node]?.reducible) {
                        const optimized: OptimizedSelector = arena.optimized[node] as OptimizedSelector;

                        if (optimized.optimized.length === 1) {
                            const sel1 =
                                optimized.optimized[0] +
                                ":is(" +
                                optimized.selector.reduce(reducer, []).join(",") +
                                ")";
                            const sel2 = optimized.selector.reduce(
                                (acc: string, curr: string[]) =>
                                    (acc.length > 0 ? acc + "," : "") + optimized.optimized[0] + curr.join(""),
                                "",
                            );

                            arena.setSelector(node, sel1.length < sel2.length ? sel1 : sel2);
                            arena.setTokens(node);
                        } else if (optimized.optimized.length === 0) {
                            const testIdent = /^[a-zA-Z]/;
                            arena.setSelector(
                                node,
                                optimized.selector.reduce(
                                    (acc: string, curr: string[]) =>
                                        (acc.length > 0 ? acc + "," : "") +
                                        (nestingContent && testIdent.test(curr[0]) ? "& " : "") +
                                        curr.join(""),
                                    "",
                                ),
                            );
                            arena.setTokens(node);
                        }
                    }
                } else if (arena.optimized[node]?.match) {
                    const optimizedSelector: OptimizedSelector = arena.optimized[node] as OptimizedSelector;
                    let wrap: boolean = true;
                    const selector: string[][] = optimizedSelector.selector.reduce(
                        (acc: string[][], curr: string[]): string[][] => {
                            if (curr[0] == "&" && curr.length > 1) {
                                if (curr[1] == " ") {
                                    curr.splice(0, 2);
                                } else {
                                    curr.splice(0, 1);
                                }
                            } else if (combinators.includes(curr[0])) {
                                curr.unshift("&");
                                wrap = false;
                            }

                            acc.push(curr);
                            return acc;
                        },
                        [],
                    );

                    if (!wrap) {
                        wrap = selector.some((s: string[]): boolean => s[0] != "&");
                    }

                    let rule: string | null = null;
                    const optimized = optimizedSelector.optimized.slice() as string[];

                    if (optimized.length > 1) {
                        const check = optimized.at(-2) as string;

                        if (!combinators.includes(check)) {
                            const last = optimized[optimized.length - 1] as string;
                            const all = new Array(Math.max(optimized.length - 1, 0));
                            let write = 0;

                            for (let read = 0; read < optimized.length - 1; read++) {
                                all[write++] = optimized[read];
                            }

                            optimized.length = 0;
                            for (let index = 0; index < write; index++) {
                                optimized[index] = all[index];
                            }

                            wrap = false;
                            rule =
                                optimized.join("") +
                                `:is(${selector
                                    .map((s) => {
                                        const next = s[0] == "&" ? new Array(s.length) : new Array(s.length + 1);
                                        let write = 0;

                                        if (s[0] == "&") {
                                            next[write++] = last;
                                            for (let read = 1; read < s.length; read++) {
                                                next[write++] = s[read];
                                            }
                                        } else {
                                            next[write++] = last;
                                            for (let read = 0; read < s.length; read++) {
                                                next[write++] = s[read];
                                            }
                                        }

                                        const rebuilt = new Array(write);
                                        for (let index = 0; index < write; index++) {
                                            rebuilt[index] = next[index];
                                        }

                                        return rebuilt.join("");
                                    })
                                    .join(",")})`;
                        }
                    }

                    if (rule == null) {
                        rule = selector
                            .map((s: string[]): string => {
                                if (s[0] == "&") {
                                    const replacement = optimizedSelector.optimized;
                                    const all = new Array(Math.max(s.length - 1 + replacement.length, 0));
                                    let write = 0;

                                    for (let read = 0; read < replacement.length; read++) {
                                        all[write++] = replacement[read];
                                    }
                                    for (let read = 1; read < s.length; read++) {
                                        all[write++] = s[read];
                                    }

                                    const rebuilt = new Array(write);
                                    for (let index = 0; index < write; index++) {
                                        rebuilt[index] = all[index];
                                    }

                                    return rebuilt.join("");
                                }

                                return s.join("");
                            })
                            .join(",");
                    }

                    let sel: string = wrap ? optimizedSelector.optimized.join("") + `:is(${rule})` : rule;

                    if (sel.length < arena.strings[arena.name[node]].length) {
                        arena.setSelector(node, sel);
                        arena.setTokens(node);
                    }
                } else if (arena.optimized[node]?.reducible) {
                    const optimized: OptimizedSelector = arena.optimized[node] as OptimizedSelector;

                    if (optimized.optimized.length === 1) {
                        const sel1 =
                            optimized.optimized[0] + ":is(" + optimized.selector.reduce(reducer, []).join(",") + ")";
                        const sel2 = optimized.selector.reduce(
                            (acc: string, curr: string[]) =>
                                (acc.length > 0 ? acc + "," : "") + optimized.optimized[0] + curr.join(""),
                            "",
                        );

                        arena.setSelector(node, sel1.length < sel2.length ? sel1 : sel2);
                        arena.setTokens(node);
                    } else if (optimized.optimized.length === 0) {
                        const testIdent = /^[a-zA-Z]/;
                        arena.setSelector(
                            node,
                            optimized.selector.reduce(
                                (acc: string, curr: string[]) =>
                                    (acc.length > 0 ? acc + "," : "") +
                                    (nestingContent && testIdent.test(curr[0]) ? "& " : "") +
                                    curr.join(""),
                                "",
                            ),
                        );
                        arena.setTokens(node);
                    }
                } else if ((arena.optimized[node]?.optimized.length as number) > 0) {
                    const optimized: OptimizedSelector = arena.optimized[node] as OptimizedSelector;
                    const sel = optimized.optimized.join("");

                    if (sel.length < arena.strings[arena.name[node]].length) {
                        arena.setSelector(node, sel);
                        arena.raw[node] = [optimized.optimized.slice()];
                        arena.setTokens(node);
                    }
                }

                doMinify(arena, node, options, recursive, errors, nestingContent, context);
            }

            if (previous != null) {
                previousType = arena.dataTypes[previous];

                if (
                    arena.flags[previous] & EnumAstNodeStatus.HasChildren &&
                    arena.flags[node] & EnumAstNodeStatus.HasChildren
                ) {
                    if (previousType === nodeType) {
                        let shouldMerge: boolean = true;
                        let k: AstNode = arena.lastChild[previous];

                        while (k != 0) {
                            if (
                                arena.dataTypes[k] === EnumToken.CommentNodeType ||
                                arena.dataTypes[k] === EnumToken.InvalidRuleNodeType
                            ) {
                                k = arena.previousSibling[k];
                                continue;
                            }

                            shouldMerge = arena.dataTypes[k] === EnumToken.DeclarationNodeType;
                            break;
                        }

                        if (shouldMerge) {
                            if (
                                ((nodeType === EnumToken.RuleNodeType ||
                                    nodeType === EnumToken.KeyframesRuleNodeType) &&
                                    arena.name[node] === arena.name[previous]) ||
                                ((nodeType as EnumToken) == EnumToken.AtRuleNodeType &&
                                    arena.strings[arena.name[node]] !== "font-face" &&
                                    arena.name[node] === arena.name[previous])
                            ) {
                                arena.moveChildren(previous, node, arena.firstChild[node]);
                                options.cache?.delete(node);

                                doMinify(arena, node, options, recursive, errors, nestingContent, context);

                                arena.detach(previous);
                                previous = node;
                                cursor = arena.nextSibling[node];

                                continue;
                            } else if (
                                nodeType == previousType &&
                                [EnumToken.KeyframesRuleNodeType, EnumToken.RuleNodeType].includes(nodeType)
                            ) {
                                const intersect = diff(arena, previous, node, options, context);

                                if (intersect != null) {
                                    // [result, node2] take the place of node1 (previous), node1 takes the place of node2 (node)
                                    const { node1, node2, result } = intersect;
                                    const after: AstNode = arena.nextSibling[node2];
                                    const keep2: boolean = arena.firstChild[node2] != 0;

                                    if (result != null) {
                                        arena.insertBefore(node1, result);
                                    }

                                    if (keep2) {
                                        arena.insertBefore(node1, node2);
                                    } else {
                                        arena.detach(node2);
                                    }

                                    if (arena.firstChild[node1] == 0) {
                                        arena.detach(node1);
                                    } else if (after == 0) {
                                        arena.appendChild(ast, node1);
                                    } else {
                                        arena.insertBefore(after, node1);
                                    }

                                    // next node to visit
                                    node = keep2
                                        ? arena.nextSibling[result ?? node2] || null
                                        : before(arena.parents[node1] == ast ? node1 : after, result == null ? 1 : 2);
                                    previous = result;
                                }
                            }
                        }
                    }

                    if (recursive && previous != null && previous != node) {
                        if (!hasDeclaration(arena, previous)) {
                            doMinify(arena, previous, options, recursive, errors, nestingContent, context);
                        }
                    }
                }
            }

            if (
                !nestingContent &&
                previous != null &&
                arena.dataTypes[previous] == EnumToken.RuleNodeType &&
                arena.strings[arena.name[previous]].includes("&")
            ) {
                fixSelector(arena, previous);
            }

            previous = node;
            cursor = node == null ? arena.firstChild[ast] : arena.nextSibling[node];
        }

        if (recursive && node != null && arena.flags[node] & EnumAstNodeStatus.HasChildren) {
            if (arena.dataTypes[node] == EnumToken.KeyframesAtRuleNodeType || !hasDeclarationChild(arena, node)) {
                if (
                    !(
                        arena.dataTypes[node] == EnumToken.AtRuleNodeType &&
                        arena.strings[arena.name[node]] != "font-face"
                    )
                ) {
                    doMinify(arena, node, options, recursive, errors, nestingContent, context);
                }
            }
        }

        if (
            !nestingContent &&
            node != null &&
            arena.dataTypes[node] == EnumToken.RuleNodeType &&
            arena.strings[arena.name[node]].includes("&")
        ) {
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
function hasDeclaration(arena: AstArena, node: AstNode): boolean {
    for (let child = arena.firstChild[node]; child != 0; child = arena.nextSibling[child]) {
        if (arena.dataTypes[child] == EnumToken.CommentNodeType) {
            continue;
        }

        return arena.dataTypes[child] == EnumToken.DeclarationNodeType;
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
function hasDeclarationChild(arena: AstArena, node: AstNode): boolean {
    for (let child = arena.firstChild[node]; child != 0; child = arena.nextSibling[child]) {
        if (arena.dataTypes[child] == EnumToken.DeclarationNodeType) {
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
export function optimizeSelector(selector: string[][]): OptimizedSelector | null {
    const map = new Set<string>();
    selector = selector
        .reduce((acc: string[][], curr: string[]) => {
            // @ts-ignore
            if (curr.length > 0 && curr.at(-1).startsWith(":is(")) {
                // @ts-ignore
                const rules = splitRule(curr.at(-1).slice(4, -1)).map((x) => {
                    if (x[0] == "&" && x.length > 1) {
                        return x.slice(x[1] == " " ? 2 : 1);
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
        }, [] as string[][])
        .filter((x) => {
            const str = x.join("");

            if (map.has(str)) {
                return false;
            }

            map.add(str);
            return true;
        });

    const optimized: string[] = [];
    const k: number = selector.reduce(
        (acc: number, curr: string[]): number =>
            acc == 0 ? curr.length : curr.length == 0 ? acc : Math.min(acc, curr.length),
        0,
    );
    let i: number = 0;
    let j;
    let match;
    for (; i < k; i++) {
        const item: string = selector[0][i];
        match = true;
        for (j = 1; j < selector.length; j++) {
            if (item != selector[j][i]) {
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
        const last: string = <string>optimized.at(-1);

        if (last == " " || combinators.includes(<string>last)) {
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

    let reducible: boolean = optimized.length == 1;

    if (optimized[0] == "&") {
        if (optimized[1] == " ") {
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

    if (optimized.length == 0 || optimized[0].charAt(0) == "&" || selector.length == 1) {
        return {
            match: false,
            optimized,
            selector: selector.map((selector: string[]): string[] =>
                selector[0] == "&" && selector[1] == " " ? selector.slice(2) : selector,
            ),
            reducible:
                selector.length > 1 && selector.every((selector: string[]) => !combinators.includes(selector[0])),
        };
    }

    return {
        match: true,
        optimized,
        selector: selector.reduce(
            (acc: string[][], curr: string[]) => {
                let hasCompound: boolean = true;

                if (hasCompound && curr.length > 0) {
                    hasCompound = !["&"].concat(combinators).includes(curr[0].charAt(0));
                }

                // @ts-ignore
                if (hasCompound && curr[0] == " ") {
                    hasCompound = false;
                    curr.unshift("&");
                }

                if (curr.length == 0) {
                    curr.push("&");
                    hasCompound = false;
                }

                if (reducible) {
                    const chr = curr[0].charAt(0);
                    // @ts-ignore
                    reducible = chr == "." || chr == ":" || isIdentStart(chr.charCodeAt(0));
                }

                acc.push(hasCompound ? ["&"].concat(curr) : curr);
                return acc;
            },
            <string[][]>[],
        ),
        reducible: selector.every((selector: string[]) => ![">", "+", "~", "&"].includes(selector[0])),
    };
}

/**
 * Split selector string
 * @param buffer
 *
 * @internal
 */
export function splitRule(buffer: string): string[][] {
    const result: string[][] = [[]];
    let str: string = "";

    for (let i = 0; i < buffer.length; i++) {
        let chr: string = buffer.charAt(i);

        if (isWhiteSpace(chr.charCodeAt(0))) {
            if (str !== "") {
                // @ts-ignore
                result.at(-1).push(str);
                str = "";
            }

            // @ts-ignore
            if (result.at(-1).length > 0) {
                // @ts-ignore
                result.at(-1).push(" ");
            }

            // i = k;
            continue;
        }

        if (chr == ",") {
            if (str !== "") {
                result.at(-1)!.push(str);
                str = "";
            }

            result.push([]);
            continue;
        }

        if (chr == ".") {
            if (str !== "") {
                result.at(-1)!.push(str);
                str = "";
            }

            str += chr;
            continue;
        }

        if (combinators.includes(chr)) {
            if (str !== "") {
                result.at(-1)!.push(str);
                str = "";
            }

            if (chr == "|" && buffer.charAt(i + 1) == "|") {
                chr += buffer.charAt(++i);
            }

            result.at(-1)!.push(chr);
            continue;
        }

        if (chr == ":") {
            if (str !== "") {
                result.at(-1)!.push(str);
                str = "";
            }

            if (buffer.charAt(i + 1) == ":") {
                chr += buffer.charAt(++i);
            }

            str += chr;
            continue;
        }

        str += chr;
        if (chr == "\\") {
            str += buffer.charAt(++i);
            continue;
        }

        if (chr == "(" || chr == "[") {
            const open = chr;
            const close = chr == "(" ? ")" : "]";
            let inParens: number = 1;
            let k = i;
            while (++k < buffer.length) {
                chr = buffer.charAt(k);
                if (chr == "\\") {
                    str += buffer.slice(k, k + 2);
                    k++;
                    continue;
                }
                str += chr;
                if (chr == open) {
                    inParens++;
                } else if (chr == close) {
                    inParens--;
                }
                if (inParens == 0) {
                    break;
                }
            }
            i = k;
        }
    }

    if (str !== "") {
        result.at(-1)!.push(str);
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
function reduceSelector(acc: string[][], curr: string[]): string[][] | null {
    let hasCompoundSelector: boolean = true;

    // @ts-ignore
    curr = curr.slice(this.match[0].length);

    while (curr.length > 0) {
        if (curr[0] == " ") {
            hasCompoundSelector = false;
            curr.unshift("&");
            continue;
        }

        break;
    }

    if (hasCompoundSelector && curr.length > 0) {
        hasCompoundSelector = !["&"].concat(combinators).includes(curr[0].charAt(0));
    }

    if (curr[0] == ":is(") {
        let inFunction: number = 0;
        let canReduce: boolean = true;
        const isCompound: string[][] = curr.reduce(
            (acc, token, index: number) => {
                if (index == 0) {
                    inFunction++;
                    canReduce = curr[1] == "&";
                } else if (token == ")") {
                    inFunction--;
                } else if (token == ",") {
                    if (!canReduce) {
                        canReduce = curr[index + 1] == "&";
                    }

                    acc.push([]);
                } else acc.at(-1)?.push(token);

                return acc;
            },
            <string[][]>[[]],
        );

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
            : hasCompoundSelector && curr[0] != "&" && (curr.length == 0 || !combinators.includes(curr[0].charAt(0)))
              ? ["&"].concat(curr)
              : curr,
    );
    return acc;
}

/**
 * Match selectors
 * @param selector1
 * @param selector2
 *
 * @private
 */
function matchSelectors(selector1: string[][], selector2: string[][]): null | MatchedSelector {
    let match: string[][] = [[]];
    const j: number = Math.min(
        selector1.reduce(
            (acc: number, curr: string[]): number => Math.min(acc, curr.length),
            selector1.length > 0 ? selector1[0].length : 0,
        ),
        selector2.reduce(
            (acc: number, curr: string[]): number => Math.min(acc, curr.length),
            selector2.length > 0 ? selector2[0].length : 0,
        ),
    );

    let i: number = 0;
    let k: number;
    let l: number;
    let token: string;
    let matching: boolean = true;
    let matchFunction: number = 0;
    let inAttr: number = 0;
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
            if (selector1[k][i] != token) {
                matching = false;
                break;
            }
        }

        if (matching) {
            l = 0;
            for (; l < selector2.length; l++) {
                if (selector2[l][i] != token) {
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

        (<string[]>match.at(-1)).push(token);
    }

    // invalid function
    if (matchFunction != 0 || inAttr != 0) {
        return null;
    }

    for (const part of match) {
        while (part.length > 0) {
            const token: string = <string>part.at(-1);

            if (token == " " || combinators.includes(token) || notEndingWith.includes(<string>token.at(-1))) {
                part.pop();
                continue;
            }

            break;
        }
    }

    if (match.every((t) => t.length == 0)) {
        return null;
    }

    if (eq([["&"]], match)) {
        return null;
    }

    const reducer = reduceSelector.bind({ match });

    // @ts-ignore
    selector1 = selector1.reduce(reducer, [] as string[][]) as string[][];
    // @ts-ignore
    selector2 = selector2.reduce(reducer, [] as string[][]);

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
function fixSelector(arena: AstArena, node: AstRule): void {
    const sel: string = arena.strings[arena.name[node]];

    if (sel.includes("&")) {
        const attributes: Token[] = parseString(arena, sel);

        for (const attr of walkValues(arena, attributes)) {
            if (
                arena.dataTypes[attr.value] == EnumToken.PseudoClassFuncTokenType &&
                arena.strings[arena.stringValue[attr.value]] == ":is"
            ) {
                let child: Token = arena.lastToken[attr.value];

                while (child != 0) {
                    const previous: Token = arena.previousSibling[child];

                    if (arena.dataTypes[child] == EnumToken.NestingSelectorTokenType) {
                        arena.detach(child);
                    }

                    child = previous;
                }
            }
        }

        arena.setSelector(
            node,
            attributes.reduce((acc: string, curr: Token) => acc + renderValue(arena, curr), ""),
        );
        arena.setTokens(node);
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
function wrapNodes(
    arena: AstArena,
    previous: AstRule,
    node: AstRule,
    match: MatchedSelector,
    reducer: Function,
): AstRule {
    // @ts-ignore
    let pSel: string = match.selector1.reduce(reducer, []).join(",");

    // @ts-ignore
    let nSel: string = match.selector2.reduce(reducer, []).join(",");

    const wrapper: AstRule = arena.clone(previous);

    // @ts-ignore
    arena.setSelector(wrapper, match.match.reduce(reducer, []).join(","));
    arena.raw[wrapper] = match.match.map((t) => t.slice());
    arena.optimized[wrapper] = null;
    arena.setTokens(wrapper);

    const parent: AstNode = arena.parents[node];

    // the wrapper takes the place of node
    arena.insertBefore(node, wrapper);

    if (pSel == "&" || pSel === "") {
        arena.moveChildren(previous, wrapper);

        if (nSel == "&" || nSel === "") {
            arena.moveChildren(node, wrapper);
        } else {
            arena.appendChild(wrapper, node);
        }
    } else {
        arena.appendChild(wrapper, previous);
        arena.appendChild(wrapper, node);
    }

    // the nodes whose children were moved into the wrapper are dropped
    if (arena.parents[previous] == parent) {
        arena.detach(previous);
    }

    if (arena.parents[node] == parent) {
        arena.detach(node);
    }

    // update the selectors of the wrapped nodes
    if (arena.parents[previous] == wrapper) {
        arena.setSelector(previous, pSel);
        arena.raw[previous] = match.selector1;
        arena.setTokens(previous);
    }

    if (arena.parents[node] == wrapper) {
        arena.setSelector(node, nSel);
        arena.raw[node] = match.selector2;
        arena.setTokens(node);
    }

    reduceRuleSelector(arena, wrapper);
    arena.setTokens(wrapper);
    return wrapper;
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
function diff(
    arena: AstArena,
    n1: AstRule,
    n2: AstRule,
    options: ParserOptions,
    context: {
        [key: string]: any;
    },
): { result: AstRule | null; node1: AstRule; node2: AstRule } | null {
    if (!("cache" in options)) {
        options.cache = new Map<AstNode, string>();
    }

    let node1: AstRule = n1;
    let node2: AstRule = n2;
    let exchanged: boolean = false;

    if (arena.childCount(node1) > arena.childCount(node2)) {
        const t: AstRule = node1;
        node1 = node2;
        node2 = t;
        exchanged = true;
    }

    const raw1: RawSelectorTokens = <RawSelectorTokens>arena.raw[node1];
    const raw2: RawSelectorTokens = <RawSelectorTokens>arena.raw[node2];

    if (raw1 != null && raw2 != null) {
        const prefixes1: Set<string> = new Set();
        const prefixes2: Set<string> = new Set();

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

        if (prefixes1.size != prefixes2.size) {
            return null;
        }

        for (const prefix of prefixes1) {
            if (!prefixes2.has(prefix)) {
                return null;
            }
        }
    }

    // match the declarations of both rules, from the last to the first
    let matches: number = 0;

    for (let child1: AstNode = arena.lastChild[node1]; child1 != 0; child1 = arena.previousSibling[child1]) {
        if (arena.dataTypes[child1] == EnumToken.CommentNodeType) {
            continue;
        }

        for (let child2: AstNode = arena.lastChild[node2]; child2 != 0; child2 = arena.previousSibling[child2]) {
            if (
                arena.dataTypes[child2] == EnumToken.CommentNodeType ||
                arena.flags[child2] & EnumAstNodeStatus.Matched
            ) {
                continue;
            }

            if (arena.name[child1] == arena.name[child2] && eqNode(arena, child1, child2)) {
                arena.flags[child1] |= EnumAstNodeStatus.Matched;
                arena.flags[child2] |= EnumAstNodeStatus.Matched;
                matches++;
                break;
            }
        }
    }

    if (matches == 0 && (arena.firstChild[node1] != 0 || arena.firstChild[node2] != 0)) {
        return null;
    }

    // the rules are rendered with the same options during the minification: the options are resolved once and
    // identical values are rendered once
    const renderer: NodeRenderer = (context.renderer ??= new NodeRenderer(options as RenderOptions));
    const renderedSize = (node: AstRule, cache: boolean): number => {
        let css: string | undefined = cache ? options.cache!.get(node) : undefined;

        if (css == null) {
            css = renderer.render(arena, node);

            if (cache) {
                options.cache!.set(node, css);
            }
        }

        return arena.firstChild[node] == 0 ? 0 : css.length;
    };

    // size of the original nodes
    const size: number = renderedSize(n1, true) + renderedSize(n2, true);

    // the shared declarations are moved into the result node
    const result: AstRule = arena.clone(node1);

    arena.setSelector(
        result,
        [
            ...new Set(
                splitRule(arena.strings[arena.name[node1]])
                    .concat(splitRule(arena.strings[arena.name[node2]]))
                    .map((s) => s.join("")),
            ),
        ].join(","),
    );

    // the matched declarations of node1 are moved into the result, the duplicates in node2 are dropped.
    // the moves are recorded (node, parent, next sibling) to be undone when the result is not smaller
    const moves: number[] = [];
    const moveMatched = (parent: AstRule, target: AstRule | null): void => {
        let child: AstNode = arena.firstChild[parent];

        while (child != 0) {
            const next: AstNode = arena.nextSibling[child];

            if (arena.flags[child] & EnumAstNodeStatus.Matched) {
                arena.flags[child] &= ~EnumAstNodeStatus.Matched;
                moves.push(child, parent, next);

                if (target == null) {
                    arena.detach(child);
                } else {
                    arena.appendChild(target, child);
                }
            }

            child = next;
        }
    };

    moveMatched(node1, result);
    moveMatched(node2, null);

    arena.insertBefore(n1, result);

    options.cache!.delete(node1);
    options.cache!.delete(node2);

    if (
        size <= renderedSize(node1, false) + renderedSize(node2, false) + renderedSize(result, false) &&
        arena.firstChild[node1] != 0 &&
        arena.firstChild[node2] != 0
    ) {
        // restore the nodes: undo the moves in reverse order
        for (let k = moves.length - 3; k >= 0; k -= 3) {
            if (moves[k + 2] == 0) {
                arena.appendChild(moves[k + 1], moves[k]);
            } else {
                arena.insertBefore(moves[k + 2], moves[k]);
            }
        }

        arena.detach(result);

        return null;
    }

    arena.setTokens(result);
    arena.raw[result] = null;
    arena.optimized[result] = null;

    const optimized = optimizeSelector(splitRule(arena.strings[arena.name[result]]));

    if (optimized?.match) {
        const rule = optimized.selector.reduce((acc, curr) => {
            if (acc.length > 0) {
                acc += ",";
            }

            if (curr.length > 2 && curr[0] === "&" && curr[1] === " ") {
                return acc + curr.slice(2).join("");
            } else if (curr.length > 1 && curr[0] === "&") {
                return acc + curr.slice(1).join("");
            }

            return acc + curr.join("");
        }, "");

        const match = optimized.optimized.join("");
        const sel = match + ":is(" + replaceCompound(arena, rule, match) + ")";

        if (sel.length < arena.strings[arena.name[result]].length) {
            arena.setSelector(result, sel);
            arena.setTokens(result);
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
function eqNode(arena: AstArena, a: AstNode, b: AstNode): boolean {
    if (a == b) {
        return true;
    }

    if (
        arena.dataTypes[a] != arena.dataTypes[b] ||
        arena.name[a] != arena.name[b] ||
        arena.stringValue[a] != arena.stringValue[b]
    ) {
        return false;
    }

    if (arena.flags[a] & EnumAstNodeStatus.HasValues) {
        let token1: Token = arena.firstToken[a];
        let token2: Token = arena.firstToken[b];

        while (token1 != 0 && token2 != 0) {
            if (!eqToken(arena, token1, token2)) {
                return false;
            }

            token1 = arena.nextSibling[token1];
            token2 = arena.nextSibling[token2];
        }

        if (token1 != token2) {
            return false;
        }
    }

    if (arena.flags[a] & EnumAstNodeStatus.HasChildren) {
        let child1: AstNode = arena.firstChild[a];
        let child2: AstNode = arena.firstChild[b];

        while (child1 != 0 && child2 != 0) {
            if (!eqNode(arena, child1, child2)) {
                return false;
            }

            child1 = arena.nextSibling[child1];
            child2 = arena.nextSibling[child2];
        }

        return child1 == child2;
    }

    return true;
}

/**
 * Reduce rule selector
 * @param arena
 * @param node
 *
 * @private
 */
function reduceRuleSelector(arena: AstArena, node: AstRule) {
    if (arena.raw[node] == null) {
        arena.raw[node] = splitRule(arena.strings[arena.name[node]]);
    }

    let optimized: OptimizedSelector = optimizeSelector(
        arena.raw[node]!.reduce(
            (acc, curr) => {
                acc.push(curr.slice());
                return acc;
            },
            <string[][]>[],
        ),
    ) as OptimizedSelector;

    if (optimized != null) {
        arena.optimized[node] = optimized;
    }

    if (optimized != null && optimized.match && optimized.reducible && optimized.selector.length > 1) {
        for (const selector of optimized.selector) {
            if (
                selector.length > 1 &&
                selector[0] == "&" &&
                (combinators.includes(selector[1]) || !/^[a-zA-Z:]/.test(selector[1]))
            ) {
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

        const unique: Set<string> = new Set();
        const reduced = optimized.selector.reduce((acc: string[], curr: string[]) => {
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
        const raw: string[][] = [
            [optimized.optimized[0], reduced.length === 1 ? reduced.join("") : ":is("].concat(reduced).concat(")"),
        ];

        const sel: string = raw[0].join("");

        if (sel.length < arena.strings[arena.name[node]].length) {
            arena.setSelector(node, sel);
            arena.raw[node] = raw;
            arena.setTokens(node);
        }
    }
}
