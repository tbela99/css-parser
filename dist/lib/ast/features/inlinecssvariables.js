import { EnumToken } from '../types.js';
import { walkValues } from '../walk.js';
import { IterableWeakSet } from '../../iterable/weakset.js';

function replace(node, variableScope) {
    for (const { value, parent: parentValue } of walkValues(node.val)) {
        if (value?.typ == EnumToken.FunctionTokenType && value.val == 'var') {
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
    static get ordering() {
        return 0;
    }
    static register(options) {
        if (options.inlineCssVariables) {
            for (const feature of options.features) {
                if (feature instanceof InlineCssVariablesFeature) {
                    return;
                }
            }
            // @ts-ignore
            options.features.push(new InlineCssVariablesFeature());
        }
    }
    run(ast, options = {}, parent, context) {
        if (!('variableScope' in context) || context.variableScope == null) {
            context.variableScope = new Map();
        }
        const isRoot = parent.typ == EnumToken.StyleSheetNodeType && ast.typ == EnumToken.RuleNodeType && [':root', 'html'].includes(ast.sel);
        const variableScope = context.variableScope;
        // @ts-ignore
        for (const node of ast.chi) {
            if (node.typ == EnumToken.CDOCOMMNodeType || node.typ == EnumToken.CommentNodeType) {
                continue;
            }
            if (node.typ != EnumToken.DeclarationNodeType) {
                break;
            }
            // css variable
            if (node.nam.startsWith('--')) {
                if (!variableScope.has(node.nam)) {
                    const info = {
                        globalScope: isRoot,
                        // @ts-ignore
                        parent: new IterableWeakSet(),
                        declarationCount: 1,
                        replaceable: isRoot,
                        node: node
                    };
                    info.parent.add(ast);
                    variableScope.set(node.nam, info);
                    let recursive = false;
                    for (const { value, parent: parentValue } of walkValues(node.val)) {
                        if (value?.typ == EnumToken.FunctionTokenType && value.val == 'var') {
                            recursive = true;
                            break;
                        }
                    }
                    if (recursive) {
                        replace(node, variableScope);
                    }
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
                replace(node, variableScope);
            }
        }
    }
    cleanup(ast, options = {}, context) {
        const variableScope = context.variableScope;
        for (const info of variableScope.values()) {
            if (info.replaceable) {
                let i;
                // drop declarations from :root{}
                for (const parent of info.parent) {
                    i = parent.chi?.length ?? 0;
                    while (i--) {
                        if (parent.chi[i].typ == EnumToken.DeclarationNodeType && parent.chi[i].nam == info.node.nam) {
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

export { InlineCssVariablesFeature };
