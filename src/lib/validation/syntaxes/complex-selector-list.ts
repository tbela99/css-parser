import type {AstAtRule, AstRule, Token} from "../../../@types/index.d.ts";
import type {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {SyntaxValidationResult} from "../../ast/index.ts";
import {validateSelector} from "./selector.ts";
import {consumeWhitespace, splitTokenList} from "../utils/index.ts";


export function validateComplexSelectorList(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {

    tokens = tokens.slice();

    consumeWhitespace(tokens);

    // if (tokens.length == 0) {
    //
    //     return {
    //         valid: SyntaxValidationResult.Drop,
    //         context: [],
    //         // @ts-ignore
    //         node: root,
    //         syntax: null,
    //         error: 'expecting complex selector list'
    //     }
    // }

    let result: ValidationSyntaxResult | null = null;

    for (const t of splitTokenList(tokens)) {

            result = validateSelector(t, root, options) as ValidationSyntaxResult;

            if (result.valid == SyntaxValidationResult.Drop) {

                return result;
            }
    }

    // @ts-ignore
    return result;
}