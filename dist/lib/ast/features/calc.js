import { EnumToken } from '../types.js';
import { walkValues, WalkerEvent, WalkerOptionEnum } from '../walk.js';
import { evaluate } from '../math/expression.js';
import { renderToken } from '../../renderer/render.js';
import { FeatureWalkMode } from './type.js';
import { mathFuncs } from '../../syntax/constants.js';

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
            for (const { value, parent } of walkValues(node.val, node, {
                event: WalkerEvent.Enter,
                // @ts-ignore
                fn(node, parent) {
                    if (parent != null &&
                        // @ts-ignore
                        parent.typ == EnumToken.DeclarationNodeType &&
                        // @ts-ignore
                        parent.val.length == 1 &&
                        (node.typ === EnumToken.MathFunctionTokenType || node.typ === EnumToken.FunctionTokenType) &&
                        mathFuncs.includes(node.val) &&
                        node.chi.length == 1 &&
                        node.chi[0].typ == EnumToken.IdenTokenType) {
                        return WalkerOptionEnum.Ignore;
                    }
                    if ((node.typ === EnumToken.WildCardFunctionTokenType && node.val == "var") ||
                        (!mathFuncs.includes(parent.val) &&
                            [
                                EnumToken.MathFunctionTokenType,
                                EnumToken.ColorTokenType,
                                EnumToken.DeclarationNodeType,
                                EnumToken.RuleNodeType,
                                EnumToken.AtRuleNodeType,
                                EnumToken.StyleSheetNodeType,
                            ].includes(parent?.typ))) {
                        return null;
                    }
                    // @ts-ignore
                    const slice = (node.typ == EnumToken.FunctionTokenType || node.typ == EnumToken.MathFunctionTokenType
                        ? node.chi
                        : node.typ == EnumToken.DeclarationNodeType
                            ? node.val
                            : node.chi)?.slice();
                    if (slice != null &&
                        (node.typ === EnumToken.MathFunctionTokenType ||
                            (node.typ == EnumToken.FunctionTokenType &&
                                mathFuncs.includes(node.val)))) {
                        // @ts-ignore
                        const key = "chi" in node ? "chi" : "val";
                        const str1 = renderToken({ ...node, [key]: slice });
                        const str2 = renderToken(node); // values.reduce((acc: string, curr: Token): string => acc + renderToken(curr), '');
                        if (str1.length <= str2.length) {
                            // @ts-ignore
                            node[key] = slice;
                        }
                        return WalkerOptionEnum.Ignore;
                    }
                    return null;
                },
            })) {
                if (value != null &&
                    (value.typ === EnumToken.MathFunctionTokenType ||
                        (value.typ == EnumToken.FunctionTokenType && mathFuncs.includes(value.val)))) {
                    if (!set.has(value)) {
                        set.add(value);
                        if (parent != null) {
                            // @ts-ignore
                            const cp = (value.typ === EnumToken.MathFunctionTokenType ||
                                (value.typ == EnumToken.FunctionTokenType &&
                                    mathFuncs.includes(value.val))) &&
                                value.val != "calc"
                                ? [value]
                                : value.typ == EnumToken.DeclarationNodeType
                                    ? value.val
                                    : value.chi;
                            const values = evaluate(cp);
                            // fix a + -b to a - b
                            for (const { value } of walkValues(values)) {
                                if (value.typ === EnumToken.BinaryExpressionTokenType &&
                                    value.op === EnumToken.Add &&
                                    Math.sign(value.r.val) == -1) {
                                    value.op = EnumToken.Sub;
                                    // @ts-expect-error
                                    value.r.val *= -1;
                                }
                            }
                            // @ts-ignore
                            const children = parent.typ == EnumToken.DeclarationNodeType ? parent.val : parent.chi;
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
        return null;
    }
}

export { ComputeCalcExpressionFeature };
