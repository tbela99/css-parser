import { EnumToken } from "../types.ts";
import type { AstAtRule, AstNode, AstRule, AstStyleSheet, ParserOptions, PropertyListOptions } from "../../../@types/index.d.ts";
import { FeatureWalkMode } from "./type.ts";
export declare class ComputeShorthandFeature {
    accept: Set<EnumToken>;
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    run(ast: AstRule | AstAtRule, options: PropertyListOptions | undefined, parent: AstRule | AstAtRule | AstStyleSheet, context: {
        [key: string]: any;
    }): AstNode | null;
}
