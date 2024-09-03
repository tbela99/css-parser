import { EnumToken } from '../ast/types.js';
import '../ast/minify.js';
import '../parser/parse.js';
import '../renderer/color/utils/constants.js';
import '../renderer/sourcemap/lib/encode.js';
import '../parser/utils/config.js';
import { getConfig } from './config.js';

const expressions = [
    EnumToken.DelimTokenType, EnumToken.IncludeMatchTokenType, EnumToken.DashMatchTokenType,
    EnumToken.StartMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.ContainMatchTokenType
];
const selectorTokens = [
    EnumToken.IdenTokenType, EnumToken.ClassSelectorTokenType, EnumToken.AttrTokenType,
    EnumToken.PseudoClassTokenType, EnumToken.PseudoClassFuncTokenType, EnumToken.HashTokenType,
    EnumToken.UniversalSelectorTokenType
];
const combinatorTokens = [
    EnumToken.ChildCombinatorTokenType, EnumToken.NextSiblingCombinatorTokenType,
    EnumToken.SubsequentSiblingCombinatorTokenType
];
function validateSelector(selector, root) {
    return selector.length > 0 && doValidateSelector(selector, root) != null;
}
function doValidateSelector(selector, root) {
    let result = null;
    if (selector.length == 0) {
        return selector;
    }
    if (combinatorTokens.includes(selector[0].typ)) {
        if (root == null || root.typ == EnumToken.StyleSheetNodeType) {
            return null;
        }
        selector = selector.slice(1);
    }
    while ((selector?.length ?? 0) > 0) {
        result = validateSimpleSelector(selector, root);
        // console.error(0, {result, selector});
        if (result == null) {
            return null;
        }
        if (result.length == 0) {
            return result;
        }
        selector = result;
        result = validateCombinator(selector);
        // console.error(1, {result, selector});
        if (result == null) {
            while (result == null && selector.length > 0) {
                if (selector[0].typ == EnumToken.CommaTokenType) {
                    selector = selector.slice(1);
                    // console.error(2, {result, selector});
                    if (selector.length > 0 && combinatorTokens.includes(selector[0].typ)) {
                        if (root == null || root.typ == EnumToken.StyleSheetNodeType) {
                            return null;
                        }
                        selector = selector.slice(1);
                        // console.error(3, {result, selector});
                    }
                    result = validateSimpleSelector(selector, root);
                    // console.error(4, {result, selector});
                    if (result == null) {
                        // console.error({result, selector});
                        // console.error('unexpected token: ', JSON.stringify(selector[0], null, 1));
                        // console.error(new Error('unexpected token:\n' + JSON.stringify(selector[0], null, 1)));
                        return null;
                    }
                    selector = result;
                    result = validateCombinator(selector);
                    if (result != null) {
                        if (result.length == 0) {
                            return result;
                        }
                        selector = result;
                    }
                }
                else {
                    break;
                }
            }
        }
        else {
            selector = result;
        }
    }
    return selector;
}
function consumeWhitespace(selector) {
    let i = 0;
    while (i < selector.length &&
        (selector[i].typ == EnumToken.WhitespaceTokenType ||
            selector[i].typ == EnumToken.CommentTokenType)) {
        i++;
    }
    return selector.slice(i);
}
function validateSimpleSelector(selector, root) {
    if (selector == null) {
        return null;
    }
    let i = 0;
    if (i >= selector.length) {
        return selector.slice(i);
    }
    if (root?.typ == EnumToken.AtRuleNodeType && null != root.nam.match(/(-[a-zA-Z]+-)?keyframes/)) {
        while (i < selector.length) {
            if ([EnumToken.PercentageTokenType, EnumToken.CommentTokenType].includes(selector[i].typ)) {
                i++;
                continue;
            }
            if ((selector[i].typ == EnumToken.IdenTokenType && ['from', 'to'].includes(selector[i].val))) {
                i++;
                continue;
            }
            if (selector[i].typ == EnumToken.CommaTokenType) {
                break;
            }
            return null;
        }
        return selector.slice(i);
    }
    while (i < selector.length && [EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(selector[i].typ)) {
        i++;
    }
    if (i >= selector.length) {
        return selector.slice(i);
    }
    if (selectorTokens.includes(selector[i].typ)) {
        if (selector[i].typ == EnumToken.PseudoClassTokenType && !validatePseudoClass(selector[i])) {
            return null;
        }
        if (selector[i].typ == EnumToken.PseudoClassFuncTokenType && !validatePseudoClassFunction(selector[i])) {
            return null;
        }
        if (selector[i].typ == EnumToken.AttrTokenType && !validateAttributeSelector(selector[i])) {
            return null;
        }
        return selector.slice(i + 1);
    }
    if (selector[i].typ == EnumToken.LiteralTokenType && selector[i].val.startsWith('\\')) {
        return selector.slice(i + 1);
    }
    if (selector[i].typ == EnumToken.NestingSelectorTokenType && root != null && root.typ != EnumToken.StyleSheetNodeType) {
        return selector.slice(i + 1);
    }
    return null;
}
function validatePseudoClass(selector) {
    const name = selector.val.slice(selector.val[1] == ':' ? 2 : 1);
    if (name.match(/^-[a-zA-Z]+-/)) {
        return true;
    }
    const config = getConfig();
    return selector.val in config.selectors || selector.val == ':before' || selector.val == ':after';
}
function validatePseudoClassFunction(selector) {
    const name = selector.val.slice(1);
    if (name.match(/^-[a-zA-Z]+-/)) {
        return name == '-webkit-any' || name == '-moz-any';
    }
    const config = getConfig();
    if (selector.val in config.selectors) {
        if (!('chi' in config.selectors[selector.val].ast[0])) {
            return false;
        }
    }
    else if (!(selector.val + '()' in config.selectors)) {
        return false;
    }
    // TODO: validate params
    return true;
}
function validateAttributeSelector(selector) {
    let i = 0;
    let isMatchExpression = false;
    let expression;
    while (i < selector.chi.length) {
        if ([EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(selector.chi[i].typ)) {
            i++;
            continue;
        }
        if (EnumToken.IdenTokenType == selector.chi[i].typ ||
            EnumToken.MatchExpressionTokenType == selector.chi[i].typ ||
            EnumToken.NameSpaceAttributeTokenType == selector.chi[i].typ) {
            isMatchExpression = EnumToken.MatchExpressionTokenType == selector.chi[i].typ;
            if (isMatchExpression) {
                expression = selector.chi[i];
            }
            if (EnumToken.NameSpaceAttributeTokenType == selector.chi[i].typ) {
                if (selector.chi[i].r.typ != EnumToken.IdenTokenType) {
                    return false;
                }
                if (selector.chi[i].l != null) {
                    // @ts-ignore
                    if (selector.chi[i].l.typ != EnumToken.IdenTokenType &&
                        // @ts-ignore
                        selector.chi[i].l.typ != EnumToken.LiteralTokenType) {
                        return false;
                    }
                    if (
                    // @ts-ignore
                    selector.chi[i].l.typ == EnumToken.LiteralTokenType &&
                        selector.chi[i].l.val != '*') {
                        return false;
                    }
                }
            }
            i++;
            break;
        }
        return false;
    }
    if (!isMatchExpression) {
        while (i < selector.chi.length) {
            if ([EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(selector.chi[i].typ)) {
                i++;
                continue;
            }
            break;
        }
        if (i < selector.chi.length) {
            if (!expressions.includes(selector.chi[i].typ)) {
                return false;
            }
            i++;
            while (i < selector.chi.length) {
                if ([EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(selector.chi[i].typ)) {
                    i++;
                    continue;
                }
                break;
            }
            if (i >= selector.chi.length || ![EnumToken.IdenTokenType, EnumToken.StringTokenType].includes(selector.chi[i].typ)) {
                return false;
            }
            i++;
        }
    }
    else {
        if (expression.l.typ != EnumToken.IdenTokenType ||
            ![EnumToken.IdenTokenType, EnumToken.StringTokenType].includes(expression.r.typ) ||
            !expressions.includes(expression.op)) {
            return false;
        }
    }
    if (i < selector.chi.length) {
        let hasWhitespace = false;
        while (i < selector.chi.length) {
            if ([EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(selector.chi[i].typ)) {
                if (!hasWhitespace) {
                    hasWhitespace = selector.chi[i].typ == EnumToken.WhitespaceTokenType;
                }
                i++;
                continue;
            }
            break;
        }
        // @ts-ignore
        if (!hasWhitespace || i >= selector.chi.length || selector.chi[i].typ != EnumToken.IdenTokenType || !['i', 's'].includes(selector.chi[i].val)) {
            return false;
        }
        i++;
        while (i < selector.chi.length) {
            if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(selector.chi[i].typ)) {
                return false;
            }
            i++;
        }
    }
    return true;
}
function validateCombinator(selector, root) {
    selector = consumeWhitespace(selector);
    if (selector.length == 0) {
        return null;
    }
    const combinatorTypes = [
        EnumToken.ChildCombinatorTokenType,
        EnumToken.DescendantCombinatorTokenType,
        EnumToken.NextSiblingCombinatorTokenType,
        EnumToken.SubsequentSiblingCombinatorTokenType,
        EnumToken.ColumnCombinatorTokenType
    ];
    if (!combinatorTypes.includes(selector[0].typ)) {
        return null;
    }
    selector = consumeWhitespace(selector.slice(1));
    if (combinatorTypes.includes(selector[0].typ)) {
        return null;
    }
    return selector;
}

export { validateSelector };
