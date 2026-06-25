import type { AstAtRule, AtRuleToken, ErrorDescription, ParserOptions, Token } from "../../../@types/index.d.ts";
export declare function matchAtRuleWhenElseSyntax(stream: Token[], context: AstAtRule | AtRuleToken, options?: ParserOptions): {
    success: boolean;
    errors: ErrorDescription[];
};
