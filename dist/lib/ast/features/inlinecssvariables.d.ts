import type { AstAtRule, AstNode, AstRule, AstStyleSheet, ParserOptions } from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { FeatureWalkMode } from "./type.ts";
export declare class InlineCssVariablesFeature {
    accept: Set<EnumToken>;
    get ordering(): number;
    get processMode(): FeatureWalkMode;
    static register(options: ParserOptions): void;
    run(ast: AstRule | AstAtRule, options: ParserOptions | undefined, parent: AstRule | AstAtRule | AstStyleSheet, context: {
        [key: string]: any;
    }): AstNode | null;
    cleanup(ast: AstStyleSheet, options: ParserOptions | undefined, context: {
        [key: string]: any;
    }): void;
}
