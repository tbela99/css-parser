import { DeclarationMemo, PropertyList } from "../../parser/declaration/list.ts";
import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import type { AstAtRule, AstNode, AstRule, ParserOptions, PropertyListOptions } from "../../../@types/index.d.ts";
import { FeatureWalkMode } from "./type.ts";
import type { AstArena } from "../arena.ts";
import { moveResult } from "./utils.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";

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
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren) || arena.firstChild[ast] === 0) {
            return null;
        }

        // the keys of the declarations are shared by the rules of the minification
        const memo: DeclarationMemo | null = context == null ? null : (context.declarations ??= new DeclarationMemo());
        let doNotSort: boolean = false;
        // the descriptors of a custom function: the `result` descriptors are deduplicated when the declarations are
        // not validated by the parser
        let descriptors: Record<string, ValidationToken[]> | null = null;
        let isFunction: boolean = false;

        if (arena.dataTypes[ast] === EnumToken.AtRuleNodeType) {
            switch (arena.resolveString(arena.name[ast])) {
                case "function":
                    doNotSort = true;
                    isFunction = true;
                    descriptors =
                        getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@function")?.getPropertyDescriptors() ?? null;
                    break;

                case "mixin":
                    doNotSort = true;
                    break;
            }
        }

        // the children are processed by segments: an at-rule without a block or an `@apply` rule inserts declarations
        // at its position, the declarations are not moved across it
        let child: AstNode = arena.firstChild[ast];

        while (child !== 0) {
            const list: PropertyList = new PropertyList(arena, options, memo, descriptors);
            let hasDeclarations: boolean = false;
            // first node of the segment that is not moved into the property list
            let first: AstNode = 0;
            // at-rule without a block that ends the segment
            let boundary: AstNode = 0;

            // the declarations (with their leading comments) are moved into the property list,
            // the rules (with their leading comments) stay in place
            while (child !== 0) {
                let last: AstNode = child;

                if (!doNotSort) {
                    // capture comments with the next node
                    while (arena.nextSibling[last] !== 0 && arena.dataTypes[last] === EnumToken.CommentNodeType) {
                        last = arena.nextSibling[last];
                    }
                }

                const next: AstNode = arena.nextSibling[last];

                if (
                    arena.dataTypes[last] === EnumToken.AtRuleNodeType &&
                    (!(arena.flags[last] & EnumAstNodeStatus.HasChildren) ||
                        arena.stringEquals(arena.name[last], "apply"))
                ) {
                    boundary = child;
                    child = next;
                    break;
                }

                // https://drafts.csswg.org/css-mixins/#:~:text=The%20value%20of%20the%20result%20descriptor%20is%20always%2016px%20in%20the%20above%20example
                if (doNotSort || arena.dataTypes[last] === EnumToken.DeclarationNodeType) {
                    hasDeclarations = true;

                    for (let node: AstNode = child; node !== next; ) {
                        const nextNode: AstNode = arena.nextSibling[node];

                        arena.detach(node);
                        list.addDeclaration(node);
                        node = nextNode;
                    }
                } else if (first === 0) {
                    first = child;
                }

                child = next;
            }

            if (hasDeclarations) {
                // the declarations are inserted before the rules of the segment
                const reference: AstNode = first !== 0 ? first : boundary;

                for (const node of list) {
                    if (reference === 0) {
                        arena.appendChild(ast, node);
                    } else {
                        arena.insertBefore(reference, node);
                    }
                }
            }
        }

        // the deduplicated result keeps the position of the first result: it is moved after the conditional rules
        if (isFunction) {
            moveResult(arena, ast);
        }

        return ast;
    }
}
