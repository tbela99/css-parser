import { eq } from "../parser/utils/eq.ts";
import { doRender, renderValue } from "../renderer/render.ts";
import * as allFeatures from "./features/index.ts";
import { walkValues } from "./walk.ts";
import type {
    AstAtRule,
    AstDeclaration,
    AstKeyFrameRule,
    AstKeyframesAtRule,
    AstNode,
    AstRule,
    AstStyleSheet,
    ErrorDescription,
    IdentToken,
    MatchedSelector,
    MediaQueryConditionToken,
    MediaRangeQueryToken,
    MinifyFeature,
    MinifyFeatureOptions,
    OptimizedSelector,
    ParensToken,
    ParserOptions,
    PseudoClassFunctionToken,
    RawSelectorTokens,
    Token,
} from "../../@types/index.d.ts";
import { EnumToken } from "./types.ts";
import { isFunction, isIdent, isIdentStart, isWhiteSpace } from "../syntax/syntax.ts";
import { FeatureWalkMode } from "./features/type.ts";
import { trimArray } from "../validation/match.ts";
import { combinators, LOC, OPTIMIZED, PARENT, RAW, TOKENS } from "../syntax/constants.ts";
import { replaceNodeOrValue } from "../parser/utils/token.ts";
import { parseString } from "../parser/parse.ts";
import { tokenize } from "../parser/tokenize.ts";
import { replaceCompound } from "./expand.ts";

const notEndingWith: string[] = ["(", "["].concat(combinators);
const rules: EnumToken[] = [
    EnumToken.AtRuleNodeType,
    EnumToken.RuleNodeType,
    EnumToken.AtRuleTokenType,
    EnumToken.KeyFramesRuleNodeType,
];
// @ts-ignore
const features: MinifyFeature[] = Object.values(allFeatures as Record<string, MinifyFeature>).sort(
    (a: MinifyFeature, b: MinifyFeature) => a.ordering - b.ordering,
) as MinifyFeature[];

/**
 * Apply minification rules to the ast tree
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 *
 * @private
 */
export function minify(
    ast: AstNode,
    options: ParserOptions | MinifyFeatureOptions,
    recursive: boolean,
    errors?: ErrorDescription[],
    nestingContent?: boolean,
): AstNode;

/**
 * Apply minification rules to the ast tree
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 *
 * @private
 */
export function minify(
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
    let parents: Set<AstNode>;
    let replacement: AstNode | null;

    if (!("features" in <MinifyFeatureOptions>options)) {
        // @ts-ignore
        options = <MinifyFeatureOptions>{
            removeDuplicateDeclarations: true,
            computeShorthand: true,
            computeCalcExpression: true,
            removePrefix: false,
            features: <Function[]>[],
            ...options,
        };

        for (const feature of features) {
            feature.register(options);
        }

        options.features!.sort((a: MinifyFeature, b: MinifyFeature): number => a.ordering - b.ordering);
    }

    for (const feature of options!.features as MinifyFeature[]) {
        if (feature.processMode & FeatureWalkMode.Pre) {
            preprocess = true;
        }

        if (feature.processMode & FeatureWalkMode.Post) {
            postprocess = true;
        }
    }

    if (preprocess) {
        parents = new Set([<AstStyleSheet>ast]);

        for (const parent of parents) {
            if (parent.typ == EnumToken.CommentTokenType || parent.typ == EnumToken.CDOCOMMTokenType) {
                continue;
            }

            replacement = parent;

            for (const feature of options.features as MinifyFeature[]) {
                if (
                    (feature.processMode & FeatureWalkMode.Pre) === 0 ||
                    (feature.accept != null && !feature.accept.has(parent.typ))
                ) {
                    continue;
                }

                if (rules.includes(replacement.typ) && !Array.isArray(replacement[TOKENS])) {
                    replacement[TOKENS] = parseString(
                        replacement.typ == EnumToken.RuleNodeType || replacement.typ === EnumToken.KeyFramesRuleNodeType
                            ? replacement.sel
                            : replacement.nam,
                    );
                }

                const result = feature.run(
                    <AstRule | AstAtRule>replacement,
                    options,
                    <AstRule | AstAtRule | AstStyleSheet>parent[PARENT] ?? ast,
                    context,
                    FeatureWalkMode.Pre,
                );

                if (result != null) {
                    replacement = result;
                }
            }

            if (replacement != parent && parent[PARENT] != null) {
                replaceNodeOrValue(parent[PARENT] as AstRule | AstAtRule | AstStyleSheet, parent, replacement);
            }

            if ("chi" in replacement) {
                // @ts-ignore
                for (const node of replacement.chi) {
                    node[PARENT] = replacement;
                    parents.add(node as AstNode);
                }
            }
        }

        for (const feature of options.features as MinifyFeature[]) {
            if (feature.processMode & FeatureWalkMode.Pre && "cleanup" in feature) {
                // @ts-ignore
                feature.cleanup(<AstStyleSheet>ast, options, context, FeatureWalkMode.Pre);
            }
        }
    }

    doMinify(ast, options, recursive, errors, nestingContent, context);

    parents = new Set([<AstStyleSheet>ast]);

    for (const parent of parents) {
        if (parent.typ == EnumToken.CommentTokenType || parent.typ == EnumToken.CDOCOMMTokenType) {
            continue;
        }

        replacement = parent;

        if (postprocess) {
            for (const feature of options.features as MinifyFeature[]) {
                if (
                    (feature.processMode & FeatureWalkMode.Post) === 0 ||
                    (feature.accept != null && !feature.accept.has(parent.typ))
                ) {
                    continue;
                }

                const result = feature.run(
                    replacement as AstRule | AstAtRule,
                    options,
                    <AstRule | AstAtRule | AstStyleSheet>parent[PARENT] ?? ast,
                    context,
                    FeatureWalkMode.Post,
                );

                if (result != null) {
                    replacement = result;
                }
            }
        }

        if (replacement != null && replacement != parent && parent[PARENT] != null) {
            // @ts-ignore
            replaceNodeOrValue(parent[PARENT], parent, replacement);
        }

        if ("chi" in replacement) {
            for (const node of replacement.chi!) {
                node[PARENT] = replacement;
                parents.add(node as AstNode);
            }
        }
    }

    if (postprocess) {
        for (const feature of options.features as MinifyFeature[]) {
            if (feature.processMode & FeatureWalkMode.Post && "cleanup" in feature) {
                // @ts-ignore
                feature.cleanup(<AstStyleSheet>ast, options, context, FeatureWalkMode.Post);
            }
        }
    }

    return ast;
}

