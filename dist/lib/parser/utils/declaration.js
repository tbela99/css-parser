import { EnumToken, EnumAstNodeStatus, ColorType, ValidationLevel } from '../../ast/types.js';
import { LOC, STATE, ERRORS, tokensfuncDefMap, COLORS_NAMES, nonStandardColors, systemColors, deprecatedSystemColors, tokensMap, trimTokenSpace } from '../../syntax/constants.js';
import { renamedStandardProperties, isColor, parseColor, isWhiteSpace } from '../../syntax/syntax.js';
import { getSyntaxRule, getParsedSyntax } from '../../validation/config.js';
import { trimArray, matchAllSyntaxes, createValidationContext } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from '../../validation/parser/typedef.js';
import { walkValues } from '../../ast/walk.js';
import { equalsIgnoreCase } from './text.js';
import { buildExpression } from '../../ast/math/expression.js';
import { splitTokenList } from '../../validation/utils/list.js';

/**
 *
 * @param template
 * @returns
 */
function parseGridTemplate(template) {
    let result = "";
    let buffer = "";
    for (let i = 0; i < template.length; i++) {
        const char = template[i];
        if (isWhiteSpace(char.charCodeAt(0))) {
            while (i + 1 < template.length && isWhiteSpace(template[i + 1].charCodeAt(0))) {
                i++;
            }
            result += buffer + " ";
            buffer = "";
        }
        else if (char == ".") {
            while (i + 1 < template.length && template[i + 1] == ".") {
                i++;
            }
            if (isWhiteSpace(result.at(-1)?.charCodeAt(0))) {
                result = result.slice(0, -1);
            }
            result += buffer + char;
            buffer = "";
        }
        else {
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
// export function isDeclarationValue(tokens: Token[]): { success: boolean; errors: ErrorDescription[] } {
//     const stack: Token[] = [];
//     let i: number = 0;
//     for (; i < tokens.length; i++) {
//         if (tokens[i].typ === EnumToken.WhitespaceTokenType || tokens[i].typ === EnumToken.CommentTokenType) {
//             continue;
//         } else if (tokensfuncDefMap.has(tokens[i].typ) || tokens[i].typ === EnumToken.StartParensTokenType) {
//             stack.push(tokens[i]);
//         } else if (tokens[i].typ === EnumToken.CommaTokenType || tokens[i].typ === EnumToken.LiteralTokenType) {
//             stack.push(tokens[i]);
//         } else if (isValue(tokens[i])) {
//             if (stack.at(-1)?.typ === EnumToken.LiteralTokenType) {
//                 stack.pop();
//             }
//         } else if (tokens[i].typ === EnumToken.EndParensTokenType) {
//             if (stack.at(-1)?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stack.at(-1)?.typ)) {
//                 stack.pop();
//             }
//         }
//     }
//     return {
//         success: stack.length === 0,
//         errors:
//             stack.length > 0
//                 ? [
//                       {
//                           action: "drop",
//                           message: `unexpected declaration value at ${stack.at(-1)?.[LOC]?.src}:${stack.at(-1)?.[LOC]?.sta.lin}:${stack.at(-1)?.[LOC]?.sta.col}`,
//                           node: stack.at(-1),
//                           location: stack.at(-1)?.[LOC],
//                       },
//                   ]
//                 : [],
//     };
// }
/**
 * Parse declaration
 * @param tokens
 * @param parent
 * @param options
 * @param errors
 */
function parseDeclaration(tokens, parent, options, errors) {
    const name = tokens.shift();
    let i;
    let rules = null;
    let syntaxRules = null;
    let success = true;
    let validate = typeof options.validation === "boolean" ? options.validation : !!options.validation;
    if (renamedStandardProperties.has(name.val)) {
        name.val = renamedStandardProperties.get(name.val);
    }
    for (i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.typ == EnumToken.WhitespaceTokenType ||
            token.typ == EnumToken.CommentTokenType ||
            token.typ == EnumToken.InvalidCommentTokenType) {
            continue;
        }
        break;
    }
    if ((name.typ !== EnumToken.IdenTokenType && name.typ !== EnumToken.DashedIdenTokenType) ||
        tokens[i]?.typ !== EnumToken.ColonTokenType) {
        name[LOC] = {
            ...name[LOC],
            end: tokens[tokens.length - 1]?.[LOC]?.end ?? name[LOC].end,
        };
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
        });
    }
    tokens = trimArray(tokens.slice(i + 1));
    // for (i = 0; i < tokens.length; i++) {
    // const token = tokens[i];
    // if (
    //     token.typ == EnumToken.WhitespaceTokenType ||
    //     token.typ == EnumToken.CommentTokenType ||
    //     token.typ == EnumToken.InvalidCommentTokenType
    // ) {
    //     continue;
    // }
    // if (tokens[i].typ === EnumToken.UrlFunctionTokenDefType) {
    // let k: number = i;
    // while (k < tokens.length) {
    //     if (
    //         tokens[++k]?.typ === EnumToken.WhitespaceTokenType ||
    //         tokens[k]?.typ === EnumToken.CommentTokenType
    //     ) {
    //         continue;
    //     }
    //     if (tokens[k]?.typ !== EnumToken.EndParensTokenType) {
    //         break;
    //     }
    // }
    // if (
    //     tokens[k].typ === EnumToken.LiteralTokenType ||
    //     tokens[k].typ === EnumToken.IdenTokenType ||
    //     tokens[k].typ === EnumToken.DashedIdenTokenType ||
    //     tokens[k].typ === EnumToken.HashTokenType ||
    //     tokens[k].typ === EnumToken.ClassSelectorTokenType
    // ) {
    //     let j: number = k;
    //     let val: string = (tokens[k] as LiteralToken | IdentToken | DashedIdentToken | HashToken).val;
    //     while (j + 1 < tokens.length) {
    //         if (
    //             tokens[++j].typ !== EnumToken.LiteralTokenType &&
    //             tokens[j].typ !== EnumToken.IdenTokenType &&
    //             tokens[j].typ !== EnumToken.DashedIdenTokenType &&
    //             tokens[j].typ !== EnumToken.HashTokenType &&
    //             tokens[j].typ !== EnumToken.ClassSelectorTokenType
    //         ) {
    //             break;
    //         }
    //         val += (tokens[j] as LiteralToken | IdentToken | DashedIdentToken | HashToken).val;
    //     }
    //     Object.assign(tokens[k] as LiteralToken | IdentToken | DashedIdentToken | HashToken, {
    //         typ: EnumToken.UrlTokenTokenType,
    //         val,
    //     });
    //     tokens[k][LOC]!.end = tokens[j][LOC]!.end;
    //     tokens.splice(k + 1, j - k - 1);
    // }
    // }
    // }
    if (validate && name.typ === EnumToken.IdenTokenType) {
        if (parent != null &&
            parent.typ === EnumToken.AtRuleNodeType &&
            parent.nam != "import" &&
            parent.nam != "supports" &&
            parent.nam != "media") {
            // check @at-rule description
            // pick up the syntax or reject immediately
            // else do this
            rules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + parent.nam);
            if (rules != null) {
                const propertyDescriptors = rules.getPropertyDescriptors();
                if (propertyDescriptors != null) {
                    syntaxRules = propertyDescriptors[name.val.toLowerCase()];
                }
                else {
                    syntaxRules =
                        rules.acceptAnyDeclaration && rules.acceptAnyRule
                            ? getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, name.val.toLowerCase())
                            : rules.getBlockRules();
                    // if (syntaxRules == null) {
                    //     // check rule in nested context
                    //     let pr = parent[PARENT] as AstNode | null;
                    //     while (pr != null && pr.typ !== EnumToken.RuleNodeType) {
                    //         pr = pr[PARENT];
                    //     }
                    //     if (pr != null) {
                    //         syntaxRules = getParsedSyntax(
                    //             ValidationSyntaxGroupEnum.Declarations,
                    //             name.val.toLowerCase(),
                    //         );
                    //     }
                    //     if (syntaxRules == null) {
                    //         errors.push({
                    //             action: "drop",
                    //             message: "declaration not allowed in context",
                    //             node: name,
                    //             location: name[LOC],
                    //         });
                    //         name[LOC] = {
                    //             ...name[LOC],
                    //             end: tokens[tokens.length - 1][LOC]!.end,
                    //         } as Location;
                    //         name[STATE] = EnumAstNodeStatus.Disallowed;
                    //         name[ERRORS] = [errors[errors.length - 1]];
                    //         // @ts-expect-error
                    //         return Object.assign(name, {
                    //             typ: EnumToken.DeclarationNodeType,
                    //             nam: name.val,
                    //             val: tokens,
                    //         }) as AstDeclaration;
                    //     }
                    // }
                }
            }
        }
        else {
            syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, name.val.toLowerCase());
        }
        // <declaration-list> or <declaration-rule-list>
        // else
        if (syntaxRules == null ||
            (syntaxRules.length === 1 &&
                syntaxRules[0].typ === ValidationTokenEnum.PropertyType &&
                (syntaxRules[0].val === "declaration-list" ||
                    syntaxRules[0].val === "declaration-rule-list"))) {
            if (parent?.typ === EnumToken.AtRuleNodeType &&
                (parent.nam === "swash" ||
                    parent.nam === "annotation" ||
                    parent.nam === "ornaments" ||
                    parent.nam === "stylistic" ||
                    parent.nam === "historical-forms")) {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident");
            }
            else if (parent?.typ === EnumToken.AtRuleNodeType && parent.nam === "styleset") {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident-list");
            }
            else if (parent?.typ === EnumToken.AtRuleNodeType && parent.nam === "character-variant") {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident-character-variant");
            }
            else {
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
            end: tokens[tokens.length - 1]?.[LOC].end ?? name[LOC].end,
        };
        name[STATE] = EnumAstNodeStatus.Invalid;
        name[ERRORS] = [errors[errors.length - 1]];
        // @ts-expect-error
        return Object.assign(name, {
            typ: EnumToken.DeclarationNodeType,
            nam: name.val,
            val: tokens,
        });
    }
    const stack = [];
    let result = null;
    let token;
    let index;
    if (syntaxRules != null) {
        const doNotValidate = options.validation === false || options.validation === ValidationLevel.None;
        result = doNotValidate ? null : matchAllSyntaxes(syntaxRules, createValidationContext(tokens), options);
        if (doNotValidate || result != null) {
            success = doNotValidate || result?.success;
            if (success) {
                for (const { value } of walkValues(tokens)) {
                    if (value.typ === EnumToken.IdenTokenType && isColor(value)) {
                        parseColor(value);
                    }
                    else if (value.typ === EnumToken.ColorTokenType) {
                        if (isColor(value)) {
                            parseColor(value);
                        }
                    }
                }
            }
            if (!doNotValidate && !result?.success && result.errors.length > 0) {
                errors.push(...result.errors);
            }
        }
    }
    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        if (tokensfuncDefMap.has(token.typ) ||
            token.typ == EnumToken.StartParensTokenType ||
            token.typ == EnumToken.BlockStartTokenType) {
            stack.push(token);
            continue;
        }
        switch (token.typ) {
            // case EnumToken.IdenTokenType:
            //     if (tokens[i + 1]?.typ == EnumToken.StartParensTokenType) {
            //         Object.assign(token, {
            //             typ: EnumToken.FunctionTokenDefType,
            //         });
            //         token[LOC]!.end = tokens[i + 1][LOC]!.end;
            //         tokens.splice(i + 1, 1);
            //         stack.push(token);
            //     }
            //     break;
            case EnumToken.Literal:
                if (token.val === "/" && stack.at(-1)?.typ == EnumToken.MathFunctionTokenDefType) {
                    Object.assign(token, {
                        typ: EnumToken.Div,
                    });
                }
                else if (token.val === "-" &&
                    stack.at(-1)?.typ == EnumToken.MathFunctionTokenDefType) {
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
            case EnumToken.BlockEndTokenType:
                if (stack.at(-1)?.typ === EnumToken.BlockStartTokenType) {
                    // stack.pop();index = tokens.indexOf(stack.at(-1)!);
                    index = tokens.indexOf(stack.at(-1));
                    tokens.splice(i, 1);
                    Object.assign(tokens[index], {
                        typ: EnumToken.WrappedValuesTokenType,
                        chi: trimArray(tokens.splice(index + 1, i - index - 1)),
                    });
                    i = index;
                    stack.pop();
                }
                break;
            case EnumToken.EndParensTokenType:
                // if (stack.length == 0) {
                //     errors.push({
                //         action: "drop",
                //         message: "unbalanced parentheses",
                //         node: token,
                //         location: token[LOC],
                //     });
                //     name[LOC] = {
                //         ...name[LOC],
                //         end: tokens[tokens.length - 1]?.[LOC]!.end ?? name[LOC]!.end,
                //     } as Location;
                //     name[STATE] = EnumAstNodeStatus.Invalid;
                //     name[ERRORS] = [errors[errors.length - 1]];
                //     // @ts-expect-error
                //     return Object.assign(name, {
                //         typ: EnumToken.DeclarationNodeType,
                //         nam: name.val,
                //         val: tokens,
                //     }) as AstDeclaration;
                // }
                if (stack.at(-1)?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                    index = tokens.indexOf(stack.at(-1));
                    tokens.splice(i, 1);
                    Object.assign(tokens[index], {
                        typ: stack.at(-1)?.typ === EnumToken.StartParensTokenType
                            ? EnumToken.ParensTokenType
                            : tokensfuncDefMap.get(stack.at(-1)?.typ),
                        chi: trimArray(tokens.splice(index + 1, i - index - 1)),
                    });
                    if (tokens[index].typ === EnumToken.WildCardFunctionTokenType &&
                        equalsIgnoreCase(tokens[index].val, "if")) {
                        if (tokens[index].chi.at(-1)?.typ === EnumToken.SemiColonTokenType) {
                            tokens[index].chi.pop();
                        }
                        let foundElse = false;
                        tokens[index].chi = splitTokenList(tokens[index].chi, [EnumToken.SemiColonTokenType], true).reduce((acc, curr) => {
                            if (foundElse) {
                                // else already found
                                // ignore everything after else
                                // if(media(any-pointer: fine): 30px; else: 44px; media(any-pointer: fine): 23px); -> if(media(any-pointer: fine): 30px; else: 44px;);
                                return acc;
                            }
                            let index = -1;
                            while (++index < curr.length) {
                                if (curr[index].typ == EnumToken.IdenTokenType &&
                                    equalsIgnoreCase("else", curr[index].val)) {
                                    foundElse = true;
                                }
                                if (curr[index].typ === EnumToken.ColonTokenType) {
                                    break;
                                }
                            }
                            if (foundElse && acc.length > 0) {
                                acc[acc.length - 1] = {
                                    typ: EnumToken.IfElseConditionTokenType,
                                    l: acc[acc.length - 1],
                                    r: {
                                        typ: EnumToken.IfConditionTokenType,
                                        l: trimArray(curr.slice(0, index)),
                                        r: trimArray(curr.at(-1)?.typ === EnumToken.SemiColonTokenType
                                            ? curr.slice(index + 1, -1)
                                            : curr.slice(index + 1)),
                                    },
                                };
                            }
                            else {
                                acc.push({
                                    typ: EnumToken.IfConditionTokenType,
                                    l: trimArray(curr.slice(0, index)),
                                    r: trimArray(curr.slice(index + 1)),
                                });
                            }
                            return acc;
                        }, []);
                    }
                    else if (tokens[index].typ === EnumToken.UrlFunctionTokenType) {
                        let l = -1;
                        while (++l < tokens[index].chi.length) {
                            if (tokens[index].chi[l].typ === EnumToken.StringTokenType) {
                                break;
                            }
                            // else if ((tokens[index] as FunctionToken).chi[l].typ === EnumToken.IdenTokenType) {
                            //     let m: number = l + 1;
                            //     while (
                            //         (tokens[index] as FunctionToken).chi[m]?.typ === EnumToken.ClassSelectorTokenType
                            //     ) {
                            //         Object.assign((tokens[index] as FunctionToken).chi[l], {
                            //             typ: EnumToken.UrlTokenTokenType,
                            //             val:
                            //                 ((tokens[index] as FunctionToken).chi[l] as IdentToken | UrlToken).val +
                            //                 ((tokens[index] as FunctionToken).chi[m] as ClassSelectorToken).val,
                            //         });
                            //         (tokens[index] as FunctionToken).chi[l][LOC]!.end = (
                            //             tokens[index] as FunctionToken
                            //         ).chi[m][LOC]!.end;
                            //         (tokens[index] as FunctionToken).chi.splice(m, 1);
                            //     }
                            //     break;
                            // }
                        }
                        if (tokens[index].chi[l]?.typ === EnumToken.StringTokenType &&
                            /^[a-zA-Z0-0/_.-]+$/.test(tokens[index].chi[l].val.slice(1, -1))) {
                            Object.assign(tokens[index].chi[l], {
                                typ: EnumToken.UrlTokenTokenType,
                                val: tokens[index].chi[l].val.slice(1, -1),
                            });
                        }
                    }
                    i = index;
                    if (tokens[index].typ === EnumToken.MathFunctionTokenType &&
                        equalsIgnoreCase("calc", tokens[index].val)) {
                        tokens[index].chi = [buildExpression(tokens[index].chi)];
                    }
                    else if (tokens[index].typ === EnumToken.ColorTokenType) {
                        if (isColor(tokens[index])) {
                            parseColor(tokens[index]);
                        }
                        else {
                            success = false;
                            tokens[index].typ = EnumToken.FunctionTokenType;
                            errors.push({
                                action: "drop",
                                message: `invalid color at ${tokens[index][LOC]?.src}:${tokens[index][LOC]?.sta.lin}:${tokens[index][LOC]?.sta.col}`,
                            });
                        }
                    }
                    stack.pop();
                }
                break;
            case EnumToken.IdenTokenType:
                {
                    const val = token.val.toLowerCase();
                    if (val in COLORS_NAMES || val === "currentcolor") {
                        Object.assign(token, {
                            val,
                            typ: EnumToken.ColorTokenType,
                            kin: ColorType.LIT,
                        });
                    }
                    else if (nonStandardColors.has(val)) {
                        Object.assign(token, {
                            typ: EnumToken.ColorTokenType,
                            kin: ColorType.NON_STD,
                        });
                    }
                    else if (systemColors.has(val)) {
                        Object.assign(token, {
                            typ: EnumToken.ColorTokenType,
                            kin: ColorType.SYS,
                        });
                    }
                    else if (deprecatedSystemColors.has(val)) {
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
            message: "unbalanced token",
            node: stack[stack.length - 1],
            location: stack[stack.length - 1][LOC],
        });
        name[LOC] = {
            ...name[LOC],
            end: tokens[tokens.length - 1][LOC].end,
        };
        name[STATE] = EnumAstNodeStatus.Invalid;
        name[ERRORS] = result?.errors ?? [];
        //@ts-expect-error
        return Object.assign(name, {
            typ: EnumToken.DeclarationNodeType,
            nam: name.val,
            val: tokens,
        });
    }
    for (const { value } of walkValues(tokens)) {
        if (value.typ === EnumToken.IdenTokenType && isColor(value)) {
            parseColor(value);
        }
    }
    if (name.val === "grid" ||
        name.val === "grid-template-areas" ||
        name.val === "grid-template-rows" ||
        name.val === "grid-template-columns") {
        let i = 0;
        for (; i < tokens.length; i++) {
            if (tokens[i].typ === EnumToken.StringTokenType) {
                if (/[\s.]/.test(tokens[i].val)) {
                    tokens[i].val = parseGridTemplate(tokens[i].val);
                }
                if (tokens[i + 1]?.typ === EnumToken.WhitespaceTokenType &&
                    tokens[i + 2]?.typ === EnumToken.StringTokenType) {
                    tokens.splice(i + 1, 1);
                }
            }
        }
    }
    if (validate && syntaxRules == null && name.typ === EnumToken.IdenTokenType) {
        name[LOC] = {
            ...name[LOC],
            end: tokens[tokens.length - 1]?.[LOC]?.end ?? name[LOC].end,
        };
        name[STATE] = EnumAstNodeStatus.Unknown;
        name[ERRORS] = result?.errors ?? [];
        // @ts-expect-error
        const node = Object.assign(name, {
            typ: EnumToken.DeclarationNodeType,
            nam: name.val,
            val: tokens,
        });
        // if ((options.validation as ValidationLevel) & ValidationLevel.Declaration) {
        //     errors.push({
        //         action: "drop",
        //         message: "unknown declaration",
        //         node: node,
        //         location: node[LOC],
        //     });
        // }
        return node;
    }
    if (equalsIgnoreCase("composes", name.val)) {
        let index = -1;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].typ === EnumToken.IdenTokenType && equalsIgnoreCase("from", tokens[i].val)) {
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
                    end: index != -1 ? right[right.length - 1]?.[LOC]?.end : left[left.length - 1][LOC].end,
                },
            },
        ];
    }
    name[LOC] = {
        ...name[LOC],
        end: (tokens[tokens.length - 1] ?? name)[LOC].end,
    };
    name[STATE] = success
        ? result == null
            ? EnumAstNodeStatus.Unvalidated
            : EnumAstNodeStatus.Validated
        : EnumAstNodeStatus.ValidationFailed;
    name[ERRORS] = result?.errors ?? [];
    // @ts-expect-error
    return Object.assign(name, {
        typ: EnumToken.DeclarationNodeType,
        nam: name.val,
        val: tokens,
    });
}

export { parseDeclaration };
