import type {IdentToken, Token, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {consumeWhitespace, splitTokenList} from "../utils/index.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";

export function validateKeyframeSelector(tokens: Token[], options: ValidationOptions): ValidationSyntaxResult {

    consumeWhitespace(tokens);

    for (const t of splitTokenList(tokens)) {

        if (t.length != 1 || (t[0].typ != EnumToken.PercentageTokenType && !(t[0].typ == EnumToken.IdenTokenType && ['from', 'to', 'cover', 'contain', 'entry', 'exit', 'entry-crossing', 'exit-crossing'].includes((t[0] as IdentToken).val)))) {

            return {
                valid: SyntaxValidationResult.Drop,
                context: [],
                node: t[0],
                syntax: null,
                error: 'expected keyframe selector'
            }
        }
    }

    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        context: [],
        node: null,
        // @ts-ignore
        syntax: null,
        error: ''
    }
}