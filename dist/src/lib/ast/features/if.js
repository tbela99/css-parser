/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0
	License: MIT
 */
import { EnumToken } from '../types.js';
import { renderValue } from '../../printer/render.js';
import { FeatureWalkMode } from './type.js';
import { equalsIgnoreCase } from '../../parser/utils/text.js';
import { trimArray } from '../../validation/match.js';
import { eqToken } from '../../parser/utils/eq.js';
import { TokenField } from '../arena.js';

/**
 * true if the token is an if() function or an if condition
 * @param arena
 * @param value
 */
function isIfToken(arena, value) {
    return (arena.dataTypes[value] === EnumToken.IfConditionTokenType ||
        (arena.dataTypes[value] === EnumToken.WildCardFunctionTokenType &&
            equalsIgnoreCase("if", arena.strings[arena.stringValue[value]])));
}
/**
 * deep clone a declaration. the clone map is filled with the cloned value tokens
 * @param arena
 * @param declaration
 * @param nodeMap
 */
function cloneDeclaration(arena, declaration, nodeMap) {
    nodeMap.clear();
    return arena.clone(declaration, true, nodeMap);
}
/**
 * create an at-rule wrapping a declaration. the location is inherited from the declaration parent
 * @param arena
 * @param declaration
 * @param parent parent of the declaration when the declaration is detached
 * @param nam
 * @param tokens
 * @param options
 */
function createAtRule(arena, declaration, parent, nam, tokens, options = {}) {
    const atRule = arena.createAtRule(EnumToken.AtRuleNodeType, nam, tokens.reduce((acc, curr) => acc + renderValue(arena, curr, options), ""), true, tokens, null, null);
    if (arena.parents[declaration] != 0) {
        parent = arena.parents[declaration];
    }
    if (parent != 0) {
        arena.copyLocation(atRule, parent);
    }
    return atRule;
}
/**
 * first token of the left side of an if condition that is not a comment or a whitespace
 * @param arena
 * @param condition
 */
function conditionLeft(arena, condition) {
    return (arena
        .fieldTokens(condition, TokenField.L)
        .find((t) => arena.dataTypes[t] != EnumToken.CommentTokenType &&
        arena.dataTypes[t] != EnumToken.WhitespaceTokenType) ?? null);
}
/**
 * value tokens of an if condition (right side). the trailing semicolon is removed
 * @param arena
 * @param condition
 * @param nodeMap map of the tokens to their clones
 */
