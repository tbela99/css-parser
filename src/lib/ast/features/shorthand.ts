import { PropertyList } from "../../parser/declaration/list.ts";
import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import type { AstAtRule, AstNode, AstRule, ParserOptions, PropertyListOptions } from "../../../@types/index.d.ts";
import { FeatureWalkMode } from "./type.ts";
import type { AstArena } from "../arena.ts";

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

    run(arena: AstArena, ast: AstRule | AstAtRule, options: PropertyListOptions): AstNode | null {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren) || arena.firstChild[ast] == 0) {
            return null;
        }

        const children: AstNode[] = arena.children(ast);
        const j: number = children.length;
        let k: number = 0;
        let l: number;

        const rules: AstNode[] = [];
        const declarations: AstNode[] = [];
        let doNotSort: boolean = false;

        if (arena.dataTypes[ast] == EnumToken.AtRuleNodeType) {
            switch (arena.strings[arena.name[ast]]) {
                case "function":
                case "mixin":
                    doNotSort = true;
                    break;
            }
        }

        // https://drafts.csswg.org/css-mixins/#:~:text=The%20value%20of%20the%20result%20descriptor%20is%20always%2016px%20in%20the%20above%20example
        if (doNotSort) {
            for (const node of children) {
                declarations.push(node);
            }
        } else {
            for (; k < j; k++) {
                l = k;
                // capture comments with the next token
                while (l + 1 < j) {
                    const node = children[l];

                    if (arena.dataTypes[node] == EnumToken.CommentNodeType) {
                        l++;
                        continue;
                    }

                    break;
                }

                const node = children[l];

                if (arena.dataTypes[node] == EnumToken.DeclarationNodeType) {
                    for (let m = k; m <= l; m++) {
                        declarations.push(children[m]);
                    }
                } else {
                    for (let m = k; m <= l; m++) {
                        rules.push(children[m]);
                    }
                }

                k = l;
            }
        }

        if (declarations.length > 0) {
            const first: AstNode = arena.current + 1;

            arena.setChildren(ast, ...new PropertyList(arena, options).add(declarations), ...rules);

            // release the dropped declarations and the temporary nodes
            for (const node of children) {
                if (arena.parents[node] == 0) {
                    arena.release(node);
                }
            }

            for (let node = first; node <= arena.current; node++) {
                if (arena.parents[node] == 0) {
                    arena.release(node);
                }
            }
        }

        return ast;
    }
}
