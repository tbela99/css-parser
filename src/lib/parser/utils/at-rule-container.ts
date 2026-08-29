import type {
    AstAtRule,
    AtRuleToken,
    ErrorDescription,
    FunctionToken,
    IdentToken,
    MediaQueryConditionToken,
    ParensToken,
    ParserOptions,
    Token,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { LOCEND, LOCSRCID, LOCSTA, mFGT, mFLT } from "../../syntax/constants.ts";

import { createValidationContext, matchAllSyntaxes, trimArray } from "../../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationFunctionToken, ValidationToken } from "../../validation/parser/types.d.ts";
import type { ValidationMatch } from "../../validation/types.d.ts";
import { tokensfuncDefMap } from "../../syntax/constants.ts";
import { getSyntaxRule } from "../../validation/config.ts";

export function parseAtRuleContainerQueryList(
    stream: Token[],
    context: AstAtRule | AtRuleToken,
    options: ParserOptions = {},
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    let matchCount: number = 0;
    let hasErrors: boolean = false;
    const errors: ErrorDescription[] = [];
    const syntaxRules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + context.nam);
    const syntax: ValidationToken[] = syntaxRules?.getPreludeRules()?.slice?.(1) as ValidationToken[];
    const parts = stream.reduce(
        (acc, t) => {
            if (t.typ === EnumToken.CommaTokenType && matchCount === 0) {
                acc.push([]);
            } else {
                acc[acc.length - 1].push(t);

                if (t.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(t.typ)) {
                    matchCount++;
                } else if (t.typ === EnumToken.EndParensTokenType) {
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
        syntax as ValidationFunctionToken[],
        createValidationContext(stream),
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
        for (const stream of parts.slice()) {
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
                (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType)
            ) {
                tokens.push(stream[i++]);
            }

            if (stream[i].typ === EnumToken.IdenTokenType) {
                tokens.push(stream[i++]);
            }

            while (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType) {
                tokens.push(stream[i++]);
            }

            if (
                i < stream.length &&
                stream[i]?.typ !== EnumToken.StartParensTokenType &&
                stream[i]?.typ !== EnumToken.ContainerFunctionTokenDefType
            ) {
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            node: stream[i],
                            location: options.source!.getSourceLocation(stream[i]?.[LOCSTA]!),
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
                    let valid: boolean = true;

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
                            location: options.source!.getSourceLocation(stream[i]?.[LOCSTA]!),
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
                            const val: string = (stream[i] as IdentToken).val.toLowerCase();

                            if (val === "not") {
                                Object.assign(stream[i], {
                                    typ: EnumToken.NotTokenType,
                                });

                                stack.push(stream[i]);
                            } else if (val === "and" || val === "or") {
                                Object.assign(stream[i], {
                                    typ: val === "and" ? EnumToken.AndTokenType : EnumToken.OrTokenType,
                                });

                                if (val === "or" && scopes.length <= 1) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: stream[i],
                                        location: options.source!.getSourceLocation(stream[i][LOCSTA]!),
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
                        if (
                            mFGT.has(stack.at(-1)?.typ) ||
                            mFLT.has(stack.at(-1)?.typ) ||
                            stack.at(-1)?.typ === EnumToken.DelimTokenType ||
                            stack.at(-1)?.typ === EnumToken.ColonTokenType
                        ) {
                            const funcName: string = (
                                stack[stack.length - 2] as FunctionToken
                            ).val?.toLowerCase?.() as string;

                            const index2: number = tokens.indexOf(stack.at(-1)!);
                            const index3: number = tokens.indexOf(stack.at(-2)!);

                            let names: Token[] = trimArray(tokens.slice(index3 + 1, index2));
                            let values: Token[] = trimArray(tokens.slice(index2 + 1, tokens.length - 1));

                            tokens.splice(
                                index3 + 1,
                                tokens.length - index3 - 2,

                                {
                                    typ: EnumToken.MediaQueryConditionTokenType,
                                    l: names,
                                    op: stack.pop() as Token,
                                    r: values,
                                    [LOCSRCID]: names[0][LOCSRCID],
                                    [LOCSTA]: names[0][LOCSTA],
                                    [LOCEND]: values.at(-1)![LOCEND],
                                } as MediaQueryConditionToken,
                            );

                            // check <style()> or <scroll-state()>
                        }

                        if (tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                            const index: number = tokens.indexOf(stack.at(-1)!);
                            Object.assign(tokens[index], {
                                typ: tokensfuncDefMap.get(stack.at(-1)?.typ),
                                chi: trimArray(tokens.slice(index + 1, tokens.length - 1)),
                            });

                            tokens[index][LOCSRCID] = tokens[index][LOCSRCID];
                            tokens[index][LOCSTA] = tokens[index][LOCSTA];
                            tokens[index][LOCEND] = stream[i]![LOCEND];

                            if (
                                (tokens[index] as FunctionToken).chi.every(
                                    (t) =>
                                        t.typ === EnumToken.WhitespaceTokenType || t.typ === EnumToken.CommentTokenType,
                                )
                            ) {
                                success = false;
                                errors.push({
                                    action: "drop",
                                    node: stream[i],
                                    location: options.source!.getSourceLocation(stream[i]?.[LOCSTA]!),
                                    message: `expecting '<${(tokens[index] as FunctionToken).val}-query>'`,
                                });
                                break;
                            }

                            tokens.length = index + 1;

                            stack.pop();
                            scopes.pop();
                            currentScope = scopes.at(-1)!;
                        } else {
                            const index: number = tokens.indexOf(stack.at(-1)!);
                            tokens[index] = {
                                typ: EnumToken.ParensTokenType,
                                chi: tokens.slice(index + 1, tokens.length - 1),
                                [LOCSRCID]: tokens[index][LOCSRCID],
                                [LOCSTA]: tokens[index][LOCSTA],
                                [LOCEND]: stream[i]![LOCEND],
                            } as ParensToken;

                            if (
                                (tokens[index] as ParensToken).chi.every(
                                    (t) =>
                                        t.typ === EnumToken.WhitespaceTokenType || t.typ === EnumToken.CommentTokenType,
                                )
                            ) {
                                success = false;
                                errors.push({
                                    action: "drop",
                                    node: stream[i],
                                    location: options.source!.getSourceLocation(stream[i]?.[LOCSTA]!),
                                    message: `expecting '<query-in-parens>'`,
                                });
                                break;
                            }

                            tokens.length = index + 1;
                            scopes.pop();
                            currentScope = scopes.at(-1)!;
                            stack.pop();
                        }

                        if (stack.at(-1)?.typ === EnumToken.NotTokenType) {
                            let j: number = tokens.indexOf(stack.at(-1)!);
                            let k: number = j;

                            while (
                                j-- &&
                                (tokens[j]?.typ === EnumToken.WhitespaceTokenType ||
                                    tokens[j]?.typ === EnumToken.CommentTokenType)
                            ) {}

                            if (j >= 0) {
                                if (tokens[j]?.typ !== EnumToken.StartParensTokenType) {
                                    success = false;
                                    errors.push({
                                        action: "drop",
                                        node: tokens[k],
                                        location: options.source!.getSourceLocation(tokens[k]?.[LOCSTA]!),
                                        message: `unexpected token 'not'`,
                                    });
                                    break;
                                }
                            }
                        }

                        if (
                            stack.at(-1)?.typ === EnumToken.AndTokenType ||
                            stack.at(-1)?.typ === EnumToken.OrTokenType
                        ) {
                            const index = tokens.indexOf(stack.at(-1)!);
                            let l: number = index - 1;

                            while (
                                l > 0 &&
                                (tokens[l].typ === EnumToken.WhitespaceTokenType ||
                                    tokens[l].typ === EnumToken.CommentTokenType)
                            ) {
                                l--;
                            }

                            const left: Token[] = trimArray(tokens.slice(l, index));
                            const right: Token[] = trimArray(tokens.slice(index + 1));

                            tokens[l] = {
                                typ: EnumToken.MediaQueryConditionTokenType,
                                op: stack.pop()!,
                                l: left,
                                r: right,
                                [LOCSRCID]: left[0][LOCSRCID],
                                [LOCSTA]: left[0][LOCSTA],
                                [LOCEND]: right.at(-1)![LOCEND],
                            } as MediaQueryConditionToken;

                            tokens.length = l + 1;

                            expectAndOr = true;
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
    stream.push(
        ...parts
            .filter((p) => p.length > 0 && p[0].typ !== EnumToken.InvalidMediaQueryTokenType)
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
                    t.typ !== EnumToken.WhitespaceTokenType &&
                    t.typ !== EnumToken.CommentTokenType &&
                    t.typ !== EnumToken.InvalidMediaQueryTokenType &&
                    t.typ !== EnumToken.CommaTokenType,
            ).length !== 0,
        errors,
    };
}
