import type { AstAtRule, AstNode, AstRule, AstStyleSheet, ParserOptions } from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { FeatureWalkMode } from "./type.ts";
import { type AstArena } from "../arena.ts";
export declare class InlineCssVariablesFeature {
    accept: Set<EnumToken>;
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    /**
     *
     * @param arena
     * @param ast
     * @param _options
     * @param parent
     * @param context
     */
    run(arena: AstArena, ast: AstRule | AstAtRule, _options: ParserOptions, parent: AstRule | AstAtRule | AstStyleSheet, context: {
        [key: string]: any;
    }): AstNode | null;
    /**
     *
     * @param arena
     * @param _ast
     * @param _options
     * @param context
     */
    cleanup(arena: AstArena, _ast: AstStyleSheet, _options: ParserOptions, context: {
        [key: string]: any;
    }): void;
}
