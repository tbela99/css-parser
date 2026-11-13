import type {
    AstAtRule,
    AstDeclaration,
    AstNode,
    ParserOptions,
    RenderOptions,
    Token,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../types.ts";
import { renderValue } from "../../printer/render.ts";
import { FeatureWalkMode } from "./type.ts";
import { equalsIgnoreCase } from "../../parser/utils/text.ts";
import { trimArray } from "../../validation/match.ts";
import { eqToken } from "../../parser/utils/eq.ts";
import { type AstArena, TokenField } from "../arena.ts";

/**
 * true if the token is an if() function or an if condition
 * @param arena
 * @param value
 */
function isIfToken(arena: AstArena, value: Token): boolean {
    return (
        arena.dataTypes[value] === EnumToken.IfConditionTokenType ||
        (arena.dataTypes[value] === EnumToken.WildCardFunctionTokenType &&
            equalsIgnoreCase("if", arena.strings[arena.stringValue[value]]))
    );
}

/**
 * deep clone a declaration. the clone map is filled with the cloned value tokens
 * @param arena
 * @param declaration
 * @param nodeMap
 */
function cloneDeclaration(arena: AstArena, declaration: AstDeclaration, nodeMap: Map<Token, Token>): AstDeclaration {
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
function createAtRule(
    arena: AstArena,
    declaration: AstDeclaration,
    parent: AstNode,
    nam: string,
    tokens: Token[],
    options: RenderOptions = {},
): AstAtRule {
    const atRule: AstAtRule = arena.createAtRule(
        EnumToken.AtRuleNodeType,
        nam,
        tokens.reduce((acc: string, curr: Token) => acc + renderValue(arena, curr, options), ""),
        true,
        tokens,
        null,
        null,
    );

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
function conditionLeft(arena: AstArena, condition: Token): Token | null {
    return (
        arena
            .fieldTokens(condition, TokenField.L)
            .find(
                (t: Token) =>
                    arena.dataTypes[t] != EnumToken.CommentTokenType &&
                    arena.dataTypes[t] != EnumToken.WhitespaceTokenType,
            ) ?? null
    );
}

/**
 * value tokens of an if condition (right side). the trailing semicolon is removed
 * @param arena
 * @param condition
 * @param nodeMap map of the tokens to their clones
 */
function conditionValue(arena: AstArena, condition: Token, nodeMap: Map<Token, Token>): Token[] {
    let tokens: Token[] = arena.fieldTokens(condition, TokenField.R);

    if (tokens.length > 0 && arena.dataTypes[tokens[tokens.length - 1]] === EnumToken.SemiColonTokenType) {
        tokens = trimArray(arena, tokens.slice(0, -1));
    }

    return tokens.map((t: Token): Token => nodeMap.get(t) as Token);
}

function substituteIfElseNode(
    arena: AstArena,
    declaration: AstDeclaration,
    node: Token,
    wrapper: Token,
    parentWrapper: AstNode | Token,
    cache: Set<Token>,
    parent: AstNode,
): AstNode[] {
    const result: AstNode[] = [] as AstNode[];
    const nodeMap: Map<Token, Token> = new Map();
    let clonedDeclaration: AstDeclaration;

    let targetParentWrapper: AstNode | Token = parentWrapper;
    let targetWrapper: AstNode | Token = wrapper;

    // map a token or the declaration itself to its clone
    const mapped = (target: AstNode | Token): AstNode | Token =>
        target == declaration ? clonedDeclaration : (nodeMap.get(target) as Token);

    if (arena.dataTypes[node] === EnumToken.IfElseConditionTokenType) {
        //
        clonedDeclaration = cloneDeclaration(arena, declaration, nodeMap);

        const elseCondition: Token = arena.field(node, TokenField.R);

        // replace else: ... with the actual value
        if (arena.dataTypes[elseCondition] === EnumToken.IfConditionTokenType) {
            const target: Token | null = conditionLeft(arena, elseCondition);

            //
            if (
                target != null &&
                arena.dataTypes[target] === EnumToken.IdenTokenType &&
                equalsIgnoreCase("else", arena.strings[arena.stringValue[target]])
            ) {
                arena.replaceToken(mapped(targetWrapper) as Token, ...conditionValue(arena, elseCondition, nodeMap));

                if (targetParentWrapper != declaration) {
                    const siblings: Token[] = arena.tokens(targetParentWrapper);
                    let index: number = siblings.indexOf(targetWrapper);

                    if (index != -1) {
                        let i: number;
                        let siblingWrapper: Token;
                        let left: Token | null = conditionLeft(arena, arena.field(node, TokenField.L));

                        for (i = index + 1; i < siblings.length; i++) {
                            if (arena.dataTypes[siblings[i]] === arena.dataTypes[targetWrapper]) {
                                siblingWrapper = siblings[i];

                                for (const child of arena.tokens(siblingWrapper)) {
                                    if (arena.dataTypes[child] === EnumToken.IfElseConditionTokenType) {
                                        const leftSide: Token | null = conditionLeft(
                                            arena,
                                            arena.field(child, TokenField.L),
                                        );

                                        if (left != null && leftSide != null && eqToken(arena, left, leftSide)) {
                                            arena.replaceToken(
                                                mapped(siblings[i]) as Token,
                                                ...conditionValue(arena, arena.field(child, TokenField.R), nodeMap),
                                            );

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

        arena.replaceToken(mapped(targetWrapper) as Token, mapped(arena.field(node, TokenField.L)) as Token);
        result.push(clonedDeclaration);
    } else if (arena.dataTypes[node] === EnumToken.IfConditionTokenType) {
        const left: Token | null = conditionLeft(arena, node);

        if (left == null) {
            return result;
        }

        const leftType: EnumToken = arena.dataTypes[left];

        if (leftType === EnumToken.IdenTokenType && equalsIgnoreCase("else", arena.strings[arena.stringValue[left]])) {
            clonedDeclaration = cloneDeclaration(arena, declaration, nodeMap);

            arena.replaceToken(
                mapped(targetWrapper == declaration ? node : targetWrapper) as Token,
                ...conditionValue(arena, node, nodeMap),
            );

            result.push(clonedDeclaration);
        } else if (leftType === EnumToken.WhenElseFunctionTokenType) {
            const name: string = arena.strings[arena.stringValue[left]];
            const minify: boolean = name !== "supports";
            const atRule: AstAtRule = createAtRule(
                arena,
                declaration,
                parent,
                name,
                [
                    arena.createList(
                        EnumToken.ParensTokenType,
                        arena.tokens(left).map((t: Token): Token => arena.clone(t, true)),
                    ),
                ],
                {
                    minify,
                    convertColor: minify,
                },
            );

            clonedDeclaration = cloneDeclaration(arena, declaration, nodeMap);

            arena.replaceToken(mapped(node) as Token, ...conditionValue(arena, node, nodeMap));

            // inlined: arena.appendChildren(atRule, clonedDeclaration)
            arena.appendChildList(atRule, [clonedDeclaration]);
            result.push(atRule);

            processNode(arena, clonedDeclaration, cache, parent);
        } else if (leftType === EnumToken.ContainerFunctionTokenType) {
            const atRule: AstAtRule = createAtRule(arena, declaration, parent, "container", [arena.clone(left, true)]);

            clonedDeclaration = cloneDeclaration(arena, declaration, nodeMap);

            const isWildCard: boolean =
                targetWrapper != declaration && arena.dataTypes[targetWrapper] === EnumToken.WildCardFunctionTokenType;

            arena.replaceToken(
                mapped(isWildCard ? targetWrapper : node) as Token,
                ...conditionValue(arena, node, nodeMap),
            );

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
function processNode(
    arena: AstArena,
    declarationNode: AstDeclaration,
    cache: Set<Token>,
    parent: AstNode = 0,
): AstNode[] {
    let i: number;
    let k: number = -1;

    let astNode: AstNode;
    const result: AstNode[] = [];
    const stack: AstNode[] = [declarationNode];

    // the generated nodes are detached: remember the parent for the location of the generated at-rules
    if (arena.parents[declarationNode] != 0) {
        parent = arena.parents[declarationNode];
    }

    while (++k < stack.length) {
        astNode = stack[k];
        const found: { node: AstNode; value: Token } | null = arena.findByValue(astNode, isIfToken);

        if (found == null) {
            result.push(astNode);
            continue;
        }

        const declaration: AstNode = found.node;
        const value: Token = found.value;
        // the parent of a detached token is the declaration
        const parentWrapper: AstNode | Token = arena.getValueParent(value) || declaration;
        const grandParent: AstNode | Token =
            parentWrapper == declaration ? declaration : arena.getValueParent(parentWrapper) || declaration;

        if (arena.dataTypes[value] === EnumToken.WildCardFunctionTokenType) {
            const conditions: Token[] = arena.tokens(value);

            for (i = 0; i < conditions.length; i++) {
                stack.push(
                    ...substituteIfElseNode(arena, declaration, conditions[i], value, parentWrapper, cache, parent),
                );
            }
        } else {
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

export class ExpandIfFeature {
    public accept: Set<EnumToken> = new Set([EnumToken.DeclarationNodeType]);

    get ordering(): number {
        return 1;
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

    /**
     *
     * @param arena
     * @param declaration
     */
    run(arena: AstArena, declaration: AstDeclaration): AstNode | AstNode[] | null {
        return processNode(arena, declaration, new Set<Token>()) as AstNode[];
    }
}
