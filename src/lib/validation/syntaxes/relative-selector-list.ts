import type {AstAtRule, AstRule, Token} from "../../../@types";
import type {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast";
import {validateRelativeSelector} from "./relative-selector";

export function validateRelativeSelectorList(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {

    let i: number = 0;
    let j: number = 0;
    let result: ValidationSyntaxResult | null = null;

    while (i + 1 < tokens.length) {

        if (tokens[++i].typ == EnumToken.CommaTokenType) {

            result = validateRelativeSelector(tokens.slice(j, i), root, options);

            if (result.valid == ValidationLevel.Drop) {

                return result;
            }

            j = i + 1;
            i = j;
        }
    }

    return validateRelativeSelector(i == j ? tokens.slice(i) : tokens.slice(j, i + 1), root, options);
}