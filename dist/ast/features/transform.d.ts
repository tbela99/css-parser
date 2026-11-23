import type { AstAtRule, AstNode, AstRule, ParserOptions } from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { FeatureWalkMode } from "./type.ts";
import type { AstArena } from "../arena.ts";
export declare class TransformCssFeature {
    accept: Set<EnumToken>;
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    /**
     *
     * @param arena
     * @param ast
     * @param _options
     * @param _parent
     * @param context minification context: the results are shared by the rules of the minification
     */
    run(arena: AstArena, ast: AstRule | AstAtRule, _options?: unknown, _parent?: AstNode, context?: {
        [key: string]: any;
    }): AstNode | null;
}
