import type {
    AstAtRule,
    AstNode,
    FunctionToken,
    MediaFeatureNotToken,
    MediaFeatureOnlyToken,
    MediaFeatureToken,
    MediaQueryConditionToken,
    ParensToken,
    Token,
    ValidationOptions
} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";
import {consumeWhitespace, splitTokenList} from "../utils/index.ts";
import {generalEnclosedFunc} from "../../syntax/color/utils/index.ts";

export function validateAtRuleMedia(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    // media-query-list
    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: null,
            syntax: null,
            error: '',
            tokens: []
        } as ValidationSyntaxResult;
    }

    let result: ValidationSyntaxResult | null = null;

    const slice: Token[] = atRule.tokens.slice();

    consumeWhitespace(slice);

    if (slice.length == 0) {

        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: atRule,
            syntax: '@media',
            error: ''
        }
    }

    result = validateAtRuleMediaQueryList(atRule.tokens, atRule);

    if (result.valid == SyntaxValidationResult.Drop) {

        return result;
    }

    if (!('chi' in atRule)) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@media',
            error: 'expected at-rule body'
        }
    }

    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@media',
        error: ''
    }
}

export function validateAtRuleMediaQueryList(tokenList: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    const split: Token[][] = splitTokenList(tokenList);
    const matched: Token[][] = [];
    let result: ValidationSyntaxResult | null = null;
    let previousToken: Token | null;
    let mediaFeatureType: Token | null;

    for (let i = 0; i < split.length; i++) {

        const tokens: Token[] = split[i].slice();
        const match: Token[] = [];

        result = null;
        mediaFeatureType = null;
        previousToken = null;

        if (tokens.length == 0) {

            // @ts-ignore
            result = {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: tokens[0] ?? atRule,
                syntax: '@media',
                error: 'unexpected token'
            } as ValidationSyntaxResult;
            continue;
        }

        while (tokens.length > 0) {

            previousToken = tokens[0];

            // media-condition | media-type | custom-media
            if (!(validateMediaCondition(tokens[0], atRule) || validateMediaFeature(tokens[0]) || validateCustomMediaCondition(tokens[0], atRule))) {

                if (tokens[0].typ == EnumToken.ParensTokenType) {

                    result = validateAtRuleMediaQueryList((tokens[0] as ParensToken).chi, atRule);
                } else {

                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@media',
                        error: 'expecting media feature or media condition'
                    }
                }

                if (result.valid == SyntaxValidationResult.Drop) {

                    break;
                }

                result = null;
            }

            match.push(tokens.shift() as Token);

            if (tokens.length == 0) {

                break;
            }

            if (!consumeWhitespace(tokens)) {

                if (previousToken?.typ != EnumToken.ParensTokenType) {

                    // @ts-ignore
                    result = {
                        valid: SyntaxValidationResult.Drop,
                        context: [],
                        node: tokens[0] ?? atRule,
                        syntax: '@media',
                        error: 'expected media query list'
                    }

                    break;
                }
            } else if (![EnumToken.MediaFeatureOrTokenType, EnumToken.MediaFeatureAndTokenType].includes(tokens[0].typ)) {

                // @ts-ignore
                result = {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'expected and/or'
                }

                break;
            }

            if (mediaFeatureType == null) {

                mediaFeatureType = tokens[0];
            }

            if (mediaFeatureType.typ != tokens[0].typ) {

                // @ts-ignore
                result = {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'mixing and/or not allowed at the same level'
                }

                break;
            }

            match.push({typ: EnumToken.WhitespaceTokenType}, tokens.shift() as Token);

            consumeWhitespace(tokens);

            if (tokens.length == 0) {

                // @ts-ignore
                result = {
                    valid: SyntaxValidationResult.Drop,
                    context: [],
                    node: tokens[0] ?? atRule,
                    syntax: '@media',
                    error: 'expected media-condition'
                }

                break;
            }

            match.push({typ: EnumToken.WhitespaceTokenType});
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
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: atRule,
            syntax: '@media',
            error: 'expected media query list'
        };
    }

    tokenList.length = 0;

    let hasAll: boolean = false;

    for (let i = 0; i < matched.length; i++) {

        if (tokenList.length > 0) {

            tokenList.push({typ: EnumToken.CommaTokenType});
        }

        if (matched[i].length == 1 && matched.length > 1 && matched[i][0].typ == EnumToken.MediaFeatureTokenType && (matched[i][0] as MediaFeatureToken).val == 'all') {

            hasAll = true;
            continue;
        }

        tokenList.push(...matched[i]);
    }

    if (hasAll && tokenList.length == 0) {

        tokenList.push({typ: EnumToken.MediaFeatureTokenType, val: 'all'});
    }

    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: atRule,
        syntax: '@media',
        error: ''
    }
}

function validateCustomMediaCondition(token: Token, atRule: AstAtRule): boolean {

    if (token.typ == EnumToken.MediaFeatureNotTokenType) {

        return validateMediaCondition((token as MediaFeatureNotToken).val, atRule);
    }

    if (token.typ != EnumToken.ParensTokenType) {

        return false;
    }

    const chi: Token[] = (token as ParensToken).chi.filter((t: Token): boolean => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);

    if (chi.length != 1) {

        return false;
    }

    return chi[0].typ == EnumToken.DashedIdenTokenType;
}

export function validateMediaCondition(token: Token, atRule: AstAtRule): boolean {

    if (token.typ == EnumToken.MediaFeatureNotTokenType) {

        return validateMediaCondition((token as MediaFeatureNotToken).val, atRule);
    }

    if (token.typ != EnumToken.ParensTokenType && !(['when', 'else', 'import'].includes(atRule.nam) && token.typ == EnumToken.FunctionTokenType && generalEnclosedFunc.includes((token as FunctionToken).val))) {

        return false;
    }

    const chi: Token[] = (token as ParensToken | FunctionToken).chi.filter((t: Token): boolean => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);

    if (chi.length != 1) {

        return false;
    }

    if (chi[0].typ == EnumToken.IdenTokenType) {

        return true;
    }

    if (chi[0].typ == EnumToken.MediaFeatureNotTokenType) {

        return validateMediaCondition((chi[0] as MediaFeatureNotToken).val, atRule);
    }

    if (chi[0].typ == EnumToken.MediaQueryConditionTokenType) {

        return (chi[0] as MediaQueryConditionToken).l.typ == EnumToken.IdenTokenType;
    }

    return false;
}

export function validateMediaFeature(token: Token): boolean {

    let val: Token = token;

    if (token.typ == EnumToken.MediaFeatureOnlyTokenType || token.typ == EnumToken.MediaFeatureNotTokenType) {

        val = (token as MediaFeatureOnlyToken | MediaFeatureNotToken).val
    }

    return val.typ == EnumToken.MediaFeatureTokenType;
}