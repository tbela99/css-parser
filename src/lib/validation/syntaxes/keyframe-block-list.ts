import type {AstAtRule, Token, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast/index.ts";
import {validateKeyframeSelector} from "./keyframe-selector.ts";


export function validateKeyframeBlockList(tokens: Token[], atRule: AstAtRule, options: ValidationOptions): ValidationSyntaxResult {

    let i: number = 0;
    let j: number = 0;
    let result: ValidationSyntaxResult | null = null;

    while (i + 1 < tokens.length) {

        if (tokens[++i].typ == EnumToken.CommaTokenType) {

            result = validateKeyframeSelector(tokens.slice(j, i), options) as ValidationSyntaxResult;

            if (result.valid == ValidationLevel.Drop) {

                return result as ValidationSyntaxResult;
            }

            j = i + 1;
            i = j;
        }
    }

    return validateKeyframeSelector(i == j ? tokens.slice(i) : tokens.slice(j, i + 1), options);
}