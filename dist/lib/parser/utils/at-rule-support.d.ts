import type { Token, AstAtRule, ParserOptions, ErrorDescription, AtRuleToken } from "../../../@types/index.d.ts";
export declare function parseAtRuleSupportSyntax(stream: Token[], context: AstAtRule | AtRuleToken, options?: ParserOptions): {
    success: boolean;
    errors: ErrorDescription[];
};
