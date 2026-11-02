import type { AstAtRule, AstNode, AstRule, ParserOptions, Token } from "../../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import { walkValues } from "../walk.ts";
import { evaluate } from "../math/expression.ts";
import { FeatureWalkMode } from "./type.ts";
import { mathFuncs, tokensfuncSet } from "../../syntax/constants.ts";
import { replaceNodeOrValue } from "../../parser/utils/token.ts";
import type { AstArena } from "../arena.ts";

export class ComputeCalcExpressionFeature {
    public accept: Set<EnumToken> = new Set([EnumToken.RuleNodeType, EnumToken.AtRuleNodeType]);

    get ordering(): number {
        return 3;
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

    run(arena: AstArena, ast: AstRule | AstAtRule): AstNode | null {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren)) {
            return null;
        }

        for (let node = arena.firstChild[ast]; node != 0; node = arena.nextSibling[node]) {
            if (arena.dataTypes[node] != EnumToken.DeclarationNodeType) {
                continue;
            }

            const set: Set<Token> = new Set();

            for (const { value, parent } of walkValues(arena, arena.tokens(node), node)) {
                if (parent != null && arena.dataTypes[parent] == EnumToken.BinaryExpressionTokenType) {
                    continue;
                }

                const typ: EnumToken = arena.dataTypes[value];

                if (typ == EnumToken.BinaryExpressionTokenType) {
                    const result: Token[] = evaluate(arena, [value]);

                    try {
                        replaceNodeOrValue(arena, parent, value, result);
                    } catch (e) {}
                    continue;
                }

                if (tokensfuncSet.has(typ)) {
                    if (!set.has(value)) {
                        set.add(value);

                        if (parent != null) {
                            const name: string = arena.strings[arena.stringValue[value]];
                            const shouldEvaluate: boolean =
                                typ === EnumToken.MathFunctionTokenType ||
                                (typ == EnumToken.FunctionTokenType && mathFuncs.includes(name));

                            if (shouldEvaluate) {
                                const cp: Token[] = name != "calc" ? [value] : arena.tokens(value);
                                const values: Token[] = evaluate(arena, cp);

                                // fix a + -b into a - b
                                for (const { value } of walkValues(arena, values)) {
                                    if (arena.dataTypes[value] === EnumToken.BinaryExpressionTokenType) {
                                        const r: Token = arena.getRight(value)![0];

                                        if (
                                            arena.numericValue[value] === EnumToken.Add &&
                                            arena.isNumeric(r) &&
                                            Math.sign(arena.numericValue[r]) == -1
                                        ) {
                                            arena.numericValue[value] = EnumToken.Sub;
                                            arena.numericValue[r] *= -1;
                                        }
                                    }
                                }

                                // the value is replaced by the computed tokens or wrapped into a calc() function
                                if (
                                    values.length == 1 &&
                                    arena.dataTypes[values[0]] != EnumToken.BinaryExpressionTokenType
                                ) {
                                    const parentType: EnumToken = arena.dataTypes[parent];
                                    const wrap: boolean =
                                        !(
                                            parentType === EnumToken.MathFunctionTokenType ||
                                            (parentType == EnumToken.FunctionTokenType &&
                                                arena.strings[arena.stringValue[parent]] == "calc")
                                        ) &&
                                        (!arena.isNumeric(values[0]) || arena.hasFraction(values[0])) &&
                                        !(
                                            arena.dataTypes[values[0]] == EnumToken.MathFunctionTokenType ||
                                            (arena.dataTypes[values[0]] == EnumToken.FunctionTokenType &&
                                                mathFuncs.includes(arena.strings[arena.stringValue[values[0]]]))
                                        );

                                    arena.replaceToken(value, wrap ? createCalc(arena, value, values) : values[0]);
                                } else {
                                    arena.replaceToken(value, createCalc(arena, value, values));
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

/**
 * wrap tokens into a calc() function
 * @param arena
 * @param source token the location is copied from
 * @param values
 */
function createCalc(arena: AstArena, source: Token, values: Token[]): Token {
    const calc: Token = arena.createFunction(EnumToken.MathFunctionTokenType, "calc", values);

    arena.copyLocation(calc, source);
    return calc;
}