function transformAtRuleMediaPrelude(values: Token[]) {
    let hasUpdates: boolean = false;

    for (let { value, parent, parents } of walkValues(values)) {
        if (value.typ === EnumToken.MediaQueryConditionTokenType) {
            if (
                (value as MediaQueryConditionToken).op.typ == EnumToken.AndTokenType &&
                // @ts-ignore
                (value as MediaQueryConditionToken).l.typ === EnumToken.IdenTokenType &&
                // @ts-ignore
                ((value as MediaQueryConditionToken).l as IdentToken).val.toLowerCase() === "all"
            ) {
                if (parent === null) {
                    // @ts-ignore
                    values[values.indexOf(value)] = (value as MediaQueryConditionToken).l;
                } else {
                    replaceNodeOrValue(parent, value, (value as MediaQueryConditionToken).l);
                    // @ts-ignore
                    value = (value as MediaQueryConditionToken).l;
                }
                hasUpdates = true;
            }
        }

        // range operator
        if (
            parent != null &&
            parent.typ === EnumToken.MediaQueryConditionTokenType &&
            (parent as MediaQueryConditionToken).op.typ == EnumToken.AndTokenType &&
            // @ts-ignore
            (parent as MediaQueryConditionToken).l.typ == EnumToken.ParensTokenType
        ) {
            let token: Token = (parent as MediaQueryConditionToken).r.find(
                (t) => t.typ !== EnumToken.WhitespaceTokenType && t.typ !== EnumToken.CommentTokenType,
            ) as Token;

            if (token?.typ === EnumToken.ParensTokenType) {
                // @ts-ignore
                const node1 = ((parent as MediaQueryConditionToken).l as ParensToken).chi.find(
                    (t) => t.typ !== EnumToken.WhitespaceTokenType && t.typ !== EnumToken.CommentTokenType,
                ) as MediaQueryConditionToken;
                const node2 = (token as ParensToken).chi.find(
                    (t) => t.typ !== EnumToken.WhitespaceTokenType && t.typ !== EnumToken.CommentTokenType,
                ) as MediaQueryConditionToken;

                if (
                    node1?.typ === EnumToken.MediaQueryConditionTokenType &&
                    node2?.typ === EnumToken.MediaQueryConditionTokenType &&
                    (node1 as MediaQueryConditionToken).op.typ == EnumToken.ColonTokenType &&
                    (node2 as MediaQueryConditionToken).op.typ == EnumToken.ColonTokenType &&
                    // @ts-ignore
                    (node1 as MediaQueryConditionToken).l.typ == EnumToken.IdenTokenType &&
                    // @ts-ignore
                    (node2 as MediaQueryConditionToken).l.typ == EnumToken.IdenTokenType &&
                    // @ts-ignore
                    ((node1 as MediaQueryConditionToken).l as IdentToken).val.startsWith("min-") &&
                    // @ts-ignore
                    ((node2 as MediaQueryConditionToken).l as IdentToken).val.startsWith("max-") &&
                    // @ts-ignore
                    ((node1 as MediaQueryConditionToken).l as IdentToken).val.slice(4) ==
                        // @ts-ignore
                        ((node2 as MediaQueryConditionToken).l as IdentToken).val.slice(4)
                ) {
                    const val1 = (node1 as MediaQueryConditionToken).r.find(
                        (t) => t.typ !== EnumToken.WhitespaceTokenType && t.typ !== EnumToken.CommentTokenType,
                    );
                    const val2 = (node2 as MediaQueryConditionToken).r.find(
                        (t) => t.typ !== EnumToken.WhitespaceTokenType && t.typ !== EnumToken.CommentTokenType,
                    );

                    const replacement = {
                        typ: EnumToken.ParensTokenType,
                        chi: [
                            // @ts-ignore
                            {
                                typ: EnumToken.MediaRangeQueryTokenType,
                                op: {
                                    typ: EnumToken.IdenTokenType,
                                    // @ts-ignore
                                    val: ((node1 as MediaQueryConditionToken).l as IdentToken).val.slice(4),
                                },
                                l: val1,
                                r: val2,
                                [LOC]: value[LOC],
                            } as MediaRangeQueryToken,
                        ],
                    } as ParensToken;

                    // @ts-expect-error
                    const p = parents?.[parents?.indexOf?.(parent) + 1];

                    if (p != null) {
                        replaceNodeOrValue(p, parent, replacement);
                    } else {
                        values.splice(values.indexOf(parent), 1, replacement as Token);
                    }

                    hasUpdates = true;
                    value = replacement;
                }
            }
        }
    }

    return { hasUpdates, values: trimArray(values) };
}

