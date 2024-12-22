import {ValidationLevel, ValidationSyntaxGroupEnum} from "../lib";
import {AstNode} from "./ast.d.ts";
import {Token} from "./token.d.ts";
export declare interface ValidationSyntaxNode {

    syntax: string;
    ast?: ValidationToken[];
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
    syntax: ValidationToken | null;
    error: string;
}

export interface ValidationSyntaxResult extends ValidationResult {

    syntax: ValidationToken ;
    tokens: Token[] | AstNode[];
    matches: Token[] | AstNode[];
}