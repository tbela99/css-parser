import type {AstAtRule, Token} from "../../../@types";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {EnumToken, ValidationLevel} from "../../ast";
import {validateKeyframeSelector} from "./keyframe-selector";


export function validateKeyframeBlockList(tokens: Token[], atRule: AstAtRule): ValidationSyntaxResult {

    let i: number = 0;
    let j: number = 0;
    let result: ValidationSyntaxResult | null = null;

    while (i + 1 < tokens.length) {

        if (tokens[++i].typ == EnumToken.CommaTokenType) {

            result = validateKeyframeSelector(tokens.slice(j, i), atRule);

            if (result.valid == ValidationLevel.Drop) {

                return result;
            }

            j = i + 1;
            i = j;
        }
    }

    return validateKeyframeSelector(i == j ? tokens.slice(i) : tokens.slice(j, i + 1), atRule);
}