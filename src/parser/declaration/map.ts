import {AstDeclaration, ShorthandPropertyType, Token} from "../../@types";
import {eq} from "../utils/eq";


export class PropertyMap {

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
                const tokens: Token[] = [];

                for (let token of this.declarations.get(this.config.shorthand).val) {

                    if (this.config.types.includes(token.typ)) {

                        tokens.push(token);
                        continue;
                    }

                    if (token.typ != 'Whitespace' && token.typ != 'Comment') {

                        isValid = false;
                        break;
                    }
                }

                if (!isValid || tokens.length == 0) {

                    this.declarations.set(<string>declaration.nam, declaration);
                } else {

                    this.declarations.delete(this.config.shorthand);
                    this.config.properties.forEach((property: string, index: number) => {

                        while (index >= tokens.length) {

                            index = Math.floor(index / 2);
                        }

                        this.declarations.set(property, <AstDeclaration>{
                            typ: 'Declaration',
                            nam: property,
                            val: [tokens[index]].map((o: Token) => {

                                return {...o}
                            })
                        })
                    })
                }
            }

            this.declarations.set(<string>declaration.nam, declaration);
        }

        return this;
    }

    [Symbol.iterator]() {

        let iterator;
        const declarations = this.declarations;

        if (declarations.size < this.config.properties.length) {

            iterator = declarations.values();
        } else {

            const value = this.config.properties.reduce((acc, curr) => {

                acc.val.push(...this.declarations.get(curr).val)

                return acc
            }, <AstDeclaration>{

                typ: 'Declaration',
                nam: this.config.shorthand,
                val: []
            });

            let i = this.config.properties.length;

            while (--i > 0) {

                if (eq(value.val[i], value.val[Math.floor((i - 1) / 2)])) {

                    value.val.splice(i, 1);
                    continue;
                }

                break;
            }

            const k: number = value.val.length * 2;

            i = 0;

            while (i < k) {

                value.val.splice(i + 1, 0, {typ: 'Whitespace'});
                i += 2;
            }

            iterator = [value][Symbol.iterator]();

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