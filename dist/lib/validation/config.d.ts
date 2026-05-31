import type { ValidationConfiguration } from "../../@types/validation.d.ts";
import type { ValidationToken } from "./parser/types.d.ts";
import { ValidationSyntaxGroupEnum } from "./parser/typedef.ts";
export interface ValidationSyntaxRule {
    acceptAnyDeclarations: boolean;
    acceptAnyRules: boolean;
    getRules: () => ValidationToken[];
    getBlockRules: () => ValidationToken[] | null;
    getPreludeRules: () => ValidationToken[] | null;
    getPropertyDescriptors: () => Record<string, ValidationToken[]> | null;
}
export declare function getSyntaxConfig(): ValidationConfiguration;
export declare function getSyntax(group: ValidationSyntaxGroupEnum, key: string | string[]): null | string;
export declare function getParsedSyntax(group: ValidationSyntaxGroupEnum, key: string | string[]): null | ValidationToken[];
export declare function getSyntaxRule(group: ValidationSyntaxGroupEnum, key: string | string[]): ValidationSyntaxRule | null;
