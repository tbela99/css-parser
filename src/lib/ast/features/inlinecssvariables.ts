import type {
    AstAtRule,
    AstComment,
    AstDeclaration,
    AstNode,
    AstRule,
    AstRuleList,
    AstStyleSheet,
    BinaryExpressionToken,
    CommentToken,
    DashedIdentToken,
    FunctionToken,
    ParserOptions,
    Token,
    VariableScopeInfo
} from "../../../@types/index.d.ts";
import {EnumToken} from "../types.ts";
import {walkValues} from "../walk.ts";
import {renderToken} from "../../renderer/index.ts";
import {mathFuncs} from "../../syntax/index.ts";
import {splitRule} from "../minify.ts";
import {FeatureWalkMode} from "./type.ts";

function inlineExpression(token: Token): Token[] {

    const result: Token[] = [];

    if (token.typ == EnumToken.BinaryExpressionTokenType) {

        result.push({
            typ: EnumToken.ParensTokenType,
            chi: [...inlineExpression((token as BinaryExpressionToken).l), {typ: (token as BinaryExpressionToken).op}, ...inlineExpression((token as BinaryExpressionToken).r)]
        });

    } else {

        result.push(token);
    }

    return result;
}

function replace(node: AstDeclaration | AstRule | AstComment | AstRuleList, variableScope: Map<string, VariableScopeInfo>) {

    for (const {value, parent: parentValue} of walkValues((<AstDeclaration>node).val)) {

        if (value.typ == EnumToken.BinaryExpressionTokenType && parentValue != null && 'chi' in parentValue) {

            // @ts-ignore
            parentValue.chi.splice(parentValue.chi.indexOf(value), 1, ...inlineExpression(value));
        }
    }

    for (const {value, parent: parentValue} of walkValues((<AstDeclaration>node).val)) {

        if (value.typ == EnumToken.FunctionTokenType && (value as FunctionToken).val == 'var') {

            if ((value as FunctionToken).chi.length == 1 && (value as FunctionToken).chi[0].typ == EnumToken.DashedIdenTokenType) {

                const info: VariableScopeInfo = <VariableScopeInfo>variableScope.get(((value as FunctionToken).chi[0] as DashedIdentToken).val);

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

export class InlineCssVariablesFeature {

    public accept: Set<EnumToken> = new Set([EnumToken.RuleNodeType, EnumToken.AtRuleNodeType]);

    get ordering() {
        return 0;
    }

    get processMode(): FeatureWalkMode {
        return FeatureWalkMode.Pre;
    }

    static register(options: ParserOptions): void {

        if (options.inlineCssVariables) {

            // @ts-ignore
            options.features.push(new InlineCssVariablesFeature());
        }
    }

    run(ast: AstRule | AstAtRule, options: ParserOptions = {}, parent: AstRule | AstAtRule | AstStyleSheet, context: {
        [key: string]: any
    }): AstNode | null {

        if (!('chi' in ast)) {

            return null;
        }

        if (!('variableScope' in context)) {

            context.variableScope = <Map<string, VariableScopeInfo>>new Map;
        }

        // [':root', 'html']
        const isRoot: boolean = parent.typ == EnumToken.StyleSheetNodeType && ast.typ == EnumToken.RuleNodeType && ((<AstRule>ast).raw ?? splitRule((ast as AstRule).sel)).some(segment => segment.some(s => s == ':root' || s == 'html'));
        const variableScope = context.variableScope;

        // @ts-ignore
        for (const node of ast.chi) {

            if (node.typ != EnumToken.DeclarationNodeType) {

                continue;
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
                        node: (<AstDeclaration>node),
                        values: structuredClone((<AstDeclaration>node).val)
                    };

                    info.parent.add(ast);

                    variableScope.set((<AstDeclaration>node).nam, info);

                    let recursive: boolean = false;

                    for (const {value} of walkValues((<AstDeclaration>node).val)) {

                        if (value?.typ == EnumToken.FunctionTokenType && (mathFuncs.includes((<FunctionToken>value).val) || (<FunctionToken>value).val == 'var')) {

                            recursive = true;
                            break;
                        }
                    }

                    if (recursive) {

                        replace(node, variableScope);
                    }
                }

            } else {

                replace(node, variableScope);
            }
        }

        return null;
    }

    cleanup(ast: AstStyleSheet, options: ParserOptions = {}, context: { [key: string]: any }) {

        const variableScope = <Map<string, VariableScopeInfo>>context.variableScope;

        // if (variableScope == null) {
        //
        //     return;
        // }

        for (const info of variableScope.values()) {

            if (info.replaceable) {

                let i: number;

                // drop declarations from :root{}
                for (const parent of info.parent) {

                    i = parent.chi?.length ?? 0;

                    while (i--) {

                        if ((<AstDeclaration[]>parent.chi)[i] == info.node) {

                            // @ts-ignore
                            (<AstDeclaration[]>parent.chi).splice(i, 1, {
                                typ: EnumToken.CommentTokenType,
                                val: `/* ${info.node.nam}: ${info.values.reduce((acc: string, curr: Token): string => acc + renderToken(curr, {convertColor: false}), '')} */`
                            } as CommentToken);
                            break;
                        }
                    }
                }
            }
        }
    }
}