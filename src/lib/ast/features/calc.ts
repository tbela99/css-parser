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
import {FeatureWalkMode} from "./type.ts";

export class ComputeCalcExpressionFeature {

     get ordering(): number {
        return 1;
    }

    get processMode(): FeatureWalkMode {
        return FeatureWalkMode.Post;
    }

    static register(options: ParserOptions): void {

        if (options.computeCalcExpression) {

            // @ts-ignore
            options.features.push(new ComputeCalcExpressionFeature());
        }
    }

    run(ast: AstRule | AstAtRule): AstNode | null {

        if (!('chi' in ast)) {

            return null;
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
                            const key = 'chi' in node ? 'chi' : 'val';

                            const str1: string = renderToken({...node, [key]: slice} as Token);
                            const str2: string = renderToken(node as Token); // values.reduce((acc: string, curr: Token): string => acc + renderToken(curr), '');

                            if (str1.length <= str2.length) {

                                // @ts-ignore
                                node[key] = slice;
                            }

                            return WalkerOptionEnum.Ignore;
                        }

                        return null;
                    }
                }
            )) {

                if (value != null && value.typ == EnumToken.FunctionTokenType && mathFuncs.includes((value as FunctionToken).val)) {

                    if (!set.has(value as FunctionToken)) {

                        set.add(value);

                        if (parent != null) {

                            // @ts-ignore
                            const cp: Token[] = value.typ == EnumToken.FunctionTokenType && mathFuncs.includes(value.val) && value.val != 'calc' ? [value] : (value.typ == EnumToken.DeclarationNodeType ? (<AstDeclaration>value).val : value.chi);
                            const values: Token[] = evaluate(cp);

                            // @ts-ignore
                            const children: Token[] = parent.typ == EnumToken.DeclarationNodeType ? (<AstDeclaration>parent).val : parent.chi;

                            if (values.length == 1 && values[0].typ != EnumToken.BinaryExpressionTokenType) {

                                    for (let i = 0; i < children.length; i++) {

                                        if (children[i] == value) {

                                            children.splice(i, 1, !(parent.typ == EnumToken.FunctionTokenType && parent.val == 'calc') && (typeof (values[0] as NumberToken).val != 'number' && !(values[0].typ == EnumToken.FunctionTokenType && mathFuncs.includes((values[0] as FunctionToken).val))) ? {
                                                typ: EnumToken.FunctionTokenType,
                                                val: 'calc',
                                                chi: values
                                            } : values[0]);
                                            break;
                                        }
                                    }

                            } else {

                                for (let i = 0; i < children.length; i++) {

                                    if (children[i] == value) {

                                            children.splice(i, 1, {
                                                typ: EnumToken.FunctionTokenType,
                                                val: 'calc',
                                                chi: values
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
