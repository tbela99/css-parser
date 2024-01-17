import {
    AstAtRule,
    AstDeclaration,
    AstRule,
    BinaryExpressionNode,
    BinaryExpressionToken,
    FractionToken,
    FunctionToken,
    LiteralToken,
    MinifyOptions,
    ParensToken,
    Token
} from "../../../@types";
import {EnumToken} from "../types";
import {reduceNumber} from "../../renderer";
import {walkValues} from "../walk";
import {MinifyFeature} from "../utils";
import {compute} from "./utils";
import {IterableWeakSet} from "../../iterable";
import {isDimension} from "../../parser";
import {evaluate} from "../math";

export class ComputeCalcExpressionFeature extends MinifyFeature {

    static get ordering(): number {
        return 1;
    }

    static register(options: MinifyOptions):void {

        if (options.computeCalcExpression) {

            for (const feature of options.features) {

                if (feature instanceof ComputeCalcExpressionFeature) {

                    return
                }
            }

            // @ts-ignore
            options.features.push(new ComputeCalcExpressionFeature());
        }
    }

    run(ast: AstRule | AstAtRule): AstRule | AstAtRule {

        if (!('chi' in ast)) {

            return ast;
        }

        // @ts-ignore
        for (const node of ast.chi) {

            if (node.typ != EnumToken.DeclarationNodeType) {

                continue;
            }

            const set: IterableWeakSet<Token> = new IterableWeakSet;

            for (const {value, parent} of walkValues((<AstDeclaration>node).val)) {

                if (value != null && value.typ == EnumToken.FunctionTokenType && value.val == 'calc') {

                    if (!set.has(<FunctionToken>parent)) {

                        set.add(value);
                        value.chi = evaluate(value.chi);

                        if (value.chi.length == 1 && value.chi[0].typ != EnumToken.BinaryExpressionTokenType) {

                            if (parent != null) {

                                if (parent.typ == EnumToken.BinaryExpressionTokenType) {

                                    if (parent.l == value) {

                                        parent.l = value.chi[0];
                                    }

                                    else {

                                        parent.r = value.chi[0];
                                    }
                                }

                                else {

                                    for (let i = 0; i < parent.chi.length; i++) {

                                        if (parent.chi[i] == value) {

                                            parent.chi.splice(i, 1, value.chi[0]);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return ast;
    }
}
