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
import {compute, computeMatrix} from "../transform/compute.ts";
import {renderToken} from "../../renderer";
import {serialize} from "../transform/matrix.ts";

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

            let result = compute(children as Token[]);

            if (result == null) {

                return;
            }

            // console.error(JSON.stringify({result}, null, 1));
            // console.error({result, t: result.map(t =>  minify(t) ?? t
            //     )});

            // console.error({result: decompose2(result)});
            // const decomposed =decompose(result);
            // const minified = minify(result);

            const matrix = computeMatrix(result);

            if (matrix != null) {

                const m = serialize(matrix);

                if (renderToken(m).length < result.reduce((acc, t) => acc + renderToken(t), '').length) {

                    result = [m];
                }
            }

            // console.error({result, serialized: renderToken()});

            // if (minified != null) {

                (node as AstDeclaration).val = result;
            // }
        }
    }
}
