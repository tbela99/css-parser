import type {Token} from "../../../@types/index.d.ts";
import {EnumToken, SyntaxValidationResult} from "../../ast/index.ts";
import type {ValidationSyntaxResult} from "../../../@types/validation.d.ts";

export function validateLayerName(tokens: Token[]): ValidationSyntaxResult {

    const slice: Token[][] = tokens.reduce((acc: Token[][], curr: Token) => {

        if (curr.typ == EnumToken.CommaTokenType) {

            acc.push([]);
        } else if (curr.typ != EnumToken.CommentTokenType) {

            acc[acc.length - 1].push(curr);
        }

        return acc
    }, [[]] as Token[][]);

    for (let i = 0; i < slice.length; i++) {

        if (slice[i].length == 0) {

            // @ts-ignore
            return {
                valid: SyntaxValidationResult.Drop,
                matches: tokens,
                node: null,
                syntax: null,
                error: 'Invalid ident',
                tokens
            } as ValidationSyntaxResult
        }

        for (let j = 0; j < slice[i].length; j++) {

            if (slice[i][j].typ != EnumToken.IdenTokenType &&slice[i][j].typ != EnumToken.ClassSelectorTokenType) {

                // @ts-ignore
                return {
                    valid: SyntaxValidationResult.Drop,
                    matches: tokens,
                    node: slice[i][j],
                    syntax: '<layer-name>',
                    error: 'expecting ident or class selector',
                    tokens
                } as ValidationSyntaxResult
            }
        }
    }

    // @ts-ignore
    return {
        valid: SyntaxValidationResult.Valid,
        matches: tokens,
        node: null,
        syntax: null,
        error: '',
        tokens
    } as ValidationSyntaxResult
}