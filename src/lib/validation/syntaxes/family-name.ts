import type {AstAtRule, Token} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";
import {consumeWhitespace} from "../utils/index.ts";

export function validateFamilyName(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    let node: Token;

    tokens = tokens.slice();

    consumeWhitespace(tokens);

    if (tokens.length == 0 || tokens[0].typ == EnumToken.CommaTokenType) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            matches: [],
            node: tokens[0],
            syntax: null,
            error: 'unexpected token',
            tokens
        } as ValidationSyntaxResult;
    }

    while (tokens.length > 0) {

        node = tokens[0];

        if (![EnumToken.IdenTokenType, EnumToken.StringTokenType].includes(node.typ)) {

            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
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
        if (tokens.length > 0 && tokens[0].typ == EnumToken.CommaTokenType) {

            tokens.shift();
        }
    }

    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        matches: [],
        node: null,
        syntax: null,
        error: '',
        tokens
    } as ValidationSyntaxResult;
}