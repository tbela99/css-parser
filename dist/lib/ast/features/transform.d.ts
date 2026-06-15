import type { AstAtRule, AstNode, AstRule, ParserOptions } from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { FeatureWalkMode } from "./type.ts";
export declare class TransformCssFeature {
    accept: Set<EnumToken>;
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    run(ast: AstRule | AstAtRule): AstNode | null;
}
