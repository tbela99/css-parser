import type {
    AstAtRule,
    AstDeclaration,
    AstRule,
    AstStyleSheet,
    AtRuleToken,
    ErrorDescription,
    FunctionToken,
    IdentToken,
    ParserOptions,
    Token,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { getSyntaxRule } from "../../validation/config.ts";
import { trimArray } from "../../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationToken } from "../../validation/parser/types.d.ts";
import { LOC, tokensfuncDefMap } from "../../syntax/constants.ts";
import { definedPropertySettings } from "../../syntax/constants.ts";
import { isColor, parseColor } from "../../syntax/syntax.ts";
import { parseMediaqueryList } from "./at-rule-media.ts";
import { parseAtRuleSupportSyntax } from "./at-rule-support.ts";

export function matchAtRuleImportSyntax(
    atRule: AtRuleToken,
    stream: Token[],
    context: AstRule | AstAtRule | AstStyleSheet,
    options: ParserOptions,
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    let success: boolean = true;
    let index: number = 0;
    let i: number = 0;
    let matchCount: number;
    const errors: ErrorDescription[] = [];
    const tokens: Token[] = [];
    const stack: Token[] = [];

    const prelude = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@import")!
        .getPreludeRules()!
        .slice(1) as ValidationToken[];

    trimArray(stream);

    // <string> | <url>
    if (stream[index]?.typ === EnumToken.StringTokenType) {
        tokens.push(stream[index++] as Token);
    } else if (stream[index]?.typ === EnumToken.UrlFunctionTokenDefType) {
        // match ending ')'

        let matchCount = 0;
        let k = 0;
        let stringCount = 0;
        let urlTokenCount = 0;

        for (; k < stream.length; k++) {
            if (stream[k]?.typ === EnumToken.EndParensTokenType) {
                matchCount--;
            } else if (stream[k]?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[k]?.typ)) {
                matchCount++;
            } else if (stream[k]?.typ === EnumToken.StringTokenType) {
                stringCount++;
            } else if (stream[k]?.typ === EnumToken.UrlFunctionTokenDefType) {
                urlTokenCount++;
            } else if (
                !(stream[k]?.typ === EnumToken.WhitespaceTokenType || stream[k]?.typ === EnumToken.CommentTokenType)
            ) {
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: "Expected string or <url-token>",
                            syntax: "@import",
                            node: stream[k],
                            location: stream[k]?.[LOC],
                        } as ErrorDescription,
                    ],
                };
            }

            if (matchCount === 0) {
                break;
            }
        }

        if (stringCount + urlTokenCount != 1) {
            return {
                success: false,
                errors: [
                    {
                        action: "drop",
                        syntax: "@import",
                        message: "could not match syntax <url>",
                        node: stream[0],
                        location: stream[0][LOC],
                    },
                ],
            };
        }

        const slice: Token[] = stream.slice(index + 1, k);

        // @ts-expect-error
        stream[0][LOC] = {
            ...stream[0][LOC],
            end: stream[1][LOC]!.end,
        };

        tokens.push(
            Object.assign({
                typ: tokensfuncDefMap.get(stream[0].typ),
                chi: trimArray(slice),
            }),
        );

        index = k + 1;
    } else {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    message: "Expected string or url()",
                    syntax: "@import",
                    node: stream[0],
                    location: stream[0]?.[LOC],
                } as ErrorDescription,
            ],
        };
    }

    while (
        index + 1 < prelude.length &&
        (stream[index]?.typ == EnumToken.WhitespaceTokenType || stream[index]?.typ == EnumToken.CommentTokenType)
    ) {
        tokens.push(stream[index++] as Token);
    }

    // layer | layer(<layer-name>)
    if (
        stream[index]?.typ === EnumToken.IdenTokenType &&
        "layer".localeCompare((stream[index] as IdentToken).val) === 0
    ) {
        tokens.push(stream[index++] as Token);
    } else if (
        tokensfuncDefMap.has(stream[index]?.typ) &&
        "layer".localeCompare((stream[index] as IdentToken).val) === 0
    ) {
        stack.push(stream[index] as Token);
        tokens.push(stream[index++] as Token);

        while (
            stream[index]?.typ === EnumToken.WhitespaceTokenType ||
            stream[index]?.typ === EnumToken.CommentTokenType
        ) {
            tokens.push(stream[index++] as Token);
        }

        // <layer-name">
        if (stream[index]?.typ === EnumToken.EndParensTokenType) {
            i = tokens.indexOf(stack.at(-1) as Token);
            tokens.splice(index, 1);

            return {
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: `Expected <layer-name> at ${stream[index]?.[LOC]?.src}:${stream[index]?.[LOC]?.sta.lin}:${stream[index]?.[LOC]?.sta.col}`,
                        syntax: "@import",
                        node: stream[index],
                        location: stream[index]?.[LOC],
                    } as ErrorDescription,
                ],
            };
        } else if (stream[index]?.typ === EnumToken.IdenTokenType) {
            tokens.push(stream[index++] as Token);

            while (stream[index]?.typ == EnumToken.ClassSelectorTokenType) {
                tokens.push(stream[index++] as Token);
            }

            while (
                stream[index]?.typ == EnumToken.WhitespaceTokenType ||
                stream[index]?.typ == EnumToken.CommentTokenType
            ) {
                tokens.push(stream[index++] as Token);
            }

            if (stream[index]?.typ !== EnumToken.EndParensTokenType) {
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: "Expected ')'",
                            syntax: "@import",
                            node: stream[index],
                            location: stream[index]?.[LOC],
                        } as ErrorDescription,
                    ],
                };
            }

            i = tokens.indexOf(stack.at(-1) as Token);
            tokens.splice(index, 1);

            Object.assign(stack.at(-1) as Token, {
                typ: EnumToken.FunctionTokenType,
                chi: trimArray(tokens.splice(i + 1, index++ - i - 1)),
            });

            stack.pop();
        } else {
            return {
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: `Expected <layer-name> at ${stream[index]?.[LOC]?.src}:${stream[index]?.[LOC]?.sta.lin}:${stream[index]?.[LOC]?.sta.col}`,
                        syntax: "@import",
                        node: stream[index],
                        location: stream[index]?.[LOC],
                    } as ErrorDescription,
                ],
            };
        }
    }

    while (stream[index]?.typ === EnumToken.WhitespaceTokenType || stream[index]?.typ === EnumToken.CommentTokenType) {
        tokens.push(stream[index++] as Token);
    }

    // supports([ <supports-condition> | <declaration> ] )
    if (
        index < stream.length &&
        tokensfuncDefMap.has(stream[index].typ) &&
        "supports".localeCompare((stream[index] as FunctionToken).val) === 0
    ) {
        stack.push(stream[index]);
        tokens.push(stream[index++] as Token);

        matchCount = 1;
        let isDecl: boolean = false;

        while (
            stream[index]?.typ === EnumToken.WhitespaceTokenType ||
            stream[index]?.typ === EnumToken.CommentTokenType
        ) {
            tokens.push(stream[index++] as Token);
        }

        // <declaration>
        if (
            stream[index]?.typ === EnumToken.IdenTokenType &&
            !["and", "or", "not", "only"].includes((stream[index] as IdentToken).val.toLowerCase())
        ) {
            tokens.push(stream[index++] as Token);

            while (
                stream[index]?.typ === EnumToken.WhitespaceTokenType ||
                stream[index]?.typ === EnumToken.CommentTokenType
            ) {
                tokens.push(stream[index++] as Token);
            }

            if (stream[index]?.typ !== EnumToken.ColonTokenType) {
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            message: "Expected ':'",
                            syntax: "@import",
                            node: stream[index],
                            location: stream[index]?.[LOC],
                        } as ErrorDescription,
                    ],
                };
            } else {
                isDecl = true;
                tokens.push(stream[index++] as Token);

                // match the next ')'
                while (index < stream.length && matchCount > 0) {
                    if (
                        stream[index]?.typ === EnumToken.StartParensTokenType ||
                        tokensfuncDefMap.has(stream[index]?.typ)
                    ) {
                        matchCount++;
                        // stack.push(stream[index] as Token);
                    } else if (stream[index]?.typ === EnumToken.EndParensTokenType) {
                        matchCount--;

                        if (matchCount === 0) {
                            i = tokens.indexOf(stack.at(-1) as Token);
                            tokens.splice(index, 1);

                            Object.assign(stack.at(-1) as Token, {
                                typ: tokensfuncDefMap.get((stack.at(-1) as Token).typ),
                                chi: trimArray(tokens.splice(i + 1, index++ - i - 1)),
                            });

                            stack.pop();
                            break;
                        }
                    } else if (stream[index]?.typ === EnumToken.ImportantTokenType) {
                        tokens.push(stream[index++] as Token);

                        while (
                            stream[index]?.typ === EnumToken.WhitespaceTokenType ||
                            stream[index]?.typ === EnumToken.CommentTokenType
                        ) {
                            tokens.push(stream[index++] as Token);
                        }

                        // next token is ')'
                        if (stream[index]?.typ !== EnumToken.EndParensTokenType) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: "Expected ')'",
                                        syntax: "@import",
                                        node: stream[index],
                                        location: stream[index]?.[LOC],
                                    } as ErrorDescription,
                                ],
                            };
                        }

                        matchCount--;
                        i = tokens.indexOf(stack.at(-1) as Token);
                        tokens.splice(index, 1);

                        Object.assign(stack.at(-1) as Token, {
                            typ: tokensfuncDefMap.get((stack.at(-1) as Token).typ),
                            chi: trimArray(tokens.splice(i + 1, index++ - i - 1)),
                        });

                        stack.pop();
                        break;
                    }

                    tokens.push(stream[index++] as Token);
                }
            }
        }
        // <supports-condition>
        else {
            // match the next ')'
            while (index < stream.length && matchCount > 0) {
                if (stream[index]?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[index]?.typ)) {
                    matchCount++;
                } else if (stream[index]?.typ === EnumToken.EndParensTokenType) {
                    matchCount--;
                    if (matchCount === 0) {
                        tokens.splice(index, 1);
                        i = tokens.indexOf(stack.at(-1) as Token);

                        Object.assign(stack.at(-1) as Token, {
                            typ: tokensfuncDefMap.get((stack.at(-1) as Token)!.typ),
                            chi: trimArray(tokens.splice(i + 1, index++ - i - 1)),
                        });

                        stack.pop();

                        break;
                    }
                }

                tokens.push(stream[index++] as Token);
            }
        }

        if (matchCount > 0) {
            return {
                success: false,
                errors: [
                    {
                        action: "drop",
                        message: "unmatched ')'",
                        syntax: "@import",
                        node: stack.at(-1),
                        location: stack.at(-1)?.[LOC],
                    } as ErrorDescription,
                ],
            };
        }

        // support() is the last item in tokens array
        if (isDecl) {
            const supports = tokens.at(-1) as FunctionToken;

            for (i = 0; i < supports.chi.length; i++) {
                if (supports.chi[i].typ === EnumToken.IdenTokenType) {
                    break;
                }
            }

            let j: number = i + 1;

            while (j < supports.chi.length && supports.chi[j].typ !== EnumToken.ColonTokenType) {
                j++;
            }

            const val = trimArray(supports.chi.slice(j + 1));
            supports.chi[i] = {
                typ: EnumToken.DeclarationNodeType,
                nam: (supports.chi[i] as IdentToken).val,
                val,
                [LOC]: {
                    ...supports.chi[i][LOC],
                    end: { ...(val.at(-1) ?? (supports.chi.at(-1) as Token))[LOC]?.end },
                },
            } as AstDeclaration;

            supports.chi.splice(i + 1, j - i + 1 + val.length);
            const stack = [] as Token[];

            for (i = 0; i < val.length; i++) {
                if (val[i].typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(val[i].typ)) {
                    stack.push(val[i]);
                } else if (val[i].typ === EnumToken.EndParensTokenType) {
                    const index = val.indexOf(stack.at(-1) as Token);
                    val.splice(i, 1);

                    Object.assign(stack.at(-1) as Token, {
                        typ: tokensfuncDefMap.get((stack.at(-1) as Token)!.typ),
                        chi: trimArray(val.splice(index + 1, i - index - 1)),
                    });

                    i = index;
                    stack.pop();
                }

                if (isColor(val[i])) {
                    val[i] = parseColor(val[i]);
                }
            }
        } else {
            const result = parseAtRuleSupportSyntax(
                (tokens[tokens.length - 1] as FunctionToken).chi,
                context as AstAtRule,
                options,
            );
            if (!result.success && result.errors.length > 0) {
                errors.push(...result.errors);

                return {
                    success: false,
                    errors,
                };
            }
        }
    }

    const splice = stream.splice(index, stream.length - index);
    const sliced = parseMediaqueryList(splice, options);

    tokens.push(...splice);

    if (sliced.errors.length > 0) {
        errors.push(...sliced.errors);
    }

    if (!sliced.success) {
        success = false;
    }

    stream.length = 0;
    stream.push(...trimArray(tokens));

    return {
        success,
        errors,
    };
}
