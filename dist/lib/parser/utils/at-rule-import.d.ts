import type { AstAtRule, AstRule, AstStyleSheet, AtRuleToken, ErrorDescription, ParserOptions, Token } from "../../../@types/index.d.ts";
export declare function matchAtRuleImportSyntax(atRule: AtRuleToken, stream: Token[], context: AstRule | AstAtRule | AstStyleSheet, options: ParserOptions): {
    success: boolean;
    errors: ErrorDescription[];
};
