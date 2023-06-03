import {AstDeclaration, DimensionToken, NumberToken, ShorthandPropertyType, Token} from "../../@types";
import {eq} from "../utils/eq";
import {isLengthUnit} from "../utils";

export class PropertySet {

    protected config: ShorthandPropertyType;
    protected declarations: Map<string, AstDeclaration>;

    constructor(config: ShorthandPropertyType) {

        this.config = config;
        this.declarations = new Map<string, AstDeclaration>;
    }

    add(declaration: AstDeclaration) {

        if (declaration.nam == this.config.shorthand) {

            this.declarations.clear();
            this.declarations.set(<string>declaration.nam, declaration);
        } else {

            // expand shorthand
            if (this.declarations.has(this.config.shorthand)) {

                let isValid: boolean = true;
                let current = -1;
                const tokens: Token[][] = [];

                for (let token of this.declarations.get(this.config.shorthand).val) {

                    if (this.config.types.includes(token.typ)) {

                        if (tokens.length == 0) {

                            tokens.push([]);
                            current++;
                        }

                        tokens[current].push(token);
                        continue;
                    }

                    if (token.typ != 'Whitespace' && token.typ != 'Comment') {

                        if (token.typ == 'Iden' && this.config.keywords.includes(token.val)) {

                            tokens[current].push(token);
                        }

                        if (token.typ == 'Literal' && token.val == this.config.separator) {

                            tokens.push([]);
                            current++;
                            continue;
                        }

                        isValid = false;
                        break;
                    }
                }

                if (!isValid || tokens.length == 0) {

                    this.declarations.set(<string>declaration.nam, declaration);
                } else {

                    this.declarations.delete(this.config.shorthand);

                    for (const values of tokens) {

                        this.config.properties.forEach((property: string, index: number) => {

                            if (!this.declarations.has(property)) {

                                this.declarations.set(property, <AstDeclaration>{
                                    typ: 'Declaration',
                                    nam: property,
                                    val: []
                                });
                            }

                            while (index >= values.length) {

                                index %= 2;
                            }

                            this.declarations.get(property).val.push(<Token>{...values[index]});
                        })
                    }
                }
            }

            declaration.val = declaration.val.reduce((acc, token) => {

                if (this.config.types.includes(token.typ) || (token.typ == 'Iden' && this.config.keywords.includes(token.val))) {

                    acc.push(token);
                }

                return acc;
            }, <Token[]>[]);

            this.declarations.set(<string>declaration.nam, declaration);
        }

        return this;
    }

    [Symbol.iterator]() {

        let iterator;
        const declarations = this.declarations;

        if (declarations.size < this.config.properties.length || this.config.properties.some((property: string, index: number) => {

            return index > 0 && declarations.get(property).val.length != declarations.get(this.config.properties[Math.floor(index / 2)]).val.length;
        })) {

            iterator = declarations.values();
        } else {

            const values: Token[][] = [];
            declarations.get(this.config.properties[0]).val.length;

            this.config.properties.forEach((property: string) => {

                this.declarations.get(property).val.forEach((token: Token, index: number) => {

                    if (values.length == index) {

                        values.push([]);
                    }

                    values[index].push(token);
                });
            });

            for (const value of values) {

                let i: number = value.length;

                while (--i) {

                    const t = <DimensionToken | NumberToken>value[i];
                    const k = <DimensionToken | NumberToken>value[Math.floor((i - 1) / 2)];

                    if (t.val == k.val && t.val == '0') {

                        if ((t.typ == 'Number' && isLengthUnit(<DimensionToken>k)) ||
                            (k.typ == 'Number' && isLengthUnit(<DimensionToken>t)) ||
                            (isLengthUnit(<DimensionToken>k) || isLengthUnit(<DimensionToken>t))) {

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
            iterator = [{
                typ: 'Declaration',
                nam: this.config.shorthand,
                val: values.reduce((acc, curr) => {

                    if (curr.length > 1) {

                        const k: number = curr.length * 2 - 1;
                        let i = 1;

                        while (i < k) {

                            curr.splice(i, 0, {typ: 'Whitespace'});
                            i += 2;
                        }
                    }

                    if (acc.length > 0) {

                        acc.push({typ: 'Literal', val: this.config.separator});
                    }

                    acc.push(...curr);
                    return acc;
                }, <Token[]>[])
            }][Symbol.iterator]();

            return {

                next() {

                    return iterator.next();
                }
            }
        }

        return {
            next() {

                return iterator.next();
            }
        }
    }
}