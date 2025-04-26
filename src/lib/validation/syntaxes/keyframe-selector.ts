import type {IdentToken, Token, ValidationOptions} from "../../../@types/index.d.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {consumeWhitespace, splitTokenList} from "../utils/index.ts";
import {EnumToken, ValidationLevel} from "../../ast/index.ts";

export function validateKeyframeSelector(tokens: Token[], options: ValidationOptions): ValidationSyntaxResult {

    consumeWhitespace(tokens);

    if (tokens.length == 0) {

        // @ts-ignore
        return {
            valid: ValidationLevel.Drop,
            matches: [],
            node: null,
            syntax: null,
            error: 'expected keyframe selector',
            tokens
        }
    }

    for (const t of splitTokenList(tokens)) {

        if (t.length != 1) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: t[0] ?? null,
                syntax: null,
                error: 'unexpected token',
                tokens
            }
        }

        if (t[0].typ != EnumToken.PercentageTokenType && !(t[0].typ == EnumToken.IdenTokenType && ['from', 'to', 'cover', 'contain', 'entry', 'exit', 'entry-crossing', 'exit-crossing'].includes((t[0] as IdentToken).val))) {

            return {
                valid: ValidationLevel.Drop,
                matches: [],
                node: t[0],
                syntax: null,
                error: 'expected keyframe selector',
                tokens
            }
        }
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: [],
        node: null,
        // @ts-ignore
        syntax: null,
        error: '',
        tokens
    }
}