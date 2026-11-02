/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { EnumToken } from '../../ast/types.js';
import { tokensfuncDefMap } from '../../syntax/constants.js';
import { equalsIgnoreCase } from './text.js';

function matchGenericSyntax(arena, stream, options) {
    const stack = [];
    let i = 0;
    let success = true;
    let expectAndOr = false;
    let expectComma = false;
    const errors = [];
    const scopes = [new Set()];
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
            if (stack.length === 0 ||
                (arena.dataTypes[stack[stack.length - 1]] !== EnumToken.StartParensTokenType &&
                    !tokensfuncDefMap.has(arena.dataTypes[stack[stack.length - 1]]))) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                    node: token,
                    location: options.source.getSourceLocation(arena.getSpanStart(token)),
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
                    location: options.source.getSourceLocation(arena.getSpanStart(token)),
                });
                success = false;
                break;
            }
            arena.dataTypes[token] = EnumToken.AndTokenType;
            scopes.at(-1).add(EnumToken.AndTokenType);
            expectComma = false;
            continue;
        }
        if (arena.dataTypes[token] === EnumToken.IdenTokenType && equalsIgnoreCase("or", arena.strings[arena.stringValue[token]])) {
            if (!expectAndOr || scopes.at(-1)?.has(EnumToken.AndTokenType)) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                    node: token,
                    location: options.source.getSourceLocation(arena.getSpanStart(token)),
                });
                success = false;
                break;
            }
            expectComma = false;
            arena.dataTypes[token] = EnumToken.OrTokenType;
            scopes.at(-1).add(EnumToken.OrTokenType);
            continue;
        }
        if (arena.dataTypes[token] === EnumToken.CommaTokenType) {
            if (!expectComma) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[arena.dataTypes[token]]}`,
                    node: token,
                    location: options.source.getSourceLocation(arena.getSpanStart(token)),
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
            location: options.source.getSourceLocation(arena.getSpanStart(stack[stack.length - 1])),
        });
        success = false;
    }
    return { success, errors };
}

export { matchGenericSyntax };
