import type { AstNode, ParserOptions } from "../../../@types/index.d.ts";
import { FeatureWalkMode } from "./type.ts";
export declare class ComputePrefixFeature {
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    run(node: AstNode): AstNode | null;
}