function conditionValue(arena, condition, nodeMap) {
    let tokens = arena.fieldTokens(condition, TokenField.R);
    if (tokens.length > 0 && arena.dataTypes[tokens[tokens.length - 1]] === EnumToken.SemiColonTokenType) {
        tokens = trimArray(arena, tokens.slice(0, -1));
    }
    return tokens.map((t) => nodeMap.get(t));
}
function substituteIfElseNode(arena, declaration, node, wrapper, parentWrapper, cache, parent) {
    const result = [];
    const nodeMap = new Map();
    let clonedDeclaration;
    let targetParentWrapper = parentWrapper;
    let targetWrapper = wrapper;
    // map a token or the declaration itself to its clone
    const mapped = (target) => target == declaration ? clonedDeclaration : nodeMap.get(target);
    if (arena.dataTypes[node] === EnumToken.IfElseConditionTokenType) {
        //
        clonedDeclaration = cloneDeclaration(arena, declaration, nodeMap);
        const elseCondition = arena.field(node, TokenField.R);
        // replace else: ... with the actual value
        if (arena.dataTypes[elseCondition] === EnumToken.IfConditionTokenType) {
            const target = conditionLeft(arena, elseCondition);
            //
            if (target != null &&
                arena.dataTypes[target] === EnumToken.IdenTokenType &&
                equalsIgnoreCase("else", arena.strings[arena.stringValue[target]])) {
                arena.replaceToken(mapped(targetWrapper), ...conditionValue(arena, elseCondition, nodeMap));
                if (targetParentWrapper != declaration) {
                    const siblings = arena.tokens(targetParentWrapper);
                    let index = siblings.indexOf(targetWrapper);
                    if (index != -1) {
                        let i;
                        let siblingWrapper;
                        let left = conditionLeft(arena, arena.field(node, TokenField.L));
                        for (i = index + 1; i < siblings.length; i++) {
                            if (arena.dataTypes[siblings[i]] === arena.dataTypes[targetWrapper]) {
                                siblingWrapper = siblings[i];
                                for (const child of arena.tokens(siblingWrapper)) {
                                    if (arena.dataTypes[child] === EnumToken.IfElseConditionTokenType) {
                                        const leftSide = conditionLeft(arena, arena.field(child, TokenField.L));
                                        if (left != null && leftSide != null && eqToken(arena, left, leftSide)) {
                                            arena.replaceToken(mapped(siblings[i]), ...conditionValue(arena, arena.field(child, TokenField.R), nodeMap));
                                            cache.add(arena.field(child, TokenField.L));
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
        clonedDeclaration = cloneDeclaration(arena, declaration, nodeMap);
        arena.replaceToken(mapped(targetWrapper), mapped(arena.field(node, TokenField.L)));
        result.push(clonedDeclaration);
    }
    else if (arena.dataTypes[node] === EnumToken.IfConditionTokenType) {
        const left = conditionLeft(arena, node);
        if (left == null) {
            return result;
        }
        const leftType = arena.dataTypes[left];
        if (leftType === EnumToken.IdenTokenType && equalsIgnoreCase("else", arena.strings[arena.stringValue[left]])) {
            clonedDeclaration = cloneDeclaration(arena, declaration, nodeMap);
            arena.replaceToken(mapped(targetWrapper == declaration ? node : targetWrapper), ...conditionValue(arena, node, nodeMap));
            result.push(clonedDeclaration);
        }
        else if (leftType === EnumToken.WhenElseFunctionTokenType) {
            const name = arena.strings[arena.stringValue[left]];
            const minify = name !== "supports";
            const atRule = createAtRule(arena, declaration, parent, name, [
                arena.createList(EnumToken.ParensTokenType, arena.tokens(left).map((t) => arena.clone(t, true))),
            ], {
                minify,
                convertColor: minify,
            });
            clonedDeclaration = cloneDeclaration(arena, declaration, nodeMap);
            arena.replaceToken(mapped(node), ...conditionValue(arena, node, nodeMap));
            // inlined: arena.appendChildren(atRule, clonedDeclaration)
            arena.appendChildList(atRule, [clonedDeclaration]);
            result.push(atRule);
            processNode(arena, clonedDeclaration, cache, parent);
        }
        else if (leftType === EnumToken.ContainerFunctionTokenType) {
            const atRule = createAtRule(arena, declaration, parent, "container", [arena.clone(left, true)]);
            clonedDeclaration = cloneDeclaration(arena, declaration, nodeMap);
            const isWildCard = targetWrapper != declaration && arena.dataTypes[targetWrapper] === EnumToken.WildCardFunctionTokenType;
            arena.replaceToken(mapped(isWildCard ? targetWrapper : node), ...conditionValue(arena, node, nodeMap));
            // inlined: arena.appendChildren(atRule, clonedDeclaration)
            arena.appendChildList(atRule, [clonedDeclaration]);
            result.push(atRule);
            processNode(arena, clonedDeclaration, cache, parent);
        }
    }
    return result;
}
/**
 * expand if() conditions into declarations / at-rules
 * @param arena
 * @param declarationNode
 * @param cache
 * @param parent parent of the declaration when the declaration is detached
 */
function processNode(arena, declarationNode, cache, parent = 0) {
    let i;
    let k = -1;
    let astNode;
    const result = [];
    const stack = [declarationNode];
    // the generated nodes are detached: remember the parent for the location of the generated at-rules
    if (arena.parents[declarationNode] != 0) {
        parent = arena.parents[declarationNode];
    }
    while (++k < stack.length) {
        astNode = stack[k];
        const found = arena.findByValue(astNode, isIfToken);
        if (found == null) {
            result.push(astNode);
            continue;
        }
        const declaration = found.node;
        const value = found.value;
        // the parent of a detached token is the declaration
        const parentWrapper = arena.getValueParent(value) || declaration;
        const grandParent = parentWrapper == declaration ? declaration : arena.getValueParent(parentWrapper) || declaration;
        if (arena.dataTypes[value] === EnumToken.WildCardFunctionTokenType) {
            const conditions = arena.tokens(value);
            for (i = 0; i < conditions.length; i++) {
                stack.push(...substituteIfElseNode(arena, declaration, conditions[i], value, parentWrapper, cache, parent));
            }
        }
        else {
            stack.push(...substituteIfElseNode(arena, declaration, value, parentWrapper, grandParent, cache, parent));
        }
        // the node is substituted: release it unless it is the node being replaced
        if (astNode != declarationNode) {
            arena.detach(astNode);
        }
    }
    if (result.length > 0 && arena.parents[declarationNode] != 0) {
        arena.replaceChild(declarationNode, ...result);
        if (!result.includes(declarationNode)) {
            arena.detach(declarationNode);
        }
    }
    // else remove node?
    return result;
}
class ExpandIfFeature {
    accept = new Set([EnumToken.DeclarationNodeType]);
    get ordering() {
        return 1;
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
    run(arena, declaration) {
        return processNode(arena, declaration, new Set());
    }
}

export { ExpandIfFeature };
