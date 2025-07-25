import type {
    AstAtRule,
    AstDeclaration,
    AstNode,
    AstRule,
    BinaryExpressionToken,
    FunctionToken,
    NumberToken,
    ParensToken,
    ParserOptions,
    Token,
    WalkerOption
} from "../../../@types/index.d.ts";
import {EnumToken} from "../types.ts";
import {WalkerOptionEnum, WalkerValueEvent, walkValues} from "../walk.ts";
import {evaluate} from "../math/index.ts";
import {renderToken} from "../../renderer/index.ts";
import {mathFuncs} from "../../syntax/index.ts";

export class ComputeCalcExpressionFeature {

     get ordering(): number {
        return 1;
    }

    get preProcess(): boolean {
        return false;
    }

    get postProcess(): boolean {
        return true;
    }

    static register(options: ParserOptions): void {

        if (options.computeCalcExpression) {

            // @ts-ignore
            options.features.push(new ComputeCalcExpressionFeature());
        }
    }

    run(ast: AstRule | AstAtRule): void {

        if (!('chi' in ast)) {

            return;
        }

        for (const node of ast.chi! as Token[]) {

            if (node.typ != EnumToken.DeclarationNodeType) {

                continue;
            }

            const set: Set<Token> = new Set;

            for (const {value, parent} of walkValues((<AstDeclaration>node).val, node, {

                    event: WalkerValueEvent.Enter,
                    // @ts-ignore
                    fn(node: AstNode | Token, parent: FunctionToken | ParensToken | BinaryExpressionToken): WalkerOption | null {

                        if (parent != null &&
                            // @ts-ignore
                            (parent as AstDeclaration).typ == EnumToken.DeclarationNodeType &&
                            // @ts-ignore
                            (parent as AstDeclaration).val.length == 1 &&
                            node.typ == EnumToken.FunctionTokenType &&
                            mathFuncs.includes((node as FunctionToken).val) &&
                            (node as FunctionToken).chi.length == 1 &&
                            (node as FunctionToken).chi[0].typ == EnumToken.IdenTokenType) {

                            return WalkerOptionEnum.Ignore
                        }

                        if ((node.typ == EnumToken.FunctionTokenType && (node as FunctionToken).val == 'var') || (!mathFuncs.includes((parent as FunctionToken).val) && [EnumToken.ColorTokenType, EnumToken.DeclarationNodeType, EnumToken.RuleNodeType, EnumToken.AtRuleNodeType, EnumToken.StyleSheetNodeType].includes(parent?.typ))) {

                            return null;
                        }

                        // @ts-ignore
                        const slice: Token[] = (node.typ == EnumToken.FunctionTokenType ? (node as FunctionToken).chi : (node.typ == EnumToken.DeclarationNodeType ? (<AstDeclaration>node).val : (node as FunctionToken).chi))?.slice();

                        if (slice != null && node.typ == EnumToken.FunctionTokenType && mathFuncs.includes((node as FunctionToken).val)) {

                            // @ts-ignore
                            const cp: Token[] = (node.typ == EnumToken.FunctionTokenType && mathFuncs.includes(node.val) && node.val != 'calc' ? [node] : (node.typ == EnumToken.DeclarationNodeType ? (<AstDeclaration>node).val : node.chi)).slice();
                            const values: Token[] = evaluate(cp);

                            const key = 'chi' in node ? 'chi' : 'val';

                            const str1: string = renderToken({...node, [key]: slice} as Token);
                            const str2: string = renderToken(node as Token); // values.reduce((acc: string, curr: Token): string => acc + renderToken(curr), '');

                            if (str1.length <= str2.length) {

                                // @ts-ignore
                                node[key] = slice;
                            } else {

                                // @ts-ignore
                                node[key] = values;
                            }

                            return WalkerOptionEnum.Ignore;
                        }

                        return null;
                    }
                }
            )) {

                if (value != null && value.typ == EnumToken.FunctionTokenType && mathFuncs.includes((value as FunctionToken).val)) {

                    if (!set.has(<FunctionToken>value)) {

                        set.add(value);

                        if (parent != null) {

                            // @ts-ignore
                            const cp: Token[] = value.typ == EnumToken.FunctionTokenType && mathFuncs.includes(value.val) && value.val != 'calc' ? [value] : (value.typ == EnumToken.DeclarationNodeType ? (<AstDeclaration>value).val : value.chi);
                            const values: Token[] = evaluate(cp);

                            // @ts-ignore
                            const children: Token[] = parent.typ == EnumToken.DeclarationNodeType ? (<AstDeclaration>parent).val : parent.chi;

                            if (values.length == 1 && values[0].typ != EnumToken.BinaryExpressionTokenType) {

                                if (parent.typ == EnumToken.BinaryExpressionTokenType) {

                                    if ((parent as BinaryExpressionToken).l == value) {

                                        (parent as BinaryExpressionToken).l = values[0];
                                    } else {

                                        (parent as BinaryExpressionToken).r = values[0];
                                    }
                                } else {

                                    for (let i = 0; i < children.length; i++) {

                                        if (children[i] == value) {

                                            // @ts-ignore
                                            children.splice(i, 1, !(parent.typ == EnumToken.FunctionTokenType && parent.val == 'calc') && typeof (values[0] as NumberToken).val != 'string' ? {
                                                typ: EnumToken.FunctionTokenType,
                                                val: 'calc',
                                                chi: values
                                            } : values[0]);
                                            break;
                                        }
                                    }
                                }

                            } else {

                                for (let i = 0; i < children.length; i++) {

                                    if (children[i] == value) {

                                        if (parent.typ == EnumToken.FunctionTokenType && (parent as FunctionToken).val == 'calc') {

                                            children.splice(i, 1, ...values);
                                        } else {

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
