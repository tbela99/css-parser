import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import type {FunctionImageToken, Token} from "../../../@types/index.d.ts";
import {EnumToken, ValidationLevel} from "../../ast/index.ts";
import {createContext, doEvaluateSyntax} from "../syntax.ts";
import {getParsedSyntax} from "../config.ts";
import {ValidationSyntaxGroupEnum, ValidationToken} from "../parser/index.ts";
import {validateURL} from "./url.ts";

export function validateImage(token: Token): ValidationSyntaxResult {

    if (token.typ == EnumToken.UrlFunctionTokenType) {

        return validateURL(token);
    }

    if (token.typ == EnumToken.ImageFunctionTokenType) {

        return doEvaluateSyntax(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, (token as FunctionImageToken).val + '()') as ValidationToken[],createContext( (token as FunctionImageToken).chi));
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