import type { AstDeclaration, AstNode, ParserOptions } from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { FeatureWalkMode } from "./type.ts";
export declare class ExpandIfFeature {
    accept: Set<EnumToken>;
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    run(declaration: AstDeclaration): AstNode | null;
}
