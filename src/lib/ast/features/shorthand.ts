import { PropertyList } from "../../parser/declaration/list.ts";
import { EnumToken } from "../types.ts";
import type { AstAtRule, AstNode, AstRule, ParserOptions, PropertyListOptions } from "../../../@types/index.d.ts";
import { FeatureWalkMode } from "./type.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";

export class ComputeShorthandFeature {
    public accept: Set<EnumToken> = new Set([
        EnumToken.RuleNodeType,
        EnumToken.AtRuleNodeType,
        EnumToken.KeyframesRuleNodeType,
    ]);

    get ordering() {
        return 5;
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
        if (!("chi" in ast || ast.chi?.length == 0)) {
            return null;
        }

        // @ts-ignore
        const j: number = ast.chi.length;
        let k: number = 0;
        let l: number;

        const rules: AstNode[] = [];
        const declarations: AstNode[] = [];
        const doNotSort = ast.typ == EnumToken.AtRuleNodeType && equalsIgnoreCase(ast.nam, "function");

        // https://drafts.csswg.org/css-mixins/#:~:text=The%20value%20of%20the%20result%20descriptor%20is%20always%2016px%20in%20the%20above%20example
        if (doNotSort) {
            for (const node of ast.chi!) {
                declarations.push(node);
            }
        } else {
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
                        declarations.push(ast.chi![m]);
                    }
                } else {
                    for (let m = k; m <= l; m++) {
                        rules.push(ast.chi![m]);
                    }
                }

                k = l;
            }
        }

        if (declarations.length > 0) {
            ast.chi!.length = 0;
            // @ts-expect-error
            ast.chi!.push(...new PropertyList(options).add(declarations), ...rules);
        }
        return ast;
    }
}
