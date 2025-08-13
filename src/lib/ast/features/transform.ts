import type {
    AngleToken,
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
import {eqMatrix} from "../transform/minify.ts";

export class TransformCssFeature {

    get ordering(): number {
        return 4;
    }

    get preProcess(): boolean {
        return false;
    }

    get postProcess(): boolean {
        return true;
    }

    static register(options: ParserOptions): void {

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
                node.typ != EnumToken.DeclarationNodeType || !(node as AstDeclaration).nam.match(/^(-[a-z]+-)?transform$/)) {

                continue;
            }

            const children: Token[] = (node as AstDeclaration).val.reduce((acc: Token[], curr: Token): Token[] => {


                if (curr.typ == EnumToken.FunctionTokenType && 'skew' == curr.val.toLowerCase()) {

                    if (
                        (curr as FunctionToken).chi.length == 3) {

                        if (((curr as FunctionToken).chi[2] as AngleToken).val == 0) {

                            (curr as FunctionToken).chi.length = 1;
                            (curr as FunctionToken).val = 'skew';
                        } else if (((curr as FunctionToken).chi[0] as AngleToken).val == 0) {

                            (curr as FunctionToken).chi = [(curr as FunctionToken).chi[2]];
                            (curr as FunctionToken).val = 'skewY';
                        }
                    }
                }

                acc.push(curr);

                return acc;
            }, [] as Token[]);

            consumeWhitespace(children);

            let {matrix, cumulative, minified} = compute(children as Token[]) ?? {};

            if (matrix == null || cumulative == null || minified == null) {

                continue;
            }

            let r: Token[][] = [filterValues((node as AstDeclaration).val.slice())];

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
    }
}
