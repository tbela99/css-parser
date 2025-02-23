import type {AstAtRule, AstRule, Token} from "../../../@types";
import type {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {ValidationLevel} from "../../ast";
import {validateSelector} from "./selector";
import {consumeWhitespace, splitTokenList} from "../utils";


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

    let result: ValidationSyntaxResult | null = null;

    for (const t of splitTokenList(tokens)) {

            result = validateSelector(t, root, options);

            if (result.valid == ValidationLevel.Drop) {

                return result;
            }
    }

    // @ts-ignore
    return result ?? {
        valid: ValidationLevel.Drop,
        matches: [],
        // @ts-ignore
        node: root,
        syntax: null,
        error: 'expecting complex selector list',
        tokens
    };
}