import type {
    AstAtRule,
    AstDeclaration,
    AstNode,
    FunctionToken,
    IdentToken,
    IfConditionToken,
    IfElseConditionToken,
    ParserOptions,
    RenderOptions,
    Token,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { renderToken } from "../../renderer/render.ts";
import { FeatureWalkMode } from "./type.ts";
import { definedPropertySettings } from "../../syntax/constants.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";
import { replaceNodeOrValue } from "../../parser/utils/token.ts";
import { cloneNode } from "../../ast/clone.ts";
import { trimArray } from "../../validation/match.ts";
import { findByValue } from "../find.ts";
import { walk } from "../walk.ts";
import { eq } from "../../parser/utils/eq.ts";

const nodeMatcher = (value: Token) =>
    value.typ === EnumToken.IfConditionTokenType ||
    (value.typ === EnumToken.WildCardFunctionTokenType && equalsIgnoreCase("if", (value as FunctionToken).val));

function substituteIfElseNode(
    declaration: AstDeclaration,
    node: IfConditionToken | IfElseConditionToken,
    wrapper: FunctionToken,
    parentWrapper: FunctionToken,
    cache: Set<AstNode>,
): AstNode[] {
    const result: AstNode = [];
    let nodeMap = new Map();
    let clonedDeclaration;

    let targetParentWrapper: AstNode | Token = parentWrapper;
    let targetWrapper: AstNode | Token = wrapper;

    if (node.typ === EnumToken.IfElseConditionTokenType) {
        //
        clonedDeclaration = cloneNode(declaration, true, nodeMap) as AstDeclaration;

        let replaceRight: boolean = true;

        // replace else: ... with the actual value
        if ((node as IfElseConditionToken).r.typ === EnumToken.IfConditionTokenType) {
            const target = ((node as IfElseConditionToken).r as IfConditionToken).l.find(
                (t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType,
            ) as Token;

            if (target == null) {
                return result;
            }

            //
            if (target.typ === EnumToken.IdenTokenType && equalsIgnoreCase("else", (target as IdentToken).val)) {
                replaceNodeOrValue(
                    nodeMap.get(targetParentWrapper),
                    nodeMap.get(targetWrapper),
                    ((node as IfElseConditionToken).r as IfConditionToken).r.at(-1)?.typ ===
                        EnumToken.SemiColonTokenType
                        ? trimArray(((node as IfElseConditionToken).r as IfConditionToken).r.slice(0, -1))
                        : ((node as IfElseConditionToken).r as IfConditionToken).r,
                );

                if (targetParentWrapper.typ != EnumToken.DeclarationNodeType) {
                    let index: number = (targetParentWrapper as FunctionToken).chi.indexOf(targetWrapper);
                    if (index != -1) {
                        let i: number;
                        let k: number;
                        let siblingWrapper: FunctionToken;
                        let left = ((node as IfElseConditionToken).l as IfConditionToken).l.find(
                            (t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType,
                        );

                        for (i = index + 1; i < (targetParentWrapper as FunctionToken).chi.length; i++) {
                            if ((targetParentWrapper as FunctionToken).chi[i].typ === targetWrapper.typ) {
                                siblingWrapper = (targetParentWrapper as FunctionToken).chi[i] as FunctionToken;

                                for (k = 0; k < siblingWrapper.chi.length; k++) {
                                    if (siblingWrapper.chi[k].typ === EnumToken.IfElseConditionTokenType) {
                                        let leftSide = (
                                            (siblingWrapper.chi[k] as IfElseConditionToken).l as IfConditionToken
                                        ).l.find(
                                            (t) =>
                                                t.typ != EnumToken.CommentTokenType &&
                                                t.typ != EnumToken.WhitespaceTokenType,
                                        );

                                        if (eq(left, leftSide)) {
                                            replaceNodeOrValue(
                                                nodeMap.get(targetParentWrapper),
                                                nodeMap.get((targetParentWrapper as FunctionToken).chi[i]),
                                                (
                                                    (siblingWrapper.chi[k] as IfElseConditionToken)
                                                        .r as IfConditionToken
                                                ).r.at(-1)?.typ === EnumToken.SemiColonTokenType
                                                    ? trimArray(
                                                          (
                                                              (siblingWrapper.chi[k] as IfElseConditionToken)
                                                                  .r as IfConditionToken
                                                          ).r.slice(0, -1),
                                                      )
                                                    : (
                                                          (siblingWrapper.chi[k] as IfElseConditionToken)
                                                              .r as IfConditionToken
                                                      ).r,
                                            );

                                            cache.add((siblingWrapper.chi[k] as IfElseConditionToken).l);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                replaceRight = false;
            }
        }

        if (replaceRight) {
            replaceNodeOrValue(
                nodeMap.get(targetParentWrapper),
                nodeMap.get(targetWrapper),
                (node as IfElseConditionToken).r,
            );
        }

        result.push(clonedDeclaration);

        nodeMap.clear();

        clonedDeclaration = cloneNode(declaration, true, nodeMap) as AstDeclaration;

        replaceNodeOrValue(
            nodeMap.get(targetParentWrapper),
            nodeMap.get(targetWrapper),
            (node as IfElseConditionToken).l,
        );
        result.push(clonedDeclaration);
    } else if (node.typ === EnumToken.IfConditionTokenType) {
        const left = (node as IfConditionToken).l.find(
            (t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType,
        ) as Token;

        if (left == null) {
            return result;
        }

        if (left.typ === EnumToken.IdenTokenType && equalsIgnoreCase("else", (left as IdentToken).val)) {
            clonedDeclaration = cloneNode(declaration, true, nodeMap) as AstDeclaration;

            replaceNodeOrValue(
                nodeMap.get(parentWrapper),
                nodeMap.get(targetWrapper.typ === EnumToken.DeclarationNodeType ? node : targetWrapper),
                node.r.at(-1)?.typ === EnumToken.SemiColonTokenType ? trimArray(node.r.slice(0, -1)) : node.r,
            );

            result.push(clonedDeclaration);
        } else if (left?.typ === EnumToken.WhenElseFunctionTokenType) {
            const atRule = Object.assign(cloneNode(declaration), {
                typ: EnumToken.AtRuleNodeType,
                nam: (left as FunctionToken).val,
                chi: [] as Token[],
            }) as AstAtRule;

            Object.defineProperty(atRule, "tokens", {
                ...definedPropertySettings,
                value: [{ typ: EnumToken.ParensTokenType, chi: (left as FunctionToken).chi.slice() }],
            });

            const minify: boolean = atRule.nam !== "supports";
            const options: RenderOptions = {
                minify,
                convertColor: minify,
            };

            atRule.val = atRule.tokens!.reduce((acc: string, curr: Token) => acc + renderToken(curr, options), "");

            clonedDeclaration = cloneNode(declaration, true, nodeMap) as AstDeclaration;

            replaceNodeOrValue(
                nodeMap.get(targetWrapper),
                nodeMap.get(node),
                node.r.at(-1)?.typ === EnumToken.SemiColonTokenType ? trimArray(node.r.slice(0, -1)) : node.r,
            );

            clonedDeclaration.parent = atRule;
            atRule.chi!.push(clonedDeclaration);
            result.push(atRule);

            processNode(clonedDeclaration, cache);

            // nodeMap.clear();
        } else if (left.typ === EnumToken.ContainerFunctionTokenType) {
            const atRule = Object.assign(cloneNode(declaration), {
                typ: EnumToken.AtRuleNodeType,
                nam: "container",
                chi: [] as Token[],
            }) as AstAtRule;

            Object.defineProperty(atRule, "tokens", { ...definedPropertySettings, value: [left] });
            atRule.val = atRule.tokens!.reduce((acc: string, curr: Token) => acc + renderToken(curr), "");

            clonedDeclaration = cloneNode(declaration, true, nodeMap) as AstDeclaration;

            replaceNodeOrValue(
                nodeMap.get(
                    targetWrapper.typ === EnumToken.WildCardFunctionTokenType ? targetParentWrapper : targetWrapper,
                ),
                nodeMap.get(targetWrapper.typ === EnumToken.WildCardFunctionTokenType ? targetWrapper : node),
                (node as IfConditionToken).r.at(-1)?.typ === EnumToken.SemiColonTokenType
                    ? trimArray((node as IfConditionToken).r.slice(0, -1))
                    : (node as IfConditionToken).r,
            );

            clonedDeclaration.parent = atRule;
            atRule.chi!.push(clonedDeclaration);
            result.push(atRule);

            processNode(clonedDeclaration, cache);
        }
    } else if (wrapper.typ === EnumToken.WildCardFunctionTokenType) {
        clonedDeclaration = cloneNode(declaration, true, nodeMap) as AstDeclaration;

        replaceNodeOrValue(nodeMap.get(parentWrapper), nodeMap.get(wrapper), node);

        result.push(clonedDeclaration);
    }

    return result;
}

function processNode(declarationNode: AstDeclaration, cache: Set<AstNode>): AstNode[] {
    let i: number;
    let k: number = -1;

    let astNode: AstNode;
    const result: Token[] = [];
    const stack: AstNode[] | Token[] = [declarationNode];

    while (++k < stack.length) {
        astNode = stack[k] as AstNode;
        const { node: declaration, value: node } = findByValue(astNode, nodeMatcher) ?? {};

        if (node != null && cache.has(node.node)) {
            continue;
        }

        if (declaration == null || node == null) {
            while (astNode.parent != null && astNode.parent != declarationNode.parent) {
                astNode = astNode.parent;
            }

            result.push(astNode);
            continue;
        }

        // @ts-expect-error
        const parents = [...node.parents?.()];
        const parentWrapper = node!.parent ?? parents.find((node) => !nodeMatcher(node));

        if (node!.node!.typ === EnumToken.WildCardFunctionTokenType) {
            for (i = 0; i < (node!.node as FunctionToken).chi.length; i++) {
                if (cache.has((node!.node as FunctionToken).chi[i])) {
                    continue;
                }

                stack.push(
                    ...substituteIfElseNode(
                        declaration,
                        (node!.node as FunctionToken).chi[i] as IfConditionToken | IfElseConditionToken,
                        node!.node as FunctionToken,
                        parentWrapper,
                        cache,
                    ),
                );
            }
        } else {
            stack.push(
                ...substituteIfElseNode(
                    declaration,
                    node!.node as IfConditionToken,
                    parentWrapper as FunctionToken,
                    parents[parents.indexOf(parentWrapper) + 1] ?? declaration,
                    cache,
                ),
            );
        }
    }

    if (result.length > 0) {
        replaceNodeOrValue(declarationNode.parent, declarationNode, result);
    }
    // else remove node?
    return result;
}

export class ExpandIfFeature {
    public accept: Set<EnumToken> = new Set([EnumToken.DeclarationNodeType]);

    get ordering(): number {
        return 5;
    }

    get processMode(): FeatureWalkMode {
        return FeatureWalkMode.Pre;
    }

    static register(options: ParserOptions): void {
        if (options.expandIfSyntax) {
            // @ts-ignore
            options.features.push(new ExpandIfFeature());
        }
    }

    run(declaration: AstDeclaration): AstNode | null {
        processNode(declaration, new Set<AstNode>());

        let i: number;

        for (const n of declaration.parent.chi) {
            for (const { node } of walk(n)) {
                if (node.typ === EnumToken.AtRuleNodeType && Array.isArray(node.chi)) {
                    for (i = 0; i < (node as AstAtRule).chi!.length; i++) {
                        if (
                            (node as AstAtRule).chi![i]!.typ === EnumToken.AtRuleNodeType &&
                            (node as AstAtRule).chi![i + 1]?.typ === EnumToken.AtRuleNodeType &&
                            (node as AstAtRule).chi![i]!.nam === (node as AstAtRule).chi![i + 1]!.nam &&
                            (node as AstAtRule).chi![i]!.val === (node as AstAtRule).chi![i + 1]!.val
                        ) {
                            (node as AstAtRule).chi![i]!.chi.push(...(node as AstAtRule).chi![i + 1]!.chi);
                            (node as AstAtRule).chi!.splice(i + 1, 1);
                            i--;
                        }
                    }

                    for (i = 0; i < (node as AstAtRule).chi!.length; i++) {
                        if (
                            (node as AstAtRule).chi![i]!.typ === EnumToken.AtRuleNodeType &&
                            (node as AstAtRule).chi![i]!.nam === (node as AstAtRule).nam &&
                            (node as AstAtRule).chi![i]!.val === (node as AstAtRule).val
                        ) {
                            (node as AstAtRule).chi!.splice(i, 1, ...(node as AstAtRule).chi![i]!.chi);
                            i--;
                        }
                    }
                }
            }
        }
    }
}
