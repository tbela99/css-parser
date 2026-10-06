import type {
    AstAtRule,
    AstDeclaration,
    AstKeyframesRule,
    AstRule,
    AstStyleSheet,
    AtRuleToken,
    ComposesSelectorToken,
    DashedIdentToken,
    ErrorDescription,
    FunctionToken,
    IdentToken,
    IfConditionToken,
    IfElseConditionToken,
    LiteralToken,
    ParserOptions,
    RawNodeToken,
    StringToken,
    Token,
} from "../../../@types/index.d.ts";
import { ColorType, EnumAstNodeStatus, EnumToken } from "../../ast/types.ts";
import {
    COLORS_NAMES,
    deprecatedSystemColors,
    ERRORS,
    LOCEND,
    LOCSRCID,
    LOCSTA,
    nonStandardColors,
    STATE,
    systemColors,
    tokensfuncDefMap,
    tokensMap,
    trimTokenSpace,
} from "../../syntax/constants.ts";
import { isColor, isWhiteSpace, parseColor, renamedStandardProperties } from "../../syntax/syntax.ts";
import { getParsedSyntax, getSyntaxRule, ValidationSyntaxRule } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntaxes, trimArray } from "../../validation/match.ts";
import type { ValidationMatch } from "../../validation/types.d.ts";
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from "../../validation/parser/typedef.ts";
import { walkValues } from "../../ast/walk.ts";
import type { ValidationPropertyToken } from "../../validation/parser/types.d.ts";
import { equalsIgnoreCase } from "./text.ts";
import { buildExpression } from "../../ast/math/expression.ts";
import { splitTokenList } from "../../validation/utils/list.ts";

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
 * Parse declaration
 * @param tokens
 * @param parent
 * @param options
 * @param errors
 */

