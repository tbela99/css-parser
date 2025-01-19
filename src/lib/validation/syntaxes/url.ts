import type {Token} from "../../../@types";
import {ValidationSyntaxResult} from "../../../@types/validation";
import {EnumToken, ValidationLevel} from "../../ast";
import {consumeWhitespace} from "../utils";


export function validateURL(token: Token): ValidationSyntaxResult {

    if (token.typ == EnumToken.UrlTokenTokenType) {

        return {
            valid: ValidationLevel.Valid,
            matches: [],
            node: token,
            syntax: 'url()',
            error: '',
            tokens: []
        }
    }

    if (token.typ != EnumToken.UrlFunctionTokenType) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: token,
            syntax: 'url()',
            error: 'expected url()',
            tokens: []
        }
    }

    const children = token.chi.slice() as Token[];

    consumeWhitespace(children);

    if (children.length == 0 || ![EnumToken.UrlTokenTokenType, EnumToken.StringTokenType, EnumToken.HashTokenType].includes(children[0].typ)) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: children[0] ?? token,
            syntax: 'url()',
            error: 'expected url-token',
            tokens: children
        }
    }

    children.shift();

    consumeWhitespace(children);

    if (children.length > 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: children[0] ?? token,
            syntax: 'url()',
            error: 'unexpected token',
            tokens: children
        }
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: token,
        syntax: 'url()',
        error: '',
        tokens: []
    }
}