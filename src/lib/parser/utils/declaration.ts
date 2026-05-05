import type {
    AstAtRule,
    AstDeclaration,
    AstInvalidAtRule,
    AstInvalidDeclaration,
    AstInvalidRule,
    AstKeyFrameRule,
    AstRule,
    AstStyleSheet,
    AtRuleToken,
    AttrToken,
    ClassSelectorToken,
    ComposesSelectorToken,
    DashedIdentToken,
    ErrorDescription,
    FunctionToken,
    IdentToken,
    LiteralToken,
    Location,
    ParensToken,
    ParserOptions,
    RawNodeToken,
    StringToken,
    Token,
    UrlToken,
} from "../../../@types/index.d.ts";
import { ColorType, EnumToken, ValidationLevel } from "../../ast/types.ts";
import {
    nonStandardColors,
    systemColors,
    deprecatedSystemColors,
    COLORS_NAMES,
    tokensMap,
    definedPropertySettings,
    trimTokenSpace,
} from "../../syntax/constants.ts";
import { isColor, isValue, isWhiteSpace, parseColor } from "../../syntax/syntax.ts";
import { getSyntaxRule, getParsedSyntax } from "../../validation/config.ts";
import { matchAllSyntax, createValidationContext, trimArray } from "../../validation/match.ts";
import type { ValidationMatch } from "../../validation/types.d.ts";
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from "../../validation/parser/typedef.ts";
import { tokensfuncDefMap } from "../../syntax/constants.ts";
import { walkValues } from "../../ast/walk.ts";
import type { ValidationPropertyToken } from "../../validation/parser/types.d.ts";
import { equalsIgnoreCase } from "./text.ts";

