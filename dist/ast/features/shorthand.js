/* 
	CSS parser, minifier and validator for node, deno, bun and the browser

	Author(s): Thierry Bela
	Version: 2.3.0
	License: MIT
 */
import { DeclarationMemo, PropertyList } from '../../parser/declaration/list.js';
import { EnumToken, EnumAstNodeStatus } from '../types.js';
import { FeatureWalkMode } from './type.js';
import { moveResult } from '../mixins/utils.js';
import { getSyntaxRule } from '../../validation/config.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';

class ComputeShorthandFeature {
    accept = new Set([
        EnumToken.RuleNodeType,
        EnumToken.AtRuleNodeType,
        EnumToken.KeyframesRuleNodeType,
    ]);
    get ordering() {
        return 5;
    }
    get processMode() {
        return FeatureWalkMode.Post;
    }
    static register(options) {
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
    run(arena, ast, options, _parent, context) {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren) || arena.firstChild[ast] === 0) {
            return null;
        }
        // the keys of the declarations are shared by the rules of the minification
        const memo = context == null ? null : (context.declarations ??= new DeclarationMemo());
        let doNotSort = false;
        // the descriptors of a custom function: the `result` descriptors are deduplicated when the declarations are
        // not validated by the parser
        let descriptors = null;
        let isFunction = false;
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
        let child = arena.firstChild[ast];
        while (child !== 0) {
            const list = new PropertyList(arena, options, memo, descriptors);
            let hasDeclarations = false;
            // first node of the segment that is not moved into the property list
            let first = 0;
            // at-rule without a block that ends the segment
            let boundary = 0;
            // the declarations (with their leading comments) are moved into the property list,
            // the rules (with their leading comments) stay in place
            while (child !== 0) {
                let last = child;
                if (!doNotSort) {
                    // capture comments with the next node
                    while (arena.nextSibling[last] !== 0 && arena.dataTypes[last] === EnumToken.CommentNodeType) {
                        last = arena.nextSibling[last];
                    }
                }
                const next = arena.nextSibling[last];
                if (arena.dataTypes[last] === EnumToken.AtRuleNodeType &&
                    (!(arena.flags[last] & EnumAstNodeStatus.HasChildren) ||
                        arena.stringEquals(arena.name[last], "apply"))) {
                    boundary = child;
                    child = next;
                    break;
                }
                // https://drafts.csswg.org/css-mixins/#:~:text=The%20value%20of%20the%20result%20descriptor%20is%20always%2016px%20in%20the%20above%20example
                if (doNotSort || arena.dataTypes[last] === EnumToken.DeclarationNodeType) {
                    hasDeclarations = true;
                    for (let node = child; node !== next;) {
                        const nextNode = arena.nextSibling[node];
                        arena.detach(node);
                        list.addDeclaration(node);
                        node = nextNode;
                    }
                }
                else if (first === 0) {
                    first = child;
                }
                child = next;
            }
            if (hasDeclarations) {
                // the declarations are inserted before the rules of the segment
                const reference = first !== 0 ? first : boundary;
                for (const node of list) {
                    if (reference === 0) {
                        arena.appendChild(ast, node);
                    }
                    else {
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

export { ComputeShorthandFeature };
