import type {AstAtRule, AstRule, Token} from "../../../@types";
import {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation";
import {consumeWhitespace} from "../utils";
import {ValidationLevel} from "../../ast";
import {validateSelector} from "./selector";
import {combinatorsTokens} from "./complex-selector";


export function validateRelativeSelector(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {

    tokens = tokens.slice();

    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        return {
            valid: ValidationLevel.Drop,
            matches: [],
            // @ts-ignore
            node: root,
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
