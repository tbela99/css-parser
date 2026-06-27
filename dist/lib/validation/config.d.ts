import type { ValidationConfiguration } from "../../@types/validation.d.ts";
import type { ValidationToken } from "./parser/types.d.ts";
export interface ValidationSyntaxRule {
    acceptAnyDeclarations: boolean;
    acceptAnyRules: boolean;
    getRules: () => ValidationToken[];
    getBlockRules: () => ValidationToken[] | null;
    getPreludeRules: () => ValidationToken[] | null;
    getPropertyDescriptors: () => Record<string, ValidationToken[]> | null;
}
export declare function getSyntaxConfig(): ValidationConfiguration;
export declare const getSyntax: (...args: any[]) => any;
export declare const getParsedSyntax: (...args: any[]) => any;
export declare const getSyntaxRule: (...args: any[]) => any;
