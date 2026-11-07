import type { Token, ErrorDescription, ParserOptions } from "../../../@types/index.d.ts";
import { type AstArena, TokenField } from "../../ast/arena.ts";
import { EnumToken } from "../../ast/types.ts";
import { evaluate } from "../../ast/math/expression.ts";
import { gcd } from "../../ast/math/math.ts";
import { mediaTypes, mFGT, mFLT } from "../../syntax/constants.ts";

import { createValidationContext, getMFInfo, isMFValue, matchAllSyntaxes, trimArray } from "../../validation/match.ts";
import { MediaFeatureType, ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationFunctionToken } from "../../validation/parser/types.d.ts";
import type { ValidationMatch } from "../../validation/types.d.ts";
import { tokensfuncDefMap } from "../../syntax/constants.ts";
import { getParsedSyntax } from "../../validation/config.ts";
import { equalsIgnoreCase } from "./text.ts";

// https://drafts.csswg.org/mediaqueries/#media-descriptor-table:~:text=It%20is%20invalid%20to%20mix%20and%20and%20or%20and%20not%20at%20the%20same%20%E2%80%9Clevel%E2%80%9D%20of%20a%20media%20query%2E
// 'or' is not allowed at the same level as 'and' and 'not'
// 'or' is not allowed outside of parentheses
// https://drafts.csswg.org/mediaqueries/#error-handling
// error recovery

