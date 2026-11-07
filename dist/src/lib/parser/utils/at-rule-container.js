/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { TokenField } from '../../ast/arena.js';
import { EnumToken } from '../../ast/types.js';
import { tokensfuncDefMap, mFGT, mFLT } from '../../syntax/constants.js';
import { matchAllSyntaxes, createValidationContext, trimArray } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { getSyntaxRule } from '../../validation/config.js';
import { equalsIgnoreCase } from './text.js';

function parseAtRuleContainerQueryList(arena, stream, context, options = {}) {
    let matchCount = 0;
    const errors = [];
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + arena.strings[arena.name[context]]);
    const syntax = syntaxRules?.getPreludeRules()?.slice?.(1);
    const parts = [[]];
    for (const token of stream) {
        const type = arena.dataTypes[token];
        if (type === EnumToken.CommaTokenType && matchCount === 0) {
            parts.push([]);
            continue;
        }
        parts[parts.length - 1].push(token);
        if (type === EnumToken.StartParensTokenType || tokensfuncDefMap.has(type)) {
            matchCount++;
        }
        else if (type === EnumToken.EndParensTokenType && matchCount > 0) {
            matchCount--;
        }
    }
    const result = matchAllSyntaxes(arena, syntax, createValidationContext(arena, stream), options);
    if (!result.success) {
        for (const error of result.errors) {
            errors.push(error);
        }
        return {
            success: false,
            errors,
        };
    }
    {
        for (const stream of parts) {
            let success = true;
            let i;
            let currentScope = new Set();
            const scopes = [currentScope];
            const stack = [];
            const tokens = [];
            let expectAndOr = false;
            i = 0;
            while (i < stream.length &&
                (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType)) {
                tokens.push(stream[i++]);
            }
            if (arena.dataTypes[stream[i]] === EnumToken.IdenTokenType) {
                tokens.push(stream[i++]);
            }
            while (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType) {
                tokens.push(stream[i++]);
            }
            if (i < stream.length &&
                arena.dataTypes[stream[i]] !== EnumToken.StartParensTokenType &&
                arena.dataTypes[stream[i]] !== EnumToken.ContainerFunctionTokenDefType) {
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            node: stream[i],
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                            location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                            message: `expecting <container-condition>`,
                        },
                    ],
                };
            }
            for (; i < stream.length; i++) {
                tokens.push(stream[i]);
                if (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType) {
                    continue;
                }
                if (expectAndOr) {
                    let valid = true;
                    // if (arena.dataTypes[stream[i]] === EnumToken.IdenTokenType) {
                    //     const val: string = arena.strings[arena.stringValue[stream[i]]].toLowerCase();
                    //     valid = val === "and" || val === "or";
                    // } else {
                    valid = arena.dataTypes[stream[i]] !== EnumToken.CommaTokenType;
                    // }
                    if (!valid) {
                        success = false;
                        errors.push({
                            action: "drop",
                            node: stream[i],
                            message: `expecting <and>, <or> or comma`,
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                            location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                        });
                        break;
                    }
                }
                if (arena.dataTypes[stream[i]] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[stream[i]])) {
                    scopes.push((currentScope = new Set()));
                    stack.push(stream[i]);
                    continue;
                }
                switch (arena.dataTypes[stream[i]]) {
                    case EnumToken.ColonTokenType:
                    case EnumToken.LtTokenType:
                    case EnumToken.LteTokenType:
                    case EnumToken.GtTokenType:
                    case EnumToken.GteTokenType:
                    case EnumToken.DelimTokenType:
                        stack.push(stream[i]);
                        break;
                    case EnumToken.IdenTokenType:
                        {
                            const val = arena.strings[arena.stringValue[stream[i]]].toLowerCase();
                            if (val === "not") {
                                arena.dataTypes[stream[i]] = EnumToken.NotTokenType;
                                stack.push(stream[i]);
                            }
                            else if (val === "and" || val === "or") {
                                arena.dataTypes[stream[i]] = val === "and" ? EnumToken.AndTokenType : EnumToken.OrTokenType;
                                if (val === "or" && scopes.length <= 1) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                                        location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                                        message: `<or> is not allowed outside of parentheses`,
                                    });
                                    break;
                                }
                                currentScope.add(arena.dataTypes[stream[i]]);
                                stack.push(stream[i]);
                            }
                        }
                        break;
                    case EnumToken.EndParensTokenType:
                        if (stack.length > 0 &&
                            (mFGT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                mFLT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                arena.dataTypes[stack[stack.length - 1]] === EnumToken.DelimTokenType ||
                                arena.dataTypes[stack[stack.length - 1]] === EnumToken.ColonTokenType)) {
                            const index2 = tokens.indexOf(stack[stack.length - 1]);
                            const index3 = tokens.indexOf(stack[stack.length - 2]);
                            let names = trimArray(arena, tokens.slice(index3 + 1, index2));
                            let values = trimArray(arena, tokens.slice(index2 + 1, tokens.length - 1));
                            const op = stack.pop();
                            const token = arena.createToken(EnumToken.MediaQueryConditionTokenType);
                            // inlined: arena.setField(token, TokenField.L, ...names)
                            arena.setTokenList(arena.fieldList(token, TokenField.L), names);
                            // inlined: arena.setField(token, TokenField.Op, op)
                            arena.setTokenList(arena.fieldList(token, TokenField.Op), [op]);
                            // inlined: arena.setField(token, TokenField.R, ...values)
                            arena.setTokenList(arena.fieldList(token, TokenField.R), values);
                            if (names.length > 0 && values.length > 0) {
                                arena.spanLocation(token, names[0], values[values.length - 1]);
                            }
                            tokens.splice(index3 + 1, tokens.length - index3 - 2, token);
                            if (arena.dataTypes[op] === EnumToken.ColonTokenType) {
                                const name = names.find((t) => arena.dataTypes[t] === EnumToken.IdenTokenType);
                                if (name != null) {
                                    const val = arena.strings[arena.stringValue[name]];
                                    if (val.startsWith("min-")) {
                                        // inlined: arena.setStr(name, val.substring(4))
                                        arena.stringValue[name] = arena.internString(val.substring(4));
                                        arena.dataTypes[op] = EnumToken.GteTokenType;
                                    }
                                    else if (val.startsWith("max-")) {
                                        // inlined: arena.setStr(name, val.substring(4))
                                        arena.stringValue[name] = arena.internString(val.substring(4));
                                        arena.dataTypes[op] = EnumToken.LteTokenType;
                                    }
                                }
                            }
                            // check <style()> or <scroll-state()>
                        }
                        if (stack.length > 0 && tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]])) {
                            const index = tokens.indexOf(stack[stack.length - 1]);
                            arena.dataTypes[tokens[index]] = tokensfuncDefMap.get(arena.dataTypes[tokens[index]]);
                            arena.setTokenList(tokens[index], trimArray(arena, tokens.slice(index + 1, tokens.length - 1)));
                            arena.spanLocation(tokens[index], tokens[index], stream[i]);
                            if (arena.tokens(tokens[index]).every((t) => arena.dataTypes[t] === EnumToken.WhitespaceTokenType || arena.dataTypes[t] === EnumToken.CommentTokenType)) {
                                success = false;
                                errors.push({
                                    action: "drop",
                                    node: stream[i],
                                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                                    location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                                    message: `expecting '<${arena.strings[arena.stringValue[tokens[index]]]}-query>'`,
                                });
                                break;
                            }
                            tokens.length = index + 1;
                            stack.pop();
                            scopes.pop();
                            currentScope = scopes.at(-1);
                        }
                        else {
                            const index = tokens.indexOf(stack[stack.length - 1]);
                            arena.dataTypes[tokens[index]] = EnumToken.ParensTokenType;
                            arena.setTokenList(tokens[index], tokens.slice(index + 1, tokens.length - 1));
                            arena.spanLocation(tokens[index], tokens[index], stream[i]);
                            if (arena.tokens(tokens[index]).every((t) => arena.dataTypes[t] === EnumToken.WhitespaceTokenType || arena.dataTypes[t] === EnumToken.CommentTokenType)) {
                                success = false;
                                errors.push({
                                    action: "drop",
                                    node: stream[i],
                                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                                    location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                                    message: `expecting '<query-in-parens>'`,
                                });
                                break;
                            }
                            tokens.length = index + 1;
                            scopes.pop();
                            currentScope = scopes.at(-1);
                            stack.pop();
                        }
                        // inlined: arena.typeOf(stack.at(-1))
                        if (arena.dataTypes[stack.at(-1)] === EnumToken.NotTokenType) {
                            let j = tokens.indexOf(stack.at(-1));
                            let k = j;
                            while (j-- &&
                                (arena.dataTypes[tokens[j]] === EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[tokens[j]] === EnumToken.CommentTokenType)) { }
                            if (j >= 0) {
                                if (arena.dataTypes[tokens[j]] !== EnumToken.StartParensTokenType) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: tokens[k],
                                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[k]))
                                        location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(tokens[k]))],
                                        message: `unexpected token 'not'`,
                                    });
                                    break;
                                }
                            }
                        }
                        if (
                        // inlined: arena.typeOf(stack.at(-1))
                        arena.dataTypes[stack.at(-1)] === EnumToken.AndTokenType ||
                            // inlined: arena.typeOf(stack.at(-1))
                            arena.dataTypes[stack.at(-1)] === EnumToken.OrTokenType) {
                            const index = tokens.indexOf(stack.at(-1));
                            let l = index - 1;
                            while (l > 0 &&
                                (arena.dataTypes[tokens[l]] === EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[tokens[l]] === EnumToken.CommentTokenType)) {
                                l--;
                            }
                            const left = trimArray(arena, tokens.slice(l, index));
                            const right = trimArray(arena, tokens.slice(index + 1));
                            const op = stack.pop();
                            const condition = arena.createToken(EnumToken.MediaQueryConditionTokenType);
                            // inlined: arena.setField(condition, TokenField.Op, op)
                            arena.setTokenList(arena.fieldList(condition, TokenField.Op), [op]);
                            // inlined: arena.setField(condition, TokenField.L, ...left)
                            arena.setTokenList(arena.fieldList(condition, TokenField.L), left);
                            // inlined: arena.setField(condition, TokenField.R, ...right)
                            arena.setTokenList(arena.fieldList(condition, TokenField.R), right);
                            if (left.length > 0 && right.length > 0) {
                                arena.spanLocation(condition, left[0], right[right.length - 1]);
                            }
                            tokens[l] = condition;
                            tokens.length = l + 1;
                            expectAndOr = true;
                            if (arena.dataTypes[op] === EnumToken.AndTokenType) {
                                const notNameOrSpace = (t) => arena.dataTypes[t] != EnumToken.WhitespaceTokenType &&
                                    arena.dataTypes[t] != EnumToken.IdenTokenType;
                                let leftCondition = left.find(notNameOrSpace);
                                let rightCondition = right.find(notNameOrSpace);
                                if (leftCondition != null &&
                                    rightCondition != null &&
                                    arena.dataTypes[leftCondition] == EnumToken.ParensTokenType &&
                                    arena.dataTypes[rightCondition] == EnumToken.ParensTokenType) {
                                    leftCondition = arena.tokens(leftCondition).find(notNameOrSpace);
                                    rightCondition = arena.tokens(rightCondition).find(notNameOrSpace);
                                    if (leftCondition != null &&
                                        rightCondition != null &&
                                        arena.dataTypes[leftCondition] == EnumToken.MediaQueryConditionTokenType &&
                                        arena.dataTypes[rightCondition] == EnumToken.MediaQueryConditionTokenType) {
                                        const leftOp = arena.field(leftCondition, TokenField.Op);
                                        const rightOp = arena.field(rightCondition, TokenField.Op);
                                        if ((mFLT.has(arena.dataTypes[leftOp]) || mFGT.has(arena.dataTypes[leftOp])) &&
                                            (mFLT.has(arena.dataTypes[rightOp]) || mFGT.has(arena.dataTypes[rightOp]))) {
                                            const name = arena
                                                .fieldTokens(leftCondition, TokenField.L)
                                                .find((t) => arena.dataTypes[t] == EnumToken.IdenTokenType);
                                            const name2 = arena
                                                .fieldTokens(rightCondition, TokenField.L)
                                                .find((t) => arena.dataTypes[t] == EnumToken.IdenTokenType);
                                            if (name != null &&
                                                name2 != null &&
                                                equalsIgnoreCase(arena.strings[arena.stringValue[name]], arena.strings[arena.stringValue[name2]])) {
                                                switch (arena.dataTypes[leftOp]) {
                                                    case EnumToken.LtTokenType:
                                                        arena.dataTypes[leftOp] = EnumToken.GtTokenType;
                                                        break;
                                                    case EnumToken.LteTokenType:
                                                        arena.dataTypes[leftOp] = EnumToken.GteTokenType;
                                                        break;
                                                    case EnumToken.GtTokenType:
                                                        arena.dataTypes[leftOp] = EnumToken.LtTokenType;
                                                        break;
                                                    case EnumToken.GteTokenType:
                                                        arena.dataTypes[leftOp] = EnumToken.LteTokenType;
                                                        break;
                                                }
                                                const rangeQuery = arena.createToken(EnumToken.MediaRangeQueryTokenType);
                                                // inlined: arena.setField(rangeQuery, TokenField.L, ...arena.fieldTokens(leftCondition, TokenField.R))
                                                arena.setTokenList(arena.fieldList(rangeQuery, TokenField.L), arena.fieldTokens(leftCondition, TokenField.R));
                                                // inlined: arena.setField(rangeQuery, TokenField.Val, name)
                                                arena.setTokenList(arena.fieldList(rangeQuery, TokenField.Val), [name]);
                                                // inlined: arena.setField(rangeQuery, TokenField.Op, leftOp)
                                                arena.setTokenList(arena.fieldList(rangeQuery, TokenField.Op), [leftOp]);
                                                // inlined: arena.setField(rangeQuery, TokenField.Op2, rightOp)
                                                arena.setTokenList(arena.fieldList(rangeQuery, TokenField.Op2), [rightOp]);
                                                // inlined: arena.setField(rangeQuery, TokenField.R, ...arena.fieldTokens(rightCondition, TokenField.R))
                                                arena.setTokenList(arena.fieldList(rangeQuery, TokenField.R), arena.fieldTokens(rightCondition, TokenField.R));
                                                arena.spanLocation(rangeQuery, leftCondition, rightCondition);
                                                const parens = arena.createToken(EnumToken.ParensTokenType);
                                                // inlined: arena.setTokens(parens, rangeQuery)
                                                arena.setTokenList(parens, [rangeQuery]);
                                                arena.copyLocation(parens, rangeQuery);
                                                tokens[l] = parens;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        break;
                }
                if (!success) {
                    break;
                }
            }
            if (!success) {
                return {
                    success,
                    errors,
                };
            }
            stream.length = 0;
            for (const token of trimArray(arena, tokens)) {
                stream.push(token);
            }
        }
    }
    stream.length = 0;
    for (const part of parts) {
        if (part.length == 0) {
            continue;
        }
        for (const token of part) {
            stream.push(token);
        }
    }
    return {
        success: true,
        errors,
    };
}

export { parseAtRuleContainerQueryList };
