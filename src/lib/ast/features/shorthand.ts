import {PropertyList} from "../../parser/declaration";
import {NodeType} from "../types";
import {AstAtRule, AstRule, AstRuleStyleSheet, PropertyListOptions} from "../../../@types";

export class ComputeShorthand {

    run(ast: AstRule | AstAtRule, options: PropertyListOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {[key: string]: any}) {

        // @ts-ignore
        const j: number = ast.chi.length;
        let k: number = 0;
        let properties: PropertyList = new PropertyList(options);

        // @ts-ignore
        for (; k < j; k++) {

            // @ts-ignore
            const node = ast.chi[k];

            if (node.typ == NodeType.CommentNodeType || node.typ == NodeType.DeclarationNodeType) {

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