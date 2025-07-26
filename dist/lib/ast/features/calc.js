import { EnumToken } from '../types.js';
import { walkValues, WalkerValueEvent, WalkerOptionEnum } from '../walk.js';
import { evaluate } from '../math/expression.js';
import { renderToken } from '../../renderer/render.js';
import '../../syntax/color/utils/constants.js';
import '../minify.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { mathFuncs } from '../../syntax/syntax.js';

class ComputeCalcExpressionFeature {
    get ordering() {
        return 1;
    }
    get preProcess() {
        return false;
    }
    get postProcess() {
        return true;
    }
    static register(options) {
        if (options.computeCalcExpression) {
            // @ts-ignore
            options.features.push(new ComputeCalcExpressionFeature());
        }
    }
    run(ast) {
        if (!('chi' in ast)) {
            return;
        }
        for (const node of ast.chi) {
            if (node.typ != EnumToken.DeclarationNodeType) {
                continue;
            }
            const set = new Set;
            for (const { value, parent } of walkValues(node.val, node, {
                event: WalkerValueEvent.Enter,
                // @ts-ignore
                fn(node, parent) {
                    if (parent != null &&
                        // @ts-ignore
                        parent.typ == EnumToken.DeclarationNodeType &&
                        // @ts-ignore
                        parent.val.length == 1 &&
                        node.typ == EnumToken.FunctionTokenType &&
                        mathFuncs.includes(node.val) &&
                        node.chi.length == 1 &&
                        node.chi[0].typ == EnumToken.IdenTokenType) {
                        return WalkerOptionEnum.Ignore;
                    }
                    if ((node.typ == EnumToken.FunctionTokenType && node.val == 'var') || (!mathFuncs.includes(parent.val) && [EnumToken.ColorTokenType, EnumToken.DeclarationNodeType, EnumToken.RuleNodeType, EnumToken.AtRuleNodeType, EnumToken.StyleSheetNodeType].includes(parent?.typ))) {
                        return null;
                    }
                    // @ts-ignore
                    const slice = (node.typ == EnumToken.FunctionTokenType ? node.chi : (node.typ == EnumToken.DeclarationNodeType ? node.val : node.chi))?.slice();
                    if (slice != null && node.typ == EnumToken.FunctionTokenType && mathFuncs.includes(node.val)) {
                        // @ts-ignore
                        const cp = (node.typ == EnumToken.FunctionTokenType && mathFuncs.includes(node.val) && node.val != 'calc' ? [node] : (node.typ == EnumToken.DeclarationNodeType ? node.val : node.chi)).slice();
                        const values = evaluate(cp);
                        const key = 'chi' in node ? 'chi' : 'val';
                        const str1 = renderToken({ ...node, [key]: slice });
                        const str2 = renderToken(node); // values.reduce((acc: string, curr: Token): string => acc + renderToken(curr), '');
                        if (str1.length <= str2.length) {
                            // @ts-ignore
                            node[key] = slice;
                        }
                        else {
                            // @ts-ignore
                            node[key] = values;
                        }
                        return WalkerOptionEnum.Ignore;
                    }
                    return null;
                }
            })) {
                if (value != null && value.typ == EnumToken.FunctionTokenType && mathFuncs.includes(value.val)) {
                    if (!set.has(value)) {
                        set.add(value);
                        if (parent != null) {
                            // @ts-ignore
                            const cp = value.typ == EnumToken.FunctionTokenType && mathFuncs.includes(value.val) && value.val != 'calc' ? [value] : (value.typ == EnumToken.DeclarationNodeType ? value.val : value.chi);
                            const values = evaluate(cp);
                            // @ts-ignore
                            const children = parent.typ == EnumToken.DeclarationNodeType ? parent.val : parent.chi;
                            if (values.length == 1 && values[0].typ != EnumToken.BinaryExpressionTokenType) {
                                if (parent.typ == EnumToken.BinaryExpressionTokenType) {
                                    if (parent.l == value) {
                                        parent.l = values[0];
                                    }
                                    else {
                                        parent.r = values[0];
                                    }
                                }
                                else {
                                    for (let i = 0; i < children.length; i++) {
                                        if (children[i] == value) {
                                            // @ts-ignore
                                            children.splice(i, 1, !(parent.typ == EnumToken.FunctionTokenType && parent.val == 'calc') && typeof values[0].val != 'string' ? {
                                                typ: EnumToken.FunctionTokenType,
                                                val: 'calc',
                                                chi: values
                                            } : values[0]);
                                            break;
                                        }
                                    }
                                }
                            }
                            else {
                                for (let i = 0; i < children.length; i++) {
                                    if (children[i] == value) {
                                        if (parent.typ == EnumToken.FunctionTokenType && parent.val == 'calc') {
                                            children.splice(i, 1, ...values);
                                        }
                                        else {
                                            children.splice(i, 1, {
                                                typ: EnumToken.FunctionTokenType,
                                                val: 'calc',
                                                chi: values
                                            });
                                        }
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

export { ComputeCalcExpressionFeature };
