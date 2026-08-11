import { EnumToken } from '../../ast/types.js';
import { tokensfuncDefMap, LOC } from '../../syntax/constants.js';
import { equalsIgnoreCase } from './text.js';

function matchGenericSyntax(stream, options) {
    const stack = [];
    let i = 0;
    let success = true;
    let expectAndOr = false;
    let expectComma = false;
    const errors = [];
    const scopes = [new Set()];
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
            if (stack.length === 0 ||
                (stack.at(-1)?.typ !== EnumToken.StartParensTokenType && !tokensfuncDefMap.has(stack.at(-1)?.typ))) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[token.typ]}`,
                    node: token,
                    location: options.source.getSourceLocation(token[LOC].sta),
                });
                success = false;
                break;
            }
            stack.pop();
            scopes.pop();
            continue;
        }
        if (token.typ === EnumToken.IdenTokenType && equalsIgnoreCase("and", token.val)) {
            if (!expectAndOr || scopes.at(-1)?.has(EnumToken.OrTokenType)) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[token.typ]}`,
                    node: token,
                    location: options.source.getSourceLocation(token[LOC].sta),
                });
                success = false;
                break;
            }
            Object.assign(token, { typ: EnumToken.AndTokenType });
            scopes.at(-1).add(EnumToken.AndTokenType);
            expectComma = false;
            continue;
        }
        if (token.typ === EnumToken.IdenTokenType && equalsIgnoreCase("or", token.val)) {
            if (!expectAndOr || scopes.at(-1)?.has(EnumToken.AndTokenType)) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[token.typ]}`,
                    node: token,
                    location: options.source.getSourceLocation(token[LOC].sta),
                });
                success = false;
                break;
            }
            expectComma = false;
            Object.assign(token, { typ: EnumToken.OrTokenType });
            scopes.at(-1).add(EnumToken.OrTokenType);
            continue;
        }
        if (token.typ === EnumToken.CommaTokenType) {
            if (!expectComma) {
                errors.push({
                    action: "drop",
                    message: `unexpected token ${EnumToken[token.typ]}`,
                    node: token,
                    location: options.source.getSourceLocation(token[LOC].sta),
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
            message: `unexpected token ${EnumToken[stack.at(-1)?.typ]}`,
            node: stack.at(-1),
            // @ts-expect-error
            location: options.source.getSourceLocation(stack.at(-1)?.[LOC].sta),
        });
        success = false;
    }
    return { success, errors };
}

export { matchGenericSyntax };
