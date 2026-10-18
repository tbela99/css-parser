import type { ErrorDescription, IdentToken, ParserOptions, Token } from "../../../@types/index.d.ts";
import { EnumToken } from "../../ast/types.ts";
import { LOCSTA, tokensfuncDefMap } from "../../syntax/constants.ts";
import { Arena } from "../arena.ts";
import { equalsIgnoreCase } from "./text.ts";

export function matchGenericSyntax(
    stream: number[],
    options: ParserOptions,
): {
    success: boolean;
    errors: ErrorDescription[];
} {
    const arena = options.arena as Arena;
    const stack: number[] = [];
    let i: number = 0;
    let success: boolean = true;
    let expectAndOr: boolean = false;
    let expectComma: boolean = false;
    let typ: EnumToken;
    const errors: ErrorDescription[] = [];
    const scopes: Array<Set<EnumToken>> = [new Set()];

    for (; i < stream.length; i++) {
        const token = stream[i];

        typ = arena.getType(token);

        if (typ === EnumToken.WhitespaceTokenType || typ === EnumToken.CommentTokenType) {
            continue;
        }
        if (typ === EnumToken.StartParensTokenType || tokensfuncDefMap.has(typ)) {
            stack.push(token);
            scopes.push(new Set());

            expectAndOr = false;
            continue;
        }

        if (typ === EnumToken.EndParensTokenType) {
            if (
                stack.length === 0 ||
                (arena.getType(stack.at(-1)!) !== EnumToken.StartParensTokenType && !tokensfuncDefMap.has(arena.getType(stack.at(-1)!)))
            ) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[typ]}`,
                    node: token,
                    location: options.source!.getSourceLocation(token),
                });
                success = false;
                break;
            }

            stack.pop();
            scopes.pop();

            continue;
        }

        if (typ === EnumToken.IdenTokenType && arena.equalsIgnoreCase(token, 'val', "and")) {
            if (!expectAndOr || scopes.at(-1)?.has(EnumToken.OrTokenType)) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[typ]}`,
                    node: token,
                    location: options.source!.getSourceLocation(token),
                });
                success = false;
                break;
            }

            typ = EnumToken.AndTokenType;
            arena.setType(token, typ);
            scopes.at(-1)!.add(EnumToken.AndTokenType);

            expectComma = false;
            continue;
        }

        if (typ === EnumToken.IdenTokenType && arena.equalsIgnoreCase(token, 'val', "or")) {
            if (!expectAndOr || scopes.at(-1)?.has(EnumToken.AndTokenType)) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[typ]}`,
                    node: token,
                    location: options.source!.getSourceLocation(token),
                });
                success = false;
                break;
            }

            expectComma = false;
            Object.assign(token, { typ: EnumToken.OrTokenType });
            scopes.at(-1)!.add(EnumToken.OrTokenType);

            continue;
        }

        if (typ === EnumToken.CommaTokenType) {
            if (!expectComma) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[typ]}`,
                    node: token,
                    location: options.source!.getSourceLocation(token),
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

        if (stack.length > 0 && arena.getType(stack.at(-1)!) === EnumToken.CommaTokenType) {
            stack.pop();
        }
    }

    if (stack.length > 0) {
        errors.push({
            action: "drop",
            message: `unexpected token ${EnumToken[arena.getType(stack.at(-1)!)]}`,
            node: stack.at(-1),
            location: options.source!.getSourceLocation(stack.at(-1)!),
        });
        success = false;
    }

    return { success, errors };
}
