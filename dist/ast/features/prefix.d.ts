import type { AstNode, ParserOptions, Token } from "../../../@types/index.d.ts";
import { type AstArena } from "../arena.ts";
import { FeatureWalkMode } from "./type.ts";
export declare class ComputePrefixFeature {
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    /**
     *
     * @param arena
     * @param node
     */
    run(arena: AstArena, node: AstNode): AstNode | null;
    /**
     * Convert -webkit-linear-gradient to linear-gradient syntax
     * @returns
     * @param arena
     * @param token
     */
    webkitLinearToLinearGradient(arena: AstArena, token: Token): void;
    /**
     * Convert -webkit-gradient(linear) to linear-gradient or linear-gradient syntax
     * @param arena
     * @param token
     * @returns
     */
    webkitGradientToGradient(arena: AstArena, token: Token): void;
    /**
     * Convert -webkit-radial-gradient to radial-gradient syntax
     * @returns
     * @param arena
     * @param token
     */
    webkitRadialToRadialGradient(arena: AstArena, token: Token): Token[];
}
