import type { ParserOptions, Token, AstAtRule, AtRuleToken } from "../../../@types/index.d.ts";
export declare function parseAtRuleFontFeatureValues(stream: Token[], context: AstAtRule | AtRuleToken, options?: ParserOptions): {
    success: boolean;
    errors: import("../../../@types/index.d.ts").ErrorDescription[];
};
