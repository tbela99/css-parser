import type { Token, ErrorDescription, ParserOptions } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
export declare function matchAtRuleImportSyntax(arena: AstArena, atRule: Token, stream: Token[], options: ParserOptions): {
    success: boolean;
    errors: ErrorDescription[];
};
