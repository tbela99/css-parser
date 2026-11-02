import type { Token, ErrorDescription, ParserOptions } from "../../../@types/index.d.ts";
import { type AstArena, TokenField } from "../../ast/arena.ts";
import { EnumToken } from "../../ast/types.ts";
import { mFGT, mFLT, tokensfuncDefMap } from "../../syntax/constants.ts";

import { createValidationContext, matchAllSyntaxes, trimArray } from "../../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationFunctionToken, ValidationToken } from "../../validation/parser/types.d.ts";
import type { ValidationMatch } from "../../validation/types.d.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { equalsIgnoreCase } from "./text.ts";

export function parseAtRuleContainerQueryList(
    arena: AstArena,
    stream: Token[],
    context: Token,
    options: ParserOptions = {},
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    let matchCount: number = 0;
    let hasErrors: boolean = false;
    const errors: ErrorDescription[] = [];
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + arena.strings[arena.name[context]]);
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[];
    const parts = stream.reduce(
        (acc, t) => {
            if (arena.dataTypes[t] === EnumToken.CommaTokenType && matchCount === 0) {
                acc.push([]);
            } else {
                acc[acc.length - 1].push(t);

                if (arena.dataTypes[t] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[t])) {
                    matchCount++;
                } else if (arena.dataTypes[t] === EnumToken.EndParensTokenType) {
                    if (matchCount > 0) {
                        matchCount--;
                    }
                }
            }

            return acc;
        },
        [[]] as Token[][],
    );

    const result: ValidationMatch = matchAllSyntaxes(
        arena,
        syntax as ValidationFunctionToken[],
        createValidationContext(arena, stream),
        options,
    );

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
            let success: boolean = true;
            let i: number;
            let currentScope: Set<EnumToken> = new Set();
            const scopes: Array<Set<EnumToken>> = [currentScope];
            const stack: Token[] = [];
            const tokens: Token[] = [];
            let expectAndOr: boolean = false;

            i = 0;

            while (
                i < stream.length &&
                (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType)
            ) {
                tokens.push(stream[i++]);
            }

            if (arena.dataTypes[stream[i]] === EnumToken.IdenTokenType) {
                tokens.push(stream[i++]);
            }

            while (arena.dataTypes[stream[i]] === EnumToken.WhitespaceTokenType || arena.dataTypes[stream[i]] === EnumToken.CommentTokenType) {
                tokens.push(stream[i++]);
            }

            if (
                i < stream.length &&
                arena.dataTypes[stream[i]] !== EnumToken.StartParensTokenType &&
                arena.dataTypes[stream[i]] !== EnumToken.ContainerFunctionTokenDefType
            ) {
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            node: stream[i],
                            location: options.source!.getSourceLocation(arena.getSpanStart(stream[i])),
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
                    let valid: boolean = true;

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
                            location: options.source!.getSourceLocation(arena.getSpanStart(stream[i])),
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
                            const val: string = arena.strings[arena.stringValue[stream[i]]].toLowerCase();

                            if (val === "not") {
                                arena.dataTypes[stream[i]] = EnumToken.NotTokenType;

                                stack.push(stream[i]);
                            } else if (val === "and" || val === "or") {
                                arena.dataTypes[stream[i]] = val === "and" ? EnumToken.AndTokenType : EnumToken.OrTokenType;

                                if (val === "or" && scopes.length <= 1) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        location: options.source!.getSourceLocation(arena.getSpanStart(stream[i])),
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
                        if (
                            stack.length > 0 &&
                            (mFGT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                mFLT.has(arena.dataTypes[stack[stack.length - 1]]) ||
                                arena.dataTypes[stack[stack.length - 1]] === EnumToken.DelimTokenType ||
                                arena.dataTypes[stack[stack.length - 1]] === EnumToken.ColonTokenType)
                        ) {
                            const index2: number = tokens.indexOf(stack[stack.length - 1]);
                            const index3: number = tokens.indexOf(stack[stack.length - 2]);

                            let names: Token[] = trimArray(arena, tokens.slice(index3 + 1, index2));
                            let values: Token[] = trimArray(arena, tokens.slice(index2 + 1, tokens.length - 1));
                            const op: Token = stack.pop() as Token;
                            const token: Token = arena.createToken(EnumToken.MediaQueryConditionTokenType);

                            arena.setField(token, TokenField.L, ...names);
                            arena.setField(token, TokenField.Op, op);
                            arena.setField(token, TokenField.R, ...values);

                            if (names.length > 0 && values.length > 0) {
                                arena.spanLocation(token, names[0], values[values.length - 1]);
                            }

                            tokens.splice(index3 + 1, tokens.length - index3 - 2, token);

                            if (arena.dataTypes[op] === EnumToken.ColonTokenType) {
                                const name: Token | undefined = names.find(
                                    (t: Token) => arena.dataTypes[t] === EnumToken.IdenTokenType,
                                );

                                if (name != null) {
                                    const val: string = arena.strings[arena.stringValue[name]];

                                    if (val.startsWith("min-")) {
                                        arena.setStr(name, val.substring(4));
                                        arena.dataTypes[op] = EnumToken.GteTokenType;
                                    } else if (val.startsWith("max-")) {
                                        arena.setStr(name, val.substring(4));
                                        arena.dataTypes[op] = EnumToken.LteTokenType;
                                    }
                                }
                            }

                            // check <style()> or <scroll-state()>
                        }

                        if (stack.length > 0 && tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]])) {
                            const index: number = tokens.indexOf(stack[stack.length - 1]);

                            arena.dataTypes[tokens[index]] = tokensfuncDefMap.get(arena.dataTypes[tokens[index]]) as EnumToken;
                            arena.setTokenList(tokens[index], trimArray(arena, tokens.slice(index + 1, tokens.length - 1)));
                            arena.spanLocation(tokens[index], tokens[index], stream[i]);

                            if (
                                arena.tokens(tokens[index]).every(
                                    (t) =>
                                        arena.dataTypes[t] === EnumToken.WhitespaceTokenType || arena.dataTypes[t] === EnumToken.CommentTokenType,
                                )
                            ) {
                                success = false;
                                errors.push({
                                    action: "drop",
                                    node: stream[i],
                                    location: options.source!.getSourceLocation(arena.getSpanStart(stream[i])),
                                    message: `expecting '<${arena.strings[arena.stringValue[tokens[index]]]}-query>'`,
                                });
                                break;
                            }

                            tokens.length = index + 1;

                            stack.pop();
                            scopes.pop();
                            currentScope = scopes.at(-1)!;
                        } else {
                            const index: number = tokens.indexOf(stack[stack.length - 1]);

                            arena.dataTypes[tokens[index]] = EnumToken.ParensTokenType;
                            arena.setTokenList(tokens[index], tokens.slice(index + 1, tokens.length - 1));
                            arena.spanLocation(tokens[index], tokens[index], stream[i]);

                            if (
                                arena.tokens(tokens[index]).every(
                                    (t) =>
                                        arena.dataTypes[t] === EnumToken.WhitespaceTokenType || arena.dataTypes[t] === EnumToken.CommentTokenType,
                                )
                            ) {
                                success = false;
                                errors.push({
                                    action: "drop",
                                    node: stream[i],
                                    location: options.source!.getSourceLocation(arena.getSpanStart(stream[i])),
                                    message: `expecting '<query-in-parens>'`,
                                });
                                break;
                            }

                            tokens.length = index + 1;
                            scopes.pop();
                            currentScope = scopes.at(-1)!;
                            stack.pop();
                        }

                        if (arena.typeOf(stack.at(-1)) === EnumToken.NotTokenType) {
                            let j: number = tokens.indexOf(stack.at(-1)!);
                            let k: number = j;

                            while (
                                j-- &&
                                (arena.dataTypes[tokens[j]] === EnumToken.WhitespaceTokenType ||
                                    arena.dataTypes[tokens[j]] === EnumToken.CommentTokenType)
                            ) {}

                            if (j >= 0) {
                                if (arena.dataTypes[tokens[j]] !== EnumToken.StartParensTokenType) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: tokens[k],
                                        location: options.source!.getSourceLocation(arena.getSpanStart(tokens[k])),
                                        message: `unexpected token 'not'`,
                                    });
                                    break;
                                }
                            }
                        }

                        if (
                            arena.typeOf(stack.at(-1)) === EnumToken.AndTokenType ||
                            arena.typeOf(stack.at(-1)) === EnumToken.OrTokenType
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

                            arena.setField(condition, TokenField.Op, op);
                            arena.setField(condition, TokenField.L, ...left);
                            arena.setField(condition, TokenField.R, ...right);

                            if (left.length > 0 && right.length > 0) {
                                arena.spanLocation(condition, left[0], right[right.length - 1]);
                            }

                            tokens[l] = condition;
                            tokens.length = l + 1;
                            expectAndOr = true;

                            if (arena.dataTypes[op] === EnumToken.AndTokenType) {
                                const notNameOrSpace = (t: Token): boolean =>
                                    arena.dataTypes[t] != EnumToken.WhitespaceTokenType &&
                                    arena.dataTypes[t] != EnumToken.IdenTokenType;
                                let leftCondition: Token | undefined = left.find(notNameOrSpace);
                                let rightCondition: Token | undefined = right.find(notNameOrSpace);

                                if (
                                    leftCondition != null &&
                                    rightCondition != null &&
                                    arena.dataTypes[leftCondition] == EnumToken.ParensTokenType &&
                                    arena.dataTypes[rightCondition] == EnumToken.ParensTokenType
                                ) {
                                    leftCondition = arena.tokens(leftCondition).find(notNameOrSpace);
                                    rightCondition = arena.tokens(rightCondition).find(notNameOrSpace);

                                    if (
                                        leftCondition != null &&
                                        rightCondition != null &&
                                        arena.dataTypes[leftCondition] == EnumToken.MediaQueryConditionTokenType &&
                                        arena.dataTypes[rightCondition] == EnumToken.MediaQueryConditionTokenType
                                    ) {
                                        const leftOp: Token = arena.field(leftCondition, TokenField.Op);
                                        const rightOp: Token = arena.field(rightCondition, TokenField.Op);

                                        if (
                                            (mFLT.has(arena.dataTypes[leftOp]) || mFGT.has(arena.dataTypes[leftOp])) &&
                                            (mFLT.has(arena.dataTypes[rightOp]) || mFGT.has(arena.dataTypes[rightOp]))
                                        ) {
                                            const name: Token | undefined = arena
                                                .fieldTokens(leftCondition, TokenField.L)
                                                .find((t: Token) => arena.dataTypes[t] == EnumToken.IdenTokenType);
                                            const name2: Token | undefined = arena
                                                .fieldTokens(rightCondition, TokenField.L)
                                                .find((t: Token) => arena.dataTypes[t] == EnumToken.IdenTokenType);

                                            if (
                                                name != null &&
                                                name2 != null &&
                                                equalsIgnoreCase(
                                                    arena.strings[arena.stringValue[name]],
                                                    arena.strings[arena.stringValue[name2]],
                                                )
                                            ) {
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

                                                const rangeQuery: Token = arena.createToken(EnumToken.MediaRangeQueryTokenType);

                                                arena.setField(
                                                    rangeQuery,
                                                    TokenField.L,
                                                    ...arena.fieldTokens(leftCondition, TokenField.R),
                                                );
                                                arena.setField(rangeQuery, TokenField.Val, name);
                                                arena.setField(rangeQuery, TokenField.Op, leftOp);
                                                arena.setField(rangeQuery, TokenField.Op2, rightOp);
                                                arena.setField(
                                                    rangeQuery,
                                                    TokenField.R,
                                                    ...arena.fieldTokens(rightCondition, TokenField.R),
                                                );
                                                arena.spanLocation(rangeQuery, leftCondition, rightCondition);

                                                const parens: Token = arena.createToken(EnumToken.ParensTokenType);

                                                arena.setTokens(parens, rangeQuery);
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
    stream.push(
        ...parts
            .filter((p) => p.length > 0 && arena.dataTypes[p[0]] !== EnumToken.InvalidMediaQueryTokenType)
            .reduce((acc, b) => {
                for (const token of b) {
                    acc.push(token);
                }

                return acc;
            }, []),
    );

    return {
        success:
            !hasErrors ||
            stream.filter(
                (t) =>
                    arena.dataTypes[t] !== EnumToken.WhitespaceTokenType &&
                    arena.dataTypes[t] !== EnumToken.CommentTokenType &&
                    arena.dataTypes[t] !== EnumToken.InvalidMediaQueryTokenType &&
                    arena.dataTypes[t] !== EnumToken.CommaTokenType,
            ).length !== 0,
        errors,
    };
}
