import type {AstAtRule, AstRule, Token} from "../../../@types/index.d.ts";
import type {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {consumeWhitespace, splitTokenList} from "../utils/index.ts";
import {EnumToken, ValidationLevel} from "../../ast/index.ts";
import {validateCompoundSelector} from "./compound-selector.ts";

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
            context: [],
            // @ts-ignore
            node: root,
            syntax: null,
            error: 'expected selector'
        }
    }

    // const config = getSyntaxConfig();
    //
    // let match: number = 0;

    let result: ValidationSyntaxResult | null = null;

    // const combinators: EnumToken[] = combinatorsTokens.filter((t: EnumToken) => t != EnumToken.DescendantCombinatorTokenType);

    for (const t of splitTokenList(tokens, combinatorsTokens)) {

        result = validateCompoundSelector(t, root, options) as ValidationSyntaxResult;

        if (result.valid == ValidationLevel.Drop) {

            return result;
        }
    }

    // @ts-ignore
    return result ?? {
        valid: ValidationLevel.Drop,
        context: [],
        node: root,
        syntax: null,
        error: 'expecting compound-selector'
    }
}