/**
 * Minify at-rule media
 * - remove redundant tokens
 * - generate range queries
 * @param ast
 *
 * @private
 */
function minifyAtRuleMedia(tokens: Token[]): Token[] {
    let hasUpdates: boolean = false;

    const sections = tokens
        .reduce(
            (acc, t) => {
                if (t.typ === EnumToken.CommaTokenType) {
                    acc.push([]);
                } else {
                    acc[acc.length - 1].push(t);
                }

                return acc;
            },
            [[]] as Token[][],
        )
        .reduce(
            (acc, values) => {
                if (acc.has("all")) {
                    return acc;
                }

                const result = transformAtRuleMediaPrelude(values);

                if (result.values.length === 0) {
                    return acc;
                }

                if (result.hasUpdates) {
                    hasUpdates = true;
                }

                acc.set(
                    values.reduce((acc, t) => acc + renderValue(t), ""),
                    result.values,
                );

                return acc;
            },
            new Map() as Map<string, Token[]>,
        );

    if (sections.has("all")) {
        tokens.length = 0;
    } else if (hasUpdates) {
        tokens.length = 0;
        tokens.push(
            ...[...sections.values()].reduce((acc: Token[], t: Token[]) => {
                if (acc.length > 0) {
                    acc.push({
                        typ: EnumToken.CommaTokenType,
                    } as Token);
                }

                acc.push(...t);
                return acc;
            }, [] as Token[]),
        );
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
            curr.splice(0, 2);
        }
    }

    acc.push(curr.join(""));
    return acc;
}

