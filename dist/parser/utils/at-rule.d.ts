import type { Token, ParserOptions, ValidationOptions, ErrorDescription } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
export declare function matchAtRuleSyntax(arena: AstArena, atRule: Token, stream: Token[], options: ParserOptions | ValidationOptions): {
    success: boolean;
    errors: ErrorDescription[];
};
