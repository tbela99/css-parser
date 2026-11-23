import type { ValidationConfiguration } from "../../@types/validation.d.ts";
import type { ValidationToken } from "./parser/types.d.ts";
import { ValidationSyntaxGroupEnum } from "./parser/typedef.ts";
export interface ValidationSyntaxRule {
    optionalBody: boolean;
    acceptAnyDeclaration: boolean;
    acceptAnyRule: boolean;
    getBlockRules: () => ValidationToken[] | null;
    getPreludeRules: () => ValidationToken[] | null;
    getPropertyDescriptors: () => Record<string, ValidationToken[]> | null;
}
export declare function getSyntaxConfig(): ValidationConfiguration;
/**
 * true if a type or a function syntax is defined
 * @param key the type name without the angle brackets, or the function name followed by `()`
 */
export declare function hasSyntax(key: string): boolean;
/**
 * return the raw syntax of a type or a function
 * @param key the type name without the angle brackets, or the function name followed by `()`
 */
export declare function getSyntax(key: string): string | null;
export declare const getParsedSyntax: (group: ValidationSyntaxGroupEnum, key: string) => null | ValidationToken[];
export declare const getSyntaxRule: (group: ValidationSyntaxGroupEnum, key: string) => ValidationSyntaxRule | null;
