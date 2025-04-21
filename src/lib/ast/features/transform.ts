import type {
    AstAtRule,
    AstDeclaration,
    AstNode,
    AstRule,
    FunctionToken,
    MinifyFeatureOptions,
    Token
} from "../../../@types/index.d.ts";
import {EnumToken} from "../types";
import {consumeWhitespace} from "../../validation/utils";
import {compute} from "../transform/compute.ts";
import {filterValues, renderToken} from "../../renderer";
import {eqMatrix} from "../transform/minify.ts";

export class TransformCssFeature {

    static get ordering(): number {
        return 4;
    }

    static register(options: MinifyFeatureOptions): void {

        // @ts-ignore
        if (options.computeTransform) {

            // @ts-ignore
            options.features.push(new TransformCssFeature());
        }
    }

    run(ast: AstRule | AstAtRule): void {

        if (!('chi' in ast)) {

            return;
        }

        let i: number = 0;
        let node: AstNode | AstDeclaration;

        // @ts-ignore
        for (; i < ast.chi.length; i++) {

            // @ts-ignore
            node = ast.chi[i] as AstNode | AstDeclaration;

            if (
                node.typ != EnumToken.DeclarationNodeType ||
                (!node.nam.startsWith('--') && !node.nam.match(/^(-[a-z]+-)?transform$/))) {

                continue;
            }

            const children: Token[] = (node as AstDeclaration).val.slice();

            consumeWhitespace(children);

            let {matrix, cumulative, minified} = compute(children as Token[]) ?? {};

            if (matrix == null || cumulative == null || minified == null) {

                return;
            }

            let r : Token[][] = [filterValues((node as AstDeclaration).val.slice())];

            if (eqMatrix(matrix as FunctionToken, cumulative)) {

                r.push(cumulative);
            }

            if (eqMatrix(matrix as FunctionToken, minified)) {

                r.push(minified);
            }

            // console.error(JSON.stringify({
            //     matrix:  renderToken(matrix),
            //     cumulative: cumulative.reduce((acc, curr) => acc + renderToken(curr), ''),
            //     minified: minified.reduce((acc, curr) => acc + renderToken(curr), ''),
            //     r: r[0].reduce((acc, curr) => acc + renderToken(curr), ''),
            //     all: r.map(r => r.reduce((acc, curr) => acc + renderToken(curr), ''))
            // }, null, 1));

            const l =  renderToken(matrix).length;

            (node as AstDeclaration).val = r.reduce((acc, curr) => {

                if (curr.reduce((acc, t) => acc + renderToken(t), '').length < l) {

                    return curr;
                }

                return acc;

            }, [matrix]);
        }
    }
}
