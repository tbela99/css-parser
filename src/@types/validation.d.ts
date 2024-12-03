import {ValidationLevel, ValidationSyntaxGroupEnum} from "../lib";
import {AstNode} from "./ast.d.ts";
import {Token} from "./token.d.ts";

export declare interface ValidationConstrains {

    optional?: boolean;
    multiple?: boolean;
    occurrence?: number | {

        min?: number;
        max?: number;
    }
    range?: {
        min?: number,
        max?: number;
    }
}

export declare interface ValidationTokenGeneric extends ValidationConstrains {

    type: string;
    name?: string;
    value?: string;
}

export declare interface ValidationTokenGroup extends ValidationConstrains {

    type: 'all' | 'any' | 'children';
    value: ValidationTokenList
}

export declare interface ValidationTokenFunction extends ValidationConstrains {
    type: 'function',
    name: string,
    arguments: ValidationTokenList;
}

export declare type ValidationToken = ValidationTokenFunction | ValidationTokenGeneric | ValidationTokenGroup;
export declare type ValidationTokenList = Array<ValidationToken>;

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
    error: string;
}

export interface ValidationSyntaxResult extends ValidationResult {

    tokens: Token[] | AstNode[];
    matches: Token[] | AstNode[];
}