export function parseDeclaration(
    tokens: number[],
    parent: number| null,
    options: ParserOptions,
    errors: ErrorDescription[],
): number {
    const name = tokens.shift() as number;
    const arena = options.arena!;
    let i: number;
    let rules: ValidationSyntaxRule | null = null;
    let syntaxRules = null;
    let success: boolean = true;
    let val: string = arena.getValue(name);

    let token: number;
    let typ: EnumToken;

    let validate = typeof options.validation === "boolean" ? options.validation : !!options.validation;

    if (renamedStandardProperties.has(val)) {
        arena.setValue(name, arena.internString(renamedStandardProperties.get(val) as string));
    }

    for (i = 0; i < tokens.length; i++) {
         token = tokens[i];
         typ = arena.getType(token);

        if (
            typ == EnumToken.WhitespaceTokenType ||
            typ == EnumToken.CommentTokenType ||
            typ == EnumToken.InvalidCommentTokenType
        ) {
            continue;
        }

        break;
    }

    typ = arena.getType(name);

    if (
        (typ !== EnumToken.IdenTokenType && typ !== EnumToken.DashedIdenTokenType) ||
        arena.getType(tokens[i]) !== EnumToken.ColonTokenType
    ) {
        // if (tokens[tokens.length - 1]?.[LOCEND] != null) {
        //     name[LOCEND] = tokens[tokens.length - 1]?.[LOCEND];
        // }

        const node = arena.allocate();

        arena.setType(node, EnumToken.RawNodeTokenType);
        arena.setFlags(node, EnumAstNodeStatus.Unparsed);
        arena.setErrors(node, [
            
            {
                action: "drop",
                node: name,
                location: options.source!.getSourceLocation(arena.getSpanStart(name)),
                message: "invalid declaration",
            } as ErrorDescription,
        ]);

        arena.setTokens(node, tokens);
        arena.setSpan(node, arena.getSourceId(name), arena.getSpanStart(name), arena.getSpanEnd(tokens.at(-1) ?? name));

        return node;

        // name[STATE] = EnumAstNodeStatus.Unparsed;
        // name[ERRORS] = [
        //     {
        //         action: "drop",
        //         node: name,
        //         location: options.source!.getSourceLocation(name[LOCSTA]!),
        //         message: "invalid declaration",
        //     } as ErrorDescription,
        // ];

        // return Object.assign({
        //     typ: EnumToken.RawNodeTokenType,
        //     val: tokens,
        // }) as RawNodeToken;
    }

    tokens = trimArray(tokens.slice(i + 1), options);

    if (validate && typ === EnumToken.IdenTokenType) {

            typ = arena.getType(parent);
            val = arena.getValue(parent).toLowerCase();

        if (
            parent != null &&
            typ === EnumToken.AtRuleNodeType &&
            val != "import" &&
            val != "supports" &&
            val!= "media"
        ) {
            // check @at-rule description
            // pick up the syntax or reject immediately

            // else do this
            rules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + val);

            if (rules != null) {
                const propertyDescriptors = rules.getPropertyDescriptors();

                if (propertyDescriptors != null) {
                    syntaxRules = propertyDescriptors[val.toLowerCase()];
                } else {
                    syntaxRules =
                        rules.acceptAnyDeclaration && rules.acceptAnyRule
                            ? getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, val)
                            : rules.getBlockRules();
                }
            }
        } else {
            syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, val);
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

            typ = arena.getType(parent);
            val = arena.getValue(parent).toLowerCase();

            if (
                parent != null &&
               typ === EnumToken.AtRuleNodeType &&
                (val === "swash" ||
                    val=== "annotation" ||
                    val === "ornaments" ||
                   val === "stylistic" ||
                    val === "historical-forms")
            ) {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident");
            } else if (typ === EnumToken.AtRuleNodeType && val === "styleset") {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident-list");
            } else if (typ === EnumToken.AtRuleNodeType && val=== "character-variant") {
                syntaxRules = getParsedSyntax(
                    ValidationSyntaxGroupEnum.Syntaxes,
                    "font-feature-custom-ident-character-variant",
                );
            } else {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, val);
            }
        }
    }

    typ = arena.getType(name);

    if (tokens.length === 0 && typ !== EnumToken.DashedIdenTokenType) {
        errors.push({
            action: "drop",
            message: "declaration value missing",
            node: name,
            location: options.source!.getSourceLocation(arena.getSpanStart(name)),
        });

        // if (tokens[tokens.length - 1]?.[LOCEND] != null) {
        //     name[LOCEND] = tokens[tokens.length - 1][LOCEND];
        // }

        arena.setFlags(name, EnumAstNodeStatus.Invalid | EnumAstNodeStatus.HasValues);
        arena.setErrors(name, [errors[errors.length - 1]]);
        arena.setName(name, arena.getValue(name));
        arena.set(name, EnumToken.DeclarationNodeType, 0);
        arena.setChildren(name, tokens);

        return name;

        // name[STATE] = EnumAstNodeStatus.Invalid;
        // name[ERRORS] = [errors[errors.length - 1]];

        // return Object.assign(name, {
        //     typ: EnumToken.DeclarationNodeType,
        //     nam: name.val,
        //     val: tokens,
        // }) as AstDeclaration;
    }

    const stack: number[] = [];

    let result: ValidationMatch | null = null;
    // let token: Token;
    let index: number;

    if (syntaxRules != null) {
        const doNotValidate: boolean = options.validation === false;
        result = doNotValidate ? null : matchAllSyntaxes(syntaxRules, createValidationContext(tokens, options), options);

        if (doNotValidate || result != null) {
            success = doNotValidate || (result?.success as boolean);

            if (success) {
                for (const value of arena.walkValues(tokens)) {
                    if (arena.getType(value) === EnumToken.IdenTokenType && isColor(value, arena)) {
                        parseColor(value, arena);
                    } else if (value.typ === EnumToken.ColorTokenType) {
                        if (isColor(value, arena)) {
                            parseColor(value, arena);
                        }
                    }
                }
            }

            if (!doNotValidate && !result?.success && result!.errors!.length > 0) {
                for (index = 0; index < result!.errors!.length; index++) {
                    errors.push(result!.errors![index]);
                }
            }
        }
    }

    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];

        typ = arena.getType(token);
        val = arena.getValue(token);

        if (
            tokensfuncDefMap.has(typ) ||
            typ == EnumToken.StartParensTokenType ||
            typ == EnumToken.BlockStartTokenType
        ) {
            stack.push(token);
            continue;
        }

        if (typ === EnumToken.ColonTokenType && stack.length == 0) {
            stack.push(token);
            continue;
        }

        const stackType = arena.getType(stack.at(-1)!);

        switch (typ) {
            case EnumToken.Literal:
                if (arena.equalsIgnoreCase(token, 'val', '/')  && stackType == EnumToken.MathFunctionTokenDefType) {

                    arena.setType(token, EnumToken.Div);
                    // Object.assign(token, {
                    //     typ: EnumToken.Div,
                    // });
                } else if (
                    arena.equalsIgnoreCase(token, 'val', '-')&&
                    stackType == EnumToken.MathFunctionTokenDefType
                ) {
                    arena.setType(token, EnumToken.Sub);
                    // Object.assign(token, {
                    //     typ: EnumToken.Sub,
                    // });
                }

                break;

            case EnumToken.Star:
            case EnumToken.Plus:

            arena.setType(token, tokensMap.get(typ));
                // Object.assign(token, {
                //     typ: tokensMap.get(typ),
                // });

                break;

            case EnumToken.BlockEndTokenType:
                if (stackType === EnumToken.BlockStartTokenType) {
                    // stack.pop();index = tokens.indexOf(stack.at(-1)!);
                    index = tokens.indexOf(stack.at(-1)!);
                    tokens.splice(i, 1);

                    arena.setType(tokens[index], EnumToken.WrappedValuesTokenType);
                    arena.setChildren(tokens[index], trimArray(tokens.splice(index + 1, i - index - 1), options));

                    // Object.assign(tokens[index], {
                    //     typ: EnumToken.WrappedValuesTokenType,
                    //     chi: trimArray(tokens.splice(index + 1, i - index - 1), options),
                    // });

                    i = index;
                    stack.pop();
                }

                break;

            case EnumToken.EndParensTokenType:
                if (stackType === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stackType)) {
                    index = tokens.indexOf(stack.at(-1)!);

                    tokens.splice(i, 1);

                    arena.setType(tokens[index], stackType === EnumToken.StartParensTokenType
                                ? EnumToken.ParensTokenType
                                : (tokensfuncDefMap.get(stackType) as EnumToken));

                    arena.setChildren(tokens[index], trimArray(tokens.splice(index + 1, i - index - 1), options));

                    // Object.assign(tokens[index], {
                    //     typ:
                    //         stack.at(-1)?.typ === EnumToken.StartParensTokenType
                    //             ? EnumToken.ParensTokenType
                    //             : (tokensfuncDefMap.get(stack.at(-1)?.typ) as EnumToken),
                    //     chi: trimArray(tokens.splice(index + 1, i - index - 1)),
                    // });

                    if (
                        arena.getType(tokens[index]) === EnumToken.WildCardFunctionTokenType &&
                        arena.equalsIgnoreCase(tokens[index] , 'val' , 'if')
                    ) {
                        const lastChild = arena.getLastChild(tokens[index]);

                        if (lastChild != 0 && arena.getType(lastChild) === EnumToken.SemiColonTokenType) {
                            
                            arena.detach(lastChild);
                        }

                        // if ((tokens[index] as FunctionToken).chi.at(-1)?.typ === EnumToken.SemiColonTokenType) {
                        //     (tokens[index] as FunctionToken).chi.pop();
                        // }

                        let foundElse: boolean = false;

                        const children = arena.children(tokens[index]);

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
                                        r: trimArray(
                                            curr.at(-1)?.typ === EnumToken.SemiColonTokenType
                                                ? curr.slice(index + 1, -1)
                                                : curr.slice(index + 1),
                                        ),
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
                                message: `invalid color`,
                                node: tokens[index],
                                location: options.source!.getSourceLocation(tokens[index][LOCSTA]!),
                            });
                        }
                    }

                    stack.pop();
                }

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
                for (let index = i + 1; index < tokens.length - 1; index++) {
                    tokens[index] = tokens[index + 1];
                }

                tokens.length--;
                i--;
                continue;
            }

            if (tokens[i - 1]?.typ == EnumToken.WhitespaceTokenType) {
                for (let index = i - 1; index < tokens.length - 1; index++) {
                    tokens[index] = tokens[index + 1];
                }

                tokens.length--;
                i--;
            }
        }
    }

    if (stack.length > 0) {
        errors.push({
            action: "drop",
            message: "unbalanced token",
            node: stack[stack.length - 1],
            location: options.source!.getSourceLocation(stack[stack.length - 1][LOCSTA]!),
        });

        if (tokens[tokens.length - 1][LOCEND] != null) {
            name[LOCEND] = tokens[tokens.length - 1][LOCEND];
        }

        name[STATE] = EnumAstNodeStatus.Invalid;
        name[ERRORS] = result?.errors ?? [];

        //@ts-expect-error
        return Object.assign(name, {
            typ: EnumToken.DeclarationNodeType,
            nam: name.val,
            val: tokens,
        }) as AstDeclaration;
    }

    for (const value of arena.walk(tokens)) {
        if (value.typ === EnumToken.IdenTokenType && isColor(value, arena)) {
            parseColor(value, arena);
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
        if (tokens[tokens.length - 1]?.[LOCEND] != null) {
            name[LOCEND] = tokens[tokens.length - 1][LOCEND];
        }

        name[STATE] = EnumAstNodeStatus.Unknown;
        name[ERRORS] = result?.errors ?? [];

        // @ts-expect-error
        return Object.assign(name, {
            typ: EnumToken.DeclarationNodeType,
            nam: name.val,
            val: tokens,
        }) as AstDeclaration;
    }

    if (equalsIgnoreCase("composes", name.val)) {
        let index: number = -1;

        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].typ === EnumToken.IdenTokenType && equalsIgnoreCase("from", (tokens[i] as IdentToken).val)) {
                index = i;
                break;
            }
        }

        const left = trimArray(index == -1 ? tokens : tokens.slice(0, index), options);
        const right = index == -1 ? null : trimArray(tokens.slice(index + 1), options);
        tokens = [
            {
                typ: EnumToken.ComposesSelectorNodeType,
                l: left,
                r: right?.[0] ?? null,
                [LOCSRCID]: tokens[0][LOCSRCID],
                [LOCSTA]: tokens[0][LOCSTA],
                [LOCEND]: index != -1 ? right![right!.length - 1]?.[LOCEND] : left[left.length - 1][LOCEND],
            } as ComposesSelectorToken,
        ];
    }

    if (tokens[tokens.length - 1]?.[LOCEND] != null) {
        name[LOCEND] = tokens[tokens.length - 1][LOCEND];
    }

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
    }) as AstDeclaration;
}
