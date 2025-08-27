import {PropertyList} from "../../parser/declaration/index.ts";
import {EnumToken} from "../types.ts";
import type {
    AstAtRule,
    AstNode,
    AstRule,
    AstRuleStyleSheet,
    ParserOptions,
    PropertyListOptions
} from "../../../@types/index.d.ts";
import {FeatureWalkMode} from "./type.ts";

export class ComputeShorthandFeature {

    get ordering() {
        return 3;
    }

    get processMode(): FeatureWalkMode {
        return FeatureWalkMode.Post;
    }

    static register(options: ParserOptions): void {

        if (options.computeShorthand) {

            // @ts-ignore
            options.features.push(new ComputeShorthandFeature(options));
        }
    }

    run(ast: AstRule | AstAtRule, options: PropertyListOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any
    }) {

        if (!('chi' in ast)) {

            return ast;
        }

        // @ts-ignore
        const j: number = ast.chi.length;
        let k: number = 0;
        let l: number;
        let properties: PropertyList = new PropertyList(options);
        const rules: AstNode[] = [];


        // @ts-ignore
        for (; k < j; k++) {

            l = k;
            // capture comments with the next token
            while (l + 1 < j) {

                // @ts-ignore
                const node = ast.chi[l];

                if (node.typ == EnumToken.CommentNodeType) {

                    l++;
                    continue;
                }

                break;
            }

            // @ts-ignore
            const node = ast.chi[l];

            if (node.typ == EnumToken.DeclarationNodeType) {

                properties.add(...ast.chi!.slice(k, l + 1));
            } else {

                rules.push(...ast.chi!.slice(k, l + 1));
            }

            k = l;
        }

        // @ts-ignore
        ast.chi = [...properties, ...rules];
        return ast;
    }
}