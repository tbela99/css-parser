// <compound-selector> [ <combinator>? <compound-selector> ]*
import type {AstAtRule, AstRule, Token} from "../../../@types/index.d.ts";
import type {ValidationSelectorOptions, ValidationSyntaxResult} from "../../../@types/validation.d.ts";
import {SyntaxValidationResult} from "../../ast/index.ts";

export function validateBGLayers(tokens: Token[], root?: AstAtRule | AstRule, options?: ValidationSelectorOptions): ValidationSyntaxResult {

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
