/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.1
	License: MIT
 */
import { EnumToken, ColorType, EnumAstNodeStatus } from '../../ast/types.js';
import { TokenField } from '../../ast/arena.js';
import { tokensfuncDefMap, COLORS_NAMES, nonStandardColors, systemColors, deprecatedSystemColors, tokensMap, trimTokenSpace } from '../../syntax/constants.js';
import { renamedStandardProperties, isColor, parseColor, isWhiteSpace } from '../../syntax/syntax.js';
import { getSyntaxRule, getParsedSyntax } from '../../validation/config.js';
import { matchDeclarationSyntax, trimArray } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from '../../validation/parser/typedef.js';
import { lowercase, equalsIgnoreCase } from './text.js';
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
 * parse the color of an identifier or a color token, see {@link AstArena.visitValues}
 * @param arena
 * @param value
 */
function parseColorToken(arena, value) {
    if (arena.dataTypes[value] === EnumToken.IdenTokenType && isColor(arena, value)) {
        parseColor(arena, value);
    }
    else if (arena.dataTypes[value] === EnumToken.ColorTokenType) {
        if (isColor(arena, value)) {
            parseColor(arena, value);
        }
    }
}
/**
 * parse the color of an identifier, see {@link AstArena.visitValues}
 * @param arena
 * @param value
 */
