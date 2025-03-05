import {ValidationLevel, ValidationSyntaxGroupEnum} from "../lib/index.ts";
import type {AstNode} from "./ast.d.ts";
import type {Token} from "./token.d.ts";
import type {ValidationToken} from "../lib/validation/parser/index.ts";
import type {ValidationOptions} from "./index.d.ts";

export declare interface ValidationSyntaxNode {

    syntax: string;
    ast?: ValidationToken[];
}

export interface ValidationSelectorOptions extends ValidationOptions{

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