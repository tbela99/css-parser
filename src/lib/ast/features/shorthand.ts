import {PropertyList} from "../../parser/declaration";
import {EnumToken} from "../types";
import type {AstAtRule, AstRule, AstRuleStyleSheet, MinifyFeatureOptions, PropertyListOptions} from "../../../@types";

export class ComputeShorthandFeature {

    static get ordering() {
        return 2;
    }

    static register(options: MinifyFeatureOptions) {

        if (options.computeShorthand) {

            for (const feature of options.features) {

                if (feature instanceof ComputeShorthandFeature) {

                    return;
                }
            }

            // @ts-ignore
            options.features.push(new ComputeShorthandFeature(options));
        }
    }

    run(ast: AstRule | AstAtRule, options: PropertyListOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {[key: string]: any}) {

        // @ts-ignore
        const j: number = ast.chi.length;
        let k: number = 0;
        let properties: PropertyList = new PropertyList(options);

        // @ts-ignore
        for (; k < j; k++) {

            // @ts-ignore
            const node = ast.chi[k];

            if (node.typ == EnumToken.CommentNodeType || node.typ == EnumToken.DeclarationNodeType) {

                properties.add(node);
                continue;
            }

            break;
        }

        // @ts-ignore
        ast.chi = [...properties].concat(ast.chi.slice(k));
        return ast;
    }
}