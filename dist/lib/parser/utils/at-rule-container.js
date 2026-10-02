import { EnumToken } from '../../ast/types.js';
import { tokensfuncDefMap, LOCSTA, mFGT, mFLT, LOCEND, LOCSRCID } from '../../syntax/constants.js';
import { matchAllSyntaxes, createValidationContext, trimArray } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { getSyntaxRule } from '../../validation/config.js';
import { equalsIgnoreCase } from './text.js';

function parseAtRuleContainerQueryList(stream, context, options = {}) {
    let matchCount = 0;
    const errors = [];
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + context.nam);
    const syntax = syntaxRules?.getPreludeRules()?.slice?.(1);
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
    const result = matchAllSyntaxes(syntax, createValidationContext(stream), options);
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
                (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType)) {
                tokens.push(stream[i++]);
            }
            if (stream[i].typ === EnumToken.IdenTokenType) {
                tokens.push(stream[i++]);
            }
            while (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType) {
                tokens.push(stream[i++]);
            }
            if (i < stream.length &&
                stream[i]?.typ !== EnumToken.StartParensTokenType &&
                stream[i]?.typ !== EnumToken.ContainerFunctionTokenDefType) {
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            node: stream[i],
                            location: options.source.getSourceLocation(stream[i]?.[LOCSTA]),
                            message: `expecting <container-condition>`,
                        },
                    ],
                };
            }
            for (; i < stream.length; i++) {
                tokens.push(stream[i]);
                if (stream[i].typ === EnumToken.WhitespaceTokenType || stream[i].typ === EnumToken.CommentTokenType) {
                    continue;
                }
                if (expectAndOr) {
                    let valid = true;
                    // if (stream[i].typ === EnumToken.IdenTokenType) {
                    //     const val: string = (stream[i] as IdentToken).val.toLowerCase();
                    //     valid = val === "and" || val === "or";
                    // } else {
                    valid = stream[i].typ !== EnumToken.CommaTokenType;
                    // }
                    if (!valid) {
                        success = false;
                        errors.push({
                            action: "drop",
                            node: stream[i],
                            message: `expecting <and>, <or> or comma`,
                            location: options.source.getSourceLocation(stream[i]?.[LOCSTA]),
                        });
                        break;
                    }
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
                            if (val === "not") {
                                Object.assign(stream[i], {
                                    typ: EnumToken.NotTokenType,
                                });
                                stack.push(stream[i]);
                            }
                            else if (val === "and" || val === "or") {
                                Object.assign(stream[i], {
                                    typ: val === "and" ? EnumToken.AndTokenType : EnumToken.OrTokenType,
                                });
                                if (val === "or" && scopes.length <= 1) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        location: options.source.getSourceLocation(stream[i][LOCSTA]),
                                        message: `<or> is not allowed outside of parentheses`,
                                    });
                                    break;
                                }
                                currentScope.add(stream[i].typ);
                                stack.push(stream[i]);
                            }
                        }
                        break;
                    case EnumToken.EndParensTokenType:
                        if (mFGT.has(stack.at(-1)?.typ) ||
                            mFLT.has(stack.at(-1)?.typ) ||
                            stack.at(-1)?.typ === EnumToken.DelimTokenType ||
                            stack.at(-1)?.typ === EnumToken.ColonTokenType) {
                            stack[stack.length - 2].val?.toLowerCase?.();
                            const index2 = tokens.indexOf(stack.at(-1));
                            const index3 = tokens.indexOf(stack.at(-2));
                            let names = trimArray(tokens.slice(index3 + 1, index2));
                            let values = trimArray(tokens.slice(index2 + 1, tokens.length - 1));
                            tokens.splice(index3 + 1, tokens.length - index3 - 2, {
                                typ: EnumToken.MediaQueryConditionTokenType,
                                l: names,
                                op: stack.pop(),
                                r: values,
                                [LOCSRCID]: names[0][LOCSRCID],
                                [LOCSTA]: names[0][LOCSTA],
                                [LOCEND]: values.at(-1)[LOCEND],
                            });
                            const token = tokens[index3 + 1];
                            if (token.op.typ === EnumToken.ColonTokenType) {
                                let name = token.l.find((t) => t.typ === EnumToken.IdenTokenType);
                                if (name != null) {
                                    if (name.val.startsWith("min-")) {
                                        name.val = name.val.substring(4);
                                        // @ts-ignore
                                        token.op.typ = EnumToken.GteTokenType;
                                    }
                                    else if (name.val.startsWith("max-")) {
                                        name.val = name.val.substring(4);
                                        // @ts-ignore
                                        token.op.typ = EnumToken.LteTokenType;
                                    }
                                }
                            }
                            // check <style()> or <scroll-state()>
                        }
                        if (tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                            const index = tokens.indexOf(stack.at(-1));
                            Object.assign(tokens[index], {
                                typ: tokensfuncDefMap.get(stack.at(-1)?.typ),
                                chi: trimArray(tokens.slice(index + 1, tokens.length - 1)),
                            });
                            tokens[index][LOCSRCID] = tokens[index][LOCSRCID];
                            tokens[index][LOCSTA] = tokens[index][LOCSTA];
                            tokens[index][LOCEND] = stream[i][LOCEND];
                            if (tokens[index].chi.every((t) => t.typ === EnumToken.WhitespaceTokenType || t.typ === EnumToken.CommentTokenType)) {
                                success = false;
                                errors.push({
                                    action: "drop",
                                    node: stream[i],
                                    location: options.source.getSourceLocation(stream[i]?.[LOCSTA]),
                                    message: `expecting '<${tokens[index].val}-query>'`,
                                });
                                break;
                            }
                            tokens.length = index + 1;
                            stack.pop();
                            scopes.pop();
                            currentScope = scopes.at(-1);
                        }
                        else {
                            const index = tokens.indexOf(stack.at(-1));
                            tokens[index] = {
                                typ: EnumToken.ParensTokenType,
                                chi: tokens.slice(index + 1, tokens.length - 1),
                                [LOCSRCID]: tokens[index][LOCSRCID],
                                [LOCSTA]: tokens[index][LOCSTA],
                                [LOCEND]: stream[i][LOCEND],
                            };
                            if (tokens[index].chi.every((t) => t.typ === EnumToken.WhitespaceTokenType || t.typ === EnumToken.CommentTokenType)) {
                                success = false;
                                errors.push({
                                    action: "drop",
                                    node: stream[i],
                                    location: options.source.getSourceLocation(stream[i]?.[LOCSTA]),
                                    message: `expecting '<query-in-parens>'`,
                                });
                                break;
                            }
                            tokens.length = index + 1;
                            scopes.pop();
                            currentScope = scopes.at(-1);
                            stack.pop();
                        }
                        if (stack.at(-1)?.typ === EnumToken.NotTokenType) {
                            let j = tokens.indexOf(stack.at(-1));
                            let k = j;
                            while (j-- &&
                                (tokens[j]?.typ === EnumToken.WhitespaceTokenType ||
                                    tokens[j]?.typ === EnumToken.CommentTokenType)) { }
                            if (j >= 0) {
                                if (tokens[j]?.typ !== EnumToken.StartParensTokenType) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: tokens[k],
                                        location: options.source.getSourceLocation(tokens[k]?.[LOCSTA]),
                                        message: `unexpected token 'not'`,
                                    });
                                    break;
                                }
                            }
                        }
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
                                [LOCSRCID]: left[0][LOCSRCID],
                                [LOCSTA]: left[0][LOCSTA],
                                [LOCEND]: right.at(-1)[LOCEND],
                            };
                            tokens.length = l + 1;
                            expectAndOr = true;
                            if (tokens[l].op.typ === EnumToken.AndTokenType) {
                                let left = tokens[l].l.find((t) => t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.IdenTokenType);
                                let right = tokens[l].r.find((t) => t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.IdenTokenType);
                                if (left.typ == EnumToken.ParensTokenType && right.typ == EnumToken.ParensTokenType) {
                                    left = left.chi.find((t) => t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.IdenTokenType);
                                    right = right.chi.find((t) => t.typ != EnumToken.WhitespaceTokenType && t.typ != EnumToken.IdenTokenType);
                                    if (left.typ == EnumToken.MediaQueryConditionTokenType &&
                                        (mFLT.has(left.op.typ) ||
                                            mFGT.has(left.op.typ)) &&
                                        right.typ == EnumToken.MediaQueryConditionTokenType &&
                                        (mFLT.has(right.op.typ) ||
                                            mFGT.has(right.op.typ))) {
                                        const name = left.l.find((t) => t.typ == EnumToken.IdenTokenType);
                                        const name2 = right.l.find((t) => t.typ == EnumToken.IdenTokenType);
                                        if (equalsIgnoreCase(name.val, name2.val)) {
                                            switch (left.op.typ) {
                                                case EnumToken.LtTokenType:
                                                    left.op.typ = EnumToken.GtTokenType;
                                                    break;
                                                case EnumToken.LteTokenType:
                                                    left.op.typ = EnumToken.GteTokenType;
                                                    break;
                                                case EnumToken.GtTokenType:
                                                    left.op.typ = EnumToken.LtTokenType;
                                                    break;
                                                case EnumToken.GteTokenType:
                                                    left.op.typ = EnumToken.LteTokenType;
                                                    break;
                                            }
                                            tokens[l] = {
                                                typ: EnumToken.ParensTokenType,
                                                chi: [
                                                    {
                                                        typ: EnumToken.MediaRangeQueryTokenType,
                                                        l: left.r,
                                                        val: [name],
                                                        op1: left.op,
                                                        op2: right.op,
                                                        r: right.r,
                                                        [LOCSRCID]: name[LOCSRCID],
                                                        [LOCSTA]: left[LOCSTA],
                                                        [LOCEND]: right[LOCEND],
                                                    },
                                                ],
                                                [LOCSRCID]: name[LOCSRCID],
                                                [LOCSTA]: left[LOCSTA],
                                                [LOCEND]: right[LOCEND],
                                            };
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
            for (const token of trimArray(tokens)) {
                stream.push(token);
            }
        }
    }
    stream.length = 0;
    stream.push(...parts
        .filter((p) => p.length > 0 && p[0].typ !== EnumToken.InvalidMediaQueryTokenType)
        .reduce((acc, b) => {
        for (const token of b) {
            acc.push(token);
        }
        return acc;
    }, []));
    return {
        success: true,
        errors,
    };
}

export { parseAtRuleContainerQueryList };
