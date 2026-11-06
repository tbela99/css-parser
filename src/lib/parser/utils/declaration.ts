import type { AstAtRule, AstDeclaration, AstKeyframesRule, AstNode, Token, AstRule, AstStyleSheet, ErrorDescription, ParserOptions } from "../../../@types/index.d.ts";
import { ColorType, EnumAstNodeStatus, EnumToken } from "../../ast/types.ts";
import { type AstArena, TokenField } from "../../ast/arena.ts";
import {
    COLORS_NAMES,
    deprecatedSystemColors,
    nonStandardColors,
    systemColors,
    tokensfuncDefMap,
    tokensMap,
    trimTokenSpace,
} from "../../syntax/constants.ts";
import { isColor, isWhiteSpace, parseColor, renamedStandardProperties } from "../../syntax/syntax.ts";
import { getParsedSyntax, getSyntaxRule, ValidationSyntaxRule } from "../../validation/config.ts";
import { createValidationContext, matchAllSyntaxes, matchDeclarationSyntax, trimArray } from "../../validation/match.ts";
import type { ValidationMatch } from "../../validation/types.d.ts";
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from "../../validation/parser/typedef.ts";
import { visitValues } from "../../ast/walk.ts";
import type { ValidationPropertyToken } from "../../validation/parser/types.d.ts";
import { equalsIgnoreCase, lowercase } from "./text.ts";
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
 * parse the color of an identifier or a color token, see {@link visitValues}
 * @param arena
 * @param value
 */
function parseColorToken(arena: AstArena, value: Token): void {
    if (arena.dataTypes[value] === EnumToken.IdenTokenType && isColor(arena, value)) {
        parseColor(arena, value);
    } else if (arena.dataTypes[value] === EnumToken.ColorTokenType) {
        if (isColor(arena, value)) {
            parseColor(arena, value);
        }
    }
}

/**
 * parse the color of an identifier, see {@link visitValues}
 * @param arena
 * @param value
 */
function parseColorIdent(arena: AstArena, value: Token): void {
    if (arena.dataTypes[value] === EnumToken.IdenTokenType && isColor(arena, value)) {
        parseColor(arena, value);
    }
}

/**
 * Build the declaration node from the name token and the value tokens.
 * @param arena
 * @param name name token id
 * @param tokens
 * @param state
 * @param errors
 */
function createDeclarationNode(
    arena: AstArena,
    name: Token,
    tokens: Token[],
    state: EnumAstNodeStatus,
    errors: ErrorDescription[] | null,
): AstDeclaration {
    const node: AstDeclaration = arena.createDeclaration(
        EnumToken.DeclarationNodeType,
        arena.strings[arena.stringValue[name]],
        tokens,
        state,
        errors,
    );

    arena.copyLocation(node, name);
    return node;
}

/**
 * Parse declaration
 * @param arena
 * @param tokens
 * @param parent parent node id or at-rule token
 * @param options
 * @param errors
 */

