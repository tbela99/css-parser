import type {Token} from "../../../@types";
import {EnumToken, ValidationLevel} from "../../ast";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";

export function validateLayerName(tokens: Token[]): ValidationSyntaxResult {

    const slice: Token[][] = tokens.reduce((acc: Token[][], curr: Token) => {

        if (curr.typ == EnumToken.CommaTokenType) {

            acc.push([]);
        } else if (curr.typ != EnumToken.CommentTokenType) {

            acc[acc.length - 1].push(curr);
        }

        return acc
    }, [[]] as Token[][]).slice(1);

    for (let i = 0; i < slice.length; i++) {

        if (slice[i].length == 0) {

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: tokens,
                node: null,
                syntax: null,
                error: 'Invalid ident',
                tokens
            } as ValidationSyntaxResult
        }

        if (slice[i][0].typ != EnumToken.IdenTokenType) {

            // @ts-ignore
            return {
                valid: ValidationLevel.Drop,
                matches: tokens,
                node: slice[i][0],
                syntax: 'ident',
                error: 'expecting ident',
                tokens
            } as ValidationSyntaxResult
        }

        for (let j = 1; j < slice[i].length; j++) {

            if (slice[i][j].typ != EnumToken.ClassSelectorTokenType) {

                // @ts-ignore
                return {
                    valid: ValidationLevel.Drop,
                    matches: tokens,
                    node: slice[i][j],
                    syntax: 'layer-name',
                    error: 'expecting class selector',
                    tokens
                } as ValidationSyntaxResult
            }
        }
    }

    // @ts-ignore
    return {
        valid: ValidationLevel.Valid,
        matches: tokens,
        node: null,
        syntax: null,
        error: '',
        tokens
    } as ValidationSyntaxResult
}