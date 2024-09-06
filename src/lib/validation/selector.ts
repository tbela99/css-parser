import {
    AstAtRule,
    AstNode,
    AttrToken,
    IdentToken,
    LiteralToken,
    MatchExpressionToken,
    NameSpaceAttributeToken,
    PseudoClassFunctionToken,
    PseudoClassToken,
    Token,
    ValidationOptions
} from "../../@types";
import {EnumToken, ValidationLevel} from "../ast";
import {getConfig} from "./config";
import {ValidationResult} from "../../@types/validation";

const expressions: EnumToken[] = [
    EnumToken.DelimTokenType, EnumToken.IncludeMatchTokenType, EnumToken.DashMatchTokenType,
    EnumToken.StartMatchTokenType, EnumToken.EndMatchTokenType, EnumToken.ContainMatchTokenType
];

const selectorTokens: EnumToken[] = [
    EnumToken.IdenTokenType, EnumToken.ClassSelectorTokenType, EnumToken.AttrTokenType,
    EnumToken.PseudoClassTokenType, EnumToken.PseudoClassFuncTokenType, EnumToken.HashTokenType,
    EnumToken.UniversalSelectorTokenType
];

const combinatorTokens: EnumToken[] = [
    EnumToken.ChildCombinatorTokenType, EnumToken.NextSiblingCombinatorTokenType,
    EnumToken.SubsequentSiblingCombinatorTokenType
];

interface ValidationResultItem {

    valid: ValidationLevel;
    nodes: Token[];
    error: string;
}

export function validateSelector(selector: Token[], options: ValidationOptions, root?: AstNode): ValidationResult {

    if (selector.length == 0) {

        return {

            valid: ValidationLevel.Drop,
            node: null,
            error: 'The selector is empty.'
        }
    }

    return doValidateSelector(selector, options, root);
}

function doValidateSelector(selector: Token[], options: ValidationOptions, root?: AstNode): ValidationResult {

    let result: ValidationResultItem;

    if (combinatorTokens.includes(selector[0].typ)) {

        if (root == null || root.typ == EnumToken.StyleSheetNodeType) {

            return {

                valid: ValidationLevel.Drop,
                node: null,
                error: 'The selector cannot start with a combinator.'
            };
        }

        selector = selector.slice(1);
    }

    while ((selector?.length ?? 0) > 0) {

        result = validateSimpleSelector(selector, options, root);

        if (result.valid == ValidationLevel.Drop) {

            return {

                valid: ValidationLevel.Drop,
                node: result.nodes[0] ?? null,
                error: result.error
            };
        }

        if (result.nodes.length == 0) {

            return {

                valid: result.valid,
                node: result.nodes[0] ?? null,
                error: result.error
            };
        }

        selector = result.nodes;
        result = validateCombinator(selector, options, root);

        if (result.valid == ValidationLevel.Drop) {

            while (result.valid == ValidationLevel.Drop && selector.length > 0) {

                if (selector[0].typ == EnumToken.CommaTokenType) {

                    selector = consumeWhitespace(selector.slice(1));

                    if (selector.length == 0) {

                        return {

                            valid: ValidationLevel.Drop,
                            node: selector[0],
                            error: 'unexpected token'
                        }
                    }

                    if (selector.length > 0 && combinatorTokens.includes(selector[0].typ)) {

                        if (root == null || root.typ == EnumToken.StyleSheetNodeType) {

                            return {

                                valid: ValidationLevel.Drop,
                                node: selector[0],
                                error: 'Unexpected token'
                            };
                        }

                        selector = selector.slice(1);
                    }

                    result = validateSimpleSelector(selector, options, root);

                    if (result.valid == ValidationLevel.Drop) {

                        return {

                            valid: ValidationLevel.Drop,
                            node: null,
                            error: 'Invalid selector'
                        };
                    }

                    if (result.nodes.length == 0) {

                        return {

                            valid: result.valid,
                            node: null,
                            error: result.error
                        };
                    }

                    selector = result.nodes;
                    result = validateCombinator(selector, options, root);

                    if (result.nodes.length == 0) {

                        return {

                            valid: result.valid,
                            node: null,
                            error: result.error
                        };
                    }

                    selector = result.nodes;

                } else {

                    break;
                }
            }

        } else {

            selector = result.nodes;
        }
    }

    return {

        valid: ValidationLevel.Valid,
        node: null,
        error: ''
    };
}

