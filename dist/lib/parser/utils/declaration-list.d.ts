import { AstAtRule, AtRuleToken, Token, ParserOptions, ErrorDescription } from "../../../@types";
export declare function parseDeclarationList(context: AstAtRule | AtRuleToken, stream: Token[], options: ParserOptions, errors: ErrorDescription[]): {
    success: boolean;
    errors: ErrorDescription[];
};
