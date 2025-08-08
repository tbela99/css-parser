import { EnumToken } from '../types.js';
import { walkValues } from '../walk.js';
import { renderToken } from '../../renderer/render.js';
import '../../syntax/color/utils/constants.js';
import { splitRule } from '../minify.js';
import '../../parser/parse.js';
import '../../parser/tokenize.js';
import '../../parser/utils/config.js';
import { mathFuncs } from '../../syntax/syntax.js';

function inlineExpression(token) {
    const result = [];
    if (token.typ == EnumToken.BinaryExpressionTokenType) {
        result.push({
            typ: EnumToken.ParensTokenType,
            chi: [...inlineExpression(token.l), { typ: token.op }, ...inlineExpression(token.r)]
        });
    }
    else {
        result.push(token);
    }
    return result;
}
function replace(node, variableScope) {
    for (const { value, parent: parentValue } of walkValues(node.val)) {
        if (value.typ == EnumToken.BinaryExpressionTokenType && parentValue != null && 'chi' in parentValue) {
            // @ts-ignore
            parentValue.chi.splice(parentValue.chi.indexOf(value), 1, ...inlineExpression(value));
        }
    }
    for (const { value, parent: parentValue } of walkValues(node.val)) {
        if (value.typ == EnumToken.FunctionTokenType && value.val == 'var') {
            if (value.chi.length == 1 && value.chi[0].typ == EnumToken.DashedIdenTokenType) {
                const info = variableScope.get(value.chi[0].val);
                if (info?.replaceable) {
                    if (parentValue != null) {
                        let i = 0;
                        for (; i < parentValue.chi.length; i++) {
                            if (parentValue.chi[i] == value) {
                                parentValue.chi.splice(i, 1, ...info.node.val);
                                break;
                            }
                        }
                    }
                    else {
                        node.val = info.node.val.slice();
                    }
                }
            }
        }
    }
}
class InlineCssVariablesFeature {
    get ordering() {
        return 0;
    }
    get preProcess() {
        return true;
    }
    get postProcess() {
        return false;
    }
    static register(options) {
        if (options.inlineCssVariables) {
            // @ts-ignore
            options.features.push(new InlineCssVariablesFeature());
        }
    }
    run(ast, options = {}, parent, context) {
        if (!('chi' in ast)) {
            return;
        }
        if (!('variableScope' in context)) {
            context.variableScope = new Map;
        }
        // [':root', 'html']
        const isRoot = parent.typ == EnumToken.StyleSheetNodeType && ast.typ == EnumToken.RuleNodeType && (ast.raw ?? splitRule(ast.sel)).some(segment => segment.some(s => s == ':root' || s == 'html'));
        const variableScope = context.variableScope;
        // @ts-ignore
        for (const node of ast.chi) {
            if (node.typ != EnumToken.DeclarationNodeType) {
                continue;
            }
            // css variable
            if (node.nam.startsWith('--')) {
                if (!variableScope.has(node.nam)) {
                    const info = {
                        globalScope: isRoot,
                        // @ts-ignore
                        parent: new Set(),
                        declarationCount: 1,
                        replaceable: isRoot,
                        node: node,
                        values: structuredClone(node.val)
                    };
                    info.parent.add(ast);
                    variableScope.set(node.nam, info);
                    let recursive = false;
                    for (const { value } of walkValues(node.val)) {
                        if (value?.typ == EnumToken.FunctionTokenType && (mathFuncs.includes(value.val) || value.val == 'var')) {
                            recursive = true;
                            break;
                        }
                    }
                    if (recursive) {
                        replace(node, variableScope);
                    }
                }
                // else {
                //
                //     const info: VariableScopeInfo = <VariableScopeInfo>variableScope.get((<AstDeclaration>node).nam);
                //
                //     info.globalScope = isRoot;
                //
                //     if (!isRoot) {
                //
                //         ++info.declarationCount;
                //     }
                //
                //     if (info.replaceable) {
                //
                //         info.replaceable = isRoot && info.declarationCount == 1;
                //     }
                //
                //     info.parent.add(ast);
                //     info.node = (<AstDeclaration>node);
                // }
            }
            else {
                replace(node, variableScope);
            }
        }
    }
    cleanup(ast, options = {}, context) {
        const variableScope = context.variableScope;
        // if (variableScope == null) {
        //
        //     return;
        // }
        for (const info of variableScope.values()) {
            if (info.replaceable) {
                let i;
                // drop declarations from :root{}
                for (const parent of info.parent) {
                    i = parent.chi?.length ?? 0;
                    while (i--) {
                        if (parent.chi[i] == info.node) {
                            // @ts-ignore
                            parent.chi.splice(i, 1, {
                                typ: EnumToken.CommentTokenType,
                                val: `/* ${info.node.nam}: ${info.values.reduce((acc, curr) => acc + renderToken(curr, { convertColor: false }), '')} */`
                            });
                            break;
                        }
                    }
                }
            }
        }
    }
}

export { InlineCssVariablesFeature };
