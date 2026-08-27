import type {
    Token,
    AstAtRule,
    ParserOptions,
    ErrorDescription,
    IdentToken,
    FunctionToken,
    SupportsQueryUnaryConditionToken,
    SupportsQueryConditionToken,
    AtRuleToken,
    ParensToken,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { LOCEND, LOCSRCID, LOCSTA, pseudoElements } from "../../syntax/constants.ts";
import { getParsedSyntax, getSyntaxConfig } from "../../validation/config.ts";
import { trimArray, matchAllSyntaxes, createValidationContext } from "../../validation/match.ts";
import { ValidationSyntaxGroupEnum } from "../../validation/parser/typedef.ts";
import type { ValidationFunctionToken, ValidationToken } from "../../validation/parser/types.d.ts";
import { tokensfuncDefMap } from "../../syntax/constants.ts";
import { parseDeclaration } from "./declaration.ts";

export function parseAtRuleSupportSyntax(
    stream: Token[],
    context: AstAtRule | AtRuleToken,
    options: ParserOptions = {},
): { success: boolean; errors: ErrorDescription[] } {
    const tokens: Token[] = [];
    const stack: Token[] = [];

    let i: number = 0;
    let success: boolean = true;
    let expectAndOr: boolean = false;
    let scope: Set<EnumToken> = new Set();
    let val: string;
    const errors: ErrorDescription[] = [];
    const scopes: Array<Set<EnumToken>> = [scope];
    const trimWhiteSpace: Set<EnumToken> = new Set([
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
                const val: string = (stream[i + 1] as IdentToken).val;
                Object.assign(stream[i], {
                    typ: pseudoElements.includes(val)
                        ? EnumToken.PseudoElementTokenType
                        : EnumToken.PseudoClassTokenType,
                    val: ":" + val,
                });

                stream[i][LOCEND] = stream[i + 1]![LOCEND];
                stream.splice(i + 1, 1);
                continue;
            }

            if (stream[i + 1]?.typ == EnumToken.FunctionTokenDefType) {
                val = ":" + (stream[i + 1] as IdentToken).val;

                Object.assign(stream[i], {
                    typ:
                        val + "()" in getSyntaxConfig().selectors
                            ? EnumToken.PseudoClassFunctionTokenDefType
                            : stream[i + 1].typ,
                    val,
                });

                stack.push(stream[i]);
                stream[i][LOCEND] = stream[i + 1]![LOCEND];
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
            let k: number = i;
            while (
                k < stream.length &&
                (stream[k]?.typ === EnumToken.WhitespaceTokenType || stream[k]?.typ === EnumToken.CommentTokenType)
            ) {
                tokens.push(stream[k]);
                k++;
            }

            expectAndOr = false;
        }

        if (stream[i].typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(stream[i].typ)) {
            scopes.push((scope = new Set<EnumToken>()));
            stack.push(stream[i]);
            continue;
        }

        switch (stream[i].typ) {
            case EnumToken.EndParensTokenType:
                {
                    if (stack[stack.length - 1].typ === EnumToken.ColonTokenType) {
                        // match declaration
                        const index: number = tokens.indexOf(stack[stack.length - 2]);
                        const slice: Token[] = trimArray(tokens.splice(index + 1, tokens.length - index - 2));
                        const declaration = parseDeclaration(slice, context, { ...options, validation: false }, errors);

                        tokens.splice(index + 1, 0, declaration);
                        stack.pop();
                    }

                    // match <support-condition-name>
                    // @supports (--condition-name) {}
                    if (stack.at(-1)?.typ === EnumToken.StartParensTokenType) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        const slice: Token[] = trimArray(tokens.splice(index + 1, tokens.length - index - 2));

                        const filtered: Token[] = slice.filter((token) => {
                            return (
                                token.typ !== EnumToken.WhitespaceTokenType && token.typ !== EnumToken.CommentTokenType
                            );
                        });

                        tokens[index] = {
                            typ: EnumToken.ParensTokenType,
                            chi: slice,
                            [LOCSRCID]: stack.at(-1)![LOCSRCID],
                            [LOCSTA]: stack.at(-1)![LOCSTA],
                            [LOCEND]: stream[i]?.[LOCEND],
                        } as ParensToken;

                        stack.pop();
                        tokens.pop();

                        scopes.pop();
                        scope = scopes[scopes.length - 1];

                        expectAndOr = true;
                    } else if (tokensfuncDefMap.has(stack.at(-1)?.typ)) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        tokens[index] = {
                            typ: tokensfuncDefMap.get(stack.at(-1)?.typ)!,
                            val: (stack.at(-1) as FunctionToken)!.val,
                            chi: trimArray(tokens.splice(index + 1, tokens.length - index - 2)),
                            [LOCSRCID]: stack.at(-1)![LOCSRCID],
                            [LOCSTA]: stack.at(-1)![LOCSTA],
                            [LOCEND]: stream[i]?.[LOCEND],
                        } as FunctionToken;

                        if (tokens[index].typ === EnumToken.PseudoClassFuncTokenType) {
                            // not a declaration
                            const result = matchAllSyntaxes(
                                (
                                    getParsedSyntax(
                                        ValidationSyntaxGroupEnum.Selectors,
                                        (tokens[index] as FunctionToken).val + "()",
                                    ) as ValidationFunctionToken[]
                                )?.[0]?.chi as ValidationToken[],
                                createValidationContext((tokens[index] as FunctionToken).chi as Token[]),
                                options,
                            );

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
                        let k: number = stack.length - 1;

                        while (tokensfuncDefMap.has(stack[k]?.typ)) {
                            k--;
                        }

                        stack.pop();
                        tokens.pop();

                        scopes.pop();
                        scope = scopes[scopes.length - 1];
                    }

                    if (stack.at(-1)?.typ === EnumToken.NotTokenType) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        tokens[index] = {
                            typ: EnumToken.SupportsQueryUnaryConditionTokenType,
                            l: stack.at(-1),
                            r: trimArray(tokens.splice(index + 1, i - index - 1)),
                            [LOCSRCID]: stack.at(-1)![LOCSRCID],
                            [LOCSTA]: stack.at(-1)![LOCSTA],
                            [LOCEND]: stream[i]?.[LOCEND],
                        } as SupportsQueryUnaryConditionToken;

                        stack.pop();
                    }

                    if (stack.at(-1)?.typ === EnumToken.AndTokenType || stack.at(-1)?.typ === EnumToken.OrTokenType) {
                        const index: number = tokens.indexOf(stack.at(-1)!);
                        const index2: number = stack.length > 1 ? tokens.indexOf(stack.at(-2)!) + 1 : 0;

                        const left: Token[] = trimArray(tokens.slice(index2, index));
                        const notToken = left.find(
                            (t) =>
                                t.typ === EnumToken.SupportsQueryUnaryConditionTokenType &&
                                (t as SupportsQueryUnaryConditionToken).l.typ === EnumToken.NotTokenType,
                        );

                        tokens[index2] = {
                            typ: EnumToken.SupportsQueryConditionTokenType,
                            op: stack.at(-1)!,
                            l: left,
                            r: trimArray(tokens.slice(index + 1)),
                            [LOCSRCID]: stack.at(-1)![LOCSRCID],
                            [LOCSTA]: stack.at(-1)![LOCSTA],
                            [LOCEND]: stream[i]?.[LOCEND],
                        } as SupportsQueryConditionToken;
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
                    const val = (stream[i] as IdentToken).val.toLowerCase();
                    if ("not" === val) {
                        stack.push(stream[i]);
                        Object.assign(stream[i], { typ: EnumToken.NotTokenType });
                        break;
                    }

                    if ("and" === val || "or" === val) {
                        if ("or" === val && scopes.length === 1) {
                            const fileName = options.source!.getFileName() ?? "";
                            const [line, column] = options.source!.getOffsets(stream[i]?.[LOCSTA]!);
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
