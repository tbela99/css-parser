import { EnumToken } from '../types.js';
import { walkValues } from '../walk.js';
import { IterableWeakSet } from '../../iterable/weakset.js';
import { evaluate } from '../math/expression.js';

class ComputeCalcExpressionFeature {
    static get ordering() {
        return 1;
    }
    static register(options) {
        if (options.computeCalcExpression) {
            for (const feature of options.features) {
                if (feature instanceof ComputeCalcExpressionFeature) {
                    return;
                }
            }
            // @ts-ignore
            options.features.push(new ComputeCalcExpressionFeature());
        }
    }
    run(ast) {
        if (!('chi' in ast)) {
            return;
        }
        // @ts-ignore
        for (const node of ast.chi) {
            if (node.typ != EnumToken.DeclarationNodeType) {
                continue;
            }
            const set = new IterableWeakSet;
            for (const { value, parent } of walkValues(node.val)) {
                if (value != null && value.typ == EnumToken.FunctionTokenType && value.val == 'calc') {
                    if (!set.has(parent)) {
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
    }
}

export { ComputeCalcExpressionFeature };
