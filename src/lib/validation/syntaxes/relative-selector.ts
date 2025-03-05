import type {AstAtRule, AstRule, Token} from "../../../@types/index.d.ts";
import type {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {consumeWhitespace} from "../utils/index.ts";
import {ValidationLevel} from "../../ast/index.ts";
import {validateSelector} from "./selector.ts";
import {combinatorsTokens} from "./complex-selector.ts";


export function validateRelativeSelector(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {

    tokens = tokens.slice();

    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: root,
            // @ts-ignore
            syntax: null,
            error: 'expected selector',
            tokens
        }
    }

// , EnumToken.DescendantCombinatorTokenType
    if (combinatorsTokens.includes(tokens[0].typ)) {

        tokens.shift();
        consumeWhitespace(tokens);
    }

    return validateSelector(tokens, root, options);
}
