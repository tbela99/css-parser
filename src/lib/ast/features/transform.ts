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
import {decompose} from "../transform/utils.ts";
import {minify} from "../transform/minify.ts";

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

           const result = compute(children as Token[]);

           if (result == null) {

               // console.error({result});
               return;
           }

           const decomposed = decompose(result);
           const minified = minify(result);

            // console.error({result, decomposed, minify: minify(result), serialized: renderToken(serialize(result))});

            if (minified != null) {

                (node as AstDeclaration).val = minified;
            }
        }
    }
}
