import { EnumToken } from '../../ast/types.js';
import { evaluate } from '../../ast/math/expression.js';
import { gcd } from '../../ast/math/math.js';
import { tokensfuncDefMap, mediaTypes, LOC, mFLT, mFGT } from '../../syntax/constants.js';
import { trimArray, matchAllSyntaxes, createValidationContext, getMFInfo, isMFValue } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum, MediaFeatureType } from '../../validation/parser/typedef.js';
import { getParsedSyntax } from '../../validation/config.js';

// https://drafts.csswg.org/mediaqueries/#media-descriptor-table:~:text=It%20is%20invalid%20to%20mix%20and%20and%20or%20and%20not%20at%20the%20same%20%E2%80%9Clevel%E2%80%9D%20of%20a%20media%20query%2E
// 'or' is not allowed at the same level as 'and' and 'not'
// 'or' is not allowed outside of parentheses
// https://drafts.csswg.org/mediaqueries/#error-handling
// error recovery
function parseMediaqueryList(stream, options) {
    let matchCount = 0;
    const errors = [];
    let hasErrors = false;
    const parts = stream.reduce((acc, t) => {
        if (t.typ === EnumToken.CommaTokenType && matchCount === 0) {
            acc.push([]);
        }
        else {
            acc[acc.length - 1].push(t);
            if (t.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(t.typ)) {
                matchCount++;
            }
            else if (t.typ === EnumToken.EndParensTokenType) {
                if (matchCount > 0) {
                    matchCount--;
                }
            }
        }
        return acc;
    }, [[]]);
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
                (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType)) {
                tokens.push(stream[i]);
                i++;
            }
            // [not | only] <media-type> [ and <media-condition-without-or>  ]?
            if (i < stream.length) {
                if (stream[i].typ === EnumToken.IdenTokenType) {
                    const val = stream[i].val.toLowerCase();
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
                            location: options.source.getSourceLocation(stream[i][LOC].sta),
                        });
                    }
                }
                else if (stream[i].typ !== EnumToken.StartParensTokenType) {
                    success = false;
                    errors.push({
                        action: "drop",
                        message: `expecting '('`,
                        node: stream[i],
                        location: options.source.getSourceLocation(stream[i][LOC].sta),
                    });
                }
            }
            for (; i < stream.length; i++) {
                tokens.push(stream[i]);
                if (stream[i].typ === EnumToken.WhitespaceTokenType || stream[i].typ === EnumToken.CommentTokenType) {
                    continue;
                }
                if (expectAndOrComma) {
                    if (stream[i].typ === EnumToken.IdenTokenType) {
                        stream[i].val.toLowerCase();
                    }
                    expectAndOrComma = false;
                }
                if (stream[i].typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[i].typ)) {
                    scopes.push((currentScope = new Set()));
                    stack.push(stream[i]);
                    continue;
                }
                switch (stream[i].typ) {
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
                            const val = stream[i].val.toLowerCase();
                            if (val === "and" || val === "or") {
                                Object.assign(stream[i], {
                                    typ: val === "and" ? EnumToken.AndTokenType : EnumToken.OrTokenType,
                                });
                                if (val === "or" && scopes.length <= 1) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        message: `<or> is not allowed outside of parentheses`,
                                        location: options.source.getSourceLocation(stream[i][LOC].sta),
                                    });
                                    break;
                                }
                                if (currentScope.has(val === "or" ? EnumToken.AndTokenType : EnumToken.OrTokenType)) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        message: `cannot mix <and> and <or> at the same level`,
                                        location: options.source.getSourceLocation(stream[i][LOC].sta),
                                    });
                                }
                                currentScope.add(stream[i].typ);
                                stack.push(stream[i]);
                            }
                        }
                        break;
                    case EnumToken.EndParensTokenType:
                        if (tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                            const index = tokens.indexOf(stack.at(-1));
                            tokens[index][LOC] = { ...tokens[index][LOC], end: stream[i][LOC].end };
                            Object.assign(tokens[index], {
                                typ: tokensfuncDefMap.get(stack.at(-1)?.typ),
                                chi: trimArray(tokens.slice(index + 1, tokens.length - 1)),
                            });
                            tokens.length = index + 1;
                            const result = matchAllSyntaxes(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, tokens[index].val + "()")?.[0]?.chi, createValidationContext(tokens[index].chi), options);
                            stack.pop();
                            scopes.pop();
                            currentScope = scopes.at(-1);
                            if (!result.success) {
                                errors.push(...result.errors);
                                success = false;
                            }
                            break;
                        }
                        // feature
                        if (mFLT.has(stack.at(-1)?.typ) || mFGT.has(stack.at(-1)?.typ)) {
                            // <mf-lt> | <mf-gt>
                            const index = tokens.indexOf(stack.at(-1));
                            const prevToken = stack[stack.length - 2];
                            if (mFLT.has(prevToken?.typ) || mFGT.has(prevToken?.typ)) {
                                // const index: number = tokens.indexOf(stack.at(-1)!);
                                // <mf-lt> | <mf-name>
                                const index2 = tokens.indexOf(prevToken);
                                // '('
                                const index3 = tokens.indexOf(stack.at(-3));
                                const left = trimArray(tokens.slice(index3 + 1, index2));
                                const right = trimArray(tokens.slice(index + 1, tokens.length - 1));
                                const names = trimArray(tokens.slice(index2 + 1, index));
                                const filteredNames = names.filter((n) => n.typ !== EnumToken.WhitespaceTokenType && n.typ !== EnumToken.CommentTokenType);
                                const name = filteredNames[0].val;
                                const mfInfo = getMFInfo(name);
                                for (const val of [left, right]) {
                                    if (options.computeCalcExpression) {
                                        if (mfInfo == null ||
                                            (mfInfo.type != MediaFeatureType.KeywordType &&
                                                mfInfo.type != MediaFeatureType.StringType)) {
                                            for (let l = 0; l < val.length; l++) {
                                                if (val[l].typ === EnumToken.MathFunctionTokenType &&
                                                    val[l].val === "calc") {
                                                    const value = evaluate([val[l]]);
                                                    if (value.length == 1) {
                                                        value[0][LOC] = val[l][LOC];
                                                        val[l] = value[0];
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                // let isValidMFValue = isMFValue(name, left, true);
                                // isValidMFValue = isMFValue(name, right, true);
                                for (const val of [left, right]) {
                                    if (mfInfo?.type === MediaFeatureType.RatioType) {
                                        const filteredValues = val.filter((n) => n.typ !== EnumToken.WhitespaceTokenType &&
                                            n.typ !== EnumToken.CommentTokenType);
                                        if (filteredValues.length === 3) {
                                            if (options.computeCalcExpression) {
                                                const div = gcd(filteredValues[0].val, filteredValues[2].val);
                                                if (div > 1) {
                                                    filteredValues[0].val =
                                                        filteredValues[0].val / div;
                                                    filteredValues[2].val =
                                                        filteredValues[2].val / div;
                                                }
                                            }
                                            val.splice(0, val.length, ...filteredValues);
                                        }
                                    }
                                }
                                tokens.splice(index3 + 1, tokens.length - index3 - 2, {
                                    typ: EnumToken.MediaRangeQueryTokenType,
                                    l: left,
                                    val: filteredNames,
                                    op1: prevToken,
                                    op2: stack.at(-1),
                                    r: right,
                                    [LOC]: { ...left[0][LOC], end: right.at(-1)[LOC].end },
                                });
                                stack.pop();
                                stack.pop();
                            }
                        }
                        if (stack.length > 0 &&
                            (mFGT.has(stack.at(-1)?.typ) ||
                                mFLT.has(stack.at(-1)?.typ) ||
                                stack.at(-1)?.typ === EnumToken.DelimTokenType ||
                                stack.at(-1)?.typ === EnumToken.ColonTokenType)) {
                            const index2 = tokens.indexOf(stack.at(-1));
                            const index3 = tokens.indexOf(stack.at(-2));
                            let names = trimArray(tokens.slice(index3 + 1, index2));
                            let values = trimArray(tokens.slice(index2 + 1, tokens.length - 1));
                            const filteredNames = (names).filter((n) => n.typ !== EnumToken.WhitespaceTokenType && n.typ !== EnumToken.CommentTokenType);
                            const name = filteredNames[0].val;
                            const mfInfo = getMFInfo(name);
                            if (options.computeCalcExpression) {
                                if (mfInfo == null ||
                                    (mfInfo.type != MediaFeatureType.KeywordType &&
                                        mfInfo.type != MediaFeatureType.StringType)) {
                                    const val = values;
                                    for (let l = 0; l < val.length; l++) {
                                        if (val[l].typ === EnumToken.MathFunctionTokenType &&
                                            val[l].val === "calc") {
                                            const value = evaluate([val[l]]);
                                            if (value.length == 1) {
                                                value[0][LOC] = val[l][LOC];
                                                val[l] = value[0];
                                            }
                                        }
                                    }
                                }
                            }
                            const mfValue = isMFValue(name, values, mFGT.has(stack.at(-1)?.typ) ||
                                mFLT.has(stack.at(-1)?.typ) ||
                                stack.at(-1)?.typ === EnumToken.DelimTokenType);
                            if (!mfValue.success) {
                                success = false;
                                const arr = values;
                                errors.push({
                                    action: "drop",
                                    node: arr[0],
                                    location: options.source.getSourceLocation(arr[0]?.[LOC].sta),
                                    message: `${mfValue.isValueAllowed === false ? "invalid <mf-name>" : "expected <mf-value>"}`,
                                });
                                break;
                            }
                            if (mfInfo?.type === MediaFeatureType.RatioType) {
                                const val = values;
                                const filteredValues = val.filter((n) => n.typ !== EnumToken.WhitespaceTokenType && n.typ !== EnumToken.CommentTokenType);
                                if (filteredValues.length === 3) {
                                    if (options.computeCalcExpression) {
                                        const div = gcd(filteredValues[0].val, filteredValues[2].val);
                                        if (div > 1) {
                                            filteredValues[0].val =
                                                filteredValues[0].val / div;
                                            filteredValues[2].val =
                                                filteredValues[2].val / div;
                                        }
                                    }
                                    val.splice(0, val.length, ...filteredValues);
                                }
                            }
                            tokens.splice(index3 + 1, tokens.length - index3 - 2, {
                                typ: EnumToken.MediaQueryConditionTokenType,
                                l: names,
                                op: stack.pop(),
                                r: values,
                                // @ts-expect-error
                                [LOC]: { ...names[0][LOC], end: values.at(-1)[LOC].end },
                            });
                        }
                        if (stack.length === 0) {
                            success = false;
                            errors.push({
                                action: "drop",
                                node: stream[i],
                                location: options.source.getSourceLocation(stream[i]?.[LOC].sta),
                                message: `unmatched ')'`,
                            });
                            break;
                        }
                        {
                            const index = tokens.indexOf(stack.at(-1));
                            tokens[index] = {
                                typ: EnumToken.ParensTokenType,
                                chi: tokens.slice(index + 1, tokens.length - 1),
                                // @ts-expect-error
                                [LOC]: { ...tokens[index][LOC], end: stream[i][LOC].end },
                            };
                            tokens.length = index + 1;
                            scopes.pop();
                            currentScope = scopes.at(-1);
                            stack.pop();
                            if (stack.at(-1)?.typ === EnumToken.AndTokenType ||
                                stack.at(-1)?.typ === EnumToken.OrTokenType) {
                                const index = tokens.indexOf(stack.at(-1));
                                let l = index - 1;
                                while (l > 0 &&
                                    (tokens[l].typ === EnumToken.WhitespaceTokenType ||
                                        tokens[l].typ === EnumToken.CommentTokenType)) {
                                    l--;
                                }
                                const left = trimArray(tokens.slice(l, index));
                                const right = trimArray(tokens.slice(index + 1));
                                tokens[l] = {
                                    typ: EnumToken.MediaQueryConditionTokenType,
                                    op: stack.pop(),
                                    l: left,
                                    r: right,
                                    [LOC]: { ...left[0][LOC], end: right.at(-1)[LOC].end },
                                };
                                tokens.length = l + 1;
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
            stream.push(...trimArray(tokens));
        }
    }
    stream.length = 0;
    stream.push(...parts
        .filter((p) => p.length > 0 && p[0].typ !== EnumToken.InvalidMediaQueryTokenType)
        .reduce((acc, b) => {
        if (acc.length > 0) {
            acc.push({ typ: EnumToken.CommaTokenType });
        }
        acc.push(...b);
        return acc;
    }, []));
    return {
        success: !hasErrors ||
            stream.filter((t) => t.typ !== EnumToken.WhitespaceTokenType &&
                t.typ !== EnumToken.CommentTokenType &&
                t.typ !== EnumToken.InvalidMediaQueryTokenType &&
                t.typ !== EnumToken.CommaTokenType).length !== 0,
        errors,
    };
}

export { parseMediaqueryList };
