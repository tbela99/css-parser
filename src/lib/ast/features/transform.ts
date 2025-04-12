import type {
    AstAtRule,
    AstDeclaration,
    AstNode,
    AstRule,
    MinifyFeatureOptions,
    Token
} from "../../../@types/index.d.ts";
import {EnumToken} from "../types";
import {consumeWhitespace} from "../../validation/utils";
import {compute} from "../transform/compute.ts";
import {renderToken} from "../../renderer";

export class TransformCssFeature {

    static get ordering(): number {
        return 4;
    }

    static register(options: MinifyFeatureOptions): void {

        // @ts-ignore
        if (options.minify || options.computeCalcExpression || options.computeShorthand) {

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

            let {matrix, cumulative} = compute(children as Token[]) ?? {};

            // console.error({result, matrix});
            // console.error(
            //     {
            //         // result: result == null ? null :result.reduce((acc, curr) => acc + renderToken(curr), ''),
            //         matrix: matrix == null ? null : renderToken(matrix),
            //         cumulative: cumulative == null ? null : cumulative.reduce((acc, curr) => acc + renderToken(curr), '')
            //     });

            if ( matrix == null) {

                return;
            }

            if (renderToken(matrix).length < cumulative.reduce((acc, t) => acc + renderToken(t), '').length) {

                cumulative = [matrix];
            }

            (node as AstDeclaration).val = cumulative;
        }
    }
}
