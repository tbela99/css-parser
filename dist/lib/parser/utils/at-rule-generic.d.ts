import type { AtRuleToken, ErrorDescription, ParserOptions, Token, ValidationOptions } from "../../../@types/index.d.ts";
export declare function matchGenericSyntax(atRule: AtRuleToken, stream: Token[], options: ParserOptions | ValidationOptions): {
    success: boolean;
    errors: ErrorDescription[];
};
