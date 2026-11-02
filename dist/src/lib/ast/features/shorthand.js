/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { PropertyList } from '../../parser/declaration/list.js';
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
    run(arena, ast, options) {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren) || arena.firstChild[ast] == 0) {
            return null;
        }
        const children = arena.children(ast);
        const j = children.length;
        let k = 0;
        let l;
        const rules = [];
        const declarations = [];
        let doNotSort = false;
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
        }
        else {
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
                }
                else {
                    for (let m = k; m <= l; m++) {
                        rules.push(children[m]);
                    }
                }
                k = l;
            }
        }
        if (declarations.length > 0) {
            const first = arena.current + 1;
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

export { ComputeShorthandFeature };
