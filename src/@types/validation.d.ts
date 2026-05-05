import { SyntaxValidationResult } from "../lib/ast/types.ts";
import type { AstNode } from "./ast.d.ts";
import type { Token } from "./token.d.ts";
import type { ValidationOptions } from "./index.d.ts";
import { MediaFeatureType, ValidationSyntaxGroupEnum } from "../lib/validation/parser/typedef.ts";

export declare interface ValidationSyntaxNode {
    syntax: string;
    ast?: ValidationToken[];
    descriptors?: Record<string, Record<string, string>>;
}

export interface ValidationSelectorOptions extends ValidationOptions {
    nestedSelector?: boolean;
}

export declare interface ValidationMediaFeature {
    type: MediaFeatureType;
    status?: string;
    category: string;
    values?: Array<string> | Array<number>;
}

export declare type ValidationConfiguration = Record<
    ValidationSyntaxGroupEnum,
    ValidationSyntaxNode | Record<string, string[]> | Record<string, ValidationMediaFeature>
>;

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

    /**
     * The length of the context tokens to be consumed
     */

    readonly length: number;

    current<Type>(): Type | null;

    update<Type>(context: Context<Type>): void;

    consume<Type>(token: Type, howMany?: number): boolean;

    peek<Type>(): Type | null;

    // tokens<Type>(): Type[];

    next<Type>(): Type | null;

    consume<Type>(token: Type, howMany?: number): boolean;

    slice<Type>(): Type[];

    clone<Type>(): Context<Type>;

    done(): boolean;
}
