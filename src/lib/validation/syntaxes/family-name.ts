import type {AstAtRule, Token} from "../../../@types";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast/index.ts";
import {consumeWhitespace} from "../utils/index.ts";

export function validateFamilyName(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    let node: Token;

    tokens = tokens.slice();

    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: atRule,
            syntax: null,
            error: 'expected at-rule prelude',
            tokens
        } as ValidationSyntaxResult;
    }

    if (tokens[0].typ == EnumToken.CommaTokenType) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: tokens[0],
            syntax: null,
            error: 'unexpected token',
            tokens
        } as ValidationSyntaxResult;
    }

    while (tokens.length > 0) {

        // @ts-ignore
        if (tokens[0].typ == EnumToken.CommaTokenType) {

            node = tokens.shift() as Token;

            consumeWhitespace(tokens);

            if (tokens.length == 0) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: [],
                    node,
                    syntax: null,
                    error: 'unexpected token',
                    tokens
                } as ValidationSyntaxResult;
            }
        }

        node = tokens[0];

        if (![EnumToken.IdenTokenType, EnumToken.StringTokenType].includes(node.typ)) {

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node,
                syntax: null,
                error: 'unexpected token',
                tokens
            } as ValidationSyntaxResult;
        }

        tokens.shift();
        consumeWhitespace(tokens);

        // @ts-ignore
        if (tokens.length > 0 && node.typ == EnumToken.BadStringTokenType && tokens[0].typ != EnumToken.CommaTokenType) {

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: tokens[0],
                syntax: null,
                error: 'expected comma token',
                tokens
            } as ValidationSyntaxResult;
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
    } as ValidationSyntaxResult;
}