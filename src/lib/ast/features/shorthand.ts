import { PropertyList } from "../../parser/declaration/list.ts";
import { EnumToken } from "../types.ts";
import type {
    AstAtRule,
    AstNode,
    AstRule,
    AstStyleSheet,
    ParserOptions,
    PropertyListOptions,
} from "../../../@types/index.d.ts";
import { FeatureWalkMode } from "./type.ts";

export class ComputeShorthandFeature {
    public accept: Set<EnumToken> = new Set([
        EnumToken.RuleNodeType,
        EnumToken.AtRuleNodeType,
        EnumToken.KeyframesRuleNodeType,
    ]);

    get ordering() {
        return 10;
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

    run(ast: AstRule | AstAtRule, options: PropertyListOptions): AstNode | null {
        if (!("chi" in ast)) {
            return null;
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
                for (let m = k; m <= l; m++) {
                    properties.add(ast.chi![m]);
                }
            } else {
                for (let m = k; m <= l; m++) {
                    rules.push(ast.chi![m]);
                }
            }

            k = l;
        }

        ast.chi!.length = 0;
        // @ts-expect-error
        ast.chi!.push(...properties, ...rules);
        return ast;
    }
}
