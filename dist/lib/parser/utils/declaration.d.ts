import type { AstAtRule, AstDeclaration, AstInvalidAtRule, AstInvalidDeclaration, AstInvalidRule, AstKeyFrameRule, AstRule, AstStyleSheet, AtRuleToken, ErrorDescription, Location, ParserOptions, RawNodeToken, Token } from "../../../@types/index.d.ts";
export declare function parseDeclarationNode(node: AstDeclaration, errors: ErrorDescription[], location: Location): AstDeclaration | null;
export declare function isDeclarationValue(tokens: Token[]): {
    success: boolean;
    errors: ErrorDescription[];
};
/**
 * parse declaration
 * @param tokens
 * @param parent
 * @param options
 * @param errors
 */
export declare function parseDeclaration(tokens: Token[], parent: AstRule | AstAtRule | AstKeyFrameRule | AstStyleSheet | AtRuleToken | AstInvalidAtRule | AstInvalidRule | null, options: ParserOptions, errors: ErrorDescription[]): AstDeclaration | AstInvalidDeclaration | RawNodeToken;
