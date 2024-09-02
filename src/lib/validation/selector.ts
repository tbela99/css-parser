import type {
    AstAtRule,
    AstNode,
    AttrToken,
    LiteralToken,
    MatchExpressionToken,
    NameSpaceAttributeToken,
    PseudoClassFunctionToken,
    PseudoClassToken,
    Token
} from "../../@types";
import {EnumToken} from "../ast";
import {getConfig} from "./config";

const expressions: EnumToken[] = [
    EnumToken.DelimTokenType, EnumToken.IncludeMatchTokenType, EnumToken.DashMatchTokenType,
    EnumToken.StartMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.ContainMatchTokenType
];

export function validateSelector(selector: Token[], root?: AstNode): boolean {

    return selector.length > 0 && doValidateSelector(selector, root) != null;
}

function doValidateSelector(selector: Token[], root?: AstNode): Token[] | null {

    let result: Token[] | null = null;

    while ((selector?.length ?? 0) > 0) {

        result = validateSimpleSelector(selector, root);

        if (result == null) {

            return null;
        }

        selector = consumeWhitespace(result);

        if (selector.length == 0) {

            break;
        }

        result = validateCombinator(selector, root);

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

        } else {

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

function consumeWhitespace(selector: Token[]): Token[] {

    let i = 0;

    while (i < selector.length && (selector[i].typ == EnumToken.WhitespaceTokenType || selector[i].typ == EnumToken.CommentTokenType)) {

        i++;
    }

    return selector.slice(i);
}

function validateSimpleSelector(selector: Token[] | null, root?: AstNode): Token[] | null {

    if (selector == null) {

        return null;
    }

    let i = 0;

    if (i >= selector.length) {

        return selector.slice(i);
    }

    if (root?.typ == EnumToken.AtRuleNodeType && null != (<AstAtRule>root).nam.match(/(-[a-zA-Z]+-)?keyframes/)) {

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

            if (selector[i].typ == EnumToken.AttrTokenType && !validateAttributeSelector(<AttrToken>selector[i])) {

                return null;
            }

            if (selector[i].typ == EnumToken.PseudoClassTokenType && !validatePseudoClass(<PseudoClassToken>selector[i])) {

                return null;
            }

            if (selector[i].typ == EnumToken.PseudoClassFuncTokenType && !validatePseudoClassFunction(<PseudoClassFunctionToken>selector[i])) {

                return null;
            }

            i++
        } else {

            break;
        }
    }

    return selector.slice(i);
}

function validatePseudoClass(selector: PseudoClassToken): boolean {

    const name: string = selector.val.slice(selector.val[1] == ':' ? 2 : 1);

    if (name.match(/^-[a-zA-Z]+-/)) {

        return true;
    }

    const config = getConfig();
    return selector.val in config.selectors || selector.val == ':before' || selector.val == ':after';
}

function validatePseudoClassFunction(selector: PseudoClassFunctionToken): boolean {

    const name: string = selector.val.slice(1);

    if (name.match(/^-[a-zA-Z]+-/)) {

        return name == '-webkit-any' || name == '-moz-any' ;
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

function validateAttributeSelector(selector: AttrToken): boolean {

    let i: number = 0;
    let isMatchExpression: boolean = false;
    let expression: MatchExpressionToken;

    while (i < selector.chi.length) {

        if ([EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(selector.chi[i].typ)) {

            i++;
            continue;
        }

        if (
            EnumToken.IdenTokenType == selector.chi[i].typ ||
            EnumToken.MatchExpressionTokenType == selector.chi[i].typ ||
            EnumToken.NameSpaceAttributeTokenType == selector.chi[i].typ
        ) {

            isMatchExpression = EnumToken.MatchExpressionTokenType == selector.chi[i].typ;

            if (isMatchExpression) {

                expression = <MatchExpressionToken>selector.chi[i];
            }

            if (EnumToken.NameSpaceAttributeTokenType == selector.chi[i].typ) {

                if ((<NameSpaceAttributeToken>selector.chi[i]).r.typ != EnumToken.IdenTokenType) {

                    return false;
                }

                if ((<NameSpaceAttributeToken>selector.chi[i]).l != null) {

                    // @ts-ignore
                    if ((<NameSpaceAttributeToken>selector.chi[i]).l.typ != EnumToken.IdenTokenType &&
                        // @ts-ignore
                        (<NameSpaceAttributeToken>selector.chi[i]).l.typ != EnumToken.LiteralTokenType) {

                        return false;
                    }

                    if (
                        // @ts-ignore
                        (<NameSpaceAttributeToken>selector.chi[i]).l.typ == EnumToken.LiteralTokenType &&
                        (<LiteralToken>(<NameSpaceAttributeToken>selector.chi[i]).l).val != '*'
                    ) {

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
    } else {

        if (
            expression!.l.typ != EnumToken.IdenTokenType ||
            ![EnumToken.IdenTokenType, EnumToken.StringTokenType].includes(expression!.r.typ) ||
            !expressions.includes(expression!.op)) {

            return false;
        }
    }


    if (i < selector.chi.length) {

        let hasWhitespace: boolean = false;

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
        if (!hasWhitespace || i >= selector.chi.length || selector.chi[i].typ != EnumToken.IdenTokenType || !['i', 's'].includes((<EnumToken.IdenTokenType>selector.chi[i]).val)) {

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

function validateCombinator(selector: Token[], root?: AstNode): Token[] | null {

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