export function parseDeclarationNode(
    node: AstDeclaration,
    errors: ErrorDescription[],
    location: Location,
): AstDeclaration | null {
    while (node.val[0]?.typ == EnumToken.WhitespaceTokenType) {
        node.val.shift();
    }

    if (
        !node.nam.startsWith("--") &&
        node.val.filter((t: Token) => ![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ))
            .length == 0
    ) {
        errors.push(<ErrorDescription>{
            action: "drop",
            message: "doParse: invalid declaration",
            location,
        });

        return null;
    }

    if ("composes" === node.nam.toLowerCase()) {
        let left: Token[] = [];
        let right: Token[] = [];
        let current: number = 0;
        let hasFrom: number = 0;

        for (; current < node.val.length; current++) {
            if (
                EnumToken.WhitespaceTokenType == node.val[current].typ ||
                EnumToken.CommentTokenType == node.val[current].typ
            ) {
                if (!hasFrom) {
                    left.push(node.val[current]);
                } else {
                    right.push(node.val[current]);
                }

                continue;
            }

            if (
                EnumToken.IdenTokenType == node.val[current].typ ||
                EnumToken.DashedIdenTokenType == node.val[current].typ ||
                EnumToken.StringTokenType == node.val[current].typ
            ) {
                if (EnumToken.IdenTokenType == node.val[current].typ) {
                    if ("from" == (node.val[current] as IdentToken).val) {
                        if (hasFrom) {
                            return null;
                        }

                        hasFrom++;
                        continue;
                    }
                }

                if (hasFrom) {
                    right.push(node.val[current]);
                } else {
                    left.push(node.val[current]);
                }

                continue;
            }

            break;
        }

        if (hasFrom <= 1 && current > 0) {
            if (hasFrom == 0) {
                node.val.splice(0, left.length, {
                    typ: EnumToken.ComposesSelectorNodeType,
                    l: left,
                    r: null,
                });
            } else {
                node.val.splice(0, current, {
                    typ: EnumToken.ComposesSelectorNodeType,
                    l: left,
                    r: right.reduce((a: Token | null, b: Token) => {
                        return a == null
                            ? b
                            : b.typ == EnumToken.WhitespaceTokenType || b.typ == EnumToken.CommentTokenType
                              ? a
                              : b;
                    }, null),
                });
            }
        }
    }

    for (const { value: val, parent } of walkValues(node.val, node)) {
        if (
            val.typ == EnumToken.AttrTokenType &&
            (val as AttrToken).chi.every((t: Token) =>
                [EnumToken.IdenTokenType, EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(t.typ),
            )
        ) {
            // @ts-ignore
            val.typ = EnumToken.IdenListTokenType;
        } else if (
            val.typ === EnumToken.StringTokenType &&
            (node.nam === "grid" ||
                node.nam === "grid-template-areas" ||
                node.nam === "grid-template-rows" ||
                node.nam === "grid-template-columns")
        ) {
            (val as StringToken).val =
                (val as StringToken).val.at(0) +
                parseGridTemplate((val as StringToken).val.slice(1, -1)) +
                (val as StringToken).val.at(-1);

            // @ts-ignore
            const array: Token[] = (<FunctionToken | ParensToken>parent)?.chi ?? node.val;

            const index: number = array.indexOf(val);

            if (index > 0 && array[index - 1].typ === EnumToken.WhitespaceTokenType) {
                array.splice(index - 1, 1);
            }
        }
    }

    return node;
}

function parseGridTemplate(template: string): string {
    let result: string = "";
    let buffer: string = "";

    for (let i = 0; i < template.length; i++) {
        const char: string = template[i];

        if (isWhiteSpace(<number>char.codePointAt(0))) {
            while (i + 1 < template.length && isWhiteSpace(<number>template[i + 1].codePointAt(0))) {
                i++;
            }

            result += buffer + " ";
            buffer = "";
        } else if (char == ".") {
            while (i + 1 < template.length && template[i + 1] == ".") {
                i++;
            }

            if (isWhiteSpace(<number>result.at(-1)?.codePointAt(0))) {
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
                          message: `unexpected declaration value at ${stack.at(-1)?.loc?.src}:${stack.at(-1)?.loc?.sta.lin}:${stack.at(-1)?.loc?.sta.col}`,
                          node: stack.at(-1),
                          location: stack.at(-1)?.loc,
                      },
                  ]
                : [],
    };
}

/**
 * parse declaration
 * @param tokens
 * @param parent
 * @param options
 * @param errors
 */

export function parseDeclaration(
    tokens: Token[],
    parent:
        | AstRule
        | AstAtRule
        | AstKeyFrameRule
        | AstStyleSheet
        | AtRuleToken
        | AstInvalidAtRule
        | AstInvalidRule
        | null,
    options: ParserOptions,
    errors: ErrorDescription[],
): AstDeclaration | AstInvalidDeclaration | RawNodeToken {
    const name = tokens.shift() as IdentToken | DashedIdentToken;
    let i: number;
    let syntaxRules = null;
    let success: boolean = true;

    let validate =
        typeof options.validation === "boolean"
            ? options.validation
            : (options.validation as ValidationLevel) & ValidationLevel.Declaration;

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
        return Object.defineProperty(
            Object.assign({
                typ: EnumToken.RawNodeTokenType,
                chi: tokens,
            }),
            "loc",
            {
                ...definedPropertySettings,
                value: {
                    ...name.loc,
                    end: tokens[tokens.length - 1]?.loc?.end ?? name.loc!.end,
                },
            },
        ) as RawNodeToken;
    }

    tokens = trimArray(tokens.slice(i + 1));

    if (validate && name.typ === EnumToken.IdenTokenType) {
        if (
            parent != null &&
            (parent.typ == EnumToken.AtRuleNodeType || parent.typ === EnumToken.InvalidAtRuleNodeType) &&
            parent.nam != "import" &&
            parent.nam != "supports" &&
            parent.nam != "media"
        ) {
            // check @at-rule description
            // pick up the syntax or reject immediately

            // else do this
            const rules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + parent.nam);

            if (rules != null) {
                const propertyDescriptors = rules.getPropertyDescriptors();

                if (propertyDescriptors != null) {
                    syntaxRules = propertyDescriptors[name.val.toLowerCase()];
                } else {
                    syntaxRules = rules.getBlockRules();

                    if (syntaxRules == null) {
                        errors.push({
                            action: "drop",
                            message: "declaration not allowed in context",
                            node: name,
                            location: name.loc,
                        });

                        return Object.defineProperty(
                            Object.assign(name, {
                                typ: EnumToken.InvalidDeclarationNodeType,
                                nam: name.val,
                                val: tokens,
                            }),
                            "loc",
                            {
                                ...definedPropertySettings,
                                value: {
                                    ...name.loc,
                                    end: tokens[tokens.length - 1].loc!.end,
                                },
                            },
                        ) as AstInvalidDeclaration;
                    }
                }
            }
        }

        // <declaration-list> or <declaration-rule-list>
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
            location: name.loc,
        });

        return Object.defineProperty(
            Object.assign(name, {
                typ: EnumToken.InvalidDeclarationNodeType,
                nam: name.val,
                val: tokens,
            }),
            "loc",
            {
                ...definedPropertySettings,
                value: {
                    ...name.loc,
                    end: tokens[tokens.length - 1]?.loc!.end ?? name.loc!.end,
                },
            },
        ) as AstInvalidDeclaration;
    }

    let result: ValidationMatch | null = null;

    const stack: Token[] = [];
    let token: Token;
    let index: number;

    if (syntaxRules != null) {
        const doNotValidate: boolean = options.validation === false || options.validation === ValidationLevel.None;
        result = doNotValidate ? null : matchAllSyntax(syntaxRules, createValidationContext(tokens), options);

        if (doNotValidate || result != null) {
            success = doNotValidate || (result?.success as boolean);

            if (success) {
                for (const { value } of walkValues(tokens)) {
                    if (value.typ === EnumToken.IdenTokenType && isColor(value)) {
                        parseColor(value);
                        // continue;
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

            if (!doNotValidate && !(success || result!.success)) {
                return Object.defineProperty(
                    Object.assign(name, {
                        typ: EnumToken.InvalidDeclarationNodeType,
                        nam: name.val,
                        val: tokens,
                    }),
                    "loc",
                    {
                        ...definedPropertySettings,
                        value: {
                            ...name.loc,
                            end: tokens[tokens.length - 1]?.loc!.end ?? name.loc!.end,
                        },
                    },
                ) as AstInvalidDeclaration;
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

                    token.loc!.end = tokens[i + 1].loc!.end;
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
                if (stack.at(-1)?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                    index = tokens.indexOf(stack.at(-1)!);

                    tokens.splice(i, 1);

                    const type = tokens[index].typ;

                    Object.assign(tokens[index], {
                        typ:
                            stack.at(-1)?.typ === EnumToken.StartParensTokenType
                                ? EnumToken.ParensTokenType
                                : (tokensfuncDefMap.get(stack.at(-1)?.typ) as EnumToken),
                        chi: trimArray(tokens.splice(index + 1, i - index - 1)),
                    });

                    if (tokens[index].typ === EnumToken.UrlFunctionTokenType) {
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

                                    (tokens[index] as FunctionToken).chi[l].loc!.end = (
                                        tokens[index] as FunctionToken
                                    ).chi[m].loc!.end;

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

                    if (tokens[index].typ === EnumToken.ColorTokenType) {
                        if (isColor(tokens[index])) {
                            parseColor(tokens[index]);
                        } else {
                            success = false;
                            tokens[index].typ = EnumToken.FunctionTokenType;

                            errors.push({
                                action: "drop",
                                message: `invalid color at ${tokens[index].loc?.src}:${tokens[index].loc?.sta.lin}:${tokens[index].loc?.sta.col}`,
                            });
                        }
                    }
                }

                stack.pop();
                break;

            case EnumToken.IdenTokenType:
                {
                    const val: string = (token as IdentToken).val.toLocaleLowerCase();

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
            location: stack[stack.length - 1].loc,
        });

        return Object.defineProperty(
            Object.assign(name, {
                typ: EnumToken.InvalidDeclarationNodeType,
                nam: name.val,
                val: tokens,
            }),
            "loc",
            {
                ...definedPropertySettings,
                value: {
                    ...name.loc,
                    end: tokens[tokens.length - 1].loc!.end,
                },
            },
        ) as AstDeclaration;
    }

    for (const { value } of walkValues(tokens)) {
        if (value.typ === EnumToken.IdenTokenType && isColor(value)) {
            parseColor(value);
            // continue;
        }
        // else if (value.typ === EnumToken.ColorTokenType) {
        //     if (isColor(value)) {
        //         parseColor(value);
        //     }
        // }
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
        const node = Object.defineProperty(
            Object.assign(name, {
                typ:
                    (options.validation as ValidationLevel) & ValidationLevel.Declaration
                        ? EnumToken.InvalidDeclarationNodeType
                        : EnumToken.DeclarationNodeType,
                nam: name.val,
                val: tokens,
            }),
            "loc",
            {
                ...definedPropertySettings,
                value: {
                    ...name.loc,
                    end: tokens[tokens.length - 1]?.loc?.end ?? name.loc!.end,
                },
            },
        ) as AstDeclaration;

        if ((options.validation as ValidationLevel) & ValidationLevel.Declaration) {
            errors.push({
                action: "drop",
                message: "unknown declaration",
                node: node,
                location: node.loc,
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
            Object.defineProperty(
                {
                    typ: EnumToken.ComposesSelectorNodeType,
                    l: left,
                    r: right?.[0] ?? null,
                } as ComposesSelectorToken,
                "loc",
                {
                    ...definedPropertySettings,
                    value: {
                        ...tokens[0].loc,
                        sta: left[0]?.loc?.sta,
                        end: index != -1 ? right![right!.length - 1]?.loc?.end : left[left.length - 1].loc!.end,
                    },
                },
            ),
        ];
    }

    return Object.defineProperty(
        Object.assign(name, {
            typ: success ? EnumToken.DeclarationNodeType : EnumToken.InvalidDeclarationNodeType,
            nam: name.val,
            val: tokens,
        }),
        "loc",
        {
            ...definedPropertySettings,
            value: {
                ...name.loc,
                end: (tokens[tokens.length - 1] ?? name).loc!.end,
            },
        },
    ) as AstDeclaration;
}