function consumeWhitespace(selector: Token[]): Token[] {

    let i = 0;

    while (i < selector.length &&
        (
            selector[i].typ == EnumToken.WhitespaceTokenType ||
            selector[i].typ == EnumToken.CommentTokenType)
        ) {

        i++;
    }

    return selector.slice(i);
}

function validateSimpleSelector(selector: Token[], options: ValidationOptions, root?: AstNode): ValidationResultItem {

    let i = 0;

    if (i >= selector.length) {

        return {

            valid: ValidationLevel.Valid,
            nodes: selector.slice(i),
            error: 'empty selector'
        }
    }

    if (root?.typ == EnumToken.AtRuleNodeType && null != (<AstAtRule>root).nam.match(/(-[a-zA-Z]+-)?keyframes/)) {

        while (i < selector.length) {

            if ([EnumToken.PercentageTokenType, EnumToken.CommentTokenType].includes(selector[i].typ)) {

                i++;
                continue;
            }

            if ((selector[i].typ == EnumToken.IdenTokenType && ['from', 'to'].includes((<IdentToken>selector[i]).val))) {

                i++;
                continue;
            }

            if (selector[i].typ == EnumToken.CommaTokenType) {

                break;
            }

            return {

                valid: ValidationLevel.Drop,
                nodes: selector.slice(i),
                error: 'invalid selector'
            };
        }

        return {

            valid: ValidationLevel.Valid,
            nodes: selector.slice(i),
            error: 'empty selector'
        }
    }

    while (i < selector.length && [EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(selector[i].typ)) {

        i++;
    }

    if (i >= selector.length) {

        return {

            valid: ValidationLevel.Valid,
            nodes: selector.slice(i),
            error: 'empty selector'
        }
    }

    if (selectorTokens.includes(selector[i].typ)) {

        let result: ValidationResultItem

        if (selector[i].typ == EnumToken.PseudoClassTokenType) {
            result = validatePseudoClass(<PseudoClassToken>selector[i], options);

            if (result.valid != ValidationLevel.Valid) {

                return result;
            }
        }

        if (selector[i].typ == EnumToken.PseudoClassFuncTokenType) {

            result = validatePseudoClassFunction(<PseudoClassFunctionToken>selector[i], options);

            if (result.valid != ValidationLevel.Valid) {

                return result;
            }
        }

        if (selector[i].typ == EnumToken.AttrTokenType) {

            result = validateAttributeSelector(<AttrToken>selector[i], options);

            if (result.valid != ValidationLevel.Valid) {

                return result;
            }
        }

        return {

            valid: ValidationLevel.Valid,
            nodes: selector.slice(i + 1),
            error: ''
        }
    }

    if (selector[i].typ == EnumToken.LiteralTokenType && (<LiteralToken>selector[i]).val.startsWith('\\')) {

        return {

            valid: ValidationLevel.Valid,
            nodes: selector.slice(i + 1),
            error: ''
        }
    }

    if (selector[i].typ == EnumToken.NestingSelectorTokenType && root != null && root.typ != EnumToken.StyleSheetNodeType) {

        return {

            valid: ValidationLevel.Valid,
            nodes: selector.slice(i + 1),
            error: 'Compound selector not allowed here'
        }
    }

    return {

        valid: ValidationLevel.Drop,
        nodes: selector.slice(i + 1, 1),
        error: 'unexpected token'
    }
}

function validatePseudoClass(selector: PseudoClassToken, options: ValidationOptions): ValidationResultItem {

    const name: string = selector.val.slice(selector.val[1] == ':' ? 2 : 1);

    if (name.match(/^-[a-zA-Z]+-/) || selector.val == ':before' || selector.val == ':after') {

        return {

            valid: ValidationLevel.Valid,
            nodes: [selector],
            error: ''
        };
    }

    const config = getConfig();
    const isValid: boolean = selector.val in config.selectors;

    return {

        valid: isValid || !options.validation ? ValidationLevel.Valid : ValidationLevel.Drop,
        nodes: [selector],
        error: isValid ? '' : 'invalid selector'
    }
}

function validatePseudoClassFunction(selector: PseudoClassFunctionToken, options: ValidationOptions): ValidationResultItem {

    const name: string = selector.val.slice(1);

    if (name.match(/^-[a-zA-Z]+-/)) {

        const isValid: boolean = name == '-webkit-any' || name == '-moz-any';

        return {
            valid: isValid ? ValidationLevel.Valid : ValidationLevel.Drop,
            nodes: [selector],
            error: isValid ? '' : 'invalid pseudo class'
        }
    }

    const config = getConfig();

    if (selector.val in config.selectors) {

        if (!('chi' in config.selectors[selector.val].ast[0])) {

            return {
                valid: !options.validation ? ValidationLevel.Valid : ValidationLevel.Drop,
                nodes: [selector],
                error: ''
            }
        }

    } else if (!(selector.val + '()' in config.selectors)) {

        return {
            valid: !options.validation ? ValidationLevel.Valid : ValidationLevel.Drop,
            nodes: [selector],
            error: ''
        }
    }

    // TODO: validate params
    return {
        valid: ValidationLevel.Valid,
        nodes: [selector],
        error: ''
    }
}

function validateAttributeSelector(selector: AttrToken, options: ValidationOptions): ValidationResultItem {

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

                    return {
                        valid: ValidationLevel.Drop,
                        nodes: [selector],
                        error: 'identifier expected'
                    }
                }

                if ((<NameSpaceAttributeToken>selector.chi[i]).l != null) {

                    // @ts-ignore
                    if ((<NameSpaceAttributeToken>selector.chi[i]).l.typ != EnumToken.IdenTokenType &&
                        // @ts-ignore
                        (<NameSpaceAttributeToken>selector.chi[i]).l.typ != EnumToken.LiteralTokenType) {

                        return {
                            valid: ValidationLevel.Drop,
                            nodes: [selector],
                            error: 'invalid namespace prefix'
                        }
                    }

                    if (
                        // @ts-ignore
                        (<NameSpaceAttributeToken>selector.chi[i]).l.typ == EnumToken.LiteralTokenType &&
                        (<LiteralToken>(<NameSpaceAttributeToken>selector.chi[i]).l).val != '*'
                    ) {

                        return {
                            valid: ValidationLevel.Drop,
                            nodes: [selector],
                            error: 'exoected universal selector or namespace prefix'
                        }
                    }
                }
            }

            i++;
            break;
        }

        return {
            valid: ValidationLevel.Drop,
            nodes: [selector],
            error: 'invalid selector'
        }
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

                return {
                    valid: ValidationLevel.Drop,
                    nodes: [selector],
                    error: 'invalid selector'
                }
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

                return {
                    valid: ValidationLevel.Drop,
                    nodes: [selector],
                    error: 'expected identifier or string'
                }
            }

            i++;
        }
    } else {

        if (
            expression!.l.typ != EnumToken.IdenTokenType ||
            ![EnumToken.IdenTokenType, EnumToken.StringTokenType].includes(expression!.r.typ) ||
            !expressions.includes(expression!.op)) {

            return {
                valid: ValidationLevel.Drop,
                nodes: [selector],
                error: 'expected identifier or string'
            }
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

            const valid = !options.validation && selector.chi[i].typ == EnumToken.IdenTokenType && (<IdentToken>selector.chi[i]).val.match(/^[a-z]$/);
            return {
                valid: valid ? ValidationLevel.Valid : ValidationLevel.Drop,
                nodes: [selector],
                error: valid ? '' : 'invalid attribute selector'
            }
        }

        i++;

        while (i < selector.chi.length) {

            if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(selector.chi[i].typ)) {

                return {
                    valid: ValidationLevel.Drop,
                    nodes: [selector],
                    error: 'invalid attribute selector'
                }
            }

            i++;
        }
    }

    return {
        valid: ValidationLevel.Valid,
        nodes: [selector],
        error: ''
    }
}

function validateCombinator(selector: Token[], options: ValidationOptions, root?: AstNode): ValidationResultItem {

    selector = consumeWhitespace(selector);

    if (selector.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            nodes: selector,
            error: 'expecting combinator'
        }
    }

    const combinatorTypes = [
        EnumToken.ChildCombinatorTokenType,
        EnumToken.DescendantCombinatorTokenType,
        EnumToken.NextSiblingCombinatorTokenType,
        EnumToken.SubsequentSiblingCombinatorTokenType,
        EnumToken.ColumnCombinatorTokenType
    ];

    if (!combinatorTypes.includes(selector[0].typ)) {

        return {
            valid: ValidationLevel.Drop,
            nodes: selector,
            error: 'Expecting combinator'
        };
    }

    selector = consumeWhitespace(selector.slice(1));

    if (selector.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            nodes: selector,
            error: 'Unexpected combinator'
        };
    }

    if (combinatorTypes.includes(selector[0].typ)) {

        return {
            valid: ValidationLevel.Drop,
            nodes: selector,
            error: 'Unexpected combinator'
        };
    }

    return {
        valid: ValidationLevel.Valid,
        nodes: selector,
        error: ''
    };
}