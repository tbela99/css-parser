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
    const isKeyframe = root?.typ == EnumToken.AtRuleNodeType && /^(-[a-zA-Z]+-)?keyframes/i.test(root.nam);
    let isNested = false;
    if (!isKeyframe && root != null) {
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
    return validateSyntax(getParsedSyntax("syntaxes" /* ValidationSyntaxGroupEnum.Syntaxes */, isKeyframe ? 'keyframe-selector' : (isNested ? 'relative-selector-list' : 'complex-selector-list')), selector, isNested ? root : null, options);
}

export { validateSelector };
