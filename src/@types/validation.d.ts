import {SyntaxValidationResult, ValidationSyntaxGroupEnum} from "../lib/index.ts";
import type {AstNode} from "./ast.d.ts";
import type {Token} from "./token.d.ts";
import type {ValidationToken} from "../lib/validation/parser/index.ts";
import type {ValidationOptions} from "./index.d.ts";

export declare interface ValidationSyntaxNode {

    syntax: string;
    ast?: ValidationToken[];
}

export interface ValidationSelectorOptions extends ValidationOptions {

    nestedSelector?: boolean;
}

export declare interface ValidationConfiguration {

    [ValidationSyntaxGroupEnum.Declarations]: ValidationSyntaxNode;
    [ValidationSyntaxGroupEnum.Functions]: ValidationSyntaxNode;
    [ValidationSyntaxGroupEnum.Syntaxes]: ValidationSyntaxNode;
    [ValidationSyntaxGroupEnum.Selectors]: ValidationSyntaxNode;
    [ValidationSyntaxGroupEnum.AtRules]: ValidationSyntaxNode;
}

//= Record<keyof ValidationSyntaxGroupEnum, ValidationSyntaxNode>;

export interface ValidationResult {

    valid: SyntaxValidationResult;
    node: AstNode | Token | null;
    syntax: ValidationToken | string | null;
    error: string;
    cycle?: boolean;
}

export interface ValidationSyntaxResult extends ValidationResult {

    syntax: ValidationToken | string | null;
    context: Context<Token> | Token[];
}

export interface Context<Type> {

    index: number;

    current<Type>(): Type | null;

    update<Type>(context: Context<Type>): void;

    peek<Type>(): Type | null;

    next<Type>(): Type | null;

    tokens<Type>(): Type[];

    slice<Type>(): Type[];

    clone<Type>(): Context<Type>;

    done(): boolean;
}