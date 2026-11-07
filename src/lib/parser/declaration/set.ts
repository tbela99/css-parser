import type { AstDeclaration, ShorthandPropertyType, Token } from "../../../@types/index.d.ts";
import { eqToken } from "../utils/eq.ts";
import { EnumToken } from "../../ast/types.ts";
import { isLength } from "../../syntax/syntax.ts";
import type { AstArena } from "../../ast/arena.ts";

function dedup(arena: AstArena, values: Token[][]): Token[][] {
    for (const value of values) {
        let i: number = value.length;

        while (i-- > 1) {
            const t: Token = value[i];
            const k: Token = value[i == 1 ? 0 : i % 2];

            if (
                arena.isNumeric(t) &&
                arena.isNumeric(k) &&
                arena.numericValue[t] == 0 &&
                arena.numericValue[k] == 0 &&
                !arena.hasFraction(t) &&
                !arena.hasFraction(k)
            ) {
                if (
                    (arena.dataTypes[t] == EnumToken.NumberTokenType && isLength(arena, k)) ||
                    (arena.dataTypes[k] == EnumToken.NumberTokenType && isLength(arena, t)) ||
                    isLength(arena, k) ||
                    isLength(arena, t)
                ) {
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
export class PropertySet {
    protected config: ShorthandPropertyType;
    protected arena: AstArena;
    public declarations: Map<string, AstDeclaration>;

    constructor(arena: AstArena, config: ShorthandPropertyType) {
        this.arena = arena;
        this.config = config;
        this.declarations = new Map<string, AstDeclaration>();
    }

    add(declaration: AstDeclaration): this {
        const arena: AstArena = this.arena;
        const nam: string = arena.strings[arena.name[declaration]];

        if (nam == this.config.shorthand) {
            this.declarations = new Map<string, AstDeclaration>();
        } else {
            // expand shorthand
            if (this.declarations.has(this.config.shorthand)) {
                let isValid: boolean = true;
                let current: number = -1;
                const tokens: Token[][] = [];

                for (const token of arena.tokens(this.declarations.get(this.config.shorthand)!)) {
                    const typ: EnumToken = arena.dataTypes[token];

                    if (
                        // @ts-expect-error
                        this.config.types.some((t) => typ == EnumToken[t]) ||
                        (typ == EnumToken.NumberTokenType &&
                            arena.numericValue[token] == 0 &&
                            (this.config.types.includes("Length") ||
                                this.config.types.includes("Angle") ||
                                this.config.types.includes("Dimension")))
                    ) {
                        if (tokens.length == 0) {
                            tokens.push([]);
                            current++;
                        }

                        tokens[current].push(token);
                        continue;
                    }

                    if (typ != EnumToken.WhitespaceTokenType && typ != EnumToken.CommentTokenType) {
                        if (
                            typ == EnumToken.IdenTokenType &&
                            this.config.keywords.includes(arena.strings[arena.stringValue[token]])
                        ) {
                            if (tokens.length == 0) {
                                tokens.push([]);
                                current++;
                            }

                            tokens[current].push(token);
                        }

                        if (
                            typ == EnumToken.LiteralTokenType &&
                            arena.strings[arena.stringValue[token]] == this.config.separator?.val
                        ) {
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
                        this.config.properties.forEach((property: string, index: number) => {
                            if (!this.declarations.has(property)) {
                                this.declarations.set(
                                    property,
                                    arena.createDeclaration(EnumToken.DeclarationNodeType, property, [], null, null),
                                );
                            }

                            while (index > 0 && index >= values.length) {
                                if (index > 1) {
                                    index %= 2;
                                } else {
                                    index = 0;
                                    break;
                                }
                            }

                            const node: AstDeclaration = this.declarations.get(property)!;

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

    isShortHand(): boolean {
        if (this.declarations.has(this.config.shorthand)) {
            return this.declarations.size == 1;
        }

        return this.config.properties.length == this.declarations.size;
    }

    [Symbol.iterator](): IterableIterator<AstDeclaration> {
        let iterator: IterableIterator<AstDeclaration>;
        const arena: AstArena = this.arena;
        const declarations: Map<string, AstDeclaration> = this.declarations;

        if (declarations.size < this.config.properties.length) {
            const values = [...declarations.values()];

            if (this.isShortHand()) {
                const val: Token[] = arena.tokens(values[0]).reduce((acc: Token[], curr: Token) => {
                    if (
                        arena.dataTypes[curr] != EnumToken.WhitespaceTokenType &&
                        arena.dataTypes[curr] != EnumToken.CommentTokenType
                    ) {
                        acc.push(curr);
                    }

                    return acc;
                }, <Token[]>[]);

                arena.setTokens(
                    values[0],
                    ...val.reduce((acc: Token[], curr: Token) => {
                        if (acc.length > 0) {
                            acc.push(arena.createToken(EnumToken.WhitespaceTokenType));
                        }

                        acc.push(curr);
                        return acc;
                    }, <Token[]>[]),
                );
            }

            return values[Symbol.iterator]();
        } else {
            const values: Token[][] = [];
            this.config.properties.forEach((property: string) => {
                let index: number = 0;

                const id: AstDeclaration | undefined = this.declarations.get(property);

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
                arena.createDeclaration(
                    EnumToken.DeclarationNodeType,
                    this.config.shorthand,
                    values.reduce((acc: Token[], curr: Token[]) => {
                        if (curr.length > 1) {
                            const k: number = curr.length * 2 - 1;
                            let i: number = 1;

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
                    }, <Token[]>[]),
                    null,
                    null,
                ),
            ][Symbol.iterator]();
        }

        return iterator;
    }
}