function parseColorIdent(arena, value) {
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
function createDeclarationNode(arena, name, tokens, state, errors) {
    const node = arena.createDeclaration(EnumToken.DeclarationNodeType, arena.strings[arena.stringValue[name]], tokens, state, errors);
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
function parseDeclaration(arena, tokens, parent, options, errors) {
    const name = tokens.shift();
    let i;
    let nam = arena.strings[arena.stringValue[name]];
    // parent at-rule name
    const isAtRule = parent != null && typeof parent == "number" && arena.dataTypes[parent] === EnumToken.AtRuleNodeType;
    const parentNam = isAtRule ? arena.strings[arena.name[parent]] : null;
    let rules = null;
    let syntaxRules = null;
    let success = true;
    let hasImportantFlag = false;
    let validate = !!options.validation;
    if (renamedStandardProperties.has(nam)) {
        nam = renamedStandardProperties.get(nam);
        // inlined: arena.setStr(name, nam)
        arena.stringValue[name] = arena.internString(nam);
    }
    for (i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (arena.dataTypes[token] == EnumToken.WhitespaceTokenType ||
            arena.dataTypes[token] == EnumToken.CommentTokenType ||
            arena.dataTypes[token] == EnumToken.BadCdoTokenType) {
            continue;
        }
        break;
    }
    if (
    // inlined: arena.typeOf(name)
    (arena.dataTypes[name] !== EnumToken.IdenTokenType && arena.dataTypes[name] !== EnumToken.DashedIdenTokenType) ||
        arena.dataTypes[tokens[i]] !== EnumToken.ColonTokenType) {
        if (tokens.length > 0) {
            arena.spanLocation(name, name, tokens[tokens.length - 1]);
        }
        // unparsed declaration: stored as a raw node
        const node = arena.createDeclaration(EnumToken.RawNodeTokenType, "", tokens, null, null);
        arena.copyLocation(node, name);
        return node;
    }
    // value tokens, without the leading and trailing whitespace: a single copy
    let start = i + 1;
    let end = tokens.length;
    while (start < end && arena.dataTypes[tokens[start]] === EnumToken.WhitespaceTokenType) {
        start++;
    }
    while (end > start && arena.dataTypes[tokens[end - 1]] === EnumToken.WhitespaceTokenType) {
        end--;
    }
    tokens = tokens.slice(start, end);
    // inlined: arena.typeOf(name)
    if (validate && arena.dataTypes[name] === EnumToken.IdenTokenType) {
        if (isAtRule && parentNam != "import" && parentNam != "supports" && parentNam != "media") {
            // check @at-rule description
            // pick up the syntax or reject immediately
            // else do this
            rules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + parentNam);
            if (rules != null) {
                const propertyDescriptors = rules.getPropertyDescriptors();
                if (propertyDescriptors != null) {
                    syntaxRules = propertyDescriptors[lowercase(nam)];
                }
                else {
                    syntaxRules =
                        rules.acceptAnyDeclaration && rules.acceptAnyRule
                            ? getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, lowercase(nam))
                            : rules.getBlockRules();
                }
            }
        }
        else {
            syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, lowercase(nam));
        }
        // <declaration-list> or <declaration-rule-list>
        // else
        if (syntaxRules == null ||
            (syntaxRules.length === 1 &&
                syntaxRules[0].typ === ValidationTokenEnum.PropertyType &&
                (syntaxRules[0].val === "declaration-list" ||
                    syntaxRules[0].val === "declaration-rule-list"))) {
            if (isAtRule &&
                (parentNam === "swash" ||
                    parentNam === "annotation" ||
                    parentNam === "ornaments" ||
                    parentNam === "stylistic" ||
                    parentNam === "historical-forms")) {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident");
            }
            else if (isAtRule && parentNam === "styleset") {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident-list");
            }
            else if (isAtRule && parentNam === "character-variant") {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident-character-variant");
            }
            else {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, lowercase(nam));
            }
        }
    }
    // inlined: arena.typeOf(name)
    if (tokens.length === 0 && arena.dataTypes[name] !== EnumToken.DashedIdenTokenType) {
        errors.push({
            action: "drop",
            message: "declaration value missing",
            node: name,
            // inlined: options.source!.getSourceLocation(arena.getSpanStart(name))
            location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(name))],
        });
        return createDeclarationNode(arena, name, tokens, EnumAstNodeStatus.Invalid, [errors[errors.length - 1]]);
    }
    const stack = [];
    let result = null;
    let token;
    let index;
    if (syntaxRules != null) {
        const doNotValidate = options.validation === false;
        result = doNotValidate ? null : matchDeclarationSyntax(arena, syntaxRules, tokens, options);
        if (doNotValidate || result != null) {
            success = doNotValidate || result?.success;
            if (success) {
                arena.visitValues(tokens, parseColorToken);
            }
            if (!doNotValidate && !result?.success && result.errors.length > 0) {
                for (index = 0; index < result.errors.length; index++) {
                    errors.push(result.errors[index]);
                }
            }
        }
    }
    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        if (tokensfuncDefMap.has(arena.dataTypes[token]) ||
            arena.dataTypes[token] == EnumToken.StartParensTokenType ||
            arena.dataTypes[token] == EnumToken.BlockStartTokenType) {
            stack.push(token);
            continue;
        }
        if (arena.dataTypes[token] === EnumToken.ColonTokenType && stack.length == 0) {
            stack.push(token);
            continue;
        }
        switch (arena.dataTypes[token]) {
            case EnumToken.Literal:
                // inlined: arena.typeOf(stack.at(-1))
                if (arena.strings[arena.stringValue[token]] === "/" && arena.dataTypes[stack.at(-1)] == EnumToken.MathFunctionTokenDefType) {
                    arena.dataTypes[token] = EnumToken.Div;
                }
                else if (arena.strings[arena.stringValue[token]] === "-" &&
                    // inlined: arena.typeOf(stack.at(-1))
                    arena.dataTypes[stack.at(-1)] == EnumToken.MathFunctionTokenDefType) {
                    arena.dataTypes[token] = EnumToken.Sub;
                }
                break;
            case EnumToken.Star:
            case EnumToken.Plus:
                arena.dataTypes[token] = tokensMap.get(arena.dataTypes[token]);
                break;
            case EnumToken.BlockEndTokenType:
                // inlined: arena.typeOf(stack.at(-1))
                if (arena.dataTypes[stack.at(-1)] === EnumToken.BlockStartTokenType) {
                    // stack.pop();index = tokens.indexOf(stack.at(-1)!);
                    index = tokens.indexOf(stack.at(-1));
                    tokens.splice(i, 1);
                    arena.dataTypes[tokens[index]] = EnumToken.WrappedValuesTokenType;
                    arena.setTokenList(tokens[index], trimArray(arena, tokens.splice(index + 1, i - index - 1)));
                    i = index;
                    stack.pop();
                }
                break;
            case EnumToken.EndParensTokenType:
                if (stack.length > 0 &&
                    (arena.dataTypes[stack[stack.length - 1]] === EnumToken.StartParensTokenType ||
                        tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]]))) {
                    index = tokens.indexOf(stack.at(-1));
                    tokens.splice(i, 1);
                    arena.dataTypes[tokens[index]] =
                        arena.dataTypes[stack[stack.length - 1]] === EnumToken.StartParensTokenType
                            ? EnumToken.ParensTokenType
                            : tokensfuncDefMap.get(arena.dataTypes[stack[stack.length - 1]]);
                    arena.setTokenList(tokens[index], trimArray(arena, tokens.splice(index + 1, i - index - 1)));
                    if (arena.dataTypes[tokens[index]] === EnumToken.WildCardFunctionTokenType &&
                        equalsIgnoreCase(arena.strings[arena.stringValue[tokens[index]]], "if")) {
                        const last = arena.lastToken[tokens[index]];
                        if (last != 0 && arena.dataTypes[last] === EnumToken.SemiColonTokenType) {
                            arena.detach(last);
                        }
                        let foundElse = false;
                        // inlined: arena.setTokens(tokens[index], ...splitTokenList(...)), the array is passed as is
                        arena.setTokenList(tokens[index], splitTokenList(arena, arena.tokens(tokens[index]), [EnumToken.SemiColonTokenType], true).reduce((acc, curr) => {
                            if (foundElse) {
                                // else already found
                                // ignore everything after else
                                // if(media(any-pointer: fine): 30px; else: 44px; media(any-pointer: fine): 23px); -> if(media(any-pointer: fine): 30px; else: 44px;);
                                return acc;
                            }
                            let index = -1;
                            while (++index < curr.length) {
                                if (arena.dataTypes[curr[index]] == EnumToken.IdenTokenType &&
                                    equalsIgnoreCase("else", arena.strings[arena.stringValue[curr[index]]])) {
                                    foundElse = true;
                                }
                                if (arena.dataTypes[curr[index]] === EnumToken.ColonTokenType) {
                                    break;
                                }
                            }
                            if (foundElse && acc.length > 0) {
                                const condition = arena.createToken(EnumToken.IfConditionTokenType);
                                // inlined: arena.setField(condition, TokenField.L, ...trimArray(arena, curr.slice(0, index)))
                                arena.setTokenList(arena.fieldList(condition, TokenField.L), trimArray(arena, curr.slice(0, index)));
                                // inlined: arena.setField(condition, TokenField.R, ...trimArray(arena, arena.typeOf(curr.at(-1)) === EnumToken.SemiColonTokenType ? curr.slice(index + 1, -1) : curr.slice(index + 1)))
                                arena.setTokenList(arena.fieldList(condition, TokenField.R), trimArray(arena, arena.dataTypes[curr.at(-1)] === EnumToken.SemiColonTokenType
                                    ? curr.slice(index + 1, -1)
                                    : curr.slice(index + 1)));
                                const ifElse = arena.createToken(EnumToken.IfElseConditionTokenType);
                                // inlined: arena.setField(ifElse, TokenField.L, acc[acc.length - 1])
                                arena.setTokenList(arena.fieldList(ifElse, TokenField.L), [acc[acc.length - 1]]);
                                // inlined: arena.setField(ifElse, TokenField.R, condition)
                                arena.setTokenList(arena.fieldList(ifElse, TokenField.R), [condition]);
                                acc[acc.length - 1] = ifElse;
                            }
                            else {
                                const condition = arena.createToken(EnumToken.IfConditionTokenType);
                                // inlined: arena.setField(condition, TokenField.L, ...trimArray(arena, curr.slice(0, index)))
                                arena.setTokenList(arena.fieldList(condition, TokenField.L), trimArray(arena, curr.slice(0, index)));
                                // inlined: arena.setField(condition, TokenField.R, ...trimArray(arena, curr.slice(index + 1)))
                                arena.setTokenList(arena.fieldList(condition, TokenField.R), trimArray(arena, curr.slice(index + 1)));
                                acc.push(condition);
                            }
                            return acc;
                        }, []));
                    }
                    else if (arena.dataTypes[tokens[index]] === EnumToken.UrlFunctionTokenType) {
                        const url = arena.findToken(tokens[index], (arena, t) => arena.dataTypes[t] === EnumToken.StringTokenType);
                        if (url != null && /^[a-zA-Z0-0/_.-]+$/.test(arena.strings[arena.stringValue[url]].slice(1, -1))) {
                            arena.dataTypes[url] = EnumToken.UrlTokenTokenType;
                            // inlined: arena.setStr(url, arena.strings[arena.stringValue[url]].slice(1, -1))
                            arena.stringValue[url] = arena.internString(arena.strings[arena.stringValue[url]].slice(1, -1));
                        }
                    }
                    i = index;
                    if (arena.dataTypes[tokens[index]] === EnumToken.MathFunctionTokenType &&
                        equalsIgnoreCase("calc", arena.strings[arena.stringValue[tokens[index]]])) {
                        // inlined: arena.setTokens(tokens[index], buildExpression(arena, arena.tokens(tokens[index])))
                        arena.setTokenList(tokens[index], [buildExpression(arena, arena.tokens(tokens[index]))]);
                    }
                    else if (arena.dataTypes[tokens[index]] === EnumToken.ColorTokenType) {
                        if (isColor(arena, tokens[index])) {
                            parseColor(arena, tokens[index]);
                        }
                        else {
                            success = false;
                            arena.dataTypes[tokens[index]] = EnumToken.FunctionTokenType;
                            errors.push({
                                action: "drop",
                                message: `invalid color`,
                                node: tokens[index],
                                // inlined: options.source!.getSourceLocation(arena.getSpanStart(tokens[index]))
                                location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(tokens[index]))],
                            });
                        }
                    }
                    stack.pop();
                }
                break;
            case EnumToken.IdenTokenType:
                {
                    const val = lowercase(arena.strings[arena.stringValue[token]]);
                    if (val in COLORS_NAMES || val === "currentcolor") {
                        // inlined: arena.setStr(token, val)
                        arena.stringValue[token] = arena.internString(val);
                        arena.dataTypes[token] = EnumToken.ColorTokenType;
                        // inlined: arena.setColorType(token, ColorType.LIT)
                        arena.colorType[token] = ColorType.LIT;
                    }
                    else if (nonStandardColors.has(val)) {
                        arena.dataTypes[token] = EnumToken.ColorTokenType;
                        // inlined: arena.setColorType(token, ColorType.NON_STD)
                        arena.colorType[token] = ColorType.NON_STD;
                    }
                    else if (systemColors.has(val)) {
                        arena.dataTypes[token] = EnumToken.ColorTokenType;
                        // inlined: arena.setColorType(token, ColorType.SYS)
                        arena.colorType[token] = ColorType.SYS;
                    }
                    else if (deprecatedSystemColors.has(val)) {
                        arena.dataTypes[token] = EnumToken.ColorTokenType;
                        // inlined: arena.setColorType(token, ColorType.DPSYS)
                        arena.colorType[token] = ColorType.DPSYS;
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
            // inlined: options.source!.getSourceLocation(arena.getSpanStart(stack[stack.length - 1]))
            location: [options.source.file, ...options.source.lineStarts.getOffsets(arena.getSpanStart(stack[stack.length - 1]))],
        });
        if (tokens.length > 0) {
            arena.spanLocation(name, name, tokens[tokens.length - 1]);
        }
        return createDeclarationNode(arena, name, tokens, EnumAstNodeStatus.Invalid, result?.errors ?? null);
    }
    arena.visitValues(tokens, parseColorIdent);
    if (nam === "grid" ||
        nam === "grid-template-areas" ||
        nam === "grid-template-rows" ||
        nam === "grid-template-columns") {
        let i = 0;
        for (; i < tokens.length; i++) {
            if (arena.dataTypes[tokens[i]] === EnumToken.StringTokenType) {
                if (/[\s.]/.test(arena.strings[arena.stringValue[tokens[i]]])) {
                    // inlined: arena.setStr(tokens[i], parseGridTemplate(arena.strings[arena.stringValue[tokens[i]]]))
                    arena.stringValue[tokens[i]] = arena.internString(parseGridTemplate(arena.strings[arena.stringValue[tokens[i]]]));
                }
                if (arena.dataTypes[tokens[i + 1]] === EnumToken.WhitespaceTokenType &&
                    arena.dataTypes[tokens[i + 2]] === EnumToken.StringTokenType) {
                    tokens.splice(i + 1, 1);
                }
            }
        }
    }
    // inlined: arena.typeOf(name)
    if (validate && syntaxRules == null && arena.dataTypes[name] === EnumToken.IdenTokenType) {
        if (tokens.length > 0) {
            arena.spanLocation(name, name, tokens[tokens.length - 1]);
        }
        return createDeclarationNode(arena, name, tokens, hasImportantFlag ? EnumAstNodeStatus.Unknown | EnumAstNodeStatus.ImportantDeclaration : EnumAstNodeStatus.Unknown, result?.errors ?? null);
    }
    if (equalsIgnoreCase("composes", nam)) {
        let index = -1;
        for (let i = 0; i < tokens.length; i++) {
            if (arena.dataTypes[tokens[i]] === EnumToken.IdenTokenType && equalsIgnoreCase("from", arena.strings[arena.stringValue[tokens[i]]])) {
                index = i;
                break;
            }
        }
        const left = trimArray(arena, index == -1 ? tokens : tokens.slice(0, index));
        const right = index == -1 ? null : trimArray(arena, tokens.slice(index + 1));
        const composes = arena.createToken(EnumToken.ComposesSelectorNodeType);
        const first = tokens[0];
        const last = index != -1 && right.length > 0 ? right[right.length - 1] : left[left.length - 1];
        // inlined: arena.setField(composes, TokenField.L, ...left)
        arena.setTokenList(arena.fieldList(composes, TokenField.L), left);
        if (right != null && right.length > 0) {
            // inlined: arena.setField(composes, TokenField.R, right[0])
            arena.setTokenList(arena.fieldList(composes, TokenField.R), [right[0]]);
        }
        if (first != null && last != null) {
            arena.spanLocation(composes, first, last);
        }
        tokens = [composes];
    }
    if (tokens.length > 0) {
        arena.spanLocation(name, name, tokens[tokens.length - 1]);
    }
    let state = success
        ? result == null
            ? EnumAstNodeStatus.Unvalidated
            : EnumAstNodeStatus.Validated
        : EnumAstNodeStatus.ValidationFailed;
    if (hasImportantFlag) {
        state |= EnumAstNodeStatus.ImportantDeclaration;
    }
    return createDeclarationNode(arena, name, tokens, state, result?.errors ?? null);
}

export { parseDeclaration };
