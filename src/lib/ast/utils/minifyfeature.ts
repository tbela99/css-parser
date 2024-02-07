import {AstAtRule, AstRule, AstRuleStyleSheet, MinifyOptions, ParserOptions} from "../../../@types";

export abstract class MinifyFeature {

    static get ordering() {
        return 10000;
    }

    register(options: MinifyOptions | ParserOptions) {
    }

    abstract run(ast: AstRule | AstAtRule, options: ParserOptions, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any
    }): void;
}