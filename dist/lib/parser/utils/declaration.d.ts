import type { AstAtRule, AstDeclaration, AstInvalidAtRule, AstInvalidDeclaration, AstInvalidRule, AstKeyFrameRule, AstRule, AstStyleSheet, AtRuleToken, ErrorDescription, ParserOptions, RawNodeToken, Token } from "../../../@types/index.d.ts";
/**
 *
 * @param tokens
 * @returns
 */
export declare function isDeclarationValue(tokens: Token[]): {
    success: boolean;
    errors: ErrorDescription[];
};
/**
 * Parse declaration
 * @param tokens
 * @param parent
 * @param options
 * @param errors
 */
export declare function parseDeclaration(tokens: Token[], parent: AstRule | AstAtRule | AstKeyFrameRule | AstStyleSheet | AtRuleToken | AstInvalidAtRule | AstInvalidRule | null, options: ParserOptions, errors: ErrorDescription[]): AstDeclaration | AstInvalidDeclaration | RawNodeToken;
