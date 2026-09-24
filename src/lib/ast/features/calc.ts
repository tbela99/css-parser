import type {
    AstAtRule,
    AstDeclaration,
    AstNode,
    AstRule,
    BinaryExpressionToken,
    DimensionToken,
    FunctionToken,
    NumberToken,
    ParserOptions,
    Token,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { walkValues } from "../walk.ts";
import { evaluate } from "../math/expression.ts";
import { FeatureWalkMode } from "./type.ts";
import { LOCEND, LOCSRCID, LOCSTA, mathFuncs, tokensfuncSet } from "../../syntax/constants.ts";
import { replaceNodeOrValue } from "../../parser/utils/token.ts";

export class ComputeCalcExpressionFeature {
    public accept: Set<EnumToken> = new Set([EnumToken.RuleNodeType, EnumToken.AtRuleNodeType]);

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
        if (!("chi" in ast)) {
            return null;
        }

        for (const node of ast.chi! as Token[]) {
            if (node.typ != EnumToken.DeclarationNodeType) {
                continue;
            }

            const set: Set<Token> = new Set();

            for (const { value, parent } of walkValues(
                (<AstDeclaration>node).val,
                node
            )) {
                if (parent?.typ == EnumToken.BinaryExpressionTokenType) {
                    continue;
                }
                if (value.typ == EnumToken.BinaryExpressionTokenType) {
                    const result = evaluate([value]);

                    try {
                        // @ts-ignore
                        replaceNodeOrValue(parent, value, result);
                    } catch (e) {
                        // @ts-ignore
                        if (Array.isArray(parent.chi)) {
                            // @ts-ignore
                            parent.chi.length = 0;
                            // @ts-ignore
                            parent.chi.push(...result);
                        }
                    }
                    continue;
                }

                if (value != null && tokensfuncSet.has(value.typ)) {
                    if (!set.has(value as FunctionToken)) {
                        set.add(value);

                        if (parent != null) {
                            const shouldEvaluate: boolean =
                                value.typ === EnumToken.MathFunctionTokenType ||
                                (value.typ == EnumToken.FunctionTokenType &&
                                    mathFuncs.includes((value as FunctionToken).val));

                            if (shouldEvaluate) {
                                // @ts-ignore
                                const cp: Token[] =
                                    (value as FunctionToken).val != "calc"
                                        ? [value]
                                        : value.typ == EnumToken.DeclarationNodeType
                                          ? (<AstDeclaration>value).val
                                          : (value as FunctionToken).chi;

                                const values: Token[] = evaluate(cp);

                                // fix a + -b to a - b
                                for (const { value, parent: p } of walkValues(values)) {
                                    if (value.typ === EnumToken.BinaryExpressionTokenType) {
                                        if (
                                            (value as BinaryExpressionToken).op === EnumToken.Add &&
                                            Math.sign(
                                                ((value as BinaryExpressionToken).r as NumberToken).val as number,
                                            ) == -1
                                        ) {
                                            (value as BinaryExpressionToken).op = EnumToken.Sub;
                                            // @ts-expect-error
                                            ((value as BinaryExpressionToken).r as NumberToken | DimensionToken).val *=
                                                -1;
                                        }
                                    }
                                }

                                // @ts-ignore
                                const children: Token[] =
                                    parent.typ == EnumToken.DeclarationNodeType
                                        ? (<AstDeclaration>parent).val
                                        : // @ts-ignore
                                          parent.chi;

                                if (values.length == 1 && values[0].typ != EnumToken.BinaryExpressionTokenType) {
                                    for (let i = 0; i < children.length; i++) {
                                        if (children[i] == value) {
                                            children.splice(
                                                i,
                                                1,
                                                !(
                                                    parent.typ === EnumToken.MathFunctionTokenType ||
                                                    (parent.typ == EnumToken.FunctionTokenType &&
                                                        (parent as FunctionToken).val == "calc")
                                                ) &&
                                                    typeof (values[0] as NumberToken).val != "number" &&
                                                    !(
                                                        values[0].typ == EnumToken.MathFunctionTokenType ||
                                                        (values[0].typ == EnumToken.FunctionTokenType &&
                                                            mathFuncs.includes((values[0] as FunctionToken).val))
                                                    )
                                                    ? {
                                                          typ: EnumToken.MathFunctionTokenType,
                                                          val: "calc",
                                                          chi: values,
                                                          [LOCSRCID]: value[LOCSRCID],
                                                          [LOCSTA]: value[LOCSTA],
                                                          [LOCEND]: value[LOCEND],
                                                      }
                                                    : values[0],
                                            );
                                            break;
                                        }
                                    }
                                } else {
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