export function parseDeclaration(
    arena: AstArena,
    tokens: Token[],
    parent: AstNode | Token | null,
    options: ParserOptions,
    errors: ErrorDescription[],
): AstDeclaration {
    const name: Token = tokens.shift() as Token;
    let i: number;
    let nam: string = arena.strings[arena.stringValue[name]];

    // parent at-rule name
    const isAtRule: boolean =
        parent != null && typeof parent == "number" && arena.dataTypes[parent] === EnumToken.AtRuleNodeType;
    const parentNam: string | null = isAtRule ? arena.strings[arena.name[parent as AstNode]] : null;
    let rules: ValidationSyntaxRule | null = null;
    let syntaxRules = null;
    let success: boolean = true;
    let hasImportantFlag: boolean = false;

    let validate: boolean = !!options.validation;

    if (renamedStandardProperties.has(nam)) {
        nam = renamedStandardProperties.get(nam) as string;
        arena.setStr(name, nam);
    }

    for (i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (
            arena.dataTypes[token] == EnumToken.WhitespaceTokenType ||
            arena.dataTypes[token] == EnumToken.CommentTokenType ||
            arena.dataTypes[token] == EnumToken.InvalidCommentTokenType
        ) {
            continue;
        }

        break;
    }

    if (
        (arena.typeOf(name) !== EnumToken.IdenTokenType && arena.typeOf(name) !== EnumToken.DashedIdenTokenType) ||
        arena.dataTypes[tokens[i]] !== EnumToken.ColonTokenType
    ) {
        if (tokens.length > 0) {
            arena.spanLocation(name, name, tokens[tokens.length - 1]);
        }

        // unparsed declaration: stored as a raw node
        const node: AstNode = arena.createDeclaration(EnumToken.RawNodeTokenType, "", tokens, null, null);

        arena.copyLocation(node, name);
        return node;
    }

    // value tokens, without the leading and trailing whitespace: a single copy
    let start: number = i + 1;
    let end: number = tokens.length;

    while (start < end && arena.dataTypes[tokens[start]] === EnumToken.WhitespaceTokenType) {
        start++;
    }

    while (end > start && arena.dataTypes[tokens[end - 1]] === EnumToken.WhitespaceTokenType) {
        end--;
    }

    tokens = tokens.slice(start, end);

    if (validate && arena.typeOf(name) === EnumToken.IdenTokenType) {
        if (isAtRule && parentNam != "import" && parentNam != "supports" && parentNam != "media") {
            // check @at-rule description
            // pick up the syntax or reject immediately

            // else do this
            rules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + parentNam);

            if (rules != null) {
                const propertyDescriptors = rules.getPropertyDescriptors();

                if (propertyDescriptors != null) {
                    syntaxRules = propertyDescriptors[lowercase(nam)];
                } else {
                    syntaxRules =
                        rules.acceptAnyDeclaration && rules.acceptAnyRule
                            ? getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, lowercase(nam))
                            : rules.getBlockRules();
                }
            }
        } else {
            syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, lowercase(nam));
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
                isAtRule &&
                (parentNam === "swash" ||
                    parentNam === "annotation" ||
                    parentNam === "ornaments" ||
                    parentNam === "stylistic" ||
                    parentNam === "historical-forms")
            ) {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident");
            } else if (isAtRule && parentNam === "styleset") {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident-list");
            } else if (isAtRule && parentNam === "character-variant") {
                syntaxRules = getParsedSyntax(
                    ValidationSyntaxGroupEnum.Syntaxes,
                    "font-feature-custom-ident-character-variant",
                );
            } else {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, lowercase(nam));
            }
        }
    }

    if (tokens.length === 0 && arena.typeOf(name) !== EnumToken.DashedIdenTokenType) {
        errors.push({
            action: "drop",
            message: "declaration value missing",
            node: name,
            location: options.source!.getSourceLocation(arena.getSpanStart(name)),
        });

        return createDeclarationNode(arena, name, tokens, EnumAstNodeStatus.Invalid, [errors[errors.length - 1]]);
    }

    const stack: Token[] = [];

    let result: ValidationMatch | null = null;
    let token: Token;
    let index: number;

    if (syntaxRules != null) {
        const doNotValidate: boolean = options.validation === false;
        result = doNotValidate ? null : matchDeclarationSyntax(arena, syntaxRules, tokens, options);

        if (doNotValidate || result != null) {
            success = doNotValidate || (result?.success as boolean);

            if (success) {
                visitValues(arena, tokens, parseColorToken);
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

        if (
            tokensfuncDefMap.has(arena.dataTypes[token]) ||
            arena.dataTypes[token] == EnumToken.StartParensTokenType ||
            arena.dataTypes[token] == EnumToken.BlockStartTokenType
        ) {
            stack.push(token);
            continue;
        }

        if (arena.dataTypes[token] === EnumToken.ColonTokenType && stack.length == 0) {
            stack.push(token);
            continue;
        }

        switch (arena.dataTypes[token]) {
            case EnumToken.Literal:
                if (arena.strings[arena.stringValue[token]] === "/" && arena.typeOf(stack.at(-1)) == EnumToken.MathFunctionTokenDefType) {
                    arena.dataTypes[token] = EnumToken.Div;
                } else if (
                    arena.strings[arena.stringValue[token]] === "-" &&
                    arena.typeOf(stack.at(-1)) == EnumToken.MathFunctionTokenDefType
                ) {
                    arena.dataTypes[token] = EnumToken.Sub;
                }

                break;

            case EnumToken.Star:
            case EnumToken.Plus:
                arena.dataTypes[token] = tokensMap.get(arena.dataTypes[token]) as EnumToken;

                break;

            case EnumToken.BlockEndTokenType:
                if (arena.typeOf(stack.at(-1)) === EnumToken.BlockStartTokenType) {
                    // stack.pop();index = tokens.indexOf(stack.at(-1)!);
                    index = tokens.indexOf(stack.at(-1)!);
                    tokens.splice(i, 1);

                    arena.dataTypes[tokens[index]] = EnumToken.WrappedValuesTokenType;
                    arena.setTokenList(tokens[index], trimArray(arena, tokens.splice(index + 1, i - index - 1)));

                    i = index;
                    stack.pop();
                }

                break;

            case EnumToken.EndParensTokenType:
                if (
                    stack.length > 0 &&
                    (arena.dataTypes[stack[stack.length - 1]] === EnumToken.StartParensTokenType ||
                        tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]]))
                ) {
                    index = tokens.indexOf(stack.at(-1)!);

                    tokens.splice(i, 1);

                    arena.dataTypes[tokens[index]] =
                        arena.dataTypes[stack[stack.length - 1]] === EnumToken.StartParensTokenType
                            ? EnumToken.ParensTokenType
                            : (tokensfuncDefMap.get(arena.dataTypes[stack[stack.length - 1]]) as EnumToken);
                    arena.setTokenList(tokens[index], trimArray(arena, tokens.splice(index + 1, i - index - 1)));

                    if (
                        arena.dataTypes[tokens[index]] === EnumToken.WildCardFunctionTokenType &&
                        equalsIgnoreCase(arena.strings[arena.stringValue[tokens[index]]], "if")
                    ) {
                        const last: Token = arena.lastToken[tokens[index]];

                        if (last != 0 && arena.dataTypes[last] === EnumToken.SemiColonTokenType) {
                            arena.detach(last);
                        }

                        let foundElse: boolean = false;

                        arena.setTokens(
                            tokens[index],
                            ...splitTokenList(
                                arena,
                                arena.tokens(tokens[index]),
                                [EnumToken.SemiColonTokenType],
                                true,
                            ).reduce((acc: Token[], curr: Token[]) => {
                            if (foundElse) {
                                // else already found
                                // ignore everything after else
                                // if(media(any-pointer: fine): 30px; else: 44px; media(any-pointer: fine): 23px); -> if(media(any-pointer: fine): 30px; else: 44px;);
                                return acc;
                            }

                            let index = -1;

                            while (++index < curr.length) {
                                if (
                                    arena.dataTypes[curr[index]] == EnumToken.IdenTokenType &&
                                    equalsIgnoreCase("else", arena.strings[arena.stringValue[curr[index]]])
                                ) {
                                    foundElse = true;
                                }

                                if (arena.dataTypes[curr[index]] === EnumToken.ColonTokenType) {
                                    break;
                                }
                            }

                            if (foundElse && acc.length > 0) {
                                const condition: Token = arena.createToken(EnumToken.IfConditionTokenType);

                                arena.setField(condition, TokenField.L, ...trimArray(arena, curr.slice(0, index)));
                                arena.setField(
                                    condition,
                                    TokenField.R,
                                    ...trimArray(
                                        arena,
                                        arena.typeOf(curr.at(-1)) === EnumToken.SemiColonTokenType
                                            ? curr.slice(index + 1, -1)
                                            : curr.slice(index + 1),
                                    ),
                                );

                                const ifElse: Token = arena.createToken(EnumToken.IfElseConditionTokenType);

                                arena.setField(ifElse, TokenField.L, acc[acc.length - 1]);
                                arena.setField(ifElse, TokenField.R, condition);
                                acc[acc.length - 1] = ifElse;
                            } else {
                                const condition: Token = arena.createToken(EnumToken.IfConditionTokenType);

                                arena.setField(condition, TokenField.L, ...trimArray(arena, curr.slice(0, index)));
                                arena.setField(condition, TokenField.R, ...trimArray(arena, curr.slice(index + 1)));
                                acc.push(condition);
                            }

                            return acc;
                        }, [] as Token[]),
                        );
                    } else if (arena.dataTypes[tokens[index]] === EnumToken.UrlFunctionTokenType) {
                        const url: Token | null = arena.findToken(
                            tokens[index],
                            (t: Token) => arena.dataTypes[t] === EnumToken.StringTokenType,
                        );

                        if (url != null && /^[a-zA-Z0-0/_.-]+$/.test(arena.strings[arena.stringValue[url]].slice(1, -1))) {
                            arena.dataTypes[url] = EnumToken.UrlTokenTokenType;
                            arena.setStr(url, arena.strings[arena.stringValue[url]].slice(1, -1));
                        }
                    }

                    i = index;

                    if (
                        arena.dataTypes[tokens[index]] === EnumToken.MathFunctionTokenType &&
                        equalsIgnoreCase("calc", arena.strings[arena.stringValue[tokens[index]]])
                    ) {
                        arena.setTokens(tokens[index], buildExpression(arena, arena.tokens(tokens[index])));
                    } else if (arena.dataTypes[tokens[index]] === EnumToken.ColorTokenType) {
                        if (isColor(arena, tokens[index])) {
                            parseColor(arena, tokens[index]);
                        } else {
                            success = false;
                            arena.dataTypes[tokens[index]] = EnumToken.FunctionTokenType;

                            errors.push({
                                action: "drop",
                                message: `invalid color`,
                                node: tokens[index],
                                location: options.source!.getSourceLocation(arena.getSpanStart(tokens[index])),
                            });
                        }
                    }

                    stack.pop();
                }

                break;

            case EnumToken.IdenTokenType:
                {
                    const val: string = lowercase(arena.strings[arena.stringValue[token]]);

                    if (val in COLORS_NAMES || val === "currentcolor") {
                        arena.setStr(token, val);
                        arena.dataTypes[token] = EnumToken.ColorTokenType;
                        arena.setColorType(token, ColorType.LIT);
                    } else if (nonStandardColors.has(val)) {
                        arena.dataTypes[token] = EnumToken.ColorTokenType;
                        arena.setColorType(token, ColorType.NON_STD);
                    } else if (systemColors.has(val)) {
                        arena.dataTypes[token] = EnumToken.ColorTokenType;
                        arena.setColorType(token, ColorType.SYS);
                    } else if (deprecatedSystemColors.has(val)) {
                        arena.dataTypes[token] = EnumToken.ColorTokenType;
                        arena.setColorType(token, ColorType.DPSYS);
                    }
                }

                break;

            case EnumToken.ImportantTokenType:
                hasImportantFlag = true;
                break;
        }

        if (trimTokenSpace.has(arena.dataTypes[token])) {
            if (arena.dataTypes[tokens[i + 1]] === EnumToken.WhitespaceTokenType) {
                for (let index = i + 1; index < tokens.length - 1; index++) {
                    tokens[index] = tokens[index + 1];
                }

                tokens.length--;
                i--;
                continue;
            }

            if (arena.dataTypes[tokens[i - 1]] == EnumToken.WhitespaceTokenType) {
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
            location: options.source!.getSourceLocation(arena.getSpanStart(stack[stack.length - 1])),
        });

        if (tokens.length > 0) {
            arena.spanLocation(name, name, tokens[tokens.length - 1]);
        }

        return createDeclarationNode(arena, name, tokens, EnumAstNodeStatus.Invalid, result?.errors ?? null);
    }

    visitValues(arena, tokens, parseColorIdent);

    if (
        nam === "grid" ||
        nam === "grid-template-areas" ||
        nam === "grid-template-rows" ||
        nam === "grid-template-columns"
    ) {
        let i: number = 0;

        for (; i < tokens.length; i++) {
            if (arena.dataTypes[tokens[i]] === EnumToken.StringTokenType) {
                if (/[\s.]/.test(arena.strings[arena.stringValue[tokens[i]]])) {
                    arena.setStr(tokens[i], parseGridTemplate(arena.strings[arena.stringValue[tokens[i]]]));
                }

                if (
                    arena.dataTypes[tokens[i + 1]] === EnumToken.WhitespaceTokenType &&
                    arena.dataTypes[tokens[i + 2]] === EnumToken.StringTokenType
                ) {
                    tokens.splice(i + 1, 1);
                }
            }
        }
    }

    if (validate && syntaxRules == null && arena.typeOf(name) === EnumToken.IdenTokenType) {
        if (tokens.length > 0) {
            arena.spanLocation(name, name, tokens[tokens.length - 1]);
        }

        return createDeclarationNode(
            arena,
            name,
            tokens,
            hasImportantFlag ? EnumAstNodeStatus.Unknown | EnumAstNodeStatus.ImportantDeclaration : EnumAstNodeStatus.Unknown,
            result?.errors ?? null,
        );
    }

    if (equalsIgnoreCase("composes", nam)) {
        let index: number = -1;

        for (let i = 0; i < tokens.length; i++) {
            if (arena.dataTypes[tokens[i]] === EnumToken.IdenTokenType && equalsIgnoreCase("from", arena.strings[arena.stringValue[tokens[i]]])) {
                index = i;
                break;
            }
        }

        const left: Token[] = trimArray(arena, index == -1 ? tokens : tokens.slice(0, index));
        const right: Token[] | null = index == -1 ? null : trimArray(arena, tokens.slice(index + 1));
        const composes: Token = arena.createToken(EnumToken.ComposesSelectorNodeType);
        const first: Token = tokens[0];
        const last: Token = index != -1 && right!.length > 0 ? right![right!.length - 1] : left[left.length - 1];

        arena.setField(composes, TokenField.L, ...left);

        if (right != null && right.length > 0) {
            arena.setField(composes, TokenField.R, right[0]);
        }

        if (first != null && last != null) {
            arena.spanLocation(composes, first, last);
        }

        tokens = [composes];
    }

    if (tokens.length > 0) {
        arena.spanLocation(name, name, tokens[tokens.length - 1]);
    }

    let state: EnumAstNodeStatus = success
        ? result == null
            ? EnumAstNodeStatus.Unvalidated
            : EnumAstNodeStatus.Validated
        : EnumAstNodeStatus.ValidationFailed;

    if (hasImportantFlag) {
        state |= EnumAstNodeStatus.ImportantDeclaration;
    }

    return createDeclarationNode(arena, name, tokens, state, result?.errors ?? null);
}
