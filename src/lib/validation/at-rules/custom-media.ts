import type {AstAtRule, AstNode, Token, ValidationOptions} from "../../../@types";
import type {ValidationSyntaxResult} from "../../../@types/validation";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace} from "../utils";
import {validateAtRuleMediaQueryList} from "./media";

export function validateAtRuleCustomMedia(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: null,
            syntax: null,
            error: '',
            tokens: []
        } as ValidationSyntaxResult;
    }

    const queries: Token[] = atRule.tokens.slice();

    consumeWhitespace(queries);

    if (queries.length == 0  || queries[0].typ != EnumToken.DashedIdenTokenType) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@custom-media',
            error: 'expecting dashed identifier',
            tokens: []
        }
    }

    queries.shift();

    const result: ValidationSyntaxResult = validateAtRuleMediaQueryList(queries, atRule);

    if (result.valid == ValidationLevel.Drop) {

        atRule.tokens = [];

        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: atRule,
            syntax: '@custom-media',
            error: '',
            tokens: []
        }
    }

    return result;
}