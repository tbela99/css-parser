import {ValidationLevel} from "../lib";

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
    ast: ValidationToken[];

}

export declare interface ValidationConfiguration {

    declarations: Record<string, ValidationSyntaxNode>;
    functions: Record<string, ValidationSyntaxNode>;
    syntaxes: Record<string, ValidationSyntaxNode>;
    selectors: Record<string, ValidationSyntaxNode>;
}

export interface ValidationResult {

    valid: ValidationLevel;
    node: AstNode | Token | null;
    error: string;
}