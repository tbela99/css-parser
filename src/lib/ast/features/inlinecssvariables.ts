import {
    AstAtRule, AstComment,
    AstDeclaration,
    AstRule, AstRuleList,
    AstRuleStyleSheet,
    FunctionToken, MinifyOptions,
    ParserOptions,
    VariableScopeInfo
} from "../../../@types";
import {EnumToken} from "../types";
import {walkValues} from "../walk";
import {MinifyFeature} from "../utils";
import {renderToken} from "../../renderer";
import * as repl from "repl";

function replace(node: AstDeclaration | AstRule | AstComment | AstRuleList, variableScope: Map<string, VariableScopeInfo>) {

    for (const {value, parent: parentValue} of walkValues((<AstDeclaration>node).val)) {

        if (value?.typ == EnumToken.FunctionTokenType && (<FunctionToken>value).val == 'var') {

            if (value.chi.length == 1 && value.chi[0].typ == EnumToken.IdenTokenType) {

                const info = <VariableScopeInfo>variableScope.get(value.chi[0].val);

                if (info?.replaceable) {

                    if (parentValue != null) {

                        let i: number = 0;

                        for (; i < (<FunctionToken>parentValue).chi.length; i++) {

                            if ((<FunctionToken>parentValue).chi[i] == value) {

                                (<FunctionToken>parentValue).chi.splice(i, 1, ...info.node.val);
                                break;
                            }
                        }
                    } else {

                        (<AstDeclaration>node).val = info.node.val.slice();
                    }
                }
            }
        }
    }
}

export class InlineCssVariables extends MinifyFeature {

    static get ordering() {
        return 0;
    }

    static register(options: MinifyOptions) {

        if (options.inlineCssVariables) {

            for (const feature of options.features) {

                if (feature instanceof InlineCssVariables) {

                    return;
                }
            }

            // @ts-ignore
            options.features.push(new InlineCssVariables());
        }
    }

    run(ast: AstRule | AstAtRule, options: ParserOptions = {}, parent: AstRule | AstAtRule | AstRuleStyleSheet, context: {
        [key: string]: any
    }) {

        if (!('variableScope' in context)) {

            context.variableScope = <Map<string, VariableScopeInfo>>new Map;
        }

        const isRoot: boolean = parent.typ == EnumToken.StyleSheetNodeType && ast.typ == EnumToken.RuleNodeType && (<AstRule>ast).sel == ':root';

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
            if ((<AstDeclaration>node).nam.startsWith('--')) {

                if (!variableScope.has((<AstDeclaration>node).nam)) {

                    const info = {
                        globalScope: isRoot,
                        // @ts-ignore
                        parent: <Set<AstRule | AstAtRule>>new Set(),
                        declarationCount: 1,
                        replaceable: isRoot,
                        node: (<AstDeclaration>node)
                    };

                    info.parent.add(ast);

                    variableScope.set((<AstDeclaration>node).nam, info);


                    let recursive: boolean = false;

                    for (const {value, parent: parentValue} of walkValues((<AstDeclaration>node).val)) {

                        if (value?.typ == EnumToken.FunctionTokenType && (<FunctionToken>value).val == 'var') {

                            recursive = true;
                            break;
                        }
                    }

                    if (recursive) {

                        replace(node, variableScope);
                    }


                } else {

                    const info: VariableScopeInfo = <VariableScopeInfo>variableScope.get((<AstDeclaration>node).nam);

                    info.globalScope = isRoot;

                    if (!isRoot) {

                        ++info.declarationCount;
                    }

                    if (info.replaceable) {

                        info.replaceable = isRoot && info.declarationCount == 1;
                    }

                    info.parent.add(ast);
                    info.node = (<AstDeclaration>node);
                }
            } else {
                replace(node, variableScope);
            }
        }
    }

    cleanup(ast: AstRuleStyleSheet, options: ParserOptions = {}, context: { [key: string]: any }) {

        const variableScope = <Map<string, VariableScopeInfo>>context.variableScope;

        for (const info of variableScope.values()) {

            if (info.replaceable) {

                let i: number;

                for (const parent of info.parent) {

                    i = parent.chi?.length ?? 0;

                    while (i--) {

                        if ((<AstDeclaration>(<AstDeclaration[]>parent.chi)[i]).typ == EnumToken.DeclarationNodeType && (<AstDeclaration>(<AstDeclaration[]>parent.chi)[i]).nam == info.node.nam) {

                            (<AstDeclaration[]>parent.chi).splice(i, 1);
                        }
                    }

                    if (parent.chi?.length == 0 && 'parent' in parent) {

                        // @ts-ignore
                        for (i = 0; i < (<AstRule>parent.parent).chi?.length; i++) {

                            // @ts-ignore
                            if ((<AstRule>parent.parent).chi[i] == parent) {

                                // @ts-ignore
                                (<AstRule>parent.parent).chi.splice(i, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
}