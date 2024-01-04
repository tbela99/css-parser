import { AstAtRule, AstRule, AstRuleStyleSheet, MinifyOptions, ParserOptions } from "../../../@types";
export declare class MinifyFeature {
    static get ordering(): number;
    register(options: MinifyOptions | ParserOptions): void;
    run(ast: AstRule | AstAtRule, options: ParserOptions | undefined, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any;
    }): void;
}