/**
 * Apply minification rules to the ast tree
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

    // @ts-ignore
    if ("chi" in ast && ast.chi.length > 0) {
        const reducer = reduce.bind(ast);

        if (!nestingContent) {
            nestingContent = options.nestingRules && ast.typ == EnumToken.RuleNodeType;
        }

        let i: number = 0;
        let previous: AstNode | null = null;
        let node: AstNode | null = null;
        let nodeIndex: number = -1;

        for (; i < ast.chi!.length; i++) {
            if (ast.chi![i].typ === EnumToken.CommentNodeType) {
                continue;
            }

            while (previous?.typ === EnumToken.CommentNodeType) {
                previous = ast.chi[--nodeIndex];
                continue;
            }

            node = ast.chi![i] as AstNode;

            if (node.typ === EnumToken.AtRuleNodeType && (<AstAtRule>node).nam === "font-face") {
                continue;
            }

            if (node.typ === EnumToken.KeyframesAtRuleNodeType) {
                if (
                    previous?.typ === EnumToken.KeyframesAtRuleNodeType &&
                    (<AstKeyframesAtRule>node).nam === (<AstKeyframesAtRule>previous).nam &&
                    (<AstKeyframesAtRule>node).val === (<AstKeyframesAtRule>previous).val
                ) {
                    ast.chi?.splice(nodeIndex--, 1);
                    previous = (ast?.chi?.[nodeIndex] as AstNode) ?? null;
                    i = nodeIndex;

                    continue;
                }
            } else if (node.typ === EnumToken.KeyFramesRuleNodeType) {
                if (
                    previous?.typ === EnumToken.KeyFramesRuleNodeType &&
                    (<AstKeyFrameRule>node).sel === (<AstKeyFrameRule>previous).sel
                ) {
                    // do not merge keyframes
                    // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@keyframes#resolving_duplicates
                    (<AstKeyFrameRule>previous).chi.push(...(<AstKeyFrameRule>node).chi);

                    ast.chi.splice(i, 1);
                    previous = (ast?.chi?.[nodeIndex] as AstNode) ?? null;
                    i = nodeIndex;

                    continue;
                }

                let k: number;

                for (k = 0; k < (node as AstKeyFrameRule).chi.length; k++) {
                    if ((node as AstKeyFrameRule).chi[k].typ == EnumToken.DeclarationNodeType) {
                        let l: number = ((node as AstKeyFrameRule).chi[k] as AstDeclaration).val.length;

                        while (l--) {
                            if (
                                ((node as AstKeyFrameRule).chi[k] as AstDeclaration).val[l].typ ==
                                EnumToken.ImportantTokenType
                            ) {
                                (node as AstKeyFrameRule).chi.splice(k--, 1);
                                break;
                            }

                            if (
                                [EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(
                                    ((node as AstKeyFrameRule).chi[k] as AstDeclaration).val[l].typ,
                                )
                            ) {
                                continue;
                            }

                            break;
                        }
                    }
                }
            } else if (node.typ == EnumToken.AtRuleNodeType) {
                if ((node as AstAtRule).nam == "media") {
                    if (Array.isArray((node as AstAtRule)[TOKENS])) {
                        const slice = (node as AstAtRule)[TOKENS]!.slice();
                        minifyAtRuleMedia(slice);

                        if (slice.length !== (node as AstAtRule)[TOKENS]!.length) {
                            (node as AstAtRule)[TOKENS]!.length = 0;
                            (node as AstAtRule)[TOKENS]!.push(...slice);
                            (node as AstAtRule).val = slice.reduce(
                                (acc: string, curr: Token, index: number, arr: Token[]): string =>
                                    acc +
                                    (curr.typ === EnumToken.CommentTokenType ||
                                    (curr.typ === EnumToken.WhitespaceTokenType &&
                                        arr[index + 1]?.typ === EnumToken.CommentTokenType &&
                                        (index + 3 < arr.length ||
                                            arr[index + 2]?.typ === EnumToken.WhitespaceTokenType))
                                        ? ""
                                        : renderValue(curr)),
                                "",
                            );
                        }
                    }

                    if (["all", "", null].includes((node as AstAtRule).val)) {
                        ast.chi?.splice(i--, 1, ...node.chi!);
                        continue;
                    }
                } else if ((node as AstAtRule).nam === "import" && Array.isArray((node as AstAtRule)[TOKENS])) {
                    let l: number = 0;
                    let token: Token;

                    for (; l < (node as AstAtRule)[TOKENS]!.length; l++) {
                        token = (node as AstAtRule)[TOKENS]![l];

                        if (
                            token.typ === EnumToken.ParensTokenType ||
                            token.typ === EnumToken.MediaQueryConditionTokenType ||
                            (token.typ === EnumToken.IdenTokenType && "layer" !== (token as IdentToken).val)
                        ) {
                            break;
                        }
                    }

                    if (l < (node as AstAtRule)[TOKENS]!.length) {
                        const slice = (node as AstAtRule)[TOKENS]?.slice(l) as Token[];

                        (node as AstAtRule)[TOKENS]!.splice(l, slice.length, ...minifyAtRuleMedia(slice));
                        (node as AstAtRule).val = trimArray((node as AstAtRule)[TOKENS]!).reduce(
                            (acc: string, curr: Token, index: number, arr: Token[]): string =>
                                acc +
                                (curr.typ === EnumToken.CommentTokenType ||
                                (curr.typ === EnumToken.WhitespaceTokenType &&
                                    arr[index + 1]?.typ === EnumToken.CommentTokenType &&
                                    (index + 3 < arr.length || arr[index + 2].typ === EnumToken.WhitespaceTokenType))
                                    ? ""
                                    : renderValue(curr)),
                            "",
                        );
                    }
                }

                if (
                    previous?.typ == EnumToken.AtRuleNodeType &&
                    (node as AstAtRule).nam != "font-face" &&
                    (<AstAtRule>previous).nam === (<AstAtRule>node).nam &&
                    (<AstAtRule>previous).val === (<AstAtRule>node).val
                ) {
                    if ("chi" in node) {
                        // @ts-ignore
                        previous.chi!.push(...(node as AstAtRule).chi!);

                        if (!hasDeclaration(previous as AstAtRule)) {
                            context.nodes.delete(previous);
                            doMinify(previous, options, recursive, errors, nestingContent, context);
                        }
                    }

                    ast?.chi?.splice(i--, 1);
                    continue;
                }

                if (!hasDeclaration(node as AstAtRule)) {
                    doMinify(node, options, recursive, errors, nestingContent, context);
                }

                previous = node;
                nodeIndex = i;
                continue;
            }

            // @ts-ignore
            else if (node.typ === EnumToken.RuleNodeType) {
                reduceRuleSelector(<AstRule>node);

                let wrapper: AstRule | null = null;
                let match;

                if (options.nestingRules) {
                    if (previous?.typ == EnumToken.RuleNodeType) {
                        reduceRuleSelector(previous as AstRule);

                        // @ts-ignore
                        match = matchSelectors(previous[RAW], node[RAW], ast.typ, errors);

                        if (match != null) {
                            wrapper = wrapNodes(
                                previous as AstRule,
                                node as AstRule,
                                match,
                                ast,
                                reducer,
                                i,
                                nodeIndex,
                            );

                            nodeIndex = i - 1;
                            previous = ast.chi![nodeIndex] as AstRule;
                        }
                    }

                    if (wrapper != null) {
                        while (i < ast.chi!.length) {
                            const nextNode: AstRule = ast.chi![i] as AstRule;

                            if (nextNode.typ != EnumToken.RuleNodeType) {
                                break;
                            }

                            reduceRuleSelector(<AstRule>nextNode);
                            match = matchSelectors(wrapper[RAW] as string[][], nextNode[RAW] as string[][]);

                            if (match == null) {
                                break;
                            }

                            wrapper = wrapNodes(wrapper, nextNode, match, ast, reducer, i, nodeIndex);
                        }

                        nodeIndex = --i;
                        previous = ast.chi![nodeIndex] as AstRule;
                        doMinify(wrapper as AstRule, options, recursive, errors, nestingContent, context);
                        continue;
                    }
                    // @ts-ignore
                    else if (
                        node[OPTIMIZED] != null &&
                        // @ts-ignore
                        node[OPTIMIZED].match &&
                        // @ts-ignore
                        node[OPTIMIZED].selector.length > 1
                    ) {
                        // @ts-ignore
                        wrapper = {
                            ...node,
                            chi: [],
                            sel: node[OPTIMIZED].optimized[0],
                            [RAW]: [[node[OPTIMIZED].optimized[0]]],
                        };

                        // @ts-ignore
                        node.sel = node[OPTIMIZED].selector.reduce(reducer, []).join(",");
                        // @ts-ignore
                        node[RAW] = node[OPTIMIZED].selector.slice();
                        // @ts-ignore
                        wrapper.chi.push(node);
                        // @ts-ignore
                        ast.chi.splice(i, 1, wrapper);
                        node = wrapper as AstRule;
                    } else if (node[OPTIMIZED]?.reducible) {
                        if (node[OPTIMIZED].optimized.length === 1) {
                            const sel1 =
                                node[OPTIMIZED].optimized[0] +
                                ":is(" +
                                node[OPTIMIZED].selector.reduce(reducer, []).join(",") +
                                ")";
                            const sel2 = node[OPTIMIZED].selector.reduce(
                                (acc: string, curr: string[]) =>
                                    (acc.length > 0 ? acc + "," : "") + node[OPTIMIZED].optimized[0] + curr.join(""),
                                "",
                            );

                            node.sel = sel1.length < sel2.length ? sel1 : sel2;
                        } else if (node[OPTIMIZED].optimized.length === 0) {
                            const testIdent = /^[a-zA-Z]/;
                            node.sel = node[OPTIMIZED].selector.reduce(
                                (acc: string, curr: string[]) =>
                                    (acc.length > 0 ? acc + "," : "") +
                                    (nestingContent && testIdent.test(curr[0]) ? "& " : "") +
                                    curr.join(""),
                                "",
                            );
                        }
                    }
                }

                // @ts-ignore
                else if (node[OPTIMIZED]?.match) {
                    let wrap: boolean = true;
                    // @ts-ignore
                    const selector: string[][] = node[OPTIMIZED].selector.reduce(
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
                    const optimized = (node as AstRule)![OPTIMIZED]!.optimized.slice() as string[];

                    if (optimized.length > 1) {
                        const check = optimized.at(-2) as string;

                        if (!combinators.includes(check)) {
                            let last = optimized.pop() as string;
                            wrap = false;
                            rule =
                                optimized.join("") +
                                `:is(${selector
                                    .map((s) => {
                                        if (s[0] == "&") {
                                            s.splice(0, 1, last);
                                        } else {
                                            s.unshift(last);
                                        }

                                        return s.join("");
                                    })
                                    .join(",")})`;
                        }
                    }

                    if (rule == null) {
                        rule = selector
                            .map((s: string[]): string => {
                                if (s[0] == "&") {
                                    s.splice(0, 1, ...(node as AstRule)![OPTIMIZED]!.optimized);
                                }

                                return s.join("");
                            })
                            .join(",");
                    }

                    let sel: string = wrap ? (node as AstRule)![OPTIMIZED]!.optimized.join("") + `:is(${rule})` : rule;

                    if (sel.length < (<AstRule>node).sel.length) {
                        (<AstRule>node).sel = sel;
                    }
                } else if (node[OPTIMIZED]?.reducible) {
                    if (node[OPTIMIZED].optimized.length === 1) {
                        const sel1 =
                            node[OPTIMIZED].optimized[0] +
                            ":is(" +
                            node[OPTIMIZED].selector.reduce(reducer, []).join(",") +
                            ")";
                        const sel2 = node[OPTIMIZED].selector.reduce(
                            (acc: string, curr: string[]) =>
                                (acc.length > 0 ? acc + "," : "") + node[OPTIMIZED].optimized[0] + curr.join(""),
                            "",
                        );

                        node.sel = sel1.length < sel2.length ? sel1 : sel2;
                    } else if (node[OPTIMIZED].optimized.length === 0) {
                        const testIdent = /^[a-zA-Z]/;
                        node.sel = node[OPTIMIZED].selector.reduce(
                            (acc: string, curr: string[]) =>
                                (acc.length > 0 ? acc + "," : "") +
                                (nestingContent && testIdent.test(curr[0]) ? "& " : "") +
                                curr.join(""),
                            "",
                        );
                    }
                } else if (node[OPTIMIZED]?.optimized.length > 0) {
                    const sel = node[OPTIMIZED].optimized.join("");

                    if (sel.length < node.sel.length) {
                        node.sel = sel;
                        node[RAW] = [node[OPTIMIZED].optimized.slice()];
                    }
                }

                doMinify(node, options, recursive, errors, nestingContent, context);
            }

            if (previous != null) {
                if ("chi" in previous && "chi" in node) {
                    if (previous.typ === node.typ) {
                        let shouldMerge: boolean = true;
                        let k: number = previous.chi!.length;

                        while (k-- > 0) {
                            if (
                                previous.chi![k].typ === EnumToken.CommentNodeType ||
                                previous.chi![k].typ === EnumToken.InvalidRuleNodeType ||
                                previous.chi![k].typ === EnumToken.InvalidRuleNodeType
                            ) {
                                continue;
                            }

                            shouldMerge = previous.chi![k].typ === EnumToken.DeclarationNodeType;
                            break;
                        }

                        if (shouldMerge) {
                            if (
                                ((node.typ === EnumToken.RuleNodeType ||
                                    node.typ === EnumToken.KeyFramesRuleNodeType) &&
                                    (node as AstRule).sel === (previous as AstRule).sel) ||
                                (node.typ == EnumToken.AtRuleNodeType &&
                                    (node as AstAtRule).nam !== "font-face" &&
                                    (node as AstAtRule).nam === (previous as AstAtRule).nam)
                            ) {
                                node.chi.unshift(...previous.chi);

                                doMinify(node, options, recursive, errors, nestingContent, context);

                                ast.chi!.splice(nodeIndex, 1);

                                previous = ast.chi![--i] as AstNode;
                                nodeIndex = i;

                                continue;
                            } else if (
                                node.typ == previous?.typ &&
                                [EnumToken.KeyFramesRuleNodeType, EnumToken.RuleNodeType].includes(node.typ)
                            ) {
                                const intersect = diff(previous as AstRule, node as AstRule, reducer, options);

                                if (intersect != null) {
                                    if (intersect.node1.chi.length == 0) {
                                        ast.chi!.splice(i--, 1);
                                    } else {
                                        ast.chi!.splice(i--, 1, intersect.node1);
                                    }

                                    if (intersect.node2.chi.length == 0) {
                                        if (intersect.result != null) {
                                            ast.chi!.splice(nodeIndex, 1, intersect.result);
                                        } else {
                                            ast.chi!.splice(nodeIndex, 1);
                                        }
                                        i--;

                                        if (nodeIndex == i) {
                                            nodeIndex = i;
                                        }
                                    } else {
                                        if (intersect.result != null) {
                                            ast.chi!.splice(nodeIndex, 1, intersect.result, intersect.node2);
                                        } else {
                                            ast.chi!.splice(nodeIndex, 1, intersect.node2);
                                        }
                                        i = (nodeIndex ?? 0) + 1;
                                    }

                                    if (node != ast.chi![i]) {
                                        node = ast.chi![i] as AstNode;
                                    }

                                    previous = intersect.result;
                                    nodeIndex = i;
                                }
                            }
                        }
                    }

                    if (recursive && previous != null && previous != node) {
                        if (!hasDeclaration(previous as AstRule)) {
                            doMinify(previous, options, recursive, errors, nestingContent, context);
                        }
                    }
                }
            }

            if (
                !nestingContent &&
                previous != null &&
                previous.typ == EnumToken.RuleNodeType &&
                (previous as AstRule).sel.includes("&")
            ) {
                fixSelector(previous as AstRule);
            }

            previous = node;
            nodeIndex = i;
        }

        if (recursive && node != null && "chi" in node) {
            if (
                node.typ == EnumToken.KeyframesAtRuleNodeType ||
                !(node as AstAtRule).chi!.some((n: AstNode) => n.typ == EnumToken.DeclarationNodeType)
            ) {
                if (!(node.typ == EnumToken.AtRuleNodeType && (<AstAtRule>node).nam != "font-face")) {
                    doMinify(node, options, recursive, errors, nestingContent, context);
                }
            }
        }

        if (
            !nestingContent &&
            node != null &&
            node.typ == EnumToken.RuleNodeType &&
            (node as AstRule).sel.includes("&")
        ) {
            fixSelector(node as AstRule);
        }
    }

    return ast;
}

/**
 * Check if a rule has a declaration
 * @param node
 *
 * @private
 */
