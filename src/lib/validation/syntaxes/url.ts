import type {FunctionURLToken, Token} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";
import {consumeWhitespace} from "../utils/index.ts";


export function validateURL(token: Token): ValidationSyntaxResult {

    if (token.typ == EnumToken.UrlTokenTokenType) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Valid,
            context: [],
            node: token,
            // @ts-ignore
            syntax: 'url()',
            error: ''
        }
    }

    if (token.typ != EnumToken.UrlFunctionTokenType) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: token,
            // @ts-ignore
            syntax: 'url()',
            error: 'expected url()'
        }
    }

    const children = (token as FunctionURLToken).chi.slice() as Token[];

    consumeWhitespace(children);

    if (children.length == 0 || ![EnumToken.UrlTokenTokenType, EnumToken.StringTokenType, EnumToken.HashTokenType].includes(children[0].typ)) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: children[0] ?? token,
            // @ts-ignore
            syntax: 'url()',
            error: 'expected url-token'
        }
    }

    children.shift();

    consumeWhitespace(children);

    if (children.length > 0) {

        // @ts-ignore
        return {
            valid: SyntaxValidationResult.Drop,
            context: [],
            node: children[0] ?? token,
            // @ts-ignore
            syntax: 'url()',
            error: 'unexpected token'
        }
    }

    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: token,
        // @ts-ignore
        syntax: 'url()',
        error: ''
    }
}