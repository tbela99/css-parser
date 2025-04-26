import type {AstAtRule, AstNode, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast/index.ts";
import {splitTokenList} from "../utils/index.ts";

export function validateAtRulePage(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: null,
            syntax: '@page',
            error: '',
            tokens: []
        } as ValidationSyntaxResult;
    }

    // page-selector-list
    for (const tokens of splitTokenList(atRule.tokens)) {

        if (tokens.length == 0) {

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0] ?? atRule,
                syntax: '@page',
                error: 'unexpected token',
                tokens: []
            } as ValidationSyntaxResult;
        }

        // <pseudo-page>+ | <ident> <pseudo-page>*
        // ident pseudo-page* | pseudo-page+

        if (tokens[0].typ == EnumToken.IdenTokenType) {

            tokens.shift();

            if (tokens.length == 0) {

                continue;
            }

            // @ts-ignore
            if (tokens[0].typ != EnumToken.WhitespaceTokenType) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@page',
                    error: 'unexpected token',
                    tokens: []
                } as ValidationSyntaxResult;
            }
        }

        while (tokens.length > 0) {

            if (tokens[0].typ == EnumToken.PseudoPageTokenType) {

                tokens.shift();

                if (tokens.length == 0) {

                    continue;
                }

                // @ts-ignore
                if (tokens[0].typ != EnumToken.WhitespaceTokenType) {

                    // @ts-ignore
                    return {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@page',
                        error: 'unexpected token',
                        tokens: []
                    } as ValidationSyntaxResult;
                }
            }
        }
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@page',
        error: '',
        tokens: []
    } as ValidationSyntaxResult;
}