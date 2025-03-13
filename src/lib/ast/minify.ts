import {parseString} from "../parser/index.ts";
import {eq} from "../parser/utils/eq.ts";
import {replaceCompound} from './expand.ts';
import {doRender, renderToken} from "../renderer/index.ts";
import * as allFeatures from "./features/index.ts";
import {walkValues} from "./walk.ts";
import type {
    AstAtRule,
    AstDeclaration,
    AstKeyframAtRule,
    AstKeyFrameRule,
    AstNode,
    AstRule,
    AstRuleStyleSheet,
    ErrorDescription,
    LiteralToken,
    MatchedSelector,
    MinifyFeature,
    MinifyFeatureOptions,
    OptimizedSelector,
    ParserOptions,
    PseudoClassFunctionToken,
    RawSelectorTokens,
    Token
} from "../../@types/index.d.ts";
import {EnumToken} from "./types.ts";
import {isFunction, isIdent, isIdentStart, isWhiteSpace} from "../syntax/index.ts";

export const combinators: string[] = ['+', '>', '~', '||', '|'];
export const definedPropertySettings = {configurable: true, enumerable: false, writable: true};
const notEndingWith: string[] = ['(', '['].concat(combinators);
// @ts-ignore
const features: MinifyFeature[] = <MinifyFeature[]>Object.values(allFeatures).sort((a, b) => a.ordering - b.ordering)

/**
 * minify ast
 * @param ast
 * @param options
 * @param recursive
 * @param errors
 * @param nestingContent
 * @param context
 */
