import type {AstAtRule, AstRule, Token} from "../../../@types";
import {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation";
import {EnumToken, ValidationLevel} from "../../ast";
import {validateSelector} from "./selector";
import {consumeWhitespace} from "../utils";


export function validateComplexSelectorList(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {

    tokens = tokens.slice();

    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: root,
            syntax: null,
            error: 'expecting complex selector list',
            tokens
        }
    }

    let i: number = -1;
    let j: number = 0;
    let result: ValidationSyntaxResult | null = null;

    while (i + 1 < tokens.length) {

        if (tokens[++i].typ == EnumToken.CommaTokenType) {

            result = validateSelector(tokens.slice(j, i), root, options);

            if (result.valid == ValidationLevel.Drop) {

                return result;
            }

            j = i + 1;
            i = j;
        }
    }

    return validateSelector(i == j ? tokens.slice(i) : tokens.slice(j, i + 1), root, options);
}