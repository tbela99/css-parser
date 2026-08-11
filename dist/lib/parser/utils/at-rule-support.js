import { EnumToken } from '../../ast/types.js';
import { pseudoElements, LOC, tokensfuncDefMap } from '../../syntax/constants.js';
import { getSyntaxConfig, getParsedSyntax } from '../../validation/config.js';
import { trimArray, matchAllSyntaxes, createValidationContext } from '../../validation/match.js';
import { ValidationSyntaxGroupEnum } from '../../validation/parser/typedef.js';
import { parseDeclaration } from './declaration.js';

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
                    if (stack[stack.length - 1].typ === EnumToken.ColonTokenType) {
                        // match declaration
                        const index = tokens.indexOf(stack[stack.length - 2]);
                        const slice = trimArray(tokens.splice(index + 1, tokens.length - index - 2));
                        const declaration = parseDeclaration(slice, context, { ...options, validation: false }, errors);
                        tokens.splice(index + 1, 0, declaration);
                        stack.pop();
                    }
                    // match <support-condition-name>
                    // @supports (--condition-name) {}
                    if (stack.at(-1)?.typ === EnumToken.StartParensTokenType) {
                        const index = tokens.indexOf(stack.at(-1));
                        const slice = trimArray(tokens.splice(index + 1, tokens.length - index - 2));
                        slice.filter((token) => {
                            return (token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType);
                        });
                        tokens[index] = {
                            typ: EnumToken.ParensTokenType,
                            chi: slice,
                            [LOC]: { ...stack.at(-1)[LOC], end: stream[i]?.[LOC]?.end },
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
                            [LOC]: { ...stack.at(-1)[LOC], end: stream[i]?.[LOC]?.end },
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
                            [LOC]: { ...stack.at(-1)[LOC], end: stream[i]?.[LOC]?.end },
                        };
                        stack.pop();
                    }
                    if (stack.at(-1)?.typ === EnumToken.AndTokenType || stack.at(-1)?.typ === EnumToken.OrTokenType) {
                        const index = tokens.indexOf(stack.at(-1));
                        const index2 = stack.length > 1 ? tokens.indexOf(stack.at(-2)) + 1 : 0;
                        const left = trimArray(tokens.slice(index2, index));
                        left.find((t) => t.typ === EnumToken.SupportsQueryUnaryConditionTokenType &&
                            t.l.typ === EnumToken.NotTokenType);
                        tokens[index2] = {
                            typ: EnumToken.SupportsQueryConditionTokenType,
                            op: stack.at(-1),
                            l: left,
                            r: trimArray(tokens.slice(index + 1)),
                            [LOC]: { ...stack.at(-1)[LOC], end: stream[i]?.[LOC]?.end },
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
                        if ("or" === val && scopes.length === 1) {
                            const fileName = options.source.getFileName() ?? "";
                            const [line, column] = options.source.getOffsets(stream[i]?.[LOC]?.sta);
                            return {
                                success: false,
                                errors: [
                                    {
                                        action: "drop",
                                        message: `<or> is not allowed outside of a parenthesis at ${fileName}:${line}:${column}`,
                                        location: [fileName, line, column],
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
    stream.length = 0;
    stream.push(...trimArray(tokens));
    return { success, errors };
}

export { parseAtRuleSupportSyntax };
