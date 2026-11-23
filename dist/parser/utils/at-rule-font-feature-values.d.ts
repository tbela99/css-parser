import type { Token, ParserOptions } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
export declare function parseAtRuleFontFeatureValues(arena: AstArena, stream: Token[], context: Token, options?: ParserOptions): {
    success: boolean;
    errors: ErrorDescription[];
};
