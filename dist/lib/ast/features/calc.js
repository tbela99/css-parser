import { EnumToken } from '../types.js';
import { walkValues } from '../walk.js';
import { evaluate } from '../math/expression.js';
import { FeatureWalkMode } from './type.js';
import { tokensfuncSet, mathFuncs, LOCEND, LOCSTA, LOCSRCID } from '../../syntax/constants.js';
import { replaceNodeOrValue } from '../../parser/utils/token.js';

class ComputeCalcExpressionFeature {
    accept = new Set([EnumToken.RuleNodeType, EnumToken.AtRuleNodeType]);
    get ordering() {
        return 1;
    }
    get processMode() {
        return FeatureWalkMode.Post;
    }
    static register(options) {
        if (options.computeCalcExpression) {
            // @ts-ignore
            options.features.push(new ComputeCalcExpressionFeature());
        }
    }
    run(ast) {
        if (!("chi" in ast)) {
            return null;
        }
        for (const node of ast.chi) {
            if (node.typ != EnumToken.DeclarationNodeType) {
                continue;
            }
            const set = new Set();
            for (const { value, parent } of walkValues(node.val, node)) {
                if (parent?.typ == EnumToken.BinaryExpressionTokenType) {
                    continue;
                }
                if (value.typ == EnumToken.BinaryExpressionTokenType) {
                    // @ts-ignore
                    replaceNodeOrValue(parent, value, evaluate([value]));
                    continue;
                }
                if (value != null && tokensfuncSet.has(value.typ)) {
                    if (!set.has(value)) {
                        set.add(value);
                        if (parent != null) {
                            const shouldEvaluate = value.typ === EnumToken.MathFunctionTokenType ||
                                (value.typ == EnumToken.FunctionTokenType &&
                                    mathFuncs.includes(value.val));
                            if (shouldEvaluate) {
                                // @ts-ignore
                                const cp = value.val != "calc"
                                    ? [value]
                                    : value.typ == EnumToken.DeclarationNodeType
                                        ? value.val
                                        : value.chi;
                                const values = evaluate(cp);
                                // fix a + -b to a - b
                                for (const { value, parent: p } of walkValues(values)) {
                                    if (value.typ === EnumToken.BinaryExpressionTokenType) {
                                        if (value.op === EnumToken.Add &&
                                            Math.sign(value.r.val) == -1) {
                                            value.op = EnumToken.Sub;
                                            // @ts-expect-error
                                            value.r.val *=
                                                -1;
                                        }
                                    }
                                }
                                // @ts-ignore
                                const children = parent.typ == EnumToken.DeclarationNodeType
                                    ? parent.val
                                    : // @ts-ignore
                                        parent.chi;
                                if (values.length == 1 && values[0].typ != EnumToken.BinaryExpressionTokenType) {
                                    for (let i = 0; i < children.length; i++) {
                                        if (children[i] == value) {
                                            children.splice(i, 1, !(parent.typ === EnumToken.MathFunctionTokenType ||
                                                (parent.typ == EnumToken.FunctionTokenType &&
                                                    parent.val == "calc")) &&
                                                typeof values[0].val != "number" &&
                                                !(values[0].typ == EnumToken.MathFunctionTokenType ||
                                                    (values[0].typ == EnumToken.FunctionTokenType &&
                                                        mathFuncs.includes(values[0].val)))
                                                ? {
                                                    typ: EnumToken.MathFunctionTokenType,
                                                    val: "calc",
                                                    chi: values,
                                                    [LOCSRCID]: value[LOCSRCID],
                                                    [LOCSTA]: value[LOCSTA],
                                                    [LOCEND]: value[LOCEND],
                                                }
                                                : values[0]);
                                            break;
                                        }
                                    }
                                }
                                else {
                                    for (let i = 0; i < children.length; i++) {
                                        if (children[i] == value) {
                                            children.splice(i, 1, {
                                                typ: EnumToken.MathFunctionTokenType,
                                                val: "calc",
                                                chi: values,
                                                [LOCSRCID]: value[LOCSRCID],
                                                [LOCSTA]: value[LOCSTA],
                                                [LOCEND]: value[LOCEND],
                                            });
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
        return null;
    }
}

export { ComputeCalcExpressionFeature };
