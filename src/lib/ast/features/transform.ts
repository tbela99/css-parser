import type { AstAtRule, AstDeclaration, AstNode, AstRule, ParserOptions, Token } from "../../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import { compute } from "../transform/compute.ts";
import { filterValues, renderValue } from "../../printer/render.ts";
import { eqMatrix, minifyTransformFunctions } from "../transform/minify.ts";
import { FeatureWalkMode } from "./type.ts";
import type { AstArena } from "../arena.ts";

/**
 * transform property and its prefixed versions
 */
const transformProperty: RegExp = /^(-[a-z]+-)?transform$/;

export class TransformCssFeature {
    public accept: Set<EnumToken> = new Set([
        EnumToken.RuleNodeType,
        EnumToken.AtRuleNodeType,
        EnumToken.KeyframesRuleNodeType,
    ]);

    get ordering(): number {
        return 4;
    }

    get processMode(): FeatureWalkMode {
        return FeatureWalkMode.Post;
    }

    static register(options: ParserOptions): void {
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
    run(arena: AstArena, ast: AstRule | AstAtRule): AstNode | null {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren)) {
            return null;
        }

        let node: AstNode | AstDeclaration;

        for (node = arena.firstChild[ast]; node !== 0; node = arena.nextSibling[node]) {
            if (arena.flags[node] & (EnumAstNodeStatus.Invalid | EnumAstNodeStatus.ValidationFailed)) {
                continue;
            }

            if (
                arena.dataTypes[node] !== EnumToken.DeclarationNodeType ||
                !transformProperty.test(arena.strings[arena.name[node]])
            ) {
                continue;
            }

            const children: Token[] = [];

            for (const child of arena.tokens(node)) {
                children.push(
                    arena.dataTypes[child] === EnumToken.TransformFunctionTokenType
                        ? minifyTransformFunctions(arena, child)
                        : child,
                );
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

            let r: Token[][] = [filterValues(arena, children)];

            if (eqMatrix(arena, matrix, cumulative)) {
                r.push(cumulative);
            }

            if (eqMatrix(arena, matrix, minified)) {
                r.push(minified);
            }

            const l: number = renderValue(arena, matrix).length;

            // inlined: arena.setTokens(node, ...r.reduce((acc: Token[], curr: Token[]): Token[] => { if (curr.reduce((acc: string, t: Token) => acc + renderValue(arena, t), "").length < l) { return curr; } return acc; }, [matrix]))
            arena.setTokenList(
                node,
                r.reduce(
                    (acc: Token[], curr: Token[]): Token[] => {
                        if (curr.reduce((acc: string, t: Token) => acc + renderValue(arena, t), "").length < l) {
                            return curr;
                        }

                        return acc;
                    },
                    [matrix],
                ),
            );
        }

        return null;
    }
}
