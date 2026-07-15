import type {
    AstAtRule,
    AstDeclaration,
    AstKeyFrameRule,
    AstNode,
    AstRule,
    AstStyleSheet,
    AtRuleToken,
    ClassSelectorToken,
    ComposesSelectorToken,
    DashedIdentToken,
    ErrorDescription,
    FunctionToken,
    HashToken,
    IdentToken,
    IfConditionToken,
    IfElseConditionToken,
    LiteralToken,
    ParserOptions,
    RawNodeToken,
    StringToken,
    Token,
    UrlToken,
} from "../../../@types/index.d.ts";
import { ColorType, EnumAstNodeStatus, EnumToken, ValidationLevel } from "../../ast/types.ts";
import {
    nonStandardColors,
    systemColors,
    deprecatedSystemColors,
    COLORS_NAMES,
    tokensMap,
    definedPropertySettings,
    trimTokenSpace,
    LOC,
    PARENT,
    ERRORS,
    STATE,
} from "../../syntax/constants.ts";
import { isColor, isValue, isWhiteSpace, parseColor, renamedStandardProperties } from "../../syntax/syntax.ts";
import { getSyntaxRule, getParsedSyntax, ValidationSyntaxRule } from "../../validation/config.ts";
import { matchAllSyntaxes, createValidationContext, trimArray } from "../../validation/match.ts";
import type { ValidationMatch } from "../../validation/types.d.ts";
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from "../../validation/parser/typedef.ts";
import { tokensfuncDefMap } from "../../syntax/constants.ts";
import { walkValues } from "../../ast/walk.ts";
import type { ValidationPropertyToken } from "../../validation/parser/types.d.ts";
import { equalsIgnoreCase } from "./text.ts";
import { buildExpression } from "../../ast/math/expression.ts";
import { splitTokenList } from "../../validation/utils/list.ts";
import type { Location } from "../../../@types/ast.d.ts";

/**
 *
 * @param template
 * @returns
 */
function parseGridTemplate(template: string): string {
    let result: string = "";
    let buffer: string = "";

    for (let i = 0; i < template.length; i++) {
        const char: string = template[i];

        if (isWhiteSpace(<number>char.charCodeAt(0))) {
            while (i + 1 < template.length && isWhiteSpace(<number>template[i + 1].charCodeAt(0))) {
                i++;
            }

            result += buffer + " ";
            buffer = "";
        } else if (char == ".") {
            while (i + 1 < template.length && template[i + 1] == ".") {
                i++;
            }

            if (isWhiteSpace(<number>result.at(-1)?.charCodeAt(0))) {
                result = result.slice(0, -1);
            }

            result += buffer + char;
            buffer = "";
        } else {
            buffer += char;
        }
    }

    return buffer.length > 0 ? result + buffer : result;
}

/**
 *
 * @param tokens
 * @returns
 */
export function isDeclarationValue(tokens: Token[]): { success: boolean; errors: ErrorDescription[] } {
    const stack: Token[] = [];
    let i: number = 0;

    for (; i < tokens.length; i++) {
        if (tokens[i].typ === EnumToken.WhitespaceTokenType || tokens[i].typ === EnumToken.CommentTokenType) {
            continue;
        } else if (tokensfuncDefMap.has(tokens[i].typ) || tokens[i].typ === EnumToken.StartParensTokenType) {
            stack.push(tokens[i]);
        } else if (tokens[i].typ === EnumToken.CommaTokenType || tokens[i].typ === EnumToken.LiteralTokenType) {
            stack.push(tokens[i]);
        } else if (isValue(tokens[i])) {
            if (stack.at(-1)?.typ === EnumToken.LiteralTokenType) {
                stack.pop();
            }
        } else if (tokens[i].typ === EnumToken.EndParensTokenType) {
            if (stack.at(-1)?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                stack.pop();
            }
        }
    }

    return {
        success: stack.length === 0,
        errors:
            stack.length > 0
                ? [
                      {
                          action: "drop",
                          message: `unexpected declaration value at ${stack.at(-1)?.[LOC]?.src}:${stack.at(-1)?.[LOC]?.sta.lin}:${stack.at(-1)?.[LOC]?.sta.col}`,
                          node: stack.at(-1),
                          location: stack.at(-1)?.[LOC],
                      },
                  ]
                : [],
    };
}

