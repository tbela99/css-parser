import { AstAtRule, AstRule, AstRuleStyleSheet, MinifyOptions, ParserOptions } from "../../../@types";
import { MinifyFeature } from "../utils";
export declare class InlineCssVariables extends MinifyFeature {
    static get ordering(): number;
    static register(options: MinifyOptions): void;
    run(ast: AstRule | AstAtRule, options: ParserOptions | undefined, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any;
    }): void;
    cleanup(ast: AstRuleStyleSheet, options: ParserOptions | undefined, context: {
        [key: string]: any;
    }): void;
}
