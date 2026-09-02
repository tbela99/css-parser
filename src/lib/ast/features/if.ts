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
import { renderValue } from "../../renderer/render.ts";
import { FeatureWalkMode } from "./type.ts";
import { LOCEND, LOCSRCID, LOCSTA, PARENT, TOKENS } from "../../syntax/constants.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";
import { replaceNodeOrValue } from "../../parser/utils/token.ts";
import { cloneNode } from "../../ast/clone.ts";
import { trimArray } from "../../validation/match.ts";
import { findByValue } from "../find.ts";
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
    const result: AstNode[] = [] as AstNode[];
    let nodeMap = new Map();
    let clonedDeclaration;

    let targetParentWrapper: AstNode | Token = parentWrapper;
    let targetWrapper: AstNode | Token = wrapper;

    if (node.typ === EnumToken.IfElseConditionTokenType) {
        //
        clonedDeclaration = cloneNode(declaration, true, nodeMap) as AstDeclaration;

        // replace else: ... with the actual value
        if ((node as IfElseConditionToken).r.typ === EnumToken.IfConditionTokenType) {
            const target = ((node as IfElseConditionToken).r as IfConditionToken).l.find(
                (t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType,
            ) as Token;

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

                // @ts-expect-error
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

                                            // @ts-ignore
                                            cache.add((siblingWrapper.chi[k] as IfElseConditionToken).l);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
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
                // @ts-expect-error
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

            if (declaration[PARENT] != null) {
                atRule[LOCSRCID] = declaration[PARENT][LOCSRCID]!;
                atRule[LOCSTA] = declaration[PARENT][LOCSTA]!;
                atRule[LOCEND] = declaration[PARENT][LOCEND]!;
            }

            atRule[TOKENS] = [{ typ: EnumToken.ParensTokenType, chi: (left as FunctionToken).chi.slice() }];

            const minify: boolean = atRule.nam !== "supports";
            const options: RenderOptions = {
                minify,
                convertColor: minify,
            };

            atRule.val = atRule[TOKENS]!.reduce((acc: string, curr: Token) => acc + renderValue(curr, options), "");

            clonedDeclaration = cloneNode(declaration, true, nodeMap) as AstDeclaration;

            replaceNodeOrValue(
                nodeMap.get(targetWrapper),
                nodeMap.get(node),
                node.r.at(-1)?.typ === EnumToken.SemiColonTokenType ? trimArray(node.r.slice(0, -1)) : node.r,
            );

            clonedDeclaration[PARENT] = atRule;
            atRule.chi!.push(clonedDeclaration);
            result.push(atRule);

            processNode(clonedDeclaration, cache);
        } else if (left.typ === EnumToken.ContainerFunctionTokenType) {
            const atRule = Object.assign(cloneNode(declaration), {
                typ: EnumToken.AtRuleNodeType,
                nam: "container",
                chi: [] as Token[],
            }) as AstAtRule;

            atRule[TOKENS] = [left];
            atRule.val = atRule[TOKENS]!.reduce((acc: string, curr: Token) => acc + renderValue(curr), "");

            if (declaration[PARENT] != null) {
                atRule[LOCSRCID] = declaration[PARENT][LOCSRCID]!;
                atRule[LOCSTA] = declaration[PARENT][LOCSTA]!;
                atRule[LOCEND] = declaration[PARENT][LOCEND]!;

            }

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

            clonedDeclaration[PARENT] = atRule;
            atRule.chi!.push(clonedDeclaration);
            result.push(atRule);

            processNode(clonedDeclaration, cache);
        }
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

        if (declaration == null || node == null) {
            result.push(astNode as Token);
            continue;
        }

        // @ts-expect-error
        const parents = [...node.parents?.()];
        const parentWrapper = node.parent ?? parents.find((node) => !nodeMatcher(node));

        if (node!.node!.typ === EnumToken.WildCardFunctionTokenType) {
            for (i = 0; i < (node!.node as FunctionToken).chi.length; i++) {
                stack.push(
                    // @ts-expect-error
                    ...substituteIfElseNode(
                        // @ts-expect-error
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
                // @ts-expect-error
                ...substituteIfElseNode(
                    // @ts-expect-error
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
        // @ts-expect-error
        replaceNodeOrValue(declarationNode[PARENT], declarationNode, result);
    }
    // else remove node?
    // @ts-expect-error
    return result;
}

export class ExpandIfFeature {
    public accept: Set<EnumToken> = new Set([EnumToken.DeclarationNodeType]);

    get ordering(): number {
        return 4;
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

    run(declaration: AstDeclaration): AstNode | AstNode[] | null {
        return processNode(declaration, new Set<AstNode>()) as AstNode[];
    }
}
