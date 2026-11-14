/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { EnumToken, EnumAstNodeStatus } from '../types.js';
import { compute } from '../transform/compute.js';
import { filterValues, renderValue } from '../../printer/render.js';
import { minifyTransformFunctions, eqMatrix } from '../transform/minify.js';
import { FeatureWalkMode } from './type.js';

/**
 * transform property and its prefixed versions
 */
const transformProperty = /^(-[a-z]+-)?transform$/;
class TransformCssFeature {
    accept = new Set([
        EnumToken.RuleNodeType,
        EnumToken.AtRuleNodeType,
        EnumToken.KeyframesRuleNodeType,
    ]);
    get ordering() {
        return 4;
    }
    get processMode() {
        return FeatureWalkMode.Post;
    }
    static register(options) {
        // @ts-ignore
        if (options.computeTransform) {
            // @ts-ignore
            options.features.push(new TransformCssFeature());
        }
    }
    /**
     *
     * @param arena
     * @param ast
     */
    run(arena, ast) {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren)) {
            return null;
        }
        let node;
        for (node = arena.firstChild[ast]; node !== 0; node = arena.nextSibling[node]) {
            if (arena.flags[node] & (EnumAstNodeStatus.Invalid | EnumAstNodeStatus.ValidationFailed)) {
                continue;
            }
            if (arena.dataTypes[node] !== EnumToken.DeclarationNodeType ||
                !transformProperty.test(arena.strings[arena.name[node]])) {
                continue;
            }
            const children = [];
            for (const child of arena.tokens(node)) {
                children.push(arena.dataTypes[child] === EnumToken.TransformFunctionTokenType
                    ? minifyTransformFunctions(arena, child)
                    : child);
            }
            let { matrix, cumulative, minified } = compute(arena, children) ?? {
                matrix: null,
                cumulative: null,
                minified: null,
            };
            if (matrix == null || cumulative == null || minified == null) {
                arena.setTokenList(node, children);
                continue;
            }
            let r = [filterValues(arena, children)];
            if (eqMatrix(arena, matrix, cumulative)) {
                r.push(cumulative);
            }
            if (eqMatrix(arena, matrix, minified)) {
                r.push(minified);
            }
            const l = renderValue(arena, matrix).length;
            // inlined: arena.setTokens(node, ...r.reduce((acc: Token[], curr: Token[]): Token[] => { if (curr.reduce((acc: string, t: Token) => acc + renderValue(arena, t), "").length < l) { return curr; } return acc; }, [matrix]))
            arena.setTokenList(node, r.reduce((acc, curr) => {
                if (curr.reduce((acc, t) => acc + renderValue(arena, t), "").length < l) {
                    return curr;
                }
                return acc;
            }, [matrix]));
        }
        return null;
    }
}

export { TransformCssFeature };
