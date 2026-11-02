/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { EnumToken } from '../../ast/types.js';
import { pseudoElements, tokensfuncDefMap } from '../../syntax/constants.js';
import { getSyntaxConfig, getParsedSyntax } from '../../validation/config.js';
import { trimArray, matchAllSyntaxes, createValidationContext } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { parseDeclaration } from './declaration.js';
import { TokenField } from '../../ast/arena.js';

function parseAtRuleSupportSyntax(arena, stream, context, options = {}) {
    const tokens = [];
    const stack = [];
    let i = 0;
    let success = true;
    let expectAndOr = false;
    let scope = new Set();
    let val;
    const errors = [];
    const scopes = [scope];
    const trimWhiteSpace = new Set([
        EnumToken.GtTokenType,
        EnumToken.ChildCombinatorTokenType,
        EnumToken.NextSiblingCombinatorTokenType,
        EnumToken.SubsequentSiblingCombinatorTokenType,
        EnumToken.ColumnCombinatorTokenType,
        EnumToken.UniversalSelectorTokenType,
    ]);
    for (; i < stream.length; i++) {
        tokens.push(stream[i]);
        if (arena.dataTypes[stream[i]] == EnumToken.ColonTokenType) {
            if (arena.dataTypes[stream[i + 1]] == EnumToken.IdenTokenType) {
                const val = arena.strings[arena.stringValue[stream[i + 1]]];
                arena.dataTypes[stream[i]] = pseudoElements.includes(val)
                    ? EnumToken.PseudoElementTokenType
                    : EnumToken.PseudoClassTokenType;
                arena.setStr(stream[i], ":" + val);
                arena.setSpanEnd(stream[i], arena.getSpanEnd(stream[i + 1]));
                stream.splice(i + 1, 1);
                continue;
            }
            if (arena.dataTypes[stream[i + 1]] == EnumToken.FunctionTokenDefType) {
                val = ":" + arena.strings[arena.stringValue[stream[i + 1]]];
                arena.dataTypes[stream[i]] =
                    val + "()" in getSyntaxConfig().selectors
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : arena.dataTypes[stream[i + 1]];
                arena.setStr(stream[i], val);
                stack.push(stream[i]);
                arena.setSpanEnd(stream[i], arena.getSpanEnd(stream[i + 1]));
                stream.splice(i + 1, 1);
                continue;
            }
        }
        if (trimWhiteSpace.has(arena.dataTypes[stream[i]])) {
            if (arena.typeOf(tokens.at(-2)) === EnumToken.WhitespaceTokenType) {
                tokens.splice(tokens.length - 2, 1);
            }
            if (arena.dataTypes[stream[i + 1]] === EnumToken.WhitespaceTokenType) {
                i++;
                continue;
            }
        }
        if (expectAndOr) {
            let k = i;
            while (k < stream.length &&
                (arena.dataTypes[stream[k]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[k]] === EnumToken.CommentTokenType)) {
                tokens.push(stream[k]);
                k++;
            }
            expectAndOr = false;
        }
        if (arena.dataTypes[stream[i]] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[stream[i]])) {
            scopes.push((scope = new Set()));
            stack.push(stream[i]);
            continue;
        }
        switch (arena.dataTypes[stream[i]]) {
            case EnumToken.EndParensTokenType:
                {
                    if (arena.dataTypes[stack[stack.length - 1]] === EnumToken.ColonTokenType) {
                        // match declaration
                        const index = tokens.indexOf(stack[stack.length - 2]);
                        const slice = trimArray(arena, tokens.splice(index + 1, tokens.length - index - 2));
                        const declaration = parseDeclaration(arena, slice, context, { ...options, validation: false }, errors);
                        tokens.splice(index + 1, 0, declaration);
                        stack.pop();
                    }
                    // match <support-condition-name>
                    // @supports (--condition-name) {}
                    if (arena.typeOf(stack.at(-1)) === EnumToken.StartParensTokenType) {
                        const parens = stack[stack.length - 1];
                        const index = tokens.indexOf(parens);
                        const slice = trimArray(arena, tokens.splice(index + 1, tokens.length - index - 2));
                        arena.dataTypes[parens] = EnumToken.ParensTokenType;
                        arena.setTokenList(parens, slice);
                        arena.spanLocation(parens, parens, stream[i]);
                        stack.pop();
                        tokens.pop();
                        scopes.pop();
                        scope = scopes[scopes.length - 1];
                        expectAndOr = true;
                    }
                    else if (stack.length > 0 && tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]])) {
                        const func = stack[stack.length - 1];
                        const index = tokens.indexOf(func);
                        arena.dataTypes[func] = tokensfuncDefMap.get(arena.dataTypes[func]);
                        arena.setTokenList(func, trimArray(arena, tokens.splice(index + 1, tokens.length - index - 2)));
                        arena.spanLocation(func, func, stream[i]);
                        if (arena.dataTypes[tokens[index]] === EnumToken.PseudoClassFuncTokenType) {
                            // not a declaration
                            const result = matchAllSyntaxes(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Selectors, arena.strings[arena.stringValue[tokens[index]]] + "()")?.[0]?.chi, createValidationContext(arena, arena.tokens(tokens[index])), options);
                            if (!result.success) {
                                return {
                                    success: false,
                                    errors: result.errors,
                                };
                            }
                            stack.pop();
                            tokens.pop();
                            break;
                        }
                        //
                        let k = stack.length - 1;
                        while (tokensfuncDefMap.has(arena.dataTypes[stack[k]])) {
                            k--;
                        }
                        stack.pop();
                        tokens.pop();
                        scopes.pop();
                        scope = scopes[scopes.length - 1];
                    }
                    if (arena.typeOf(stack.at(-1)) === EnumToken.NotTokenType) {
                        const not = stack[stack.length - 1];
                        const index = tokens.indexOf(not);
                        const unary = arena.createToken(EnumToken.SupportsQueryUnaryConditionTokenType);
                        arena.setField(unary, TokenField.R, ...trimArray(arena, tokens.splice(index + 1, i - index - 1)));
                        arena.setField(unary, TokenField.L, not);
                        arena.spanLocation(unary, not, stream[i]);
                        tokens[index] = unary;
                        stack.pop();
                    }
                    if (arena.typeOf(stack.at(-1)) === EnumToken.AndTokenType || arena.typeOf(stack.at(-1)) === EnumToken.OrTokenType) {
                        const index = tokens.indexOf(stack.at(-1));
                        const index2 = stack.length > 1 ? tokens.indexOf(stack.at(-2)) + 1 : 0;
                        const op = stack[stack.length - 1];
                        const left = trimArray(arena, tokens.slice(index2, index));
                        const condition = arena.createToken(EnumToken.SupportsQueryConditionTokenType);
                        arena.setField(condition, TokenField.L, ...left);
                        arena.setField(condition, TokenField.R, ...trimArray(arena, tokens.slice(index + 1)));
                        arena.setField(condition, TokenField.Op, op);
                        arena.spanLocation(condition, op, stream[i]);
                        tokens[index2] = condition;
                        tokens.length = index2 + 1;
                        stack.pop();
                    }
                }
                break;
            case EnumToken.ColonTokenType:
                stack.push(stream[i]);
                break;
            case EnumToken.IdenTokenType:
                {
                    const val = arena.strings[arena.stringValue[stream[i]]].toLowerCase();
                    if ("not" === val) {
                        stack.push(stream[i]);
                        arena.dataTypes[stream[i]] = EnumToken.NotTokenType;
                        break;
                    }
                    if ("and" === val || "or" === val) {
                        if ("or" === val && scopes.length === 1 && scopes[0].size > 0) {
                            const fileName = options.source.getFileName() ?? "";
                            const [line, column] = options.source.getOffsets(arena.getSpanStart(stream[i]));
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `<or> is not allowed outside of a parenthesis at ${fileName}:${line}:${column}`,
                                        location: [fileName, line, column],
                                    },
                                ],
                            };
                        }
                        arena.dataTypes[stream[i]] = "or" === val ? EnumToken.OrTokenType : EnumToken.AndTokenType;
                        scope.add(arena.dataTypes[stream[i]]);
                        stack.push(stream[i]);
                        break;
                    }
                }
                break;
        }
    }
    stream.length = 0;
    for (const token of trimArray(arena, tokens)) {
        stream.push(token);
    }
    return { success, errors };
}

export { parseAtRuleSupportSyntax };
