import { EnumToken } from "../types.ts";
import type { AstAtRule, AstNode, AstRule, ParserOptions, PropertyListOptions } from "../../../@types/index.d.ts";
import { FeatureWalkMode } from "./type.ts";
import type { AstArena } from "../arena.ts";
export declare class ComputeShorthandFeature {
    accept: Set<EnumToken>;
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    /**
     *
     * @param arena
     * @param ast
     * @param options
     * @param _parent
     * @param context
     */
    run(arena: AstArena, ast: AstRule | AstAtRule, options: PropertyListOptions, _parent?: AstNode, context?: {
        [key: string]: any;
    }): AstNode | null;
}
