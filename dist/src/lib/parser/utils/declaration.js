/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
<<<<<<< HEAD
	Version: 2.0.0-alpha.1
=======
	Version: 1.6.8
>>>>>>> v.next
	License: MIT
 */
import { EnumToken, EnumAstNodeStatus, ColorType } from '../../ast/types.js';
import { tokensfuncDefMap, COLORS_NAMES, nonStandardColors, systemColors, deprecatedSystemColors, tokensMap, trimTokenSpace } from '../../syntax/constants.js';
import { renamedStandardProperties, isColor, parseColor, isWhiteSpace } from '../../syntax/syntax.js';
import { getSyntaxRule, getParsedSyntax } from '../../validation/config.js';
import { trimArray, matchAllSyntaxes, createValidationContext } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum, ValidationTokenEnum } from '../../validation/parser/typedef.js';
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
 * Parse declaration
 * @param tokens
 * @param parent
 * @param options
 * @param errors
 */
function parseDeclaration(tokens, parent, options, errors) {
    const name = tokens.shift();
    const arena = options.arena;
    let i;
    let rules = null;
    let syntaxRules = null;
    let success = true;
    let val = arena.getValue(name);
    let token;
    let typ;
    let hasImportantFlag = false;
    let validate = typeof options.validation === "boolean" ? options.validation : !!options.validation;
    if (renamedStandardProperties.has(val)) {
        arena.setValue(name, arena.internString(renamedStandardProperties.get(val)));
    }
    for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        typ = arena.getType(token);
        if (typ == EnumToken.WhitespaceTokenType ||
            typ == EnumToken.CommentTokenType ||
            typ == EnumToken.InvalidCommentTokenType) {
            continue;
        }
        break;
    }
    typ = arena.getType(name);
    if ((typ !== EnumToken.IdenTokenType && typ !== EnumToken.DashedIdenTokenType) ||
        arena.getType(tokens[i]) !== EnumToken.ColonTokenType) {
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
                location: options.source.getSourceLocation(arena.getSpanStart(name)),
                message: "invalid declaration",
            },
        ]);
        arena.setTokens(node, ...tokens);
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
        if (parent != null &&
            typ === EnumToken.AtRuleNodeType &&
            val != "import" &&
            val != "supports" &&
            val != "media") {
            // check @at-rule description
            // pick up the syntax or reject immediately
            // else do this
            rules = getSyntaxRule(ValidationSyntaxGroupEnum.AtRules, "@" + val);
            if (rules != null) {
                const propertyDescriptors = rules.getPropertyDescriptors();
                if (propertyDescriptors != null) {
                    syntaxRules = propertyDescriptors[val.toLowerCase()];
                }
                else {
                    syntaxRules =
                        rules.acceptAnyDeclaration && rules.acceptAnyRule
                            ? getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, val)
                            : rules.getBlockRules();
                }
            }
        }
        else {
            syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Declarations, val);
        }
        // <declaration-list> or <declaration-rule-list>
        // else
        if (syntaxRules == null ||
            (syntaxRules.length === 1 &&
                syntaxRules[0].typ === ValidationTokenEnum.PropertyType &&
                (syntaxRules[0].val === "declaration-list" ||
                    syntaxRules[0].val === "declaration-rule-list"))) {
            typ = arena.getType(parent);
            val = arena.getValue(parent).toLowerCase();
            if (parent != null &&
                typ === EnumToken.AtRuleNodeType &&
                (val === "swash" ||
                    val === "annotation" ||
                    val === "ornaments" ||
                    val === "stylistic" ||
                    val === "historical-forms")) {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident");
            }
            else if (typ === EnumToken.AtRuleNodeType && val === "styleset") {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident-list");
            }
            else if (typ === EnumToken.AtRuleNodeType && val === "character-variant") {
                syntaxRules = getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, "font-feature-custom-ident-character-variant");
            }
            else {
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
            location: options.source.getSourceLocation(arena.getSpanStart(name)),
        });
        // if (tokens[tokens.length - 1]?.[LOCEND] != null) {
        //     name[LOCEND] = tokens[tokens.length - 1][LOCEND];
        // }
        arena.setFlags(name, EnumAstNodeStatus.Invalid | EnumAstNodeStatus.HasValues);
        arena.setErrors(name, [errors[errors.length - 1]]);
        arena.setName(name, arena.internString(arena.getValue(name)));
        arena.set(name, EnumToken.DeclarationNodeType, 0);
        arena.setChildren(name, ...tokens);
        return name;
        // name[STATE] = EnumAstNodeStatus.Invalid;
        // name[ERRORS] = [errors[errors.length - 1]];
        // return Object.assign(name, {
        //     typ: EnumToken.DeclarationNodeType,
        //     nam: name.val,
        //     val: tokens,
        // }) as AstDeclaration;
    }
    const stack = [];
    let result = null;
    // let token: Token;
    let index;
    if (syntaxRules != null) {
        const doNotValidate = options.validation === false;
        result = doNotValidate
            ? null
            : matchAllSyntaxes(syntaxRules, createValidationContext(tokens, options), options);
        if (doNotValidate || result != null) {
            success = doNotValidate || result?.success;
            if (success) {
                for (const value of arena.walkValues(tokens)) {
                    typ = arena.getType(value);
                    if (typ === EnumToken.IdenTokenType && isColor(value, arena)) {
                        parseColor(value, arena);
                    }
                    else if (typ === EnumToken.ColorTokenType) {
                        if (isColor(value, arena)) {
                            parseColor(value, arena);
                        }
                    }
                }
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
        typ = arena.getType(token);
        val = arena.getValue(token);
        if (tokensfuncDefMap.has(typ) ||
            typ == EnumToken.StartParensTokenType ||
            typ == EnumToken.BlockStartTokenType) {
            stack.push(token);
            continue;
        }
        if (typ === EnumToken.ColonTokenType && stack.length == 0) {
            stack.push(token);
            continue;
        }
        const stackType = arena.getType(stack.at(-1));
        switch (typ) {
            case EnumToken.Literal:
                if (arena.equalsIgnoreCase(token, "val", "/") && stackType == EnumToken.MathFunctionTokenDefType) {
                    arena.setType(token, EnumToken.Div);
                    // Object.assign(token, {
                    //     typ: EnumToken.Div,
                    // });
                }
                else if (arena.equalsIgnoreCase(token, "val", "-") &&
                    stackType == EnumToken.MathFunctionTokenDefType) {
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
                    index = tokens.indexOf(stack.at(-1));
                    tokens.splice(i, 1);
                    arena.setType(tokens[index], EnumToken.WrappedValuesTokenType);
                    arena.setChildren(tokens[index], ...trimArray(tokens.splice(index + 1, i - index - 1), options));
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
                    index = tokens.indexOf(stack.at(-1));
                    tokens.splice(i, 1);
                    arena.setType(tokens[index], stackType === EnumToken.StartParensTokenType
                        ? EnumToken.ParensTokenType
                        : tokensfuncDefMap.get(stackType));
                    arena.setChildren(tokens[index], ...trimArray(tokens.splice(index + 1, i - index - 1), options));
                    // Object.assign(tokens[index], {
                    //     typ:
                    //         stack.at(-1)?.typ === EnumToken.StartParensTokenType
                    //             ? EnumToken.ParensTokenType
                    //             : (tokensfuncDefMap.get(stack.at(-1)?.typ) as EnumToken),
                    //     chi: trimArray(tokens.splice(index + 1, i - index - 1)),
                    // });
                    if (arena.getType(tokens[index]) === EnumToken.WildCardFunctionTokenType &&
                        arena.equalsIgnoreCase(tokens[index], "val", "if")) {
                        const lastChild = arena.getLastChild(tokens[index]);
                        if (lastChild != 0 && arena.getType(lastChild) === EnumToken.SemiColonTokenType) {
                            arena.detach(lastChild);
                        }
                        // if ((tokens[index] as FunctionToken).chi.at(-1)?.typ === EnumToken.SemiColonTokenType) {
                        //     (tokens[index] as FunctionToken).chi.pop();
                        // }
                        let foundElse = false;
                        splitTokenList(arena.children(tokens[index]), options, [EnumToken.SemiColonTokenType], true).reduce((acc, curr) => {
                            if (foundElse) {
                                // else already found
                                // ignore everything after else
                                // if(media(any-pointer: fine): 30px; else: 44px; media(any-pointer: fine): 23px); -> if(media(any-pointer: fine): 30px; else: 44px;);
                                return acc;
                            }
                            let index = -1;
                            let typ = arena.getType(curr[index]);
                            while (++index < curr.length) {
                                if (typ == EnumToken.IdenTokenType &&
                                    arena.equalsIgnoreCase(curr[index], "val", "else")) {
                                    foundElse = true;
                                }
                                if (typ === EnumToken.ColonTokenType) {
                                    break;
                                }
                            }
                            if (foundElse && acc.length > 0) {
                                const leftChild = arena.allocate();
                                arena.setType(leftChild, EnumToken.ListTokenType);
                                arena.setChildren(leftChild, ...trimArray(curr.slice(0, index), options));
                                const rightChild = arena.allocate();
                                arena.setType(rightChild, EnumToken.ListTokenType);
                                arena.setChildren(rightChild, ...trimArray(arena.getType(curr.at(-1)) === EnumToken.SemiColonTokenType
                                    ? curr.slice(index + 1, -1)
                                    : curr.slice(index + 1), options));
                                const ifCondition = arena.allocate();
                                arena.setType(ifCondition, EnumToken.IfConditionTokenType);
                                arena.setLeft(ifCondition, leftChild);
                                arena.setRight(ifCondition, rightChild);
                                const ifElseLeftCondition = arena.allocate();
                                arena.setType(ifElseLeftCondition, EnumToken.IfElseConditionTokenType);
                                arena.setLeft(ifElseLeftCondition, acc[acc.length - 1]);
                                arena.setRight(ifElseLeftCondition, ifCondition);
                                acc[acc.length - 1] = ifElseLeftCondition;
                                // acc[acc.length - 1] = {
                                //     typ: EnumToken.IfElseConditionTokenType,
                                //     l: acc[acc.length - 1] as IfConditionToken,
                                //     r: {
                                //         typ: EnumToken.IfConditionTokenType,
                                //         l: trimArray(curr.slice(0, index)),
                                //         r: trimArray(
                                //             curr.at(-1)?.typ === EnumToken.SemiColonTokenType
                                //                 ? curr.slice(index + 1, -1)
                                //                 : curr.slice(index + 1),
                                //         ),
                                //     } as IfConditionToken,
                                // } as IfElseConditionToken;
                            }
                            else {
                                const ifCondition = arena.allocate();
                                arena.setType(ifCondition, EnumToken.IfConditionTokenType);
                                const leftChild = arena.allocate();
                                arena.setType(leftChild, EnumToken.ListTokenType);
                                arena.setChildren(leftChild, ...trimArray(curr.slice(0, index), options));
                                const rightChild = arena.allocate();
                                arena.setType(rightChild, EnumToken.ListTokenType);
                                arena.setChildren(rightChild, ...trimArray(curr.slice(index + 1), options));
                                arena.setLeft(ifCondition, leftChild);
                                arena.setRight(ifCondition, rightChild);
                                acc.push(ifCondition);
                                // acc.push({
                                //     typ: EnumToken.IfConditionTokenType,
                                //     l: trimArray(curr.slice(0, index)),
                                //     r: trimArray(curr.slice(index + 1)),
                                // } as IfConditionToken);
                            }
                            return acc;
                        }, []);
                    }
                    else if (arena.getType(tokens[index]) === EnumToken.UrlFunctionTokenType) {
                        let l = -1;
                        const children = arena.children(tokens[index]);
                        while (++l < children.length) {
                            if (arena.getType(children[l]) === EnumToken.StringTokenType) {
                                break;
                            }
                        }
                        if (l < children.length && arena.getType(children[l]) === EnumToken.StringTokenType) {
                            const val = arena.getValue(children[l]).slice(1, -1);
                            if (/^[a-zA-Z0-0/_.-]+$/.test(val)) {
                                arena.setValue(children[l], arena.internString(val));
                                arena.setType(children[l], EnumToken.UrlTokenTokenType);
                                // Object.assign((tokens[index] as FunctionToken).chi[l], {
                                //     typ: EnumToken.UrlTokenTokenType,
                                //     val: ((tokens[index] as FunctionToken).chi[l] as StringToken).val.slice(1, -1),
                                // });
                            }
                        }
                    }
                    i = index;
                    if (arena.getType(tokens[index]) === EnumToken.MathFunctionTokenType &&
                        arena.equalsIgnoreCase(tokens[index], "val", "calc")) {
                        arena.setChildren(tokens[index], ...arena.children(tokens[index]));
                        // (tokens[index] as FunctionToken).chi = [buildExpression((tokens[index] as FunctionToken).chi)];
                    }
                    else if (arena.getType(tokens[index]) === EnumToken.ColorTokenType) {
                        if (isColor(tokens[index], arena)) {
                            parseColor(tokens[index], arena);
                        }
                        else {
                            success = false;
                            arena.setType(tokens[index], EnumToken.FunctionTokenType);
                            errors.push({
                                action: "drop",
                                message: `invalid color`,
                                node: tokens[index],
                                location: options.source.getSourceLocation(arena.getSpanStart(tokens[index])),
                            });
                        }
                    }
                    stack.pop();
                }
                break;
            case EnumToken.IdenTokenType:
                {
                    const val = arena.getValue(token).toLowerCase();
                    if (COLORS_NAMES[val] != null || val === "currentcolor") {
                        arena.setType(token, EnumToken.ColorTokenType);
                        arena.setColorType(token, ColorType.LIT);
                        // Object.assign(token, {
                        //     val,
                        //     typ: EnumToken.ColorTokenType,
                        //     kin: ColorType.LIT,
                        // });
                    }
                    else if (nonStandardColors.has(val)) {
                        arena.setType(token, EnumToken.ColorTokenType);
                        arena.setColorType(token, ColorType.NON_STD);
                        // Object.assign(token, {
                        //     typ: EnumToken.ColorTokenType,
                        //     kin: ColorType.NON_STD,
                        // });
                    }
                    else if (systemColors.has(val)) {
                        arena.setType(token, EnumToken.ColorTokenType);
                        arena.setColorType(token, ColorType.SYS);
                        // Object.assign(token, {
                        //     typ: EnumToken.ColorTokenType,
                        //     kin: ColorType.SYS,
                        // });
                    }
                    else if (deprecatedSystemColors.has(val)) {
                        arena.setType(token, EnumToken.ColorTokenType);
                        arena.setColorType(token, ColorType.DPSYS);
                        // Object.assign(token, {
                        //     typ: EnumToken.ColorTokenType,
                        //     kin: ColorType.DPSYS,
                        // });
                    }
                }
                break;
            case EnumToken.ImportantTokenType:
                hasImportantFlag = true;
                break;
        }
        typ = arena.getType(token);
        if (trimTokenSpace.has(typ)) {
            if (tokens.length > i + 1 && arena.getType(tokens[i + 1]) === EnumToken.WhitespaceTokenType) {
                for (let index = i + 1; index < tokens.length - 1; index++) {
                    tokens[index] = tokens[index + 1];
                }
                tokens.length--;
                i--;
                continue;
            }
            if (tokens.length >= i && arena.getType(tokens[i - 1]) == EnumToken.WhitespaceTokenType) {
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
            location: options.source.getSourceLocation(arena.getSpanStart(stack[stack.length - 1])),
        });
        if (tokens.length > 0) {
            arena.setSpanEnd(name, arena.getSpanEnd(tokens[tokens.length - 1]));
            // name[LOCEND] = tokens[tokens.length - 1][LOCEND];
        }
        arena.setName(name, arena.internString(arena.getValue(name)));
        arena.set(name, EnumToken.DeclarationNodeType, 0);
        arena.setFlags(name, EnumAstNodeStatus.Invalid | EnumAstNodeStatus.HasValues);
        arena.setErrors(name, result?.errors ?? []);
        arena.setChildren(name, ...tokens);
        return name;
        // name[STATE] = EnumAstNodeStatus.Invalid;
        // name[ERRORS] = result?.errors ?? [];
        // return Object.assign(name, {
        //     typ: EnumToken.DeclarationNodeType,
        //     nam: name.val,
        //     val: tokens,
        // }) as AstDeclaration;
    }
    for (const value of arena.walkValues(tokens)) {
        if (arena.getType(value) === EnumToken.IdenTokenType && isColor(value, arena)) {
            parseColor(value, arena);
        }
    }
    val = arena.getValue(name);
    if (val === "grid" ||
        val === "grid-template-areas" ||
        val === "grid-template-rows" ||
        val === "grid-template-columns") {
        let i = 0;
        for (; i < tokens.length; i++) {
            typ = arena.getType(tokens[i]);
            if (typ === EnumToken.StringTokenType) {
                val = arena.getValue(tokens[i]);
                if (/[\s.]/.test(val)) {
                    arena.setValue(tokens[i], arena.internString(parseGridTemplate(val)));
                    // (tokens[i] as StringToken).val = parseGridTemplate(val);
                }
                if (arena.getType(tokens[i + 1]) === EnumToken.WhitespaceTokenType &&
                    arena.getType(tokens[i + 2]) === EnumToken.StringTokenType) {
                    tokens.splice(i + 1, 1);
                }
            }
        }
    }
    if (validate && syntaxRules == null && arena.getType(name) === EnumToken.IdenTokenType) {
        if (tokens.length > 0 != null) {
            arena.setSpanEnd(name, arena.getSpanEnd(tokens[tokens.length - 1]));
            // name[LOCEND] = tokens[tokens.length - 1][LOCEND];
        }
        arena.setName(name, arena.internString(arena.getValue(name)));
        arena.set(name, EnumToken.DeclarationNodeType, 0);
        arena.setFlags(name, hasImportantFlag ? EnumAstNodeStatus.ImportantDeclaration | EnumAstNodeStatus.Unknown : EnumAstNodeStatus.Unknown);
        arena.setErrors(name, result?.errors ?? []);
        arena.setChildren(name, ...tokens);
        return name;
        // name[STATE] = EnumAstNodeStatus.Unknown;
        // name[ERRORS] = result?.errors ?? [];
        // // @ts-expect-error
        // return Object.assign(name, {
        //     typ: EnumToken.DeclarationNodeType,
        //     nam: name.val,
        //     val: tokens,
        // }) as AstDeclaration;
        // if (hasImportantFlag) {
        //     name[STATE] |= EnumAstNodeStatus.ImportantDeclaration;
        // }
        // // @ts-expect-error
        // return Object.assign(name, {
        //     typ: EnumToken.DeclarationNodeType,
        //     nam: name.val,
        //     val: tokens,
        // }) as AstDeclaration;
    }
    if (arena.equalsIgnoreCase(name, "val", "composes")) {
        let index = -1;
        for (let i = 0; i < tokens.length; i++) {
            if (arena.getType(tokens[i]) === EnumToken.IdenTokenType &&
                arena.equalsIgnoreCase(tokens[i], "val", "from")) {
                index = i;
                break;
            }
        }
        const left = trimArray(index == -1 ? tokens : tokens.slice(0, index), options);
        const right = index == -1 ? null : trimArray(tokens.slice(index + 1), options);
        const composeSelector = arena.allocate();
        arena.set(composeSelector, EnumToken.ComposesSelectorNodeType);
        arena.setSpan(composeSelector, arena.getSourceId(tokens[0]), arena.getSpanStart(tokens[0]), arena.getSpanEnd(right?.[right.length - 1] ?? left[left.length - 1]));
        const leftSide = arena.allocate();
        arena.set(leftSide, EnumToken.ListTokenType);
        arena.setChildren(leftSide, ...left);
        arena.setLeft(composeSelector, leftSide);
        if (right != null) {
            const rightSide = arena.allocate();
            arena.set(rightSide, EnumToken.ListTokenType);
            arena.setChildren(rightSide, ...right);
            arena.setRight(composeSelector, rightSide);
        }
        tokens.length = 0;
        tokens.push(composeSelector);
        // tokens = [
        //     {
        //         typ: EnumToken.ComposesSelectorNodeType,
        //         l: left,
        //         r: right?.[0] ?? null,
        //         [LOCSRCID]: tokens[0][LOCSRCID],
        //         [LOCSTA]: tokens[0][LOCSTA],
        //         [LOCEND]: index != -1 ? right![right!.length - 1]?.[LOCEND] : left[left.length - 1][LOCEND],
        //     } as ComposesSelectorToken,
        // ];
    }
    if (tokens.length > 0) {
        arena.setSpanEnd(name, arena.getSpanEnd(tokens[tokens.length - 1]));
        // name[LOCEND] = tokens[tokens.length - 1][LOCEND];
    }
    let flags = EnumAstNodeStatus.HasValues | (success
        ? result == null
            ? EnumAstNodeStatus.Unvalidated
            : EnumAstNodeStatus.Validated
        : EnumAstNodeStatus.ValidationFailed);
    if (hasImportantFlag) {
        flags |= EnumAstNodeStatus.ImportantDeclaration;
    }
    arena.setName(name, arena.internString(arena.getValue(name)));
    arena.set(name, EnumToken.DeclarationNodeType, 0);
    arena.setFlags(name, flags);
    arena.setErrors(name, result?.errors ?? []);
    arena.setChildren(name, ...tokens);
    return name;
    // name[STATE] = success
    //     ? result == null
    //         ? EnumAstNodeStatus.Unvalidated
    //         : EnumAstNodeStatus.Validated
    //     : EnumAstNodeStatus.ValidationFailed;
    // name[ERRORS] = result?.errors ?? [];
    // return Object.assign(name, {
    //     typ: EnumToken.DeclarationNodeType,
    //     nam: name.val,
    //     val: tokens,
    // }) as AstDeclaration;
    // if (hasImportantFlag) {
    //     name[STATE] |= EnumAstNodeStatus.ImportantDeclaration;
    // }
    // // @ts-expect-error
    // return Object.assign(name, {
    //     typ: EnumToken.DeclarationNodeType,
    //     nam: name.val,
    //     val: tokens,
    // }) as AstDeclaration;
}

export { parseDeclaration };
