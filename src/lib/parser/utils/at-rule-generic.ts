import type {
    AtRuleToken,
    ErrorDescription,
    IdentToken,
    ParserOptions,
    Token,
    ValidationOptions,
} from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { tokensfuncDefMap } from "../../syntax/constants.ts";
import { equalsIgnoreCase } from "./text.ts";

export function matchGenericSyntax(
    atRule: AtRuleToken,
    stream: Token[],
    options: ParserOptions | ValidationOptions,
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    const stack: Token[] = [];
    let i: number = 0;
    let success: boolean = true;
    let expectAndOr: boolean = false;
    let expectComma: boolean = false;
    const errors: ErrorDescription[] = [];
    const scopes: Array<Set<EnumToken>> = [new Set()];

    for (; i < stream.length; i++) {
        const token = stream[i];

        if (token.typ === EnumToken.WhitespaceTokenType || token.typ === EnumToken.CommentTokenType) {
            continue;
        }
        if (token.typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(token.typ)) {
            stack.push(token);
            scopes.push(new Set());

            expectAndOr = false;
            continue;
        }

        if (token.typ === EnumToken.EndParensTokenType) {
            if (
                stack.length === 0 ||
                (stack.at(-1)?.typ !== EnumToken.ParensTokenType && !tokensfuncDefMap.has(stack.at(-1)?.typ))
            ) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${token.loc!.sta.col}`,
                    node: token,
                    location: token.loc!,
                });
                success = false;
                break;
            }

            stack.pop();
            scopes.pop();

            if (scopes.length === 0) {
                return {
                    success: false,
                    errors: [
                        {
                            action: "drop",
                            node: token,
                            message: `Unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${token.loc!.sta.col}`,
                            location: token.loc!,
                        },
                    ],
                };
            }

            continue;
        }

        if (token.typ === EnumToken.IdenTokenType && equalsIgnoreCase("and", (token as IdentToken).val)) {
            if (!expectAndOr || scopes.at(-1)?.has(EnumToken.OrTokenType)) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${token.loc!.sta.col}`,
                    node: token,
                    location: token.loc!,
                });
                success = false;
                break;
            }

            Object.assign(token, { typ: EnumToken.AndTokenType });
            scopes.at(-1)!.add(EnumToken.AndTokenType);

            expectComma = false;
            continue;
        }

        if (token.typ === EnumToken.IdenTokenType && equalsIgnoreCase("or", (token as IdentToken).val)) {
            if (!expectAndOr || scopes.at(-1)?.has(EnumToken.AndTokenType)) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${token.loc!.sta.col}`,
                    node: token,
                    location: token.loc!,
                });
                success = false;
                break;
            }

            expectComma = false;
            Object.assign(token, { typ: EnumToken.OrTokenType });
            scopes.at(-1)!.add(EnumToken.OrTokenType);

            continue;
        }

        if (token.typ === EnumToken.CommaTokenType) {
            if (!expectComma) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[token.typ]} at ${token.loc!.src}:${token.loc!.sta.lin}:${token.loc!.sta.col}`,
                    node: token,
                    location: token.loc!,
                });
                success = false;
                break;
            }

            stack.push(token);
            expectComma = false;
            continue;
        }

        expectAndOr = true;
        expectComma = true;

        if (stack.length > 0 && stack.at(-1)?.typ === EnumToken.CommaTokenType) {
            stack.pop();
        }
    }

    if (stack.length > 0) {
        errors.push({
            action: "drop",
            message: `unexpected token ${EnumToken[stack.at(-1)?.typ]} at ${stack.at(-1)?.loc?.src}:${stack.at(-1)?.loc?.sta.lin}:${stack.at(-1)?.loc?.sta.col}`,
            node: stack.at(-1),
            location: stack.at(-1)?.loc!,
        });
        success = false;
    }

    return { success, errors };
}
