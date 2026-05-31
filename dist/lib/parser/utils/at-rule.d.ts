import type { AtRuleToken, Token, ParserOptions, ValidationOptions } from "../../../@types/index.d.ts";
export declare function matchAtRuleSyntax(atRule: AtRuleToken, stream: Token[], options: ParserOptions | ValidationOptions): {
    success: boolean;
    errors: {
        action: string;
        message: string;
        node: Token;
        location: import("../../../@types/ast").Location;
    }[];
} | {
    success: boolean;
    errors: import("../../../@types/index.d.ts").ErrorDescription[];
};
