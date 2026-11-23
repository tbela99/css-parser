import type { AstArena } from "../arena.ts";
import type { AstAtRule, AstNode, AstRule, ParserOptions } from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { FeatureWalkMode } from "./type.ts";
export declare class ComputeCalcExpressionFeature {
    accept: Set<EnumToken>;
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    /**
     *
     * @param arena
     * @param ast
     */
    run(arena: AstArena, ast: AstRule | AstAtRule): AstNode | null;
}
