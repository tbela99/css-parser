/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { TokenField } from '../../ast/arena.js';
import { EnumToken } from '../../ast/types.js';
import { trimArray } from '../../validation/match.js';
import { tokensfuncDefMap } from '../../syntax/constants.js';
import { parseMediaqueryList } from './at-rule-media.js';
import { parseAtRuleSupportSyntax } from './at-rule-support.js';

function matchAtRuleWhenElseSyntax(arena, stream, context, options = {}) {
    const tokens = [];
    const stack = [];
    let i = 0;
    let success = true;
    let expectAndOr = false;
    // let scope: Set<EnumToken> = new Set();
    const errors = [];
    // const scopes: Array<Set<EnumToken>> = [scope];
    for (; i < stream.length; i++) {
        tokens.push(stream[i]);
        if (expectAndOr) {
            let k = i;
            while (k < stream.length &&
                (arena.dataTypes[stream[k]] === EnumToken.WhitespaceTokenType ||
                    arena.dataTypes[stream[k]] === EnumToken.CommentTokenType)) {
                tokens.push(stream[k]);
                k++;
            }
            expectAndOr = false;
        }
        switch (arena.dataTypes[stream[i]]) {
            case EnumToken.IdenTokenType:
                {
                    const val = arena.strings[arena.stringValue[stream[i]]].toLowerCase();
                    if ("and" === val || "or" === val) {
                        arena.dataTypes[stream[i]] = "or" === val ? EnumToken.OrTokenType : EnumToken.AndTokenType;
                        // scope.add(arena.dataTypes[stream[i]]);
                        stack.push(stream[i]);
                        // break;
                    }
                }
                break;
            case EnumToken.SupportsFunctionTokenDefType:
            case EnumToken.WhenElseFunctionTokenDefType:
                {
                    let matchCount = 1;
                    let j = i + 1;
                    for (; j < stream.length; j++) {
                        if (arena.dataTypes[stream[j]] === EnumToken.EndParensTokenType) {
                            matchCount--;
                            if (matchCount === 0) {
                                break;
                            }
                        }
                        else if (arena.dataTypes[stream[j]] === EnumToken.StartParensTokenType ||
                            tokensfuncDefMap.has(arena.dataTypes[stream[j]])) {
                            matchCount++;
                        }
                    }
                    const slice = stream.slice(i, j + 1);
                    const funcName = arena.strings[arena.stringValue[stream[i]]].toLowerCase();
                    // the function token may be converted by the sub parsers
                    const isSupportsFunction = arena.dataTypes[stream[i]] === EnumToken.SupportsFunctionTokenDefType;
                    const funcType = tokensfuncDefMap.get(arena.dataTypes[stream[i]]);
                    const parens = arena.createToken(EnumToken.StartParensTokenType);
                    arena.spanLocation(parens, stream[i], stream[j]);
                    const tokenList = [parens].concat(slice.slice(1));
                    if ("media" === funcName) {
                        const result = parseMediaqueryList(arena, tokenList, options);
                        if (!result.success) {
                            return result;
                        }
                    }
                    else if ("supports" === funcName) {
                        const result = parseAtRuleSupportSyntax(arena, tokenList, context, options);
                        if (!result.success) {
                            return result;
                        }
                    }
                    else if (isSupportsFunction) {
                        tokenList.splice(0, tokenList.length, ...slice);
                        const result = parseAtRuleSupportSyntax(arena, stream.slice(i, j + 1), context, options);
                        if (!result.success) {
                            return result;
                        }
                    }
                    arena.spanLocation(stream[i], stream[i], stream[j]);
                    const chi = isSupportsFunction
                        ? arena.firstToken[stream[i]] !== 0
                            ? arena.tokens(stream[i])
                            : trimArray(arena, slice.slice(1, -1))
                        : arena.tokens(tokenList[0]);
                    arena.dataTypes[stream[i]] = funcType;
                    arena.setTokenList(stream[i], chi);
                    if (stack.length > 0 &&
                        (arena.dataTypes[stack[stack.length - 1]] === EnumToken.AndTokenType ||
                            arena.dataTypes[stack[stack.length - 1]] === EnumToken.OrTokenType)) {
                        const op = stack[stack.length - 1];
                        const index = tokens.indexOf(op);
                        const index2 = stack.length > 1 ? tokens.indexOf(stack[stack.length - 2]) + 1 : 0;
                        const condition = arena.createToken(EnumToken.WhenElseQueryConditionTokenType);
                        // inlined: arena.setField(condition, TokenField.L, ...trimArray(arena, tokens.slice(index2, index)))
                        arena.setTokenList(arena.fieldList(condition, TokenField.L), trimArray(arena, tokens.slice(index2, index)));
                        // inlined: arena.setField(condition, TokenField.R, ...trimArray(arena, tokens.slice(index + 1)))
                        arena.setTokenList(arena.fieldList(condition, TokenField.R), trimArray(arena, tokens.slice(index + 1)));
                        // inlined: arena.setField(condition, TokenField.Op, op)
                        arena.setTokenList(arena.fieldList(condition, TokenField.Op), [op]);
                        arena.spanLocation(condition, op, stream[i]);
                        tokens[index2] = condition;
                        tokens.length = index2 + 1;
                        stack.pop();
                    }
                    i = j;
                    expectAndOr = true;
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

export { matchAtRuleWhenElseSyntax };
