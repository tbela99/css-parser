import { SyntaxValidationResult } from "../lib/ast/types.ts";
import type { AstNode } from "./ast.d.ts";
import type { Token } from "./token.d.ts";
import type { ValidationOptions } from "./index.d.ts";
import { MediaFeatureType, ValidationSyntaxGroupEnum } from "../lib/validation/parser/typedef.ts";

/**
 * Validation syntax
 * @internal
 */
export declare interface ValidationSyntaxNode {
    /**
     * mdn data syntax
     */
    syntax: string;
    /**
     * validation tokens
     */
    ast?: ValidationToken[];
    /**
     * descriptors
     */
    descriptors?: Record<string, Record<string, string>>;
}

/**
 * Validation selector options
 * @internal
 */
export interface ValidationSelectorOptions extends ValidationOptions {
    /**
     * nested selector
     */
    nestedSelector?: boolean;
}

/**
 * Validation media feature
 * @internal
 */
export declare interface ValidationMediaFeature {
    /**
     * media feature type
     */
    type: MediaFeatureType;
    /**
     * media feature status
     */
    status?: string;
    /**
     * media feature category
     */
    category: string;
    /**
     * media feature values
     */
    values?: Array<string> | Array<number>;
}

/**
 * Validation configuration
 * @internal
 */
export declare type ValidationConfiguration = Record<
    ValidationSyntaxGroupEnum,
    ValidationSyntaxNode | Record<string, string[]> | Record<string, ValidationMediaFeature>
>;

/**
 * Validation result
 * @internal
 */
export interface ValidationResult {
    /**
     * validation result
     */
    valid: SyntaxValidationResult;
    /**
     * node
     */
    node: AstNode | Token | null;
    /**
     * syntax
     */
    syntax: ValidationToken | string | null;
    /**
     * error
     */
    error: string;
    /**
     * cycle
     */
    cycle?: boolean;
}

/**
 * Validation syntax result
 * @internal
 */
export interface ValidationSyntaxResult extends ValidationResult {
    /**
     * syntax
     */
    syntax: ValidationToken | string | null;
    /**
     * context
     */
    context: ValidationContext<Token> | Token[];
}
