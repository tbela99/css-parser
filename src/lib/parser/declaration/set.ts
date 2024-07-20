import {
    AstDeclaration,
    DimensionToken,
     LiteralToken,

    NumberToken,
    ShorthandPropertyType,
    Token,
    WhitespaceToken
} from "../../../@types/index.d.ts";
import {eq} from "../utils/eq";
import {isLength} from "../utils";
import {EnumToken} from "../../ast";

function dedup(values: Token[][]) {

    for (const value of values) {

        let i: number = value.length;

        while (i-- > 1) {

            const t = <DimensionToken | NumberToken>value[i];
            const k = <DimensionToken | NumberToken>value[i == 1 ? 0 : i % 2];

            if (t.val == k.val && t.val == '0') {

                if ((t.typ == EnumToken.NumberTokenType && isLength(<DimensionToken>k)) ||
                    (k.typ == EnumToken.NumberTokenType && isLength(<DimensionToken>t)) ||
                    (isLength(<DimensionToken>k) || isLength(<DimensionToken>t))) {

                    value.splice(i, 1);
                    continue;
                }
            }

            if (eq(t, k)) {

                value.splice(i, 1);
                continue;
            }

            break;
        }
    }

    return  values;
}

export class PropertySet {

    protected config: ShorthandPropertyType;
    protected declarations: Map<string, AstDeclaration>;

    constructor(config: ShorthandPropertyType) {

        this.config = config;
        this.declarations = new Map<string, AstDeclaration>;
    }

    add(declaration: AstDeclaration) {

        if (declaration.nam == this.config.shorthand) {

            this.declarations = new Map<string, AstDeclaration>;
        } else {

            // expand shorthand
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {

                let isValid: boolean = true;
                let current: number = -1;
                const tokens: Token[][] = [];

                // @ts-ignore
                for (let token of this.declarations.get(this.config.shorthand).val) {

                    // @ts-ignore
                    if (this.config.types.some(t => token.typ == EnumToken[t]) || (token.typ == EnumToken.NumberTokenType && token.val == '0' &&
                        (this.config.types.includes('Length') ||
                            this.config.types.includes('Angle') ||
                            this.config.types.includes('Dimension')
                        ))) {

                        if (tokens.length == 0) {

                            tokens.push([]);
                            current++;
                        }

                        tokens[current].push(token);
                        continue;
                    }

                    if (token.typ != EnumToken.WhitespaceTokenType && token.typ != EnumToken.CommentTokenType) {

                        if (token.typ == EnumToken.IdenTokenType&& this.config.keywords.includes(token.val)) {

                            if (tokens.length == 0) {

                                tokens.push([]);
                                current++;
                            }

                            tokens[current].push(token);
                        }

                        // @ts-ignore
                        if (token.typ == EnumToken.LiteralTokenType && token.val == this.config.separator) {

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

                                this.declarations.set(property, <AstDeclaration>{
                                    typ: EnumToken.DeclarationNodeType,
                                    nam: property,
                                    val: []
                                });
                            }

                            while (index > 0 && index >= values.length) {

                                if (index > 1) {

                                    index %= 2;
                                } else {

                                    index = 0;
                                    break;
                                }
                            }

                            // @ts-ignore
                            const val = this.declarations.get(property).val;

                            if (val.length > 0) {

                                val.push(<WhitespaceToken>{typ: EnumToken.WhitespaceTokenType});
                            }

                            val.push(<Token>{...values[index]});
                        });
                    }
                }

                this.declarations.set(<string>declaration.nam, declaration);
                return this;
            }
        }

        this.declarations.set(<string>declaration.nam, declaration);
        return this;
    }

    isShortHand() {

        if (this.declarations.has(this.config.shorthand)) {

            return this.declarations.size == 1;
        }

        return this.config.properties.length == this.declarations.size;
    }

    [Symbol.iterator]() {

        let iterator: IterableIterator<AstDeclaration>;
        const declarations: Map<string, AstDeclaration> = this.declarations;

        if (declarations.size < this.config.properties.length) {

            const values  = [...declarations.values()];

            if (this.isShortHand()) {

                const val: Token[] = values[0].val.reduce((acc, curr) => {

                    if (![EnumToken.WhitespaceTokenType, EnumToken.CommentTokenType].includes(curr.typ)) {

                        acc.push(curr);
                    }

                    return acc;
                }, <Token[]> []);

                values[0].val = val.reduce((acc: Token[],  curr: Token) => {

                    if (acc.length > 0) {

                        acc.push(<Token>{typ: EnumToken.WhitespaceTokenType});
                    }

                    acc.push(curr);
                    return acc;

                }, <Token[]> []);
            }


            return values[Symbol.iterator]();

        }
        else {

            const values: Token[][] = [];
            this.config.properties.forEach((property: string) => {

                let index: number = 0;

                // @ts-ignore
                for (const token of this.declarations.get(property).val) {

                    if (token.typ == EnumToken.WhitespaceTokenType) {

                        continue;
                    }

                    if (values.length == index) {

                        values.push([]);
                    }

                    values[index].push(token);
                    index++;

                }
            });

            dedup(values);

            iterator = [<AstDeclaration>{
                typ: EnumToken.DeclarationNodeType,
                nam: this.config.shorthand,
                val: values.reduce((acc: Token[], curr: Token[]) => {

                    if (curr.length > 1) {

                        const k: number = curr.length * 2 - 1;
                        let i: number = 1;

                        while (i < k) {

                            curr.splice(i, 0, <WhitespaceToken>{typ: EnumToken.WhitespaceTokenType});
                            i += 2;
                        }
                    }

                    if (acc.length > 0) {

                        // @ts-ignore
                        acc.push(<LiteralToken>{typ: EnumToken.LiteralTokenType, val: this.config.separator});
                    }

                    acc.push(...curr);
                    return acc;
                }, <Token[]>[])
            }][Symbol.iterator]();

            // return {
            //     next() {
            //
            //         return iterator.next();
            //     }
            // }
        }

        return iterator;

        // return {
        //     next() {
        //
        //         return iterator.next();
        //     }
        // }
    }
}