export function parseMediaqueryList(
    arena: AstArena,
    stream: Token[],
    options: ParserOptions,
): {
    errors: ErrorDescription[];
    success: boolean;
} {
    let matchCount: number = 0;
    const errors: ErrorDescription[] = [];
    let hasErrors: boolean = false;
    const parts: Token[][] = [[]];

    for (const token of stream) {
        const type: EnumToken = arena.dataTypes[token];

        if (type === EnumToken.CommaTokenType && matchCount === 0) {
            parts.push([]);
            continue;
        }

        parts[parts.length - 1].push(token);

        if (type === EnumToken.StartParensTokenType || tokensfuncDefMap.has(type)) {
            matchCount++;
        } else if (type === EnumToken.EndParensTokenType && matchCount > 0) {
            matchCount--;
        }
    }

    {
        for (const stream of parts.slice()) {
            let success: boolean = true;
            let i: number;
            let currentScope: Set<EnumToken> = new Set();
            const scopes: Array<Set<EnumToken>> = [currentScope];
            const stack: Token[] = [];
            const tokens: Token[] = [];
            let expectAndOrComma: boolean = false;

            i = 0;

            while (
                i < stream.length &&
                (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType)
            ) {
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
                    } else {
                        success = false;
                        errors.push({
                            action: "drop",
                            message: `expecting '<media-type>'`,
                            node: stream[i],
                            // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                            location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                        });
                    }
                } else if (arena.dataTypes[stream[i]] !== EnumToken.StartParensTokenType) {
                    success = false;
                    errors.push({
                        action: "drop",
                        message: `expecting '('`,
                        node: stream[i],
                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                        location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                    });
                }
            }

            for (; i < stream.length; i++) {
                tokens.push(stream[i]);

                if (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType) {
                    continue;
                }

                if (expectAndOrComma) {
                    let valid: boolean = true;

                    if (arena.dataTypes[stream[i]] === EnumToken.IdenTokenType) {
                        const val: string = arena.strings[arena.stringValue[stream[i]]].toLowerCase();
                        valid = val === "and" || val === "or";
                    } else {
                        valid = arena.dataTypes[stream[i]] !== EnumToken.CommaTokenType;
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
                            const val: string = arena.strings[arena.stringValue[stream[i]]].toLowerCase();

                            if (val === "and" || val === "or") {
                                arena.dataTypes[stream[i]] = val === "and" ? EnumToken.AndTokenType : EnumToken.OrTokenType;

                                if (
                                    val === "or" &&
                                    scopes.length == 1 &&
                                    scopes[0].size > 0 &&
                                    !scopes[0].has(EnumToken.OrTokenType)
                                ) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        message: `<or> is not allowed outside of parentheses`,
                                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                                        location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                                    });

                                    break;
                                }

                                if (currentScope.has(val === "or" ? EnumToken.AndTokenType : EnumToken.OrTokenType)) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        message: `cannot mix <and> and <or> at the same level`,
                                        // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                                        location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                                    });
                                }

                                currentScope.add(arena.dataTypes[stream[i]]);
                                stack.push(stream[i]);
                            }
                        }

                        break;

                    case EnumToken.EndParensTokenType:
                        if (stack.length > 0 && tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]])) {
                            const index: number = tokens.indexOf(stack[stack.length - 1]);

                            arena.spanLocation(tokens[index], tokens[index], stream[i]);
                            arena.dataTypes[tokens[index]] = tokensfuncDefMap.get(arena.dataTypes[tokens[index]]) as EnumToken;
                            arena.setTokenList(tokens[index], trimArray(arena, tokens.slice(index + 1, tokens.length - 1)));

                            tokens.length = index + 1;
                            const result: ValidationMatch = matchAllSyntaxes(
                                arena,
                                (
                                    getParsedSyntax(
                                        ValidationSyntaxGroupEnum.Syntaxes,
                                        arena.strings[arena.stringValue[tokens[index]]] + "()",
                                    ) as ValidationFunctionToken[]
                                )?.[0]?.chi as ValidationFunctionToken[],
                                createValidationContext(arena, arena.tokens(tokens[index])),
                                options,
                            );

                            stack.pop();
                            scopes.pop();
                            currentScope = scopes.at(-1)!;

                            if (!result.success) {
                                for (const error of result.errors) {
                                    errors.push(error);
                                }

                                success = false;
                            }

                            break;
                        }

                        // feature
                        if (
                            stack.length > 0 &&
                            (mFLT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                mFGT.has(arena.dataTypes[stack[stack.length - 1]]))
                        ) {
                            // <mf-lt> | <mf-gt>
                            const index: number = tokens.indexOf(stack.at(-1)!);
                            const prevToken: Token = stack[stack.length - 2];

                            if (mFLT.has(arena.dataTypes[prevToken]) || mFGT.has(arena.dataTypes[prevToken])) {
                                // const index: number = tokens.indexOf(stack.at(-1)!);
                                // <mf-lt> | <mf-name>
                                const index2: number = tokens.indexOf(prevToken);
                                // '('
                                const index3: number = tokens.indexOf(stack.at(-3)!);

                                const left: Token[] = trimArray(arena, tokens.slice(index3 + 1, index2));
                                const right: Token[] = trimArray(arena, tokens.slice(index + 1, tokens.length - 1));
                                const names: Token[] = trimArray(arena, tokens.slice(index2 + 1, index));

                                const filteredNames = names.filter(
                                    (n) =>
                                        arena.dataTypes[n] !== EnumToken.WhitespaceTokenType && arena.dataTypes[n] !== EnumToken.CommentTokenType,
                                );

                                const name: string = arena.strings[arena.stringValue[filteredNames[0]]];
                                const mfInfo = getMFInfo(name);

                                for (const val of [left, right]) {
                                    if (options.computeCalcExpression) {
                                        if (
                                            mfInfo == null ||
                                            (mfInfo.type != MediaFeatureType.KeywordType &&
                                                mfInfo.type != MediaFeatureType.StringType)
                                        ) {
                                            for (let l = 0; l < val.length; l++) {
                                                if (
                                                    arena.dataTypes[val[l]] === EnumToken.MathFunctionTokenType &&
                                                    arena.strings[arena.stringValue[val[l]]] === "calc"
                                                ) {
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
                                        const filteredValues = val.filter(
                                            (n) =>
                                                arena.dataTypes[n] !== EnumToken.WhitespaceTokenType &&
                                                arena.dataTypes[n] !== EnumToken.CommentTokenType,
                                        );

                                        if (filteredValues.length === 3) {
                                            if (options.computeCalcExpression) {
                                                const div = gcd(
                                                    arena.numericValue[filteredValues[0]] as number,
                                                    arena.numericValue[filteredValues[2]] as number,
                                                );

                                                if (div > 1) {
                                                    arena.numericValue[filteredValues[0]] =
                                                        (arena.numericValue[filteredValues[0]] as number) / div;
                                                    arena.numericValue[filteredValues[2]] =
                                                        (arena.numericValue[filteredValues[2]] as number) / div;
                                                }
                                            }

                                            val.splice(0, val.length, ...filteredValues);
                                        }
                                    }
                                }

                                const rangeQuery: Token = arena.createToken(EnumToken.MediaRangeQueryTokenType);

                                // inlined: arena.setField(rangeQuery, TokenField.L, ...left)
                                arena.setTokenList(arena.fieldList(rangeQuery, TokenField.L), left);
                                // inlined: arena.setField(rangeQuery, TokenField.Val, ...filteredNames)
                                arena.setTokenList(arena.fieldList(rangeQuery, TokenField.Val), filteredNames);
                                // inlined: arena.setField(rangeQuery, TokenField.Op, prevToken)
                                arena.setTokenList(arena.fieldList(rangeQuery, TokenField.Op), [prevToken]);
                                // inlined: arena.setField(rangeQuery, TokenField.Op2, stack[stack.length - 1])
                                arena.setTokenList(arena.fieldList(rangeQuery, TokenField.Op2), [stack[stack.length - 1]]);
                                // inlined: arena.setField(rangeQuery, TokenField.R, ...right)
                                arena.setTokenList(arena.fieldList(rangeQuery, TokenField.R), right);

                                if (left.length > 0 && right.length > 0) {
                                    arena.spanLocation(rangeQuery, left[0], right[right.length - 1]);
                                }

                                tokens.splice(index3 + 1, tokens.length - index3 - 2, rangeQuery);

                                stack.pop();
                                stack.pop();
                            }
                        }

                        if (
                            stack.length > 0 &&
                            (mFGT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                mFLT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                arena.dataTypes[stack[stack.length - 1]] === EnumToken.DelimTokenType ||
                                arena.dataTypes[stack[stack.length - 1]] === EnumToken.ColonTokenType)
                        ) {
                            const index2: number = tokens.indexOf(stack.at(-1)!);
                            const index3: number = tokens.indexOf(stack.at(-2)!);

                            let names: Token[] = trimArray(arena, tokens.slice(index3 + 1, index2));
                            let values: Token[] = trimArray(arena, tokens.slice(index2 + 1, tokens.length - 1));
                            let swapped: boolean = false;

                            const filteredNames = (swapped ? values : names).filter(
                                (n) => arena.dataTypes[n] !== EnumToken.WhitespaceTokenType && arena.dataTypes[n] !== EnumToken.CommentTokenType,
                            );

                            const name: string = arena.strings[arena.stringValue[filteredNames[0]]];

                            const mfInfo = getMFInfo(name);
                            if (options.computeCalcExpression) {
                                if (
                                    mfInfo == null ||
                                    (mfInfo.type != MediaFeatureType.KeywordType &&
                                        mfInfo.type != MediaFeatureType.StringType)
                                ) {
                                    const val = swapped ? names : values;

                                    for (let l = 0; l < val.length; l++) {
                                        if (
                                            arena.dataTypes[val[l]] === EnumToken.MathFunctionTokenType &&
                                            arena.strings[arena.stringValue[val[l]]] === "calc"
                                        ) {
                                            const value = evaluate(arena, [val[l]]);

                                            if (value.length == 1) {
                                                arena.copyLocation(value[0], val[l]);
                                                val[l] = value[0];
                                            }
                                        }
                                    }
                                }
                            }

                            const mfValue = isMFValue(
                                arena,
                                name,
                                swapped ? names : values,
                                mFGT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                    mFLT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                    arena.dataTypes[stack[stack.length - 1]] === EnumToken.DelimTokenType,
                            );

                            if (!mfValue.success) {
                                success = false;
                                const arr = swapped ? names : values;
                                errors.push({
                                    action: "drop",
                                    node: arr[0],
                                    // inlined: options.source!.getSourceLocation(arena.getSpanStart(arr[0]))
                                    location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(arr[0]))],
                                    message: `${mfValue.isValueAllowed === false ? "invalid <mf-name>" : "expected <mf-value>"}`,
                                });

                                break;
                            }

                            if (mfInfo?.type === MediaFeatureType.RatioType) {
                                const val = swapped ? names : values;

                                const filteredValues = val.filter(
                                    (n) =>
                                        arena.dataTypes[n] !== EnumToken.WhitespaceTokenType && arena.dataTypes[n] !== EnumToken.CommentTokenType,
                                );

                                if (filteredValues.length === 3) {
                                    if (options.computeCalcExpression) {
                                        const div = gcd(
                                            arena.numericValue[filteredValues[0]] as number,
                                            arena.numericValue[filteredValues[2]] as number,
                                        );

                                        if (div > 1) {
                                            arena.numericValue[filteredValues[0]] =
                                                (arena.numericValue[filteredValues[0]] as number) / div;
                                            arena.numericValue[filteredValues[2]] =
                                                (arena.numericValue[filteredValues[2]] as number) / div;
                                        }
                                    }

                                    val.splice(0, val.length, ...filteredValues);
                                }
                            }

                            // inlined: arena.typeOf(stack.at(-1))
                            if (arena.dataTypes[stack.at(-1) as number] === EnumToken.ColonTokenType) {
                                if (name.startsWith("min-")) {
                                    // inlined: arena.setStr(filteredNames[0], name.substring(4))
                                    arena.stringValue[filteredNames[0]] = arena.internString(name.substring(4));
                                    arena.dataTypes[stack[stack.length - 1]] = EnumToken.GteTokenType;
                                } else if (name.startsWith("max-")) {
                                    // inlined: arena.setStr(filteredNames[0], name.substring(4))
                                    arena.stringValue[filteredNames[0]] = arena.internString(name.substring(4));
                                    arena.dataTypes[stack[stack.length - 1]] = EnumToken.LteTokenType;
                                }
                            }

                            const condition: Token = arena.createToken(EnumToken.MediaQueryConditionTokenType);

                            // inlined: arena.setField(condition, TokenField.L, ...names)
                            arena.setTokenList(arena.fieldList(condition, TokenField.L), names);
                            // inlined: arena.setField(condition, TokenField.Op, stack.pop() as Token)
                            arena.setTokenList(arena.fieldList(condition, TokenField.Op), [(stack.pop() as Token)]);
                            // inlined: arena.setField(condition, TokenField.R, ...values)
                            arena.setTokenList(arena.fieldList(condition, TokenField.R), values);

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
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(stream[i]))
                                location: [options.source!.file, ...options.source!.lineStarts.getOffsets(arena.getSpanStart(stream[i]))],
                                message: `unmatched ')'`,
                            });

                            break;
                        }

                        {
                            const index: number = tokens.indexOf(stack[stack.length - 1]);

                            arena.dataTypes[tokens[index]] = EnumToken.ParensTokenType;
                            arena.setTokenList(tokens[index], tokens.slice(index + 1, tokens.length - 1));
                            arena.spanLocation(tokens[index], tokens[index], stream[i]);

                            tokens.length = index + 1;
                            scopes.pop();
                            currentScope = scopes.at(-1)!;
                            stack.pop();

                            if (
                                // inlined: arena.typeOf(stack.at(-1))
                                arena.dataTypes[stack.at(-1) as number] === EnumToken.AndTokenType ||
                                // inlined: arena.typeOf(stack.at(-1))
                                arena.dataTypes[stack.at(-1) as number] === EnumToken.OrTokenType
                            ) {
                                const index = tokens.indexOf(stack.at(-1)!);
                                let l: number = index - 1;

                                while (
                                    l > 0 &&
                                    (arena.dataTypes[tokens[l]] === EnumToken.WhitespaceTokenType ||
                                        arena.dataTypes[tokens[l]] === EnumToken.CommentTokenType)
                                ) {
                                    l--;
                                }

                                const left: Token[] = trimArray(arena, tokens.slice(l, index));
                                const right: Token[] = trimArray(arena, tokens.slice(index + 1));

                                const op: Token = stack.pop() as Token;
                                const condition: Token = arena.createToken(EnumToken.MediaQueryConditionTokenType);

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

                                // media range query
                                if (options.minify && arena.dataTypes[op] === EnumToken.AndTokenType) {
                                    const leftCondition: Token | null =
                                        left.length === 1 &&
                                        arena.dataTypes[left[0]] == EnumToken.ParensTokenType &&
                                        arena.tokenCount(left[0]) == 1
                                            ? arena.firstToken[left[0]]
                                            : null;
                                    const rightCondition: Token | null =
                                        right.length === 1 &&
                                        arena.dataTypes[right[0]] == EnumToken.ParensTokenType &&
                                        arena.tokenCount(right[0]) == 1
                                            ? arena.firstToken[right[0]]
                                            : null;

                                    if (
                                        leftCondition != null &&
                                        rightCondition != null &&
                                        arena.dataTypes[leftCondition] == EnumToken.MediaQueryConditionTokenType &&
                                        arena.dataTypes[rightCondition] == EnumToken.MediaQueryConditionTokenType
                                    ) {
                                        const leftNames: Token[] = arena.fieldTokens(leftCondition, TokenField.L);
                                        const rightNames: Token[] = arena.fieldTokens(rightCondition, TokenField.L);
                                        const leftOp: Token = arena.field(leftCondition, TokenField.Op);
                                        const rightOp: Token = arena.field(rightCondition, TokenField.Op);

                                        if (
                                            leftNames.length == 1 &&
                                            arena.dataTypes[leftNames[0]] == EnumToken.IdenTokenType &&
                                            (arena.dataTypes[leftOp] == EnumToken.GtTokenType ||
                                                arena.dataTypes[leftOp] == EnumToken.GteTokenType) &&
                                            rightNames.length == 1 &&
                                            arena.dataTypes[rightNames[0]] == EnumToken.IdenTokenType &&
                                            (arena.dataTypes[rightOp] == EnumToken.LtTokenType ||
                                                arena.dataTypes[rightOp] == EnumToken.LteTokenType) &&
                                            equalsIgnoreCase(
                                                arena.strings[arena.stringValue[leftNames[0]]],
                                                arena.strings[arena.stringValue[rightNames[0]]],
                                            )
                                        ) {
                                            const rangeQuery: Token = arena.createToken(EnumToken.MediaRangeQueryTokenType);

                                            arena.dataTypes[leftOp] =
                                                arena.dataTypes[leftOp] == EnumToken.GteTokenType
                                                    ? EnumToken.LteTokenType
                                                    : EnumToken.LtTokenType;

                                            // inlined: arena.setField(rangeQuery, TokenField.L, ...arena.fieldTokens(leftCondition, TokenField.R))
                                            arena.setTokenList(arena.fieldList(rangeQuery, TokenField.L), arena.fieldTokens(leftCondition, TokenField.R));
                                            // inlined: arena.setField(rangeQuery, TokenField.Val, ...leftNames)
                                            arena.setTokenList(arena.fieldList(rangeQuery, TokenField.Val), leftNames);
                                            // inlined: arena.setField(rangeQuery, TokenField.Op, leftOp)
                                            arena.setTokenList(arena.fieldList(rangeQuery, TokenField.Op), [leftOp]);
                                            // inlined: arena.setField(rangeQuery, TokenField.Op2, rightOp)
                                            arena.setTokenList(arena.fieldList(rangeQuery, TokenField.Op2), [rightOp]);
                                            // inlined: arena.setField(rangeQuery, TokenField.R, ...arena.fieldTokens(rightCondition, TokenField.R))
                                            arena.setTokenList(arena.fieldList(rangeQuery, TokenField.R), arena.fieldTokens(rightCondition, TokenField.R));
                                            arena.spanLocation(rangeQuery, left[0], right[right.length - 1]);

                                            const parens: Token = arena.createToken(EnumToken.ParensTokenType);

                                            // inlined: arena.setTokens(parens, rangeQuery)
                                            arena.setTokenList(parens, [rangeQuery]);
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
    let hasPart: boolean = false;

    for (const part of parts) {
        if (part.length == 0) {
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
        success:
            !hasErrors ||
            stream.filter(
                (t) =>
                    arena.dataTypes[t] !== EnumToken.WhitespaceTokenType &&
                    arena.dataTypes[t] !== EnumToken.CommentTokenType &&
                    arena.dataTypes[t] !== EnumToken.CommaTokenType,
            ).length !== 0,
        errors,
    };
}
