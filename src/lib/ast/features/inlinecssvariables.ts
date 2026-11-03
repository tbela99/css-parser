import type {
    AstAtRule,
    AstDeclaration,
    AstNode,
    AstRule,
    AstStyleSheet,
    ParserOptions,
    Token,
    VariableScopeInfo,
} from "../../../@types/index.d.ts";
import { EnumAstNodeStatus, EnumToken } from "../types.ts";
import { walkValues } from "../walk.ts";
import { renderValue } from "../../printer/render.ts";
import { splitRule } from "../minify.ts";
import { FeatureWalkMode } from "./type.ts";
import { mathFuncs } from "../../syntax/constants.ts";
import { type AstArena, TokenField } from "../arena.ts";

/**
 * inline a binary expression into a parens token: (l op r)
 * @param arena
 * @param token
 */
function inlineExpression(arena: AstArena, token: Token): Token[] {
    const result: Token[] = [];

    if (arena.dataTypes[token] == EnumToken.BinaryExpressionTokenType) {
        const chi: Token[] = inlineExpression(arena, arena.field(token, TokenField.L));

        chi.push(arena.createToken(arena.numericValue[token] as EnumToken));

        for (const child of inlineExpression(arena, arena.field(token, TokenField.R))) {
            chi.push(child);
        }

        result.push(arena.createList(EnumToken.ParensTokenType, chi));
    } else {
        result.push(token);
    }

    return result;
}

function replace(arena: AstArena, node: AstDeclaration, variableScope: Map<string, VariableScopeInfo>) {
    for (const { value, parent: parentValue } of walkValues(arena, arena.tokens(node), node)) {
        if (
            arena.dataTypes[value] == EnumToken.BinaryExpressionTokenType &&
            parentValue != null &&
            parentValue != node &&
            // the token belongs to the parent token list (function arguments)
            arena.parents[value] == parentValue
        ) {
            arena.replaceToken(value, ...inlineExpression(arena, value));
        }
    }

    for (const { value } of walkValues(arena, arena.tokens(node), node)) {
        const typ: EnumToken = arena.dataTypes[value];

        if (
            typ == EnumToken.MathFunctionTokenType ||
            (typ == EnumToken.WildCardFunctionTokenType && arena.strings[arena.stringValue[value]] == "var")
        ) {
            const first: Token = arena.firstToken[value];

            if (first != 0 && arena.nextSibling[first] == 0 && arena.dataTypes[first] == EnumToken.DashedIdenTokenType) {
                const info: VariableScopeInfo = <VariableScopeInfo>(
                    variableScope.get(arena.strings[arena.stringValue[first]])
                );

                // the variable declaration may have been released
                if (info?.replaceable && arena.name[info.node] != 0 && arena.parents[value] != 0) {
                    arena.replaceToken(value, ...arena.tokens(info.node).map((t: Token): Token => arena.clone(t, true)));
                }
            }
        }
    }
}

export class InlineCssVariablesFeature {
    public accept: Set<EnumToken> = new Set([EnumToken.RuleNodeType, EnumToken.AtRuleNodeType]);

    get ordering() {
        return 2;
    }

    get processMode(): FeatureWalkMode {
        return FeatureWalkMode.Post;
    }

    static register(options: ParserOptions): void {
        if (options.inlineCssVariables) {
            // @ts-ignore
            options.features.push(new InlineCssVariablesFeature());
        }
    }

    run(
        arena: AstArena,
        ast: AstRule | AstAtRule,
        _options: ParserOptions = {},
        parent: AstRule | AstAtRule | AstStyleSheet,
        context: {
            [key: string]: any;
        },
    ): AstNode | null {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren)) {
            return null;
        }

        if (!("variableScope" in context)) {
            context.variableScope = <Map<string, VariableScopeInfo>>new Map();
        }

        // [':root', 'html']
        const isRoot: boolean =
            arena.dataTypes[parent] == EnumToken.StyleSheetNodeType &&
            arena.dataTypes[ast] == EnumToken.RuleNodeType &&
            (arena.raw[ast] ?? splitRule(arena.strings[arena.name[ast]])).some((segment) =>
                segment.some((s) => s == ":root" || s == "html"),
            );
        const variableScope = context.variableScope;

        for (let node = arena.firstChild[ast]; node != 0; node = arena.nextSibling[node]) {
            if (arena.dataTypes[node] !== EnumToken.DeclarationNodeType) {
                continue;
            }

            const name: string = arena.strings[arena.name[node]];

            // css variable
            if (name.startsWith("--")) {
                // the last declaration wins
                const info = {
                    globalScope: isRoot,
                    // @ts-ignore
                    parent: <Set<AstRule | AstAtRule>>new Set(),
                    declarationCount: 1,
                    replaceable: isRoot,
                    node: <AstDeclaration>node,
                    values: arena.tokens(node).map((t: Token): Token => arena.clone(t, true)),
                };

                info.parent.add(ast);

                variableScope.set(name, info);

                let recursive: boolean = false;

                for (const { value } of walkValues(arena, arena.tokens(node), node)) {
                    if (
                        arena.dataTypes[value] == EnumToken.MathFunctionTokenDefType ||
                        (arena.dataTypes[value] == EnumToken.WildCardFunctionTokenType &&
                            (mathFuncs.includes(arena.strings[arena.stringValue[value]]) ||
                                arena.strings[arena.stringValue[value]] === "var"))
                    ) {
                        recursive = true;
                        break;
                    }
                }

                if (recursive) {
                    replace(arena, node, variableScope);
                }
            } else {
                replace(arena, node, variableScope);
            }
        }

        return null;
    }

    cleanup(arena: AstArena, _ast: AstStyleSheet, _options: ParserOptions = {}, context: { [key: string]: any }) {
        const variableScope = <Map<string, VariableScopeInfo>>context.variableScope;

        if (variableScope == null) {
            return;
        }

        for (const info of variableScope.values()) {
            if (info.replaceable) {
                // drop declarations from :root{}
                for (const parent of info.parent) {
                    if (arena.parents[info.node] == parent) {
                        const comment: AstNode = arena.createComment(
                            EnumToken.CommentTokenType,
                            `/* ${arena.strings[arena.name[info.node]]}: ${info.values.reduce((acc: string, curr: Token): string => acc + renderValue(arena, curr, { convertColor: false }), "")} */`,
                        );

                        arena.replaceChild(info.node, comment);
                        arena.release(info.node);
                    }
                }
            }
        }
    }
}
