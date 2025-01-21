import {ValidationLevel, ValidationSyntaxGroupEnum} from "../lib";
import {AstNode} from "./ast.d.ts";
import {Token} from "./token.d.ts";
import type {ValidationToken} from "../lib/validation/parser";

export declare interface ValidationSyntaxNode {

    syntax: string;
    ast?: ValidationToken[];
}

export interface ValidationSelectorOptions {

    nestedSelector?: boolean;
}

export declare interface ValidationConfiguration {

    declarations: Record<ValidationSyntaxGroupEnum.Declarations, ValidationSyntaxNode>;
    functions: Record<ValidationSyntaxGroupEnum.Functions, ValidationSyntaxNode>;
    syntaxes: Record<ValidationSyntaxGroupEnum.Syntaxes, ValidationSyntaxNode>;
    selectors: Record<ValidationSyntaxGroupEnum.Selectors, ValidationSyntaxNode>;
    atRules: Record<ValidationSyntaxGroupEnum.AtRules, ValidationSyntaxNode>;
}

export interface ValidationResult {

    valid: ValidationLevel;
    node: AstNode | Token | null;
    syntax: ValidationToken | string | null;
    error: string;
}

export interface ValidationSyntaxResult extends ValidationResult {

    syntax: ValidationToken | string | null;
    tokens: Token[] | AstNode[];
    matches: Token[] | AstNode[];
}