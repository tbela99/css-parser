import type { AstAtRule, AtRuleToken, Token, ParserOptions, ErrorDescription } from "../../../@types/index.d.ts";
/**
 *
 * @param context
 * @param stream
 * @param options
 * @param errors
 * @returns
 */
export declare function parseDeclarationList(context: AstAtRule | AtRuleToken, stream: Token[], options: ParserOptions, errors: ErrorDescription[]): {
    success: boolean;
    errors: ErrorDescription[];
};
