import type {Token} from "../../../@types";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace} from "../utils";


export function validateURL(token: Token): ValidationSyntaxResult {

    if (token.typ == EnumToken.UrlTokenTokenType) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: token,
            // @ts-ignore
            syntax: 'url()',
            error: '',
            tokens: []
        }
    }

    if (token.typ != EnumToken.UrlFunctionTokenType) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: token,
            // @ts-ignore
            syntax: 'url()',
            error: 'expected url()',
            tokens: []
        }
    }

    const children = token.chi.slice() as Token[];

    consumeWhitespace(children);

    if (children.length == 0 || ![EnumToken.UrlTokenTokenType, EnumToken.StringTokenType, EnumToken.HashTokenType].includes(children[0].typ)) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: children[0] ?? token,
            // @ts-ignore
            syntax: 'url()',
            error: 'expected url-token',
            tokens: children
        }
    }

    children.shift();

    consumeWhitespace(children);

    if (children.length > 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: children[0] ?? token,
            // @ts-ignore
            syntax: 'url()',
            error: 'unexpected token',
            tokens: children
        }
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: token,
        // @ts-ignore
        syntax: 'url()',
        error: '',
        tokens: []
    }
}