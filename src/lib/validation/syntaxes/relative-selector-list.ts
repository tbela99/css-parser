import type {AstAtRule, AstRule, Token} from "../../../@types/index.d.ts";
import type {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {SyntaxValidationResult} from "../../ast/index.ts";
import {validateRelativeSelector} from "./relative-selector.ts";
import {consumeWhitespace, splitTokenList} from "../utils/index.ts";

export function validateRelativeSelectorList(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {
    tokens = tokens.slice();

    consumeWhitespace(tokens);

    for (const t of splitTokenList(tokens)) {

        const result: ValidationSyntaxResult = validateRelativeSelector(t, root, options);

        if (result.valid == SyntaxValidationResult.Drop) {
            return result;
        }
    }

    return {
        valid: SyntaxValidationResult.Valid,
        matches: [],
        // @ts-ignore
        node: root,
        // @ts-ignore
        syntax: null,
        error: '',
        tokens
    }
}