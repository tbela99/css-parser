import type {AstAtRule, AstRule, Token} from "../../../@types";
import type {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {consumeWhitespace} from "../utils";
import {EnumToken, ValidationLevel} from "../../ast";

export const combinatorsTokens: EnumToken[] = [EnumToken.ChildCombinatorTokenType, EnumToken.ColumnCombinatorTokenType,
    EnumToken.DescendantCombinatorTokenType, EnumToken.NextSiblingCombinatorTokenType, EnumToken.SubsequentSiblingCombinatorTokenType];

// <compound-selector> [ <combinator>? <compound-selector> ]*
export function validateComplexSelector(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {

    // [ <type-selector>? <subclass-selector>* [ <pseudo-element-selector> <pseudo-class-selector>* ]* ]!
    tokens = tokens.slice();
    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: root,
            syntax: null,
            error: 'expected selector',
            tokens
        }
    }

    while (tokens.length > 0) {

        if (combinatorsTokens.includes(tokens[0].typ)) {

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                // @ts-ignore
                node: tokens[0],
                syntax: null,
                error: 'unexpected combinator',
                tokens
            }
        }

        if (tokens[0].typ == EnumToken.NestingSelectorTokenType) {

            if (!options?.nestedSelector) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    // @ts-ignore
                    node: tokens[0],
                    syntax: null,
                    error: 'nested selector not allowed',
                    tokens
                }
            }

            while (tokens.length > 0 && tokens[0].typ == EnumToken.NestingSelectorTokenType) {

                tokens.shift();
                consumeWhitespace(tokens);
            }

            if (tokens.length == 0) {

                break;
            }
        }

        if (EnumToken.IdenTokenType == tokens[0].typ) {

            tokens.shift();
            consumeWhitespace(tokens);

            if (tokens.length == 0) {

                break;
            }
        }

        if (EnumToken.UniversalSelectorTokenType == tokens[0].typ) {

            tokens.shift();
            consumeWhitespace(tokens);
        }

        while (tokens.length > 0) {

            if (tokens[0].typ == EnumToken.PseudoClassFuncTokenType) {

                if (tokens[0].val.startsWith(':-webkit-')) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        // @ts-ignore
                        node: tokens[0],
                        syntax: null,
                        error: 'invalid pseudo-class',
                        tokens
                    }
                }
            }

            if ([
                EnumToken.ClassSelectorTokenType,
                EnumToken.HashTokenType,
                EnumToken.PseudoClassTokenType,
                EnumToken.PseudoClassFuncTokenType].includes(tokens[0].typ)) {

                tokens.shift();
                consumeWhitespace(tokens);
                continue
            }

            if (tokens[0].typ == EnumToken.NestingSelectorTokenType) {

                if (!options?.nestedSelector) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        // @ts-ignore
                        node: tokens[0],
                        syntax: null,
                        error: 'nested selector not allowed',
                        tokens
                    }
                }

                tokens.shift();
                consumeWhitespace(tokens);
                continue
            }

            // validate namespace
            if (tokens[0].typ == EnumToken.NameSpaceAttributeTokenType) {

                if (!((tokens[0].l == null || tokens[0].l.typ == EnumToken.IdenTokenType || (tokens[0].l.typ == EnumToken.LiteralTokenType && tokens[0].l.val == '*')) &&
                    tokens[0].r.typ == EnumToken.IdenTokenType)) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0],
                        syntax: null,
                        error: 'expecting wq-name',
                        tokens
                    }
                }

                tokens.shift();
                consumeWhitespace(tokens);
                continue;
            }
            // validate attribute
            else if (tokens[0].typ == EnumToken.AttrTokenType) {

                const children: Token[] = tokens[0].chi.slice() as Token[];

                consumeWhitespace(children);

                if (children.length == 0) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0],
                        syntax: null,
                        error: 'invalid attribute selector',
                        tokens
                    }
                }

                if (![
                    EnumToken.IdenTokenType,
                    EnumToken.NameSpaceAttributeTokenType,
                    EnumToken.MatchExpressionTokenType].includes(children[0].typ)) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0],
                        syntax: null,
                        error: 'invalid attribute selector',
                        tokens
                    }
                }

                if (children[0].typ == EnumToken.MatchExpressionTokenType) {

                    if (![EnumToken.IdenTokenType,
                            EnumToken.NameSpaceAttributeTokenType].includes(children[0].l.typ) ||
                        ![
                            EnumToken.EqualMatchTokenType, EnumToken.DashMatchTokenType,
                            EnumToken.StartMatchTokenType, EnumToken.ContainMatchTokenType,
                            EnumToken.EndMatchTokenType, EnumToken.IncludeMatchTokenType].includes(children[0].op.typ) ||
                        ![EnumToken.StringTokenType,
                            EnumToken.IdenTokenType].includes(children[0].r.typ)) {

                        // @ts-ignore
                        return {
                            valid: ValidationLevel.Drop,
                            matches: [],
                            node: tokens[0],
                            syntax: null,
                            error: 'invalid attribute selector',
                            tokens
                        }
                    }

                    if (children[0].attr != null && !['i', 's'].includes(children[0].attr)) {

                        // @ts-ignore
                        return {
                            valid: ValidationLevel.Drop,
                            matches: [],
                            node: tokens[0],
                            syntax: null,
                            error: 'invalid attribute selector',
                            tokens
                        }
                    }
                }

                children.shift();
                consumeWhitespace(children);

                if (children.length > 0) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: children[0],
                        syntax: null,
                        error: 'unexpected token',
                        tokens
                    }
                }

                tokens.shift();
                consumeWhitespace(tokens);
                continue;
            }

            break;
        }

        if (tokens.length == 0) {

            break
        }

        // combinator
        if (!combinatorsTokens.includes(tokens[0].typ)) {

            if (tokens[0].typ == EnumToken.NestingSelectorTokenType) {

                if (!options?.nestedSelector) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        // @ts-ignore
                        node: tokens[0],
                        syntax: null,
                        error: 'nested selector not allowed',
                        tokens
                    }
                }

                tokens.shift();
                consumeWhitespace(tokens);
                continue
            }


            if (tokens.length > 0 &&
                [
                    EnumToken.IdenTokenType,
                    EnumToken.AttrTokenType,
                    EnumToken.NameSpaceAttributeTokenType,
                    EnumToken.ClassSelectorTokenType,
                    EnumToken.HashTokenType,
                    EnumToken.PseudoClassTokenType,
                    EnumToken.PseudoClassFuncTokenType].includes(tokens[0].typ)) {

                continue
            }

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: null,
                error: 'expecting combinator or subclass-selector',
                tokens
            }
        }

        const token = tokens.shift() as Token;
        consumeWhitespace(tokens);

        if (tokens.length == 0) {

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: token,
                syntax: null,
                error: 'expected compound-selector',
                tokens
            }
        }
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: null,
        syntax: null,
        error: '',
        tokens
    }
}