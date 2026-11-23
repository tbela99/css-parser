import type { AstDeclaration, AstNode, ParserOptions } from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { FeatureWalkMode } from "./type.ts";
import { type AstArena } from "../arena.ts";
export declare class ExpandIfFeature {
    accept: Set<EnumToken>;
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    /**
     *
     * @param arena
     * @param declaration
     */
    run(arena: AstArena, declaration: AstDeclaration): AstNode | AstNode[] | null;
}
