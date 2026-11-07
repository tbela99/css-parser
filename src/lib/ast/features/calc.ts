import { numericTokenTypes } from "../arena.ts";
import { TokenField } from "../arena.ts";
import type { AstAtRule, AstNode, AstRule, ParserOptions, Token } from "../../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import { evaluate } from "../math/expression.ts";
import { FeatureWalkMode } from "./type.ts";
import { mathFuncs, tokensfuncSet } from "../../syntax/constants.ts";
import { replaceNodeOrValue } from "../../parser/utils/token.ts";
import type { AstArena } from "../arena.ts";
import { ValueWalker } from "../walk.ts";

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

            if (!hasExpression(arena, node)) {
                continue;
            }

            // function tokens already evaluated, created on demand
            let set: Set<Token> | null = null;

            // inlined: arena.walkValues(node)
            for (const value of new ValueWalker(arena, node)) {
                // the parent of a detached token is the declaration
                const parent: Token = arena.getValueParent(value) || node;

                if (parent != null && arena.dataTypes[parent] == EnumToken.BinaryExpressionTokenType) {
                    continue;
                }

                const typ: EnumToken = arena.dataTypes[value];

                if (typ == EnumToken.BinaryExpressionTokenType) {
                    const result: Token[] = evaluate(arena, [value]);

                    try {
                        replaceNodeOrValue(arena, value, result);
                    } catch (e) {}
                    continue;
                }

                if (tokensfuncSet.has(typ)) {
                    set ??= new Set();

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
                                // inlined: arena.walkValues(values)
                                for (const value of new ValueWalker(arena, values)) {
                                    if (arena.dataTypes[value] === EnumToken.BinaryExpressionTokenType) {
                                        // inlined: arena.getRight(value)
                                        const r: Token = (arena.getChildAt(value, TokenField.R) == null ? null : arena.fieldTokens(value, TokenField.R))![0];

                                        if (
                                            arena.numericValue[value] === EnumToken.Add &&
                                            // inlined: arena.isNumeric(r)
                                            numericTokenTypes.has(arena.dataTypes[r]) &&
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
                                        // inlined: arena.isNumeric(values[0])
                                        (!numericTokenTypes.has(arena.dataTypes[values[0]]) || arena.hasFraction(values[0])) &&
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

/**
 * true if a value token of the declaration is a function, an expression or has children: the values of the other
 * declarations are not walked
 * @param arena
 * @param node
 */
function hasExpression(arena: AstArena, node: AstNode): boolean {
    for (let token: Token = arena.firstToken[node]; token != 0; token = arena.nextSibling[token]) {
        if (
            arena.dataTypes[token] == EnumToken.BinaryExpressionTokenType ||
            tokensfuncSet.has(arena.dataTypes[token]) ||
            arena.firstToken[token] != 0 ||
            arena.firstChild[token] != 0
        ) {
            return true;
        }
    }

    return false;
}
