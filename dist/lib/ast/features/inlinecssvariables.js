import { EnumToken } from '../types.js';
import { walkValues } from '../walk.js';

class InlineCssVariables {
    run(ast, options = {}, parent, context) {
        if (!('variableScope' in context)) {
            context.variableScope = new Map;
        }
        const isRoot = parent.typ == 2 /* NodeType.StyleSheetNodeType */ && ast.typ == 4 /* NodeType.RuleNodeType */ && ast.sel == ':root';
        const variableScope = context.variableScope;
        // @ts-ignore
        for (const node of ast.chi) {
            if (node.typ == 1 /* NodeType.CDOCOMMNodeType */ || node.typ == 0 /* NodeType.CommentNodeType */) {
                continue;
            }
            if (node.typ != 5 /* NodeType.DeclarationNodeType */) {
                break;
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
                        node: node
                    };
                    info.parent.add(ast);
                    variableScope.set(node.nam, info);
                }
                else {
                    const info = variableScope.get(node.nam);
                    info.globalScope = isRoot;
                    if (!isRoot) {
                        ++info.declarationCount;
                    }
                    if (info.replaceable) {
                        info.replaceable = isRoot && info.declarationCount == 1;
                    }
                    info.parent.add(ast);
                    info.node = node;
                }
            }
            else {
                for (const { value, parent: parentValue } of walkValues(node.val)) {
                    if (value?.typ == EnumToken.FunctionTokenType && value.val == 'var') {
                        if (value.chi.length == 1 && value.chi[0].typ == EnumToken.IdenTokenType) {
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
        }
    }
    cleanup(ast, options = {}, context) {
        const variableScope = context.variableScope;
        for (const info of variableScope.values()) {
            if (info.replaceable) {
                let i;
                for (const parent of info.parent) {
                    i = parent.chi?.length ?? 0;
                    while (i--) {
                        if (parent.chi[i].typ == 5 /* NodeType.DeclarationNodeType */ && parent.chi[i].nam == info.node.nam) {
                            parent.chi.splice(i, 1);
                        }
                    }
                    if (parent.chi?.length == 0 && 'parent' in parent) {
                        // @ts-ignore
                        for (i = 0; i < parent.parent.chi?.length; i++) {
                            // @ts-ignore
                            if (parent.parent.chi[i] == parent) {
                                // @ts-ignore
                                parent.parent.chi.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}

export { InlineCssVariables };