import type { AstNode, ErrorDescription, ParserOptions, Token, ValidationOptions } from "../@types/index.d.ts";
import { type AstArena } from "../ast/arena.ts";
import { EnumToken } from "../ast/types.ts";
import type { ValidationToken } from "./parser/types.d.ts";
import type { ValidationContext, ValidationMatch } from "./types.d.ts";
import type { ValidationMediaFeature } from "../@types/validation.d.ts";
/**
 * @type {Array.<EnumToken>}
 */
export declare const funcTypes: EnumToken[];
/**
 * trim leading and trailing whitespace
 * @param arena
 * @param tokens
 * @returns
 */
export declare function trimArray(arena: AstArena, tokens: Token[]): Token[];
/**
 *
 * @param featureName
 * @returns
 */
export declare function getMFInfo(featureName: string): ValidationMediaFeature | null;
/**
 *
 * @param arena
 * @param featureName
 * @param tokens
 * @param isMFRange
 * @returns object with:
 * - valid: boolean. true the media feaure is known or is a custom property. false otherwise
 * - success: boolean. validation result
 */
export declare function isMFValue(arena: AstArena, featureName: string, tokens: Token[], isMFRange?: boolean): {
    valid: boolean;
    success: boolean;
    isValueAllowed?: boolean;
};
/**
 * create validation context
 * @param arena
 * @param tokens
 * @returns
 */
export declare function createValidationContext(arena: AstArena, tokens: Token[]): ValidationContext;
/**
 * match selector syntax
 * @param arena
 * @param stream
 * @param errors
 * @param options
 * @param nested
 * @returns
 */
export declare function matchSelectorSyntax(arena: AstArena, stream: Token[], errors: ErrorDescription[], options: ParserOptions & ValidationOptions, nested?: boolean): {
    success: boolean;
    errors: ErrorDescription[];
};
/**
 * validate the value of a declaration. a value that has already been validated for the same syntax in the same arena
 * (same encoding, see {@link encodeToken}) is not validated again: `width: 10px` is validated once, whatever the number
 * of rules that contain it. the failed validations are cached too: their errors are rebuilt with the tokens of the value
 * @param arena
 * @param syntaxes declaration syntax
 * @param tokens value tokens
 * @param options
 */
export declare function matchDeclarationSyntax(arena: AstArena, syntaxes: ValidationToken[], tokens: Token[], options: ParserOptions): ValidationMatch;
/**
 * validate the value tokens of a declaration node, see {@link matchDeclarationSyntax}. the successful and the failed
 * validations are cached
 * @param arena
 * @param syntaxes declaration syntax
 * @param declaration declaration node
 * @param options
 * @returns true if the value is valid
 */
export declare function isValidDeclarationValue(arena: AstArena, syntaxes: ValidationToken[], declaration: AstNode, options: ParserOptions): boolean;
/**
 * matches all syntaxes
 * @param arena
 * @param syntaxes
 * @param context
 * @param options
 * @returns
 */
export declare function matchAllSyntaxes(arena: AstArena, syntaxes: ValidationToken[] | null, context: ValidationContext, options: ParserOptions): ValidationMatch;
/**
 * matches a list of syntaxes
 * @param arena
 * @param syntax
 * @param context
 * @param options
 * @returns
 */
export declare function matchOccurenceSyntax(arena: AstArena, syntax: ValidationToken, context: ValidationContext, options: ValidationOptions | ParserOptions): ValidationMatch;
