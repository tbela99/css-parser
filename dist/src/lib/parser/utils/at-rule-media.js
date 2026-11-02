/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { TokenField } from '../../ast/arena.js';
import { EnumToken } from '../../ast/types.js';
import { evaluate } from '../../ast/math/expression.js';
import { gcd } from '../../ast/math/math.js';
import { tokensfuncDefMap, mediaTypes, mFLT, mFGT } from '../../syntax/constants.js';
import { trimArray, matchAllSyntaxes, createValidationContext, getMFInfo, isMFValue } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum, MediaFeatureType } from '../../validation/parser/typedef.js';
import { getParsedSyntax } from '../../validation/config.js';
import { equalsIgnoreCase } from './text.js';

// https://drafts.csswg.org/mediaqueries/#media-descriptor-table:~:text=It%20is%20invalid%20to%20mix%20and%20and%20or%20and%20not%20at%20the%20same%20%E2%80%9Clevel%E2%80%9D%20of%20a%20media%20query%2E
// 'or' is not allowed at the same level as 'and' and 'not'
// 'or' is not allowed outside of parentheses
// https://drafts.csswg.org/mediaqueries/#error-handling
// error recovery
function parseMediaqueryList(arena, stream, options) {
    let matchCount = 0;
    const errors = [];
    let hasErrors = false;
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
    {
        for (const stream of parts.slice()) {
            let success = true;
            let i;
            let currentScope = new Set();
            const scopes = [currentScope];
            const stack = [];
            const tokens = [];
            let expectAndOrComma = false;
            i = 0;
            while (i < stream.length &&
                (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType)) {
                tokens.push(stream[i]);
                i++;
            }
            // [not | only] <media-type> [ and <media-condition-without-or>  ]?
            if (i < stream.length) {
                if (arena.dataTypes[stream[i]] === EnumToken.IdenTokenType) {
                    const val = arena.strings[arena.stringValue[stream[i]]].toLowerCase();
                    if (mediaTypes.includes(val)) {
                        tokens.push(stream[i]);
                        i++;
                    }
                    else {
                        success = false;
                        errors.push({
                            action: "drop",
                            message: `expecting '<media-type>'`,
                            node: stream[i],
                            location: options.source.getSourceLocation(arena.getSpanStart(stream[i])),
                        });
                    }
                }
                else if (arena.dataTypes[stream[i]] !== EnumToken.StartParensTokenType) {
                    success = false;
                    errors.push({
                        action: "drop",
                        message: `expecting '('`,
                        node: stream[i],
                        location: options.source.getSourceLocation(arena.getSpanStart(stream[i])),
                    });
                }
            }
            for (; i < stream.length; i++) {
                tokens.push(stream[i]);
                if (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType) {
                    continue;
                }
                if (expectAndOrComma) {
                    if (arena.dataTypes[stream[i]] === EnumToken.IdenTokenType) {
                        arena.strings[arena.stringValue[stream[i]]].toLowerCase();
                    }
                    expectAndOrComma = false;
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
                            if (val === "and" || val === "or") {
                                arena.dataTypes[stream[i]] = val === "and" ? EnumToken.AndTokenType : EnumToken.OrTokenType;
                                if (val === "or" &&
                                    scopes.length == 1 &&
                                    scopes[0].size > 0 &&
                                    !scopes[0].has(EnumToken.OrTokenType)) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        message: `<or> is not allowed outside of parentheses`,
                                        location: options.source.getSourceLocation(arena.getSpanStart(stream[i])),
                                    });
                                    break;
                                }
                                if (currentScope.has(val === "or" ? EnumToken.AndTokenType : EnumToken.OrTokenType)) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        message: `cannot mix <and> and <or> at the same level`,
                                        location: options.source.getSourceLocation(arena.getSpanStart(stream[i])),
                                    });
                                }
                                currentScope.add(arena.dataTypes[stream[i]]);
                                stack.push(stream[i]);
                            }
                        }
                        break;
                    case EnumToken.EndParensTokenType:
                        if (stack.length > 0 && tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]])) {
                            const index = tokens.indexOf(stack[stack.length - 1]);
                            arena.spanLocation(tokens[index], tokens[index], stream[i]);
                            arena.dataTypes[tokens[index]] = tokensfuncDefMap.get(arena.dataTypes[tokens[index]]);
                            arena.setTokenList(tokens[index], trimArray(arena, tokens.slice(index + 1, tokens.length - 1)));
                            tokens.length = index + 1;
                            const result = matchAllSyntaxes(arena, getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, arena.strings[arena.stringValue[tokens[index]]] + "()")?.[0]?.chi, createValidationContext(arena, arena.tokens(tokens[index])), options);
                            stack.pop();
                            scopes.pop();
                            currentScope = scopes.at(-1);
                            if (!result.success) {
                                for (const error of result.errors) {
                                    errors.push(error);
                                }
                                success = false;
                            }
                            break;
                        }
                        // feature
                        if (stack.length > 0 &&
                            (mFLT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                mFGT.has(arena.dataTypes[stack[stack.length - 1]]))) {
                            // <mf-lt> | <mf-gt>
                            const index = tokens.indexOf(stack.at(-1));
                            const prevToken = stack[stack.length - 2];
                            if (mFLT.has(arena.dataTypes[prevToken]) || mFGT.has(arena.dataTypes[prevToken])) {
                                // const index: number = tokens.indexOf(stack.at(-1)!);
                                // <mf-lt> | <mf-name>
                                const index2 = tokens.indexOf(prevToken);
                                // '('
                                const index3 = tokens.indexOf(stack.at(-3));
                                const left = trimArray(arena, tokens.slice(index3 + 1, index2));
                                const right = trimArray(arena, tokens.slice(index + 1, tokens.length - 1));
                                const names = trimArray(arena, tokens.slice(index2 + 1, index));
                                const filteredNames = names.filter((n) => arena.dataTypes[n] !== EnumToken.WhitespaceTokenType && arena.dataTypes[n] !== EnumToken.CommentTokenType);
                                const name = arena.strings[arena.stringValue[filteredNames[0]]];
                                const mfInfo = getMFInfo(name);
                                for (const val of [left, right]) {
                                    if (options.computeCalcExpression) {
                                        if (mfInfo == null ||
                                            (mfInfo.type != MediaFeatureType.KeywordType &&
                                                mfInfo.type != MediaFeatureType.StringType)) {
                                            for (let l = 0; l < val.length; l++) {
                                                if (arena.dataTypes[val[l]] === EnumToken.MathFunctionTokenType &&
                                                    arena.strings[arena.stringValue[val[l]]] === "calc") {
                                                    const value = evaluate(arena, [val[l]]);
                                                    if (value.length == 1) {
                                                        arena.copyLocation(value[0], val[l]);
                                                        val[l] = value[0];
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                for (const val of [left, right]) {
                                    if (mfInfo?.type === MediaFeatureType.RatioType) {
                                        const filteredValues = val.filter((n) => arena.dataTypes[n] !== EnumToken.WhitespaceTokenType &&
                                            arena.dataTypes[n] !== EnumToken.CommentTokenType);
                                        if (filteredValues.length === 3) {
                                            if (options.computeCalcExpression) {
                                                const div = gcd(arena.numericValue[filteredValues[0]], arena.numericValue[filteredValues[2]]);
                                                if (div > 1) {
                                                    arena.numericValue[filteredValues[0]] =
                                                        arena.numericValue[filteredValues[0]] / div;
                                                    arena.numericValue[filteredValues[2]] =
                                                        arena.numericValue[filteredValues[2]] / div;
                                                }
                                            }
                                            val.splice(0, val.length, ...filteredValues);
                                        }
                                    }
                                }
                                const rangeQuery = arena.createToken(EnumToken.MediaRangeQueryTokenType);
                                arena.setField(rangeQuery, TokenField.L, ...left);
                                arena.setField(rangeQuery, TokenField.Val, ...filteredNames);
                                arena.setField(rangeQuery, TokenField.Op, prevToken);
                                arena.setField(rangeQuery, TokenField.Op2, stack[stack.length - 1]);
                                arena.setField(rangeQuery, TokenField.R, ...right);
                                if (left.length > 0 && right.length > 0) {
                                    arena.spanLocation(rangeQuery, left[0], right[right.length - 1]);
                                }
                                tokens.splice(index3 + 1, tokens.length - index3 - 2, rangeQuery);
                                stack.pop();
                                stack.pop();
                            }
                        }
                        if (stack.length > 0 &&
                            (mFGT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                mFLT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                arena.dataTypes[stack[stack.length - 1]] === EnumToken.DelimTokenType ||
                                arena.dataTypes[stack[stack.length - 1]] === EnumToken.ColonTokenType)) {
                            const index2 = tokens.indexOf(stack.at(-1));
                            const index3 = tokens.indexOf(stack.at(-2));
                            let names = trimArray(arena, tokens.slice(index3 + 1, index2));
                            let values = trimArray(arena, tokens.slice(index2 + 1, tokens.length - 1));
                            const filteredNames = (names).filter((n) => arena.dataTypes[n] !== EnumToken.WhitespaceTokenType && arena.dataTypes[n] !== EnumToken.CommentTokenType);
                            const name = arena.strings[arena.stringValue[filteredNames[0]]];
                            const mfInfo = getMFInfo(name);
                            if (options.computeCalcExpression) {
                                if (mfInfo == null ||
                                    (mfInfo.type != MediaFeatureType.KeywordType &&
                                        mfInfo.type != MediaFeatureType.StringType)) {
                                    const val = values;
                                    for (let l = 0; l < val.length; l++) {
                                        if (arena.dataTypes[val[l]] === EnumToken.MathFunctionTokenType &&
                                            arena.strings[arena.stringValue[val[l]]] === "calc") {
                                            const value = evaluate(arena, [val[l]]);
                                            if (value.length == 1) {
                                                arena.copyLocation(value[0], val[l]);
                                                val[l] = value[0];
                                            }
                                        }
                                    }
                                }
                            }
                            const mfValue = isMFValue(arena, name, values, mFGT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                mFLT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                arena.dataTypes[stack[stack.length - 1]] === EnumToken.DelimTokenType);
                            if (!mfValue.success) {
                                success = false;
                                const arr = values;
                                errors.push({
                                    action: "drop",
                                    node: arr[0],
                                    location: options.source.getSourceLocation(arena.getSpanStart(arr[0])),
                                    message: `${mfValue.isValueAllowed === false ? "invalid <mf-name>" : "expected <mf-value>"}`,
                                });
                                break;
                            }
                            if (mfInfo?.type === MediaFeatureType.RatioType) {
                                const val = values;
                                const filteredValues = val.filter((n) => arena.dataTypes[n] !== EnumToken.WhitespaceTokenType && arena.dataTypes[n] !== EnumToken.CommentTokenType);
                                if (filteredValues.length === 3) {
                                    if (options.computeCalcExpression) {
                                        const div = gcd(arena.numericValue[filteredValues[0]], arena.numericValue[filteredValues[2]]);
                                        if (div > 1) {
                                            arena.numericValue[filteredValues[0]] =
                                                arena.numericValue[filteredValues[0]] / div;
                                            arena.numericValue[filteredValues[2]] =
                                                arena.numericValue[filteredValues[2]] / div;
                                        }
                                    }
                                    val.splice(0, val.length, ...filteredValues);
                                }
                            }
                            if (arena.typeOf(stack.at(-1)) === EnumToken.ColonTokenType) {
                                if (name.startsWith("min-")) {
                                    arena.setStr(filteredNames[0], name.substring(4));
                                    arena.dataTypes[stack[stack.length - 1]] = EnumToken.GteTokenType;
                                }
                                else if (name.startsWith("max-")) {
                                    arena.setStr(filteredNames[0], name.substring(4));
                                    arena.dataTypes[stack[stack.length - 1]] = EnumToken.LteTokenType;
                                }
                            }
                            const condition = arena.createToken(EnumToken.MediaQueryConditionTokenType);
                            arena.setField(condition, TokenField.L, ...names);
                            arena.setField(condition, TokenField.Op, stack.pop());
                            arena.setField(condition, TokenField.R, ...values);
                            if (names.length > 0 && values.length > 0) {
                                arena.spanLocation(condition, names[0], values[values.length - 1]);
                            }
                            tokens.splice(index3 + 1, tokens.length - index3 - 2, condition);
                        }
                        if (stack.length === 0) {
                            success = false;
                            errors.push({
                                action: "drop",
                                node: stream[i],
                                location: options.source.getSourceLocation(arena.getSpanStart(stream[i])),
                                message: `unmatched ')'`,
                            });
                            break;
                        }
                        {
                            const index = tokens.indexOf(stack[stack.length - 1]);
                            arena.dataTypes[tokens[index]] = EnumToken.ParensTokenType;
                            arena.setTokenList(tokens[index], tokens.slice(index + 1, tokens.length - 1));
                            arena.spanLocation(tokens[index], tokens[index], stream[i]);
                            tokens.length = index + 1;
                            scopes.pop();
                            currentScope = scopes.at(-1);
                            stack.pop();
                            if (arena.typeOf(stack.at(-1)) === EnumToken.AndTokenType ||
                                arena.typeOf(stack.at(-1)) === EnumToken.OrTokenType) {
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
                                arena.setField(condition, TokenField.Op, op);
                                arena.setField(condition, TokenField.L, ...left);
                                arena.setField(condition, TokenField.R, ...right);
                                if (left.length > 0 && right.length > 0) {
                                    arena.spanLocation(condition, left[0], right[right.length - 1]);
                                }
                                tokens[l] = condition;
                                tokens.length = l + 1;
                                // media range query
                                if (options.minify && arena.dataTypes[op] === EnumToken.AndTokenType) {
                                    const leftCondition = left.length === 1 &&
                                        arena.dataTypes[left[0]] == EnumToken.ParensTokenType &&
                                        arena.tokenCount(left[0]) == 1
                                        ? arena.firstToken[left[0]]
                                        : null;
                                    const rightCondition = right.length === 1 &&
                                        arena.dataTypes[right[0]] == EnumToken.ParensTokenType &&
                                        arena.tokenCount(right[0]) == 1
                                        ? arena.firstToken[right[0]]
                                        : null;
                                    if (leftCondition != null &&
                                        rightCondition != null &&
                                        arena.dataTypes[leftCondition] == EnumToken.MediaQueryConditionTokenType &&
                                        arena.dataTypes[rightCondition] == EnumToken.MediaQueryConditionTokenType) {
                                        const leftNames = arena.fieldTokens(leftCondition, TokenField.L);
                                        const rightNames = arena.fieldTokens(rightCondition, TokenField.L);
                                        const leftOp = arena.field(leftCondition, TokenField.Op);
                                        const rightOp = arena.field(rightCondition, TokenField.Op);
                                        if (leftNames.length == 1 &&
                                            arena.dataTypes[leftNames[0]] == EnumToken.IdenTokenType &&
                                            (arena.dataTypes[leftOp] == EnumToken.GtTokenType ||
                                                arena.dataTypes[leftOp] == EnumToken.GteTokenType) &&
                                            rightNames.length == 1 &&
                                            arena.dataTypes[rightNames[0]] == EnumToken.IdenTokenType &&
                                            (arena.dataTypes[rightOp] == EnumToken.LtTokenType ||
                                                arena.dataTypes[rightOp] == EnumToken.LteTokenType) &&
                                            equalsIgnoreCase(arena.strings[arena.stringValue[leftNames[0]]], arena.strings[arena.stringValue[rightNames[0]]])) {
                                            const rangeQuery = arena.createToken(EnumToken.MediaRangeQueryTokenType);
                                            arena.dataTypes[leftOp] =
                                                arena.dataTypes[leftOp] == EnumToken.GteTokenType
                                                    ? EnumToken.LteTokenType
                                                    : EnumToken.LtTokenType;
                                            arena.setField(rangeQuery, TokenField.L, ...arena.fieldTokens(leftCondition, TokenField.R));
                                            arena.setField(rangeQuery, TokenField.Val, ...leftNames);
                                            arena.setField(rangeQuery, TokenField.Op, leftOp);
                                            arena.setField(rangeQuery, TokenField.Op2, rightOp);
                                            arena.setField(rangeQuery, TokenField.R, ...arena.fieldTokens(rightCondition, TokenField.R));
                                            arena.spanLocation(rangeQuery, left[0], right[right.length - 1]);
                                            const parens = arena.createToken(EnumToken.ParensTokenType);
                                            arena.setTokens(parens, rangeQuery);
                                            arena.copyLocation(parens, rangeQuery);
                                            tokens[l] = parens;
                                        }
                                    }
                                }
                                expectAndOrComma = true;
                            }
                        }
                        break;
                }
                if (!success) {
                    break;
                }
            }
            if (!success) {
                hasErrors = true;
                parts.splice(parts.indexOf(stream), 1);
            }
            stream.length = 0;
            for (const t of trimArray(arena, tokens)) {
                stream.push(t);
            }
        }
    }
    stream.length = 0;
    let hasPart = false;
    for (const part of parts) {
        if (part.length == 0 || arena.dataTypes[part[0]] === EnumToken.InvalidMediaQueryTokenType) {
            continue;
        }
        if (hasPart) {
            stream.push(arena.createToken(EnumToken.CommaTokenType));
        }
        for (const token of part) {
            stream.push(token);
        }
        hasPart = true;
    }
    return {
        success: !hasErrors ||
            stream.filter((t) => arena.dataTypes[t] !== EnumToken.WhitespaceTokenType &&
                arena.dataTypes[t] !== EnumToken.CommentTokenType &&
                arena.dataTypes[t] !== EnumToken.InvalidMediaQueryTokenType &&
                arena.dataTypes[t] !== EnumToken.CommaTokenType).length !== 0,
        errors,
    };
}

export { parseMediaqueryList };
