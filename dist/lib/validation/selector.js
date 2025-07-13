import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../ast/walk.js';
import '../parser/parse.js';
import '../parser/tokenize.js';
import '../parser/utils/config.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import { validateRelativeSelectorList } from './syntaxes/relative-selector-list.js';
import './syntaxes/complex-selector.js';
import { validateKeyframeBlockList } from './syntaxes/keyframe-block-list.js';
import './syntax.js';
import './config.js';
import { validateSelectorList } from './syntaxes/selector-list.js';

function validateSelector(selector, options, root) {
    if (root == null) {
        return validateSelectorList(selector, root, options);
    }
    // @ts-ignore
    if (root.typ == EnumToken.AtRuleNodeType && root.nam.match(/^(-[a-z]+-)?keyframes$/)) {
        return validateKeyframeBlockList(selector);
    }
    let isNested = root.typ == EnumToken.RuleNodeType ? 1 : 0;
    let currentRoot = root.parent;
    while (currentRoot != null && isNested == 0) {
        if (currentRoot.typ == EnumToken.RuleNodeType) {
            isNested++;
            if (isNested > 0) {
                // @ts-ignore
                return validateRelativeSelectorList(selector, root, { ...(options ?? {}), nestedSelector: true });
            }
        }
        currentRoot = currentRoot.parent;
    }
    const nestedSelector = isNested > 0;
    // @ts-ignore
    return nestedSelector ? validateRelativeSelectorList(selector, root, {
        ...(options ?? {}),
        nestedSelector
    }) : validateSelectorList(selector, root, { ...(options ?? {}), nestedSelector });
}

export { validateSelector };
