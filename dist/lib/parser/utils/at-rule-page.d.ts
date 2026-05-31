import type { AstAtRule, AtRuleToken, ErrorDescription, ParserOptions, Token } from "../../../@types/index.d.ts";
export declare function parseAtRulePage(context: AstAtRule | AtRuleToken, stream: Token[], options: ParserOptions, errors: ErrorDescription[]): {
    success: boolean;
    errors: ErrorDescription[];
};
