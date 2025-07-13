import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";
import {consumeWhitespace} from "../utils/index.ts";
import {validateAtRuleMediaQueryList} from "./media.ts";

export function validateAtRuleCustomMedia(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: null,
            syntax: null,
            error: ''
        } as ValidationSyntaxResult;
    }

    const queries: Token[] = atRule.tokens.slice();

    consumeWhitespace(queries);

    if (queries.length == 0  || queries[0].typ != EnumToken.DashedIdenTokenType) {

        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@custom-media',
            error: 'expecting dashed identifier'
        }
    }

    queries.shift();

    const result: ValidationSyntaxResult = validateAtRuleMediaQueryList(queries, atRule);

    if (result.valid == SyntaxValidationResult.Drop) {

        atRule.tokens = [];

        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@custom-media',
            error: ''
        }
    }

    return result;
}