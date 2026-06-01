import type {
    Token,
    AstAtRule,
    ParserOptions,
    ErrorDescription,
    IdentToken,
    FunctionToken,
    SupportsQueryUnaryConditionToken,
    SupportsQueryConditionToken,
    AtRuleToken,
    DashedIdentToken,
} from "../../../@types/index.d.ts";
import { EnumToken, ValidationLevel } from "../../ast/types.ts";
import { renderToken } from "../../renderer/render.ts";
import { definedPropertySettings, trimTokenSpace } from "../../syntax/constants.ts";
import { getParsedSyntax } from "../../validation/config.ts";
import { trimArray, matchAllSyntax, createValidationContext } from "../../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationFunctionToken, ValidationToken } from "../../validation/parser/types.d.ts";
import { tokensfuncDefMap, tokensfuncSet } from "../../syntax/constants.ts";
import { parseDeclaration } from "./declaration.ts";
import { equalsIgnoreCase } from "./text.ts";

export function parseAtRuleSupportSyntax(
    stream: Token[],
    context: AstAtRule | AtRuleToken,
    options: ParserOptions = {},
): { success: boolean; errors: ErrorDescription[] } {
    const tokens: Token[] = [];
    const stack: Token[] = [];

    let i: number = 0;
    let success: boolean = true;
    let expectAndOr: boolean = false;
    let scope: Set<EnumToken> = new Set();
    const errors: ErrorDescription[] = [];
    const scopes: Array<Set<EnumToken>> = [scope];
    const trimWhiteSpace: Set<EnumToken> = new Set([
        EnumToken.GtTokenType,
        EnumToken.ChildCombinatorTokenType,
        EnumToken.NextSiblingCombinatorTokenType,
        EnumToken.SubsequentSiblingCombinatorTokenType,
        EnumToken.ColumnCombinatorTokenType,
        EnumToken.UniversalSelectorTokenType,
    ]);

    while (
        i < stream.length &&
        (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType)
    ) {
        tokens.push(stream[i]);
        i++;
    }

    if (
        !tokensfuncDefMap.has(stream[i]?.typ) &&
        stream[i]?.typ !== EnumToken.StartParensTokenType &&
        !(stream[i]?.typ === EnumToken.IdenTokenType && "not" === (stream[i] as IdentToken)?.val.toLowerCase())
    ) {
        return {
            success,
            errors: [
                {
                    action: "drop",
                    node: stream[i],
                    message: `expecting '<supports-condition>' at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                },
            ],
        };
    }

    for (; i < stream.length; i++) {
        tokens.push(stream[i]);

        if (trimWhiteSpace.has(stream[i].typ)) {
            if (tokens.at(-2)?.typ === EnumToken.WhitespaceTokenType) {
                tokens.splice(tokens.length - 2, 1);
            }

            if (stream[i + 1]?.typ === EnumToken.WhitespaceTokenType) {
                i++;
                continue;
            }
        }

        if (expectAndOr) {
            let k: number = i;
            while (
                k < stream.length &&
                (stream[k]?.typ === EnumToken.WhitespaceTokenType || stream[k]?.typ === EnumToken.CommentTokenType)
            ) {
                tokens.push(stream[k]);
                k++;
            }

            if (k < stream.length) {
                if (
                    stream[k].typ !== EnumToken.EndParensTokenType &&
                    !(
                        stream[k].typ === EnumToken.IdenTokenType &&
                        ("and" === (stream[k] as IdentToken)?.val.toLowerCase() ||
                            "or" === (stream[k] as IdentToken)?.val.toLowerCase())
                    )
                ) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                node: stream[k],
                                message: `expecting 'and' or 'or' at ${stream[k]?.loc?.src}:${stream[k]?.loc?.sta.lin}:${stream[k]?.loc?.sta.col}`,
                            },
                        ],
                    };
                }
            }

            expectAndOr = false;
        }

        if (stream[i].typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[i].typ)) {
            scopes.push((scope = new Set<EnumToken>()));
            stack.push(stream[i]);
            continue;
        }

        switch (stream[i].typ) {
            case EnumToken.EndParensTokenType:
                {
                    if (stack.length === 0) {
                        return {
                            success: false,
                            errors: [
                                {
                                    action: "drop",
                                    node: stream[i],
                                    message: `unmatched ')' at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                                },
                            ],
                        };
                    }

                    if (stack[stack.length - 1].typ === EnumToken.ColonTokenType) {
                        if (tokensfuncDefMap.has(stack[stack.length - 2]?.typ)) {
                            const index: number = tokens.indexOf(stack[stack.length - 1]);

                            // expecting ident or dashed ident
                            if (
                                tokens[index + 1]?.typ == EnumToken.IdenTokenType ||
                                tokens[index + 1]?.typ == EnumToken.DashedIdenTokenType
                            ) {
                                Object.assign(tokens[index], {
                                    typ: EnumToken.PseudoElementTokenType,
                                    val: ":" + (tokens[index + 1] as IdentToken | DashedIdentToken).val,
                                });

                                tokens[index].loc!.end = tokens[index + 1].loc!.end;
                                tokens.splice(index + 1, 1);
                                stack.pop();

                                const index2: number = tokens.indexOf(stack[stack.length - 1]);
                                const result = matchAllSyntax(
                                    (
                                        getParsedSyntax(
                                            ValidationSyntaxGroupEnum.Syntaxes,
                                            (tokens[index2] as FunctionToken).val + "()",
                                        ) as ValidationFunctionToken[]
                                    )[0]?.chi as ValidationToken[],
                                    createValidationContext(tokens.slice(index2 + 1, -1)),
                                    options,
                                );

                                if (!result.success) {
                                    return {
                                        success: false,
                                        errors: result.errors,
                                    };
                                }

                                tokens.pop();
                                Object.assign(tokens[index2], {
                                    typ: tokensfuncDefMap.get(tokens[index2].typ)!,
                                    chi: tokens.splice(index2 + 1, tokens.length - index2 - 1),
                                });

                                tokens[index2].loc!.end = stream[i].loc!.end;

                                stack.pop();
                                break;
                            }
                        }

                        if (stack[stack.length - 2]?.typ !== EnumToken.StartParensTokenType) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: stream[i],
                                        message: `unmatched ')' at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        // match declaration
                        const index: number = tokens.indexOf(stack[stack.length - 2]);

                        const slice: Token[] = trimArray(tokens.splice(index + 1, tokens.length - index - 2));

                        const declaration = parseDeclaration(
                            slice,
                            context,
                            { ...options, validation: ValidationLevel.None },
                            errors,
                        );

                        if (declaration.typ !== EnumToken.DeclarationNodeType) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: declaration,
                                        message: `invalid declaration at ${declaration?.loc?.src}:${declaration?.loc?.sta.lin}:${declaration?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        tokens.splice(index + 1, 0, declaration);
                        stack.pop();
                    }

                    // match <support-condition-name>
                    // @supports (--condition-name) {}
                    if (stack.at(-1)?.typ === EnumToken.StartParensTokenType) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        const slice: Token[] = trimArray(tokens.splice(index + 1, tokens.length - index - 2));

                        const filtered: Token[] = slice.filter((token) => {
                            return (
                                token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType
                            );
                        });

                        if (
                            filtered.length !== 1 ||
                            !(
                                trimTokenSpace.has(filtered[0].typ) ||
                                tokensfuncDefMap.has(filtered[0].typ) ||
                                tokensfuncSet.has(filtered[0].typ)
                            )
                        ) {
                            const token = filtered[0] ?? slice[0] ?? stream[i];
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: token,
                                        message: `expecting '<${filtered[0]?.typ === EnumToken.IdenTokenType ? "supports-condition-name" : "supports-condition"}>' at ${token?.loc?.src}:${token?.loc?.sta.lin}:${token?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        tokens[index] = Object.defineProperty(
                            {
                                typ: EnumToken.ParensTokenType,
                                chi: slice,
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: { ...stack.at(-1)!.loc, end: { ...stream[i]?.loc?.end } },
                            },
                        );

                        stack.pop();
                        tokens.pop();

                        scopes.pop();
                        scope = scopes[scopes.length - 1];

                        expectAndOr = true;
                    } else if (tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        tokens[index] = Object.defineProperty(
                            {
                                typ: tokensfuncDefMap.get(stack.at(-1)?.typ)!,
                                val: (stack.at(-1) as FunctionToken)!.val,
                                chi: trimArray(tokens.splice(index + 1, tokens.length - index - 2)),
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: { ...stack.at(-1)!.loc, end: { ...stream[i]?.loc?.end } },
                            },
                        ) as FunctionToken;

                        //
                        let k: number = stack.length - 1;

                        while (tokensfuncDefMap.has(stack[k]?.typ)) {
                            k--;
                        }

                        if (stack[k]?.typ !== EnumToken.ColonTokenType) {
                            if (tokens[index].typ !== EnumToken.SupportsFunctionTokenType && !equalsIgnoreCase('env', (tokens[index] as FunctionToken).val)) {

                                errors.push({
                                    action: "ignore",
                                    node: tokens[index],
                                    message: `expecting <supports-selector-fn>, <supports-env-fn>, <font-tech()>, <font-format()>, <at-rule()> or <named-feature()> at ${tokens[index]?.loc?.src}:${tokens[index]?.loc?.sta.lin}:${tokens[index]?.loc?.sta.col}`,
                                });
                            } else {
                                // not a declaration
                                const result = matchAllSyntax(
                                    (
                                        getParsedSyntax(
                                            ValidationSyntaxGroupEnum.Syntaxes,
                                            (tokens[index] as FunctionToken).val + "()",
                                        ) as ValidationFunctionToken[]
                                    )?.[0]?.chi as ValidationToken[],
                                    createValidationContext((tokens[index] as FunctionToken).chi as Token[]),
                                    options,
                                );

                                if (!result.valid) {
                                    errors.push(...result.errors, {
                                        action: "ignore",
                                        node: tokens[index],
                                        message: `missing syntax for function '${(tokens[index] as FunctionToken).val}()' at ${tokens[index]?.loc?.src}:${tokens[index]?.loc?.sta.lin}:${tokens[index]?.loc?.sta.col}`,
                                    });
                                } else if (!result.success) {
                                    return {
                                        success: false,
                                        errors: result.errors,
                                    };
                                }
                            }
                        }

                        stack.pop();
                        tokens.pop();

                        scopes.pop();
                        scope = scopes[scopes.length - 1];
                    }

                    if (stack.at(-1)?.typ === EnumToken.NotTokenType) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        tokens[index] = Object.defineProperty(
                            {
                                typ: EnumToken.SupportsQueryUnaryConditionTokenType,
                                l: stack.at(-1),
                                r: trimArray(tokens.splice(index + 1, i - index - 1)),
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: { ...stack.at(-1)!.loc, end: { ...stream[i]?.loc?.end } },
                            },
                        ) as SupportsQueryUnaryConditionToken;

                        stack.pop();
                    }

                    if (stack.at(-1)?.typ === EnumToken.AndTokenType || stack.at(-1)?.typ === EnumToken.OrTokenType) {
                        //
                        if (stack.length > 1 && stack.at(-2)?.typ !== EnumToken.StartParensTokenType) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: stack.at(-2),
                                        message: `expecting '(' at ${stack.at(-2)?.loc?.src}:${stack.at(-2)?.loc?.sta.lin}:${stack.at(-2)?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        const index: number = tokens.indexOf(stack.at(-1)!);
                        const index2: number = stack.length > 1 ? tokens.indexOf(stack.at(-2)!) + 1 : 0;

                        const left: Token[] = trimArray(tokens.slice(index2, index));
                        const notToken = left.find(
                            (t) =>
                                t.typ === EnumToken.SupportsQueryUnaryConditionTokenType &&
                                (t as SupportsQueryUnaryConditionToken).l.typ === EnumToken.NotTokenType,
                        );

                        if (notToken != null) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: stack.at(-1),
                                        message: `unexpected token after 'not' expression at ${stack.at(-1)?.loc?.src}:${stack.at(-1)?.loc?.sta.lin}:${stack.at(-1)?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        tokens[index2] = Object.defineProperty(
                            {
                                typ: EnumToken.SupportsQueryConditionTokenType,
                                op: stack.at(-1)!,
                                l: left,
                                r: trimArray(tokens.slice(index + 1)),
                            },
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: { ...stack.at(-1)!.loc, end: { ...stream[i]?.loc?.end } },
                            },
                        ) as SupportsQueryConditionToken;
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
                    const val = (stream[i] as IdentToken).val.toLowerCase();
                    if ("not" === val) {
                        stack.push(stream[i]);
                        Object.assign(stream[i], { typ: EnumToken.NotTokenType });
                        break;
                    }

                    if ("and" === val || "or" === val) {
                        if (scope.has("or" === val ? EnumToken.AndTokenType : EnumToken.OrTokenType)) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `mixing <and> and <or> at the same level is not allowed at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        if ("or" === val && scopes.length === 1) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `<or> is not allowed outside of a parenthesis at ${stream[i]?.loc?.src}:${stream[i]?.loc?.sta.lin}:${stream[i]?.loc?.sta.col}`,
                                    },
                                ],
                            };
                        }

                        Object.assign(stream[i], {
                            typ: "or" === val ? EnumToken.OrTokenType : EnumToken.AndTokenType,
                        });

                        scope.add(stream[i].typ);
                        stack.push(stream[i]);
                        break;
                    }
                }

                break;
        }
    }

    if (stack.length > 0) {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    node: stack.at(-1),
                    message: `unmatched token '${renderToken(stack.at(-1) as Token)}' at ${stack.at(-1)!.loc!.src}:${stack.at(-1)!.loc!.sta.lin}:${stack.at(-1)!.loc!.sta.col}`,
                },
            ],
        };
    }

    stream.length = 0;
    stream.push(...trimArray(tokens));

    return { success, errors };
}
