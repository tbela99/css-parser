import { EnumToken, ColorType, ValidationLevel } from '../../ast/types.js';
import { definedPropertySettings, tokensfuncDefMap, COLORS_NAMES, nonStandardColors, systemColors, deprecatedSystemColors, tokensMap, trimTokenSpace } from '../../syntax/constants.js';
import { renamedStandardProperties, isColor, parseColor, isWhiteSpace, isValue } from '../../syntax/syntax.js';
import { getSyntaxRule, getParsedSyntax } from '../../validation/config.js';
import { trimArray, matchAllSyntax, createValidationContext } from '../../validation/match.js';
import { ValidationTokenEnum, ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { walkValues } from '../../ast/walk.js';
import { equalsIgnoreCase } from './text.js';
import { buildExpression } from '../../ast/math/expression.js';

function parseGridTemplate(template) {
    let result = "";
    let buffer = "";
    for (let i = 0; i < template.length; i++) {
        const char = template[i];
        if (isWhiteSpace(char.codePointAt(0))) {
            while (i + 1 < template.length && isWhiteSpace(template[i + 1].codePointAt(0))) {
                i++;
            }
            result += buffer + " ";
            buffer = "";
        }
        else if (char == ".") {
            while (i + 1 < template.length && template[i + 1] == ".") {
                i++;
            }
            if (isWhiteSpace(result.at(-1)?.codePointAt(0))) {
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
function isDeclarationValue(tokens) {
    const stack = [];
    let i = 0;
    for (; i < tokens.length; i++) {
        if (tokens[i].typ === EnumToken.WhitespaceTokenType || tokens[i].typ === EnumToken.CommentTokenType) {
            continue;
        }
        else if (tokensfuncDefMap.has(tokens[i].typ) || tokens[i].typ === EnumToken.StartParensTokenType) {
            stack.push(tokens[i]);
        }
        else if (tokens[i].typ === EnumToken.CommaTokenType || tokens[i].typ === EnumToken.LiteralTokenType) {
            stack.push(tokens[i]);
        }
        else if (isValue(tokens[i])) {
            if (stack.at(-1)?.typ === EnumToken.LiteralTokenType) {
                stack.pop();
            }
        }
        else if (tokens[i].typ === EnumToken.EndParensTokenType) {
            if (stack.at(-1)?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                stack.pop();
            }
        }
    }
    return {
        success: stack.length === 0,
        errors: stack.length > 0
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
function parseDeclaration(tokens, parent, options, errors) {
    const name = tokens.shift();
    let i;
    let syntaxRules = null;
    let success = true;
    let validate = typeof options.validation === "boolean"
        ? options.validation
        : options.validation & ValidationLevel.Declaration;
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
        return Object.defineProperty(Object.assign({
            typ: EnumToken.RawNodeTokenType,
            chi: tokens,
        }), "loc", {
            ...definedPropertySettings,
            value: {
                ...name.loc,
                end: tokens[tokens.length - 1]?.loc?.end ?? name.loc.end,
            },
        });
    }
    tokens = trimArray(tokens.slice(i + 1));
    for (i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token.typ == EnumToken.WhitespaceTokenType ||
            token.typ == EnumToken.CommentTokenType ||
            token.typ == EnumToken.InvalidCommentTokenType) {
            continue;
        }
        if (tokens[i].typ === EnumToken.UrlFunctionTokenDefType) {
            let k = i;
            while (k < tokens.length) {
                if (tokens[++k]?.typ === EnumToken.WhitespaceTokenType || tokens[k]?.typ === EnumToken.CommentTokenType) {
                    continue;
                }
                if (tokens[k]?.typ !== EnumToken.EndParensTokenType) {
                    break;
                }
            }
            if (tokens[k].typ === EnumToken.LiteralTokenType ||
                tokens[k].typ === EnumToken.IdenTokenType ||
                tokens[k].typ === EnumToken.DashedIdenTokenType ||
                tokens[k].typ === EnumToken.HashTokenType ||
                tokens[k].typ === EnumToken.ClassSelectorTokenType) {
                let j = k;
                let val = tokens[k].val;
                while (j + 1 < tokens.length) {
                    if (tokens[++j].typ !== EnumToken.LiteralTokenType &&
                        tokens[j].typ !== EnumToken.IdenTokenType &&
                        tokens[j].typ !== EnumToken.DashedIdenTokenType &&
                        tokens[j].typ !== EnumToken.HashTokenType &&
                        tokens[j].typ !== EnumToken.ClassSelectorTokenType) {
                        break;
                    }
                    val += tokens[j].val;
                }
                Object.assign(tokens[k], {
                    typ: EnumToken.UrlTokenTokenType,
                    val,
                });
                tokens[k].loc.end = tokens[j].loc.end;
                tokens.splice(k + 1, j - k - 1);
                // console.debug(tokens[k]);
            }
        }
    }
    // console.debug(JSON.stringify(tokens, null, 1));
    if (validate && name.typ === EnumToken.IdenTokenType) {
        if (parent != null &&
            (parent.typ == EnumToken.AtRuleNodeType || parent.typ === EnumToken.InvalidAtRuleNodeType) &&
            parent.nam != "import" &&
            parent.nam != "supports" &&
            parent.nam != "media") {
            // check @at-rule description
            // pick up the syntax or reject immediately
            // else do this
            const rules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + parent.nam);
            if (rules != null) {
                const propertyDescriptors = rules.getPropertyDescriptors();
                if (propertyDescriptors != null) {
                    syntaxRules = propertyDescriptors[name.val.toLowerCase()];
                }
                else {
                    syntaxRules = rules.getBlockRules();
                    if (syntaxRules == null) {
                        errors.push({
                            action: "drop",
                            message: "declaration not allowed in context",
                            node: name,
                            location: name.loc,
                        });
                        return Object.defineProperty(Object.assign(name, {
                            typ: EnumToken.InvalidDeclarationNodeType,
                            nam: name.val,
                            val: tokens,
                        }), "loc", {
                            ...definedPropertySettings,
                            value: {
                                ...name.loc,
                                end: tokens[tokens.length - 1].loc.end,
                            },
                        });
                    }
                }
            }
        }
        // <declaration-list> or <declaration-rule-list>
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
            location: name.loc,
        });
        return Object.defineProperty(Object.assign(name, {
            typ: EnumToken.InvalidDeclarationNodeType,
            nam: name.val,
            val: tokens,
        }), "loc", {
            ...definedPropertySettings,
            value: {
                ...name.loc,
                end: tokens[tokens.length - 1]?.loc.end ?? name.loc.end,
            },
        });
    }
    let result = null;
    const stack = [];
    let token;
    let index;
    if (syntaxRules != null) {
        const doNotValidate = options.validation === false || options.validation === ValidationLevel.None;
        result = doNotValidate ? null : matchAllSyntax(syntaxRules, createValidationContext(tokens), options);
        if (doNotValidate || result != null) {
            success = doNotValidate || result?.success;
            if (success) {
                for (const { value } of walkValues(tokens)) {
                    if (value.typ === EnumToken.IdenTokenType && isColor(value)) {
                        parseColor(value);
                        // continue;
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
            if (!doNotValidate && !(success || result.success)) {
                return Object.defineProperty(Object.assign(name, {
                    typ: EnumToken.InvalidDeclarationNodeType,
                    nam: name.val,
                    val: tokens,
                }), "loc", {
                    ...definedPropertySettings,
                    value: {
                        ...name.loc,
                        end: tokens[tokens.length - 1]?.loc.end ?? name.loc.end,
                    },
                });
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
                    token.loc.end = tokens[i + 1].loc.end;
                    tokens.splice(i + 1, 1);
                    stack.push(token);
                }
                break;
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
            case EnumToken.EndParensTokenType:
                if (stack.at(-1)?.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                    index = tokens.indexOf(stack.at(-1));
                    tokens.splice(i, 1);
                    Object.assign(tokens[index], {
                        typ: stack.at(-1)?.typ === EnumToken.StartParensTokenType
                            ? EnumToken.ParensTokenType
                            : tokensfuncDefMap.get(stack.at(-1)?.typ),
                        chi: trimArray(tokens.splice(index + 1, i - index - 1)),
                    });
                    if (tokens[index].typ === EnumToken.UrlFunctionTokenType) {
                        let l = -1;
                        while (++l < tokens[index].chi.length) {
                            if (tokens[index].chi[l].typ === EnumToken.StringTokenType) {
                                break;
                            }
                            else if (tokens[index].chi[l].typ === EnumToken.IdenTokenType) {
                                let m = l + 1;
                                while (tokens[index].chi[m]?.typ === EnumToken.ClassSelectorTokenType) {
                                    Object.assign(tokens[index].chi[l], {
                                        typ: EnumToken.UrlTokenTokenType,
                                        val: tokens[index].chi[l].val +
                                            tokens[index].chi[m].val,
                                    });
                                    tokens[index].chi[l].loc.end = tokens[index].chi[m].loc.end;
                                    tokens[index].chi.splice(m, 1);
                                }
                                break;
                            }
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
                                message: `invalid color at ${tokens[index].loc?.src}:${tokens[index].loc?.sta.lin}:${tokens[index].loc?.sta.col}`,
                            });
                        }
                    }
                }
                stack.pop();
                break;
            case EnumToken.IdenTokenType:
                {
                    const val = token.val.toLocaleLowerCase();
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
            message: "unbalanced parenthesis",
            node: stack[stack.length - 1],
            location: stack[stack.length - 1].loc,
        });
        return Object.defineProperty(Object.assign(name, {
            typ: EnumToken.InvalidDeclarationNodeType,
            nam: name.val,
            val: tokens,
        }), "loc", {
            ...definedPropertySettings,
            value: {
                ...name.loc,
                end: tokens[tokens.length - 1].loc.end,
            },
        });
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
        const node = Object.defineProperty(Object.assign(name, {
            typ: options.validation & ValidationLevel.Declaration
                ? EnumToken.InvalidDeclarationNodeType
                : EnumToken.DeclarationNodeType,
            nam: name.val,
            val: tokens,
        }), "loc", {
            ...definedPropertySettings,
            value: {
                ...name.loc,
                end: tokens[tokens.length - 1]?.loc?.end ?? name.loc.end,
            },
        });
        if (options.validation & ValidationLevel.Declaration) {
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
            Object.defineProperty({
                typ: EnumToken.ComposesSelectorNodeType,
                l: left,
                r: right?.[0] ?? null,
            }, "loc", {
                ...definedPropertySettings,
                value: {
                    ...tokens[0].loc,
                    sta: left[0]?.loc?.sta,
                    end: index != -1 ? right[right.length - 1]?.loc?.end : left[left.length - 1].loc.end,
                },
            }),
        ];
    }
    return Object.defineProperty(Object.assign(name, {
        typ: success ? EnumToken.DeclarationNodeType : EnumToken.InvalidDeclarationNodeType,
        nam: name.val,
        val: tokens,
    }), "loc", {
        ...definedPropertySettings,
        value: {
            ...name.loc,
            end: (tokens[tokens.length - 1] ?? name).loc.end,
        },
    });
}

export { isDeclarationValue, parseDeclaration };
