/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { EnumToken, EnumAstNodeStatus } from '../types.js';
import { renderValue } from '../../printer/render.js';
import { splitRule } from '../minify.js';
import { FeatureWalkMode } from './type.js';
import { mathFuncs } from '../../syntax/constants.js';
import { TokenField } from '../arena.js';
import { ValueWalker } from '../walk.js';

/**
 * inline a binary expression into a parens token: (l op r)
 * @param arena
 * @param token
 */
function inlineExpression(arena, token) {
    const result = [];
    if (arena.dataTypes[token] === EnumToken.BinaryExpressionTokenType) {
        const chi = inlineExpression(arena, arena.field(token, TokenField.L));
        chi.push(arena.createToken(arena.numericValue[token]));
        for (const child of inlineExpression(arena, arena.field(token, TokenField.R))) {
            chi.push(child);
        }
        result.push(arena.createList(EnumToken.ParensTokenType, chi));
    }
    else {
        result.push(token);
    }
    return result;
}
function replace(arena, node, variableScope) {
    // inlined: arena.walkValues(node)
    for (const value of new ValueWalker(arena, node)) {
        // the parent of a detached token is the declaration
        const parentValue = arena.getValueParent(value) || node;
        if (arena.dataTypes[value] === EnumToken.BinaryExpressionTokenType &&
            parentValue != null &&
            parentValue !== node &&
            // the token belongs to the parent token list (function arguments)
            arena.parents[value] === parentValue) {
            arena.replaceToken(value, ...inlineExpression(arena, value));
        }
    }
    // inlined: arena.walkValues(node)
    for (const value of new ValueWalker(arena, node)) {
        const typ = arena.dataTypes[value];
        if (typ === EnumToken.MathFunctionTokenType ||
            (typ === EnumToken.WildCardFunctionTokenType && arena.strings[arena.stringValue[value]] === "var")) {
            const first = arena.firstToken[value];
            if (first !== 0 &&
                arena.nextSibling[first] === 0 &&
                arena.dataTypes[first] === EnumToken.DashedIdenTokenType) {
                const info = (variableScope.get(arena.strings[arena.stringValue[first]]));
                // the variable declaration may have been released
                if (info?.replaceable && arena.name[info.node] !== 0 && arena.parents[value] !== 0) {
                    arena.replaceToken(value, ...arena.tokens(info.node).map((t) => arena.clone(t, true)));
                }
            }
        }
    }
}
class InlineCssVariablesFeature {
    accept = new Set([EnumToken.RuleNodeType, EnumToken.AtRuleNodeType]);
    get ordering() {
        return 2;
    }
    get processMode() {
        return FeatureWalkMode.Post;
    }
    static register(options) {
        if (options.inlineCssVariables) {
            // @ts-ignore
            options.features.push(new InlineCssVariablesFeature());
        }
    }
    /**
     *
     * @param arena
     * @param ast
     * @param _options
     * @param parent
     * @param context
     */
    run(arena, ast, _options = {}, parent, context) {
        if (!(arena.flags[ast] & EnumAstNodeStatus.HasChildren)) {
            return null;
        }
        if (!("variableScope" in context)) {
            context.variableScope = new Map();
        }
        // [':root', 'html']
        const isRoot = arena.dataTypes[parent] === EnumToken.StyleSheetNodeType &&
            arena.dataTypes[ast] === EnumToken.RuleNodeType &&
            (arena.raw[ast] ?? splitRule(arena.strings[arena.name[ast]])).some((segment) => segment.some((s) => s === ":root" || s === "html"));
        const variableScope = context.variableScope;
        for (let node = arena.firstChild[ast]; node !== 0; node = arena.nextSibling[node]) {
            if (arena.dataTypes[node] !== EnumToken.DeclarationNodeType) {
                continue;
            }
            const name = arena.strings[arena.name[node]];
            // css variable
            if (name.startsWith("--")) {
                // the last declaration wins
                const info = {
                    globalScope: isRoot,
                    // @ts-ignore
                    parent: new Set(),
                    declarationCount: 1,
                    replaceable: isRoot,
                    node: node,
                    values: arena.tokens(node).map((t) => arena.clone(t, true)),
                };
                info.parent.add(ast);
                variableScope.set(name, info);
                let recursive = false;
                // inlined: arena.walkValues(node)
                for (const value of new ValueWalker(arena, node)) {
                    if (arena.dataTypes[value] === EnumToken.MathFunctionTokenDefType ||
                        (arena.dataTypes[value] === EnumToken.WildCardFunctionTokenType &&
                            (mathFuncs.includes(arena.strings[arena.stringValue[value]]) ||
                                arena.strings[arena.stringValue[value]] === "var"))) {
                        recursive = true;
                        break;
                    }
                }
                if (recursive) {
                    replace(arena, node, variableScope);
                }
            }
            else {
                replace(arena, node, variableScope);
            }
        }
        return null;
    }
    /**
     *
     * @param arena
     * @param _ast
     * @param _options
     * @param context
     */
    cleanup(arena, _ast, _options = {}, context) {
        const variableScope = context.variableScope;
        if (variableScope == null) {
            return;
        }
        for (const info of variableScope.values()) {
            if (info.replaceable) {
                // drop declarations from :root{}
                for (const parent of info.parent) {
                    if (arena.parents[info.node] === parent) {
                        const comment = arena.createComment(EnumToken.CommentTokenType, `/* ${arena.strings[arena.name[info.node]]}: ${info.values.reduce((acc, curr) => acc + renderValue(arena, curr, { convertColor: false }), "")} */`);
                        arena.replaceChild(info.node, comment);
                        arena.detach(info.node);
                    }
                }
            }
        }
    }
}

export { InlineCssVariablesFeature };
