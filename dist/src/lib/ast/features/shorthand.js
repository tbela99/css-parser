/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0
	License: MIT
 */
import { DeclarationMemo, PropertyList } from '../../parser/declaration/list.js';
import { EnumToken, EnumAstNodeStatus } from '../types.js';
import { FeatureWalkMode } from './type.js';

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
    run(arena, ast, options, _parent, context) {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren) || arena.firstChild[ast] == 0) {
            return null;
        }
        // the keys of the declarations are shared by the rules of the minification
        const memo = context == null ? null : (context.declarations ??= new DeclarationMemo());
        const list = new PropertyList(arena, options, memo);
        let doNotSort = false;
        let hasDeclarations = false;
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
        let child = arena.firstChild[ast];
        while (child != 0) {
            let last = child;
            if (!doNotSort) {
                // capture comments with the next node
                while (arena.nextSibling[last] != 0 && arena.dataTypes[last] == EnumToken.CommentNodeType) {
                    last = arena.nextSibling[last];
                }
            }
            const next = arena.nextSibling[last];
            // https://drafts.csswg.org/css-mixins/#:~:text=The%20value%20of%20the%20result%20descriptor%20is%20always%2016px%20in%20the%20above%20example
            if (doNotSort || arena.dataTypes[last] == EnumToken.DeclarationNodeType) {
                hasDeclarations = true;
                for (let node = child; node != next;) {
                    const nextNode = arena.nextSibling[node];
                    arena.detach(node);
                    list.addDeclaration(node);
                    node = nextNode;
                }
            }
            child = next;
        }
        if (hasDeclarations) {
            // the declarations are inserted before the rules
            const first = arena.firstChild[ast];
            for (const node of list) {
                if (first == 0) {
                    arena.appendChild(ast, node);
                }
                else {
                    arena.insertBefore(first, node);
                }
            }
        }
        return ast;
    }
}

export { ComputeShorthandFeature };
