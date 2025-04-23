import type {AstAtRule, AstRule, Token} from "../../../@types/index.d.ts";
import type {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {ValidationLevel} from "../../ast/index.ts";
import {validateRelativeSelector} from "./relative-selector.ts";
import {consumeWhitespace, splitTokenList} from "../utils/index.ts";

export function validateRelativeSelectorList(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {

    let i: number = -1;
    let j: number = 0;
    let result: ValidationSyntaxResult | null = null;

    tokens = tokens.slice();

    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: root,
            // @ts-ignore
            syntax: null,
            error: 'expecting relative selector list',
            tokens
        }
    }

    for (const t of splitTokenList(tokens)) {

        if (t.length == 0) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                // @ts-ignore
                node: root,
                // @ts-ignore
                syntax: null,
                error: 'unexpected comma',
                tokens
            }
        }

        const result: ValidationSyntaxResult = validateRelativeSelector(t, root, options);

        if (result.valid == ValidationLevel.Drop) {
            return result;
        }
    }

    return {
        valid: ValidationLevel.Valid,
        matches: [],
        // @ts-ignore
        node: root,
        // @ts-ignore
        syntax: null,
        error: '',
        tokens
    }
}