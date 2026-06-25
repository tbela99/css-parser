import type { AstNode, FunctionToken, ParserOptions, Token } from "../../../@types/index.d.ts";
import { FeatureWalkMode } from "./type.ts";
export declare class ComputePrefixFeature {
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    run(node: AstNode): AstNode | null;
    /**
     * Convert -webkit-linear-gradient to linear-gradient syntax
     * @param tokens
     * @returns
     */
    webkitLinearToLinearGradient(token: FunctionToken): void;
    /**
     * Convert -webkit-gradient(linear) to linear-gradient or linear-gradient syntax
     * @param token
     * @returns
     */
    webkitGradientToGradient(token: FunctionToken): void;
    /**
     * Convert -webkit-radial-gradient to radial-gradient syntax
     * @param tokens
     * @returns
     */
    webkitRadialToRadialGradient(token: FunctionToken): Token[];
}