/**
 * Parse declaration
 * @param tokens
 * @param parent
 * @param options
 * @param errors
 */

export function parseDeclaration(
    tokens: Token[],
    parent: AstRule | AstAtRule | AstKeyFrameRule | AstStyleSheet | AtRuleToken | null,
    options: ParserOptions,
    errors: ErrorDescription[],
): AstDeclaration | RawNodeToken {
    const name = tokens.shift() as IdentToken | DashedIdentToken;
    let i: number;
    let rules: ValidationSyntaxRule | null = null;
    let syntaxRules = null;
    let success: boolean = true;

    let validate = typeof options.validation === "boolean" ? options.validation : !!options.validation;

    if (renamedStandardProperties.has(name.val)) {
        name.val = renamedStandardProperties.get(name.val) as string;
    }

    for (i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (
            token.typ == EnumToken.WhitespaceTokenType ||
            token.typ == EnumToken.CommentTokenType ||
            token.typ == EnumToken.InvalidCommentTokenType
        ) {
            continue;
        }

        break;
    }

    if (
        (name.typ !== EnumToken.IdenTokenType && name.typ !== EnumToken.DashedIdenTokenType) ||
        tokens[i]?.typ !== EnumToken.ColonTokenType
    ) {
        name[LOC] = {
            ...name[LOC],
            end: tokens[tokens.length - 1]?.[LOC]?.end ?? name[LOC]!.end,
        } as Location;
        name[STATE] = EnumAstNodeStatus.Unparsed;
        name[ERRORS] = [
            {
                action: "drop",
                node: name,
                location: name[LOC],
                message: "invalid declaration",
            },
        ];

        return Object.assign({
            typ: EnumToken.RawNodeTokenType,
            val: tokens,
        }) as RawNodeToken;
    }

    tokens = trimArray(tokens.slice(i + 1));

    for (i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (
            token.typ == EnumToken.WhitespaceTokenType ||
            token.typ == EnumToken.CommentTokenType ||
            token.typ == EnumToken.InvalidCommentTokenType
        ) {
            continue;
        }

        if (tokens[i].typ === EnumToken.UrlFunctionTokenDefType) {
            let k: number = i;

            while (k < tokens.length) {
                if (
                    tokens[++k]?.typ === EnumToken.WhitespaceTokenType ||
                    tokens[k]?.typ === EnumToken.CommentTokenType
                ) {
                    continue;
                }

                if (tokens[k]?.typ !== EnumToken.EndParensTokenType) {
                    break;
                }
            }

            if (
                tokens[k].typ === EnumToken.LiteralTokenType ||
                tokens[k].typ === EnumToken.IdenTokenType ||
                tokens[k].typ === EnumToken.DashedIdenTokenType ||
                tokens[k].typ === EnumToken.HashTokenType ||
                tokens[k].typ === EnumToken.ClassSelectorTokenType
            ) {
                let j: number = k;
                let val: string = (tokens[k] as LiteralToken | IdentToken | DashedIdentToken | HashToken).val;

                while (j + 1 < tokens.length) {
                    if (
                        tokens[++j].typ !== EnumToken.LiteralTokenType &&
                        tokens[j].typ !== EnumToken.IdenTokenType &&
                        tokens[j].typ !== EnumToken.DashedIdenTokenType &&
                        tokens[j].typ !== EnumToken.HashTokenType &&
                        tokens[j].typ !== EnumToken.ClassSelectorTokenType
                    ) {
                        break;
                    }

                    val += (tokens[j] as LiteralToken | IdentToken | DashedIdentToken | HashToken).val;
                }

                Object.assign(tokens[k] as LiteralToken | IdentToken | DashedIdentToken | HashToken, {
                    typ: EnumToken.UrlTokenTokenType,
                    val,
                });

                tokens[k][LOC]!.end = tokens[j][LOC]!.end;
                tokens.splice(k + 1, j - k - 1);
            }
        }
    }

    if (validate && name.typ === EnumToken.IdenTokenType) {
        if (
            parent != null &&
            parent.typ === EnumToken.AtRuleNodeType &&
            parent.nam != "import" &&
            parent.nam != "supports" &&
            parent.nam != "media"
        ) {
            // check @at-rule description
            // pick up the syntax or reject immediately

            // else do this
            rules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + parent.nam);

            if (rules != null) {
                const propertyDescriptors = rules.getPropertyDescriptors();

                if (propertyDescriptors != null) {
                    syntaxRules = propertyDescriptors[name.val.toLowerCase()];
                } else {
                    syntaxRules =
                        rules.acceptAnyDeclaration && rules.acceptAnyRule
                            ? getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, name.val.toLowerCase())
                            : rules.getBlockRules();

                    if (syntaxRules == null) {
                        // check rule in nested context
                        let pr = parent[PARENT] as AstNode | null;

                        while (pr != null && pr.typ !== EnumToken.RuleNodeType) {
                            pr = pr[PARENT];
                        }

                        if (pr != null) {
                            syntaxRules = getParsedSyntax(
                                ValidationSyntaxGroupEnum.Declarations,
                                name.val.toLowerCase(),
                            );
                        }

                        if (syntaxRules == null) {
                            errors.push({
                                action: "drop",
                                message: "declaration not allowed in context",
                                node: name,
                                location: name[LOC],
                            });

                            name[LOC] = {
                                ...name[LOC],
                                end: tokens[tokens.length - 1][LOC]!.end,
                            } as Location;

                            name[STATE] = EnumAstNodeStatus.Disallowed;
                            name[ERRORS] = [errors[errors.length - 1]];

                            return Object.assign(name, {
                                typ: EnumToken.DeclarationNodeType,
                                nam: name.val,
                                val: tokens,
                            }) as AstDeclaration;
                        }
                    }
                }
            }
        } else {
            syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, name.val.toLowerCase());
        }

        // <declaration-list> or <declaration-rule-list>
        // else
        if (
            syntaxRules == null ||
            (syntaxRules.length === 1 &&
                syntaxRules[0].typ === ValidationTokenEnum.PropertyType &&
                ((syntaxRules[0] as ValidationPropertyToken).val === "declaration-list" ||
                    (syntaxRules[0] as ValidationPropertyToken).val === "declaration-rule-list"))
        ) {
            if (
                parent?.typ === EnumToken.AtRuleNodeType &&
                (parent.nam === "swash" ||
                    parent.nam === "annotation" ||
                    parent.nam === "ornaments" ||
                    parent.nam === "stylistic" ||
                    parent.nam === "historical-forms")
            ) {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident");
            } else if (parent?.typ === EnumToken.AtRuleNodeType && parent.nam === "styleset") {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident-list");
            } else if (parent?.typ === EnumToken.AtRuleNodeType && parent.nam === "character-variant") {
                syntaxRules = getParsedSyntax(
                    ValidationSyntaxGroupEnum.Syntaxes,
                    "font-feature-custom-ident-character-variant",
                );
            } else {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, name.val.toLowerCase());
            }
        }
    }

    if (tokens.length === 0 && name.typ !== EnumToken.DashedIdenTokenType) {
        errors.push({
            action: "drop",
            message: "declaration value missing",
            node: name,
            location: name[LOC],
        });

        name[LOC] = {
            ...name[LOC],
            end: tokens[tokens.length - 1]?.[LOC]!.end ?? name[LOC]!.end,
        } as Location;
        name[STATE] = EnumAstNodeStatus.Invalid;
        name[ERRORS] = [errors[errors.length - 1]];
        return Object.assign(name, {
            typ: EnumToken.DeclarationNodeType,
            nam: name.val,
            val: tokens,
        }) as AstDeclaration;
    }

    const stack: Token[] = [];

    let result: ValidationMatch | null = null;
    let token: Token;
    let index: number;

    if (syntaxRules != null) {
        const doNotValidate: boolean = options.validation === false || options.validation === ValidationLevel.None;
        result = doNotValidate ? null : matchAllSyntaxes(syntaxRules, createValidationContext(tokens), options);

        if (doNotValidate || result != null) {
            success = doNotValidate || (result?.success as boolean);

            if (success) {
                for (const { value } of walkValues(tokens)) {
                    if (value.typ === EnumToken.IdenTokenType && isColor(value)) {
                        parseColor(value);
                    } else if (value.typ === EnumToken.ColorTokenType) {
                        if (isColor(value)) {
                            parseColor(value);
                        }
                    }
                }
            }

            if (!doNotValidate && !result?.success && result!.errors!.length > 0) {
                errors.push(...result!.errors);
            }
        }
    }

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];

        if (tokensfuncDefMap.has(token.typ) || token.typ == EnumToken.StartParensTokenType) {
            stack.push(token);
            continue;
        }

        switch (token.typ) {
            case EnumToken.IdenTokenType:
                if (tokens[i + 1]?.typ == EnumToken.StartParensTokenType) {
                    Object.assign(token, {
                        typ: EnumToken.FunctionTokenDefType,
                    });

                    token[LOC]!.end = tokens[i + 1][LOC]!.end;
                    tokens.splice(i + 1, 1);

                    stack.push(token);
                }

                break;

            case EnumToken.Literal:
                if ((token as LiteralToken).val === "/" && stack.at(-1)?.typ == EnumToken.MathFunctionTokenDefType) {
                    Object.assign(token, {
                        typ: EnumToken.Div,
                    });
                } else if (
                    (token as LiteralToken).val === "-" &&
                    stack.at(-1)?.typ == EnumToken.MathFunctionTokenDefType
                ) {
                    Object.assign(token, {
                        typ: EnumToken.Sub,
                    });
                }

                break;

            case EnumToken.Star:
            case EnumToken.Plus:
                Object.assign(token, {
                    typ: tokensMap.get(token.typ),
                });

                break;

            case EnumToken.EndParensTokenType:
                if (stack.length == 0) {
                    errors.push({
                        action: "drop",
                        message: "unbalanced parentheses",
                        node: token,
                        location: token[LOC],
                    });

                    name[LOC] = {
                        ...name[LOC],
                        end: tokens[tokens.length - 1]?.[LOC]!.end ?? name[LOC]!.end,
                    } as Location;
                    name[STATE] = EnumAstNodeStatus.Invalid;
                    name[ERRORS] = [errors[errors.length - 1]];

                    return Object.assign(name, {
                        typ: EnumToken.DeclarationNodeType,
                        nam: name.val,
                        val: tokens,
                    }) as AstDeclaration;
                }

                if (stack.at(-1)?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                    index = tokens.indexOf(stack.at(-1)!);

                    tokens.splice(i, 1);

                    Object.assign(tokens[index], {
                        typ:
                            stack.at(-1)?.typ === EnumToken.StartParensTokenType
                                ? EnumToken.ParensTokenType
                                : (tokensfuncDefMap.get(stack.at(-1)?.typ) as EnumToken),
                        chi: trimArray(tokens.splice(index + 1, i - index - 1)),
                    });

                    if (
                        tokens[index].typ === EnumToken.WildCardFunctionTokenType &&
                        equalsIgnoreCase((tokens[index] as FunctionToken).val, "if")
                    ) {
                        if ((tokens[index] as FunctionToken).chi.at(-1)?.typ === EnumToken.SemiColonTokenType) {
                            (tokens[index] as FunctionToken).chi.pop();
                        }

                        let foundElse: boolean = false;

                        (tokens[index] as FunctionToken).chi = splitTokenList(
                            (tokens[index] as FunctionToken).chi,
                            [EnumToken.SemiColonTokenType],
                            true,
                        ).reduce((acc, curr) => {
                            if (foundElse) {
                                // else already found
                                // ignore everything after else
                                // if(media(any-pointer: fine): 30px; else: 44px; media(any-pointer: fine): 23px); -> if(media(any-pointer: fine): 30px; else: 44px;);
                                return acc;
                            }

                            let index = -1;

                            while (++index < curr.length) {
                                if (
                                    curr[index].typ == EnumToken.IdenTokenType &&
                                    equalsIgnoreCase("else", (curr[index] as IdentToken).val)
                                ) {
                                    foundElse = true;
                                }

                                if (curr[index].typ === EnumToken.ColonTokenType) {
                                    break;
                                }
                            }

                            if (foundElse && acc.length > 0) {
                                acc[acc.length - 1] = {
                                    typ: EnumToken.IfElseConditionTokenType,
                                    l: acc[acc.length - 1] as IfConditionToken,
                                    r: {
                                        typ: EnumToken.IfConditionTokenType,
                                        l: trimArray(curr.slice(0, index)),
                                        r: trimArray(curr.slice(index + 1)),
                                    } as IfConditionToken,
                                } as IfElseConditionToken;
                            } else {
                                acc.push({
                                    typ: EnumToken.IfConditionTokenType,
                                    l: trimArray(curr.slice(0, index)),
                                    r: trimArray(curr.slice(index + 1)),
                                } as IfConditionToken);
                            }

                            return acc;
                        }, [] as Token[]);
                    } else if (tokens[index].typ === EnumToken.UrlFunctionTokenType) {
                        let l: number = -1;

                        while (++l < (tokens[index] as FunctionToken).chi.length) {
                            if ((tokens[index] as FunctionToken).chi[l].typ === EnumToken.StringTokenType) {
                                break;
                            } else if ((tokens[index] as FunctionToken).chi[l].typ === EnumToken.IdenTokenType) {
                                let m: number = l + 1;
                                while (
                                    (tokens[index] as FunctionToken).chi[m]?.typ === EnumToken.ClassSelectorTokenType
                                ) {
                                    Object.assign((tokens[index] as FunctionToken).chi[l], {
                                        typ: EnumToken.UrlTokenTokenType,
                                        val:
                                            ((tokens[index] as FunctionToken).chi[l] as IdentToken | UrlToken).val +
                                            ((tokens[index] as FunctionToken).chi[m] as ClassSelectorToken).val,
                                    });

                                    (tokens[index] as FunctionToken).chi[l][LOC]!.end = (
                                        tokens[index] as FunctionToken
                                    ).chi[m][LOC]!.end;

                                    (tokens[index] as FunctionToken).chi.splice(m, 1);
                                }

                                break;
                            }
                        }

                        if (
                            (tokens[index] as FunctionToken).chi[l]?.typ === EnumToken.StringTokenType &&
                            /^[a-zA-Z0-0/_.-]+$/.test(
                                ((tokens[index] as FunctionToken).chi[l] as StringToken).val.slice(1, -1),
                            )
                        ) {
                            Object.assign((tokens[index] as FunctionToken).chi[l], {
                                typ: EnumToken.UrlTokenTokenType,
                                val: ((tokens[index] as FunctionToken).chi[l] as StringToken).val.slice(1, -1),
                            });
                        }
                    }

                    i = index;

                    if (
                        tokens[index].typ === EnumToken.MathFunctionTokenType &&
                        equalsIgnoreCase("calc", (tokens[index] as FunctionToken).val)
                    ) {
                        (tokens[index] as FunctionToken).chi = [buildExpression((tokens[index] as FunctionToken).chi)];
                    } else if (tokens[index].typ === EnumToken.ColorTokenType) {
                        if (isColor(tokens[index])) {
                            parseColor(tokens[index]);
                        } else {
                            success = false;
                            tokens[index].typ = EnumToken.FunctionTokenType;

                            errors.push({
                                action: "drop",
                                message: `invalid color at ${tokens[index][LOC]?.src}:${tokens[index][LOC]?.sta.lin}:${tokens[index][LOC]?.sta.col}`,
                            });
                        }
                    }
                }

                stack.pop();
                break;

            case EnumToken.IdenTokenType:
                {
                    const val: string = (token as IdentToken).val.toLowerCase();

                    if (val in COLORS_NAMES || val === "currentcolor") {
                        Object.assign(token, {
                            val,
                            typ: EnumToken.ColorTokenType,
                            kin: ColorType.LIT,
                        });
                    } else if (nonStandardColors.has(val)) {
                        Object.assign(token, {
                            typ: EnumToken.ColorTokenType,
                            kin: ColorType.NON_STD,
                        });
                    } else if (systemColors.has(val)) {
                        Object.assign(token, {
                            typ: EnumToken.ColorTokenType,
                            kin: ColorType.SYS,
                        });
                    } else if (deprecatedSystemColors.has(val)) {
                        Object.assign(token, {
                            typ: EnumToken.ColorTokenType,
                            kin: ColorType.DPSYS,
                        });
                    }
                }

                break;
        }

        if (trimTokenSpace.has(token.typ)) {
            if (tokens[i + 1]?.typ === EnumToken.WhitespaceTokenType) {
                tokens.splice(i + 1, 1);
            }

            if (tokens[i - 1]?.typ == EnumToken.WhitespaceTokenType) {
                tokens.splice(--i, 1);
            }
        }
    }

    if (stack.length > 0) {
        errors.push({
            action: "drop",
            message: "unbalanced parenthesis",
            node: stack[stack.length - 1],
            location: stack[stack.length - 1][LOC],
        });

        name[LOC] = {
            ...name[LOC],
            end: tokens[tokens.length - 1][LOC]!.end,
        } as Location;
        name[STATE] = EnumAstNodeStatus.Invalid;
        name[ERRORS] = result?.errors ?? [];

        return Object.assign(name, {
            typ: EnumToken.DeclarationNodeType,
            nam: name.val,
            val: tokens,
        }) as AstDeclaration;
    }

    for (const { value } of walkValues(tokens)) {
        if (value.typ === EnumToken.IdenTokenType && isColor(value)) {
            parseColor(value);
        }
    }

    if (
        name.val === "grid" ||
        name.val === "grid-template-areas" ||
        name.val === "grid-template-rows" ||
        name.val === "grid-template-columns"
    ) {
        let i: number = 0;

        for (; i < tokens.length; i++) {
            if (tokens[i].typ === EnumToken.StringTokenType) {
                if (/[\s.]/.test((tokens[i] as StringToken).val)) {
                    (tokens[i] as StringToken).val = parseGridTemplate((tokens[i] as StringToken).val);
                }

                if (
                    tokens[i + 1]?.typ === EnumToken.WhitespaceTokenType &&
                    tokens[i + 2]?.typ === EnumToken.StringTokenType
                ) {
                    tokens.splice(i + 1, 1);
                }
            }
        }
    }

    if (validate && syntaxRules == null && name.typ === EnumToken.IdenTokenType) {
        name[LOC] = {
            ...name[LOC],
            end: tokens[tokens.length - 1]?.[LOC]?.end ?? name[LOC]!.end,
        } as Location;

        name[STATE] = EnumAstNodeStatus.Unknown;
        name[ERRORS] = result?.errors ?? [];

        const node = Object.assign(name, {
            typ: EnumToken.DeclarationNodeType,
            nam: name.val,
            val: tokens,
        }) as AstDeclaration;

        if ((options.validation as ValidationLevel) & ValidationLevel.Declaration) {
            errors.push({
                action: "drop",
                message: "unknown declaration",
                node: node,
                location: node[LOC],
            });
        }

        return node;
    }

    if (equalsIgnoreCase("composes", name.val)) {
        let index: number = -1;

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].typ === EnumToken.IdenTokenType && equalsIgnoreCase("from", (tokens[i] as IdentToken).val)) {
                index = i;
                break;
            }
        }

        const left = trimArray(index == -1 ? tokens : tokens.slice(0, index));
        const right = index == -1 ? null : trimArray(tokens.slice(index + 1));
        tokens = [
            {
                typ: EnumToken.ComposesSelectorNodeType,
                l: left,
                r: right?.[0] ?? null,
                [LOC]: {
                    ...tokens[0][LOC],
                    sta: left[0]?.[LOC]?.sta,
                    end: index != -1 ? right![right!.length - 1]?.[LOC]?.end : left[left.length - 1][LOC]!.end,
                },
            } as ComposesSelectorToken,
        ];
    }

    name[LOC] = {
        ...name[LOC],
        end: (tokens[tokens.length - 1] ?? name)[LOC]!.end,
    } as Location;
    name[STATE] = success
        ? result == null
            ? EnumAstNodeStatus.Unvalidated
            : EnumAstNodeStatus.Validated
        : EnumAstNodeStatus.ValidationFailed;
    name[ERRORS] = result?.errors ?? [];

    return Object.assign(name, {
        typ: success ? EnumToken.DeclarationNodeType : EnumToken.DeclarationNodeType,
        nam: name.val,
        val: tokens,
    }) as AstDeclaration;
}
