import type {AstAtRule, AstNode, FunctionToken, Token, ValidationOptions} from "../../../@types";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace} from "../utils";
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

    if (tokens[0].typ == EnumToken.CommaTokenType) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: '@document',
            error: 'unexpected token',
            tokens
        }
    }

    while (tokens.length > 0) {

        if (tokens[0].typ == EnumToken.CommentTokenType) {

            tokens.shift();
            consumeWhitespace(tokens);
        }

        result = validateURL(tokens[0]);

        if (result.valid == ValidationLevel.Valid) {

            tokens.shift();
            consumeWhitespace(tokens);
            continue;
        }

        if (tokens[0].typ == EnumToken.FunctionTokenType) {

            if (!['url-prefix', 'domain', 'media-document', 'regexp'].some((t) => t.localeCompare((tokens[0] as FunctionToken).val, undefined, {sensitivity: 'base'}) == 0)) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: tokens[0],
                    syntax: '@document',
                    error: 'unexpected token',
                    tokens
                }
            }

            const children = (tokens[0] as FunctionToken).chi.slice() as Token[];

            consumeWhitespace(children);

            if (children.length == 0) {

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

            if (children[0].typ == EnumToken.StringTokenType) {

                children.shift();
                consumeWhitespace(children);
            }

            if (children.length > 0) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node: children[0],
                    syntax: '@document',
                    error: 'unexpected token',
                    tokens
                }
            }

            tokens.shift();
            consumeWhitespace(tokens);
        }
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