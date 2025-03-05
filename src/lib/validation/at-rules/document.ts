import type {AstAtRule, AstNode, FunctionToken, Token, ValidationOptions} from "../../../@types";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace, splitTokenList} from "../utils";
import {validateURL} from "../syntaxes/url";


export function validateAtRuleDocument(atRule: AstAtRule, options: ValidationOptions, root?: AstNode): ValidationSyntaxResult {

    if (!Array.isArray(atRule.tokens) || atRule.tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@document',
            error: 'expecting at-rule prelude',
            tokens: []
        } as ValidationSyntaxResult;
    }

    const tokens: Token[] = atRule.tokens.slice() as Token[];
    let result: ValidationSyntaxResult | null = null;

    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: '@document',
            error: 'expecting at-rule prelude',
            tokens
        } as ValidationSyntaxResult;
    }

    for (const t of splitTokenList(tokens)) {

        if (t.length != 1) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: t[0] ?? atRule,
                syntax: '@document',
                error: 'unexpected token',
                tokens
            };
        }


        // @ts-ignore
        if ((t[0].typ != EnumToken.FunctionTokenType && t[0].typ != EnumToken.UrlFunctionTokenType) || !['url', 'url-prefix', 'domain', 'media-document', 'regexp'].some((f) => f.localeCompare((t[0] as FunctionToken).val, undefined, {sensitivity: 'base'}) == 0)) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: t[0] ?? atRule,
                syntax: '@document',
                error: 'expecting any of url-prefix(), domain(), media-document(), regexp() but found ' + (t[0] as FunctionToken).val,
                tokens
            }
        }

        if (t[0].typ == EnumToken.UrlFunctionTokenType) {

            result = validateURL(t[0]);

            if (result.valid == ValidationLevel.Drop) {

                return result;
            }

            continue;
        }

        const children = (t[0] as FunctionToken).chi.slice() as Token[];

        consumeWhitespace(children);

        if (children.length != 1 || (children[0].typ != EnumToken.StringTokenType && children[0].typ != EnumToken.UrlTokenTokenType)) {

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: '@document',
                error: 'expecting string argument',
                tokens
            }
        }

        tokens.shift();
        consumeWhitespace(tokens);
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: atRule,
        syntax: '@document',
        error: '',
        tokens
    }
}