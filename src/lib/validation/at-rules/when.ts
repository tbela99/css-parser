import type {AstAtRule, AstNode, FunctionToken, Token, ValidationOptions} from "../../../@types";
import type {ValidationSyntaxResult} from "../../../@types/validation";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace, splitTokenList} from "../utils";
import {validateMediaCondition, validateMediaFeature} from "./media";
import {validateSupportCondition} from "./supports";

export function validateAtRuleWhen(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    const slice: Token[] = Array.isArray(atRule.tokens) ? atRule.tokens.slice() : [];

    consumeWhitespace(slice);

    if (slice.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: atRule,
            syntax: '@when',
            error: '',
            tokens: []
        } as ValidationSyntaxResult;
    }

    const result: ValidationSyntaxResult = validateAtRuleWhenQueryList(atRule.tokens as Token[], atRule);

    if (result.valid == ValidationLevel.Drop) {

        return result;
    }

    if (!('chi' in atRule)) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@when',
            error: 'expected at-rule body',
            tokens: []
        } as ValidationSyntaxResult;
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@when',
        error: '',
        tokens: result.tokens
    }
}

// media() = media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )
// supports() = supports( <declaration> )
export function validateAtRuleWhenQueryList(tokenList: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    const matched: Token[][] = [];

    let result: ValidationSyntaxResult | null = null;

    for (const split of splitTokenList(tokenList)) {

        const match: Token[] = [];
        result = null;

        consumeWhitespace(split);

        if (split.length == 0) {

            continue;
        }

        while (split.length > 0) {

            if (split[0].typ != EnumToken.FunctionTokenType || !['media', 'supports', 'font-tech', 'font-format'].includes((split[0] as FunctionToken).val)) {

                result = {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: split[0] ?? atRule,
                    syntax: '@when',
                    error: 'unexpected token',
                    tokens: []
                } as ValidationSyntaxResult;

                break;
            }

            const chi: Token[] = split[0].chi.slice() as Token[];

            consumeWhitespace(chi);

            if (split[0].val == 'media') {

                // result = valida
                if (chi.length != 1 || !(validateMediaFeature(chi[0]) || validateMediaCondition(split[0], atRule))) {

                    result = {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: split[0] ?? atRule,
                        syntax: 'media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )',
                        error: 'unexpected token',
                        tokens: []
                    }

                    break;
                }

            } else if (['supports', 'font-tech', 'font-format'].includes(split[0].val)) {

                // result = valida
                if (!validateSupportCondition(atRule, split[0])) {

                    result = {
                        valid: ValidationLevel.Drop,
                        matches: [],
                        node: split[0] ?? atRule,
                        syntax: 'media( [ <mf-plain> | <mf-boolean> | <mf-range> ] )',
                        error: 'unexpected token',
                        tokens: []
                    }

                    break;
                }
            }

            if (match.length > 0) {

                match.push({typ: EnumToken.WhitespaceTokenType});
            }

            match.push(split.shift() as Token);
            consumeWhitespace(split);

            if (split.length == 0) {

                break;
            }

            if (![EnumToken.MediaFeatureAndTokenType, EnumToken.MediaFeatureOrTokenType].includes(split[0].typ)) {

                result = {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: split[0] ?? atRule,
                    syntax: '@when',
                    error: 'expecting and/or media-condition',
                    tokens: []
                } as ValidationSyntaxResult;

                break;
            }

            if (match.length > 0) {

                match.push({typ: EnumToken.WhitespaceTokenType});
            }

            match.push(split.shift() as Token);

            consumeWhitespace(split);

            if (split.length == 0) {

                result = {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: split[0] ?? atRule,
                    syntax: '@when',
                    error: 'expecting media-condition',
                    tokens: []
                } as ValidationSyntaxResult;

                break;
            }
        }

        if (result == null && match.length > 0) {

            matched.push(match);
        }
    }

    if (result != null) {

        return result;
    }

    if (matched.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: result?.node ?? atRule,
            syntax: '@when',
            error: 'invalid at-rule body',
            tokens: []
        }
    }

    tokenList.length = 0;

    for (const match of matched) {

        if (tokenList.length > 0) {

            tokenList.push({
                typ: EnumToken.CommaTokenType
            });
        }

        tokenList.push(...match);
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@when',
        error: '',
        tokens: tokenList
    }
}