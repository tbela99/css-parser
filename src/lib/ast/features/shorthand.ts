import { DeclarationMemo, PropertyList } from "../../parser/declaration/list.ts";
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

    /**
     *
     * @param arena
     * @param ast
     * @param options
     * @param _parent
     * @param context
     */
    run(
        arena: AstArena,
        ast: AstRule | AstAtRule,
        options: PropertyListOptions,
        _parent?: AstNode,
        context?: {
            [key: string]: any;
        },
    ): AstNode | null {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren) || arena.firstChild[ast] == 0) {
            return null;
        }

        // the keys of the declarations are shared by the rules of the minification
        const memo: DeclarationMemo | null = context == null ? null : (context.declarations ??= new DeclarationMemo());
        const list: PropertyList = new PropertyList(arena, options, memo);
        let doNotSort: boolean = false;
        let hasDeclarations: boolean = false;

        if (arena.dataTypes[ast] == EnumToken.AtRuleNodeType) {
            switch (arena.strings[arena.name[ast]]) {
                case "function":
                case "mixin":
                    doNotSort = true;
                    break;
            }
        }

        // the declarations (with their leading comments) are moved into the property list,
        // the rules (with their leading comments) stay in place
        let child: AstNode = arena.firstChild[ast];

        while (child != 0) {
            let last: AstNode = child;

            if (!doNotSort) {
                // capture comments with the next node
                while (arena.nextSibling[last] != 0 && arena.dataTypes[last] == EnumToken.CommentNodeType) {
                    last = arena.nextSibling[last];
                }
            }

            const next: AstNode = arena.nextSibling[last];

            // https://drafts.csswg.org/css-mixins/#:~:text=The%20value%20of%20the%20result%20descriptor%20is%20always%2016px%20in%20the%20above%20example
            if (doNotSort || arena.dataTypes[last] == EnumToken.DeclarationNodeType) {
                hasDeclarations = true;

                for (let node: AstNode = child; node != next; ) {
                    const nextNode: AstNode = arena.nextSibling[node];

                    arena.detach(node);
                    list.addDeclaration(node);
                    node = nextNode;
                }
            }

            child = next;
        }

        if (hasDeclarations) {
            // the declarations are inserted before the rules
            const first: AstNode = arena.firstChild[ast];

            for (const node of list) {
                if (first == 0) {
                    arena.appendChild(ast, node);
                } else {
                    arena.insertBefore(first, node);
                }
            }
        }

        return ast;
    }
}
