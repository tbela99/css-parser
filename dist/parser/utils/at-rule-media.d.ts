import type { ErrorDescription, ParserOptions, Token } from "../../../@types/index.d.ts";
import { type AstArena } from "../../ast/arena.ts";
export declare function parseMediaqueryList(arena: AstArena, stream: Token[], options: ParserOptions): {
    errors: ErrorDescription[];
    success: boolean;
};
