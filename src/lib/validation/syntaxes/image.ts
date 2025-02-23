import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import type {FunctionImageToken, Token} from "../../../@types/index.d.ts";
import {EnumToken, ValidationLevel} from "../../ast";
import {validateSyntax} from "../syntax";
import {getParsedSyntax} from "../config";
import {ValidationSyntaxGroupEnum, ValidationToken} from "../parser";
import {validateURL} from "./url";

export function validateImage(token: Token): ValidationSyntaxResult {

    if (token.typ == EnumToken.UrlFunctionTokenType) {

        return validateURL(token);
    }

    if (token.typ == EnumToken.ImageFunctionTokenType) {

        return validateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (token as FunctionImageToken).val + '()') as ValidationToken[], (token as FunctionImageToken).chi);
    }

    return {
        valid: ValidationLevel.Drop,
        matches: [],
        node: token,
        syntax: 'image()',
        error: 'expected <image> or <url>',
        tokens: []
    }
}