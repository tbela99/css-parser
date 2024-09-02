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
function validateSelector(selector, root) {
    return selector.length > 0 && doValidateSelector(selector, root) != null;
}
function doValidateSelector(selector, root) {
    let result = null;
    while ((selector?.length ?? 0) > 0) {
        result = validateSimpleSelector(selector, root);
        if (result == null) {
            return null;
        }
        selector = consumeWhitespace(result);
        if (selector.length == 0) {
            break;
        }
        result = validateCombinator(selector);
        if (result == null) {
            if (selector[0].typ == EnumToken.CommaTokenType) {
                result = validateSimpleSelector(selector.slice(1), root);
                if (result == null || result.length == selector.length) {
                    // console.error({result, selector});
                    // console.error('unexpected token: ', JSON.stringify(selector[0], null, 1));
                    // console.error(new Error('unexpected token:\n' + JSON.stringify(selector[0], null, 1)));
                    return null;
                }
                selector = result;
                continue;
            }
        }
        else {
            selector = result;
        }
        result = validateSimpleSelector(consumeWhitespace(selector), root);
        if (result == null) {
            return null;
        }
        if (result.length > 0 && result.length == selector.length) {
            // console.error('unexpected token: ', JSON.stringify(result[0], null, 1));
            // console.error(new Error('unexpected token:\n' + JSON.stringify(result[0], null, 1)));
            return null;
        }
        selector = result;
    }
    return selector;
}
function consumeWhitespace(selector) {
    let i = 0;
    while (i < selector.length && (selector[i].typ == EnumToken.WhitespaceTokenType || selector[i].typ == EnumToken.CommentTokenType)) {
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
            if (selector[i].typ == EnumToken.CommaTokenType) {
                break;
            }
            return null;
        }
        return selector.slice(i);
    }
    if (selector[i].typ == EnumToken.IdenTokenType) {
        i++;
    }
    while (i < selector.length) {
        if ([
            EnumToken.HashTokenType,
            EnumToken.AttrTokenType,
            EnumToken.LiteralTokenType,
            EnumToken.CommentTokenType,
            EnumToken.PseudoClassTokenType,
            EnumToken.ClassSelectorTokenType,
            EnumToken.PseudoClassFuncTokenType,
            EnumToken.UniversalSelectorTokenType
        ].includes(selector[i].typ) || (selector[i].typ == EnumToken.NestingSelectorTokenType && root != null)) {
            if (selector[i].typ == EnumToken.AttrTokenType && !validateAttributeSelector(selector[i])) {
                return null;
            }
            if (selector[i].typ == EnumToken.PseudoClassTokenType && !validatePseudoClass(selector[i])) {
                return null;
            }
            if (selector[i].typ == EnumToken.PseudoClassFuncTokenType && !validatePseudoClassFunction(selector[i])) {
                return null;
            }
            i++;
        }
        else {
            break;
        }
    }
    return selector.slice(i);
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
