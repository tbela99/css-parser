import type {
    AstAtRule,
    AstDeclaration,
    AstNode,
    AstRule,
    FunctionToken,
    ParserOptions,
    Token
} from "../../../@types/index.d.ts";
import {EnumToken} from "../types.ts";
import {consumeWhitespace} from "../../validation/utils/index.ts";
import {compute} from "../transform/compute.ts";
import {filterValues, renderToken} from "../../renderer/index.ts";
import {eqMatrix, minifyTransformFunctions} from "../transform/minify.ts";
import {FeatureWalkMode} from "./type.ts";

export class TransformCssFeature {

    public accept: Set<EnumToken> = new Set([EnumToken.RuleNodeType, EnumToken.KeyFramesRuleNodeType]);

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

    run(ast: AstRule | AstAtRule): AstNode | null {

        if (!('chi' in ast)) {

            return null;
        }

        let i: number = 0;
        let node: AstNode | AstDeclaration;

        // @ts-ignore
        for (; i < ast.chi.length; i++) {

            // @ts-ignore
            node = ast.chi[i] as AstNode | AstDeclaration;

            if (node.typ != EnumToken.DeclarationNodeType || !(node as AstDeclaration).nam.match(/^(-[a-z]+-)?transform$/)) {

                continue;
            }

            const children: Token[] = [];
            for (const child of (node as AstDeclaration).val as Token[]) {

                children.push(child.typ == EnumToken.FunctionTokenType ? minifyTransformFunctions(child as FunctionToken) : child);
            }

            consumeWhitespace(children);

            let {matrix, cumulative, minified} = compute(children as Token[]) ?? {
                matrix: null,
                cumulative: null,
                minified: null
            };

            if (matrix == null || cumulative == null || minified == null) {

                (node as AstDeclaration).val = children;
                continue;
            }

            let r: Token[][] = [filterValues(children)];

            if (eqMatrix(matrix as FunctionToken, cumulative)) {

                r.push(cumulative);
            }

            if (eqMatrix(matrix as FunctionToken, minified)) {

                r.push(minified);
            }

            const l: number = renderToken(matrix).length;

            (node as AstDeclaration).val = r.reduce((acc: Token[], curr: Token[]): Token[] => {

                if (curr.reduce((acc: string, t: Token) => acc + renderToken(t), '').length < l) {

                    return curr;
                }

                return acc;

            }, [matrix]);
        }

        return null;
    }
}
