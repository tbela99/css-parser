/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.0.0-alpha.1
	License: MIT
 */
import { EnumToken } from '../../ast/types.js';
import { tokensfuncDefMap } from '../../syntax/constants.js';

function matchGenericSyntax(stream, options) {
    const arena = options.arena;
    const stack = [];
    let i = 0;
    let success = true;
    let expectAndOr = false;
    let expectComma = false;
    let typ;
    const errors = [];
    const scopes = [new Set()];
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
            if (stack.length === 0 ||
                (arena.getType(stack.at(-1)) !== EnumToken.StartParensTokenType && !tokensfuncDefMap.has(arena.getType(stack.at(-1))))) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[typ]}`,
                    node: token,
                    location: options.source.getSourceLocation(token),
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
                    location: options.source.getSourceLocation(token),
                });
                success = false;
                break;
            }
            typ = EnumToken.AndTokenType;
            arena.setType(token, typ);
            scopes.at(-1).add(EnumToken.AndTokenType);
            expectComma = false;
            continue;
        }
        if (typ === EnumToken.IdenTokenType && arena.equalsIgnoreCase(token, 'val', "or")) {
            if (!expectAndOr || scopes.at(-1)?.has(EnumToken.AndTokenType)) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[typ]}`,
                    node: token,
                    location: options.source.getSourceLocation(token),
                });
                success = false;
                break;
            }
            expectComma = false;
            Object.assign(token, { typ: EnumToken.OrTokenType });
            scopes.at(-1).add(EnumToken.OrTokenType);
            continue;
        }
        if (typ === EnumToken.CommaTokenType) {
            if (!expectComma) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[typ]}`,
                    node: token,
                    location: options.source.getSourceLocation(token),
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
        if (stack.length > 0 && arena.getType(stack.at(-1)) === EnumToken.CommaTokenType) {
            stack.pop();
        }
    }
    if (stack.length > 0) {
        errors.push({
            action: "drop",
            message: `unexpected token ${EnumToken[arena.getType(stack.at(-1))]}`,
            node: stack.at(-1),
            location: options.source.getSourceLocation(stack.at(-1)),
        });
        success = false;
    }
    return { success, errors };
}

export { matchGenericSyntax };
