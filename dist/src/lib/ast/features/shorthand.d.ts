import { AstAtRule, AstRule, AstRuleStyleSheet, MinifyOptions, PropertyListOptions } from "../../../@types";
import { MinifyFeature } from "../utils";
export declare class ComputeShorthand extends MinifyFeature {
    static get ordering(): number;
    static register(options: MinifyOptions): void;
    run(ast: AstRule | AstAtRule, options: PropertyListOptions | undefined, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any;
    }): AstAtRule | AstRule;
}
