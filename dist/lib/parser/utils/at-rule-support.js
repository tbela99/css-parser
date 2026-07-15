import { EnumToken, ValidationLevel } from '../../ast/types.js';
import { renderValue } from '../../renderer/render.js';
import { tokensfuncDefMap, LOC, trimTokenSpace, tokensfuncSet } from '../../syntax/constants.js';
import { getSyntaxConfig, getParsedSyntax } from '../../validation/config.js';
import { matchAllSyntaxes, createValidationContext, trimArray } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { parseDeclaration } from './declaration.js';
import { equalsIgnoreCase } from './text.js';
import { pseudoElements } from '../../syntax/syntax.js';

function parseAtRuleSupportSyntax(stream, context, options = {}) {
    const tokens = [];
    const stack = [];
    let i = 0;
    let success = true;
    let expectAndOr = false;
    let scope = new Set();
    let val;
    const errors = [];
    const scopes = [scope];
    const trimWhiteSpace = new Set([
        EnumToken.GtTokenType,
        EnumToken.ChildCombinatorTokenType,
        EnumToken.NextSiblingCombinatorTokenType,
        EnumToken.SubsequentSiblingCombinatorTokenType,
        EnumToken.ColumnCombinatorTokenType,
        EnumToken.UniversalSelectorTokenType,
    ]);
    while (i < stream.length &&
        (stream[i]?.typ === EnumToken.WhitespaceTokenType || stream[i]?.typ === EnumToken.CommentTokenType)) {
        tokens.push(stream[i]);
        i++;
    }
    if (!tokensfuncDefMap.has(stream[i]?.typ) &&
        stream[i]?.typ !== EnumToken.StartParensTokenType &&
        !(stream[i]?.typ === EnumToken.IdenTokenType && "not" === stream[i]?.val.toLowerCase())) {
        return {
            success: false,
            errors: [
                {
                    action: "drop",
                    node: stream[i],
                    message: `expecting '<supports-condition>' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                },
            ],
        };
    }
    for (; i < stream.length; i++) {
        tokens.push(stream[i]);
        if (stream[i].typ == EnumToken.ColonTokenType) {
            if (stream[i + 1]?.typ == EnumToken.IdenTokenType) {
                const val = stream[i + 1].val;
                Object.assign(stream[i], {
                    typ: pseudoElements.includes(val)
                        ? EnumToken.PseudoElementTokenType
                        : EnumToken.PseudoClassTokenType,
                    val: ":" + val,
                });
                stream[i][LOC].end = stream[i + 1][LOC].end;
                stream.splice(i + 1, 1);
                continue;
            }
            if (stream[i + 1]?.typ == EnumToken.FunctionTokenDefType) {
                val = ":" + stream[i + 1].val;
                Object.assign(stream[i], {
                    typ: val + "()" in getSyntaxConfig().selectors
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : stream[i + 1].typ,
                    val,
                });
                stack.push(stream[i]);
                stream[i][LOC].end = stream[i + 1][LOC].end;
                stream.splice(i + 1, 1);
                continue;
            }
        }
        if (stream[i].typ == EnumToken.DoubleColonTokenType) {
            val = ":" + stream[i + 1].val;
            if (stream[i + 1]?.typ == EnumToken.IdenTokenType) {
                Object.assign(stream[i], {
                    typ: EnumToken.PseudoClassTokenType,
                    val: (pseudoElements.includes(val) ? "" : ":") + val,
                });
                stream[i][LOC].end = stream[i + 1][LOC].end;
                stream.splice(i + 1, 1);
                continue;
            }
            if (stream[i + 1]?.typ == EnumToken.FunctionTokenDefType) {
                val = "::" + stream[i + 1].val;
                Object.assign(stream[i], {
                    typ: val + "()" in getSyntaxConfig().selectors
                        ? EnumToken.PseudoClassFunctionTokenDefType
                        : EnumToken.FunctionTokenDefType,
                    val,
                });
                stack.push(stream[i]);
                stream[i][LOC].end = stream[i + 1][LOC].end;
                stream.splice(i + 1, 1);
                continue;
            }
        }
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
            let k = i;
            while (k < stream.length &&
                (stream[k]?.typ === EnumToken.WhitespaceTokenType || stream[k]?.typ === EnumToken.CommentTokenType)) {
                tokens.push(stream[k]);
                k++;
            }
            if (k < stream.length) {
                if (stream[k].typ !== EnumToken.EndParensTokenType &&
                    !(stream[k].typ === EnumToken.IdenTokenType &&
                        ("and" === stream[k]?.val.toLowerCase() ||
                            "or" === stream[k]?.val.toLowerCase()))) {
                    return {
                        success: false,
                        errors: [
                            {
                                action: "drop",
                                node: stream[k],
                                message: `expecting 'and' or 'or' at ${stream[k]?.[LOC]?.src}:${stream[k]?.[LOC]?.sta.lin}:${stream[k]?.[LOC]?.sta.col}`,
                            },
                        ],
                    };
                }
            }
            expectAndOr = false;
        }
        if (stream[i].typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[i].typ)) {
            scopes.push((scope = new Set()));
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
                                    message: `unmatched ')' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                                },
                            ],
                        };
                    }
                    if (stack[stack.length - 1].typ === EnumToken.ColonTokenType) {
                        if (tokensfuncDefMap.has(stack[stack.length - 2]?.typ)) {
                            const index = tokens.indexOf(stack[stack.length - 1]);
                            // expecting ident or dashed ident
                            if (tokens[index + 1]?.typ == EnumToken.IdenTokenType ||
                                tokens[index + 1]?.typ == EnumToken.DashedIdenTokenType) {
                                const val = tokens[index + 1].val;
                                Object.assign(tokens[index], {
                                    typ: pseudoElements.includes(val)
                                        ? EnumToken.PseudoElementTokenType
                                        : EnumToken.PseudoClassTokenType,
                                    val: ":" + val,
                                });
                                tokens[index][LOC].end = tokens[index + 1][LOC].end;
                                tokens.splice(index + 1, 1);
                                stack.pop();
                                const index2 = tokens.indexOf(stack[stack.length - 1]);
                                const result = matchAllSyntaxes(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, tokens[index2].val + "()")[0]?.chi, createValidationContext(tokens.slice(index2 + 1, -1)), options);
                                if (!result.success) {
                                    return {
                                        success: false,
                                        errors: result.errors,
                                    };
                                }
                                tokens.pop();
                                Object.assign(tokens[index2], {
                                    typ: tokensfuncDefMap.get(tokens[index2].typ),
                                    chi: tokens.splice(index2 + 1, tokens.length - index2 - 1),
                                });
                                tokens[index2][LOC].end = stream[i][LOC].end;
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
                                        message: `unmatched ')' at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
                                    },
                                ],
                            };
                        }
                        // match declaration
                        const index = tokens.indexOf(stack[stack.length - 2]);
                        const slice = trimArray(tokens.splice(index + 1, tokens.length - index - 2));
                        const declaration = parseDeclaration(slice, context, { ...options, validation: ValidationLevel.None }, errors);
                        if (declaration.typ !== EnumToken.DeclarationNodeType) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: declaration,
                                        message: `invalid declaration at ${declaration?.[LOC]?.src}:${declaration?.[LOC]?.sta.lin}:${declaration?.[LOC]?.sta.col}`,
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
                        const index = tokens.indexOf(stack.at(-1));
                        const slice = trimArray(tokens.splice(index + 1, tokens.length - index - 2));
                        const filtered = slice.filter((token) => {
                            return (token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType);
                        });
                        if (filtered.length !== 1 ||
                            !(trimTokenSpace.has(filtered[0].typ) ||
                                tokensfuncDefMap.has(filtered[0].typ) ||
                                tokensfuncSet.has(filtered[0].typ))) {
                            const token = filtered[0] ?? slice[0] ?? stream[i];
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: token,
                                        message: `expecting '<${filtered[0]?.typ === EnumToken.IdenTokenType ? "supports-condition-name" : "supports-condition"}>' at ${token?.[LOC]?.src}:${token?.[LOC]?.sta.lin}:${token?.[LOC]?.sta.col}`,
                                    },
                                ],
                            };
                        }
                        tokens[index] = {
                            typ: EnumToken.ParensTokenType,
                            chi: slice,
                            [LOC]: { ...stack.at(-1)[LOC], end: { ...stream[i]?.[LOC]?.end } },
                        };
                        stack.pop();
                        tokens.pop();
                        scopes.pop();
                        scope = scopes[scopes.length - 1];
                        expectAndOr = true;
                    }
                    else if (tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                        const index = tokens.indexOf(stack.at(-1));
                        tokens[index] = {
                            typ: tokensfuncDefMap.get(stack.at(-1)?.typ),
                            val: stack.at(-1).val,
                            chi: trimArray(tokens.splice(index + 1, tokens.length - index - 2)),
                            [LOC]: { ...stack.at(-1)[LOC], end: { ...stream[i]?.[LOC]?.end } },
                        };
                        if (tokens[index].typ === EnumToken.PseudoClassFuncTokenType) {
                            // not a declaration
                            const result = matchAllSyntaxes(getParsedSyntax(ValidationSyntaxGroupEnum.Selectors, tokens[index].val + "()")?.[0]?.chi, createValidationContext(tokens[index].chi), options);
                            if (!result.success) {
                                return {
                                    success: false,
                                    errors: result.errors,
                                };
                            }
                            stack.pop();
                            tokens.pop();
                            break;
                        }
                        //
                        let k = stack.length - 1;
                        while (tokensfuncDefMap.has(stack[k]?.typ)) {
                            k--;
                        }
                        if (stack[k]?.typ !== EnumToken.ColonTokenType) {
                            if (tokens[index].typ !== EnumToken.SupportsFunctionTokenType &&
                                !equalsIgnoreCase("env", tokens[index].val)) {
                                errors.push({
                                    action: "ignore",
                                    node: tokens[index],
                                    message: `expecting <supports-selector-fn>, <supports-env-fn>, <font-tech()>, <font-format()>, <at-rule()> or <named-feature()> at ${tokens[index]?.[LOC]?.src}:${tokens[index]?.[LOC]?.sta.lin}:${tokens[index]?.[LOC]?.sta.col}`,
                                });
                            }
                            else {
                                // not a declaration
                                const result = matchAllSyntaxes(getParsedSyntax(ValidationSyntaxGroupEnum.Syntaxes, tokens[index].val + "()")?.[0]?.chi, createValidationContext(tokens[index].chi), options);
                                if (!result.valid) {
                                    errors.push(...result.errors, {
                                        action: "ignore",
                                        node: tokens[index],
                                        message: `missing syntax for function '${tokens[index].val}()' at ${tokens[index]?.[LOC]?.src}:${tokens[index]?.[LOC]?.sta.lin}:${tokens[index]?.[LOC]?.sta.col}`,
                                    });
                                }
                                else if (!result.success) {
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
                        const index = tokens.indexOf(stack.at(-1));
                        tokens[index] = {
                            typ: EnumToken.SupportsQueryUnaryConditionTokenType,
                            l: stack.at(-1),
                            r: trimArray(tokens.splice(index + 1, i - index - 1)),
                            [LOC]: { ...stack.at(-1)[LOC], end: { ...stream[i]?.[LOC]?.end } },
                        };
                        stack.pop();
                    }
                    if (stack.at(-1)?.typ === EnumToken.AndTokenType || stack.at(-1)?.typ === EnumToken.OrTokenType) {
                        if (stack.length > 1 && stack.at(-2)?.typ !== EnumToken.StartParensTokenType) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: stack.at(-2),
                                        message: `expecting '(' at ${stack.at(-2)?.[LOC]?.src}:${stack.at(-2)?.[LOC]?.sta.lin}:${stack.at(-2)?.[LOC]?.sta.col}`,
                                    },
                                ],
                            };
                        }
                        const index = tokens.indexOf(stack.at(-1));
                        const index2 = stack.length > 1 ? tokens.indexOf(stack.at(-2)) + 1 : 0;
                        const left = trimArray(tokens.slice(index2, index));
                        const notToken = left.find((t) => t.typ === EnumToken.SupportsQueryUnaryConditionTokenType &&
                            t.l.typ === EnumToken.NotTokenType);
                        if (notToken != null) {
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        node: stack.at(-1),
                                        message: `unexpected token after 'not' expression at ${stack.at(-1)?.[LOC]?.src}:${stack.at(-1)?.[LOC]?.sta.lin}:${stack.at(-1)?.[LOC]?.sta.col}`,
                                    },
                                ],
                            };
                        }
                        tokens[index2] = {
                            typ: EnumToken.SupportsQueryConditionTokenType,
                            op: stack.at(-1),
                            l: left,
                            r: trimArray(tokens.slice(index + 1)),
                            [LOC]: { ...stack.at(-1)[LOC], end: { ...stream[i]?.[LOC]?.end } },
                        };
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
                    const val = stream[i].val.toLowerCase();
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
                                        message: `mixing <and> and <or> at the same level is not allowed at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
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
                                        message: `<or> is not allowed outside of a parenthesis at ${stream[i]?.[LOC]?.src}:${stream[i]?.[LOC]?.sta.lin}:${stream[i]?.[LOC]?.sta.col}`,
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
                    message: `unmatched token '${renderValue(stack.at(-1))}' at ${stack.at(-1)[LOC].src}:${stack.at(-1)[LOC].sta.lin}:${stack.at(-1)[LOC].sta.col}`,
                },
            ],
        };
    }
    stream.length = 0;
    stream.push(...trimArray(tokens));
    return { success, errors };
}

export { parseAtRuleSupportSyntax };