export function minify(ast: AstNode, options: ParserOptions | MinifyFeatureOptions = {}, recursive: boolean = false, errors?: ErrorDescription[], nestingContent?: boolean, context: {
    [key: string]: any
} = {}): AstNode {

    if (!('nodes' in context)) {

        context.nodes = <Set<AstNode>>new Set;
    }

    if (context.nodes.has(ast)) {

        return ast;
    }

    context.nodes.add(ast);

    if (!('features' in <MinifyFeatureOptions>options)) {

        // @ts-ignore
        options = <MinifyFeatureOptions>{
            removeDuplicateDeclarations: true,
            computeShorthand: true,
            computeCalcExpression: true,
            removePrefix: false,
            features: <Function[]>[], ...options
        };

        // @ts-ignore
        for (const feature of features) {

            feature.register(options);
        }
    }

    function reducer(acc: string[], curr: string[], index: number, array: string[][]): string[] {

        // trim :is()
        if (array.length == 1 && array[0][0] == ':is(' && array[0].at(-1) == ')') {

            curr = curr.slice(1, -1);
        }

        if (curr[0] == '&') {

            if (curr[1] == ' ' && !isIdent(curr[2]) && !isFunction(curr[2])) {

                curr.splice(0, 2);
            } else if (combinators.includes(curr[1])) {

                curr.shift();
            }
        } else if (ast.typ == EnumToken.RuleNodeType && (isIdent(curr[0]) || isFunction(curr[0]))) {

            curr.unshift('&', ' ');
        }

        acc.push(curr.join(''));
        return acc;
    }

    // @ts-ignore
    if ('chi' in ast && ast.chi.length > 0) {

        if (!nestingContent) {

            nestingContent = options.nestingRules && ast.typ == EnumToken.RuleNodeType;
        }

        let i: number = 0;
        let previous: AstNode | null = null;
        let node: AstNode;
        let nodeIndex: number = -1;
        // @ts-ignore
        for (; i < ast.chi.length; i++) {

            // @ts-ignore
            if (ast.chi[i].typ == EnumToken.CommentNodeType) {
                continue;
            }

            // @ts-ignore
            node = ast.chi[i];

            // @ts-ignore
            if (previous == node) {

                // @ts-ignore
                ast.chi.splice(i--, 1);
                continue;
            }

            if (node.typ == EnumToken.AtRuleNodeType && (<AstAtRule>node).nam == 'font-face') {
                continue;
            }

            if (node.typ == EnumToken.KeyframeAtRuleNodeType) {

                if (
                    previous?.typ == EnumToken.KeyframeAtRuleNodeType &&
                    (<AstKeyframAtRule>node).nam == (<AstKeyframAtRule>previous).nam &&
                    (<AstKeyframAtRule>node).val == (<AstKeyframAtRule>previous).val
                ) {

                    ast.chi?.splice(nodeIndex--, 1);
                    previous = ast?.chi?.[nodeIndex] as AstNode ?? null;
                    i = nodeIndex;

                    continue;
                }

                if ((<AstKeyframAtRule>node).chi.length > 0) {

                    minify(node, options, true, errors, nestingContent, context);
                }
            }

            if (node.typ == EnumToken.KeyFrameRuleNodeType) {

                if (previous?.typ == EnumToken.KeyFrameRuleNodeType &&
                    (<AstKeyFrameRule>node).sel == (<AstKeyFrameRule>previous).sel) {

                    (<AstKeyFrameRule>previous).chi.push(...(<AstKeyFrameRule>node).chi);

                    // @ts-ignore
                    ast.chi.splice(i--, 1);
                    continue;
                }

                let k: number;

                for (k = 0; k < node.chi.length; k++) {

                    if (node.chi[k].typ == EnumToken.DeclarationNodeType) {

                        let l: number = (node.chi[k] as AstDeclaration).val.length;

                        while (l--) {

                            if ((node.chi[k] as AstDeclaration).val[l].typ == EnumToken.ImportantTokenType) {

                                node.chi.splice(k--, 1);
                                break;
                            }

                            if ([EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes((node.chi[k] as AstDeclaration).val[l].typ)) {

                                continue;
                            }

                            break;
                        }
                    }
                }
            }

            if (node.typ == EnumToken.AtRuleNodeType) {

                // @ts-ignore
                if ((<AstAtRule>node).nam == 'media' && ['all', '', null].includes((<AstAtRule>node).val)) {

                    // @ts-ignore
                    ast.chi?.splice(i, 1, ...node.chi);
                    i--;
                    continue;
                }

                // @ts-ignore
                if (previous?.typ == EnumToken.AtRuleNodeType &&
                    (<AstAtRule>previous).nam == (<AstAtRule>node).nam &&
                    (<AstAtRule>previous).val == (<AstAtRule>node).val) {

                    if ('chi' in node) {

                        // @ts-ignore
                        previous.chi.push(...node.chi);
                    }

                    ast?.chi?.splice(i--, 1);
                    continue;
                }

                // @ts-ignore
                if (!hasDeclaration(node)) {

                    minify(node, options, recursive, errors, nestingContent, context);
                }

                previous = node;
                nodeIndex = i;
                continue;
            }

            // @ts-ignore
            if (node.typ == EnumToken.RuleNodeType) {

                reduceRuleSelector(<AstRule>node);

                let wrapper: AstRule;
                let match;

                // @ts-ignore
                if (options.nestingRules) {

                    // @ts-ignore
                    if (previous?.typ == EnumToken.RuleNodeType) {

                        // @ts-ignore
                        reduceRuleSelector(<AstRule>previous);

                        // @ts-ignore
                        match = matchSelectors(previous.raw, node.raw, ast.typ, errors);

                        // @ts-ignore
                        if (match != null) {

                            // @ts-ignore
                            wrapper = wrapNodes(previous, node, match, ast, reducer, i, nodeIndex);
                            nodeIndex = i - 1;
                            // @ts-ignore
                            previous = ast.chi[nodeIndex];
                        }
                    }

                    // @ts-ignore
                    if (wrapper != null) {
                        // @ts-ignore
                        while (i < ast.chi.length) {

                            // @ts-ignore
                            const nextNode: AstRule = <AstRule>ast.chi[i];

                            // @ts-ignore
                            if (nextNode.typ != EnumToken.RuleNodeType) {

                                break;
                            }

                            reduceRuleSelector(<AstRule>nextNode);

                            // @ts-ignore
                            match = matchSelectors(wrapper.raw, nextNode.raw, ast.typ, errors);

                            // @ts-ignore
                            if (match == null) {

                                break;
                            }

                            // @ts-ignore
                            wrapper = wrapNodes(wrapper, nextNode, match, ast, reducer, i, nodeIndex);
                        }

                        nodeIndex = --i;
                        // @ts-ignore
                        previous = ast.chi[nodeIndex];
                        minify(<AstRule>wrapper, options, recursive, errors, nestingContent, context);
                        continue;
                    }
                    // @ts-ignore
                    else if (node.optimized != null &&
                        // @ts-ignore
                        node.optimized.match &&
                        // @ts-ignore
                        node.optimized.selector.length > 1) {
                        // @ts-ignore
                        wrapper = {...node, chi: [], sel: node.optimized.optimized[0]};
                        // @ts-ignore
                        Object.defineProperty(wrapper, 'raw', {
                            ...definedPropertySettings,
                            // @ts-ignore
                            value: [[node.optimized.optimized[0]]]
                        });

                        // @ts-ignore
                        node.sel = node.optimized.selector.reduce(reducer, []).join(',');
                        // @ts-ignore
                        node.raw = node.optimized.selector.slice();
                        // @ts-ignore
                        wrapper.chi.push(node);
                        // @ts-ignore
                        ast.chi.splice(i, 1, wrapper);
                        node = wrapper;
                    }
                }

                // @ts-ignore
                else if (node.optimized?.match) {

                    let wrap: boolean = true;
                    // @ts-ignore
                    const selector: string[][] = node.optimized.selector.reduce((acc, curr) => {

                        if (curr[0] == '&' && curr.length > 1) {

                            if (curr[1] == ' ') {

                                curr.splice(0, 2);
                            } else {

                                if (ast.typ != EnumToken.RuleNodeType && combinators.includes(curr[1])) {

                                    wrap = false;
                                } else {

                                    curr.splice(0, 1);
                                }
                            }
                        } else if (combinators.includes(curr[0])) {

                            curr.unshift('&');
                            wrap = false;
                        }

                        // @ts-ignore
                        acc.push(curr);
                        return acc;

                    }, []);

                    if (!wrap) {

                        wrap = selector.some((s: string[]) => s[0] != '&');
                    }

                    let rule: string = selector.map(s => {

                        if (s[0] == '&') {

                            // @ts-ignore
                            s[0] = node.optimized.optimized[0];
                        }

                        return s.join('');
                    }).join(',');

                    // @ts-ignore
                    let sel: string = wrap ? node.optimized.optimized.join('') + `:is(${rule})` : rule;

                    if (rule.includes('&')) {

                        // @ts-ignore
                        rule = replaceCompound(rule, node.optimized.optimized[0]);
                    }

                    if (sel.length < (<AstRule>node).sel.length) {

                        (<AstRule>node).sel = sel;
                    }
                }
            }

            // @ts-ignore
            if (previous != null) {

                // @ts-ignore
                if ('chi' in previous && ('chi' in node)) {

                    // @ts-ignore
                    if (previous.typ == node.typ) {

                        let shouldMerge: boolean = true;
                        // @ts-ignore
                        let k: number = previous.chi.length;

                        while (k-- > 0) {
                            // @ts-ignore
                            if (previous.chi[k].typ == EnumToken.CommentNodeType) {
                                continue;
                            }
                            // @ts-ignore
                            shouldMerge = previous.chi[k].typ == EnumToken.DeclarationNodeType;
                            break;
                        }

                        if (shouldMerge) {
                            // @ts-ignore
                            if (((node.typ == EnumToken.RuleNodeType || node.typ == EnumToken.KeyFrameRuleNodeType) && node.sel == previous.sel) ||
                                // @ts-ignore
                                (node.typ == EnumToken.AtRuleNodeType) && node.val != 'font-face' && node.val == previous.val) {

                                // @ts-ignore
                                node.chi.unshift(...previous.chi);
                                // @ts-ignore
                                ast.chi.splice(nodeIndex, 1);
                                // @ts-ignore
                                if (!hasDeclaration(node)) {
                                    // @ts-ignore
                                    // minifyRule(node, <MinifyOptions>options, ast, context);
                                    // } else {
                                    minify(node, options, recursive, errors, nestingContent, context);
                                }

                                i--;
                                previous = node;
                                nodeIndex = i;
                                continue;
                            } else if (node.typ == previous?.typ && [EnumToken.KeyFrameRuleNodeType, EnumToken.RuleNodeType].includes(node.typ)) {

                                const intersect = diff(<AstRule>previous, <AstRule>node, reducer, options);

                                if (intersect != null) {

                                    if (intersect.node1.chi.length == 0) {
                                        // @ts-ignore
                                        ast.chi.splice(i--, 1);
                                        // @ts-ignore
                                        // node = ast.chi[i];
                                    } else {
                                        // @ts-ignore
                                        ast.chi.splice(i--, 1, intersect.node1);
                                        // node = ast.chi intersect.node1;
                                    }

                                    if (intersect.node2.chi.length == 0) {
                                        // @ts-ignore
                                        ast.chi.splice(nodeIndex, 1, intersect.result);

                                        i--;

                                        // @ts-ignore
                                        if (nodeIndex == i) {

                                            nodeIndex = i;
                                        }

                                    } else {

                                        // @ts-ignore
                                        ast.chi.splice(nodeIndex, 1, intersect.result, intersect.node2);
                                        // @ts-ignore
                                        i = (nodeIndex ?? 0) + 1;
                                    }

                                    reduceRuleSelector(intersect.result);

                                    // @ts-ignore
                                    if (node != ast.chi[i]) {

                                        // @ts-ignore
                                        node = ast.chi[i];
                                    }

                                    previous = intersect.result;
                                    nodeIndex = i;
                                }
                            }
                        }
                    }

                    // @ts-ignore
                    if (recursive && previous != node) {

                        // @ts-ignore
                        if (!hasDeclaration(previous)) {
                            // @ts-ignore
                            // minifyRule(previous, <MinifyOptions>options, ast, context);
                            // } else {

                            minify(previous, options, recursive, errors, nestingContent, context);
                        }
                    }
                } else {

                    if ('chi' in previous) {

                        // @ts-ignore
                        if (!hasDeclaration(previous)) {

                            // @ts-ignore
                            // minifyRule(previous, <MinifyOptions>options, ast, context);
                            // } else {

                            minify(previous, options, recursive, errors, nestingContent, context);
                        }
                    }
                }
            }

            // else if ('chi' in node) {
            //
            //     minify(node, options, recursive, errors, nestingContent, context);
            // }

            if (!nestingContent &&
                // @ts-ignore
                previous != null &&
                // previous.optimized != null &&
                previous.typ == EnumToken.RuleNodeType &&
                (<AstRule>previous).sel.includes('&')) {

                fixSelector((<AstRule>previous));
            }

            previous = node;
            nodeIndex = i;
        }

        // @ts-ignore
        if (recursive && node != null && ('chi' in node)) {

            // @ts-ignore
            if (node.typ == EnumToken.KeyframeAtRuleNodeType || !node.chi.some(n => n.typ == EnumToken.DeclarationNodeType)) {

                // @ts-ignore
                if (!(node.typ == EnumToken.AtRuleNodeType && (<AstAtRule>node).nam != 'font-face')) {

                    minify(node, options, recursive, errors, nestingContent, context);
                }
            }
        }

        if (!nestingContent &&
            // @ts-ignore
            node != null &&
            // previous.optimized != null &&
            node.typ == EnumToken.RuleNodeType &&
            (<AstRule>node).sel.includes('&')) {

            fixSelector((<AstRule>node));
        }
    }

    if (ast.typ == EnumToken.StyleSheetNodeType) {

        let parent: AstRule | AstAtRule | AstRuleStyleSheet;
        let parents: Array<AstRule | AstAtRule | AstRuleStyleSheet> = [<AstRuleStyleSheet>ast];

        while (parents.length > 0) {

            parent = <AstRule | AstAtRule | AstRuleStyleSheet>parents.shift();

            // @ts-ignore
            for (let k = 0; k < parent.chi.length; k++) {

                // @ts-ignore
                const node = parent.chi[k];

                if (!('chi' in node) || node.typ == EnumToken.StyleSheetNodeType || (node.typ == EnumToken.AtRuleNodeType && (<AstAtRule>node).nam == 'font-face')) {

                    continue;
                }

                // @ts-ignore
                if (<AstRule | AstAtRule>node.chi.length > 0) {

                    parents.push(<AstRule | AstAtRule | AstRuleStyleSheet>node);

                    Object.defineProperty(node, 'parent', {...definedPropertySettings, value: parent});

                    for (const feature of (<MinifyFeatureOptions>options).features) {

                        feature.run(<AstRule | AstAtRule>node, options, <AstRule | AstAtRule | AstRuleStyleSheet>parent, context);
                    }
                }

                // @ts-ignore
                if (options.removeEmpty && node.chi.length == 0) {

                    // @ts-ignore
                    parent.chi.splice(k, 1);
                    k--;
                }
            }
        }

        for (const feature of (<MinifyFeatureOptions>options).features) {

            if ('cleanup' in feature) {

                // @ts-ignore
                feature.cleanup(<AstRuleStyleSheet>ast, options, context);
            }
        }
    }

    return ast;
}

function hasDeclaration(node: AstRule): boolean {

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

function reduceSelector(selector: string[][]): OptimizedSelector | null {

    if (selector.length == 0) {
        return null;
    }

    selector = selector.reduce((acc: string[][], curr: string[]) => {

        // @ts-ignore
        if (curr.length > 0 && curr.at(-1).startsWith(':is(')) {

            // @ts-ignore
            const rules = splitRule(curr.at(-1).slice(4, -1)).map(x => {

                if (x[0] == '&' && x.length > 1) {

                    return x.slice(x[1] == ' ' ? 2 : 1);
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


    }, [] as string[][]);

    const optimized: string[] = [];
    const k: number = selector.reduce((acc: number, curr: string[]): number => acc == 0 ? curr.length : (curr.length == 0 ? acc : Math.min(acc, curr.length)), 0);
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

        if ((last == ' ' || combinators.includes(<string>last))) {

            optimized.pop();
            continue;
        }

        break;
    }

    selector.forEach((selector: string[]) => selector.splice(0, optimized.length));

    // combinator
    if (combinators.includes(<string>optimized.at(-1))) {
        const combinator: string = <string>optimized.pop();
        selector.forEach((selector: string[]) => selector.unshift(combinator));
    }

    let reducible: boolean = optimized.length == 1;

    if (optimized[0] == '&') {

        if (optimized[1] == ' ') {

            optimized.splice(0, 2);
        }
    }

    if (optimized.length == 0 ||
        (optimized[0].charAt(0) == '&' ||
            selector.length == 1)) {

        return {
            match: false,
            optimized,
            selector: selector.map((selector: string[]): string[] => selector[0] == '&' && selector[1] == ' ' ? selector.slice(2) : (selector)),
            reducible: selector.length > 1 && selector.every((selector: string[]) => !combinators.includes(selector[0]))
        };
    }

    return {
        match: true,
        optimized,
        selector: selector.reduce((acc: string[][], curr: string[]) => {

            let hasCompound: boolean = true;

            if (hasCompound && curr.length > 0) {

                hasCompound = !['&'].concat(combinators).includes(curr[0].charAt(0));
            }

            // @ts-ignore
            if (hasCompound && curr[0] == ' ') {

                hasCompound = false;
                curr.unshift('&');
            }

            if (curr.length == 0) {
                curr.push('&');
                hasCompound = false;
            }

            if (reducible) {
                const chr = curr[0].charAt(0);
                // @ts-ignore
                reducible = chr == '.' || chr == ':' || isIdentStart(chr.codePointAt(0));
            }

            acc.push(hasCompound ? ['&'].concat(curr) : curr);
            return acc;
        }, <string[][]>[]),
        reducible: selector.every((selector: string[]) => !['>', '+', '~', '&'].includes(selector[0]))
    };
}

/**
 * split selector string
 * @param buffer
 */
export function splitRule(buffer: string): string[][] {

    const result: string[][] = [[]];
    let str: string = '';

    for (let i = 0; i < buffer.length; i++) {

        let chr: string = buffer.charAt(i);

        if (isWhiteSpace(chr.charCodeAt(0))) {

            let k: number = i;

            while (k + 1 < buffer.length) {

                if (isWhiteSpace(buffer[k + 1].charCodeAt(0))) {

                    k++;
                    continue;
                }

                break;
            }

            if (str !== '') {

                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }

            // @ts-ignore
            if (result.at(-1).length > 0) {

                // @ts-ignore
                result.at(-1).push(' ');
            }

            i = k;
            continue;
        }

        if (chr == ',') {

            if (str !== '') {
                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }

            result.push([]);
            continue;
        }

        if (chr == ':') {

            if (str !== '') {
                // @ts-ignore
                result.at(-1).push(str);
                str = '';
            }

            if (buffer.charAt(i + 1) == ':') {

                chr += buffer.charAt(++i);
            }

            str += chr;
            continue;
        }

        str += chr;
        if (chr == '\\') {

            str += buffer.charAt(++i);
            continue;
        }

        if (chr == '"' || chr == "'") {

            let k = i;
            while (++k < buffer.length) {
                chr = buffer.charAt(k);
                str += chr;
                if (chr == '//') {
                    str += buffer.charAt(++k);
                    continue;
                }
                if (chr == buffer.charAt(i)) {
                    break;
                }
            }
            continue;
        }

        if (chr == '(' || chr == '[') {
            const open = chr;
            const close = chr == '(' ? ')' : ']';
            let inParens = 1;
            let k = i;
            while (++k < buffer.length) {
                chr = buffer.charAt(k);
                if (chr == '\\') {
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

    if (str !== '') {
        // @ts-ignore
        result.at(-1).push(str);
    }

    return result;
}

function matchSelectors(selector1: string[][], selector2: string[][], parentType: EnumToken, errors: ErrorDescription[]): null | MatchedSelector {

    let match: string[][] = [[]];
    const j: number = Math.min(
        selector1.reduce((acc: number, curr: string[]) => Math.min(acc, curr.length), selector1.length > 0 ? selector1[0].length : 0),
        selector2.reduce((acc: number, curr: string[]) => Math.min(acc, curr.length), selector2.length > 0 ? selector2[0].length : 0)
    );

    let i: number = 0;
    let k: number;
    let l: number;
    let token: string;
    let matching: boolean = true;
    let matchFunction: number = 0;
    let inAttr: number = 0;

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

        if (token == ',') {

            match.push([]);
        } else {

            if (token.endsWith('(')) {

                matchFunction++;
            }

            if (token.endsWith('[')) {

                inAttr++;
            } else if (token == ')') {

                matchFunction--;
            } else if (token == ']') {

                inAttr--;
            }

            (<string[]>match.at(-1)).push(token);
        }
    }

    // invalid function
    if (matchFunction != 0 || inAttr != 0) {

        return null;
    }

    if (parentType != EnumToken.RuleNodeType) {

        for (const part of match) {

            if (part.length > 0 && combinators.includes(part[0].charAt(0))) {

                return null;
            }
        }
    }

    if (match.length > 1) {

        errors?.push({
            action: 'ignore',
            message: `minify: unsupported multilevel matching\n${JSON.stringify({
                match,
                selector1,
                selector2
            }, null, 1)}`
        });
        return null;
    }

    for (const part of match) {

        while (part.length > 0) {

            const token: string = <string>part.at(-1);

            if (token == ' ' || combinators.includes(token) || notEndingWith.includes(<string>token.at(-1))) {

                part.pop();
                continue;
            }

            break;
        }
    }

    if (match.every(t => t.length == 0)) {

        return null;
    }

    if (eq([['&']], match)) {

        return null;
    }

    function reduce(acc: string[][], curr: string[]) {

        if (acc === null) {

            return null;
        }

        let hasCompoundSelector: boolean = true;

        curr = curr.slice(match[0].length);

        while (curr.length > 0) {

            if (curr[0] == ' ') {

                hasCompoundSelector = false;
                curr.unshift('&');
                continue;
            }

            break;
        }

        // invalid function match
        if (curr.length > 0 && curr[0].endsWith('(') && curr.at(-1) != ')') {

            return null;
        }

        if (curr.length == 1 && combinators.includes(curr[0].charAt(0))) {

            return null;
        }

        if (hasCompoundSelector && curr.length > 0) {

            hasCompoundSelector = !['&'].concat(combinators).includes(curr[0].charAt(0));
        }

        if (curr[0] == ':is(') {

            let inFunction: number = 0;
            let canReduce: boolean = true;
            const isCompound: string[][] = curr.reduce((acc, token, index: number) => {

                if (index == 0) {

                    inFunction++;
                    canReduce = curr[1] == '&';
                } else if (token.endsWith('(')) {

                    if (inFunction == 0) {

                        canReduce = false;
                    }

                    inFunction++;
                } else if (token == ')') {

                    inFunction--;
                } else if (token == ',') {

                    if (!canReduce) {

                        canReduce = curr[index + 1] == '&';
                    }

                    acc.push([]);
                } else acc.at(-1)?.push(token);

                return acc;

            }, <string[][]>[[]]);

            if (inFunction > 0) {

                canReduce = false;
            }

            if (canReduce) {

                curr = isCompound.reduce((acc, curr) => {

                    if (acc.length > 0) {

                        acc.push(',');
                    }

                    acc.push(...curr);

                    return acc
                }, []);
            }
        }

        // @todo: check hasCompoundSelector && curr[0] == '&' && curr[1] == ' '

        acc.push(match.length == 0 ? ['&'] : (hasCompoundSelector && curr[0] != '&' && (curr.length == 0 || !combinators.includes(curr[0].charAt(0))) ? ['&'].concat(curr) : curr))

        return acc;
    }

    // @ts-ignore
    selector1 = selector1.reduce(reduce, <string[][]>[]);
    // @ts-ignore
    selector2 = selector2.reduce(reduce, <string[][]>[]);

    return selector1 == null || selector2 == null ? null : {
        eq: eq(selector1, selector2),
        match,
        selector1,
        selector2
    }
}

function fixSelector(node: AstRule) {

    // @ts-ignore
    if (node.sel.includes('&')) {

        const attributes: Token[] = parseString(node.sel);

        for (const attr of walkValues(attributes)) {

            if (attr.value.typ == EnumToken.PseudoClassFuncTokenType && (attr.value as PseudoClassFunctionToken).val == ':is') {

                let i = (attr.value as PseudoClassFunctionToken).chi.length;

                while (i--) {

                    if (attr.value.chi[i].typ == EnumToken.LiteralTokenType && (<LiteralToken>attr.value.chi[i]).val == '&') {

                        attr.value.chi.splice(i, 1);
                    }
                }
            }
        }

        node.sel = attributes.reduce((acc, curr) => acc + renderToken(curr), '');
    }
}

function wrapNodes(previous: AstRule, node: AstRule, match: MatchedSelector, ast: AstNode, reducer: Function, i: number, nodeIndex: number): AstRule {

    // @ts-ignore
    let pSel: string = match.selector1.reduce(reducer, []).join(',');

    // @ts-ignore
    let nSel: string = match.selector2.reduce(reducer, []).join(',');

// @ts-ignore
    const wrapper = <AstRule>{...previous, chi: [], sel: match.match.reduce(reducer, []).join(',')};

    // @ts-ignore
    Object.defineProperty(wrapper, 'raw', {
        ...definedPropertySettings,
        // @ts-ignore
        value: match.match.map(t => t.slice())
    });

    if (pSel == '&' || pSel === '') {

        // @ts-ignore
        wrapper.chi.push(...previous.chi);

        // @ts-ignore
        if ((nSel == '&' || nSel === '')) {

            // @ts-ignore
            wrapper.chi.push(...node.chi);
        } else {

            // @ts-ignore
            wrapper.chi.push(node);
        }
    } else {

        // @ts-ignore
        wrapper.chi.push(previous, node);
    }

    // @ts-ignore
    ast.chi.splice(i, 1, wrapper);
    // @ts-ignore
    ast.chi.splice(nodeIndex, 1);
    // @ts-ignore
    previous.sel = pSel;
    // @ts-ignore
    previous.raw = match.selector1;
    // @ts-ignore
    node.sel = nSel;
    // @ts-ignore
    node.raw = match.selector2;

    reduceRuleSelector(wrapper);
    return wrapper;
}

function diff(n1: AstRule, n2: AstRule, reducer: Function, options: ParserOptions = {}) {

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

    if (i == 0 || j == 0) {
        // @ts-ignore
        return null;
    }
    // @ts-ignore
    const raw1: RawSelectorTokens = <RawSelectorTokens>node1.raw;

    // @ts-ignore
    const raw2: RawSelectorTokens = <RawSelectorTokens>node2.raw;

    if (raw1 != null && raw2 != null) {

        const prefixes1: Set<string> = new Set;
        const prefixes2: Set<string> = new Set;

        for (const token1 of raw1) {

            for (const t of token1) {

                if (t[0] == ':') {

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

                if (t[0] == ':') {

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

    // @ts-ignore
    node1 = {...node1, chi: node1.chi.slice()};
    node2 = {...node2, chi: node2.chi.slice()};
    if (raw1 != null) {
        Object.defineProperty(node1, 'raw', {...definedPropertySettings, value: raw1});
    }

    if (raw2 != null) {
        Object.defineProperty(node2, 'raw', {...definedPropertySettings, value: raw2});
    }

    const intersect: AstDeclaration[] = [];

    while (i--) {

        if (node1.chi[i].typ == EnumToken.CommentNodeType) {

            continue;
        }

        j = node2.chi.length;

        if (j == 0) {

            break;
        }

        while (j--) {

            if (node2.chi[j].typ == EnumToken.CommentNodeType) {

                continue;
            }

            if ((<AstDeclaration>node1.chi[i]).nam == (<AstDeclaration>node2.chi[j]).nam) {

                if (eq(node1.chi[i], node2.chi[j])) {

                    intersect.push(node1.chi[i] as AstDeclaration);
                    node1.chi.splice(i, 1);
                    node2.chi.splice(j, 1);
                    break;
                }
            }
        }
    }

    // @ts-ignore
    const result = (intersect.length == 0 ? null : {
        ...node1,
        // @ts-ignore
        sel: [...new Set([...(n1?.raw?.reduce(reducer, []) ?? splitRule(n1.sel)).concat(n2?.raw?.reduce(reducer, []) ?? splitRule(n2.sel))])].join(','),
        chi: intersect.reverse()
    });

    if (result == null || [n1, n2].reduce((acc: number, curr: AstRule): number => curr.chi.length == 0 ? acc : acc + doRender(curr, options).code.length, 0) <= [node1, node2, result].reduce((acc: number, curr: AstRule): number => curr.chi.length == 0 ? acc : acc + doRender(curr, options).code.length, 0)) {
        // @ts-ignore
        return null;
    }

    return {result, node1: exchanged ? node2 : node1, node2: exchanged ? node1 : node2};
}

function reduceRuleSelector(node: AstRule) {

    if (node.raw == null) {

        Object.defineProperty(node, 'raw', {...definedPropertySettings, value: splitRule(node.sel)})
    }

    // @ts-ignore
    // if (node.raw != null) {
    // @ts-ignore
    let optimized: OptimizedSelector = <OptimizedSelector>reduceSelector(node.raw.reduce((acc, curr) => {
        acc.push(curr.slice());
        return acc;
    }, <string[][]>[]));

    if (optimized != null) {
        Object.defineProperty(node, 'optimized', {...definedPropertySettings, value: optimized});
    }

    if (optimized != null && optimized.match && optimized.reducible && optimized.selector.length > 1) {

        for (const selector of optimized.selector) {

            if (selector.length > 1 && selector[0] == '&' &&
                (combinators.includes(selector[1]) || !/^[a-zA-Z:]/.test(selector[1]))) {

                selector.shift();
            }
        }

        const unique: Set<string> = new Set;

        const raw: string[][] = [
            [
                optimized.optimized[0], ':is('
            ].concat(optimized.selector.reduce((acc: string[], curr: string[]) => {

                const sig = curr.join('');

                if (!unique.has(sig)) {

                    if (acc.length > 0) {
                        acc.push(',');
                    }

                    unique.add(sig);
                    acc.push(...curr);
                }

                return acc;
            }, [])).concat(')')
        ];

        const sel: string = raw[0].join('');

        if (sel.length < node.sel.length) {
            node.sel = sel;
            // node.raw = raw;
            Object.defineProperty(node, 'raw', {...definedPropertySettings, value: raw});
        }
    }
}