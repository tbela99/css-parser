/* 
	CSS parser, minifier and validator for node and the browser

	Author(s): Thierry Bela
	Version: 2.1.0
	License: MIT
 */
import { numericTokenTypes } from '../../ast/arena.js';
import { eqToken } from '../utils/eq.js';
import { EnumToken, EnumAstNodeStatus } from '../../ast/types.js';
import { isLength } from '../../syntax/syntax.js';

function dedup(arena, values) {
    for (const value of values) {
        let i = value.length;
        while (i-- > 1) {
            const t = value[i];
            const k = value[i == 1 ? 0 : i % 2];
            if (
            // inlined: arena.isNumeric(t)
            numericTokenTypes.has(arena.dataTypes[t]) &&
                // inlined: arena.isNumeric(k)
                numericTokenTypes.has(arena.dataTypes[k]) &&
                arena.numericValue[t] == 0 &&
                arena.numericValue[k] == 0 &&
                !arena.hasFraction(t) &&
                !arena.hasFraction(k)) {
                if ((arena.dataTypes[t] == EnumToken.NumberTokenType && isLength(arena, k)) ||
                    (arena.dataTypes[k] == EnumToken.NumberTokenType && isLength(arena, t)) ||
                    isLength(arena, k) ||
                    isLength(arena, t)) {
                    value.splice(i, 1);
                    continue;
                }
            }
            if (eqToken(arena, t, k)) {
                value.splice(i, 1);
                continue;
            }
            break;
        }
    }
    return values;
}
/**
 * set of declarations that can be merged into a single shorthand declaration.
 * declarations are arena node ids
 */
class PropertySet {
    config;
    arena;
    declarations;
    constructor(arena, config) {
        this.arena = arena;
        this.config = config;
        this.declarations = new Map();
    }
    add(declaration) {
        const arena = this.arena;
        const nam = arena.strings[arena.name[declaration]];
        if (nam == this.config.shorthand) {
            this.declarations = new Map();
        }
        else {
            // expand shorthand
            if (this.declarations.has(this.config.shorthand)) {
                let isValid = true;
                let current = -1;
                const tokens = [];
                for (const token of arena.tokens(this.declarations.get(this.config.shorthand))) {
                    const typ = arena.dataTypes[token];
                    if (
                    // @ts-expect-error
                    this.config.types.some((t) => typ == EnumToken[t]) ||
                        (typ == EnumToken.NumberTokenType &&
                            arena.numericValue[token] == 0 &&
                            (this.config.types.includes("Length") ||
                                this.config.types.includes("Angle") ||
                                this.config.types.includes("Dimension")))) {
                        if (tokens.length == 0) {
                            tokens.push([]);
                            current++;
                        }
                        tokens[current].push(token);
                        continue;
                    }
                    if (typ != EnumToken.WhitespaceTokenType && typ != EnumToken.CommentTokenType) {
                        if (typ == EnumToken.IdenTokenType &&
                            this.config.keywords.includes(arena.strings[arena.stringValue[token]])) {
                            if (tokens.length == 0) {
                                tokens.push([]);
                                current++;
                            }
                            tokens[current].push(token);
                        }
                        if (typ == EnumToken.LiteralTokenType &&
                            arena.strings[arena.stringValue[token]] == this.config.separator?.val) {
                            tokens.push([]);
                            current++;
                            continue;
                        }
                        isValid = false;
                        break;
                    }
                }
                if (isValid && tokens.length > 0) {
                    this.declarations.delete(this.config.shorthand);
                    for (const values of tokens) {
                        this.config.properties.forEach((property, index) => {
                            if (!this.declarations.has(property)) {
                                this.declarations.set(property, arena.createDeclaration(EnumToken.DeclarationNodeType, property, [], null, null));
                            }
                            while (index > 0 && index >= values.length) {
                                if (index > 1) {
                                    index %= 2;
                                }
                                else {
                                    index = 0;
                                    break;
                                }
                            }
                            const node = this.declarations.get(property);
                            if (arena.firstToken[node] != 0) {
                                arena.appendToken(node, arena.createToken(EnumToken.WhitespaceTokenType));
                            }
                            arena.appendToken(node, arena.clone(values[index], true));
                        });
                    }
                }
                this.declarations.set(nam, declaration);
                return this;
            }
        }
        this.declarations.set(nam, declaration);
        return this;
    }
    isShortHand() {
        if (this.declarations.has(this.config.shorthand)) {
            return this.declarations.size == 1;
        }
        return this.config.properties.length == this.declarations.size;
    }
    [Symbol.iterator]() {
        let iterator;
        const arena = this.arena;
        const declarations = this.declarations;
        // the !important declarations are not merged: `column-gap: 16px !important; row-gap: 40px !important`
        if (!declarations.has(this.config.shorthand) &&
            [...declarations.values()].some((declaration) => arena.flags[declaration] & EnumAstNodeStatus.ImportantDeclaration)) {
            return [...declarations.values()][Symbol.iterator]();
        }
        if (declarations.size < this.config.properties.length) {
            const values = [...declarations.values()];
            if (this.isShortHand()) {
                const val = arena.tokens(values[0]).reduce((acc, curr) => {
                    if (arena.dataTypes[curr] != EnumToken.WhitespaceTokenType &&
                        arena.dataTypes[curr] != EnumToken.CommentTokenType) {
                        acc.push(curr);
                    }
                    return acc;
                }, []);
                // inlined: arena.setTokens(values[0], ...val.reduce((acc: Token[], curr: Token) => { if (acc.length > 0) { acc.push(arena.createToken(EnumToken.WhitespaceTokenType)); } acc.push(curr); return acc; }, <Token[]>[]))
                arena.setTokenList(values[0], val.reduce((acc, curr) => {
                    if (acc.length > 0) {
                        acc.push(arena.createToken(EnumToken.WhitespaceTokenType));
                    }
                    acc.push(curr);
                    return acc;
                }, []));
            }
            return values[Symbol.iterator]();
        }
        else {
            const values = [];
            this.config.properties.forEach((property) => {
                let index = 0;
                const id = this.declarations.get(property);
                for (const token of id == null ? [] : arena.tokens(id)) {
                    if (arena.dataTypes[token] == EnumToken.WhitespaceTokenType) {
                        continue;
                    }
                    if (values.length == index) {
                        values.push([]);
                    }
                    values[index].push(token);
                    index++;
                }
            });
            if (this.config.valueSeparator == null) {
                dedup(arena, values);
            }
            iterator = [
                arena.createDeclaration(EnumToken.DeclarationNodeType, this.config.shorthand, values.reduce((acc, curr) => {
                    if (curr.length > 1) {
                        const k = curr.length * 2 - 1;
                        let i = 1;
                        while (i < k) {
                            curr.splice(i, 0, arena.createToken(EnumToken.WhitespaceTokenType));
                            i += 2;
                        }
                    }
                    if (acc.length > 0) {
                        acc.push(arena.createToken(EnumToken.LiteralTokenType, this.config.separator.val));
                    }
                    for (const token of curr) {
                        // tokens are shared with the original declarations
                        acc.push(arena.parents[token] != 0 ? arena.clone(token, true) : token);
                    }
                    return acc;
                }, []), null, null),
            ][Symbol.iterator]();
        }
        return iterator;
    }
}

export { PropertySet };
