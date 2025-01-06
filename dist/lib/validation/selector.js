import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import '../parser/utils/config.js';
import { getParsedSyntax } from './config.js';
import { validateSyntax } from './syntax.js';

function validateSelector(selector, options, root) {
    let isNested = false;
    if (root != null) {
        let node = root;
        while (node != null) {
            if (node.typ == EnumToken.RuleNodeType) {
                isNested = true;
                break;
            }
            // @ts-ignore
            node = node.parent;
        }
    }
    // @ts-ignore
    return validateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, root?.typ == EnumToken.AtRuleNodeType && root.nam.match(/(-[a-zA-Z]+-)?keyframes/i) ? 'keyframe-block-list' : (isNested ? 'relative-selector-list' : 'complex-selector-list')), selector, isNested ? root : null, options);
}

export { validateSelector };
