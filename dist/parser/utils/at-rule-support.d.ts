import type { Token, ErrorDescription, ParserOptions } from "../../../@types/index.d.ts";
import { type AstArena } from "../../ast/arena.ts";
export declare function parseAtRuleSupportSyntax(arena: AstArena, stream: Token[], context: Token, options?: ParserOptions): {
    success: boolean;
    errors: ErrorDescription[];
};
