import type { ErrorDescription, Token, ParserOptions } from "../../../@types/index.d.ts";
import type { AstArena } from "../../ast/arena.ts";
import { EnumToken } from "../../ast/types.ts";
import { tokensfuncDefMap } from "../../syntax/constants.ts";
import { equalsIgnoreCase } from "./text.ts";

export function matchGenericSyntax(
    arena: AstArena, stream: Token[],
    options: ParserOptions,
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

        if (arena.dataTypes[token] === EnumToken.WhitespaceTokenType || arena.dataTypes[token] === EnumToken.CommentTokenType) {
            continue;
        }
        if (arena.dataTypes[token] === EnumToken.StartParensTokenType || tokensfuncDefMap.has(arena.dataTypes[token])) {
            stack.push(token);
            scopes.push(new Set());

            expectAndOr = false;
            continue;
        }

        if (arena.dataTypes[token] === EnumToken.EndParensTokenType) {
            if (
                stack.length === 0 ||
                (arena.dataTypes[stack[stack.length - 1]] !== EnumToken.StartParensTokenType &&
                    !tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]]))
            ) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                    node: token,
                    location: options.source!.getSourceLocation(arena.getSpanStart(token)),
                });
                success = false;
                break;
            }

            stack.pop();
            scopes.pop();

            continue;
        }

        if (arena.dataTypes[token] === EnumToken.IdenTokenType && equalsIgnoreCase("and", arena.strings[arena.stringValue[token]])) {
            if (!expectAndOr || scopes.at(-1)?.has(EnumToken.OrTokenType)) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                    node: token,
                    location: options.source!.getSourceLocation(arena.getSpanStart(token)),
                });
                success = false;
                break;
            }

            arena.dataTypes[token] = EnumToken.AndTokenType;
            scopes.at(-1)!.add(EnumToken.AndTokenType);

            expectComma = false;
            continue;
        }

        if (arena.dataTypes[token] === EnumToken.IdenTokenType && equalsIgnoreCase("or", arena.strings[arena.stringValue[token]])) {
            if (!expectAndOr || scopes.at(-1)?.has(EnumToken.AndTokenType)) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                    node: token,
                    location: options.source!.getSourceLocation(arena.getSpanStart(token)),
                });
                success = false;
                break;
            }

            expectComma = false;
            arena.dataTypes[token] = EnumToken.OrTokenType;
            scopes.at(-1)!.add(EnumToken.OrTokenType);

            continue;
        }

        if (arena.dataTypes[token] === EnumToken.CommaTokenType) {
            if (!expectComma) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                    node: token,
                    location: options.source!.getSourceLocation(arena.getSpanStart(token)),
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

        if (stack.length > 0 && arena.typeOf(stack.at(-1)) === EnumToken.CommaTokenType) {
            stack.pop();
        }
    }

    if (stack.length > 0) {
        errors.push({
            action: "drop",
            message: `unexpected token ${EnumToken[arena.dataTypes[stack[stack.length - 1]]]}`,
            node: stack[stack.length - 1],
            location: options.source!.getSourceLocation(arena.getSpanStart(stack[stack.length - 1])),
        });
        success = false;
    }

    return { success, errors };
}
