import type { ErrorDescription, Token, ParserOptions } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
export declare function matchGenericSyntax(arena: AstArena, stream: Token[], options: ParserOptions): {
    success: boolean;
    errors: ErrorDescription[];
};
