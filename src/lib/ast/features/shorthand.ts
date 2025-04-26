import {PropertyList} from "../../parser/declaration/index.ts";
import {EnumToken} from "../types.ts";
import type {
    AstAtRule,
    AstNode,
    AstRule,
    AstRuleStyleSheet,
    MinifyFeatureOptions,
    PropertyListOptions
} from "../../../@types/index.d.ts";

export class ComputeShorthandFeature {

    static get ordering() {
        return 3;
    }

    static register(options: MinifyFeatureOptions) {

        if (options.computeShorthand) {

            // @ts-ignore
            options.features.push(new ComputeShorthandFeature(options));
        }
    }

    run(ast: AstRule | AstAtRule, options: PropertyListOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {[key: string]: any}) {

        // @ts-ignore
        const j: number = ast.chi.length;
        let k: number = 0;
        let properties: PropertyList = new PropertyList(options);
        const rules: AstNode[] = [];

        // @ts-ignore
        for (; k < j; k++) {

            // @ts-ignore
            const node = ast.chi[k];

            if (node.typ == EnumToken.CommentNodeType || node.typ == EnumToken.DeclarationNodeType) {

                properties.add(node);
            }

            else {

                rules.push(node);
            }
        }

        // @ts-ignore
        ast.chi = [...properties, ...rules];
        return ast;
    }
}