function hasDeclaration(node: AstRule | AstAtRule): boolean {
    // @ts-ignore
    for (let i = 0; i < node.chi?.length; i++) {
        // @ts-ignore
        if (node.chi[i].typ == EnumToken.CommentNodeType) {
            continue;
        }
        // @ts-ignore
        return node.chi[i].typ == EnumToken.DeclarationNodeType;
    }

    return true;
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
            optimized.pop();
            continue;
        }

        break;
    }

    selector.forEach((selector: string[]) => selector.splice(0, optimized.length));

    let reducible: boolean = optimized.length == 1;

    if (optimized[0] == "&") {
        if (optimized[1] == " ") {
            optimized.splice(0, 2);
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

                acc.push(...curr);

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
 * @param node
 *
 * @private
 */
function fixSelector(node: AstRule): void {
    if (node.sel.includes("&")) {
        const attributes: Token[] = [...tokenize(node.sel as string)].map((t) => t.token) as Token[]; // parseString(node.sel);

        for (const attr of walkValues(attributes)) {
            if (
                attr.value.typ == EnumToken.PseudoClassFuncTokenType &&
                (attr.value as PseudoClassFunctionToken).val == ":is"
            ) {
                let i: number = (attr.value as PseudoClassFunctionToken).chi.length;

                while (i--) {
                    if ((attr.value as PseudoClassFunctionToken).chi[i].typ == EnumToken.NestingSelectorTokenType) {
                        (attr.value as PseudoClassFunctionToken).chi.splice(i, 1);
                    }
                }
            }
        }

        node.sel = attributes.reduce((acc: string, curr: Token) => acc + renderValue(curr), "");
    }
}

/**
 * Wrap nodes
 * @param previous
 * @param node
 * @param match
 * @param ast
 * @param reducer
 * @param i
 * @param nodeIndex
 *
 * @private
 */
function wrapNodes(
    previous: AstRule,
    node: AstRule,
    match: MatchedSelector,
    ast: AstNode,
    reducer: Function,
    i: number,
    nodeIndex: number,
): AstRule {
    // @ts-ignore
    let pSel: string = match.selector1.reduce(reducer, []).join(",");

    // @ts-ignore
    let nSel: string = match.selector2.reduce(reducer, []).join(",");

    const wrapper = {
        ...previous,
        chi: [],
        // @ts-ignore
        sel: match.match.reduce(reducer, []).join(","),
        [RAW]: match.match.map((t) => t.slice()),
    } as AstRule;

    if (pSel == "&" || pSel === "") {
        wrapper.chi.push(...previous.chi);

        if (nSel == "&" || nSel === "") {
            wrapper.chi.push(...node.chi);
        } else {
            wrapper.chi.push(node);
        }
    } else {
        wrapper.chi.push(previous, node);
    }

    (ast as AstRule).chi!.splice(i, 1, wrapper);
    (ast as AstRule).chi!.splice(nodeIndex, 1);

    previous.sel = pSel;
    previous[RAW] = match.selector1;
    node.sel = nSel;
    node[RAW] = match.selector2;

    reduceRuleSelector(wrapper);
    return wrapper;
}

/**
 * Diff nodes
 * @param n1
 * @param n2
 * @param reducer
 * @param options
 *
 * @private
 */
function diff(n1: AstRule, n2: AstRule, reducer: Function, options: ParserOptions = {}) {
    if (!("cache" in options)) {
        options.cache = new WeakMap<AstNode, string>();
    }

    let node1: AstRule = n1;
    let node2: AstRule = n2;
    let exchanged: boolean = false;

    if (node1.chi.length > node2.chi.length) {
        const t: AstRule = node1;
        node1 = node2;
        node2 = t;
        exchanged = true;
    }

    let i: number = node1.chi.length;
    let j: number = node2.chi.length;

    const raw1: RawSelectorTokens = <RawSelectorTokens>node1[RAW];
    const raw2: RawSelectorTokens = <RawSelectorTokens>node2[RAW];

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

    const css1: string = options.cache!.get(node1) as string;
    const css2: string = options.cache!.get(node2) as string;

    node1 = { ...node1, chi: node1.chi.slice() };
    node2 = { ...node2, chi: node2.chi.slice() };

    if (css1 != null) {
        options.cache!.set(node1, css1);
    }

    if (css2 != null) {
        options.cache!.set(node2, css2);
    }

    if (raw1 != null) {
        node1[RAW] = raw1;
    }

    if (raw2 != null) {
        node2[RAW] = raw2;
    }

    const intersect: AstDeclaration[] = [];

    while (i--) {
        if (node1.chi[i].typ == EnumToken.CommentNodeType) {
            continue;
        }

        j = node2.chi.length;

        while (j--) {
            if (node2.chi[j].typ == EnumToken.CommentNodeType) {
                continue;
            }

            if ((<AstDeclaration>node1.chi[i]).nam == (<AstDeclaration>node2.chi[j]).nam) {
                if (node1.chi[i].typ == node2.chi[j].typ && eq(node1.chi[i], node2.chi[j])) {
                    intersect.push(node1.chi[i] as AstDeclaration);
                    node1.chi.splice(i, 1);
                    node2.chi.splice(j, 1);

                    options.cache!.delete(node1);
                    options.cache!.delete(node2);
                    break;
                }
            }
        }
    }

    const result =
        intersect.length === 0 && (node1.chi.length > 0 || node2.chi.length > 0)
            ? null
            : {
                  ...node1,
                  // @ts-ignore
                  sel: [
                      ...new Set(
                          splitRule(node1.sel)
                              .concat(splitRule(node2.sel))
                              .map((s) => s.join("")),
                      ),
                  ].join(","),
                  // @ts-ignore
                  chi: intersect.reverse(),
              };

    if (
        result == null ||
        [n1, n2].reduce((acc: number, curr: AstRule): number => {
            let css: string = options.cache!.get(curr) as string;

            if (css == null) {
                css = doRender(curr, options).code;
                options.cache!.set(curr, css);
            }

            return curr.chi.length == 0 ? acc : acc + css.length;
        }, 0) <=
            [node1, node2, result].reduce((acc: number, curr: AstRule): number => {
                const css = doRender(curr, options).code;

                return curr.chi.length == 0 ? acc : acc + css.length;
            }, 0)
    ) {
        if (node1.chi.length != 0 && node2.chi.length != 0) {
            return null;
        }
    }

    if (result != null) {
        result[TOKENS] = null;
        result[RAW] = null;
        const optimized = optimizeSelector(splitRule(result.sel));

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
            const sel = match + ":is(" + replaceCompound(rule, match) + ")";

            if (sel.length < result.sel.length) {
                result.sel = sel;
            }
        }
    }

    return { result, node1: exchanged ? node2 : node1, node2: exchanged ? node1 : node2 };
}

/**
 * Reduce rule selector
 * @param node
 *
 * @private
 */
function reduceRuleSelector(node: AstRule) {
    if (node[RAW] == null) {
        node[RAW] = splitRule(node.sel);
    }

    let optimized: OptimizedSelector = optimizeSelector(
        node[RAW]!.reduce(
            (acc, curr) => {
                acc.push(curr.slice());
                return acc;
            },
            <string[][]>[],
        ),
    ) as OptimizedSelector;

    if (optimized != null) {
        node[OPTIMIZED] = optimized;
    }

    if (optimized != null && optimized.match && optimized.reducible && optimized.selector.length > 1) {
        for (const selector of optimized.selector) {
            if (
                selector.length > 1 &&
                selector[0] == "&" &&
                (combinators.includes(selector[1]) || !/^[a-zA-Z:]/.test(selector[1]))
            ) {
                selector.shift();
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
                acc.push(...curr);
            }

            return acc;
        }, []);
        const raw: string[][] = [
            [optimized.optimized[0], reduced.length === 1 ? reduced.join("") : ":is("].concat(reduced).concat(")"),
        ];

        const sel: string = raw[0].join("");

        if (sel.length < node.sel.length) {
            node.sel = sel;
            node[RAW] = raw;
        }
    }
}
