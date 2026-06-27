import type { ErrorDescription, ParserOptions, Token, ValidationOptions } from "../../@types/index.d.ts";
import { EnumToken } from "../ast/types.ts";
import type { ValidationToken } from "./parser/types.d.ts";
import type { ValidationContext, ValidationMatch } from "./types.d.ts";
import type { ValidationMediaFeature } from "../../@types/validation.d.ts";
export declare const funcTypes: EnumToken[];
export declare function trimArray(tokens: Token[]): Token[];
export declare function isMFName(featureName: string): boolean;
/**
 *
 * @param featureName
 * @returns
 */
export declare function getMFInfo(featureName: string): ValidationMediaFeature | null;
/**
 *
 * @param featureName
 * @param tokens
 * @returns object with:
 * - valid: boolean. true the media feaure is known or is a custom property. false otherwise
 * - success: boolean. validation result
 */
export declare function isMFValue(featureName: string, tokens: Token[], isMFRange?: boolean): {
    valid: boolean;
    success: boolean;
    isValueAllowed?: boolean;
};
export declare function isStyleRangeValue(tokens: Token[]): {
    success: boolean;
    errors: ErrorDescription[];
};
export declare function createValidationContext(tokens: Token[]): ValidationContext;
export declare function matchSelectorSyntax(stream: Token[], errors: ErrorDescription[], options: ParserOptions | ValidationOptions, nested?: boolean): {
    success: boolean;
    errors: ErrorDescription[];
};
export declare function matchAllSyntax(syntaxes: ValidationToken[] | null, context: ValidationContext, options: ParserOptions): ValidationMatch;
export declare function matchOccurenceSyntax(syntax: ValidationToken, context: ValidationContext, options: ValidationOptions | ParserOptions): ValidationMatch;
