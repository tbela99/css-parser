import type { AtRuleToken, Token, ParserOptions, ValidationOptions, ErrorDescription } from "../../../@types/index.d.ts";
export declare function matchAtRuleSyntax(atRule: AtRuleToken, stream: Token[], options: ParserOptions | ValidationOptions): {
    success: boolean;
    errors: ErrorDescription[];
};
