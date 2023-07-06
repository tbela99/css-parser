import {AstDeclaration, DimensionToken, NumberToken, ShorthandPropertyType, Token} from "../../../@types";
import {eq} from "../utils/eq";
import {isLength} from "../utils";

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
            if (declaration.nam != this.config.shorthand && this.declarations.has(this.config.shorthand)) {

                let isValid: boolean = true;
                let current: number = -1;
                const tokens: Token[][] = [];

                // @ts-ignore
                for (let token of this.declarations.get(this.config.shorthand).val) {

                    if (this.config.types.includes(token.typ) || (token.typ == 'Number' && token.val == '0' &&
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

                if (isValid  && tokens.length > 0) {

                    this.declarations.delete(this.config.shorthand);

                    for (const values of tokens) {

                        this.config.properties.forEach((property: string, index: number) => {

                            // if (property == declaration.nam) {
                            //
                            //     return;
                            // }

                            if (!this.declarations.has(property)) {

                                this.declarations.set(property, <AstDeclaration>{
                                    typ: 'Declaration',
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

                                val.push({typ: 'Whitespace'});
                            }

                            val.push(<Token>{...values[index]});
                        });
                    }
                }

                this.declarations.set(<string>declaration.nam, declaration);
                return this;
            }

            // declaration.chi = declaration.chi.reduce((acc: Token[], token: Token) => {
            //
            //     if (this.config.types.includes(token.typ) || ('0' == (<DimensionToken>token).chi && (
            //         this.config.types.includes('Length') ||
            //         this.config.types.includes('Angle') ||
            //     this.config.types.includes('Dimension'))) || (token.typ == 'Iden' && this.config.keywords.includes(token.chi))) {
            //
            //         acc.push(token);
            //     }
            //
            //     return acc;
            // }, <Token[]>[]);

            this.declarations.set(<string>declaration.nam, declaration);
        }

        return this;
    }

    [Symbol.iterator]() {

        let iterator: IterableIterator<AstDeclaration>;
        const declarations: Map<string, AstDeclaration> = this.declarations;

        if (declarations.size < this.config.properties.length || this.config.properties.some((property: string, index: number) => {

            return !declarations.has(property) || (index > 0 &&
                // @ts-ignore
                declarations.get(property).val.length != declarations.get(this.config.properties[Math.floor(index / 2)]).val.length);
        })) {

            iterator = declarations.values();
        } else {

            const values: Token[][] = [];
            this.config.properties.forEach((property: string) => {

                let index: number = 0;

                // @ts-ignore
                for(const token of this.declarations.get(property).val) {

                    if (token.typ == 'Whitespace') {

                        continue;
                    }

                    if (values.length == index) {

                        values.push([]);
                    }

                    values[index].push(token);
                    index++;

                }
            });

            for (const value of values) {

                let i: number = value.length;

                while (i-- > 1) {

                    const t = <DimensionToken | NumberToken>value[i];
                    const k = <DimensionToken | NumberToken>value[i == 1 ? 0 : i % 2];

                    if (t.val == k.val && t.val == '0') {

                        if ((t.typ == 'Number' && isLength(<DimensionToken>k)) ||
                            (k.typ == 'Number' && isLength(<DimensionToken>t)) ||
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

            iterator = [<AstDeclaration>{
                typ: 'Declaration',
                nam: this.config.shorthand,
                val: values.reduce((acc: Token[], curr: Token[]) => {

                    if (curr.length > 1) {

                        const k: number = curr.length * 2 - 1;
                        let i: number = 1;

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