import { AstAtRule, AstRule, MinifyOptions } from "../../../@types";
import { MinifyFeature } from "../utils";
export declare class ComputeCalcExpression extends MinifyFeature {
    static get ordering(): number;
    static register(options: MinifyOptions): void;
    run(ast: AstRule | AstAtRule): AstRule | AstAtRule;
}
