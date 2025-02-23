import type {AstAtRule, AstRule, Token} from "../../../@types";
import type {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {consumeWhitespace, splitTokenList} from "../utils";
import {EnumToken, ValidationLevel} from "../../ast";
import {validateCompoundSelector} from "./compound-selector";

export const combinatorsTokens: EnumToken[] = [EnumToken.ChildCombinatorTokenType, EnumToken.ColumnCombinatorTokenType,
    // EnumToken.DescendantCombinatorTokenType,
    EnumToken.NextSiblingCombinatorTokenType, EnumToken.SubsequentSiblingCombinatorTokenType];

// <compound-selector> [ <combinator>? <compound-selector> ]*
export function validateComplexSelector(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {

    // [ <type-selector>? <subclass-selector>* [ <pseudo-element-selector> <pseudo-class-selector>* ]* ]!
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

    // const config = getSyntaxConfig();
    //
    // let match: number = 0;

    let result: ValidationSyntaxResult | null = null;

    // const combinators: EnumToken[] = combinatorsTokens.filter((t: EnumToken) => t != EnumToken.DescendantCombinatorTokenType);

    for (const t of splitTokenList(tokens, combinatorsTokens)) {

        result = validateCompoundSelector(t, root, options);

        if (result.valid == ValidationLevel.Drop) {

            return result;
        }
    }

    // @ts-ignore
    return result ?? {
        valid: ValidationLevel.Drop,
        matches: [],
        node: root,
        syntax: null,
        error: 'expecting compound-selector',
        tokens
    }
}