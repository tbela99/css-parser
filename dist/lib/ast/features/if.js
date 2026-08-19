import { EnumToken } from '../types.js';
import { renderValue } from '../../renderer/render.js';
import { FeatureWalkMode } from './type.js';
import { PARENT, LOC, TOKENS } from '../../syntax/constants.js';
import { equalsIgnoreCase } from '../../parser/utils/text.js';
import { replaceNodeOrValue } from '../../parser/utils/token.js';
import { cloneNode } from '../clone.js';
import { trimArray } from '../../validation/match.js';
import { findByValue } from '../find.js';
import { eq } from '../../parser/utils/eq.js';

const nodeMatcher = (value) => value.typ === EnumToken.IfConditionTokenType ||
    (value.typ === EnumToken.WildCardFunctionTokenType && equalsIgnoreCase("if", value.val));
function substituteIfElseNode(declaration, node, wrapper, parentWrapper, cache) {
    const result = [];
    let nodeMap = new Map();
    let clonedDeclaration;
    let targetParentWrapper = parentWrapper;
    let targetWrapper = wrapper;
    if (node.typ === EnumToken.IfElseConditionTokenType) {
        //
        clonedDeclaration = cloneNode(declaration, true, nodeMap);
        // replace else: ... with the actual value
        if (node.r.typ === EnumToken.IfConditionTokenType) {
            const target = node.r.l.find((t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);
            //
            if (target.typ === EnumToken.IdenTokenType && equalsIgnoreCase("else", target.val)) {
                replaceNodeOrValue(nodeMap.get(targetParentWrapper), nodeMap.get(targetWrapper), node.r.r.at(-1)?.typ ===
                    EnumToken.SemiColonTokenType
                    ? trimArray(node.r.r.slice(0, -1))
                    : node.r.r);
                if (targetParentWrapper.typ != EnumToken.DeclarationNodeType) {
                    let index = targetParentWrapper.chi.indexOf(targetWrapper);
                    if (index != -1) {
                        let i;
                        let k;
                        let siblingWrapper;
                        let left = node.l.l.find((t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);
                        for (i = index + 1; i < targetParentWrapper.chi.length; i++) {
                            if (targetParentWrapper.chi[i].typ === targetWrapper.typ) {
                                siblingWrapper = targetParentWrapper.chi[i];
                                for (k = 0; k < siblingWrapper.chi.length; k++) {
                                    if (siblingWrapper.chi[k].typ === EnumToken.IfElseConditionTokenType) {
                                        let leftSide = siblingWrapper.chi[k].l.l.find((t) => t.typ != EnumToken.CommentTokenType &&
                                            t.typ != EnumToken.WhitespaceTokenType);
                                        if (eq(left, leftSide)) {
                                            replaceNodeOrValue(nodeMap.get(targetParentWrapper), nodeMap.get(targetParentWrapper.chi[i]), siblingWrapper.chi[k]
                                                .r.r.at(-1)?.typ === EnumToken.SemiColonTokenType
                                                ? trimArray(siblingWrapper.chi[k]
                                                    .r.r.slice(0, -1))
                                                : siblingWrapper.chi[k]
                                                    .r.r);
                                            cache.add(siblingWrapper.chi[k].l);
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
        clonedDeclaration = cloneNode(declaration, true, nodeMap);
        replaceNodeOrValue(nodeMap.get(targetParentWrapper), nodeMap.get(targetWrapper), node.l);
        result.push(clonedDeclaration);
    }
    else if (node.typ === EnumToken.IfConditionTokenType) {
        const left = node.l.find((t) => t.typ != EnumToken.CommentTokenType && t.typ != EnumToken.WhitespaceTokenType);
        if (left == null) {
            return result;
        }
        if (left.typ === EnumToken.IdenTokenType && equalsIgnoreCase("else", left.val)) {
            clonedDeclaration = cloneNode(declaration, true, nodeMap);
            replaceNodeOrValue(nodeMap.get(parentWrapper), nodeMap.get(targetWrapper.typ === EnumToken.DeclarationNodeType ? node : targetWrapper), node.r.at(-1)?.typ === EnumToken.SemiColonTokenType ? trimArray(node.r.slice(0, -1)) : node.r);
            result.push(clonedDeclaration);
        }
        else if (left?.typ === EnumToken.WhenElseFunctionTokenType) {
            const atRule = Object.assign(cloneNode(declaration), {
                typ: EnumToken.AtRuleNodeType,
                nam: left.val,
                chi: [],
            });
            if (declaration[PARENT] != null) {
                atRule[LOC] = declaration[PARENT][LOC];
            }
            atRule[TOKENS] = [{ typ: EnumToken.ParensTokenType, chi: left.chi.slice() }];
            const minify = atRule.nam !== "supports";
            const options = {
                minify,
                convertColor: minify,
            };
            atRule.val = atRule[TOKENS].reduce((acc, curr) => acc + renderValue(curr, options), "");
            clonedDeclaration = cloneNode(declaration, true, nodeMap);
            replaceNodeOrValue(nodeMap.get(targetWrapper), nodeMap.get(node), node.r.at(-1)?.typ === EnumToken.SemiColonTokenType ? trimArray(node.r.slice(0, -1)) : node.r);
            clonedDeclaration[PARENT] = atRule;
            atRule.chi.push(clonedDeclaration);
            result.push(atRule);
            processNode(clonedDeclaration, cache);
        }
        else if (left.typ === EnumToken.ContainerFunctionTokenType) {
            const atRule = Object.assign(cloneNode(declaration), {
                typ: EnumToken.AtRuleNodeType,
                nam: "container",
                chi: [],
            });
            atRule[TOKENS] = [left];
            atRule.val = atRule[TOKENS].reduce((acc, curr) => acc + renderValue(curr), "");
            if (declaration[PARENT] != null) {
                atRule[LOC] = declaration[PARENT][LOC];
            }
            clonedDeclaration = cloneNode(declaration, true, nodeMap);
            replaceNodeOrValue(nodeMap.get(targetWrapper.typ === EnumToken.WildCardFunctionTokenType ? targetParentWrapper : targetWrapper), nodeMap.get(targetWrapper.typ === EnumToken.WildCardFunctionTokenType ? targetWrapper : node), node.r.at(-1)?.typ === EnumToken.SemiColonTokenType
                ? trimArray(node.r.slice(0, -1))
                : node.r);
            clonedDeclaration[PARENT] = atRule;
            atRule.chi.push(clonedDeclaration);
            result.push(atRule);
            processNode(clonedDeclaration, cache);
        }
    }
    return result;
}
function processNode(declarationNode, cache) {
    let i;
    let k = -1;
    let astNode;
    const result = [];
    const stack = [declarationNode];
    while (++k < stack.length) {
        astNode = stack[k];
        const { node: declaration, value: node } = findByValue(astNode, nodeMatcher) ?? {};
        if (declaration == null || node == null) {
            result.push(astNode);
            continue;
        }
        // @ts-expect-error
        const parents = [...node.parents?.()];
        const parentWrapper = node.parent ?? parents.find((node) => !nodeMatcher(node));
        if (node.node.typ === EnumToken.WildCardFunctionTokenType) {
            for (i = 0; i < node.node.chi.length; i++) {
                stack.push(...substituteIfElseNode(declaration, node.node.chi[i], node.node, parentWrapper, cache));
            }
        }
        else {
            stack.push(...substituteIfElseNode(declaration, node.node, parentWrapper, parents[parents.indexOf(parentWrapper) + 1] ?? declaration, cache));
        }
    }
    if (result.length > 0) {
        replaceNodeOrValue(declarationNode[PARENT], declarationNode, result);
    }
    // else remove node?
    return result;
}
class ExpandIfFeature {
    accept = new Set([EnumToken.DeclarationNodeType]);
    get ordering() {
        return 4;
    }
    get processMode() {
        return FeatureWalkMode.Pre;
    }
    static register(options) {
        if (options.expandIfSyntax) {
            // @ts-ignore
            options.features.push(new ExpandIfFeature());
        }
    }
    run(declaration) {
        return processNode(declaration, new Set());
    }
}

export { ExpandIfFeature };
